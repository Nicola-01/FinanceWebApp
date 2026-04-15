#!/bin/bash
set -e

# --- CONFIGURATION VARIABLES ---
DB_USER="admin"
DB_PASS=""
DB_NAME="financedb"
DB_HOST="localhost" # Cambia se il db si trova su un altro server
DB_PORT="5432"      # Porta standard di Postgres

CONTAINER_NAME="finance_db_prod"

ENCRYPTION_PASS=""

R2_ENDPOINT=""
R2_BUCKET=""

----

DATE=$(date +"%Y-%m-%d_%H-%M")
BACKUP_DIR="/tmp"
SQL_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
ENC_FILE="$SQL_FILE.gz.enc"

# --- FUNCTIONS ---

# 1. Backup Function
do_backup() {
    DATE=$(date +"%Y-%m-%d_%H-%M")
    SQL_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
    ENC_FILE="$SQL_FILE.gz.enc"

    echo "Starting backup: $DATE"
    # AGGIUNTO: --clean --if-exists per droppare le tabelle vecchie durante il restore
    docker exec -e PGPASSWORD="$DB_PASS" -i "$CONTAINER_NAME" pg_dump --clean --if-exists -U "$DB_USER" "$DB_NAME" > "$SQL_FILE"
    
    echo "Compressing and encrypting..."
    gzip -c "$SQL_FILE" | openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:"$ENCRYPTION_PASS" -out "$ENC_FILE"
    
    echo "Uploading to Cloudflare R2..."
    aws s3 cp "$ENC_FILE" "s3://$R2_BUCKET/" --endpoint-url "$R2_ENDPOINT" --region auto --no-verify-ssl
    
    rm "$SQL_FILE" "$ENC_FILE"
    echo "Backup completed and uploaded successfully."
}

# 2. Function to find the latest backup on R2
get_latest_backup_name() {
    LATEST_FILE=$(aws s3 ls "s3://$R2_BUCKET/" --endpoint-url "$R2_ENDPOINT" --region auto --no-verify-ssl | sort | tail -n 1 | awk '{print $4}')
    
    if [ -z "$LATEST_FILE" ]; then
        echo "Error: No backup found in the R2 bucket."
        exit 1
    fi
    echo "Latest backup found on R2: $LATEST_FILE"
}

# 3. Download and Decrypt Function
do_download() {
    get_latest_backup_name
    
    DOWNLOAD_PATH="$BACKUP_DIR/$LATEST_FILE"
    # CORRETTO: Rimuove .gz.enc lasciando solo l'originale .sql
    DECRYPTED_FILE="${DOWNLOAD_PATH%.gz.enc}" 

    echo "Downloading..."
    aws s3 cp "s3://$R2_BUCKET/$LATEST_FILE" "$DOWNLOAD_PATH" --endpoint-url "$R2_ENDPOINT" --region auto --no-verify-ssl
    
    echo "Decrypting and decompressing..."
    openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:"$ENCRYPTION_PASS" -in "$DOWNLOAD_PATH" | gzip -d > "$DECRYPTED_FILE"
    
    rm "$DOWNLOAD_PATH"
    echo "File ready and decrypted at: $DECRYPTED_FILE"
    
    export LAST_DECRYPTED_FILE="$DECRYPTED_FILE"
}

# 4. Restore Function
do_restore() {
    echo "--- STARTING RESTORE PROCEDURE ---"
    do_download 
    
    echo "WARNING: You are about to import the file $LAST_DECRYPTED_FILE into the '$DB_NAME' database."
    echo "This will OVERWRITE current data."
    read -p "Do you want to proceed? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        rm "$LAST_DECRYPTED_FILE"
        exit 1
    fi

    echo "Restoring in container $CONTAINER_NAME..."
    # Aggiunto --quiet per evitare di stampare "SET" mille volte sullo schermo
    docker exec -e PGPASSWORD="$DB_PASS" -i "$CONTAINER_NAME" psql --quiet -U "$DB_USER" -d "$DB_NAME" < "$LAST_DECRYPTED_FILE"
    
    rm "$LAST_DECRYPTED_FILE"
    echo "Restore completed successfully."
}

# 5. Interactive Menu Function
interactive_menu() {
    echo "======================================"
    echo "       Database Backup Manager        "
    echo "======================================"
    echo "Please select an operation:"
    echo "1) Manual Backup"
    echo "2) Download and Decrypt Latest Backup"
    echo "3) Restore Latest Backup (Download, Decrypt, Import)"
    echo "4) Exit"
    echo "--------------------------------------"
    read -p "Enter your choice [1-4]: " choice
    echo

    case $choice in
        1) do_backup ;;
        2) do_download ;;
        3) do_restore ;;
        4) echo "Exiting."; exit 0 ;;
        *) echo "Invalid choice. Exiting."; exit 1 ;;
    esac
}

# --- CLI COMMAND HANDLER ---
case "$1" in
    --auto)
        do_backup
        ;;
    --manual)
        do_backup
        ;;
    --download)
        do_download
        ;;
    --restore)
        do_restore
        ;;
    "")
        interactive_menu
        ;;
    *)
        echo "Usage: $0 {--auto | --manual | --download | --restore}"
        echo "Run without arguments to open the interactive menu."
        exit 1
        ;;
esac

# Usa l'ultima versione LTS
FROM node:22-alpine

WORKDIR /app

# Copia i file di dipendenze
COPY package.json package-lock.json ./

# Installa
RUN npm install

# Copia tutto il codice (inclusi i file .ts e .tsx)
COPY . .

# Espone la porta
EXPOSE 5173

# Avvia il server di sviluppo (Vite compila TS in memoria)
CMD ["npm", "run", "dev", "--", "--host"]
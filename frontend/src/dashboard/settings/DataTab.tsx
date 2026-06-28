import React from 'react';
import { useWalletContext } from '../wallet/WalletContext.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import { triggerToast } from '../../components/ui/ToastNotification.tsx';
import { SettingsCard } from '../../components/settings/SettingsCard.tsx';

export const DataTab: React.FC = () => {
    const { wallet, tags, transactions } = useWalletContext();

    const handleExportTransactions = () => {
        if (!transactions || transactions.length === 0) {
            triggerToast("No transactions to export", false);
            return;
        }

        const headers = ["Date", "Name", "Tag", "Amount", "Type", "Notes", "OriginalAmount", "OriginalCurrency", "ExchangeValue"];
        const rows = transactions.map(tx => [
            tx.transactionDate,
            tx.name,
            tx.tag.name,
            tx.amount,
            tx.type,
            tx.notes || "",
            tx.originalAmount || "",
            tx.originalCurrency || "",
            tx.exchangeValue || ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${wallet.name}_transactions.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerToast("Transactions exported successfully", true);
    };

    const handleExportTags = () => {
        if (!tags || tags.length === 0) {
            triggerToast("No tags to export", false);
            return;
        }

        const headers = ["Name", "Icon", "ColorHex", "ParentName"];
        const rows = tags.map(tag => [
            tag.name,
            tag.icon,
            tag.colorHex,
            tag.parentName || ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${wallet.name}_tags.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerToast("Tags exported successfully", true);
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Placeholder for future backend implementation
        triggerToast(`File ${file.name} ready for upload (Backend update needed)`, true);
        e.target.value = '';
    };

    return (
        <SettingsCard
            title="Data Management"
            subtitle="Export your data to CSV or Import from file"
            icon={faFileCsv}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* EXPORT */}
                <div className="flex flex-col gap-3 p-4 bg-app-input rounded-xl border border-app-border">
                    <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon icon={faDownload} className="text-app-green opacity-80" />
                        <span className="text-sm font-bold text-app-text uppercase tracking-wider">Export Data</span>
                    </div>
                    <p className="text-xs text-app-muted mb-2">Download your data in CSV format for backups or external analysis.</p>
                    
                    <div className="flex flex-col gap-2 mt-auto">
                        <button
                            onClick={handleExportTransactions}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-app-surface hover:bg-app-hover border border-app-border rounded-lg text-sm font-bold text-app-text transition-all active:scale-95"
                        >
                            <FontAwesomeIcon icon={faDownload} />
                            Download Transactions.csv
                        </button>
                        <button
                            onClick={handleExportTags}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-app-surface/40 hover:bg-app-hover border border-app-border border-dashed rounded-lg text-[10px] font-bold text-app-muted transition-all active:scale-95"
                        >
                            <FontAwesomeIcon icon={faDownload} />
                            Download Tags.csv
                        </button>
                    </div>
                </div>

                {/* IMPORT */}
                <div className="flex flex-col gap-3 p-4 bg-app-input rounded-xl border border-app-border">
                    <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon icon={faUpload} className="text-app-sky opacity-80" />
                        <span className="text-sm font-bold text-app-text uppercase tracking-wider">Import Data</span>
                    </div>
                    <p className="text-xs text-app-muted mb-2">Upload a CSV file to import new tags or bulk update existing ones.</p>
                    
                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-app-surface hover:bg-app-hover border border-app-border rounded-lg text-sm font-bold text-app-text transition-all cursor-pointer active:scale-95">
                        <FontAwesomeIcon icon={faUpload} />
                        Upload CSV
                        <input 
                            type="file" 
                            accept=".csv" 
                            onChange={handleImportCSV} 
                            className="hidden" 
                        />
                    </label>
                </div>
            </div>
        </SettingsCard>
    );
};

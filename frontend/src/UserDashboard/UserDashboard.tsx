import {AccountSettings} from "../components/AccountSettings.tsx";
import {WalletArea} from "./WalletArea.tsx";

export default function Dashboard() {
    return (
        // Contenitore Esterno:
        // Mobile: Colonna (Sidebar sopra, contenuto sotto)
        // Desktop (md): Riga (Sidebar a sinistra, contenuto a destra)
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-white">
            <AccountSettings/>
            {/* --- SIDEBAR / TOPBAR --- */}
            {/* Mobile: w-full (striscia in alto) */}
            {/* Desktop: w-72 (colonna fissa a sinistra), h-screen (altezza piena) */}
            <WalletArea/>

            {/* --- CONTENUTO PRINCIPALE --- */}
            <div className="flex-1 p-8 bg-gray-900">
                <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
                <div className="p-10 border border-dashed border-gray-600 rounded-xl">
                    <p className="text-gray-400">Qui c'è il resto della tua app...</p>
                </div>
            </div>

        </div>
    );
}
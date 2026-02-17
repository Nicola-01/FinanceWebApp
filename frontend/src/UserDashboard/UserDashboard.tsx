import Wallet from "./Wallet.tsx";
import {faArrowLeft, faCat, faDog, faSquare} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
    return (
        // Contenitore Esterno:
        // Mobile: Colonna (Sidebar sopra, contenuto sotto)
        // Desktop (md): Riga (Sidebar a sinistra, contenuto a destra)
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-white">

            {/* --- SIDEBAR / TOPBAR --- */}
            {/* Mobile: w-full (striscia in alto) */}
            {/* Desktop: w-72 (colonna fissa a sinistra), h-screen (altezza piena) */}
            <div className="w-full md:w-72 bg-gray-800 p-4 shrink-0 md:h-screen md:sticky md:top-0 overflow-y-auto border-r border-white/10">

                <h2 className="mb-4 text-xl font-bold text-white hidden md:block">My Wallets</h2>

                {/* GRIGLIA */}
                {/* Mobile: grid-cols-4 (4 in fila orizzontale) */}
                {/* Desktop: grid-cols-1 (1 colonna verticale) */}
                <div className="grid grid-cols-4 gap-3 md:grid-cols-1">
                    <Wallet title="Main Wallet" icon={faCat} color="#ff4d4d" />
                    <Wallet title="Savings" icon={faDog} color="#3399ff" />
                    <Wallet title="Crypto" icon={faArrowLeft} color="#00ff7f" />
                    <Wallet title="Vault" icon={faSquare} color="#bd00ff" />
                </div>
            </div>

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
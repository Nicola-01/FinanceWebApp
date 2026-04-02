import React, { createContext, useContext, useEffect, useState } from 'react';

interface PWAContextType {
    installPrompt: any;
    installApp: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
    installPrompt: null,
    installApp: async () => {},
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        // Controlliamo se per caso è scattato prima che React montasse il componente
        if ((window as any)._pwaInstallPrompt) {
            setInstallPrompt((window as any)._pwaInstallPrompt);
        }

        const handler = (e: any) => {
            console.log("PWA beforeinstallprompt event captured");
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallPrompt(e);
            (window as any)._pwaInstallPrompt = e;
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const installApp = async () => {
        if (!installPrompt) return;
        
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
    };

    return (
        <PWAContext.Provider value={{ installPrompt, installApp }}>
            {children}
        </PWAContext.Provider>
    );
};

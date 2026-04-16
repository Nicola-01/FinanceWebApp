import React from 'react';
// @ts-expect-error virtual module from vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWAPrompt: React.FC = () => {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl: string, _r: ServiceWorkerRegistration) {
            console.log('SW Registered:', swUrl);
        },
        onRegisterError(error: any) {
            console.error('SW Registration Error:', error);
        },
    });

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] bg-app-card border border-app-border rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 w-11/12 max-w-sm flex flex-col sm:flex-row items-center gap-4 animate-[slideUp_0.3s_ease-out]">
            <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-app-text">App Update</p>
                <p className="text-xs text-app-muted mt-1">A new version is ready. Refresh to apply.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <button
                    onClick={() => updateServiceWorker(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#00ff7f] text-black text-sm font-bold rounded-lg hover:bg-[#00cc66] transition-colors"
                >
                    Reload
                </button>
                <button
                    onClick={() => setNeedRefresh(false)}
                    className="flex-1 sm:flex-none px-4 py-2 border border-app-border text-app-text text-sm rounded-lg hover:bg-app-input transition-colors"
                >
                    Later
                </button>
            </div>
        </div>
    );
};

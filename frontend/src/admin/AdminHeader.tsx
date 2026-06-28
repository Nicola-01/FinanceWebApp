import React from 'react';

export const AdminHeader: React.FC = () => {
    return (
        <header className="relative z-10 flex items-center justify-between border-b border-app-border bg-white/[0.03] px-10 py-5 backdrop-blur-md">
            <h2 className="m-0 text-2xl font-bold">
                Admin
                <span className="ml-1 animate-gradient-x bg-gradient-to-r theme-gradient-primary-from theme-gradient-brand-via theme-gradient-brand-to bg-clip-text theme-text-transparent">
                    Panel
                </span>
            </h2>
        </header>
    );
};
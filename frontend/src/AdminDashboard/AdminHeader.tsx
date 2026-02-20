import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

export const AdminHeader: React.FC = () => {
    return (
        <header className="relative z-10 flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-10 py-5 backdrop-blur-md">
            <h2 className="m-0 text-2xl font-bold">
                Admin
                <span className="ml-1 animate-gradient-x bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Panel
                </span>
            </h2>
            <button
                className="rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white transition-all duration-300 hover:border-[#ff4d4d] hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d]"
                onClick={() => window.location.href = '/login'}
                title="Logout"
            >
                <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
        </header>
    );
};
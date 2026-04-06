import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="border-t border-white/5 py-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} FinanceWebApp. All rights reserved.</p>
        </footer>
    );
};

export default Footer;

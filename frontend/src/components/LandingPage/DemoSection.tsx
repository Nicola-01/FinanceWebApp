import React from 'react';

interface DemoSectionProps {
    demoEnabled: boolean;
    isLoggedIn: boolean;
}

const DemoSection: React.FC<DemoSectionProps> = ({ demoEnabled, isLoggedIn }) => {
    if (!demoEnabled || isLoggedIn) return null;

    return (
        <section id="demo-section" className="py-12 relative z-10 px-4">
            <div className="max-w-5xl mx-auto p-[1px] bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl">
                <div className="bg-app-bg/90 backdrop-blur-2xl p-10 md:p-14 rounded-[calc(1.5rem-1px)] text-center shadow-2xl">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">What Does It Do?</h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        This app is a full-stack personal finance manager Built from scratch. It lets you create unlimited wallets with different currencies. <br />
                        Log every transaction with hierarchical tags, manage recurring subscriptions, and invite collaborators to shared wallets. <br className="mb-2"/>
                        Try the demo to explore a pre-populated wallet instantly.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default DemoSection;

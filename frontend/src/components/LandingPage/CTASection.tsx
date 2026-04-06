import React from 'react';
import { ChevronRight } from 'lucide-react';

interface CTASectionProps {
    isLoggedIn: boolean;
    demoEnabled: boolean;
    onMainCta: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ isLoggedIn, demoEnabled, onMainCta }) => {
    return (
        <section className="py-24 px-4 pb-32">
            <div className="max-w-4xl mx-auto relative flex flex-col items-center justify-center p-12 md:p-24 overflow-hidden rounded-3xl bg-gradient-to-t from-cyan-900/30 to-[#0d0d12] border border-cyan-500/20 text-center shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-cyan-900/10 mix-blend-overlay"></div>
                <div className="absolute bottom-[-10px] w-[80%] h-4 bg-[#00ff7f] filter blur-3xl opacity-40"></div>
                
                <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">Want to Try It Out?</h2>
                <p className="text-xl text-gray-300 mb-10 max-w-xl relative z-10">
                    Jump in and explore the full app. Create your wallets, log transactions, and see the analytics in action.
                </p>
                <button 
                    onClick={onMainCta}
                    className="relative z-10 bg-[#00ff7f] text-[#0d0d12] font-bold py-4 px-10 rounded-full shadow-[0_0_24px_rgba(0,255,127,0.4)] hover:shadow-[0_0_32px_rgba(0,255,127,0.6)] hover:-translate-y-1 transition-all duration-300 text-lg flex items-center gap-2"
                >
                    {isLoggedIn ? 'Go to Dashboard' : (demoEnabled ? 'Launch the Demo' : 'Create an Account')}
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </section>
    );
};

export default CTASection;

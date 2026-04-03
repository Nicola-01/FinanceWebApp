import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Tags, Calendar, Users, ChevronRight, BarChart3, Activity } from 'lucide-react';
import { getUserAuth } from '../utils/authHelper';
import api from '../api/axiosConfig';
import { triggerToast } from './ToastNotification';

const demoEnabled = import.meta.env.VITE_DEMO_ENABLED === 'true';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [demoLoading, setDemoLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const user = getUserAuth();
        if (user) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleTryDemo = async () => {
        setDemoLoading(true);
        try {
            const response = await api.post('/auth/demo');
            const {token} = response.data;
            localStorage.setItem('mustChangePWD', JSON.stringify(false));
            sessionStorage.setItem('jwtToken', token);
            navigate('/dashboard');
            window.location.reload(); // Quick refresh to apply auth state
        } catch (err: any) {
            const title = err.response?.data?.title || "Could not create demo account.";
            triggerToast(title, false);
            console.error(err);
        } finally {
            setDemoLoading(false);
        }
    };

    const handleMainCta = () => {
        if (isLoggedIn) {
            navigate('/dashboard');
        } else if (demoEnabled) {
            handleTryDemo();
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="bg-[#0d0d12] min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#00ff7f]/30">
            {/* Global Animated Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full mix-blend-screen filter blur-[128px] opacity-70 animate-pulse pointer-events-none" />
            <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[128px] opacity-70 animate-pulse pointer-events-none" />

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-[#0d0d12]/70 border-b border-white/5 py-4 px-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity className="text-cyan-400 w-6 h-6" />
                    <span className="text-xl font-bold tracking-tight">FinanceWebApp</span>
                </div>
                <div className="flex gap-4">
                    {isLoggedIn ? (
                        <button onClick={() => navigate('/dashboard')} className="text-sm font-medium hover:text-cyan-400 transition-colors">
                            Dashboard
                        </button>
                    ) : (
                        <>
                            {/* <button onClick={() => navigate('/login')} className="text-sm font-medium hover:text-cyan-400 transition-colors border border-transparent">
                                Login
                            </button> */}
                            <button onClick={() => navigate('/login')} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-all border border-white/10 hover:border-white/20">
                                Demo
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* 1. Hero Section */}
            <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-sm font-medium mb-8 backdrop-blur-sm">
                    <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    🚀 Next-Gen Personal Finance Engine
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl">
                    Own Your Wealth. <br className="hidden md:block"/> 
                    Control Your Money with {' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500">Absolute Precision.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
                    Forget boring expense trackers. Welcome to the premium, intelligent financial hub crafted for complete clarity over your multi-currency, collaborative life.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={handleMainCta}
                        disabled={demoLoading}
                        className="bg-[#00ff7f] text-[#0d0d12] font-semibold py-4 px-8 rounded-full shadow-[0_0_24px_rgba(0,255,127,0.4)] hover:shadow-[0_0_32px_rgba(0,255,127,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {demoLoading ? 'Loading...' : isLoggedIn ? 'Go to Dashboard' : demoEnabled ? 'Enter Demo Wallet' : 'Get Started'}
                        {!demoLoading && <ChevronRight className="w-5 h-5" />}
                    </button>
                    {!isLoggedIn && (
                        <button onClick={() => navigate('/login')} className="bg-white/5 border border-white/10 hover:bg-white/10 font-semibold py-4 px-8 rounded-full transition-all duration-300">
                            See How It Works
                        </button>
                    )}
                </div>

                {/* Hero Mockup Graphic */}
                <div className="mt-16 md:mt-24 w-full max-w-5xl relative hidden sm:flex justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-transparent to-transparent z-10 w-full h-[120%] bottom-[-20%]"></div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row p-6 gap-6 items-start transform perspective-1000 rotate-x-12 scale-95 border-b-0 rounded-b-none w-full max-w-4xl">
                       {/* Abstract placeholder for the dashboard UI */}
                       <div className="w-full md:w-1/3 bg-white/5 rounded-xl p-4 border border-white/10 hidden md:block">
                           <div className="h-4 w-1/2 bg-white/10 rounded mb-4"></div>
                           <div className="h-24 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg mb-2"></div>
                           <div className="h-8 bg-white/5 rounded mb-2 w-3/4"></div>
                           <div className="h-8 bg-white/5 rounded mb-2 w-5/6"></div>
                       </div>
                       <div className="w-full md:w-2/3 bg-white/5 rounded-xl p-4 border border-white/10 translate-y-4">
                           <div className="flex justify-between mb-4">
                               <div className="h-4 w-1/4 bg-white/10 rounded"></div>
                               <div className="h-4 w-1/4 bg-[#00ff7f]/20 rounded"></div>
                           </div>
                           <div className="space-y-3">
                               {[1,2,3,4].map(i => (
                                   <div key={i} className="h-12 bg-white/5 rounded flex items-center px-4 justify-between border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-cyan-400/20"></div>
                                            <div className="h-3 w-20 bg-white/10 rounded"></div>
                                        </div>
                                        <div className="h-3 w-12 bg-white/10 rounded"></div>
                                   </div>
                               ))}
                           </div>
                       </div>
                    </div>
                </div>
            </header>

            {/* 2. Zero-Friction Highlight */}
            {demoEnabled && !isLoggedIn && (
                <section className="py-12 relative z-10 px-4">
                    <div className="max-w-5xl mx-auto p-[1px] bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl">
                        <div className="bg-[#0d0d12]/90 backdrop-blur-2xl p-10 md:p-14 rounded-[calc(1.5rem-1px)] text-center shadow-2xl">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Hate Blank Pages? We do too.</h2>
                            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                                Step straight into a fully functioning workspace. With one click, generate a realistic Demo Wallet packed with simulated transaction history. Fall in love with your data analytics without entering a single dime.
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* 3. Core Features Showcase */}
            <section className="py-24 px-4 max-w-6xl mx-auto space-y-32 z-10 relative">
                
                {/* Feature A */}
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                    <div className="flex-1 space-y-6">
                        <div className="text-purple-400 font-semibold tracking-wide uppercase text-sm">Global & Boundless</div>
                        <h2 className="text-4xl md:text-5xl font-bold leading-tight">Infinite Wallets.<br/>Real-Time Conversions.</h2>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            Break free from single-currency limitations. Create bespoke wallets for your Main Account, your Travel Fund, or your Shared Savings. Customize icons, set specific base currencies, and watch real-time exchange rates automatically unify your boundless financial world.
                        </p>
                    </div>
                    <div className="flex-1 relative perspective-1000 h-80 w-full flex justify-center items-center">
                        <div className="absolute transform translate-x-4 translate-y-4 rotate-12 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-white/10 backdrop-blur-md shadow-2xl p-6 rounded-2xl w-64 h-40 transition-transform hover:rotate-6 hover:translate-y-2 duration-500 cursor-default">
                            <div className="flex items-center gap-3 mb-4"><Wallet className="text-pink-400"/><span className="font-semibold text-white/80">Travel Fund</span></div>
                            <div className="text-2xl font-bold text-white">¥ 124,500</div>
                            <div className="text-sm text-gray-500 mt-2">Base: JPY</div>
                        </div>
                        <div className="absolute transform -translate-x-4 -rotate-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,255,255,0.2)] p-6 rounded-2xl w-72 h-44 z-10 transition-transform hover:rotate-0 hover:-translate-y-2 duration-500 cursor-default">
                            <div className="flex items-center gap-3 mb-4"><Wallet className="text-cyan-400"/><span className="font-semibold text-white">Main Account</span></div>
                            <div className="text-3xl font-bold text-white">$ 12,450.00</div>
                            <div className="text-sm text-[#00ff7f] mt-2">+ $ 2,400 this month</div>
                        </div>
                    </div>
                </div>

                {/* Feature B */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24">
                    <div className="flex-1 space-y-6">
                        <div className="text-cyan-400 font-semibold tracking-wide uppercase text-sm">Absolute Organization</div>
                        <h2 className="text-4xl md:text-5xl font-bold leading-tight">Categorize with<br/>Color & Clarity.</h2>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            Stop wrestling with messy spreadsheets. Our powerful hierarchical tagging maps out your money with folders and sub-categories. Every transaction is a beautifully rendered, translucent badge. <span className="text-[#00ff7f]">Income shines universally green</span>, and <span className="text-[#ff4d4d]">expenses are starkly red</span>—know instantly where you stand.
                        </p>
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl w-full">
                        <div className="space-y-4">
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-[#00ff7f]/20 flex items-center justify-center shrink-0"><BarChart3 className="text-[#00ff7f] w-6 h-6"/></div>
                                <div className="flex-1 min-w-[120px]">
                                    <div className="font-semibold text-white text-lg">Salary</div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 text-xs mt-1.5">Main Job</div>
                                </div>
                                <div className="text-[#00ff7f] font-bold text-xl sm:text-right w-full sm:w-auto">+$4,200.00</div>
                            </div>
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-[#ff4d4d]/20 flex items-center justify-center shrink-0"><Tags className="text-[#ff4d4d] w-6 h-6"/></div>
                                <div className="flex-1 min-w-[120px]">
                                    <div className="font-semibold text-white text-lg">Groceries</div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-400/10 text-orange-300 border border-orange-400/20 text-xs mt-1.5">Food & Dining</div>
                                </div>
                                <div className="text-[#ff4d4d] font-bold text-xl sm:text-right w-full sm:w-auto">-$124.50</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature C & D Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 duration-300 cursor-default">
                        <Calendar className="text-orange-400 w-10 h-10 mb-6" />
                        <h3 className="text-2xl font-bold mb-3">The Subscription Engine</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Go beyond basic "monthly" repeats. Built on a true cron engine, track complex rules like "the last working day of the month." Watch your timeline shift seamlessly with our semantic urgency system—fading from calm gray to <span className="text-[#ff4d4d] drop-shadow-[0_0_8px_rgba(255,77,77,0.8)]">fiery red</span> as due dates approach.
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 duration-300 relative overflow-hidden cursor-default">
                        <Users className="text-pink-400 w-10 h-10 mb-6 relative z-10" />
                        <h3 className="text-2xl font-bold mb-3 relative z-10">Real-Time Collaboration</h3>
                        <p className="text-gray-400 leading-relaxed relative z-10">
                            Perfect for couples and roommates. Invite collaborators via email and assign permissions (Owner, Editor, Viewer). Stay perfectly in sync with a central notification hub that updates instantly as your shared money moves.
                        </p>
                        {/* Decorative floating avatars */}
                        <div className="absolute -bottom-6 -right-6 flex -space-x-4 opacity-40 filter blur-[1px]">
                            <div className="w-16 h-16 rounded-full border-4 border-[#0d0d12] bg-cyan-500"></div>
                            <div className="w-16 h-16 rounded-full border-4 border-[#0d0d12] bg-purple-500"></div>
                            <div className="w-16 h-16 rounded-full border-4 border-[#0d0d12] bg-pink-500"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. CTA / Bumper */}
            <section className="py-24 px-4 pb-32">
                <div className="max-w-4xl mx-auto relative flex flex-col items-center justify-center p-12 md:p-24 overflow-hidden rounded-3xl bg-gradient-to-t from-cyan-900/30 to-[#0d0d12] border border-cyan-500/20 text-center shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full bg-cyan-900/10 mix-blend-overlay"></div>
                    <div className="absolute bottom-[-10px] w-[80%] h-4 bg-[#00ff7f] filter blur-3xl opacity-40"></div>
                    
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">Ready to Master Your Money?</h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-xl relative z-10">
                        Step into a premium, transparent, and seamless financial experience. Your beautifully organized money is just a click away.
                    </p>
                    <button 
                        onClick={handleMainCta}
                        className="relative z-10 bg-[#00ff7f] text-[#0d0d12] font-bold py-4 px-10 rounded-full shadow-[0_0_24px_rgba(0,255,127,0.4)] hover:shadow-[0_0_32px_rgba(0,255,127,0.6)] hover:-translate-y-1 transition-all duration-300 text-lg flex items-center gap-2"
                    >
                        {isLoggedIn ? 'Go to Dashboard' : (demoEnabled ? 'Launch Your Free Demo' : 'Create an Account')}
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </section>
            
            {/* Simple Footer */}
            <footer className="border-t border-white/5 py-8 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} FinanceWebApp. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;

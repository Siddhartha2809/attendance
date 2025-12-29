import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ChevronRight, ShieldCheck, BarChart3, Clock, Lock } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans selection:bg-blue-500/30">
            {/* iOS-inspired liquid background */}
            <div style={{ animationDelay: '0s' }} className="absolute -top-1/4 -left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-50 animate-pulse bg-violet-600" />
            <div style={{ animationDelay: '2s' }} className="absolute -bottom-1/4 -right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-50 animate-pulse bg-sky-600" />
            <div style={{ animationDelay: '4s' }} className="absolute -bottom-1/4 -left-1/3 w-80 h-80 rounded-full blur-[120px] opacity-50 animate-pulse bg-rose-600" />

            {/* --- Navbar --- */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                     {/* Using your logo */}
                     <img src="/logo-small.png" alt="Institute Logo" className="h-12 w-auto object-contain drop-shadow-lg" />
                     <div className="hidden md:flex flex-col">
                        <span className="text-white font-bold text-lg leading-tight tracking-tight">AMS Portal</span>
                        <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Secure Access</span>
                     </div>
                </div>
                <div className="flex gap-4">
                    <Button 
                        variant="ghost" 
                        className="text-slate-300 hover:text-white hover:bg-white/5 hidden sm:flex"
                        onClick={() => navigate('/login')}
                    >
                        Faculty Login
                    </Button>
                    <Button 
                        className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 rounded-full px-6"
                        onClick={() => navigate('/login')}
                    >
                        Admin Portal
                    </Button>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[75vh] px-4 text-center max-w-5xl mx-auto mt-[-20px]">
                
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-8 animate-in fade-in zoom-in duration-1000">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    System Online v1.0
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400 mb-6 tracking-tight drop-shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-forwards">
                    Smart Attendance <br />
                    <span className="text-blue-500">Management</span> System
                </h1>

                {/* Subtitle */}
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-200 fill-mode-forwards opacity-0" style={{ animationFillMode: 'forwards' }}>
                    Streamline your academic operations with our secure, real-time attendance tracking platform designed for modern educational institutions.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300 fill-mode-forwards opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <Button 
                        size="lg" 
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 h-14 rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                        onClick={() => navigate('/login')}
                    >
                        Access Dashboard <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                        size="lg" 
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/5 h-14 px-8 rounded-full backdrop-blur-sm bg-transparent"
                    >
                        Learn More
                    </Button>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-500 fill-mode-forwards opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <FeatureCard 
                        icon={<ShieldCheck className="h-6 w-6 text-blue-400" />}
                        title="Secure Access"
                        desc="Role-based authentication ensuring data privacy and integrity for all users."
                    />
                    <FeatureCard 
                        icon={<Clock className="h-6 w-6 text-indigo-400" />}
                        title="Real-time Tracking"
                        desc="Instant attendance updates and live reporting capabilities for faculty."
                    />
                    <FeatureCard 
                        icon={<BarChart3 className="h-6 w-6 text-purple-400" />}
                        title="Smart Analytics"
                        desc="Comprehensive insights into student engagement and attendance trends."
                    />
                </div>
            </main>
            
            {/* Footer */}
            <footer className="relative z-10 w-full py-6 text-center border-t border-white/5 mt-10">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">
                    &copy; 2025 Attendance Management System. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

// Helper Component for Feature Cards
const FeatureCard = ({ icon, title, desc }) => (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default group hover:border-blue-500/30">
        <div className="mb-4 p-3 rounded-lg bg-white/5 w-fit group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

export default LandingPage;
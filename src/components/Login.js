import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, Sun, Moon } from 'lucide-react'; 
import api from '../api'; 
import { useTheme } from './ThemeContext';
// ✅ CORRECT IMPORT: Matches your db.js structure
import { initAuthDB, saveUserLocally, loginOffline } from '../database/db'; 
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Effect for session persistence and DB initialization
    useEffect(() => {
        // 1. Check for an existing login session
        const loggedInUser = localStorage.getItem('user');
        if (loggedInUser) {
            const userData = JSON.parse(loggedInUser);
            
            // Redirect immediately, replacing the login page in history
            if (userData.role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            } else {
                navigate('/faculty-dashboard', { replace: true });
            }
            return; 
        }

        // 2. If no session, initialize the offline DB for a potential login
        const setupDB = async () => {
            try {
                await initAuthDB();
                console.log("Local SQLite DB Initialized");
            } catch (e) {
                console.error("Failed to init DB:", e);
            }
        };
        setupDB();
    }, [navigate]);

    const handleSuccess = (userData) => {
        console.log("✅ Login Successful. Redirecting...", userData);
        
        // Save to LocalStorage (Session)
        localStorage.setItem('user', JSON.stringify({
            id: userData.user_id || userData.id, 
            role: userData.role,
            name: userData.name || username,
            department: userData.department 
        }));

        // Redirect based on role
        if (userData.role === 'admin') {
            navigate('/admin-dashboard');
        } else {
            navigate('/faculty-dashboard');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // ----------------------------------------
            // 1. TRY ONLINE LOGIN
            // ----------------------------------------
            console.log("Attempting Online Login...");
            console.log("API URL:", api.defaults.baseURL + '/login.php');

            const response = await api.post('/login.php', {
                username: username,
                password: password
            });

            console.log("Raw Server Data:", response.data);
            const data = response.data;

            if (data.status === 'success') {
                if (data.forceChangePassword) {
                    alert("First time login: You must change your password online.");
                    navigate('/change-password');
                    return;
                }

                // ---------------------------------------------------------
                // ✅ CRITICAL: SYNC DATA TO OFFLINE DATABASE
                // ---------------------------------------------------------
                console.log("📲 Syncing user to Offline Database...");
                try {
                    await saveUserLocally({ ...data, username: username }, password);
                    console.log("✅ User synced successfully!");
                } catch (saveErr) {
                    console.error("❌ Failed to sync user offline:", saveErr);
                    // We don't stop login, but we warn the console
                }

                handleSuccess(data);
            } else {
                setError(data.message || "Login failed (Server Error)");
            }

        } catch (err) {
            // ----------------------------------------
            // 2. NETWORK FAILED - TRY OFFLINE LOGIN
            // ----------------------------------------
            console.warn("Network Error. Switching to Offline Mode...", err);

            try {
                // Try to find the user in the phone's internal SQLite DB
                const localUser = await loginOffline(username, password);

                if (localUser) {
                    console.log("✅ Offline Login Found:", localUser);
                    alert("Network unreachable. Logging in Offline.");
                    handleSuccess(localUser);
                } else {
                    console.error("❌ Offline Login Failed: User not found in local DB.");
                    setError("Offline: No saved credentials found. You must login Online at least once.");
                }
            } catch (dbErr) {
                console.error("Database Error:", dbErr);
                setError("Login failed. Please check connection.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <div className="absolute top-6 right-6 z-20">
                <button 
                    onClick={toggleTheme} 
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-black/10'}`}
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </button>
            </div>

            <div style={{ animationDelay: '0s' }} className={`absolute -top-1/4 -left-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse ${isDarkMode ? 'bg-violet-600 opacity-50' : 'bg-violet-300 opacity-75'}`} />
            <div style={{ animationDelay: '2s' }} className={`absolute -bottom-1/4 -right-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse ${isDarkMode ? 'bg-sky-600 opacity-50' : 'bg-sky-300 opacity-75'}`} />
            <div style={{ animationDelay: '4s' }} className={`absolute -bottom-1/4 -left-1/3 w-80 h-80 rounded-full blur-[100px] animate-pulse ${isDarkMode ? 'bg-rose-600 opacity-50' : 'bg-rose-300 opacity-75'}`} />

            <Card className={`w-full max-w-md backdrop-blur-2xl shadow-2xl relative z-10 transition-colors duration-300 ${
                !isDarkMode 
                ? 'bg-white/30 border border-white/40 shadow-black/10 text-slate-800' 
                : 'bg-black/20 border border-white/10 shadow-black/50 text-white'
            }`}>
                <CardHeader className="pt-10 pb-2 text-center space-y-3">
                    <div className="mx-auto w-fit mb-4">
                        <img src="/logo-small.png" alt="Institute Logo" className="h-20 w-auto object-contain drop-shadow-2xl" />
                    </div>
                    <CardTitle className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Welcome Back</CardTitle>
                    <CardDescription className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Sign in to the Attendance Portal</CardDescription>
                </CardHeader>

                <CardContent className="p-8 pt-6">
                    {error && (
                        <div className={`p-4 mb-6 text-sm rounded-lg flex items-center backdrop-blur-sm ${
                            !isDarkMode
                            ? 'bg-red-500/10 border border-red-500/20 text-red-700'
                            : 'bg-red-500/10 border border-red-500/20 text-red-200'
                        }`}>
                            <span className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${isDarkMode ? 'bg-red-400' : 'bg-red-500'}`}></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Username</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <User className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-500 group-focus-within:text-cyan-600'}`} />
                                </div>
                                <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className={`pl-11 pr-4 py-6 w-full border transition-colors rounded-xl text-base ${
                                    !isDarkMode
                                    ? 'bg-black/5 border-black/10 focus:border-cyan-500 focus:bg-white/50 text-slate-900 placeholder:text-slate-500'
                                    : 'bg-black/20 border-white/10 focus-visible:ring-blue-500/50 text-white placeholder:text-slate-500'
                                }`} placeholder="Enter your username" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <Lock className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-500 group-focus-within:text-cyan-600'}`} />
                                </div>
                                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={`pl-11 pr-4 py-6 w-full border transition-colors rounded-xl text-base ${
                                    !isDarkMode
                                    ? 'bg-black/5 border-black/10 focus:border-cyan-500 focus:bg-white/50 text-slate-900 placeholder:text-slate-500'
                                    : 'bg-black/20 border-white/10 focus-visible:ring-blue-500/50 text-white placeholder:text-slate-500'
                                }`} placeholder="Enter your password" />
                            </div>
                        </div>

                        <Button type="submit" className={`w-full font-bold py-6 rounded-xl shadow-lg mt-4 transition-all duration-300 ${
                            !isDarkMode
                            ? 'bg-black text-white hover:bg-gray-800 shadow-black/20'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-t border-white/10'
                        }`} disabled={isLoading}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</>
                            ) : (
                                "Access Dashboard"
                            )}
                        </Button>
                    </form>
                </CardContent>

            </Card>
        </div>
    );
};

export default Login;
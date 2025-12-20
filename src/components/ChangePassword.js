import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';
import { useTheme } from './ThemeContext';
import api from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/Label';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from './ui/card';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { isDarkMode } = useTheme();

    // Get user info stored during login
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');

        if (passwords.new !== passwords.confirm) {
            setError("Passwords do not match.");
            return;
        }

        if (passwords.new.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/change_password.php', {
                user_id: user.id,
                role: user.role,
                new_password: passwords.new
            });

            if (response.data.status === 'success') {
                alert("Password updated successfully! Please login with your new password.");
                localStorage.clear(); // Clear session
                navigate('/login');
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError("Failed to connect to the server.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
            {/* iOS-inspired liquid background */}
            <div style={{ animationDelay: '0s' }} className={`absolute -top-1/4 -left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-50 animate-pulse ${isDarkMode ? 'bg-violet-600' : 'bg-violet-200'}`} />
            <div style={{ animationDelay: '2s' }} className={`absolute -bottom-1/4 -right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-50 animate-pulse ${isDarkMode ? 'bg-sky-600' : 'bg-sky-200'}`} />
            <div style={{ animationDelay: '4s' }} className={`absolute -bottom-1/4 -left-1/3 w-80 h-80 rounded-full blur-[120px] opacity-50 animate-pulse ${isDarkMode ? 'bg-rose-600' : 'bg-rose-200'}`} />

            <Card className={`w-full max-w-md backdrop-blur-2xl shadow-2xl relative z-10 transition-colors duration-300 ${
                !isDarkMode 
                ? 'bg-white/30 border border-white/40 shadow-black/10 text-slate-800' 
                : 'bg-black/20 border border-white/10 shadow-black/50 text-white'
            }`}>
                <CardHeader className="pt-10 pb-2 text-center space-y-3">
                    <div className="mx-auto bg-gradient-to-tr from-green-500 to-emerald-600 p-3 rounded-2xl w-fit shadow-lg shadow-green-500/20">
                        <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Secure Account</CardTitle>
                    <CardDescription className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-sm`}>
                        Please update your default password to continue.
                    </CardDescription>
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

                    <form onSubmit={handleUpdate} className="space-y-5">
                        <div className="space-y-2">
                            <Label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>New Password</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <Lock className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-500 group-focus-within:text-cyan-600'}`} />
                                </div>
                                <Input
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                    required
                                    className={`pl-11 pr-4 py-6 w-full border transition-colors rounded-xl text-base ${
                                        !isDarkMode
                                        ? 'bg-black/5 border-black/10 focus:border-cyan-500 focus:bg-white/50 text-slate-900 placeholder:text-slate-500'
                                        : 'bg-black/20 border-white/10 focus-visible:ring-blue-500/50 text-white placeholder:text-slate-500'
                                    }`}
                                    placeholder="Enter new password"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Confirm Password</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <Lock className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-500 group-focus-within:text-cyan-600'}`} />
                                </div>
                                <Input
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                    required
                                    className={`pl-11 pr-4 py-6 w-full border transition-colors rounded-xl text-base ${
                                        !isDarkMode
                                        ? 'bg-black/5 border-black/10 focus:border-cyan-500 focus:bg-white/50 text-slate-900 placeholder:text-slate-500'
                                        : 'bg-black/20 border-white/10 focus-visible:ring-blue-500/50 text-white placeholder:text-slate-500'
                                    }`}
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className={`w-full font-bold py-6 rounded-xl shadow-lg mt-4 transition-all duration-300 transform hover:-translate-y-px ${
                                !isDarkMode
                                ? 'bg-black text-white hover:bg-gray-800 shadow-black/20'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-t border-white/10 shadow-blue-500/25'
                            }`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ChangePassword;
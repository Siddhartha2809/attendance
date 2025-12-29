import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, ShieldCheck, ArrowLeft, Sun, Moon, Eye, EyeOff } from 'lucide-react';
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
} from './ui/card';

const PasswordStrengthIndicator = ({ strength, isDarkMode }) => {
    const strengthConfig = {
        1: { label: 'Weak', color: 'bg-red-500' },
        2: { label: 'Weak', color: 'bg-orange-500' },
        3: { label: 'Medium', color: 'bg-yellow-500' },
        4: { label: 'Strong', color: 'bg-green-500' }
    };

    const { level, message } = strength;

    if (level === 0) return null;

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                            level > index ? strengthConfig[level]?.color : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                    />
                ))}
            </div>
            {message && <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{message}</p>}
        </div>
    );
};

const ChangePassword = () => {
    const navigate = useNavigate();
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { isDarkMode, toggleTheme } = useTheme();
    const [passwordStrength, setPasswordStrength] = useState({ level: 0, message: '' });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Get user info stored during login
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const checkPasswordStrength = (password) => {
        let score = 0;
        if (!password) return { level: 0, message: '' };

        // Award points for different criteria
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        // Determine level and message based on score
        if (password.length < 8) {
            return { level: 1, message: 'Should be at least 8 characters.' };
        }

        switch (score) {
            case 1:
            case 2:
                return { level: 2, message: 'Weak: Add more variety (e.g., numbers, symbols).' };
            case 3:
                return { level: 3, message: 'Medium: Good password.' };
            case 4:
            case 5:
                return { level: 4, message: 'Strong: Excellent password!' };
            default:
                return { level: 1, message: 'Should be at least 8 characters.' };
        }
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPasswords({ ...passwords, new: newPassword });
        setPasswordStrength(checkPasswordStrength(newPassword));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');

        if (passwords.new !== passwords.confirm) {
            setError("Passwords do not match.");
            return;
        }

        if (passwords.new.length < 8) {
            setError("Password must be at least 8 characters.");
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
                localStorage.clear();
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
        <div className={`min-h-screen flex flex-col relative overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'} pt-8`}>
            {/* iOS-inspired liquid background */}
            <div style={{ animationDelay: '0s' }} className={`absolute -top-1/4 -left-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse ${isDarkMode ? 'bg-violet-600 opacity-50' : 'bg-violet-300 opacity-75'}`} />
            <div style={{ animationDelay: '2s' }} className={`absolute -bottom-1/4 -right-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse ${isDarkMode ? 'bg-sky-600 opacity-50' : 'bg-sky-300 opacity-75'}`} />
            <div style={{ animationDelay: '4s' }} className={`absolute -bottom-1/4 -left-1/3 w-80 h-80 rounded-full blur-[100px] animate-pulse ${isDarkMode ? 'bg-rose-600 opacity-50' : 'bg-rose-300 opacity-75'}`} />

            <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between h-20 px-4 md:px-8">
                    <div className="flex items-center gap-4">
                        <Button 
                            onClick={() => navigate(-1)} 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-50 dark:bg-white/10 rounded-xl flex items-center justify-center border border-blue-100 dark:border-white/10 shadow-sm">
                                <img src="/logo-small.png" alt="Logo" className="h-8 w-auto object-contain" />
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 dark:text-white text-lg block leading-tight">Password Management</span>
                                <span className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-widest font-semibold">{user.role} Portal</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            className="p-3 rounded-full transition-all duration-300 border shadow-sm bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-600 dark:text-yellow-400 hover:bg-slate-50 dark:hover:bg-white/20"
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <Card className={`w-full max-w-md backdrop-blur-2xl shadow-2xl relative z-10 transition-colors duration-300 ${
                    !isDarkMode 
                    ? 'bg-white/30 border border-white/40 shadow-black/10 text-slate-800' 
                    : 'bg-black/20 border border-white/10 shadow-black/50 text-white'
                }`}>
                    <CardHeader className="pt-10 pb-2 text-center space-y-3">
                        <CardTitle className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Update Password</CardTitle>
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
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwords.new}
                                    onChange={handlePasswordChange}
                                        required
                                        className={`pl-11 pr-12 py-6 w-full border transition-colors rounded-xl text-base ${
                                            !isDarkMode
                                            ? 'bg-black/5 border-black/10 focus:border-cyan-500 focus:bg-white/50 text-slate-900 placeholder:text-slate-500'
                                            : 'bg-black/20 border-white/10 focus-visible:ring-blue-500/50 text-white placeholder:text-slate-500'
                                        }`}
                                        placeholder="Enter new password"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                                        >
                                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            <PasswordStrengthIndicator strength={passwordStrength} isDarkMode={isDarkMode} />
                            </div>

                            <div className="space-y-2">
                                <Label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Confirm Password</Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                        <Lock className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-500 group-focus-within:text-cyan-600'}`} />
                                    </div>
                                    <Input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                        required
                                        className={`pl-11 pr-12 py-6 w-full border transition-colors rounded-xl text-base ${
                                            !isDarkMode
                                            ? 'bg-black/5 border-black/10 focus:border-cyan-500 focus:bg-white/50 text-slate-900 placeholder:text-slate-500'
                                            : 'bg-black/20 border-white/10 focus-visible:ring-blue-500/50 text-white placeholder:text-slate-500'
                                        }`}
                                        placeholder="Confirm new password"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
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
            </main>
        </div>
    );
};
export default ChangePassword;
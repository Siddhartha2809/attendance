import React, { useState, useEffect, useMemo } from 'react';
import { useNetworkStatus } from '../NetworkContext';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Use consistent API helper
import offlineService from './offlineService';
import { useTheme } from './ThemeContext';
import { StatusBar, Style } from '@capacitor/status-bar';
import { 
    LayoutDashboard, 
    CheckSquare, 
    LogOut, 
    BookOpen,
    Calendar,
    User,
    Sun,
    Moon,
    Clock,
    BadgeCheck,
    Mail,
    GraduationCap,
    List,
    ChevronRight,
    RefreshCw,
    Search,
    KeyRound
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';

const FacultyDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('courses');
    const { isDarkMode, toggleTheme } = useTheme();
    
    // --- STATE ---
    const [facultyName, setFacultyName] = useState("");
    const [facultyDetails, setFacultyDetails] = useState({});
    const [myCourses, setMyCourses] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]); // History Data
    const [loading, setLoading] = useState(true);
    const [courseSearchTerm, setCourseSearchTerm] = useState('');
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const { isOnline } = useNetworkStatus();
    const [authChecking, setAuthChecking] = useState(true);
    const [queueStats, setQueueStats] = useState({ total: 0, pending: 0, failed: 0, synced: 0 }); 
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        // This timer will update the 'now' state every 30 seconds,
        const intervalId = setInterval(() => {
            setNow(new Date());
        }, 30000); // Update every 30 seconds is sufficient

        return () => clearInterval(intervalId);
    }, []);

    const filteredHistory = useMemo(() => {
        if (!historySearchTerm) {
            return attendanceHistory;
        }
        return attendanceHistory.filter(log => 
            log.course_code.toLowerCase().includes(historySearchTerm.toLowerCase())
        );
    }, [attendanceHistory, historySearchTerm]);

    const groupedHistory = useMemo(() => {
        if (filteredHistory.length === 0) return {};

        const grouped = filteredHistory.reduce((acc, log) => {
            try {
                // The date string from the server is now in the correct local timezone.
                const logDate = new Date(log.date);

                if (isNaN(logDate.getTime())) {
                    throw new Error(`Invalid date format: ${log.date}`);
                }

                const dateKey = logDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                if (!acc[dateKey]) {
                    acc[dateKey] = [];
                }
                acc[dateKey].push(log);
            } catch (e) {
                const dateKey = 'Unknown Date';
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(log);
            }
            return acc;
        }, {});

        for (const date in grouped) {
            grouped[date].sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return grouped;
    }, [filteredHistory]);

    const sortedHistoryDates = useMemo(() => {
        return Object.keys(groupedHistory).sort((a, b) => {
            if (a === 'Unknown Date') return 1;
            if (b === 'Unknown Date') return -1;
            return new Date(b) - new Date(a);
        });
    }, [groupedHistory]);

    // --- CHECK AUTH & FETCH DATA ---
    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                navigate('/login');
                return;
            }

            try {
                const userObj = JSON.parse(storedUser);
                
                if (userObj.role !== 'faculty') {
                    navigate('/login');
                    return;
                }

                setFacultyName(userObj.name || "Faculty Member");
                setFacultyDetails(userObj);
                setAuthChecking(false); 
                
                // Initial Fetch
                await fetchMyCourses(userObj.id);
                await fetchHistory(userObj.id);

            } catch (e) {
                console.error("Auth Error", e);
                localStorage.clear();
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate]);

    // --- DATA SYNC LOGIC ---
    // This effect handles the app coming back online
    useEffect(() => {
        const handleOnline = async () => {
            console.log("Network status: Online. Starting sync process.");
            // 1. Sync any pending offline submissions
            await processSyncQueue();
            
            // 2. Refetch all relevant data from the server to get the latest updates
            if (facultyDetails.id) {
                console.log("Re-fetching data after sync...");
                await fetchMyCourses(facultyDetails.id, true); // Pass true to bypass cache
                await fetchHistory(facultyDetails.id, true);   // Pass true to bypass cache
            }
        };

        if (isOnline && facultyDetails.id) {
            handleOnline();
        }
    }, [isOnline, facultyDetails.id]);

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        
        // A refresh should always bypass the cache to get the latest data
        await fetchMyCourses(facultyDetails.id, true);
        await fetchHistory(facultyDetails.id, true);

        setIsRefreshing(false);
    };

    const processSyncQueue = async () => {
        const queue = offlineService.getSyncQueue();
        if (queue.length === 0) return;

        const pendingItems = queue.filter(item => !item.synced && item.retries < item.maxRetries);
        if (pendingItems.length === 0) return;

        console.log(`⏳ Processing ${pendingItems.length} items from sync queue.`);

        for (const item of pendingItems) {
            try {
                console.log(`🔄 Syncing item ${item.id}: ${item.endpoint}`);
                
                const response = await api.post(item.endpoint, item.payload);
                
                // Handle both "success" and "partial" status (partial means some records were locked)
                if (response?.data?.status === 'success' || response?.data?.status === 'partial') {
                    // Mark as synced even if partial (user can update within grace period)
                    offlineService.updateQueueItem(item.id, { synced: true });
                    
                    if (response?.data?.status === 'partial') {
                        console.warn(`⚠️ Partial sync for item ${item.id}:`, response?.data?.locked_records);
                    } else {
                        console.log(`✅ Item synced successfully: ${item.id}`);
                    }
                } else {
                    // Increment retry count
                    offlineService.updateQueueItem(item.id, { 
                        retries: item.retries + 1,
                        error: response?.data?.message || 'Sync failed'
                    });
                    console.warn(`⚠️ Sync failed (will retry): ${item.id}`, response?.data);
                }
            } catch (error) {
                // Increment retry count on network error
                const retryCount = item.retries + 1;
                offlineService.updateQueueItem(item.id, { 
                    retries: retryCount,
                    error: error?.message || 'Network error'
                });
                
                console.error(`❌ Error syncing item ${item.id}:`, error?.message);
                
                // Stop attempting if max retries exceeded
                if (retryCount >= item.maxRetries) {
                    console.error(`🚫 Item ${item.id} exceeded max retries. Marking as failed.`);
                }
            }
        }
        
        // Clean up synced items from queue
        offlineService.clearSyncedItems();
        
        // Get updated stats
        const stats = offlineService.getQueueStats();
        console.log(`📊 Sync Queue Stats:`, stats);
        
        if (stats.failed > 0) {
            console.warn(`⚠️ ${stats.failed} items failed to sync. They will be retried.`);
        }
        
        // Re-fetch data after sync to reflect changes
        if (facultyDetails.id) {
            fetchHistory(facultyDetails.id, true); 
        }
    };

    // This effect just updates the UI with queue stats
    useEffect(() => {
        const statsInterval = setInterval(() => {
            const stats = offlineService.getQueueStats();
            setQueueStats(stats);
        }, 1000); // Update every second

        return () => clearInterval(statsInterval);
    }, []); // No dependencies needed, it should run continuously

    useEffect(() => {
        if (activeTab === 'history' && facultyDetails.id) {
            fetchHistory(facultyDetails.id);
        }
    }, [activeTab, facultyDetails.id]);

    const fetchMyCourses = async (fid, bypassCache = false) => {
        setLoading(true);
        // 1. Load from cache immediately for instant UI, unless bypassed
        if (!bypassCache) {
            const cachedCourses = offlineService.getCachedData(`courses_${fid}`);
            if (cachedCourses) {
                setMyCourses(cachedCourses);
            }
        }

        // 2. If offline, we can't fetch. Stop here.
        if (!isOnline) {
            setLoading(false);
            return;
        }

        // 3. Fetch from network
        try {
            const response = await api.get(`/get_faculty_dashboard.php?id=${fid}`);
            if (response.data.status === 'success') {
                const freshCourses = response.data.courses;
                setMyCourses(freshCourses);
                // 4. Update cache with fresh data
                offlineService.setCachedData(`courses_${fid}`, freshCourses);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (fid, bypassCache = false) => {
        // 1. Load from cache unless bypassed
        if (!bypassCache) { // Only use cache if not forcing a refresh
            const cachedHistory = offlineService.getCachedData(`history_${fid}`);
            if (cachedHistory) {
                setAttendanceHistory(cachedHistory);
            }
        }

        if (!isOnline) return; // Don't fetch if offline
        try {
            const response = await api.get(`/get_attendance_history.php?faculty_id=${fid}`);
            let data = response && response.data;

            // If server mistakenly prefixes the JSON with junk text, try to locate the JSON start
            if (typeof data === 'string') {
                const braceIdx = data.indexOf('{');
                const bracketIdx = data.indexOf('[');
                const startIdx = Math.min(
                    braceIdx === -1 ? Infinity : braceIdx,
                    bracketIdx === -1 ? Infinity : bracketIdx
                );

                if (startIdx !== Infinity && startIdx > 0) {
                    try {
                        data = JSON.parse(data.slice(startIdx));
                    } catch (e) {
                        console.error('Failed to parse prefixed JSON for history:', e, data);
                        // Leave attendanceHistory unchanged on parse failure
                        return;
                    }
                }
            }

            if (data && data.status === 'success') {
                const historyArr = data.history || [];
                setAttendanceHistory(historyArr);
                // Persist fresh history to cache for offline access
                try {
                    offlineService.setCachedData(`history_${fid}`, historyArr);
                } catch (e) {
                    console.error('Failed to cache history:', e);
                }
            } else {
                console.error('Unexpected history response:', data || response);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            navigate('/login');
        }
    };

    const handleTakeAttendance = (course) => {
        navigate('/take-attendance', { state: { course } }); 
    };

    if (authChecking) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-white">Loading...</div>;
    }

    const filteredCourses = myCourses.filter(course =>
        course.course_name.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(courseSearchTerm.toLowerCase())
    );

    const showSyncBar = queueStats.pending > 0;

    const navItems = [
        { id: 'courses', label: 'Courses', icon: LayoutDashboard },
        { id: 'history', label: 'History', icon: Calendar },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-200 selection:bg-indigo-100 dark:selection:bg-blue-500/30 overflow-hidden relative transition-colors duration-300">
            {/* --- BACKGROUND BLURS --- */}
            <div style={{ animationDelay: '0s' }} className={`fixed -top-1/4 -left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-30 animate-pulse ${isDarkMode ? 'bg-violet-600' : 'bg-violet-200'}`} />
            <div style={{ animationDelay: '2s' }} className={`fixed -bottom-1/4 -right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-30 animate-pulse ${isDarkMode ? 'bg-sky-600' : 'bg-sky-200'}`} />
            <div style={{ animationDelay: '4s' }} className={`fixed -bottom-1/4 -left-1/3 w-80 h-80 rounded-full blur-[120px] opacity-30 animate-pulse ${isDarkMode ? 'bg-rose-600' : 'bg-rose-200'}`} />

            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:flex fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex-col transition-all duration-300 shadow-xl">
                <div className="p-6 flex items-center gap-4 border-b border-slate-100 dark:border-white/5">
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-white/10 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-white/10 shadow-sm">
                        <img src="/logo-small.png" alt="Logo" className="h-8 w-auto object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-white tracking-wide text-lg leading-tight">MIC</span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-semibold">Faculty Portal</span>
                    </div>
                </div>
                
                <div className="px-6 py-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-2">Menu</div>
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <NavItem 
                                key={item.id} 
                                icon={item.icon} 
                                label={item.label} 
                                isActive={activeTab === item.id} 
                                onClick={() => setActiveTab(item.id)} 
                                isDarkMode={isDarkMode}
                            />
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            {facultyName.charAt(0)}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-slate-800 dark:text-white truncate">{facultyName}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Faculty Member</span>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-600 gap-3 transition-colors" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" /> Logout
                    </Button>
                </div>
            </aside>

            {/* --- NAVBAR (Mobile Only) --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-slate-200 dark:border-white/10 pb-2">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors duration-200 ${
                                activeTab === item.id 
                                ? 'text-blue-500' 
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="text-[10px] font-medium">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-64 h-screen relative w-full flex flex-col">
                <div className="w-full sticky top-0 z-30">
                    <div className="bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
                        {/* Mobile Header */}
                        <div className="md:hidden flex items-center justify-between p-4 pt-8">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-indigo-50 dark:bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-slate-200 dark:border-white/10 shadow-sm">
                                    <img src="/logo-small.png" alt="Logo" className="h-8 w-auto object-contain" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-800 dark:text-white text-lg block leading-tight">MIC Portal</span>
                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-semibold">{facultyName.split(' ')[0]}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleRefresh} disabled={isRefreshing} title="Refresh Page" className="p-2 rounded-full transition-colors border bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                    <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </button>
                                <button onClick={toggleTheme} className="p-2 rounded-full transition-colors border bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-yellow-400 shadow-sm">
                                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </button>
                                <button onClick={handleLogout} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors border border-red-100 shadow-sm">
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Desktop Header */}
                        <header className="hidden md:flex justify-between items-center p-8 animate-in fade-in duration-500">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                                    {activeTab === 'courses' && "My Assigned Courses"}
                                    {activeTab === 'history' && "Attendance History"}
                                    {activeTab === 'profile' && "My Profile"}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your academic activities and student records.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    title="Refresh Page"
                                    className="p-3 rounded-full transition-all duration-300 border shadow-sm bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </button>
                                <button 
                                    onClick={toggleTheme}
                                    className="p-3 rounded-full transition-all duration-300 border shadow-sm bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-600 dark:text-yellow-400 hover:bg-slate-50 dark:hover:bg-white/20"
                                >
                                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </button>
                            </div>
                        </header>
                    </div>
                    {/* --- SYNC QUEUE INDICATOR --- */}
                    {showSyncBar && (
                        <div className="bg-amber-400 dark:bg-amber-500 text-black text-center p-2 text-sm font-semibold shadow-lg flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>
                                {queueStats.pending} offline submission{queueStats.pending > 1 ? 's' : ''} waiting to sync...
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8">
                    {loading ? <div className="text-slate-500 dark:text-slate-400 text-center mt-20 animate-pulse">Loading data...</div> : (
                        <>
                            {/* === COURSES TAB (LIST VIEW) === */}
                            {activeTab === 'courses' && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    {/* Search Bar - only available if there are any assigned courses */}
                                    {myCourses.length > 0 && (
                                        <div className="relative w-full md:max-w-sm">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                            <Input
                                                placeholder="Search by course name or code..."
                                                className="pl-10 w-full bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400"
                                                value={courseSearchTerm}
                                                onChange={(e) => setCourseSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                    {filteredCourses.length > 0 ? (
                                        filteredCourses.map((course) => {
                                            // Find the most recent log for this specific course to check for a grace period
                                            const latestLog = attendanceHistory
                                                .filter(log => log.course_code === course.course_code)
                                                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

                                            let minutesSinceSubmission = Infinity;
                                            if (latestLog) {
                                                minutesSinceSubmission = (now.getTime() - new Date(latestLog.date).getTime()) / (1000 * 60);
                                            }

                                            const isWithinGracePeriod = minutesSinceSubmission < 15;
                                            const remainingMinutes = isWithinGracePeriod ? Math.max(0, Math.ceil(15 - minutesSinceSubmission)) : 0;
                                            
                                            return (
                                            <div 
                                                key={course.id} 
                                                className="bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 shadow-sm hover:shadow-md group"
                                            >
                                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                                    <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg text-indigo-500 border border-indigo-100 dark:border-white/10">
                                                        <BookOpen className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
                                                                {course.course_code}
                                                            </span>
                                                            {/* ADDED BRANCH HERE */}
                                                            <span className="text-xs px-2 py-0.5 rounded border bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                                                                {course.branch || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{course.course_name}</h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                                            <span>Year: {course.year}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                                            <span>Sem: {course.sem}</span>
                                                        </p>
                                                        {/* GRACE PERIOD INDICATOR */}
                                                        {isWithinGracePeriod && (
                                                            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                                                                <Clock className="h-4 w-4 flex-shrink-0" />
                                                                <span>
                                                                    You can update this for ~{remainingMinutes} more minute{remainingMinutes !== 1 ? 's' : ''}. After that, it will be locked for today.
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <Button 
                                                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white gap-2 shadow-lg shadow-indigo-500/20 min-w-[160px]"
                                                    onClick={() => handleTakeAttendance(course)}
                                                    variant={isWithinGracePeriod ? 'secondary' : 'default'}
                                                >
                                                    {isWithinGracePeriod ? 'Update Attendance' : 'Take Attendance'} <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )})
                                    ) : (
                                        // Conditional empty state
                                        myCourses.length > 0 ? (
                                            <div className="col-span-full text-center py-20 text-slate-400 dark:text-slate-500 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl border border-dashed animate-in fade-in">
                                                <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                                <h3 className="text-lg font-medium text-slate-800 dark:text-white">No Courses Found</h3>
                                                <p>Your search for "{courseSearchTerm}" did not match any courses.</p>
                                            </div>
                                        ) : (
                                            <div className="col-span-full text-center py-20 text-slate-400 dark:text-slate-500 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl border border-dashed animate-in fade-in">
                                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                                <h3 className="text-lg font-medium text-slate-800 dark:text-white">No Courses Assigned</h3>
                                                <p>Contact your admin to allocate courses.</p>
                                            </div>
                                        )
                                    )}
                                    </div>
                                </div>
                            )}
                            
                            {/* === HISTORY TAB === */}
                            {activeTab === 'history' && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    {/* SYNC QUEUE STATUS PANEL */}
                                    {queueStats.total > 0 && (
                                        <Card className={`border-2 ${queueStats.failed > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                                            {queueStats.pending > 0 ? '📤 Offline Submissions Queue' : '✅ All Synced!'}
                                                        </h3>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-slate-500 dark:text-slate-400">Total</span>
                                                                <p className="font-bold text-lg text-slate-800 dark:text-white">{queueStats.total}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500 dark:text-slate-400">Pending</span>
                                                                <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{queueStats.pending}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500 dark:text-slate-400">Synced</span>
                                                                <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{queueStats.synced}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500 dark:text-slate-400">Failed</span>
                                                                <p className="font-bold text-lg text-red-600 dark:text-red-400">{queueStats.failed}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {queueStats.pending > 0 && (
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                                                            {isOnline ? '🟢 Online - Syncing...' : '🔴 Offline - Will sync when online'}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Card className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10">
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle className="text-slate-800 dark:text-white">Recent Logs</CardTitle>
                                            <div className="relative w-full max-w-xs">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                                <Input
                                                    placeholder="Filter by course code..."
                                                    className="pl-10 w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                                    value={historySearchTerm}
                                                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {sortedHistoryDates.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                                                        <thead className="text-xs uppercase font-semibold text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                                            <tr>
                                                                <th className="p-4">Time</th>
                                                                <th className="p-4">Course</th>
                                                                <th className="p-4 text-center">Present</th>
                                                                <th className="p-4 text-center">Total</th>
                                                                <th className="p-4 text-right">Status</th>
                                                            </tr>
                                                        </thead>
                                                        {sortedHistoryDates.map(date => (
                                                            <React.Fragment key={date}>
                                                                <tbody>
                                                                    <tr>
                                                                        <td colSpan="5" className="p-3 font-bold text-sm bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-b border-t border-slate-200 dark:border-white/10">
                                                                            {date}
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                                                                    {groupedHistory[date].map((log, index) => (
                                                                        <tr key={`${log.date}-${index}`} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                                                            <td className="p-4 text-slate-800 dark:text-white font-mono text-xs">{new Date(log.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                                                                            <td className="p-4">{log.course_code}</td>
                                                                            <td className="p-4 text-center text-emerald-500 font-bold">{log.present_count}</td>
                                                                            <td className="p-4 text-center">{log.total_students}</td>
                                                                            <td className="p-4 text-right">
                                                                                <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-1 rounded border border-emerald-500/20">Submitted</span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </React.Fragment>
                                                        ))}
                                                    </table>
                                                </div>
                                            ) : (
                                                attendanceHistory.length > 0 ? (
                                                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
                                                        <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                        <h3 className="font-medium text-slate-700 dark:text-slate-300">No Logs Found</h3>
                                                        <p>Your search for "{historySearchTerm}" did not match any logs.</p>
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
                                                        <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                        <p>No recent attendance records found.</p>
                                                    </div>
                                                )
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* === PROFILE TAB === */}
                            {activeTab === 'profile' && (
                                <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
                                    <Card className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10">
                                        <CardHeader className="text-center pb-8 border-b border-dashed border-slate-200 dark:border-white/10">
                                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-4 ring-4 ring-white/10">
                                                {facultyName.charAt(0)}
                                            </div>
                                            <CardTitle className="text-2xl text-slate-800 dark:text-white">{facultyName}</CardTitle>
                                            <p className="text-slate-500 dark:text-slate-400">{facultyDetails.department || "Department N/A"}</p>
                                        </CardHeader>
                                        <CardContent className="pt-8 space-y-4">
                                            <div className="flex items-center p-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100">
                                                <div className="p-3 bg-blue-500/10 rounded-lg mr-4 text-blue-500">
                                                    <BadgeCheck className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Faculty ID</p>
                                                    <p className="font-mono text-slate-800 dark:text-white">{facultyDetails.id || "N/A"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center p-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100">
                                                <div className="p-3 bg-purple-500/10 rounded-lg mr-4 text-purple-500">
                                                    <Mail className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email</p>
                                                    <p className="text-slate-800 dark:text-white">{facultyDetails.email || "No email linked"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center p-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100">
                                                <div className="p-3 bg-emerald-500/10 rounded-lg mr-4 text-emerald-500">
                                                    <GraduationCap className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Role</p>
                                                    <p className="text-slate-800 dark:text-white">Faculty Member</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-6 mt-4 border-t border-slate-200 dark:border-white/10">
                                            <Button 
                                                variant="outline" 
                                                className="w-full gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white" 
                                                onClick={() => navigate('/change-password')}
                                            >
                                                <KeyRound className="h-4 w-4" />
                                                Change Password
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ icon: Icon, label, isActive, onClick, isDarkMode }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
        <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'group-hover:opacity-80'}`} />
        <span className="font-medium text-sm">{label}</span>
    </button>
);

export default FacultyDashboard;
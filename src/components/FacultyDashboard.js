import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Use consistent API helper
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
    Search
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
    const [authChecking, setAuthChecking] = useState(true); 

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

            } catch (e) {
                console.error("Auth Error", e);
                localStorage.clear();
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate]);

    useEffect(() => {
        if (activeTab === 'history' && facultyDetails.id) {
            fetchHistory(facultyDetails.id);
        }
    }, [activeTab, facultyDetails.id]);

    const fetchMyCourses = async (fid) => {
        try {
            const response = await api.get(`/get_faculty_dashboard.php?id=${fid}`);
            if (response.data.status === 'success') {
                setMyCourses(response.data.courses);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (fid) => {
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
                setAttendanceHistory(data.history || []);
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

    const navItems = [
        { id: 'courses', label: 'Courses', icon: LayoutDashboard },
        { id: 'history', label: 'History', icon: Calendar },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-200 selection:bg-indigo-100 dark:selection:bg-blue-500/30 overflow-hidden transition-colors duration-300">
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
            <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-sm z-50 animate-in fade-in duration-500">
                <div className="bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-white/20 backdrop-blur-xl border rounded-2xl shadow-2xl shadow-black/20 flex justify-around items-center p-1 ring-1 ring-black/5">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center justify-center gap-1 w-20 h-14 rounded-lg transition-all duration-300 ${
                                activeTab === item.id 
                                ? 'bg-blue-500/10 text-blue-500' 
                                : `text-slate-500 dark:text-slate-400 hover:bg-white/5`
                            }`}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen relative w-full pb-32 md:pb-8">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-6 pt-8">
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
                        <button onClick={toggleTheme} className="p-2 rounded-full transition-colors border bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-yellow-400 shadow-sm">
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <button onClick={handleLogout} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors border border-red-100 shadow-sm">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Desktop Header */}
                <header className="hidden md:flex justify-between items-center mb-8 animate-in fade-in duration-500">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                            {activeTab === 'courses' && "My Assigned Courses"}
                            {activeTab === 'history' && "Attendance History"}
                            {activeTab === 'profile' && "My Profile"}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your academic activities and student records.</p>
                    </div>
                    <button 
                        onClick={toggleTheme}
                        className="p-3 rounded-full transition-all duration-300 border shadow-sm bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-600 dark:text-yellow-400 hover:bg-slate-50 dark:hover:bg-white/20"
                    >
                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </header>

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
                                    filteredCourses.map((course) => (
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
                                                </div>
                                            </div>
                                            
                                            <Button 
                                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white gap-2 shadow-lg shadow-indigo-500/20 min-w-[160px]"
                                                onClick={() => handleTakeAttendance(course)}
                                            >
                                                Take Attendance <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
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
                                <Card className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10">
                                    <CardHeader>
                                        <CardTitle className="text-slate-800 dark:text-white">Recent Logs</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {attendanceHistory.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                                                    <thead className="text-xs uppercase font-semibold text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-white/10">
                                                        <tr>
                                                            <th className="p-4">Date</th>
                                                            <th className="p-4">Course</th>
                                                            <th className="p-4 text-center">Present</th>
                                                            <th className="p-4 text-center">Total</th>
                                                            <th className="p-4 text-right">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y border-slate-200 dark:border-white/10">
                                                        {attendanceHistory.map((log, index) => (
                                                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                                                <td className="p-4 text-slate-800 dark:text-white">{log.date}</td>
                                                                <td className="p-4">{log.course_code}</td>
                                                                <td className="p-4 text-center text-emerald-500 font-bold">{log.present_count}</td>
                                                                <td className="p-4 text-center">{log.total_students}</td>
                                                                <td className="p-4 text-right">
                                                                    <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-1 rounded border border-emerald-500/20">Submitted</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
                                                <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                <p>No recent attendance records found.</p>
                                            </div>
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
                                </Card>
                            </div>
                        )}
                    </>
                )}
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
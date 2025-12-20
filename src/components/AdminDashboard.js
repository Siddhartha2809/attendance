import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Import your API helper
import { useTheme } from './ThemeContext';
import { 
    Capacitor
} from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { 
    LayoutDashboard, 
    Users, 
    GraduationCap, 
    BookOpen, 
    LogOut, 
    Plus, 
    Search,
    MoreVertical,
    Settings,
    Menu,  
    X,
    UserPlus, 
    FileText, 
    Download, 
    Filter,
    Loader2,
    Sun,
    Moon,
    CheckCircle,
    XCircle,
    Trash2,
    Calendar,
    List
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription
} from './ui/card';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(true);
    const { isDarkMode, toggleTheme } = useTheme();

    // State for Real Data
    const [dashboardData, setDashboardData] = useState({
        stats: { faculty: 0, students: 0, courses: 0 },
        faculty: [],
        allocations: []
    });

    const [adminDept, setAdminDept] = useState("Loading...");
    
    // Initialize with Dummy Data for immediate visualization
    const [facultyList, setFacultyList] = useState([
        { id: 'FAC001', name: 'Dr. Sarah Smith', dept: 'CSE', email: 'sarah@mic.edu' },
        { id: 'FAC002', name: 'Prof. John Doe', dept: 'CSE', email: 'john@mic.edu' }
    ]);
    const [courseList, setCourseList] = useState([
        { code: 'CS101', name: 'Intro to Programming', year: '1', sem: '1' },
        { code: 'CS201', name: 'Data Structures', year: '2', sem: '3' }
    ]); 
    const [studentList, setStudentList] = useState([
        { id: '23CS01', name: 'Alice Johnson', year: '1', dept: 'CSE' },
        { id: '23CS02', name: 'Bob Smith', year: '1', dept: 'CSE' }
    ]); 
    const [allocationList, setAllocationList] = useState([]); 
    const [searchTerm, setSearchTerm] = useState(''); 

    // --- ALLOCATION FORM STATE ---
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [allocating, setAllocating] = useState(false);
    const [allocationFeedback, setAllocationFeedback] = useState({ type: '', message: '' });

    // --- CONFIRMATION DIALOG STATE ---
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    
    // --- REPORT STATE ---
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [reportYear, setReportYear] = useState('');     // Custom Report Year
    const [reportSection, setReportSection] = useState(''); // Custom Report Section
    
    // NEW: Daily Report State
    const [dailyReportYear, setDailyReportYear] = useState('');
    const [dailyReportSection, setDailyReportSection] = useState('');
    
    const [generatingReport, setGeneratingReport] = useState(false);

    // Fetch Data on Component Mount
    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                navigate('/login');
                return;
            }
            try {
                const userObj = JSON.parse(storedUser);
                // Check if role is admin
                if (userObj.role !== 'admin') {
                    navigate('/login');
                    return;
                }
                const dept = userObj.department || userObj.Department || "CSE"; 
                setAdminDept(dept);
                
                // Fetch initial data
                await fetchDashboardData(dept);
            } catch (e) {
                console.error("Auth Error", e);
                navigate('/login');
            }
        };
        checkAuth();
    }, [navigate]);

    const fetchDashboardData = async (dept) => {
        try {
            // Using your existing PHP endpoint structure
            const response = await api.get(`/get_dashboard_data.php?dept=${dept}`);
            
            if (response.data.status === 'success') {
                const data = response.data;
                if (data.stats) setDashboardData(prev => ({ ...prev, stats: data.stats }));
                
                if (data.facultyList && data.facultyList.length > 0) setFacultyList(data.facultyList);
                if (data.courseList && data.courseList.length > 0) setCourseList(data.courseList);
                if (data.studentList && data.studentList.length > 0) setStudentList(data.studentList);
                
                if (data.allocationList) setAllocationList(data.allocationList);
            }
        } catch (error) {
            console.error("API Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearFeedback = () => {
        setAllocationFeedback({ type: '', message: '' });
    };

    // --- ALLOCATION & DELETION HANDLERS ---

    const handleAllocate = async () => {
        if (!selectedFaculty || !selectedCourse) {
            alert("Please select both a Faculty member and a Course.");
            return;
        }

        setAllocating(true);
        clearFeedback();

        const facObj = facultyList.find(f => f.id === selectedFaculty);
        const courseObj = courseList.find(c => c.code === selectedCourse);

        const payload = {
            faculty_id: facObj.id,
            faculty_name: facObj.name,
            course_code: courseObj.code,
            course_name: courseObj.name,
            department: adminDept,
            year: courseObj.year,
            sem: courseObj.sem
        };

        try {
            const response = await api.post('/save_allocation.php', payload);
            
            if (response.data.status === 'success') {
                setAllocationFeedback({ type: 'success', message: response.data.message });
                fetchDashboardData(adminDept); // Refresh list
                setSelectedFaculty('');
                setSelectedCourse('');
            } else {
                setAllocationFeedback({ type: 'error', message: response.data.message });
            }
        } catch (error) {
            setAllocationFeedback({ type: 'error', message: 'Network Error: Could not save allocation.' });
        } finally {
            setAllocating(false);
            setTimeout(clearFeedback, 5000); // Clear feedback after 5 seconds
        }
    };

    const openDeleteConfirmation = (allocation) => {
        setItemToDelete(allocation);
        setIsConfirmOpen(true);
    };

    const handleGenerateReport = async (type) => {
        let url = '';
        
        // --- UPDATED LOGIC: Use separate endpoint for Custom reports ---
        if (type === 'custom') {
            if (!customStartDate || !customEndDate) {
                alert("Please select both start and end dates.");
                return;
            }
            // Use generate_custom_report.php
            url = `http://192.168.1.4/attendance_api/generate_custom_report.php?dept=${adminDept}`;
            url += `&start=${customStartDate}&end=${customEndDate}`;
            
            if (reportYear) url += `&year=${reportYear}`;
            if (reportSection) url += `&sec=${reportSection}`;
            
        } else if (type === 'Daily') {
            // Use generate_report.php for Daily
            url = `http://192.168.1.4/attendance_api/generate_report.php?type=${type}&dept=${adminDept}`;
            
            if (dailyReportYear) url += `&year=${dailyReportYear}`;
            if (dailyReportSection) url += `&sec=${dailyReportSection}`;
        }

        setGeneratingReport(true);

        try {
            // Open in new tab for PDF Print View
            window.open(url, '_blank');
            
        } catch (error) {
            console.error("Report Error:", error);
            alert("Failed to generate report.");
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            navigate('/login');
        }
    };

    // --- FILTERS ---
    const filteredFaculty = facultyList.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredStudents = studentList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())); 
    const filteredCourses = courseList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const stats = [
        { title: "Dept Faculty", value: dashboardData.stats.faculty || facultyList.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        { title: "Dept Students", value: dashboardData.stats.students || studentList.length, icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { title: "Active Courses", value: dashboardData.stats.courses || courseList.length, icon: BookOpen, color: "text-purple-400", bg: "bg-purple-500/10" },
    ];

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'faculty', label: 'Faculty', icon: Users },
        { id: 'students', label: 'Students', icon: GraduationCap },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'allocation', label: 'Allocations', icon: UserPlus },
        { id: 'reports', label: 'Reports', icon: FileText },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-200 selection:bg-blue-100 dark:selection:bg-blue-500/30 overflow-hidden relative transition-colors duration-300">
            {/* iOS-inspired liquid background */}
            <div style={{ animationDelay: '0s' }} className={`fixed -top-1/4 -left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-30 animate-pulse ${isDarkMode ? 'bg-violet-600' : 'bg-violet-200'}`} />
            <div style={{ animationDelay: '2s' }} className={`fixed -bottom-1/4 -right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-30 animate-pulse ${isDarkMode ? 'bg-sky-600' : 'bg-sky-200'}`} />
            <div style={{ animationDelay: '4s' }} className={`fixed -bottom-1/4 -left-1/3 w-80 h-80 rounded-full blur-[120px] opacity-30 animate-pulse ${isDarkMode ? 'bg-rose-600' : 'bg-rose-200'}`} />
            
            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:flex fixed top-0 left-0 z-40 h-screen w-64 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex-col transition-all duration-300 shadow-xl">
                <div className="p-6 flex items-center gap-4 border-b border-slate-100 dark:border-white/5">
                    <div className="h-10 w-10 bg-blue-50 dark:bg-white/10 rounded-xl flex items-center justify-center border border-blue-100 dark:border-white/10 shadow-sm">
                        <img src="/logo-small.png" alt="Logo" className="h-8 w-auto object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-white tracking-wide text-lg leading-tight">MIC</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-widest font-semibold">Admin Portal</span>
                    </div>
                </div>
                
                <div className="px-6 py-4 flex-1 overflow-y-auto scrollbar-thin">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-2">Manage</div>
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

                <div className="p-6 border-t border-slate-100 dark:border-white/5">
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
                            <span className="text-[10px] font-medium text-center">
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
                        <div className="h-10 w-10 bg-blue-50 dark:bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-slate-200 dark:border-white/10 shadow-sm">
                            <img src="/logo-small.png" alt="Logo" className="h-8 w-auto object-contain" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-800 dark:text-white text-lg block leading-tight">MIC Admin</span>
                            <span className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-widest font-semibold">{adminDept}</span>
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
                <header className="hidden md:flex justify-between items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                            {activeTab === 'overview' && `${adminDept} Dashboard`}
                            {activeTab !== 'overview' && activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Managing data for <strong>{adminDept}</strong> Department.
                        </p>
                    </div>
                    <button 
                        onClick={toggleTheme}
                        className="p-3 rounded-full transition-all duration-300 border shadow-sm bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-600 dark:text-yellow-400 hover:bg-slate-50 dark:hover:bg-white/20"
                    >
                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </header>

                {/* --- CONTENT VIEWS --- */}

                {/* --- CONFIRMATION DIALOG --- */}
                {isConfirmOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
                        <Card className="w-full max-w-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                                    <Trash2 className="h-5 w-5 text-red-500"/> Confirm Deletion
                                </CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400">
                                    Are you sure you want to delete this allocation? This action cannot be undone.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 p-4 rounded-lg border border-slate-200 dark:border-white/10 mx-6">
                                <p><strong className="text-slate-800 dark:text-white">{itemToDelete?.CourseName}</strong></p>
                                <p className="text-slate-500 dark:text-slate-400">Allocated to: {itemToDelete?.FacultyName}</p>
                            </CardContent>
                            <div className="p-6 flex justify-end gap-4">
                                <Button variant="ghost" className="hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white" onClick={() => setIsConfirmOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}



                {/* 1. OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {stats.map((stat, index) => (
                                <Card key={index} className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-md hover:translate-y-[-2px] transition-transform">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {stat.title}
                                        </CardTitle>
                                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-slate-800 dark:text-white">{stat.value}</div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Current Academic Year</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Recent Activity */}
                        <Card className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="text-slate-800 dark:text-white">Recent Department Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-slate-500 dark:text-slate-400">
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                <span>System check performed</span>
                                            </div>
                                            <span className="text-xs opacity-70">Just now</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 2. FACULTY MANAGEMENT */}
                {activeTab === 'faculty' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
                         <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <Input 
                                    placeholder="Search faculty..." 
                                    className="pl-10 bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 w-full md:w-auto">
                                <Plus className="h-4 w-4" /> Add Faculty
                            </Button>
                        </div>

                        <DataTable 
                            isDarkMode={isDarkMode}
                            headers={['Name', 'Department', 'Status', 'Actions']}
                            rows={filteredFaculty.map(f => [
                                <span className="font-medium text-slate-800 dark:text-white">{f.name}</span>,
                                f.dept || "Unassigned",
                                <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Active</span>,
                                <Button variant="ghost" size="icon" className="hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            ])}
                            emptyMessage="No faculty found."
                        />
                    </div>
                )}

                {/* 3. STUDENTS MANAGEMENT (RESTORED) */}
                {activeTab === 'students' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
                         <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <Input 
                                    placeholder="Search students..." 
                                    className="pl-10 bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 w-full md:w-auto">
                                <Plus className="h-4 w-4" /> Add Student
                            </Button>
                        </div>

                        <DataTable 
                            isDarkMode={isDarkMode}
                            headers={['Roll No', 'Name', 'Year', 'Department', 'Actions']}
                            rows={filteredStudents.map(s => [
                                <span className="font-mono text-blue-400">{s.id}</span>,
                                <span className="font-medium text-slate-800 dark:text-white">{s.name}</span>,
                                s.year + " Year",
                                s.dept,
                                <Button variant="ghost" size="icon" className="hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            ])}
                            emptyMessage="No students found."
                        />
                    </div>
                )}

                {/* 4. COURSES MANAGEMENT (RESTORED) */}
                {activeTab === 'courses' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
                         <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <Input 
                                    placeholder="Search courses..." 
                                    className="pl-10 bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 w-full md:w-auto">
                                <Plus className="h-4 w-4" /> Add Course
                            </Button>
                        </div>

                        <DataTable 
                            isDarkMode={isDarkMode}
                            headers={['Code', 'Course Name', 'Year', 'Semester', 'Actions']}
                            rows={filteredCourses.map(c => [
                                <span className="font-mono text-purple-400">{c.code}</span>,
                                <span className="font-medium text-slate-800 dark:text-white">{c.name}</span>,
                                c.year + " Year",
                                "Sem " + c.sem,
                                <Button variant="ghost" size="icon" className="hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            ])}
                            emptyMessage="No courses found."
                        />
                    </div>
                )}

                {/* 5. FACULTY ALLOCATION */}
                {activeTab === 'allocation' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
                        {/* Allocation Form */}
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><UserPlus className="h-5 w-5 text-blue-400"/> New Allocation</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Select Faculty</label>
                                    <select 
                                        className="w-full bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none border dark:border-white/10"
                                        value={selectedFaculty}
                                        onChange={(e) => setSelectedFaculty(e.target.value)}
                                    >
                                        <option value="" className={isDarkMode ? "text-black" : "text-slate-900"}>-- Choose Faculty --</option>
                                        {facultyList.map(f => <option key={f.id} value={f.id} className={isDarkMode ? "text-black" : "text-slate-900"}>{f.name} ({f.id})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Select Course</label>
                                    <select 
                                        className="w-full bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none border dark:border-white/10"
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                    >
                                        <option value="" className={isDarkMode ? "text-black" : "text-slate-900"}>-- Choose Course --</option>
                                        {courseList.map(c => <option key={c.code} value={c.code} className={isDarkMode ? "text-black" : "text-slate-900"}>{c.code} - {c.name}</option>)}
                                    </select>
                                </div>
                                <Button 
                                    onClick={handleAllocate} 
                                    disabled={allocating}
                                    className="bg-blue-600 hover:bg-blue-500 text-white w-full"
                                >
                                    {allocating ? "Saving..." : "Allocate Course"}
                                </Button>
                            </div>
                            {/* --- ALLOCATION FEEDBACK --- */}
                            {allocationFeedback.message && (
                                <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-3 border animate-in fade-in-5 slide-in-from-bottom-2 duration-500 ${
                                    allocationFeedback.type === 'success' 
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                                    : 'bg-red-500/10 text-red-300 border-red-500/20'
                                }`}>
                                    {allocationFeedback.type === 'success' 
                                        ? <CheckCircle className="h-5 w-5" /> 
                                        : <XCircle className="h-5 w-5" />
                                    }
                                    <span>{allocationFeedback.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Allocation List */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Current Allocations</h3>
                            <DataTable 
                                isDarkMode={isDarkMode}
                                headers={['Course', 'Faculty', 'Code', 'Actions']}
                                rows={allocationList.map(alloc => [
                                    <span className="font-medium text-slate-800 dark:text-white">{alloc.CourseName}</span>,
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                                            {alloc.FacultyName ? alloc.FacultyName.charAt(0) : "?"}
                                        </div>
                                        <span className="text-slate-900 dark:text-slate-200">{alloc.FacultyName || <span className="text-red-400">Unassigned</span>}</span>
                                    </div>,
                                    <span className="px-2 py-1 rounded-md text-xs border bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white">{alloc.CourseCode}</span>,
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-red-500/70 hover:bg-red-500/10 hover:text-red-500 h-8 w-8"
                                        onClick={() => openDeleteConfirmation(alloc)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                ])}
                                emptyMessage="No allocations found."
                            />
                        </div>
                    </div>
                )}

                {/* 6. REPORTS (Updated to Daily & Custom) */}
                {activeTab === 'reports' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white">Attendance Reports</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Daily Report Card */}
                            <Card className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-md hover:border-blue-500/30 transition-all group">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-xl bg-blue-500/10 mb-4 ring-1 ring-blue-500/20">
                                            <FileText className="h-8 w-8 text-blue-400" />
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded border bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5">
                                            Automated
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-blue-400 transition-colors text-slate-800 dark:text-white">
                                        Daily Report
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 dark:text-slate-400">
                                        Generate a consolidated attendance report for today across all active courses in {adminDept}.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     {/* Daily Report Filters */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block uppercase tracking-wide font-semibold">Year</label>
                                            <select 
                                                className="w-full py-2 px-3 rounded-lg text-sm outline-none border transition-all bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:border-white/10 focus:ring-2 focus:ring-blue-500/50"
                                                value={dailyReportYear}
                                                onChange={(e) => setDailyReportYear(e.target.value)}
                                            >
                                                <option value="" className={isDarkMode ? "text-black" : "text-slate-900"}>All Years</option>
                                                <option value="1" className={isDarkMode ? "text-black" : "text-slate-900"}>1st Year</option>
                                                <option value="2" className={isDarkMode ? "text-black" : "text-slate-900"}>2nd Year</option>
                                                <option value="3" className={isDarkMode ? "text-black" : "text-slate-900"}>3rd Year</option>
                                                <option value="4" className={isDarkMode ? "text-black" : "text-slate-900"}>4th Year</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block uppercase tracking-wide font-semibold">Section</label>
                                            <select 
                                                className="w-full py-2 px-3 rounded-lg text-sm outline-none border transition-all bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:border-white/10 focus:ring-2 focus:ring-blue-500/50"
                                                value={dailyReportSection}
                                                onChange={(e) => setDailyReportSection(e.target.value)}
                                            >
                                                <option value="" className={isDarkMode ? "text-black" : "text-slate-900"}>All Sections</option>
                                                <option value="A" className={isDarkMode ? "text-black" : "text-slate-900"}>A</option>
                                                <option value="B" className={isDarkMode ? "text-black" : "text-slate-900"}>B</option>
                                                <option value="C" className={isDarkMode ? "text-black" : "text-slate-900"}>C</option>
                                                <option value="D" className={isDarkMode ? "text-black" : "text-slate-900"}>D</option>
                                                <option value="E" className={isDarkMode ? "text-black" : "text-slate-900"}>E</option>
                                                <option value="F" className={isDarkMode ? "text-black" : "text-slate-900"}>F</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button 
                                        className="w-full h-12 text-base border transition-all gap-2 bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-600 dark:hover:text-white text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                                        onClick={() => handleGenerateReport('Daily')}
                                    >
                                        <Download className="h-5 w-5" /> Download Today's Report
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Customised Report Card */}
                            <Card className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-md hover:border-purple-500/30 transition-all group">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-xl bg-purple-500/10 mb-4 ring-1 ring-purple-500/20">
                                            <Filter className="h-8 w-8 text-purple-400" />
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded border bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5">
                                            Custom
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-purple-400 transition-colors text-slate-800 dark:text-white">
                                        Customised Report
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 dark:text-slate-400">
                                        Select filters to analyze attendance trends.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block uppercase tracking-wide font-semibold">Start Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                                <input 
                                                    type="date" 
                                                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none border transition-all bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:border-white/10 focus:ring-2 focus:ring-purple-500/50"
                                                    value={customStartDate}
                                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block uppercase tracking-wide font-semibold">End Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                                <input 
                                                    type="date" 
                                                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none border transition-all bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:border-white/10 focus:ring-2 focus:ring-purple-500/50"
                                                    value={customEndDate}
                                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* NEW: Additional Filters (Year & Section) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block uppercase tracking-wide font-semibold">Year</label>
                                            <select 
                                                className="w-full py-2 px-3 rounded-lg text-sm outline-none border transition-all bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:border-white/10 focus:ring-2 focus:ring-purple-500/50"
                                                value={reportYear}
                                                onChange={(e) => setReportYear(e.target.value)}
                                            >
                                                <option value="" className={isDarkMode ? "text-black" : "text-slate-900"}>All Years</option>
                                                <option value="1" className={isDarkMode ? "text-black" : "text-slate-900"}>1st Year</option>
                                                <option value="2" className={isDarkMode ? "text-black" : "text-slate-900"}>2nd Year</option>
                                                <option value="3" className={isDarkMode ? "text-black" : "text-slate-900"}>3rd Year</option>
                                                <option value="4" className={isDarkMode ? "text-black" : "text-slate-900"}>4th Year</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block uppercase tracking-wide font-semibold">Section</label>
                                            <select 
                                                className="w-full py-2 px-3 rounded-lg text-sm outline-none border transition-all bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:border-white/10 focus:ring-2 focus:ring-purple-500/50"
                                                value={reportSection}
                                                onChange={(e) => setReportSection(e.target.value)}
                                            >
                                                <option value="" className={isDarkMode ? "text-black" : "text-slate-900"}>All Sections</option>
                                                <option value="A" className={isDarkMode ? "text-black" : "text-slate-900"}>A</option>
                                                <option value="B" className={isDarkMode ? "text-black" : "text-slate-900"}>B</option>
                                                <option value="C" className={isDarkMode ? "text-black" : "text-slate-900"}>C</option>
                                                <option value="D" className={isDarkMode ? "text-black" : "text-slate-900"}>D</option>
                                                <option value="E" className={isDarkMode ? "text-black" : "text-slate-900"}>E</option>
                                                <option value="F" className={isDarkMode ? "text-black" : "text-slate-900"}>F</option>
                                            </select>
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full h-12 text-base border transition-all gap-2 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-600 dark:hover:text-white text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                                        onClick={() => handleGenerateReport('custom')}
                                    >
                                        <FileText className="h-5 w-5" /> Generate Report
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

const NavItem = ({ icon: Icon, label, isActive, onClick, isDarkMode }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
        <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'group-hover:opacity-80'}`} />
        <span className="font-medium text-sm">{label}</span>
    </button>
);

const DataTable = ({ headers, rows, isDarkMode, emptyMessage }) => (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-sm overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400 min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-200 uppercase tracking-wider text-xs font-semibold">
                <tr>{headers.map((h, i) => <th key={i} className="p-4">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y border-slate-200 dark:border-white/10">
                {rows.length > 0 ? rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        {row.map((cell, j) => <td key={j} className="p-4">{cell}</td>)}
                    </tr>
                )) : (
                    <tr><td colSpan={headers.length} className="p-8 text-center">{emptyMessage}</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

export default AdminDashboard;
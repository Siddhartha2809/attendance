import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { useTheme } from './ThemeContext';
import { 
    ArrowLeft, 
    Save, 
    CheckCircle2, 
    XCircle, 
    Search, 
    Calendar,
    Sun,
    Moon,
    User,
    Users
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const TakeAttendance = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { course } = location.state || {}; 

    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [runtimeError, setRuntimeError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const { isDarkMode, toggleTheme } = useTheme();

    useEffect(() => {
        if (!course) {
            navigate('/faculty-dashboard');
            return;
        }
        fetchStudents();
    }, [course, navigate]);

    // Capture runtime errors/unhandled rejections so silent errors become visible in-app
    useEffect(() => {
        const onError = (event) => {
            try {
                const message = event?.message || (event && String(event)) || 'Unknown error';
                console.error('Runtime error captured:', event);
                setRuntimeError(message);
            } catch (e) {
                console.error('Error handling onError', e);
            }
        };

        const onRejection = (event) => {
            try {
                const reason = event?.reason;
                console.error('Unhandled rejection captured:', reason);
                setRuntimeError(reason?.message || String(reason));
            } catch (e) {
                console.error('Error handling onRejection', e);
            }
        };

        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);
        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
        };
    }, []);

    const fetchStudents = async () => {
        try {
            // Using API helper
            // Changed endpoint to get_class_students.php as requested
            const response = await api.get(`/get_class_students.php?dept=${course.department || course.branch}&year=${course.year}&sem=${course.sem}&sec=${course.section || ''}`);
            
            if (response.data.status === 'success') {
                // Map API response (id, name) to state structure if needed, or use as is.
                // API returns: { id: "...", name: "..." }
                // State uses: id (rollno), name (student_name)
                const mappedStudents = response.data.students.map(s => ({
                    rollno: s.id,       // Map API 'id' to 'rollno'
                    student_name: s.name // Map API 'name' to 'student_name'
                }));

                setStudents(mappedStudents);
                
                const initialAttendance = {};
                mappedStudents.forEach(s => {
                    initialAttendance[s.rollno] = 'Present';
                });
                setAttendance(initialAttendance);
            } else {
                console.error("Failed to load students:", response.data.message);
                setStudents([]); 
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (rollno) => {
        if (!rollno) {
            console.warn('toggleStatus called with invalid rollno:', rollno);
            return;
        }

        setAttendance(prev => ({
            ...prev,
            [rollno]: prev[rollno] === 'Present' ? 'Absent' : 'Present'
        }));
    };

    const markAll = (status) => {
        const newAttendance = {};
        students.forEach(s => {
            // Check against search term before bulk marking
            const name = s.student_name || "";
            const roll = s.rollno || "";
            
            if (name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                roll.toLowerCase().includes(searchTerm.toLowerCase())) {
                newAttendance[s.rollno] = status;
            } else {
                newAttendance[s.rollno] = attendance[s.rollno];
            }
        });
        setAttendance(prev => ({ ...prev, ...newAttendance }));
    };

    const handleSubmit = async () => {
        if (!window.confirm(`Submit attendance for ${date}? This cannot be undone.`)) return;

        setSubmitting(true);
        try {
            const stored = localStorage.getItem('user');
            let user = null;
            if (stored) {
                try {
                    user = JSON.parse(stored);
                } catch (e) {
                    console.error('Failed to parse user from localStorage', e);
                }
            }

            if (!user || !user.id) {
                alert('No logged-in user found. Please login again.');
                setSubmitting(false);
                return;
            }

            // Build rich records array with Names
            const richRecords = students.map(student => ({
                id: student.rollno,
                name: student.student_name,
                status: attendance[student.rollno] || 'Absent' // Default to Absent if missing
            }));

            const payload = {
                course_code: course.course_code,
                faculty_id: user.id,
                date: date,
                records: richRecords,
                department: course.department || course.branch,
                year: course.year,
                sem: course.sem,
                section: course.section || 'A'
            };

            console.log('Submitting attendance payload:', payload);

            let response;
            try {
                response = await api.post('/save_attendance.php', payload);
                console.log('Submit response:', response);
            } catch (err) {
                console.error('API request failed:', err);
                const serverPayload = err?.response?.data || err?.response || err;
                setRuntimeError(typeof serverPayload === 'string' ? serverPayload : JSON.stringify(serverPayload, null, 2));
                alert('Failed to submit attendance. Network or server error. See overlay for details.');
                setSubmitting(false);
                return;
            }

            if (response?.data?.status === 'success') {
                alert('Attendance submitted successfully!');
                navigate('/faculty-dashboard');
            } else {
                console.error('Submit returned non-success:', response?.data);
                setRuntimeError(JSON.stringify(response?.data || response, null, 2));
                alert('Error: ' + (response?.data?.message || 'Unknown server error.'));
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit attendance. Please try again.');
            setRuntimeError(error?.message || String(error));
        } finally {
            setSubmitting(false);
        }
    };

    // Robust filter logic with null checks
    const filteredStudents = students.filter(s => {
        const name = s.student_name || ""; // Default to empty string if undefined
        const roll = s.rollno || "";       // Default to empty string if undefined
        return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               roll.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (runtimeError) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 p-4">
            <div className="max-w-xl w-full p-6 rounded-lg border bg-white dark:bg-white/5 border-slate-200 dark:border-white/10">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">An error occurred</h2>
                <pre className="text-sm whitespace-pre-wrap text-slate-500 dark:text-slate-400 mb-4">{String(runtimeError)}</pre>
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setRuntimeError(null)}>Dismiss</Button>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400">Loading Class List...</div>;

    const presentCount = Object.values(attendance).filter(v => v === 'Present').length;
    const absentCount = Object.values(attendance).filter(v => v === 'Absent').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200 pb-32 transition-colors duration-300 relative">
            {/* iOS-inspired liquid background */}
            <div style={{ animationDelay: '0s' }} className={`fixed -top-1/4 -left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-30 animate-pulse ${isDarkMode ? 'bg-violet-600' : 'bg-violet-200'}`} />
            <div style={{ animationDelay: '2s' }} className={`fixed -bottom-1/4 -right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-30 animate-pulse ${isDarkMode ? 'bg-sky-600' : 'bg-sky-200'}`} />
            <div style={{ animationDelay: '4s' }} className={`fixed -bottom-1/4 -left-1/3 w-80 h-80 rounded-full blur-[120px] opacity-30 animate-pulse ${isDarkMode ? 'bg-rose-600' : 'bg-rose-200'}`} />

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 backdrop-blur-md border-b bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/5 transition-colors duration-300 pt-8">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/10 -ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Mark Attendance</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                    {course?.course_code}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px] sm:max-w-xs">{course?.course_name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                            <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent border-none text-sm focus:outline-none text-slate-800 dark:text-white w-[110px]"
                            />
                        </div>
                        <button 
                            onClick={toggleTheme}
                            className="p-2 rounded-full transition-all duration-300 border shadow-sm bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-600 dark:text-yellow-400 hover:bg-slate-50 dark:hover:bg-white/20"
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 space-y-6">
                {/* Control Panel */}
                <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border-slate-200 dark:border-white/10 shadow-sm">
                    <CardHeader className="p-4 border-b border-slate-200 dark:border-white/10">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <Input 
                                    placeholder="Search by name or roll number..." 
                                    className="pl-10 bg-white/0 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => markAll('Present')}
                                    className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-500/5 dark:border-emerald-500/20 dark:hover:bg-emerald-500/10 dark:text-emerald-400"
                                >
                                    Mark All Present
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => markAll('Absent')}
                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:bg-red-500/5 dark:border-red-500/20 dark:hover:bg-red-500/10 dark:text-red-400"
                                >
                                    Mark All Absent
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 flex justify-center gap-6 text-center">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <div>
                                <span className="text-2xl font-bold text-slate-800 dark:text-white">{presentCount}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">Present</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <div>
                                <span className="text-2xl font-bold text-slate-800 dark:text-white">{absentCount}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">Absent</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            <div>
                                <span className="text-2xl font-bold text-slate-800 dark:text-white">{students.length}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">Total</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Student List Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => {
                            const isPresent = attendance[student.rollno] === 'Present';
                            return (
                                <div 
                                    key={student.rollno}
                                    onClick={() => toggleStatus(student.rollno)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 group ${
                                        isPresent 
                                        ? 'bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-lg'
                                        : 'bg-red-500/10 dark:bg-red-500/10 border-red-500/20 dark:border-red-500/30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                                isPresent 
                                                ? 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300' 
                                                : 'bg-red-500/20 text-red-500'
                                            }`}>
                                                {student.student_name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{student.student_name}</p>
                                                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{student.rollno}</p>
                                            </div>
                                        </div>
                                        <div className={`h-3 w-3 rounded-full transition-colors ${isPresent ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-20 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white">No Students Found</h3>
                            <p>Your search for "{searchTerm}" did not match any students.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40">
                <div className="max-w-5xl mx-auto p-4">
                    <div className="bg-white/50 dark:bg-black/30 backdrop-blur-2xl border border-slate-900/10 dark:border-white/10 rounded-2xl p-3 flex justify-between items-center shadow-2xl shadow-black/20">
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">
                            <span className="font-bold text-neutral-800 dark:text-neutral-200">{presentCount}</span> Present, <span className="font-bold text-neutral-800 dark:text-neutral-200">{absentCount}</span> Absent
                        </div>
                        <Button 
                            size="lg" 
                            className={`w-full sm:w-auto text-white shadow-lg shadow-indigo-500/20 gap-2 px-6 rounded-xl transition-all active:scale-95 font-semibold ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-sky-500 to-indigo-500'}`}
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                "Saving..."
                            ) : (
                                <><Save className="h-4 w-4" /> Submit Attendance</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TakeAttendance;
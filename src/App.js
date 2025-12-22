import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from './components/ThemeContext'; // Corrected path
import { NetworkProvider } from './NetworkContext';
import Login from './components/Login'; 
import LandingPage from './components/LandingPage'; 
import ChangePassword from './components/ChangePassword'; 
import AdminDashboard from './components/AdminDashboard'; 
import FacultyDashboard from './components/FacultyDashboard'; 
import TakeAttendance from './components/TakeAttendance'; 
import NetworkStatusIndicator from './NetworkStatusIndicator';

// --- Internal Splash Screen Component ---
const SplashScreen = ({ onFinish }) => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Wait for 2 seconds before finishing
    const finishTimer = setTimeout(onFinish, 2000);
    return () => {
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <motion.div 
      className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-slate-100'}`}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* Subtle background lighting for light theme */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] ${isDarkMode ? 'bg-cyan-500/10' : 'bg-gray-400/10'}`} />
      
      {/* Glassmorphism card for the logo */}
      <div className={`relative z-10 p-6 rounded-3xl backdrop-blur-xl border shadow-xl animate-in fade-in zoom-in-95 duration-1000 ${isDarkMode ? 'bg-white/5 border-white/10 shadow-black/20' : 'bg-white/50 border-black/5 shadow-black/5'}`}>
        <img 
          src="/logo-small.png" 
          alt="Institute Logo" 
          className="h-32 w-auto object-contain drop-shadow-lg" 
        />
      </div>
    </motion.div>
  );
};

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <SplashScreen key="splash" onFinish={() => setShowSplash(false)} />
      ) : (
        <motion.div key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <NetworkStatusIndicator />
          <Routes location={location}>
            {/* Routes without the main layout (e.g., Login) */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/landing" element={<LandingPage />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
            <Route path="/take-attendance" element={<TakeAttendance />} />

            {/* Fallback for any other unknown routes */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <Router>
          <AppContent />
        </Router>
      </NetworkProvider>
    </ThemeProvider>
  );
}

export default App;
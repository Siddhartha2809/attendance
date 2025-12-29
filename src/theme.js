/**
 * Provides a consistent set of TailwindCSS classes for different UI components
 * based on the current theme (light/dark).
 * @param {boolean} isDarkMode - True if dark mode is active.
 * @returns {object} An object with class strings for various components.
 */
export const getThemeClasses = (isDarkMode) => ({
    // General
    bg: isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-white to-slate-100',
    text: isDarkMode ? 'text-neutral-200' : 'text-neutral-800',
    headerText: isDarkMode ? 'text-white' : 'text-black',
    subText: isDarkMode ? 'text-neutral-400' : 'text-neutral-500',

    // Auth pages (Login, Change Password)
    authCard: isDarkMode 
        ? 'bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl shadow-black/20' 
        : 'bg-white/60 border border-white/30 backdrop-blur-3xl shadow-2xl shadow-black/10',

    // Dashboard pages
    sidebar: isDarkMode ? 'bg-black/30 border-r border-white/10 backdrop-blur-2xl' : 'bg-white/50 border-r border-slate-900/10 backdrop-blur-2xl',
    dashboardCard: isDarkMode ? 'bg-white/10 backdrop-blur-xl' : 'bg-white/70 backdrop-blur-xl',
    cardBorder: isDarkMode ? 'border-white/10' : 'border-slate-900/10',

    // Inputs and Buttons
    input: isDarkMode ? 'bg-white/10 border-white/20 placeholder:text-neutral-400' : 'bg-black/5 border-black/10 placeholder:text-neutral-500',
    button: {
        primary: isDarkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white',
        ghost: isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5',
    },

    // Take Attendance specific
    stickyHeaderBg: isDarkMode ? 'bg-black/50 backdrop-blur-xl border-b border-white/10' : 'bg-white/80 backdrop-blur-xl border-b border-slate-900/10',
    presentBg: isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-400/20 border-emerald-500/30',
    absentBg: isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-400/20 border-red-500/30',
});
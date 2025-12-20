import React, { createContext, useState, useEffect, useContext } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Get theme from localStorage or default to 'light'
        return localStorage.getItem('theme') || 'light';
    });

    const isDarkMode = theme === 'dark';

    // Effect to update localStorage and body class
    useEffect(() => {
        localStorage.setItem('theme', theme);
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    // Effect to update Capacitor StatusBar style for native app
    useEffect(() => {
        const setStatusBarStyle = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    await StatusBar.setStyle({
                        style: isDarkMode ? Style.Dark : Style.Light,
                    });
                    await StatusBar.setBackgroundColor({
                        color: isDarkMode ? '#020617' : '#f8fafc' // slate-950 and slate-50
                    });
                } catch (e) {
                    console.error("Failed to set status bar style", e);
                }
            }
        };
        setStatusBarStyle();
    }, [isDarkMode]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
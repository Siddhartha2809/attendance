import React, { createContext, useState, useEffect, useContext } from 'react';

const NetworkContext = createContext();

export const useNetworkStatus = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        // 1. Browser native events for quick updates
        const handleOnline = () => {
            console.log('Browser event: online');
            setIsOnline(true);
        };
        const handleOffline = () => {
            console.log('Browser event: offline');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // 2. Polling mechanism to verify actual internet access more frequently
        const checkConnectivity = async () => {
            try {
                // A lightweight HEAD request to the server's root is a good way to check.
                // The cache-busting query param ensures we don't get a stale result.
                await fetch(`/?_=${new Date().getTime()}`, {
                    method: 'HEAD',
                    cache: 'no-store',
                });

                // If the request succeeds, we are online.
                setIsOnline(currentStatus => {
                    if (!currentStatus) console.log('Polling check: now online');
                    return true;
                });
            } catch (error) {
                // If fetch throws an error, it's a network issue.
                setIsOnline(currentStatus => {
                    if (currentStatus) console.log('Polling check: now offline');
                    return false;
                });
            }
        };

        // Check every 3 seconds, as requested for a shorter interval.
        const intervalId = setInterval(checkConnectivity, 3000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(intervalId);
        };
    }, []); // This effect runs only once on component mount.

    return (
        <NetworkContext.Provider value={{ isOnline }}>
            {children}
        </NetworkContext.Provider>
    );
};
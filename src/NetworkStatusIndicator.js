import React from 'react';
import { useNetworkStatus } from './NetworkContext';
import { WifiOff } from 'lucide-react';

const NetworkStatusIndicator = () => {
    const { isOnline } = useNetworkStatus();

    if (isOnline) {
        return null;
    }

    return (
        <div 
            className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white flex items-center justify-center gap-2 py-2 text-sm font-semibold shadow-lg"
            role="alert"
        >
            <WifiOff className="h-5 w-5" />
            <span>You are currently offline. Changes will sync when you're back online.</span>
        </div>
    );
};

export default NetworkStatusIndicator;
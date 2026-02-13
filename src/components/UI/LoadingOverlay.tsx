import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Loading..." }) => {
    return (
        <div className="absolute inset-0 z-[500] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-600 font-medium animate-pulse">{message}</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;

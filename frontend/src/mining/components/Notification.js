import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export const Notification = ({ message, type, duration = 5000, onClose, }) => {
    const [isVisible, setIsVisible] = useState(true);
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [duration, onClose]);
    const bgColor = {
        success: 'bg-green-500/20 border-green-500',
        error: 'bg-red-500/20 border-red-500',
        info: 'bg-blue-500/20 border-blue-500',
    }[type];
    const textColor = {
        success: 'text-green-400',
        error: 'text-red-400',
        info: 'text-blue-400',
    }[type];
    if (!isVisible)
        return null;
    return (_jsx("div", { className: `fixed bottom-4 right-4 p-4 rounded-lg border ${bgColor} ${textColor} max-w-sm shadow-lg`, children: _jsx("p", { className: "font-medium", children: message }) }));
};

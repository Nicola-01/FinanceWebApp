import { useState, useEffect } from 'react';

export const useMobileMath = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const mobile = window.matchMedia("(pointer: coarse)").matches;
        setIsMobile(mobile);

        if (!mobile || !window.visualViewport) return;

        const handleViewportChange = () => {
            const vv = window.visualViewport!;
            // L'altezza della tastiera è la differenza tra il layout viewport e il visual viewport
            const kbHeight = window.innerHeight - vv.height - vv.offsetTop;
            setKeyboardHeight(Math.max(0, kbHeight));
        };

        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);

        return () => {
            window.visualViewport?.removeEventListener('resize', handleViewportChange);
            window.visualViewport?.removeEventListener('scroll', handleViewportChange);
        };
    }, []);

    return { isMobile, keyboardHeight };
};

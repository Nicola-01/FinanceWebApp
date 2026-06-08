import React, { useState, useEffect } from 'react';

export const useMobileMath = () => {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        // Detect touch/mobile device
        const checkMobile = () => window.matchMedia("(pointer: coarse)").matches;
        setIsMobile(checkMobile());

        if (!window.visualViewport) return;

        const handleResize = () => {
            const vv = window.visualViewport!;
            const isFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
            
            // Layout calculations for toolbar positioning above virtual keyboard
            const bottom = window.innerHeight - (vv.height + vv.offsetTop);
            const isOpen = isFocused && (window.innerHeight - vv.height > 150);

            setIsKeyboardOpen(isOpen);
            setViewportStyle({
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: `${Math.max(0, bottom)}px`,
                zIndex: 9999,
            });
        };

        const handleFocusChange = () => {
            // Tiny delay to let layout viewport adapt
            setTimeout(handleResize, 100);
        };

        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);
        window.addEventListener('focusin', handleFocusChange);
        window.addEventListener('focusout', handleFocusChange);

        handleResize();

        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('scroll', handleResize);
            window.removeEventListener('focusin', handleFocusChange);
            window.removeEventListener('focusout', handleFocusChange);
        };
    }, []);

    return { isKeyboardOpen, isMobile, viewportStyle };
};

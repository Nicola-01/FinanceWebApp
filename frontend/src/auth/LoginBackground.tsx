import React from 'react';
import Sphere from '../assets/Sphere';

export const LoginBackground: React.FC = () => {
    return (
        <>
            {/* Base Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#230b38] to-[#1a1a40] z-0"></div>

            {/* Animated Background Spheres Container */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">

                {/* Red/Purple Sphere */}
                <Sphere
                    style={{
                        height: "400px", width: "400px",
                        background: "linear-gradient(#ff0055, #ff2299)",
                        top: "-100px", left: "20%",
                        opacity: 0.6,
                    }}
                    animate={{
                        x: [0, 100, -50, 0],
                        y: [0, -50, 50, 0],
                        scale: [1, 1.1, 0.9, 1],
                    }}
                    transition={{
                        duration: 10, repeat: Infinity,
                        repeatType: "reverse", ease: "easeInOut",
                    }}
                />

                {/* Blue/Cyan Sphere */}
                <Sphere
                    style={{
                        height: "450px", width: "450px",
                        background: "linear-gradient(#4d22ff, #22d3ff)",
                        bottom: "-100px", right: "20%",
                        opacity: 0.6
                    }}
                    animate={{
                        x: [0, -70, 40, 0],
                        y: [0, 80, -30, 0],
                        scale: [1, 0.9, 1.1, 1],
                    }}
                    transition={{
                        duration: 12, repeat: Infinity,
                        repeatType: "reverse", ease: "easeInOut",
                    }}
                />

                {/* Center Blurred Purple Sphere */}
                <Sphere
                    style={{
                        height: "300px", width: "300px",
                        background: "#7a00cc",
                        top: "40%", left: "40%",
                        opacity: "0.3"
                    }}
                    animate={{ x: [-20, 20], y: [-20, 20] }}
                    transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
                />
            </div>
        </>
    );
};
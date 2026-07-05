import React from "react";
import Sphere from "../../assets/Sphere";

const BackgroundBlobs: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Violet Blob */}
      <Sphere
        style={{
          height: "500px",
          width: "500px",
          background: "rgba(139, 92, 246, 0.2)", // brand violet (#8b5cf6)
          top: "-10%",
          left: "-10%",
          mixBlendMode: "screen",
          filter: "blur(128px)",
          opacity: 0.7,
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Magenta Blob */}
      <Sphere
        style={{
          height: "600px",
          width: "600px",
          background: "rgba(224, 51, 154, 0.2)", // brand magenta (#e0339a)
          top: "20%",
          right: "-10%",
          mixBlendMode: "screen",
          filter: "blur(128px)",
          opacity: 0.7,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </div>
  );
};

export default BackgroundBlobs;

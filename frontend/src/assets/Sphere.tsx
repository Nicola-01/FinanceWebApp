import React from "react";
import { motion } from "framer-motion";

interface SphereProps {
  style: {};
  animate: {
    x?: (number | string)[];
    y?: (number | string)[];
    scale?: number[];
    opacity?: number[] | number;
  };
  transition?: {};
}

// React Function Component
const Sphere: React.FC<SphereProps> = ({ style, animate, transition }) => {
  return (
    <motion.div
      className="shape absolute blur-[80px] rounded-full"
      style={style}
      animate={animate}
      transition={transition}
    />
  );
};

export default Sphere;

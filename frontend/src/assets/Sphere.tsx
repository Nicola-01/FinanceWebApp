import React from "react";
import { motion, type Transition } from "framer-motion";

interface SphereProps {
  style: React.CSSProperties;
  animate: {
    x?: (number | string)[];
    y?: (number | string)[];
    scale?: number[];
    opacity?: number[] | number;
  };
  transition?: Transition;
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

import React from "react";

/**
 * v2 auth backdrop: a fine dot grid plus two flat wallet-colour circles in
 * opposite corners. Fixed and non-interactive; content sits above it.
 */
export const AuthBackdrop: React.FC = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 overflow-hidden"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle,color-mix(in_srgb,rgb(var(--text-primary))_20%,transparent)_1px,transparent_1.5px)] [background-size:24px_24px]" />
    <div className="absolute right-[-300px] bottom-[-300px] size-[600px] rounded-full bg-[#3b5bdb] max-sm:right-[-170px] max-sm:bottom-[-170px] max-sm:size-[340px]" />
    <div className="absolute top-[-100px] left-[-100px] size-[200px] rounded-full bg-[#c2410c] max-sm:top-[-56px] max-sm:left-[-56px] max-sm:size-[112px]" />
  </div>
);

export default AuthBackdrop;

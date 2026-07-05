import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  isLoggedIn: boolean;
  onDashboardClick: () => void;
  onLoginClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  isLoggedIn,
  onDashboardClick,
  onLoginClick,
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { label: "About the app", path: "/about" },
    { label: "Roadmap", path: "/ToDo" },
    { label: "Demo", path: "/login" },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 w-full z-50">
      {/* Top Bar Background (solves stacking context issue) */}
      <div className="absolute inset-0 backdrop-blur-xl bg-app-bg/60 border-b border-app-border pointer-events-none -z-10"></div>

      <nav className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 items-center py-4 px-6 relative z-10">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer justify-self-start"
          onClick={() => handleNav("/about")}
        >
          <img
            src="/icon.svg"
            alt="Finance App Logo"
            className="h-10 w-10 object-contain"
          />
          <span className="text-xl font-bold tracking-tight">
            FinanceWebApp
          </span>
        </div>

        {/* Desktop Center Links */}
        <div className="hidden md:flex items-center gap-8 justify-self-center">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNav(link.path)}
              className={`text-sm transition-colors ${
                isActive(link.path)
                  ? "text-app-pink font-bold" // active link
                  : "text-app-muted font-medium hover:text-app-text" // default
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right Actions & Hamburger */}
        <div className="flex items-center gap-4 justify-self-end">
          <div className="hidden md:flex">
            {isLoggedIn ? (
              <button
                onClick={onDashboardClick}
                className="text-sm font-medium hover:text-app-purple transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="bg-app-hover hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-all border border-app-border hover:border-app-muted"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Hamburger Icon */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-app-text hover:text-app-purple transition-colors p-1"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-app-bg/60 backdrop-blur-[24px] border-b border-app-border animate-in slide-in-from-top duration-300 -z-20 shadow-2xl">
          <div className="flex flex-col p-6 gap-6 relative z-10">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className="text-lg font-medium text-app-muted hover:text-app-text text-left"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4 border-t border-app-border">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    onDashboardClick();
                    setIsMenuOpen(false);
                  }}
                  className="text-lg font-medium text-app-purple"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => {
                    onLoginClick();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] text-white font-bold py-3 rounded-xl transition-all hover:brightness-[1.07]"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

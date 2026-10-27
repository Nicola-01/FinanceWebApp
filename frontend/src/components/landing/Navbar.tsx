import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import Button from "../ui/Button";
import NavLinks from "./NavLinks";
import { useActiveSection } from "./useActiveSection";
import { useTheme } from "../../utils/ThemeContext";

interface NavbarProps {
  ctaLabel: string;
  onPrimaryCta: () => void;
}

const SECTION_IDS = ["hero", "features"];

const Navbar: React.FC<NavbarProps> = ({ ctaLabel, onPrimaryCta }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const closeMenu = () => setIsMenuOpen(false);

  const activeSection = useActiveSection(SECTION_IDS, pathname === "/about");
  const linkProps = { pathname, activeSection };

  return (
    <header className="fixed top-0 w-full z-50">
      {/* Blurred bar background (kept out of the stacking flow). */}
      <div className="absolute inset-0 backdrop-blur-xl bg-app-bg/60 border-b border-app-border pointer-events-none -z-10" />

      <nav className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 items-center py-3 px-6 relative z-10">
        {/* Logo */}
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer justify-self-start"
          onClick={() => navigate("/about")}
        >
          <img
            src="/icon.svg"
            alt="FinanceWebApp logo"
            className="h-9 w-9 object-contain"
          />
          <span className="text-lg font-bold tracking-tight text-app-text">
            FinanceWebApp
          </span>
        </button>

        {/* Desktop center links */}
        <div className="hidden md:flex items-center gap-1 justify-self-center">
          <NavLinks {...linkProps} />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 justify-self-end">
          <Button
            variant="ghost"
            size="sm"
            aria-label={
              isDark ? "Switch to light theme" : "Switch to dark theme"
            }
            onClick={toggleTheme}
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          <div className="hidden md:block">
            <Button variant="primary" size="sm" ripple onClick={onPrimaryCta}>
              {ctaLabel}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden text-app-text hover:text-app-purple transition-colors p-1"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-app-bg/80 backdrop-blur-xl border-b border-app-border shadow-2xl -z-20">
          <div className="flex flex-col p-5 gap-2 relative z-10">
            <NavLinks stacked onNavigate={closeMenu} {...linkProps} />
            <div className="pt-3 border-t border-app-border">
              <Button
                variant="primary"
                size="md"
                fullWidth
                ripple
                onClick={() => {
                  onPrimaryCta();
                  closeMenu();
                }}
              >
                {ctaLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

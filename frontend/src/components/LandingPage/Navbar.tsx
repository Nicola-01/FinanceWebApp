import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import Button from "../ui/Button";
import GithubMark from "./GithubMark";
import { useTheme } from "../../utils/ThemeContext";
import { GITHUB_URL } from "./landingDemoData";

interface NavbarProps {
  ctaLabel: string;
  onPrimaryCta: () => void;
}

const ACTIVE_COLOR = "var(--color-app-pink)";
const SECTION_IDS = ["hero", "features"];

/** Scroll-spy: returns the id of the section currently crossing the viewport. */
const useActiveSection = (ids: string[], enabled: boolean): string | null => {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [enabled, ids]);

  // Derive (rather than setState in the effect) so a disabled spy reads null.
  return enabled ? active : null;
};

interface NavLinksProps {
  stacked?: boolean;
  onNavigate?: () => void;
  pathname: string;
  activeSection: string | null;
}

const NavLinks: React.FC<NavLinksProps> = ({
  stacked,
  onNavigate,
  pathname,
  activeSection,
}) => {
  const navigate = useNavigate();

  const linkClass = stacked ? "justify-start w-full" : "";
  const activeCls = (active: boolean) => (active ? "bg-app-hover" : "");
  const activeStyle = (active: boolean) =>
    active ? { color: ACTIVE_COLOR } : undefined;

  const isAbout = pathname === "/about";
  const featuresActive = isAbout && activeSection === "features";
  const homeActive = isAbout && !featuresActive;
  const roadmapActive = pathname === "/ToDo";

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const goHome = () => {
    if (isAbout) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/about");
    }
    onNavigate?.();
  };

  const goFeatures = () => {
    if (isAbout) {
      document
        .getElementById("features")
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/about");
    }
    onNavigate?.();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`${linkClass} ${activeCls(homeActive)}`}
        style={activeStyle(homeActive)}
        onClick={goHome}
      >
        Home
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`${linkClass} ${activeCls(featuresActive)}`}
        style={activeStyle(featuresActive)}
        onClick={goFeatures}
      >
        Features
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`${linkClass} ${activeCls(roadmapActive)}`}
        style={activeStyle(roadmapActive)}
        onClick={() => go("/ToDo")}
      >
        Roadmap
      </Button>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
      >
        <Button variant="ghost" size="sm" className={linkClass}>
          <GithubMark className="w-4 h-4" />
          GitHub
        </Button>
      </a>
    </>
  );
};

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

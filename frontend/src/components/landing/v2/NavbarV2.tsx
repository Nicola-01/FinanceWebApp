import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Button from "../../ui/Button";
import GithubMark from "../GithubMark";
import { GITHUB_URL } from "../landingDemoData";

interface NavbarV2Props {
  navCtaLabel: string;
  demoLoading: boolean;
  onPrimaryCta: () => void;
}

/** UI v2 landing navbar: static, bordered bar with anchors, Log in and Start free. */
const NavbarV2: React.FC<NavbarV2Props> = ({
  navCtaLabel,
  demoLoading,
  onPrimaryCta,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goHome = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const goFeatures = () =>
    document.getElementById("what")?.scrollIntoView({ behavior: "smooth" });
  const goRoadmap = () => navigate("/ToDo");

  const links = [
    { label: "Home", onClick: goHome },
    { label: "Features", onClick: goFeatures },
    { label: "Roadmap", onClick: goRoadmap },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-app-border bg-app-bg">
      <nav className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-2 px-4 py-3 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <button
          type="button"
          onClick={goHome}
          className="flex cursor-pointer items-center gap-2.5 justify-self-start"
        >
          <img src="/icon.svg" alt="" className="h-7 w-7 object-contain" />
          <span className="font-display text-lg font-bold tracking-tight text-app-text">
            FinanceWebApp
          </span>
        </button>

        <div className="hidden items-center gap-1 justify-self-center lg:flex">
          {links.map((l) => (
            <Button key={l.label} variant="ghost" size="sm" onClick={l.onClick}>
              {l.label}
            </Button>
          ))}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm">
              <GithubMark className="h-4 w-4" />
              GitHub
            </Button>
          </a>
        </div>

        <div className="hidden items-center gap-2 justify-self-end lg:flex">
          <Button
            variant="primary"
            size="sm"
            ripple
            disabled={demoLoading}
            onClick={onPrimaryCta}
          >
            {navCtaLabel}
          </Button>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center justify-self-end rounded-[10px] text-app-muted lg:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="flex flex-col gap-1 border-t border-app-border bg-app-bg px-4 py-4 lg:hidden">
          {links.map((l) => (
            <Button
              key={l.label}
              variant="ghost"
              size="md"
              fullWidth
              className="justify-start"
              onClick={() => {
                l.onClick();
                setMenuOpen(false);
              }}
            >
              {l.label}
            </Button>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-app-border pt-3">
            <Button
              variant="primary"
              size="md"
              fullWidth
              ripple
              disabled={demoLoading}
              onClick={() => {
                onPrimaryCta();
                setMenuOpen(false);
              }}
            >
              {navCtaLabel}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavbarV2;

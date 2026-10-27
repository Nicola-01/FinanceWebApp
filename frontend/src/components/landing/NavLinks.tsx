import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import GithubMark from "./GithubMark";
import { GITHUB_URL } from "./landingDemoData";

const ACTIVE_COLOR = "var(--color-app-pink)";

interface NavLinksProps {
  stacked?: boolean;
  onNavigate?: () => void;
  pathname: string;
  activeSection: string | null;
}

/** Landing navbar links (Home / Features / Roadmap / GitHub). */
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

export default NavLinks;

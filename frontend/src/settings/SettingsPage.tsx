import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { AppHeader } from "../header/AppHeader";
import { DashboardBackground } from "../dashboard/DashboardBackground";
import { SettingsNav } from "./SettingsNav";
import { SETTINGS_SECTIONS, SETTINGS_SECTION_IDS } from "./sections";
import { useScrollSpy } from "./useScrollSpy";
import { AccountSection } from "./sections/AccountSection";
import { SecuritySection } from "./sections/SecuritySection";
import { TokensSection } from "./sections/TokensSection";
import { AboutSection } from "./sections/AboutSection";
import { DeleteAccountSection } from "./sections/DeleteAccountSection";

function readMustChange(): boolean {
  try {
    return (
      JSON.parse(localStorage.getItem("mustChangePWD") || "false") === true
    );
  } catch {
    return false;
  }
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeId = useScrollSpy(SETTINGS_SECTION_IDS);

  // Forced password-change mode (mustChangePWD): show only Security, blocking.
  const [forced, setForced] = useState(readMustChange);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  // Scroll to the #hash section — on mount (deep-link from elsewhere) and on any
  // later hash change (clicking a section link in the header while already here).
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && SETTINGS_SECTION_IDS.includes(hash)) {
      const t = setTimeout(() => scrollTo(hash), 60);
      return () => clearTimeout(t);
    }
  }, [location.hash, scrollTo]);

  const visibleSections = forced
    ? SETTINGS_SECTIONS.filter((s) => s.id === "security")
    : SETTINGS_SECTIONS;

  return (
    <div className="relative isolate min-h-screen bg-app-bg text-app-text transition-colors">
      <DashboardBackground />

      {/* Fixed top bar — stays put while the page scrolls (matches the dashboard). */}
      <div className="sticky top-0 z-[120]">
        <AppHeader page={{ text: "My", accent: "Settings" }} />
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <div
          className={
            forced
              ? "mx-auto max-w-2xl"
              : "grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-8"
          }
        >
          {!forced && (
            <div>
              <div className="sticky top-16 z-20 -mx-4 border-b border-app-border/60 bg-app-bg/85 px-4 py-3 backdrop-blur lg:top-20 lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                {/* Back link sits as the header of the settings nav, above the sections. */}
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-app-muted transition-colors hover:text-app-text"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Back to dashboard
                </button>
                <div className="my-3 h-px w-full bg-app-border/60" />
                <SettingsNav
                  sections={SETTINGS_SECTIONS}
                  activeId={activeId}
                  onNavigate={scrollTo}
                />
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-10">
            {visibleSections.map((s) => (
              <section
                id={s.id}
                key={s.id}
                className="scroll-mt-[170px] lg:scroll-mt-28"
              >
                <header className="mb-4">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon
                      icon={s.icon}
                      className={
                        s.danger ? "text-app-red" : "text-[var(--brand-1)]"
                      }
                    />
                    <h2
                      className={`text-xl font-bold ${
                        s.danger ? "text-app-red" : "text-app-text"
                      }`}
                    >
                      {s.label}
                    </h2>
                  </div>
                  {s.description && (
                    <p className="mt-1 text-sm text-app-muted">
                      {s.description}
                    </p>
                  )}
                </header>

                {s.id === "account" && <AccountSection />}
                {s.id === "security" && (
                  <SecuritySection
                    forced={forced}
                    onPasswordChanged={() => setForced(false)}
                  />
                )}
                {s.id === "tokens" && <TokensSection />}
                {s.id === "about" && <AboutSection />}
                {s.id === "delete-account" && <DeleteAccountSection />}
              </section>
            ))}

            {/* Tail spacer: lets the last sections (Tokens / About) scroll high
                enough to enter the scroll-spy activation band and become active. */}
            {!forced && <div aria-hidden className="h-[55vh] shrink-0" />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;

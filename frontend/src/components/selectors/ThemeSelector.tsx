import { type Theme, useTheme } from "../../utils/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDesktop, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { Selector } from "../ui/Selector.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch

  return (
    <div className="px-2 my-2">
      <p
        className={
          v2
            ? "mb-2 ml-1 block text-[13px] text-app-muted"
            : "mb-2 ml-1 block text-[10px] font-bold uppercase tracking-wider text-app-muted"
        }
      >
        {v2 ? "App theme" : "App Theme"}
      </p>
      <Selector
        value={theme}
        onChange={setTheme}
        size="md"
        options={(["light", "dark", "system"] as Theme[]).map((t) => ({
          value: t,
          icon: (
            <FontAwesomeIcon
              icon={t === "light" ? faSun : t === "dark" ? faMoon : faDesktop}
            />
          ),
          // ui-v2-switch: the v2 Selector supplies the raised active segment.
          activeColorClass: v2 ? undefined : "text-app-sky",
          activeBgClass: v2
            ? undefined
            : "bg-app-surface ring-1 ring-app-sky/10",
          title: t.charAt(0).toUpperCase() + t.slice(1),
        }))}
      />
    </div>
  );
};

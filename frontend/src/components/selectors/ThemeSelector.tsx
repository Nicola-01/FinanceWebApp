import { type Theme, useTheme } from "../../utils/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDesktop, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { Selector } from "../ui/Selector.tsx";

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="px-2 my-2">
      <p className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-wider text-app-muted">
        App Theme
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
          activeColorClass: "text-app-sky",
          activeBgClass: "bg-app-surface ring-1 ring-app-sky/10",
          disabledTitle: t.charAt(0).toUpperCase() + t.slice(1),
        }))}
      />
    </div>
  );
};

import {type Theme, useTheme} from "../../utils/ThemeContext";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDesktop, faMoon, faSun} from "@fortawesome/free-solid-svg-icons";

export const ThemeSelector = () => {
    const {theme, setTheme} = useTheme();

    return (
        <div className="px-2 my-2">
            <p className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-wider text-app-muted">App Theme</p>
            <div className="flex gap-1 p-1 rounded-xl bg-app-input border border-app-border">
                {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`
                                                flex flex-1 items-center justify-center py-2 rounded-lg text-xs font-bold transition-all
                                                ${theme === t
                            ? 'bg-app-surface text-[#00bfff] shadow-sm ring-1 ring-[#00bfff]/10'
                            : 'text-app-muted hover:text-app-text hover:bg-app-surface/50'}
                                            `}
                        title={t.charAt(0).toUpperCase() + t.slice(1)}
                    >
                        <FontAwesomeIcon
                            icon={t === 'light' ? faSun : t === 'dark' ? faMoon : faDesktop}/>
                    </button>
                ))}
            </div>
        </div>
    )
}
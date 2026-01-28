import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

type ThemeMode = "dark" | "light" | "system";

const ThemeToggle = () => {
  const { mode, setMode } = useTheme();

  const options: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { value: "light", icon: <Sun className="h-4 w-4" />, label: "Light" },
    { value: "dark", icon: <Moon className="h-4 w-4" />, label: "Dark" },
    { value: "system", icon: <Monitor className="h-4 w-4" />, label: "System" },
  ];

  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <span className="text-sm text-muted-foreground">Theme</span>
      <div className="flex items-center gap-0.5 rounded-full bg-secondary/60 p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setMode(option.value)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
              mode === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={option.label}
          >
            {option.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeToggle;

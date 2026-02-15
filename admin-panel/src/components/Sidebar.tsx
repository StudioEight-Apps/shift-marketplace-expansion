import { LayoutDashboard, Users, Package, MessageSquare, Upload, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import shiftLogoLight from "@/assets/shift-logo-horizontal.png";
import shiftLogoDark from "@/assets/shift-logo-black.png";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Bookings", path: "/", icon: LayoutDashboard },
  { label: "Inquiries", path: "/inquiries", icon: MessageSquare },
  { label: "Users", path: "/users", icon: Users },
  { label: "Inventory", path: "/inventory", icon: Package },
  { label: "Import", path: "/import", icon: Upload },
];

const Sidebar = () => {
  const { user, role, profile, logout } = useAuth();
  const location = useLocation();
  const { theme } = useTheme();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/" || location.pathname.startsWith("/requests");
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <img src={theme === "dark" ? shiftLogoLight : shiftLogoDark} alt="Shift" className="h-8 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path} className="relative">
              {isActive(item.path) && (
                <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-sidebar-primary" />
              )}
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={cn(
                  "ml-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  isActive(item.path)
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-sidebar-border px-3 py-4">
        <ThemeToggle />

        <div className="px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {(profile?.name || profile?.email || user?.email)?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              {profile?.name && (
                <p className="truncate text-xs font-medium text-foreground">
                  {profile.name}
                </p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {profile?.email || user?.email}
              </p>
              {role && (
                <span className="mt-0.5 inline-block rounded border border-border px-1.5 py-0 text-[10px] capitalize text-muted-foreground">
                  {role}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Package, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import shiftLogo from "@/assets/shift-logo-horizontal.png";

const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Bookings" },
    { to: "/users", icon: Users, label: "Users" },
    { to: "/inventory", icon: Package, label: "Inventory" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <img src={shiftLogo} alt="Shift" className="h-8 w-auto" />
        <p className="text-[10px] text-gray-500 mt-1 tracking-wider uppercase">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

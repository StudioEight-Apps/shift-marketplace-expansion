import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title: string;
}

const Header = ({ title }: HeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">{user?.email}</span>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary text-sm font-medium">
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;

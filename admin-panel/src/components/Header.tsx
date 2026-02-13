interface HeaderProps {
  title: string;
}

const Header = ({ title }: HeaderProps) => {
  return (
    <div className="border-b border-border px-6 py-4">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
    </div>
  );
};

export default Header;

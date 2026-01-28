import { cn } from "@/lib/utils";

type AssetType = "Stays" | "Cars" | "Yachts";

interface AssetTypeSelectorProps {
  selectedType: AssetType;
  onTypeChange: (type: AssetType) => void;
  showYachts?: boolean;
}

const AssetTypeSelector = ({ 
  selectedType, 
  onTypeChange, 
  showYachts = true 
}: AssetTypeSelectorProps) => {
  const assetTypes: AssetType[] = showYachts 
    ? ["Stays", "Cars", "Yachts"] 
    : ["Stays", "Cars"];

  return (
    <div className="inline-flex rounded-full border border-border bg-secondary/30 p-0.5 md:p-1">
      {assetTypes.map((type) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={cn(
            "rounded-full px-4 md:px-8 py-1.5 md:py-2.5 text-xs md:text-sm font-medium transition-all duration-200",
            selectedType === type
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {type}
        </button>
      ))}
    </div>
  );
};

export default AssetTypeSelector;

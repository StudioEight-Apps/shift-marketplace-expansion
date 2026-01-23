import { cn } from "@/lib/utils";

type AssetType = "Villas" | "Cars" | "Yachts";

interface AssetTypeSelectorProps {
  selectedType: AssetType;
  onTypeChange: (type: AssetType) => void;
}

const assetTypes: AssetType[] = ["Villas", "Cars", "Yachts"];

const AssetTypeSelector = ({ selectedType, onTypeChange }: AssetTypeSelectorProps) => {
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex rounded-full border border-border bg-secondary/30 p-0.5 md:p-1">
        {assetTypes.map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={cn(
              "rounded-full px-4 md:px-8 py-1.5 md:py-2.5 text-xs md:text-sm font-medium transition-all duration-200",
              selectedType === type
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AssetTypeSelector;

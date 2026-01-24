import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Listing } from "./ListingCard";
import MiniCarCard from "./MiniCarCard";

interface CarSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cars: Listing[];
  selectedCar: Listing | null;
  onCarSelect: (car: Listing) => void;
  cityName: string;
}

const CarSelectionSheet = ({
  open,
  onOpenChange,
  cars,
  selectedCar,
  onCarSelect,
  cityName,
}: CarSelectionSheetProps) => {
  const isMobile = useIsMobile();

  const handleCarClick = (car: Listing) => {
    onCarSelect(car);
    onOpenChange(false);
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cars.map((car) => (
            <MiniCarCard
              key={car.id}
              car={car}
              isSelected={selectedCar?.id === car.id}
              onToggle={() => handleCarClick(car)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] p-0 bg-background">
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-border-subtle">
            <SheetTitle className="text-lg font-semibold text-foreground">
              All Cars in {cityName}
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0 bg-background overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border-subtle">
          <DialogTitle className="text-xl font-semibold text-foreground">
            All Cars in {cityName}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default CarSelectionSheet;

import { format } from "date-fns";
import { X, Car, Anchor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Listing } from "./ListingCard";

interface ViewAllAddOnsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "Cars" | "Yachts";
  items: Listing[];
  stayCheckIn: Date;
  stayCheckOut: Date;
  onSelectItem: (item: Listing) => void;
}

const ViewAllAddOnsModal = ({
  open,
  onOpenChange,
  type,
  items,
  stayCheckIn,
  stayCheckOut,
  onSelectItem,
}: ViewAllAddOnsModalProps) => {
  const Icon = type === "Cars" ? Car : Anchor;
  const priceUnit = type === "Cars" ? "/day" : "/hr";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-card border-border p-0">
        <DialogHeader className="px-6 py-4 border-b border-border-subtle sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-foreground">
                  Available {type}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Showing options available {format(stayCheckIn, "MMM d")} – {format(stayCheckOut, "MMM d")}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onOpenChange(false);
                }}
                className="group text-left rounded-xl overflow-hidden bg-secondary/30 border border-border-subtle hover:border-primary/50 transition-all hover:shadow-elevated"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                    <span className="text-[10px] text-white/90 font-medium">
                      Available during your stay
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-primary">
                        ${item.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {priceUnit}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Add to stay →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAllAddOnsModal;

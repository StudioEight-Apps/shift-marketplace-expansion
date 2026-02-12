import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useContact } from "@/context/ContactContext";

interface EmptyStateProps {
  assetType: string;
  city: string;
}

const EmptyState = ({ assetType, city }: EmptyStateProps) => {
  const { openContact } = useContact();

  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-20 text-center">
      <div className="mb-6 rounded-full bg-secondary/30 p-4">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-medium text-foreground">
        No {assetType.toLowerCase()} available in {city} right now
      </p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Our concierge can source options not currently listed.
      </p>
      <Button variant="cta" className="mt-6" onClick={openContact}>
        Contact Concierge
      </Button>
    </div>
  );
};

export default EmptyState;

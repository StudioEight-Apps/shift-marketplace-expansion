import { useState, useCallback } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const navigate = useNavigate();
  
  // Use provided images, fallback to repeating the first image if needed
  const galleryImages = images.length >= 5 
    ? images.slice(0, 5) 
    : [...images, ...Array(5 - images.length).fill(images[0])].slice(0, 5);

  // Mobile carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentSlide, setCurrentSlide] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Subscribe to scroll events
  useCallback(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Update currentSlide when embla initializes or scrolls
  if (emblaApi && !emblaApi.internalEngine()) {
    // Wait for initialization
  } else if (emblaApi) {
    emblaApi.on("select", () => setCurrentSlide(emblaApi.selectedScrollSnap()));
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-0 md:px-12 lg:px-20 pt-0 md:pt-6">
      {/* Mobile: Swipeable Carousel */}
      <div className="md:hidden relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {galleryImages.map((image, index) => (
              <div 
                key={index} 
                className="flex-[0_0_100%] min-w-0 aspect-[4/3]"
              >
                <img
                  src={image}
                  alt={`${title} - View ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors z-10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={scrollPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors z-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors z-10"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                currentSlide === index 
                  ? "bg-white w-2.5" 
                  : "bg-white/50 hover:bg-white/70"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Grid Layout */}
      <div className="hidden md:block">
        <div className="relative grid grid-cols-4 gap-2 rounded-xl overflow-hidden aspect-[2.2/1]">
          {/* Hero Image - Left Side (Takes 2 columns) */}
          <div className="relative col-span-2 row-span-2 h-full">
            <img
              src={galleryImages[0]}
              alt={title}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay for text legibility - dark mode only */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent dark:block hidden" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-transparent dark:block hidden" />
            
            {/* Back Button */}
            <button
              onClick={() => navigate("/")}
              className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors z-10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>

          {/* Supporting Images - Right Side (2 columns, 2 rows) */}
          <div className="relative">
            <img
              src={galleryImages[1]}
              alt={`${title} - View 2`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative">
            <img
              src={galleryImages[2]}
              alt={`${title} - View 3`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative">
            <img
              src={galleryImages[3]}
              alt={`${title} - View 4`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative">
            <img
              src={galleryImages[4]}
              alt={`${title} - View 5`}
              className="w-full h-full object-cover"
            />
            
            {/* Show All Photos Button */}
            <button className="absolute bottom-3 right-3 px-4 py-2 rounded-lg bg-background/90 backdrop-blur-sm text-foreground text-sm font-medium hover:bg-background transition-colors border border-border/50">
              Show all photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;

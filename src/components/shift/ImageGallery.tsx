import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Deduplicate images (preserve order)
  const uniqueImages = [...new Set(images)];
  const imageCount = uniqueImages.length;

  // For the gallery grid, only use unique images (no repeats)
  const galleryImages = uniqueImages.slice(0, 5);

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

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      } else if (e.key === "ArrowLeft" && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      } else if (e.key === "ArrowRight" && currentImageIndex < images.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, currentImageIndex, images.length]);

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

      {/* Desktop: Grid Layout — adapts to number of unique images */}
      <div className="hidden md:block">
        {imageCount === 1 ? (
          /* Single image — constrained to natural proportions, similar to hero in standard grid */
          <div className="relative">
            <button onClick={() => navigate("/")}
              className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors z-10">
              <ArrowLeft className="h-4 w-4" /><span className="text-sm font-medium">Back</span>
            </button>
            <div className="mx-auto max-w-3xl rounded-xl overflow-hidden cursor-pointer aspect-[3/2]"
              onClick={() => { setCurrentImageIndex(0); setIsModalOpen(true); }}
            >
              <img src={galleryImages[0]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          </div>
        ) : imageCount === 2 ? (
          /* 2 images — hero left, 1 right */
          <div className="relative grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden" style={{ height: "60vh", maxHeight: "520px", minHeight: "360px" }}>
            <div className="relative overflow-hidden cursor-pointer" onClick={() => { setCurrentImageIndex(0); setIsModalOpen(true); }}>
              <img src={galleryImages[0]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent dark:block hidden" />
              <button onClick={(e) => { e.stopPropagation(); navigate("/"); }}
                className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors z-10">
                <ArrowLeft className="h-4 w-4" /><span className="text-sm font-medium">Back</span>
              </button>
            </div>
            <div className="relative overflow-hidden cursor-pointer" onClick={() => { setCurrentImageIndex(1); setIsModalOpen(true); }}>
              <img src={galleryImages[1]} alt={`${title} - View 2`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          </div>
        ) : (
          /* 3-5 images — standard grid */
          <div className="relative grid grid-cols-4 grid-rows-2 gap-1.5 rounded-xl overflow-hidden" style={{ height: "60vh", maxHeight: "520px", minHeight: "360px" }}>
            {/* Hero Image - Left Side (Takes 2 columns) */}
            <div className={cn("relative overflow-hidden cursor-pointer col-span-2 row-span-2")}
              onClick={() => { setCurrentImageIndex(0); setIsModalOpen(true); }}
            >
              <img src={galleryImages[0]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent dark:block hidden" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-transparent dark:block hidden" />
              <button onClick={(e) => { e.stopPropagation(); navigate("/"); }}
                className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors z-10">
                <ArrowLeft className="h-4 w-4" /><span className="text-sm font-medium">Back</span>
              </button>
            </div>

            {/* Supporting Images — render only what we have */}
            {galleryImages.slice(1).map((image, i) => {
              const idx = i + 1;
              const isLast = idx === galleryImages.length - 1;
              // If only 3 images, make each right-side image span 2 cols
              const spanClass = imageCount === 3 ? "col-span-2" : "";
              return (
                <div key={idx} className={cn("relative overflow-hidden cursor-pointer", spanClass)}
                  onClick={() => { setCurrentImageIndex(idx); setIsModalOpen(true); }}
                >
                  <img src={image} alt={`${title} - View ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  {/* Show All Photos on last image if >3 unique photos */}
                  {isLast && uniqueImages.length > 3 && (
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(0); setIsModalOpen(true); }}
                      className="absolute bottom-3 right-3 px-4 py-2 rounded-lg bg-background/90 backdrop-blur-sm text-foreground text-sm font-medium hover:bg-background transition-colors border border-border/50 z-10">
                      Show all photos
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Screen Photo Lightbox */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 left-6 p-2 rounded-full bg-transparent hover:bg-white/10 transition-colors z-50"
          >
            <X className="h-7 w-7 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-sm font-medium z-50">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Main Image */}
          <div className="relative w-full h-full flex items-center justify-center p-20">
            <img
              src={images[currentImageIndex]}
              alt={`${title} - View ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Previous Button */}
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(currentImageIndex - 1);
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white transition-colors z-50"
            >
              <ChevronLeft className="h-6 w-6 text-black" />
            </button>
          )}

          {/* Next Button */}
          {currentImageIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(currentImageIndex + 1);
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white transition-colors z-50"
            >
              <ChevronRight className="h-6 w-6 text-black" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="w-full px-6 pt-6">
      <div className="relative grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[2.5/1]">
        {/* Hero Image - Left Side (Takes 2 columns) */}
        <div className="relative md:col-span-2 md:row-span-2 h-full">
          <img
            src={galleryImages[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-transparent" />
          
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
        <div className="hidden md:block relative">
          <img
            src={galleryImages[1]}
            alt={`${title} - View 2`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="hidden md:block relative">
          <img
            src={galleryImages[2]}
            alt={`${title} - View 3`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="hidden md:block relative">
          <img
            src={galleryImages[3]}
            alt={`${title} - View 4`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="hidden md:block relative">
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

        {/* Mobile: Back Button overlay on single image */}
        <div className="md:hidden absolute top-4 left-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;

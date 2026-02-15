import { useState, useRef, useCallback } from "react";
import { Trash2, Upload, GripVertical } from "lucide-react";

interface PhotoGridProps {
  existingPhotos: string[];
  photoFiles: File[];
  onReorderExisting: (photos: string[]) => void;
  onReorderNew: (files: File[]) => void;
  onRemoveExisting: (index: number) => void;
  onRemoveNew: (index: number) => void;
  onAddFiles: (files: File[]) => void;
}

const PhotoGrid = ({
  existingPhotos,
  photoFiles,
  onReorderExisting,
  onReorderNew,
  onRemoveExisting,
  onRemoveNew,
  onAddFiles,
}: PhotoGridProps) => {
  const [dragSource, setDragSource] = useState<{ section: "existing" | "new"; index: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ section: "existing" | "new"; index: number } | null>(null);
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback(
    (section: "existing" | "new", index: number) => (e: React.DragEvent) => {
      setDragSource({ section, index });
      e.dataTransfer.effectAllowed = "move";
      // Use a transparent drag image so the ghost doesn't look messy
      if (dragImageRef.current) {
        e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
      }
    },
    []
  );

  const handleDragOver = useCallback(
    (section: "existing" | "new", index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOver({ section, index });
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    if (dragSource && dragOver && dragSource.section === dragOver.section) {
      if (dragSource.section === "existing") {
        const items = [...existingPhotos];
        const [moved] = items.splice(dragSource.index, 1);
        items.splice(dragOver.index, 0, moved);
        onReorderExisting(items);
      } else {
        const items = [...photoFiles];
        const [moved] = items.splice(dragSource.index, 1);
        items.splice(dragOver.index, 0, moved);
        onReorderNew(items);
      }
    }
    setDragSource(null);
    setDragOver(null);
  }, [dragSource, dragOver, existingPhotos, photoFiles, onReorderExisting, onReorderNew]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  return (
    <div>
      {/* Hidden drag image */}
      <div ref={dragImageRef} className="fixed -left-[9999px]" />

      <label className="block text-sm text-muted-foreground mb-2">
        Photos{" "}
        {existingPhotos.length + photoFiles.length > 0 &&
          `(${existingPhotos.length + photoFiles.length} photos)`}
      </label>

      {/* Existing Photos */}
      {existingPhotos.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">
            Existing Photos — drag to reorder
          </p>
          <div className="grid grid-cols-4 gap-3">
            {existingPhotos.map((url, index) => {
              const isDragging = dragSource?.section === "existing" && dragSource.index === index;
              const isOver = dragOver?.section === "existing" && dragOver.index === index;
              return (
                <div
                  key={url + index}
                  draggable
                  onDragStart={handleDragStart("existing", index)}
                  onDragOver={handleDragOver("existing", index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group cursor-grab active:cursor-grabbing transition-all ${
                    isDragging ? "opacity-30 scale-95" : ""
                  } ${isOver && !isDragging ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg" : ""}`}
                >
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-border pointer-events-none"
                  />
                  {/* Drag handle */}
                  <div className="absolute top-1 left-1 p-0.5 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-3 w-3 text-white" />
                  </div>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                      Main
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Photos Preview */}
      {photoFiles.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">
            New Photos (will upload on save) — drag to reorder
          </p>
          <div className="grid grid-cols-4 gap-3">
            {photoFiles.map((file, index) => {
              const isDragging = dragSource?.section === "new" && dragSource.index === index;
              const isOver = dragOver?.section === "new" && dragOver.index === index;
              return (
                <div
                  key={file.name + index}
                  draggable
                  onDragStart={handleDragStart("new", index)}
                  onDragOver={handleDragOver("new", index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group cursor-grab active:cursor-grabbing transition-all ${
                    isDragging ? "opacity-30 scale-95" : ""
                  } ${isOver && !isDragging ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg" : ""}`}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-border pointer-events-none"
                  />
                  {/* Drag handle */}
                  <div className="absolute top-1 left-1 p-0.5 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-3 w-3 text-white" />
                  </div>
                  {existingPhotos.length === 0 && index === 0 && (
                    <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                      Main
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveNew(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Button */}
      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-background border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary cursor-pointer transition-colors">
        <Upload className="h-5 w-5" />
        <span>Click to upload photos</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </label>
      <p className="text-xs text-muted-foreground mt-1">
        First photo will be the main image. Drag photos to reorder.
      </p>
    </div>
  );
};

export default PhotoGrid;

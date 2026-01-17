import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  maxImages?: number;
  existingImages?: string[];
  onExistingImagesChange?: (images: string[]) => void;
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
}

export default function ImageUpload({
  maxImages = 5,
  existingImages = [],
  onExistingImagesChange,
  selectedFiles,
  onFilesChange,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const totalImages = existingImages.length + selectedFiles.length;
  const canAddMore = totalImages < maxImages;

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    const availableSlots = maxImages - totalImages;
    const filesToAdd = imageFiles.slice(0, availableSlots);
    
    if (filesToAdd.length > 0) {
      onFilesChange([...selectedFiles, ...filesToAdd]);
    }
  }, [maxImages, totalImages, selectedFiles, onFilesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canAddMore) {
      setIsDragging(true);
    }
  }, [canAddMore]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (canAddMore) {
      handleFiles(e.dataTransfer.files);
    }
  }, [canAddMore, handleFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const removeExistingImage = (index: number) => {
    if (onExistingImagesChange) {
      onExistingImagesChange(existingImages.filter((_, i) => i !== index));
    }
  };

  const removeNewImage = (index: number) => {
    onFilesChange(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 text-center",
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-muted-foreground/25 hover:border-primary/50",
          !canAddMore && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={!canAddMore}
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            isDragging ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-6 h-6 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <div>
            <p className="text-sm font-medium">
              {isDragging ? "Drop your images here" : "Drag & drop images here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or{" "}
              <button
                type="button"
                onClick={() => document.getElementById('image-upload')?.click()}
                className="text-primary hover:underline font-medium"
                disabled={!canAddMore}
              >
                browse files
              </button>
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {totalImages} / {maxImages} images • PNG, JPG, WEBP supported
          </p>
        </div>
      </div>

      {/* Image previews */}
      {(existingImages.length > 0 || selectedFiles.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* Existing images */}
          {existingImages.map((image, index) => (
            <div key={`existing-${index}`} className="relative group aspect-square">
              <img
                src={image}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeExistingImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
              <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Saved
              </span>
            </div>
          ))}
          
          {/* New images */}
          {selectedFiles.map((file, index) => (
            <div key={`new-${index}`} className="relative group aspect-square">
              <img
                src={URL.createObjectURL(file)}
                alt={`New image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border-2 border-primary/50"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeNewImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
              <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                New
              </span>
            </div>
          ))}
          
          {/* Add more placeholder */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add more</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

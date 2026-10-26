import React, { useState, useEffect } from 'react';

export interface BaseImage {
  id: number | string;
  url: string;
  isPrimary?: boolean;
}

interface GalleryProps<T extends BaseImage> {
  images: T[];
  altText?: string;
}

export const Gallery = <T extends BaseImage>({
  images,
  altText = 'Imagen de la galería'
}: GalleryProps<T>) => {
  const [selectedImage, setSelectedImage] = useState<T | null>(null);

  useEffect(() => {
    if (images && images.length > 0) {
      const primary = images.find((img) => img.isPrimary);
      setSelectedImage(primary || images[0]);
    }
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-column justify-content-center align-items-center gap-2 h-20rem border-round border-1 surface-border surface-100 text-600">
        <i className="pi pi-images text-3xl text-400" />
        <span className="text-sm">No hay imágenes disponibles</span>
      </div>
    );
  }

  return (
    <div className="flex flex-column gap-3 w-full max-w-full">
      <div className="relative border-round overflow-hidden shadow-2 surface-100 flex justify-content-center align-items-center h-20rem md:h-30rem transition-duration-300">
        {selectedImage && (
          <img
            src={selectedImage.url}
            alt={altText}
            className="w-full h-full block"
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-round custom-scrollbar">
        {images.map((image) => {
          const isCurrent = selectedImage?.id === image.id;
          return (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className={`p-0 border-round overflow-hidden cursor-pointer flex-shrink-0 transition-all transition-duration-200 ${
                isCurrent
                  ? 'border-2 border-primary shadow-3 scale-95'
                  : 'border-1 border-300 opacity-70 hover:opacity-100'
              }`}
              style={{
                width: '80px',
                height: '60px',
                background: 'none',
                outline: 'none'
              }}
            >
              <img
                src={image.url}
                alt={`Miniatura ${image.id}`}
                className="w-full h-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

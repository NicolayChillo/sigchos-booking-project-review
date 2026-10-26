import { useCallback, useEffect, useRef, useState } from 'react';

export interface GalleryImage {
  id: number;
  file: File | null;
  url: string;
  isPrimary: boolean;
  isNew: boolean;
}

interface Props {
  id?: string;
  name?: string;
  initialImages?: GalleryImage[] | null;
  uploadPlaceholderTitle?: string;
  uploadPlaceholderSubtitle?: string;
  maxSizeMb?: number;
  onChange?: (images: GalleryImage[]) => void;
}

export function GalleryInput({
  id = 'images',
  name = 'images',
  initialImages = [],
  uploadPlaceholderTitle = 'Añadir imagen',
  uploadPlaceholderSubtitle = 'PNG, JPG hasta 5 MB',
  maxSizeMb = 5,
  onChange,
}: Props) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<GalleryImage[]>(initialImages ?? []);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  // Always hold the latest onChange without it being a callback dependency.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Notify the parent whenever images change, but skip the initial render
  // so we don't overwrite the form value that came from initialImages.
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    onChangeRef.current?.(images);
  }, [images]);

  // ── Pure updaters (no side-effects inside setImages) ──────────────────────
  const handleSetPrimary = useCallback((targetId: number) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === targetId })),
    );
  }, []);

  const handleRemoveImage = useCallback((targetId: number) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== targetId);
      if (prev.find((img) => img.id === targetId)?.isPrimary && updated.length > 0) {
        updated[0] = { ...updated[0], isPrimary: true };
      }
      return updated;
    });
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxBytes = maxSizeMb * 1024 * 1024;
    const accepted: File[] = [];
    const rejected: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > maxBytes) {
        rejected.push(file.name);
      } else {
        accepted.push(file);
      }
    });
    e.target.value = '';
    setRejectedFiles(rejected);
    if (accepted.length === 0) return;

    setImages((prev) => {
      const newImages: GalleryImage[] = accepted.map((file, index) => ({
        id: Date.now() + index,
        file,
        url: URL.createObjectURL(file),
        isPrimary: prev.length === 0 && index === 0,
        isNew: true,
      }));
      return [...prev, ...newImages];
    });
  }, [maxSizeMb]);

  return (
    <div className="flex flex-column gap-3">
      {/* ── Image grid ── */}
      {images.length > 0 && (
        <div className="grid">
          {images.map((img) => (
            <div key={img.id} className="col-12 sm:col-6 md:col-4 lg:col-3">
              <div
                className={`relative border-round-xl overflow-hidden shadow-1 transition-all transition-duration-200 hover:shadow-3 ${
                  img.isPrimary ? 'border-2 border-primary' : 'border-1 surface-border'
                }`}
                style={{ height: '10rem' }}
              >
                {/* Image */}
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full"
                  style={{ objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                />

                {/* Gradient overlay */}
                <div
                  className="absolute top-0 left-0 w-full"
                  style={{
                    height: '3.5rem',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Primary badge */}
                {img.isPrimary && (
                  <div className="absolute bottom-0 left-0 m-2">
                    <span
                      className="bg-primary text-white text-xs font-semibold px-2 py-1 border-round"
                      style={{ letterSpacing: '0.03em' }}
                    >
                      Principal
                    </span>
                  </div>
                )}

                {/* Action buttons — visible on hover via CSS group */}
                <div className="absolute top-0 left-0 w-full p-2 flex justify-content-between align-items-center opacity-0 hover:opacity-100 transition-opacity transition-duration-200"
                  style={{ opacity: undefined }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  {/* Mark as primary */}
                  <button
                    type="button"
                    title="Marcar como principal"
                    onClick={() => handleSetPrimary(img.id)}
                    className={`border-circle border-1 flex align-items-center justify-content-center cursor-pointer transition-all transition-duration-200 ${
                      img.isPrimary
                        ? 'bg-primary border-primary text-white'
                        : 'bg-black-alpha-40 border-white text-white hover:bg-primary hover:border-primary'
                    }`}
                    style={{ width: '1.75rem', height: '1.75rem', outline: 'none' }}
                  >
                    <i className="pi pi-check text-xs" />
                  </button>

                  {/* Remove */}
                  <button
                    type="button"
                    title="Eliminar imagen"
                    onClick={() => handleRemoveImage(img.id)}
                    className="border-circle border-none flex align-items-center justify-content-center cursor-pointer bg-black-alpha-40 text-white hover:bg-red-500 transition-all transition-duration-200"
                    style={{ width: '1.75rem', height: '1.75rem', outline: 'none' }}
                  >
                    <i className="pi pi-trash text-xs" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add-more tile (inside the grid, after images) */}
          <div className="col-12 sm:col-6 md:col-4 lg:col-3">
            <AddTile
              title={uploadPlaceholderTitle}
              subtitle={uploadPlaceholderSubtitle}
              onClick={() => inputFileRef.current?.click()}
              compact
            />
          </div>
        </div>
      )}

      {/* ── Empty state: big upload zone ── */}
      {images.length === 0 && (
        <AddTile
          title={uploadPlaceholderTitle}
          subtitle={uploadPlaceholderSubtitle}
          onClick={() => inputFileRef.current?.click()}
          compact={false}
        />
      )}

      <input
        ref={inputFileRef}
        type="file"
        id={id}
        name={name}
        multiple
        accept="image/*"
        className="hidden"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── Add tile ─────────────────────────────────────────────────────────────────
interface AddTileProps {
  title: string;
  subtitle: string;
  onClick: () => void;
  compact: boolean;
}

function AddTile({ title, subtitle, onClick, compact }: AddTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-dashed border-2 border-round-xl surface-border surface-0 hover:border-primary transition-all transition-duration-200 flex flex-column align-items-center justify-content-center cursor-pointer gap-2"
      style={{ minHeight: compact ? '10rem' : '12rem', outline: 'none' }}
    >
      <span
        className="flex align-items-center justify-content-center border-circle bg-primary-50 text-primary transition-transform transition-duration-200"
        style={{ width: '2.5rem', height: '2.5rem' }}
      >
        <i className="pi pi-plus font-bold" />
      </span>
      <span className="text-sm font-semibold text-900">{title}</span>
      <span className="text-xs text-500 text-center px-3">{subtitle}</span>
    </button>
  );
}

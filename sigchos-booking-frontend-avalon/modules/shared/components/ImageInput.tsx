import React, { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

interface Props {
  id?: string;
  name?: string;
  initPreview?: string | null;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (file: File) => void;
}

export function ImageInput({
  id,
  name,
  initPreview,
  disabled,
  className = 'w-10rem h-10rem',
  placeholder = 'Elija una imagen',
  onChange,
}: Props) {
  const [preview, setPreview] = useState<string | null>(initPreview ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = e.target.files[0];

    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const { result } = reader;
        if (typeof result === 'string') setPreview(result);
      };

      reader.readAsDataURL(file);
      onChange?.(file);
    } else {
      setPreview(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedImage = () => {
    if (!fileInputRef.current) return;
    setPreview(null);
    fileInputRef.current.value = '';
  };

  return (
    <div className={classNames('border-1 surface-border border-round surface-0 p-2 relative overflow-hidden flex align-items-center justify-content-center cursor-pointer', className)}>
      <input
        type="file"
        name={name}
        id={id}
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden"
        disabled={disabled}
      />
      {preview ? (
        <div className="relative w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="preview"
            className="w-full h-full border-round object-cover"
          />
          <Button
            icon="pi pi-times"
            className="absolute top-0 right-0 m-1 p-1 w-2rem h-2rem"
            severity="danger"
            rounded
            text
            aria-label="Remove Image"
            onClick={removeSelectedImage}
            disabled={disabled}
          />
        </div>
      ) : (
        <div 
          role="button"
          tabIndex={0}
          className="w-full h-full flex flex-column align-items-center justify-content-center text-500 hover:text-700 transition-colors"
          onClick={handleButtonClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleButtonClick();
            }
          }}
        >
          <i className="pi pi-image text-3xl mb-2"></i>
          <span className="text-sm text-center">{placeholder}</span>
        </div>
      )}
    </div>
  );
}

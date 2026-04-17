import React, { useRef, useState, ReactNode } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { FormField } from './Form';

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  hint?: ReactNode;
  error?: string;
}

export function FileUpload({
  onFileSelect,
  accept,
  maxSizeMB = 10,
  label,
  hint,
  error: extError
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const error = extError || localError;

  const handleFile = (file: File) => {
    setLocalError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`File exceeds maximum size of ${maxSizeMB}MB.`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const hasError = !!error;

  const content = (
    <div
      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
        ${hasError ? 'border-error bg-error/5' : isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary hover:bg-surface-offset'}
      `}
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={onChange}
        accept={accept}
        className="hidden"
      />

      {selectedFile ? (
        <div className="w-full flex items-center justify-between bg-surface-2 p-3 rounded-md border border-divider">
          <div className="flex items-center gap-3 overflow-hidden">
            <UploadCloud className="w-6 h-6 text-primary shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-text-base truncate">{selectedFile.name}</p>
              <p className="text-xs text-text-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="p-1.5 text-text-muted hover:bg-error hover:text-white rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-surface-offset flex items-center justify-center mb-1">
            <UploadCloud className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-base">Drop file here or click to browse</p>
          <p className="text-xs text-text-muted">Max size: {maxSizeMB}MB {accept && `(${accept})`}</p>
        </>
      )}
    </div>
  );

  return (
    <FormField label={label || ''} error={error || undefined} required={false} hint={hint}>
      {content}
    </FormField>
  );
}

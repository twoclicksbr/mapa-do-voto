import { useState, useRef, useCallback, useEffect } from "react";

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface FileWithPreview {
  id: string;
  file: File | { name: string; size: number; type: string };
  preview?: string;
}

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  initialFiles?: FileMetadata[];
  onFilesChange?: (files: FileWithPreview[]) => void;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function useFileUpload({
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024,
  accept = "*",
  multiple = true,
  initialFiles = [],
  onFilesChange,
}: UseFileUploadOptions = {}) {
  const initialItems: FileWithPreview[] = initialFiles.map((f) => ({
    id: f.id,
    file: { name: f.name, size: f.size, type: f.type } as unknown as File,
    preview: f.url,
  }));

  const [files, setFiles] = useState<FileWithPreview[]>(initialItems);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const filesRef = useRef<FileWithPreview[]>(initialItems);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const errs: string[] = [];
      const toAdd: FileWithPreview[] = [];
      const current = filesRef.current;

      for (const file of newFiles) {
        if (current.length + toAdd.length >= maxFiles) {
          errs.push(`Máximo de ${maxFiles} arquivo(s) permitido.`);
          break;
        }
        if (file.size > maxSize) {
          errs.push(`"${file.name}" excede o tamanho máximo (${formatBytes(maxSize)}).`);
          continue;
        }
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;
        toAdd.push({ id, file, preview });
      }

      setErrors(errs);

      if (toAdd.length > 0) {
        const next = [...current, ...toAdd];
        filesRef.current = next;
        setFiles(next);
        onFilesChange?.(next);
      }
    },
    [maxFiles, maxSize, onFilesChange]
  );

  const removeFile = useCallback(
    (id: string) => {
      const next = filesRef.current.filter((f) => f.id !== id);
      filesRef.current = next;
      setFiles(next);
      onFilesChange?.(next);
    },
    [onFilesChange]
  );

  const clearFiles = useCallback(() => {
    filesRef.current = [];
    setFiles([]);
    onFilesChange?.([]);
  }, [onFilesChange]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      addFiles(multiple ? dropped : dropped.slice(0, 1));
    },
    [multiple, addFiles]
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const getInputProps = useCallback(
    () => ({
      ref: (el: HTMLInputElement | null) => {
        inputRef.current = el;
      },
      type: "file" as const,
      accept,
      multiple,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        addFiles(multiple ? selected : selected.slice(0, 1));
        e.target.value = "";
      },
    }),
    [accept, multiple, addFiles]
  );

  return [
    { isDragging, errors, files },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] as const;
}

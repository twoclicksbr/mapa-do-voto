import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Headphones,
  Image,
  LayoutGrid,
  List,
  Loader2,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "grid" | "list";
type FileStatus = "idle" | "uploading" | "error";

interface RemoteFile {
  id: number;
  name: string;
  mime_type: string;
  size: number;
  url: string;
  order: number;
}

interface LocalFile {
  localId: string;
  file: File;
  preview?: string;
  status: FileStatus;
  error?: string;
  progress: number;
}

type AnyFile =
  | { kind: "remote"; data: RemoteFile }
  | { kind: "local"; data: LocalFile };

interface LightboxImage {
  src: string;
  name: string;
}

export interface PeopleFilesTabProps {
  personId: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(mimeType: string, className?: string) {
  const cls = cn("shrink-0", className ?? "size-5");
  if (mimeType.startsWith("image/")) return <Image className={cls} />;
  if (mimeType.startsWith("video/")) return <Video className={cls} />;
  if (mimeType.startsWith("audio/")) return <Headphones className={cls} />;
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("doc"))
    return <FileText className={cls} />;
  if (mimeType.includes("excel") || mimeType.includes("sheet"))
    return <FileSpreadsheet className={cls} />;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar"))
    return <FileArchive className={cls} />;
  return <FileText className={cls} />;
}

function getFileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Imagem";
  if (mimeType.startsWith("video/")) return "Vídeo";
  if (mimeType.startsWith("audio/")) return "Áudio";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("doc")) return "Word";
  if (mimeType.includes("excel") || mimeType.includes("sheet")) return "Excel";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "Arquivo";
  if (mimeType.includes("json")) return "JSON";
  if (mimeType.includes("text")) return "Texto";
  return "Arquivo";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PeopleFilesTab({ personId }: PeopleFilesTabProps) {
  const [view, setView] = useState<ViewMode>("grid");
  const [remoteFiles, setRemoteFiles] = useState<RemoteFile[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number } | null>(null);

  // ── Fetch existing files ──────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    api
      .get(`/people/${personId}/files`)
      .then((res) => setRemoteFiles(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [personId]);

  // ── Upload a single file to the API ──────────────────────────────────────
  const uploadFile = useCallback(
    async (localId: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await api.post(`/people/${personId}/files`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setLocalFiles((prev) => prev.filter((f) => f.localId !== localId));
        setRemoteFiles((prev) => [...prev, res.data]);
      } catch {
        setLocalFiles((prev) =>
          prev.map((f) =>
            f.localId === localId
              ? { ...f, status: "error" as FileStatus, error: "Falha no upload. Tente novamente." }
              : f
          )
        );
      }
    },
    [personId]
  );

  // ── Process selected files ────────────────────────────────────────────────
  const processFiles = useCallback(
    (files: File[]) => {
      const errs: string[] = [];
      const MAX_SIZE = 50 * 1024 * 1024;
      const MAX_FILES = 20;
      const total = remoteFiles.length + localFiles.length;
      const toAdd: LocalFile[] = [];

      for (const file of files) {
        if (total + toAdd.length >= MAX_FILES) {
          errs.push(`Máximo de ${MAX_FILES} arquivo(s) permitido.`);
          break;
        }
        if (file.size > MAX_SIZE) {
          errs.push(`"${file.name}" excede 50 MB.`);
          continue;
        }
        const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
        toAdd.push({ localId, file, preview, status: "uploading", progress: 0 });
      }

      setErrors(errs);
      if (toAdd.length === 0) return;
      setLocalFiles((prev) => [...prev, ...toAdd]);
      toAdd.forEach((f) => uploadFile(f.localId, f.file));
    },
    [remoteFiles.length, localFiles.length, uploadFile]
  );

  // ── Drag & drop handlers ──────────────────────────────────────────────────
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((c) => { if (c === 0) setIsDragging(true); return c + 1; });
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((c) => { const n = c - 1; if (n <= 0) setIsDragging(false); return n <= 0 ? 0 : n; });
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter(0);
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const openFileDialog = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = () => processFiles(Array.from(input.files ?? []));
    input.click();
  };

  // ── Delete remote file ────────────────────────────────────────────────────
  const deleteRemote = async (id: number) => {
    setRemoteFiles((prev) => prev.filter((f) => f.id !== id));
    try {
      await api.delete(`/people/${personId}/files/${id}`);
    } catch {
      api.get(`/people/${personId}/files`).then((res) => setRemoteFiles(res.data));
    }
  };

  const downloadFile = async (fileId: number, name: string) => {
    const res = await api.get(`/people/${personId}/files/${fileId}/download`, {
      responseType: "blob",
    });
    const blobUrl = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const retryUpload = (f: LocalFile) => {
    setLocalFiles((prev) =>
      prev.map((x) => x.localId === f.localId ? { ...x, status: "uploading", error: undefined } : x)
    );
    uploadFile(f.localId, f.file);
  };

  // ── All files combined for display ───────────────────────────────────────
  const allFiles: AnyFile[] = [
    ...remoteFiles.map((d): AnyFile => ({ kind: "remote", data: d })),
    ...localFiles.map((d): AnyFile => ({ kind: "local", data: d })),
  ];

  // Images only (for lightbox navigation)
  const lightboxImages: LightboxImage[] = allFiles.flatMap((item) => {
    if (item.kind === "remote" && item.data.mime_type.startsWith("image/"))
      return [{ src: item.data.url, name: item.data.name }];
    if (item.kind === "local" && item.data.file.type.startsWith("image/") && item.data.preview)
      return [{ src: item.data.preview, name: item.data.file.name }];
    return [];
  });

  const openLightbox = (src: string) => {
    const idx = lightboxImages.findIndex((img) => img.src === src);
    if (idx >= 0) { setLightboxIdx(idx); setImgDimensions(null); }
  };

  const navigate = useCallback((dir: 1 | -1) => {
    setImgDimensions(null);
    setLightboxIdx((prev) => {
      if (prev === null) return null;
      const next = prev + dir;
      if (next < 0) return lightboxImages.length - 1;
      if (next >= lightboxImages.length) return 0;
      return next;
    });
  }, [lightboxImages.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, navigate]);

  const totalCount = allFiles.length;
  const currentImage = lightboxIdx !== null ? lightboxImages[lightboxIdx] : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
    {/* Lightbox */}
    <Dialog open={lightboxIdx !== null} onOpenChange={(open) => !open && setLightboxIdx(null)}>
      <DialogContent className="max-w-5xl w-full p-0 bg-black/75 border-0 overflow-hidden backdrop-blur-sm">
        {/* Top-right actions */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
          {currentImage && lightboxIdx !== null && (() => {
            const remoteFile = remoteFiles.find((f) => f.url === currentImage.src);
            return remoteFile ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => downloadFile(remoteFile.id, remoteFile.name)}
                      className="rounded-full bg-white/10 text-white hover:bg-white/20 p-1 transition-colors"
                    >
                      <Download className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => { deleteRemote(remoteFile.id); setLightboxIdx(null); }}
                      className="rounded-full bg-white/10 text-white hover:bg-red-500/70 p-1 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Lixeira</TooltipContent>
                </Tooltip>
              </>
            ) : null;
          })()}
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogClose className="rounded-full bg-white/10 text-white hover:bg-white/20 p-1 transition-colors">
                <X className="size-4" />
              </DialogClose>
            </TooltipTrigger>
            <TooltipContent>Fechar</TooltipContent>
          </Tooltip>
        </div>

        {/* Counter */}
        {lightboxImages.length > 1 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
            {(lightboxIdx ?? 0) + 1} / {lightboxImages.length}
          </div>
        )}

        {/* Prev */}
        {lightboxImages.length > 1 && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/10 text-white hover:bg-white/25 p-2 transition-colors"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {/* Image */}
        {currentImage && (
          <div className="flex items-center justify-center h-[80vh] px-16 py-10">
            <img
              key={currentImage.src}
              src={currentImage.src}
              alt={currentImage.name}
              className="max-w-full max-h-full object-contain rounded shadow-2xl"
              onLoad={(e) => {
                const img = e.currentTarget;
                setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />
          </div>
        )}

        {/* Next */}
        {lightboxImages.length > 1 && (
          <button
            type="button"
            onClick={() => navigate(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/10 text-white hover:bg-white/25 p-2 transition-colors"
          >
            <ChevronRight className="size-6" />
          </button>
        )}

        {/* Caption */}
        {currentImage && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 max-w-sm">
            <span className="truncate">{currentImage.name}</span>
            {imgDimensions && (
              <span className="shrink-0 opacity-70">{imgDimensions.w} × {imgDimensions.h}</span>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    <div className="flex flex-col gap-4">
      {/* Drop Zone */}
      <div
        className={cn(
          "relative rounded-lg border border-dashed p-6 text-center transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-full bg-muted transition-colors", isDragging && "bg-primary/10")}>
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Arraste arquivos aqui ou{" "}
              <span className="text-primary underline-offset-4 hover:underline">selecione</span>
            </p>
            <p className="text-xs text-muted-foreground">Máximo 50 MB por arquivo · Até 20 arquivos</p>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive space-y-1">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" />
          <span className="text-sm">Carregando arquivos...</span>
        </div>
      )}

      {/* File list */}
      {!loading && totalCount > 0 && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {totalCount} {totalCount === 1 ? "arquivo" : "arquivos"}
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={openFileDialog} variant="outline" size="sm">
                <CloudUpload className="size-3.5" />
                Adicionar
              </Button>
              <div className="flex items-center rounded-md border border-border overflow-hidden">
                <Button
                  type="button"
                  variant={view === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-none border-0 shadow-none"
                  onClick={() => setView("grid")}
                  title="Cards"
                >
                  <LayoutGrid className="size-3.5" />
                </Button>
                <div className="w-px h-5 bg-border" />
                <Button
                  type="button"
                  variant={view === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-none border-0 shadow-none"
                  onClick={() => setView("list")}
                  title="Lista"
                >
                  <List className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* ── Grid View ──────────────────────────────────────────────────── */}
          {view === "grid" && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {allFiles.map((item) => {
                if (item.kind === "remote") {
                  const f = item.data;
                  const isImage = f.mime_type.startsWith("image/");
                  return (
                    <div key={`r-${f.id}`} className="group/card relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            onClick={() => deleteRemote(f.id)}
                            variant="outline"
                            size="icon"
                            className="absolute -end-2 -top-2 z-10 size-5 rounded-full opacity-0 transition-opacity group-hover/card:opacity-100"
                          >
                            <X className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Lixeira</TooltipContent>
                      </Tooltip>
                      <div className="overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                        <div className="relative aspect-square border-b bg-muted overflow-hidden">
                          {isImage ? (
                            <img
                              src={f.url}
                              alt={f.name}
                              className="h-full w-full object-cover cursor-zoom-in transition-transform duration-300 hover:scale-105"
                              onClick={() => openLightbox(f.url)}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground/60">
                              {getFileIcon(f.mime_type, "size-10")}
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-xs font-medium" title={f.name}>{f.name}</p>
                          <div className="mt-0.5 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={() => downloadFile(f.id, f.name)}
                                >
                                  <Download className="size-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Download</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                const f = item.data;
                const isImage = f.file.type.startsWith("image/");
                return (
                  <div key={`l-${f.localId}`} className="group/card relative">
                    {f.status === "error" && (
                      <Button
                        type="button"
                        onClick={() => setLocalFiles((prev) => prev.filter((x) => x.localId !== f.localId))}
                        variant="outline"
                        size="icon"
                        className="absolute -end-2 -top-2 z-10 size-5 rounded-full opacity-0 transition-opacity group-hover/card:opacity-100"
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                    <div className="overflow-hidden rounded-lg border bg-card opacity-80 transition-all duration-200 hover:shadow-md">
                      <div className="relative aspect-square border-b bg-muted">
                        {isImage && f.preview ? (
                          <>
                            <img
                              src={f.preview}
                              alt={f.file.name}
                              className={cn("h-full w-full object-cover", f.status !== "uploading" && "cursor-zoom-in")}
                              onClick={() => f.status !== "uploading" && openLightbox(f.preview!)}
                            />
                            {f.status === "uploading" && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Loader2 className="size-6 text-white animate-spin" />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground/60">
                            {f.status === "uploading"
                              ? <Loader2 className="size-8 animate-spin text-primary" />
                              : getFileIcon(f.file.type, "size-10")}
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-xs font-medium" title={f.file.name}>{f.file.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground">{formatBytes(f.file.size)}</p>
                          {f.status === "error" && (
                            <button type="button" onClick={() => retryUpload(f)} className="text-xs text-destructive hover:underline">
                              Tentar novamente
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── List View ──────────────────────────────────────────────────── */}
          {view === "list" && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="h-9 ps-3">Nome</TableHead>
                    <TableHead className="h-9">Tipo</TableHead>
                    <TableHead className="h-9">Tamanho</TableHead>
                    <TableHead className="h-9 w-16 text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allFiles.map((item) => {
                    if (item.kind === "remote") {
                      const f = item.data;
                      const isImage = f.mime_type.startsWith("image/");
                      return (
                        <TableRow key={`r-${f.id}`}>
                          <TableCell className="py-2 ps-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn("text-muted-foreground", isImage && "cursor-zoom-in")}
                                onClick={() => isImage && openLightbox(f.url)}
                              >
                                {getFileIcon(f.mime_type, "size-4")}
                              </span>
                              <span className="truncate max-w-[180px] text-sm font-medium" title={f.name}>{f.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="secondary" size="sm">{getFileTypeLabel(f.mime_type)}</Badge>
                          </TableCell>
                          <TableCell className="py-2 text-sm text-muted-foreground">{formatBytes(f.size)}</TableCell>
                          <TableCell className="py-2 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => downloadFile(f.id, f.name)}>
                                    <Download className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button type="button" onClick={() => deleteRemote(f.id)} variant="ghost" size="icon" className="size-7">
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Lixeira</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    const f = item.data;
                    return (
                      <TableRow key={`l-${f.localId}`} className="opacity-70">
                        <TableCell className="py-2 ps-3">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {f.status === "uploading"
                                ? <Loader2 className="size-4 animate-spin text-primary" />
                                : getFileIcon(f.file.type, "size-4")}
                            </span>
                            <span className="truncate max-w-[180px] text-sm font-medium" title={f.file.name}>{f.file.name}</span>
                            {f.status === "error" && <Badge variant="destructive-light" size="sm">Erro</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="secondary" size="sm">{getFileTypeLabel(f.file.type)}</Badge>
                        </TableCell>
                        <TableCell className="py-2 text-sm text-muted-foreground">{formatBytes(f.file.size)}</TableCell>
                        <TableCell className="py-2 text-center">
                          {f.status === "error" ? (
                            <Button type="button" onClick={() => retryUpload(f)} variant="ghost" size="icon" className="size-7 text-destructive" title="Tentar novamente">
                              <Loader2 className="size-3.5" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => setLocalFiles((prev) => prev.filter((x) => x.localId !== f.localId))}
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              disabled={f.status === "uploading"}
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
          <CloudUpload className="size-8 opacity-40" />
          <p className="text-sm">Nenhum arquivo ainda</p>
        </div>
      )}
    </div>
    </>
  );
}

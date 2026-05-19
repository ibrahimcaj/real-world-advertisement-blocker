"use client";

import { useState, useEffect, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  LabelingCanvas,
  type EdgeKey,
  type ImageLabels,
  type LabelPoint,
  type CropRect,
  DEFAULT_CROP,
  ALL_EDGES,
  EDGE_COLORS,
} from "@/components/labeling-canvas";
import { Check, Crop, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { storeDirHandle, getStoredDirHandle, readLabelsFromDir } from "@/lib/storage";

interface ImageEntry {
  id: string;
  filename: string;
  url: string;
  labels: ImageLabels;
  // separate from having all points, ctrl+enter is what commits it
  saved: boolean;
}

function isFullyLabeled(labels: ImageLabels): boolean {
  return ALL_EDGES.every(e => labels[e] !== undefined);
}

// navigator.platform is deprecated but still the simplest platform check
const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

const EDGE_SHORTCUT: Record<EdgeKey, string> = { top:"1", right:"2", bottom:"3", left:"4" };
const EDGE_LETTER:   Record<EdgeKey, string> = { top:"T", right:"R", bottom:"B", left:"L" };

const TOOL_BTN = cn(
  "w-9 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg transition-colors outline-none",
  "focus-visible:ring-2 focus-visible:ring-ring"
);
const SHORTCUT = "text-[9px] leading-none tabular-nums select-none text-muted-foreground/60";

// runs outside the component so it doesnt close over stale state
async function loadImagesFromDir(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dir: any,
  savedLabels: Record<string, ImageLabels>
): Promise<ImageEntry[]> {
  const entries: ImageEntry[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const [name, handle] of (dir as any).entries()) {
    if (handle.kind !== "file") continue;
    const file = await handle.getFile();
    // skip ds_store and other non-image files in the folder
    if (!file.type.startsWith("image/")) continue;
    entries.push({
      id: crypto.randomUUID(),
      filename: name,
      url: URL.createObjectURL(file),
      labels: savedLabels[name] ?? {},
      // present in labels.json means already done
      saved: !!savedLabels[name],
    });
  }
  // alphabetical so order is predictable regardless of filesystem order
  entries.sort((a, b) => a.filename.localeCompare(b.filename));
  return entries;
}

export default function Home() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<"label" | "crop">("label");
  const [crop, setCrop] = useState<CropRect>(DEFAULT_CROP);
  const [selectedEdge, setSelectedEdge] = useState<EdgeKey>("top");
  const [done, setDone] = useState(false);

  // ref so async handlers always write to the current handle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dirHandleRef = useRef<any>(null);

  const currentImage = images[currentIndex] ?? null;
  const labeledCount = images.filter(img => img.saved).length;

  // try to reopen last session on mount
  useEffect(() => {
    async function restoreSession() {
      const handle = await getStoredDirHandle();
      if (!handle) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const perm = await (handle as any).queryPermission({ mode: "readwrite" });
        const granted =
          perm === "granted" ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (await (handle as any).requestPermission({ mode: "readwrite" })) === "granted";
        // user rejected the permission prompt, dont bother loading
        if (!granted) return;

        const saved = await readLabelsFromDir(handle);
        const entries = await loadImagesFromDir(handle, saved);
        if (entries.length === 0) return;

        dirHandleRef.current = handle;
        setImages(entries);
        // jump straight to first thing that still needs doing
        const firstUnlabeled = entries.findIndex(e => !e.saved);
        setCurrentIndex(firstUnlabeled >= 0 ? firstUnlabeled : 0);
      } catch {
        // handle is stale or folder moved, just start fresh
      }
    }
    restoreSession();
  }, []);

  // reset crop so previous image crop doesnt bleed into the next image
  useEffect(() => { setCrop(DEFAULT_CROP); }, [currentIndex]);

  async function handleOpenFolder() {
    if (!("showDirectoryPicker" in window)) {
      toast.error("Folder access requires Chrome or Edge.");
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dir = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      const saved = await readLabelsFromDir(dir);
      const entries = await loadImagesFromDir(dir, saved);

      dirHandleRef.current = dir;
      // persist so next visit skips the picker
      await storeDirHandle(dir);
      setImages(entries);
      setDone(false);
      const firstUnlabeled = entries.findIndex(e => !e.saved);
      setCurrentIndex(firstUnlabeled >= 0 ? firstUnlabeled : 0);
      setCrop(DEFAULT_CROP);
      setSelectedEdge("top");
    } catch {
      // user hit cancel in the picker
    }
  }

  function handleLabelChange(edge: EdgeKey, point: LabelPoint) {
    if (!currentImage) return;
    setImages(prev =>
      prev.map(img =>
        img.id === currentImage.id
          ? { ...img, labels: { ...img.labels, [edge]: point } }
          : img
      )
    );
    // cycle to next edge so the user doesnt have to press 1234 manually each time
    const nextEdge = ALL_EDGES[(ALL_EDGES.indexOf(edge) + 1) % ALL_EDGES.length];
    setSelectedEdge(nextEdge);
  }

  function handleClear() {
    // backspace behavior differs by mode so one key does the right thing
    if (mode === "crop") { setCrop(DEFAULT_CROP); return; }
    if (!currentImage) return;
    setImages(prev =>
      prev.map(img =>
        img.id === currentImage.id ? { ...img, labels: {}, saved: false } : img
      )
    );
    // start from top again after clearing
    setSelectedEdge("top");
  }

  async function persistLabelsJSON(currentImages: ImageEntry[]) {
    if (!dirHandleRef.current) return;
    const labeled = currentImages.filter(img => isFullyLabeled(img.labels));
    // nothing to write yet
    if (labeled.length === 0) return;
    const data = labeled.map(({ filename, labels: l }) => ({
      filename,
      top:    l.top,
      right:  l.right,
      bottom: l.bottom,
      left:   l.left,
    }));
    try {
      const fh = await dirHandleRef.current.getFileHandle("labels.json", { create: true });
      const wr = await fh.createWritable();
      await wr.write(JSON.stringify(data, null, 2));
      await wr.close();
    } catch (err) {
      console.error("Auto-save JSON failed:", err);
    }
  }

  async function handleSaveAndNext() {
    if (!currentImage) return;

    const { left, right, top, bottom } = crop;
    const isDefaultCrop = left === 0 && right === 1 && top === 0 && bottom === 1;

    // track the latest image list so we can pass it to persistLabelsJSON
    // without waiting for react state to flush
    let updatedImages = images;

    if (!isDefaultCrop) {
      if (!dirHandleRef.current) {
        toast.error("Open a folder first so files can be saved in place.");
        return;
      }

      const img = new Image();
      img.src = currentImage.url;
      // blob urls sometimes resolve before onload so check complete first
      if (!img.complete) {
        await new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); });
      }

      const srcX = Math.round(left * img.naturalWidth);
      const srcY = Math.round(top  * img.naturalHeight);
      // min 1 so canvas never has a zero dimension
      const srcW = Math.max(1, Math.round((right  - left) * img.naturalWidth));
      const srcH = Math.max(1, Math.round((bottom - top)  * img.naturalHeight));

      const canvas = document.createElement("canvas");
      canvas.width = srcW; canvas.height = srcH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

      // preserve format so png transparency isnt lost
      const isPng = currentImage.filename.toLowerCase().endsWith(".png");
      const blob = await new Promise<Blob | null>(res =>
        canvas.toBlob(res, isPng ? "image/png" : "image/jpeg", 0.95)
      );
      if (!blob) return;

      try {
        // overwrite in place so the folder is the single source of truth
        const fh = await dirHandleRef.current.getFileHandle(currentImage.filename, { create: true });
        const wr = await fh.createWritable();
        await wr.write(blob); await wr.close();

        // update url so the thumbnail reflects the crop this session
        const newUrl = URL.createObjectURL(blob);
        updatedImages = images.map(e =>
          e.id === currentImage.id ? { ...e, url: newUrl } : e
        );
        setImages(updatedImages);
        toast.success(`Saved: ${currentImage.filename}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to save file.");
        return;
      }
    }

    // mark done before persisting so the json reflects this image too
    updatedImages = updatedImages.map(e =>
      e.id === currentImage.id ? { ...e, saved: true } : e
    );
    setImages(updatedImages);

    await persistLabelsJSON(updatedImages);

    setCrop(DEFAULT_CROP);
    setSelectedEdge("top");

    // last image means the batch is done
    if (currentIndex >= images.length - 1) {
      setDone(true);
      return;
    }
    setCurrentIndex(i => i + 1);
  }

  // refs so the keyboard handler always calls the latest version of each
  // function without needing to be in the dependency array
  const handleClearRef = useRef(handleClear);
  handleClearRef.current = handleClear;
  const handleSaveAndNextRef = useRef(handleSaveAndNext);
  handleSaveAndNextRef.current = handleSaveAndNext;
  // modeRef so backspace reads fresh mode without stale closure
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).matches("input,textarea")) return;
      // done screen swallows all keys except escape
      if (done) { if (e.key === "Escape") setDone(false); return; }

      if (e.key === "ArrowLeft") {
        e.preventDefault(); setCurrentIndex(i => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault(); setCurrentIndex(i => Math.min(images.length - 1, i + 1));
      } else if (e.key === "c" || e.key === "C") {
        // guard metaKey so cmd+c for copy still works
        if (!e.metaKey && !e.ctrlKey) setMode("crop");
      } else if (e.key === "l" || e.key === "L") {
        setMode("label");
      } else if (e.key === "1") {
        setMode("label"); setSelectedEdge("top");
      } else if (e.key === "2") {
        setMode("label"); setSelectedEdge("right");
      } else if (e.key === "3") {
        setMode("label"); setSelectedEdge("bottom");
      } else if (e.key === "4") {
        setMode("label"); setSelectedEdge("left");
      } else if (e.key === "Backspace") {
        e.preventDefault(); handleClearRef.current();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); handleSaveAndNextRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, done]);

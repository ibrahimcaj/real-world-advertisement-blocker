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

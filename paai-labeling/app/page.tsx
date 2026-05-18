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

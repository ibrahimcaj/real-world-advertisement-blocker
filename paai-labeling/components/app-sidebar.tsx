"use client";

import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLabels { top?: unknown; right?: unknown; bottom?: unknown; left?: unknown; }

interface SidebarEntry {
  id: string; filename: string; url: string;
  labels: ImageLabels;
  // ctrl+enter sets this, not just having all points
  saved: boolean;
}

type Status = "completed" | "started" | "none";

function getStatus(entry: SidebarEntry): Status {
  if (entry.saved) return "completed";
  const count = [entry.labels.top, entry.labels.right, entry.labels.bottom, entry.labels.left].filter(v => v !== undefined).length;
  return count > 0 ? "started" : "none";
}

interface AppSidebarProps {
  images: SidebarEntry[]; currentIndex: number;
  onSelectImage: (index: number) => void; onOpenFolder: () => void;
}

export function AppSidebar({ images, currentIndex, onSelectImage, onOpenFolder }: AppSidebarProps) {
  return (
    <aside className="w-60 border-r flex flex-col h-full bg-background shrink-0">
      <div className="px-3 py-2.5 border-b">
        <button onClick={onOpenFolder}><Upload /></button>
      </div>
    </aside>
  );
}

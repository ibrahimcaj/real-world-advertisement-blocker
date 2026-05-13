"use client";

import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarEntry {
  id: string;
  filename: string;
  url: string;
  labels: { top?: unknown; right?: unknown; bottom?: unknown; left?: unknown };
  saved: boolean;
}

interface AppSidebarProps {
  images: SidebarEntry[];
  currentIndex: number;
  onSelectImage: (index: number) => void;
  onOpenFolder: () => void;
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

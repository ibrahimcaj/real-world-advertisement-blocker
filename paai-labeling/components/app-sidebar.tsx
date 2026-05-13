"use client";

import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// only care if keys exist, not their values
interface ImageLabels {
  top?: unknown;
  right?: unknown;
  bottom?: unknown;
  left?: unknown;
}

interface SidebarEntry {
  id: string;
  filename: string;
  url: string;
  labels: ImageLabels;
  // ctrl+enter sets this, not just having all points
  saved: boolean;
}

type Status = "completed" | "started" | "none";

// saved wins over partial labels
function getStatus(entry: SidebarEntry): Status {
  if (entry.saved) return "completed";
  const count = [entry.labels.top, entry.labels.right, entry.labels.bottom, entry.labels.left].filter(
    (v) => v !== undefined
  ).length;
  if (count > 0) return "started";
  return "none";
}

// muted so done items fade away visually
const STATUS_TEXT_CLASSES: Record<Status, string> = {
  completed: "text-muted-foreground/50",
  started: "text-yellow-500",
  none: "",
};

const STATUS_LABEL: Record<Status, string> = {
  completed: "completed",
  started: "started",
  none: "", // nothing shown keeps rows compact
};

interface AppSidebarProps {
  images: SidebarEntry[];
  currentIndex: number;
  onSelectImage: (index: number) => void;
  onOpenFolder: () => void;
}

export function AppSidebar({
  images,
  currentIndex,
  onSelectImage,
  onOpenFolder,
}: AppSidebarProps) {

  // derive here so parent doesnt have to track it
  const labeledCount = images.filter((img) => getStatus(img) === "completed").length;

  return (
    <aside className="w-60 border-r flex flex-col h-full bg-background shrink-0">
      <div className="px-3 py-2.5 border-b flex items-center gap-2">
        {/* progress at a glance without scrolling */}
        <span className="text-xs text-muted-foreground tabular-nums">
          <span className="text-foreground font-medium">{labeledCount}</span>
          {" / "}
          {images.length}
          {" labeled"}
        </span>
        <button
          onClick={onOpenFolder}
          title="Open image folder"
          className="ml-auto size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
        >
          <Upload className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {images.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Open a folder to start
          </div>
        ) : (
          <div className="py-1">
            {images.map((img, index) => {
              const status = getStatus(img);
              const completed = status === "completed";
              return (
                <button
                  key={img.id}
                  onClick={() => onSelectImage(index)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 text-left transition-colors outline-none",
                    "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
                    currentIndex === index
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  )}
                >
                  {/* fade done items so unfinished ones stand out */}
                  <div className={cn(
                    "w-10 h-9 rounded overflow-hidden shrink-0 bg-muted",
                    
                  )}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn(
                      "text-xs truncate font-medium leading-tight",
                      currentIndex === index
                        ? "text-accent-foreground"
                        : completed ? "text-muted-foreground/50" : "text-foreground"
                    )}>
                      {img.filename}
                    </div>
                    {false && (
                      <div className={cn("text-[10px] leading-tight mt-0.5", STATUS_TEXT_CLASSES[status])}>
                        {STATUS_LABEL[status]}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

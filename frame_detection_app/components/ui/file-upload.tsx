"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  onChange: (file: File) => void;
  className?: string;
}

export function FileUpload({ accept, onChange, className }: FileUploadProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [name, setName]         = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function pick(file: File | undefined) {
    if (!file) return;
    setName(file.name);
    onChange(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-accent/30",
        className,
      )}
      onClick={() => inputRef.current?.click()}
      onKeyDown={e => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
    >
      <Upload className="size-5 text-muted-foreground" />
      <p className="max-w-full truncate px-2 text-xs text-muted-foreground">
        {name ?? "Drop file or click to browse"}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => pick(e.target.files?.[0])}
      />
    </div>
  );
}

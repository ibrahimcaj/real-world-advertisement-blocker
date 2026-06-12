"use client";

import { Slider as Base } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className }: SliderProps) {
  return (
    <Base.Root
      value={value}
      onValueChange={v => onValueChange(v as number)}
      min={min}
      max={max}
      step={step}
      className={cn("relative w-full touch-none select-none", className)}
    >
      <Base.Control className="flex h-10 w-full cursor-pointer items-center">
        <Base.Track className="relative h-3 w-full grow rounded-full bg-muted">
          <Base.Indicator className="absolute h-full rounded-full bg-primary" />
          <Base.Thumb className="block size-5 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
        </Base.Track>
      </Base.Control>
    </Base.Root>
  );
}

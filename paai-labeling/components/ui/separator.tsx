"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "@/lib/utils";

function Separator({ className, ...props }: SeparatorPrimitive.Props) {
  return <SeparatorPrimitive className={cn("shrink-0 bg-border", className)} {...props} />;
}

export { Separator };

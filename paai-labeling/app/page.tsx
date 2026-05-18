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

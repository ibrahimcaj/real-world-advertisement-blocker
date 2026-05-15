"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export type EdgeKey = "top" | "right" | "bottom" | "left";
export interface LabelPoint { x: number; y: number; }
export interface ImageLabels { top?: LabelPoint; right?: LabelPoint; bottom?: LabelPoint; left?: LabelPoint; }
export interface CropRect { top: number; bottom: number; left: number; right: number; }
export const DEFAULT_CROP: CropRect = { top: 0, bottom: 1, left: 0, right: 1 };
export const EDGE_COLORS: Record<EdgeKey, string> = { top: "#22c55e", right: "#a855f7", bottom: "#f97316", left: "#3b82f6" };
const EDGE_LABEL: Record<EdgeKey, string> = { top:"T", right:"R", bottom:"B", left:"L" };
export const ALL_EDGES: EdgeKey[] = ["top", "right", "bottom", "left"];

interface Bounds {
  imgW: number; imgH: number;
  imgLeft: number; imgTop: number;
  cW: number; cH: number;
}

export interface LabelingCanvasProps {
  imageUrl: string;
  labels: ImageLabels;
  onLabelChange: (edge: EdgeKey, point: LabelPoint) => void;
  mode: "label" | "crop";
  crop: CropRect;
  onCropChange: (crop: CropRect) => void;
  // lives in parent so toolbar can read and set it too
  selectedEdge: EdgeKey;
}

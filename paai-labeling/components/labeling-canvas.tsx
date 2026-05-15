"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export type EdgeKey = "top" | "right" | "bottom" | "left";

export interface LabelPoint { x: number; y: number; }

// free xy instead of edge position, user clicks anywhere
export interface ImageLabels {
  top?: LabelPoint;
  right?: LabelPoint;
  bottom?: LabelPoint;
  left?: LabelPoint;
}

export interface CropRect {
  top: number; bottom: number; left: number; right: number;
}

// fractions so coords survive resizing and cropping
export const DEFAULT_CROP: CropRect = { top: 0, bottom: 1, left: 0, right: 1 };

// exported so toolbar reuses same colors
export const EDGE_COLORS: Record<EdgeKey, string> = {
  top: "#22c55e", right: "#a855f7", bottom: "#f97316", left: "#3b82f6",
};

// order draws a convex quad when points are on edges
export const ALL_EDGES: EdgeKey[] = ["top", "right", "bottom", "left"];

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
interface Bounds { imgW: number; imgH: number; imgLeft: number; imgTop: number; cW: number; cH: number; }
export interface LabelingCanvasProps { imageUrl: string; labels: ImageLabels; onLabelChange: (edge: EdgeKey, point: LabelPoint) => void; mode: "label" | "crop"; crop: CropRect; onCropChange: (crop: CropRect) => void; selectedEdge: EdgeKey; }

export function LabelingCanvas({ imageUrl, labels, onLabelChange, mode, crop, onCropChange, selectedEdge }: LabelingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [ghost, setGhost]   = useState<{ x: number; y: number } | null>(null);
  const [cropDrag, setCropDrag] = useState<EdgeKey | null>(null);
  const dragBoundsRef = useRef<Bounds | null>(null);

  // stable ref avoids observer reattaching every render
  const recalc = useCallback(() => {
    const c = containerRef.current, img = imgRef.current;
    if (!c || !img || !img.naturalWidth || !img.naturalHeight) return;
    const cW = c.clientWidth, cH = c.clientHeight;
    if (!cW || !cH) return;
    const iA = img.naturalWidth / img.naturalHeight, cA = cW / cH;
    let imgW: number, imgH: number, imgLeft: number, imgTop: number;
    // object contain letterbox math so dots land on actual pixels
    if (iA > cA) { imgW=cW; imgH=cW/iA; imgLeft=0;            imgTop=(cH-imgH)/2; }
    else         { imgH=cH; imgW=cH*iA; imgLeft=(cW-imgW)/2;  imgTop=0;           }
    setBounds({ imgW, imgH, imgLeft, imgTop, cW, cH });
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}

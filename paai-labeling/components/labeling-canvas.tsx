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

  const recalc = useCallback(() => {
    const c = containerRef.current, img = imgRef.current;
    if (!c || !img || !img.naturalWidth || !img.naturalHeight) return;
    const cW = c.clientWidth, cH = c.clientHeight;
    if (!cW || !cH) return;
    const iA = img.naturalWidth / img.naturalHeight, cA = cW / cH;
    let imgW: number, imgH: number, imgLeft: number, imgTop: number;
    if (iA > cA) { imgW=cW; imgH=cW/iA; imgLeft=0; imgTop=(cH-imgH)/2; }
    else         { imgH=cH; imgW=cH*iA; imgLeft=(cW-imgW)/2; imgTop=0; }
    setBounds({ imgW, imgH, imgLeft, imgTop, cW, cH });
  }, []);

  useEffect(()=>{const c=containerRef.current;if(!c)return;const ro=new ResizeObserver(recalc);ro.observe(c);return()=>ro.disconnect();},[recalc]);
  useEffect(()=>{setBounds(null);setGhost(null);recalc();},[imageUrl,recalc]);
  useEffect(()=>{setGhost(null);setCropDrag(null);},[mode]);
  useEffect(()=>{const up=()=>{setCropDrag(null);dragBoundsRef.current=null;};window.addEventListener("mouseup",up);return()=>window.removeEventListener("mouseup",up);},[]);

  // shared between modes so switching doesnt reset the viewport
  const zoom = (() => {
    if (!bounds) return null;
    const { left:cl, right:cr, top:ct, bottom:cb } = crop;
    if (cl===0 && cr===1 && ct===0 && cb===1) return null;
    const cropW=(cr-cl)*bounds.imgW, cropH=(cb-ct)*bounds.imgH;
    if (cropW<=0||cropH<=0) return null;
    const s=Math.min(bounds.cW/cropW,bounds.cH/cropH);
    const ox=bounds.imgLeft+(cl+cr)/2*bounds.imgW;
    const oy=bounds.imgTop+(ct+cb)/2*bounds.imgH;
    const tx=(bounds.cW/2-ox)/s; const ty=(bounds.cH/2-oy)/s;
    const insetX=(bounds.cW-cropW*s)/2; const insetY=(bounds.cH-cropH*s)/2;
    return { s, ox, oy, tx, ty, insetX, insetY };
  })();

  // mirrors the css transform so dot positions match screen pixels
  const activeBounds: Bounds|null = (() => {
    if (!bounds) return null;
    if (!zoom) return bounds;
    const{s,ox,oy}=zoom;
    return{...bounds,imgW:bounds.imgW*s,imgH:bounds.imgH*s,imgLeft:(bounds.imgLeft-ox)*s+bounds.cW/2,imgTop:(bounds.imgTop-oy)*s+bounds.cH/2};
  })();

  function relPos(e:React.MouseEvent<HTMLDivElement>){const c=containerRef.current;if(!c)return null;const r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function toScreen(pt:LabelPoint,ab:Bounds){return{x:ab.imgLeft+pt.x*ab.imgW,y:ab.imgTop+pt.y*ab.imgH};}

  return <div ref={containerRef} className="absolute inset-0" />;
}

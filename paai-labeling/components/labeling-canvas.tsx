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
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// fractions so coords survive resizing and cropping
export const DEFAULT_CROP: CropRect = { top: 0, bottom: 1, left: 0, right: 1 };

// exported so toolbar reuses same colors
export const EDGE_COLORS: Record<EdgeKey, string> = {
  top: "#22c55e", right: "#a855f7", bottom: "#f97316", left: "#3b82f6",
};

const EDGE_LABEL: Record<EdgeKey, string> = { top:"T", right:"R", bottom:"B", left:"L" };

// order draws a convex quad when points are on edges
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

export function LabelingCanvas({
  imageUrl, labels, onLabelChange, mode, crop, onCropChange, selectedEdge,
}: LabelingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [ghost, setGhost]   = useState<{ x: number; y: number } | null>(null);
  const [cropDrag, setCropDrag] = useState<EdgeKey | null>(null);

  // frozen at drag start so zoom shift mid drag doesnt chase the mouse
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

  useEffect(() => {
    const c = containerRef.current; if (!c) return;
    const ro = new ResizeObserver(recalc);
    ro.observe(c);
    return () => ro.disconnect();
  }, [recalc]);

  // recalc immediately because blob urls may already be decoded
  // so onload wont fire after the bounds null reset
  useEffect(() => {
    setBounds(null);
    setGhost(null);
    recalc();
  }, [imageUrl, recalc]);

  useEffect(() => { setGhost(null); setCropDrag(null); }, [mode]);

  useEffect(() => {
    // window so releasing outside the element still ends drag
    const up = () => { setCropDrag(null); dragBoundsRef.current = null; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  // shared between modes so switching doesnt reset the viewport
  const zoom = (() => {
    if (!bounds) return null;
    const { left:cl, right:cr, top:ct, bottom:cb } = crop;
    // no transform needed when fully zoomed out
    if (cl===0 && cr===1 && ct===0 && cb===1) return null;
    const cropW = (cr-cl)*bounds.imgW, cropH = (cb-ct)*bounds.imgH;
    if (cropW<=0 || cropH<=0) return null;
    // smaller axis so we never clip the crop region
    const s      = Math.min(bounds.cW/cropW, bounds.cH/cropH);
    const ox     = bounds.imgLeft + (cl+cr)/2 * bounds.imgW;
    const oy     = bounds.imgTop  + (ct+cb)/2 * bounds.imgH;
    // crop center lands on container center after scale
    const tx     = (bounds.cW/2 - ox) / s;
    const ty     = (bounds.cH/2 - oy) / s;
    // clip inset removes gray letterbox bars
    const insetX = (bounds.cW - cropW*s) / 2;
    const insetY = (bounds.cH - cropH*s) / 2;
    return { s, ox, oy, tx, ty, insetX, insetY };
  })();

  // mirrors the css transform so dot positions match screen pixels
  const activeBounds: Bounds | null = (() => {
    if (!bounds) return null;
    if (!zoom) return bounds;
    const { s, ox, oy } = zoom;
    return {
      ...bounds,
      imgW:    bounds.imgW * s,
      imgH:    bounds.imgH * s,
      imgLeft: (bounds.imgLeft - ox)*s + bounds.cW/2,
      imgTop:  (bounds.imgTop  - oy)*s + bounds.cH/2,
    };
  })();

  function relPos(e: React.MouseEvent<HTMLDivElement>) {
    const c = containerRef.current; if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // normalized label to screen pixel
  function toScreen(pt: LabelPoint, ab: Bounds) {
    return { x: ab.imgLeft + pt.x * ab.imgW, y: ab.imgTop + pt.y * ab.imgH };
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const pos = relPos(e); if (!pos) return;

    if (cropDrag && dragBoundsRef.current) {
      const db = dragBoundsRef.current;
      // clamp so rect never inverts or leaves image
      const nx = Math.max(0, Math.min(1, (pos.x - db.imgLeft) / db.imgW));
      const ny = Math.max(0, Math.min(1, (pos.y - db.imgTop)  / db.imgH));
      if (cropDrag === "top" || cropDrag === "bottom")
        onCropChange({ ...crop, [cropDrag]: ny });
      else
        onCropChange({ ...crop, [cropDrag]: nx });
      return;
    }

    if (mode !== "label" || !activeBounds) return;
    const { imgW, imgH, imgLeft, imgTop } = activeBounds;
    // hide ghost outside image so click outside wont confuse user
    if (pos.x < imgLeft || pos.x > imgLeft+imgW || pos.y < imgTop || pos.y > imgTop+imgH) {
      setGhost(null); return;
    }
    setGhost({ x: pos.x, y: pos.y });
  }

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "label" || cropDrag || !activeBounds) return;
    const pos = relPos(e); if (!pos) return;
    const { imgW, imgH, imgLeft, imgTop } = activeBounds;
    if (pos.x < imgLeft || pos.x > imgLeft+imgW || pos.y < imgTop || pos.y > imgTop+imgH) return;
    // normalize so coords work at any zoom or display size
    const nx = (pos.x - imgLeft) / imgW;
    const ny = (pos.y - imgTop)  / imgH;
    onLabelChange(selectedEdge, { x: nx, y: ny });
  }

  const allLabeled = ALL_EDGES.every(e => labels[e] !== undefined);

  // polygon only makes sense when all four exist
  const quadPts = activeBounds && allLabeled
    ? ALL_EDGES.map(e => {
        const s = toScreen(labels[e]!, activeBounds);
        return `${s.x},${s.y}`;
      }).join(" ")
    : null;

  const cropPx = activeBounds ? {
    x:  activeBounds.imgLeft + crop.left   * activeBounds.imgW,
    y:  activeBounds.imgTop  + crop.top    * activeBounds.imgH,
    x2: activeBounds.imgLeft + crop.right  * activeBounds.imgW,
    y2: activeBounds.imgTop  + crop.bottom * activeBounds.imgH,
  } : null;

  const cursor = cropDrag
    ? (cropDrag==="top"||cropDrag==="bottom" ? "cursor-ns-resize" : "cursor-ew-resize")
    : mode === "label" ? "cursor-crosshair" : "cursor-default";

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 select-none ${cursor}`}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { if (!cropDrag) setGhost(null); }}
    >
      {/* clip hides gray bars outside the zoomed region */}
      <div
        className="absolute inset-0"
        style={zoom ? { clipPath: `inset(${zoom.insetY}px ${zoom.insetX}px)` } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Labeling target"
          className="absolute inset-0 w-full h-full object-contain"
          style={zoom ? {
            transformOrigin: `${zoom.ox}px ${zoom.oy}px`,
            transform: `scale(${zoom.s}) translate(${zoom.tx}px, ${zoom.ty}px)`,
          } : undefined}
          onLoad={recalc}
          onDragStart={e => e.preventDefault()}
          draggable={false}
        />
      </div>

      {mode === "label" && <>
        {/* polygon shows the annotated shape at a glance */}
        {quadPts && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex:5 }}>
            <polygon points={quadPts}
              fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        )}

        {activeBounds && ALL_EDGES.filter(e => labels[e] !== undefined).map(edge => {
          const { x, y } = toScreen(labels[edge]!, activeBounds);
          return (
            <div key={edge} className="absolute pointer-events-none"
              style={{ zIndex:10, left:x, top:y, transform:"translate(-50%,-50%)" }}>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-lg"
                style={{ backgroundColor:EDGE_COLORS[edge], borderColor:"rgba(255,255,255,0.8)" }}>
                <span className="text-[8px] font-bold text-white leading-none">{EDGE_LABEL[edge]}</span>
              </div>
            </div>
          );
        })}

        {/* colored for selected edge so user knows what theyre placing */}
        {ghost && (
          <div className="absolute pointer-events-none"
            style={{ zIndex:20, left:ghost.x, top:ghost.y, transform:"translate(-50%,-50%)" }}>
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-lg"
              style={{ backgroundColor:EDGE_COLORS[selectedEdge], borderColor:"rgba(255,255,255,0.8)", opacity:0.45 }}>
              <span className="text-[8px] font-bold text-white leading-none">{EDGE_LABEL[selectedEdge]}</span>
            </div>
          </div>
        )}
      </>}

      {mode === "crop" && activeBounds && cropPx && (
        <svg style={{
          position:"absolute", inset:0, width:"100%", height:"100%",
          overflow:"visible", zIndex:20, pointerEvents:"none",
        }}>
          <defs>
            {/* evenodd punches a hole so stroke never bleeds inside */}
            <clipPath id="crop-outside">
              <path fillRule="evenodd" d={
                `M-9999,-9999 H9999 V9999 H-9999 Z ` +
                `M${cropPx.x},${cropPx.y} H${cropPx.x2} V${cropPx.y2} H${cropPx.x} Z`
              } />
            </clipPath>
          </defs>

          <rect
            x={cropPx.x} y={cropPx.y}
            width={cropPx.x2-cropPx.x} height={cropPx.y2-cropPx.y}
            fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1"
            clipPath="url(#crop-outside)"
          />

          {/* rule of thirds for composition */}
          {[1/3, 2/3].map(f => (
            <g key={f} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5">
              <line x1={cropPx.x + f*(cropPx.x2-cropPx.x)} y1={cropPx.y}
                    x2={cropPx.x + f*(cropPx.x2-cropPx.x)} y2={cropPx.y2} />
              <line x1={cropPx.x} y1={cropPx.y + f*(cropPx.y2-cropPx.y)}
                    x2={cropPx.x2} y2={cropPx.y + f*(cropPx.y2-cropPx.y)} />
            </g>
          ))}

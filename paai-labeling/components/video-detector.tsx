"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Detection {
  box: [number, number, number, number]; // x1 y1 x2 y2 normalized 0-1
  class_id: number;
  confidence: number;
}

const SERVER = "http://localhost:8000";

// enough colors for common yolo class counts
const BOX_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e","#3b82f6",
  "#a855f7","#ec4899","#14b8a6","#f59e0b","#6366f1",
];

function classColor(id: number) {
  return BOX_COLORS[id % BOX_COLORS.length];
}

export function VideoDetector({ classNames }: { classNames?: string[] }) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const hiddenRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const inferring  = useRef(false);
  const lastSent   = useRef(0);

  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps]               = useState(10);
  // null=checking, "offline"=unreachable, "no-model"=up but no model, "ready"=good
  const [serverStatus, setServerStatus] = useState<"checking"|"offline"|"no-model"|"ready">("checking");
  const [playing, setPlaying]       = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // check server is up on mount
  useEffect(() => {
    fetch(`${SERVER}/status`)
      .then(r => r.json())
      .then(d => setServerStatus(d.loaded ? "ready" : "no-model"))
      .catch(() => setServerStatus("offline"));
  }, []);

  const sendFrame = useCallback(async () => {
    const video = videoRef.current;
    const hidden = hiddenRef.current;
    if (!video || !hidden || video.paused || video.ended || inferring.current) return;

    inferring.current = true;
    const ctx = hidden.getContext("2d")!;
    // draw current frame into hidden 640x640 canvas
    ctx.drawImage(video, 0, 0, 640, 640);

    hidden.toBlob(async (blob) => {
      if (!blob) { inferring.current = false; return; }
      try {
        const form = new FormData();
        form.append("file", blob, "frame.jpg");
        const res = await fetch(`${SERVER}/predict`, { method: "POST", body: form });
        const data = await res.json();
        if (data.detections) setDetections(data.detections);
      } catch {
        // server down or slow, just skip
      } finally {
        inferring.current = false;
      }
    }, "image/jpeg", 0.85);
  }, []);

  // draw boxes every raf tick, send to server at throttled fps
  const loop = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) { rafRef.current = requestAnimationFrame(loop); return; }

    const ctx = canvas.getContext("2d")!;
    const vr  = video.getBoundingClientRect();
    const pr  = canvas.parentElement!.getBoundingClientRect();

    // size and position canvas to sit exactly over the video element
    canvas.width  = vr.width;
    canvas.height = vr.height;
    canvas.style.left   = `${vr.left - pr.left}px`;
    canvas.style.top    = `${vr.top  - pr.top}px`;
    canvas.style.width  = `${vr.width}px`;
    canvas.style.height = `${vr.height}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw boxes scaled to actual displayed video size
    for (const d of detections) {
      const [x1, y1, x2, y2] = d.box;
      const px  = x1 * canvas.width;
      const py  = y1 * canvas.height;
      const pw  = (x2 - x1) * canvas.width;
      const ph  = (y2 - y1) * canvas.height;
      const col = classColor(d.class_id);

      ctx.strokeStyle = col;
      ctx.lineWidth   = 2;
      ctx.strokeRect(px, py, pw, ph);

      const label = classNames?.[d.class_id] ?? `class ${d.class_id}`;
      const text  = `${label} ${Math.round(d.confidence * 100)}%`;

      ctx.font         = "bold 12px monospace";
      ctx.fillStyle    = col;
      const tw         = ctx.measureText(text).width;
      // tag background so text is readable on any image
      ctx.fillRect(px, py - 18, tw + 8, 18);
      ctx.fillStyle = "#000";
      ctx.fillText(text, px + 4, py - 4);
    }

    // throttle inference by fps slider
    const now = performance.now();
    if (now - lastSent.current > 1000 / fps) {
      lastSent.current = now;
      sendFrame();
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [detections, fps, sendFrame, classNames]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !videoRef.current) return;
    videoRef.current.src = URL.createObjectURL(file);
    setVideoLoaded(true);
    setDetections([]);
  }

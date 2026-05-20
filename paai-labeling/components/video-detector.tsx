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

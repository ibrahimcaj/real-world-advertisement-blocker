"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Muxer, ArrayBufferTarget } from "webm-muxer";
import { Square, Download } from "lucide-react";
import { Slider }     from "@/components/ui/slider";
import { FileUpload } from "@/components/ui/file-upload";

interface Detection {
  box: [number, number, number, number]; // x1 y1 x2 y2 normalised 0–1
  class_id: number;
  confidence: number;
}

type OverlayMode = "box" | "blur";

const SERVER = "http://localhost:8000";

const BOX_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e","#3b82f6",
  "#a855f7","#ec4899","#14b8a6","#f59e0b","#6366f1",
];
function classColor(id: number) { return BOX_COLORS[id % BOX_COLORS.length]; }

function drawBoxes(
  ctx: CanvasRenderingContext2D,
  dets: Detection[],
  w: number, h: number,
  classNames?: string[],
) {
  for (const d of dets) {
    const [x1, y1, x2, y2] = d.box;
    const px = x1 * w, py = y1 * h, pw = (x2 - x1) * w, ph = (y2 - y1) * h;
    const col = classColor(d.class_id);
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
    const label = classNames?.[d.class_id] ?? `class ${d.class_id}`;
    const text  = `${label} ${Math.round(d.confidence * 100)}%`;
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = col;
    const tw = ctx.measureText(text).width;
    // tag background so text is readable on any image
    ctx.fillRect(px, py - 18, tw + 8, 18);
    ctx.fillStyle = "#000";
    ctx.fillText(text, px + 4, py - 4);
  }
}

function applyBlur(
  ctx: CanvasRenderingContext2D,
  dets: Detection[],
  w: number, h: number,
) {
  for (const d of dets) {
    const [x1, y1, x2, y2] = d.box;
    const px = Math.floor(x1 * w), py = Math.floor(y1 * h);
    const pw = Math.ceil((x2 - x1) * w), ph = Math.ceil((y2 - y1) * h);
    if (pw < 1 || ph < 1) continue;
    ctx.save();
    ctx.filter = `blur(${Math.max(6, Math.round(Math.min(pw, ph) * 0.08))}px)`;
    ctx.drawImage(ctx.canvas, px, py, pw, ph, px, py, pw, ph);
    ctx.restore();
  }
}

function fmtETA(secs: number) {
  if (secs < 60) return `${Math.round(secs)}s`;
  return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`;
}

export function VideoDetector({ classNames }: { classNames?: string[] }) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const hiddenRef    = useRef<HTMLCanvasElement>(null);
  const composeRef   = useRef<HTMLCanvasElement>(null);
  const rafRef       = useRef<number>(0);
  const inferring    = useRef(false);
  const lastSent     = useRef(0);
  const cancelRender = useRef(false);

  const [detections, setDetections]       = useState<Detection[]>([]);
  const [fps, setFps]                     = useState(10);
  const [overlayMode, setOverlayMode]     = useState<OverlayMode>("box");
  const [serverStatus, setServerStatus]   = useState<"checking"|"offline"|"no-model"|"ready">("checking");
  const [videoLoaded, setVideoLoaded]     = useState(false);

  // inline render state — no dialog
  const [rendering, setRendering]         = useState(false);
  const [renderProgress, setRenderProgress] = useState(0); // 0–1
  const [renderFrame, setRenderFrame]     = useState(0);
  const [totalFrames, setTotalFrames]     = useState(0);
  const [renderETA, setRenderETA]         = useState<number | null>(null);
  const [renderedUrl, setRenderedUrl]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`${SERVER}/status`)
      .then(r => r.json())
      .then(d => setServerStatus(d.loaded ? "ready" : "no-model"))
      .catch(() => setServerStatus("offline"));
  }, []);

  // live inference loop
  const sendFrame = useCallback(async () => {
    const video  = videoRef.current;
    const hidden = hiddenRef.current;
    if (!video || !hidden || video.paused || video.ended || inferring.current) return;
    inferring.current = true;
    const ctx = hidden.getContext("2d")!;
    ctx.drawImage(video, 0, 0, 640, 640);
    hidden.toBlob(async (blob) => {
      if (!blob) { inferring.current = false; return; }
      try {
        const form = new FormData();
        form.append("file", blob, "frame.jpg");
        const res  = await fetch(`${SERVER}/predict`, { method: "POST", body: form });
        const data = await res.json();
        if (data.detections) setDetections(data.detections);
      } catch { /* skip on server hiccup */ } finally {
        inferring.current = false;
      }
    }, "image/jpeg", 0.85);
  }, []);

  const loop = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) { rafRef.current = requestAnimationFrame(loop); return; }
    const ctx = canvas.getContext("2d")!;
    const vr  = video.getBoundingClientRect();
    const pr  = canvas.parentElement!.getBoundingClientRect();
    canvas.width        = vr.width;
    canvas.height       = vr.height;
    canvas.style.left   = `${vr.left - pr.left}px`;
    canvas.style.top    = `${vr.top  - pr.top}px`;
    canvas.style.width  = `${vr.width}px`;
    canvas.style.height = `${vr.height}px`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (overlayMode === "box") {
      drawBoxes(ctx, detections, canvas.width, canvas.height, classNames);
    } else {
      // blur needs to draw the video frame first, then smear it
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      applyBlur(ctx, detections, canvas.width, canvas.height);
      // re-clear and composite so only blurred regions show; video shows beneath
      const blurred = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of detections) {
        const [x1, y1, x2, y2] = d.box;
        const px = Math.floor(x1 * canvas.width), py = Math.floor(y1 * canvas.height);
        const pw = Math.ceil((x2 - x1) * canvas.width), ph = Math.ceil((y2 - y1) * canvas.height);
        ctx.putImageData(blurred, 0, 0, px, py, pw, ph);
      }
    }
    const now = performance.now();
    if (now - lastSent.current > 1000 / fps) { lastSent.current = now; sendFrame(); }
    rafRef.current = requestAnimationFrame(loop);
  }, [detections, fps, overlayMode, sendFrame, classNames]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  function handleFile(file: File) {
    if (!videoRef.current) return;
    videoRef.current.src = URL.createObjectURL(file);
    setVideoLoaded(true);
    setDetections([]);
    setRenderedUrl(null);
  }

  async function startRender() {
    const video   = videoRef.current;
    const compose = composeRef.current;
    if (!video || !compose) return;

    cancelRender.current = false;
    setRendering(true);
    setRenderProgress(0);
    setRenderFrame(0);
    setRenderETA(null);
    setRenderedUrl(null);

    const wasPaused = video.paused;
    video.pause();

    const duration = video.duration;
    const W = video.videoWidth  || 1280;
    const H = video.videoHeight || 720;
    compose.width  = W;
    compose.height = H;

    // webm-muxer gives us correct per-frame timestamps so playback speed matches
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: "V_VP9", width: W, height: H, frameRate: fps },
      firstTimestampBehavior: "offset",
    });

    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta ?? undefined),
      error:  (e) => console.error("[render] encoder error", e),
    });
    encoder.configure({ codec: "vp09.00.10.08", width: W, height: H, bitrate: 4_000_000 });

    const ctx       = compose.getContext("2d")!;
    // each frame occupies exactly this many microseconds in the output
    const frameDuration  = 1_000_000 / fps;
    const total          = Math.ceil(duration * fps);
    setTotalFrames(total);
    const startTime = Date.now();

    for (let i = 0; i < total; i++) {
      if (cancelRender.current) break;

      // seek to the exact timestamp of this frame
      video.currentTime = i / fps;
      await new Promise<void>(res =>
        video.addEventListener("seeked", () => res(), { once: true })
      );

      // draw video frame then overlay
      ctx.drawImage(video, 0, 0, W, H);

      const blob = await new Promise<Blob | null>(r => compose.toBlob(r, "image/jpeg", 0.85));
      let dets: Detection[] = [];
      if (blob) {
        try {
          const form = new FormData();
          form.append("file", blob, "frame.jpg");
          const res  = await fetch(`${SERVER}/predict`, { method: "POST", body: form });
          const data = await res.json();
          if (data.detections) dets = data.detections;
        } catch { /* encode frame without overlay on hiccup */ }
      }

      if (overlayMode === "box") {
        drawBoxes(ctx, dets, W, H, classNames);
      } else {
        applyBlur(ctx, dets, W, H);
      }

      // VideoFrame timestamp is in microseconds; this is what sets playback speed
      const frame = new VideoFrame(compose, { timestamp: i * frameDuration, duration: frameDuration });
      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();

      const progress = (i + 1) / total;
      setRenderProgress(progress);
      setRenderFrame(i + 1);
      const elapsed = (Date.now() - startTime) / 1000;
      setRenderETA(elapsed / progress * (1 - progress));
    }

    await encoder.flush();
    muxer.finalize();

    if (!cancelRender.current) {
      const { buffer } = muxer.target as ArrayBufferTarget;
      const out = new Blob([buffer], { type: "video/webm" });
      setRenderedUrl(URL.createObjectURL(out));
    }

    if (!wasPaused) video.play();
    setRendering(false);
  }

  function handleCancel() {
    cancelRender.current = true;
  }

  const canRender = videoLoaded && serverStatus === "ready" && !rendering;
  const btnDisabled = !videoLoaded || serverStatus === "offline" || rendering || serverStatus === "checking";

  const statusLabel =
    serverStatus === "checking"  ? "Checking server…"            :
    serverStatus === "ready"     ? "Model ready"                  :
    serverStatus === "no-model"  ? "Server up — no model loaded"  :
    "Server offline — start backend";

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-card p-5">

        <div>
          <p className="font-semibold text-sm">Frame Detection</p>
          <p className="text-xs text-muted-foreground mt-0.5">YOLO object detection</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium">Video file</p>
          <FileUpload accept="video/*" onChange={handleFile} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Inference FPS</p>
            <span className="text-xs tabular-nums text-muted-foreground">{fps}</span>
          </div>
          <Slider value={fps} onValueChange={setFps} min={1} max={30} />
        </div>

        {/* bounding box vs blur toggle */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium">Overlay mode</p>
          <div className="flex rounded-lg border overflow-hidden text-xs font-medium">
            <button
              onClick={() => setOverlayMode("box")}
              className={`flex-1 py-1.5 transition-colors ${overlayMode === "box" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
            >
              Bounding box
            </button>
            <button
              onClick={() => setOverlayMode("blur")}
              className={`flex-1 py-1.5 transition-colors ${overlayMode === "blur" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
            >
              Blur
            </button>
          </div>
        </div>

        {/* render button with inline progress */}
        <div className="mt-auto flex flex-col items-center gap-1.5">
          <p className={`text-[10px] text-center ${
            serverStatus === "ready"    ? "text-muted-foreground"   :
            serverStatus === "offline"  ? "text-red-400"           :
            serverStatus === "checking" ? "text-muted-foreground"  :
            "text-yellow-400"
          }`}>
            {statusLabel}
          </p>

          <div className="flex w-full rounded-lg overflow-hidden">
            {/* main button: idle → render, running → progress, done → download */}
            <div className="relative flex-1 overflow-hidden">
              {rendering && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-100"
                  style={{ width: `${renderProgress * 100}%` }}
                />
              )}
                <button
                  onClick={rendering ? undefined : startRender}
                  disabled={btnDisabled}
                  className="relative w-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {rendering
                    ? `${Math.round(renderProgress * 100)}% · ${renderFrame}/${totalFrames}${renderETA !== null ? ` · ETA ${fmtETA(renderETA)}` : ""}`
                    : "Render video"}
                </button>
            </div>

            {/* stop while rendering, download when done */}
            {rendering && (
              <button
                onClick={handleCancel}
                className="shrink-0 bg-primary px-2.5 text-primary-foreground hover:bg-primary/90 transition-colors border-l border-primary-foreground/20"
                title="Cancel render"
              >
                <Square className="size-3 fill-current" />
              </button>
            )}
            {renderedUrl && !rendering && (
              <a
                href={renderedUrl}
                download="rendered.webm"
                className="shrink-0 bg-primary px-2.5 flex items-center text-primary-foreground hover:bg-primary/90 transition-colors border-l border-primary-foreground/20"
                title="Download rendered video"
              >
                <Download className="size-3" />
              </a>
            )}
          </div>
        </div>

      </aside>

      {/* ── Video area ── */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
        {!videoLoaded && (
          <p className="text-sm text-muted-foreground">Load a video from the sidebar</p>
        )}
        <video
          ref={videoRef}
          controls
          className="max-h-full max-w-full"
          style={{ display: videoLoaded ? "block" : "none" }}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute"
          style={{ display: videoLoaded ? "block" : "none" }}
        />
        {/* hidden canvases — never shown */}
        <canvas ref={hiddenRef}  width={640} height={640} className="hidden" />
        <canvas ref={composeRef} className="hidden" />

        {detections.length > 0 && overlayMode === "box" && (
          <div className="pointer-events-none absolute bottom-10 left-0 right-0 flex flex-wrap gap-1.5 px-3">
            {detections.map((d, i) => (
              <span key={i} className="rounded-full px-2 py-0.5 text-xs font-mono backdrop-blur-sm"
                style={{ background: classColor(d.class_id) + "55", color: "#fff" }}>
                {classNames?.[d.class_id] ?? `class ${d.class_id}`} {Math.round(d.confidence * 100)}%
              </span>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

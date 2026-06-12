"use client";

import { VideoDetector } from "@/components/video-detector";

// put your yolo class names here in order
const CLASS_NAMES: string[] = [
  // "person", "car", "dog", ...
];

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      <VideoDetector classNames={CLASS_NAMES.length ? CLASS_NAMES : undefined} />
    </div>
  );
}

"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Detection {
  box: [number, number, number, number];
  class_id: number;
  confidence: number;
}

const SERVER = "http://localhost:8000";

const BOX_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e","#3b82f6",
  "#a855f7","#ec4899","#14b8a6","#f59e0b","#6366f1",
];

function classColor(id: number) {
  return BOX_COLORS[id % BOX_COLORS.length];
}

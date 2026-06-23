"use client";

import { useState } from "react";
import { updateNodeCover, updateNodeIcon } from "../services/lesson.service";

export function useLessonPageShell(
  nodeId: string,
  initialCover: string | null | undefined,
  initialIcon: string | null | undefined,
) {
  const [cover, setCoverState] = useState<string | null>(initialCover ?? null);
  const [icon, setIconState] = useState<string | null>(initialIcon ?? null);

  const setCover = async (url: string | null) => {
    const prev = cover;
    setCoverState(url);
    try {
      await updateNodeCover(nodeId, url);
    } catch {
      setCoverState(prev);
    }
  };

  const setIcon = async (value: string | null) => {
    const prev = icon;
    setIconState(value);
    try {
      await updateNodeIcon(nodeId, value);
    } catch {
      setIconState(prev);
    }
  };

  return { cover, icon, setCover, setIcon };
}

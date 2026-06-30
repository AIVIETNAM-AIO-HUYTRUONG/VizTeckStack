"use client";

import React from "react";
import { CoverDisplay } from "./CoverDisplay";
import type { LessonShellNode } from "../types";

const LessonViewer = React.lazy(() =>
  import("../content-editor/components/LessonViewer").then((m) => ({ default: m.LessonViewer }))
);

export interface LessonPageShellProps {
  mode: "edit" | "view";
  node: LessonShellNode;
  coverSlot?: React.ReactNode;
  titleSlot?: React.ReactNode;
  contentSlot?: React.ReactNode;
}

export function LessonPageShell({
  mode,
  node,
  coverSlot,
  titleSlot,
  contentSlot,
}: LessonPageShellProps) {
  const cover = coverSlot ?? (
    <CoverDisplay
      coverImage={node.coverImage}
      icon={node.icon}
    />
  );

  const title = titleSlot ?? (
    <h1
      className="font-display font-bold text-[24px] sm:text-[32px] leading-tight text-text-1 mt-8 mb-4"
      style={{ textWrap: 'balance' } as React.CSSProperties}
    >
      {node.title}
    </h1>
  );

  if (mode === "edit") {
    return (
      <div>
        {cover}
        <div className="max-w-[860px] mx-auto px-6 md:px-12 pb-12 pt-8">
          {title}
          {contentSlot}
        </div>
      </div>
    );
  }

  return (
    <div>
      {cover}
      <div className="max-w-[860px] mx-auto px-6 md:px-12 pb-12 pt-8">
        {title}
        {node.type === "LESSON" ? (
          <React.Suspense
            fallback={
              <div className="text-text-2 text-sm py-6">Loading content…</div>
            }
          >
            <LessonViewer contentJson={node.content ?? "[]"} />
          </React.Suspense>
        ) : (
          <p className="text-text-2 text-sm">
            This node does not contain lesson content.
          </p>
        )}
      </div>
    </div>
  );
}

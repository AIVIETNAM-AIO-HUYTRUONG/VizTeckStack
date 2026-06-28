"use client";

import React from "react";
import { CoverDisplay } from "./CoverDisplay";
import type { BreadcrumbItem, LessonShellNode } from "../types";

const LessonViewer = React.lazy(() =>
  import("./LessonViewer").then((m) => ({ default: m.LessonViewer }))
);

export interface LessonPageShellProps {
  mode: "edit" | "view";
  node: LessonShellNode;
  breadcrumb: BreadcrumbItem[];
  coverSlot?: React.ReactNode;
  titleSlot?: React.ReactNode;
  contentSlot?: React.ReactNode;
  getLinkHref?: (item: BreadcrumbItem) => string | undefined;
}

export function LessonPageShell({
  mode,
  node,
  breadcrumb,
  coverSlot,
  titleSlot,
  contentSlot,
  getLinkHref,
}: LessonPageShellProps) {
  const cover = coverSlot ?? (
    <CoverDisplay
      coverImage={node.coverImage}
      icon={node.icon}
      breadcrumb={breadcrumb}
      getLinkHref={getLinkHref}
    />
  );

  const title = titleSlot ?? (
    <h1 className="font-display font-bold text-[32px] leading-tight text-text-1 mt-8 mb-4">
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
              <div className="text-text-3 text-sm py-6">Loading content…</div>
            }
          >
            <LessonViewer contentJson={node.content ?? "[]"} />
          </React.Suspense>
        ) : (
          <p className="text-text-3 text-sm">
            This node does not contain lesson content.
          </p>
        )}
      </div>
    </div>
  );
}

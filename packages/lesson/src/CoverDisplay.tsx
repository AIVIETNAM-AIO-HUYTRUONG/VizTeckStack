"use client";

import { useState } from "react";
import type { BreadcrumbItem } from "./types";
import { BreadcrumbDisplay } from "./BreadcrumbDisplay";

export interface CoverDisplayProps {
  coverImage: string | null;
  icon: string | null;
  breadcrumb: BreadcrumbItem[];
  onIconClick?: () => void;
}

export function CoverDisplay({
  coverImage,
  icon,
  breadcrumb,
  onIconClick,
}: CoverDisplayProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = !!coverImage && !imgError;

  return (
    <div className="relative w-full h-[200px]">
      {showImage ? (
        <img
          src={coverImage!}
          alt="cover"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-indigo to-indigo/60" />
      )}

      {breadcrumb.length > 0 && (
        <div className="absolute top-3 left-4">
          <BreadcrumbDisplay items={breadcrumb} variant="overlay" />
        </div>
      )}

      <div
        className={`absolute left-4 -bottom-5 w-10 h-10 bg-bg-0 border border-border rounded-lg flex items-center justify-center text-2xl z-10 select-none${onIconClick ? " cursor-pointer hover:border-indigo transition-colors" : ""}`}
        onClick={onIconClick}
        {...(onIconClick ? { role: "button", tabIndex: 0 } : {})}
      >
        {icon || "📄"}
      </div>
    </div>
  );
}

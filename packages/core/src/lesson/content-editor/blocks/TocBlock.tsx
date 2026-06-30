"use client";

import { useState } from "react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createReactBlockSpec, useEditorChange } from "@blocknote/react";

type TocHeading = { id: string; label: string; level: 1 | 2 | 3 };

function extractHeadings(docBlocks: readonly any[]): TocHeading[] {
  return [...docBlocks]
    .filter((b) => b.type === "heading")
    .map((b) => ({
      id: b.id as string,
      label: ((b.content ?? []) as any[])
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text as string)
        .join(""),
      level: (b.props as any).level as 1 | 2 | 3,
    }));
}

function TocContent({ editor }: { editor: any }) {
  const [headings, setHeadings] = useState<TocHeading[]>(() =>
    extractHeadings(editor.document)
  );

  useEditorChange(() => {
    setHeadings(extractHeadings(editor.document));
  }, editor);

  if (headings.length === 0) {
    return (
      <p className="text-text-3 text-sm italic py-1">Chưa có tiêu đề nào</p>
    );
  }

  return (
    <nav aria-label="Mục lục">
      <p className="text-xs font-semibold text-text-2 mb-2 uppercase tracking-wide">
        Mục lục
      </p>
      <ul className="space-y-1 list-none p-0 m-0">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 16}px` }}>
            <a
              href={`#${h.id}`}
              className="text-sm text-indigo hover:underline cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                window.document
                  .querySelector(`[data-id="${h.id}"]`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {h.label || "(Tiêu đề trống)"}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const TocBlock = createReactBlockSpec(
  {
    type: "toc" as const,
    propSchema: {},
    content: "none",
  },
  {
    render: ({ editor }) => (
      <div className="my-2 p-3 bg-bg-1 border border-border rounded-md">
        <TocContent editor={editor} />
      </div>
    ),
  }
);

export const lessonSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    toc: TocBlock(),
  },
});

export type LessonSchema = typeof lessonSchema;

import {
  Zap, Rocket, BookOpen, Target, Lightbulb, Flame,
  Star, Globe, Wrench, Package, Puzzle, Sparkles,
  Code, Database, Server, Terminal, Layout, Layers,
  Box, ArrowRight, Check, Link, Lock, FileText,
  type LucideProps,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { createElement } from "react";

export type { LucideProps };

export const LESSON_ICONS: { name: string; Comp: ComponentType<LucideProps> }[] = [
  { name: "Zap", Comp: Zap },
  { name: "Rocket", Comp: Rocket },
  { name: "BookOpen", Comp: BookOpen },
  { name: "Target", Comp: Target },
  { name: "Lightbulb", Comp: Lightbulb },
  { name: "Flame", Comp: Flame },
  { name: "Star", Comp: Star },
  { name: "Globe", Comp: Globe },
  { name: "Wrench", Comp: Wrench },
  { name: "Package", Comp: Package },
  { name: "Puzzle", Comp: Puzzle },
  { name: "Sparkles", Comp: Sparkles },
  { name: "Code", Comp: Code },
  { name: "Database", Comp: Database },
  { name: "Server", Comp: Server },
  { name: "Terminal", Comp: Terminal },
  { name: "Layout", Comp: Layout },
  { name: "Layers", Comp: Layers },
  { name: "Box", Comp: Box },
  { name: "ArrowRight", Comp: ArrowRight },
  { name: "Check", Comp: Check },
  { name: "Link", Comp: Link },
  { name: "Lock", Comp: Lock },
  { name: "FileText", Comp: FileText },
];

const ICON_MAP = new Map(LESSON_ICONS.map((e) => [e.name, e.Comp]));

export function renderLessonIcon(
  icon: string | null,
  size = 20,
  className?: string,
): ReactNode {
  if (!icon) return "📄";
  const Comp = ICON_MAP.get(icon);
  if (Comp) return createElement(Comp, { size, className });
  return icon;
}

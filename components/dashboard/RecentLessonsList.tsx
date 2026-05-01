// Last-N completed lessons preview. Server component — pure render.
// Each row links to the lesson page; path slug is shown as a small uppercase
// eyebrow next to a clamped lesson title.

import Link from "next/link";

export interface RecentLessonItem {
  lessonId: string;
  title: string;
  pathTitle: string;
  href: string;
}

interface Props {
  items: RecentLessonItem[];
}

export function RecentLessonsList({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
      {items.map((item) => (
        <li key={item.lessonId}>
          <Link
            href={item.href}
            className="group flex items-center gap-2 text-left"
          >
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              {item.pathTitle}
            </span>
            <span className="line-clamp-1 flex-1 text-xs text-text-secondary group-hover:text-text-primary">
              {item.title}
            </span>
            <span
              aria-hidden
              className="shrink-0 text-text-muted transition-colors group-hover:text-text-primary"
            >
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

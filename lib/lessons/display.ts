import type { AnyLessonContent } from "@/types";

/**
 * Short label preferred wherever the full lesson title would be too long
 * or out of place (map nodes, prev/next navigator, path overview cards,
 * dashboard's Continue/Recent cards).
 *
 * V2 lessons can declare an optional `map_title` to decouple the long
 * expressive title (lesson page header) from the short navigation label.
 * V1 lessons just return their `title`. When `map_title` is absent on
 * V2 we also fall back to `title`, so navigation is never empty.
 */
export function getShortTitle(lesson: AnyLessonContent): string {
  if ("map_title" in lesson && lesson.map_title && lesson.map_title.length > 0) {
    return lesson.map_title;
  }
  return lesson.title;
}

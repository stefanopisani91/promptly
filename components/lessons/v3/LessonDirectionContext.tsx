// Navigation-direction context for V3 lesson steps.
// LessonV3View sets this to "forward" or "back" before changing stepIndex;
// StepCard reads it to pick the matching slide-in CSS class.

import { createContext, useContext } from "react";

export type NavDirection = "forward" | "back";

export const LessonDirectionContext = createContext<NavDirection>("forward");

export function useLessonDirection(): NavDirection {
  return useContext(LessonDirectionContext);
}

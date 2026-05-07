// Builds the narrative recap shown at STEP 10 (Profilazione.md
// §"Riepilogo veloce"). The output is a single sentence stitched from
// fragments declared in the i18n `profiling.step10.fragments` map, plus a
// trailing motivation line that quotes the user's own words.
//
// Lives outside the React tree so it can be unit-tested in isolation when
// the testing surface lands.

import { toolDisplayName } from "@/lib/onboarding/tools";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import type { Lang } from "@/types";
import type { ProfileAnswers } from "./types";

export interface BuiltRecap {
  narrative: string;
  motivationLead: string;
  motivationQuote: string;
}

export function buildRecap(
  answers: ProfileAnswers,
  copy: ProfilingCopy["step10"],
  lang: Lang,
): BuiltRecap | null {
  const { fragments } = copy;
  if (!answers.experience_level || !answers.project_clarity) return null;

  const experienceFrag = fragments.experience[answers.experience_level];
  const clarityFrag = fragments.clarity[answers.project_clarity];

  const claritySuffixBuilder = fragments.claritySuffix[answers.project_clarity];
  const projectText = answers.project_description.trim();
  const claritySuffixText =
    answers.project_clarity === "exploring"
      ? fragments.claritySuffix.exploring
      : projectText.length > 0
        ? (claritySuffixBuilder as (project: string) => string)(projectText)
        : "";

  const claritySentence = `${clarityFrag}${claritySuffixText}`;

  let toolsFrag = fragments.tools.none;
  if (answers.preferred_tool) {
    toolsFrag = fragments.tools.preferred(
      toolDisplayName(answers.preferred_tool, lang),
    );
  } else if (answers.tools_used.length > 0) {
    // User selected tools but no IDE preferred — pick first IDE-ish or
    // first-of-list to keep the sentence concrete.
    const first = answers.tools_used[0];
    toolsFrag = fragments.tools.preferred(toolDisplayName(first, lang));
  }

  const timeFrag = fragments.time[answers.daily_goal];

  return {
    narrative: fragments.assemble({
      experienceFrag,
      claritySuffix: claritySentence,
      toolsFrag,
      timeFrag,
    }),
    motivationLead: copy.motivationLead,
    motivationQuote: answers.deep_motivation.trim(),
  };
}

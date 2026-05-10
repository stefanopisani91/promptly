// Server component wrapper for the Lucia landing demo. Mirrors the shape of
// the previous PromptEvaluatorSection so swapping at the page level is a
// one-liner. All client behaviour lives inside LuciaDemo.

import type { Lang } from "@/types";
import type { LuciaDemoCopy } from "@/lib/landing-demo/types";
import { LuciaDemo } from "./LuciaDemo";

interface Props {
  copy: LuciaDemoCopy;
  lang: Lang;
  /** Forwarded to LuciaDemo so the "write here" overlay is hidden for
   * users with an active session. Resolved server-side by the page so
   * this stays a pure client-component prop. */
  isLoggedIn?: boolean;
}

export function LuciaDemoSection({ copy, lang, isLoggedIn = false }: Props) {
  return <LuciaDemo copy={copy} lang={lang} isLoggedIn={isLoggedIn} />;
}

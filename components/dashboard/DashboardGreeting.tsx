import type { AuthCopy } from "@/lib/i18n/auth";

interface Props {
  copy: AuthCopy["dashboard"];
  name: string;
}

export function DashboardGreeting({ copy, name }: Props) {
  return (
    <h1 className="font-heading text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
      {copy.greeting(name)}
    </h1>
  );
}

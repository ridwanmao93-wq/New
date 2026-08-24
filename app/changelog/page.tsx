import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-static";

/**
 * A plain-language "What's new" log so every change is visible from inside
 * the app — no GitHub needed. Newest first. Add an entry at the top whenever
 * a feature ships.
 */
const CHANGES: { date: string; title: string; items: string[] }[] = [
  {
    date: "Aug 24, 2026",
    title: "One-tap updates & a changelog",
    items: [
      "Added an “Apply updates” button on System status — the app can now run its own database updates, no SQL editor needed.",
      "Added this “What’s new” page so you can see every change in plain language from inside the app.",
    ],
  },
  {
    date: "Aug 23, 2026",
    title: "Task detail popups (Motion-style)",
    items: [
      "Click any task to open a popup with a description, priority, due date, and time estimate.",
      "Task rows now show a priority dot, due date, and a preview at a glance.",
    ],
  },
  {
    date: "Aug 21, 2026",
    title: "Voice input for Brain Dump",
    items: [
      "Tap the mic and talk instead of typing — your words are transcribed right in the browser.",
      "Works in Safari on iPhone and in Chrome; mix talking and typing freely.",
    ],
  },
  {
    date: "Aug 20, 2026",
    title: "Task list, focus timer & self-healing saves",
    items: [
      "Added a Work + Personal task list — add, check off, and delete tasks.",
      "The focus timer now follows you around the app: start it, then move to any page and it keeps running in a floating widget.",
      "Saves no longer break when the database is behind — added a System status page that shows exactly what (if anything) needs updating.",
    ],
  },
  {
    date: "Aug 14, 2026",
    title: "The 30-second check-in",
    items: [
      "Added a one-tap daily check-in centered on your single hard thing — the floor you can’t fail.",
      "New /today screen you can add to your phone home screen for an instant check-in.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="What’s new" subtitle="Every change, in plain language. Newest first." />

      <div className="space-y-4">
        {CHANGES.map((c) => (
          <Card key={c.date + c.title}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-baseline justify-between gap-3 text-base">
                <span>{c.title}</span>
                <span className="shrink-0 text-xs font-normal text-muted-foreground">{c.date}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {c.items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

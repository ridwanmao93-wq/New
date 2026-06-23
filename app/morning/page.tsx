import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { today } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { MorningForm } from "@/components/forms/morning-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MorningPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already logged today?
  const { count: morningCount } = await supabase
    .from("cbt_morning_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("date", today());
  const doneToday = (morningCount ?? 0) > 0;

  // A rotating vision image to anchor the morning "visualize" moment.
  const { data: vision } = await supabase
    .from("vision_board_items")
    .select("image_url, caption")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const items = vision ?? [];
  const dayIndex = Math.floor(Date.now() / 86400000);
  const visual = items.length ? items[dayIndex % items.length] : undefined;

  return (
    <div>
      <PageHeader title="Morning Practice" subtitle="Center, rate, complete, and step into your identity." />

      {doneToday ? (
        <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          ✅ You’ve already logged a morning entry today. You can add another, or review it in your{" "}
          <Link href="/journal" className="underline">
            Journal
          </Link>
          .
        </div>
      ) : null}

      {/* Visualize — 60-second look at your future self */}
      <Card className="mb-5 overflow-hidden border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Visualize · 60 seconds</CardTitle>
        </CardHeader>
        <CardContent>
          {visual ? (
            <Link href="/vision-board" className="block">
              <div className="relative overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={visual.image_url}
                  alt={visual.caption || "Vision"}
                  className="h-48 w-full object-cover sm:h-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                {visual.caption ? (
                  <p className="absolute bottom-3 left-3 text-lg font-bold text-white">{visual.caption}</p>
                ) : null}
              </div>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add images on your{" "}
              <Link href="/vision-board" className="text-primary underline">
                Vision Board
              </Link>{" "}
              to see your future self here each morning.
            </p>
          )}
        </CardContent>
      </Card>

      <MorningForm />
    </div>
  );
}

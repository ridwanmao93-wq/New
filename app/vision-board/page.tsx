import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisionItemForm } from "@/components/vision/vision-item-form";
import { VisionTile } from "@/components/vision/vision-tile";

export const dynamic = "force-dynamic";

export default async function VisionBoardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: itemsData }, { data: goalsData }, { data: statementGoal }] = await Promise.all([
    supabase
      .from("vision_board_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("future_self_goals").select("id, goal_name").eq("user_id", user.id),
    supabase
      .from("future_self_goals")
      .select("why_it_matters")
      .eq("user_id", user.id)
      .ilike("goal_name", "%future self%")
      .limit(1)
      .maybeSingle(),
  ]);

  const items = itemsData ?? [];
  const goals = goalsData ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="Vision Board" subtitle="See where you're going. Look at it every morning." />

      {statementGoal?.why_it_matters ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">12-Month Future Self</CardTitle>
          </CardHeader>
          <CardContent className="text-base leading-relaxed">{statementGoal.why_it_matters}</CardContent>
        </Card>
      ) : null}

      {items.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <VisionTile key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Your vision board is empty. Add your first image below — a place, a number, a person, a
          version of you.
        </p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add to your vision board</CardTitle>
        </CardHeader>
        <CardContent>
          <VisionItemForm userId={user.id} goals={goals} />
        </CardContent>
      </Card>
    </div>
  );
}

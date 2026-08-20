import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TaskBoard, type Task } from "@/components/tasks/task-board";

export const dynamic = "force-dynamic";

/**
 * Simple two-category to-do list: Work and Personal. Add tasks, check them
 * off, delete them. Backed by the `tasks` table; if that table isn't there
 * yet, we show a friendly pointer to the System status page instead of
 * crashing.
 */
export default async function TasksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, category, completed")
    .eq("user_id", user.id)
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });

  const tableMissing = !!error && /Could not find the table/i.test(error.message);
  const tasks = (data ?? []) as Task[];

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" subtitle="Two lists. Add, check off, move on." />

      {tableMissing ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="space-y-2 pt-6 text-sm">
            <p className="text-amber-200">
              The task list needs a one-time database update before it can save.
            </p>
            <p className="text-muted-foreground">
              Open <a className="text-primary underline" href="/system">System status</a> and run the
              SQL there — it takes 30 seconds. Then come back and your lists will work.
            </p>
          </CardContent>
        </Card>
      ) : (
        <TaskBoard tasks={tasks} />
      )}
    </div>
  );
}

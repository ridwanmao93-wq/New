import { PageHeader } from "@/components/page-header";
import { MorningForm } from "@/components/forms/morning-form";

export const dynamic = "force-dynamic";

export default function MorningPage() {
  return (
    <div>
      <PageHeader title="Morning Practice" subtitle="Center, rate, complete, and step into your identity." />
      <MorningForm />
    </div>
  );
}

import { Suspense } from "react";
import { DemoShowcase } from "@/components/DemoShowcase";
import { Skeleton } from "@/components/ui";

export default function DemosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian-950 p-6"><Skeleton className="h-[80vh]" /></div>}>
      <DemoShowcase />
    </Suspense>
  );
}

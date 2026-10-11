"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { GuardianDashboardView } from "@/views/GuardianDashboardView";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={(
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando painel" />
        </div>
      )}
    >
      <GuardianDashboardView />
    </Suspense>
  );
}

"use client";

import { use } from "react";
import { ActivePlanProvider } from "@/context/ActivePlanContext";

export default function PlanLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ActivePlanProvider planId={id}>{children}</ActivePlanProvider>;
}

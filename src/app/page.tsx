import { DashboardClient } from "@/components/dashboard-client";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { getPerfil } from "@/lib/profile";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await db
    .select()
    .from(reports)
    .orderBy(desc(reports.updatedAt));

  // Cria o perfil na primeira execução e completa o cabeçalho do Batalhão
  const profile = await getPerfil();

  return <DashboardClient initialReports={rows} initialProfile={profile} />;
}

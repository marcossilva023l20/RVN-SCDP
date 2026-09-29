import { DashboardClient } from "@/components/dashboard-client";
import { db } from "@/db";
import { profiles, reports } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await db
    .select()
    .from(reports)
    .orderBy(desc(reports.updatedAt));

  let [profile] = await db.select().from(profiles).limit(1);
  if (!profile) {
    [profile] = await db.insert(profiles).values({}).returning();
  }

  return <DashboardClient initialReports={rows} initialProfile={profile} />;
}

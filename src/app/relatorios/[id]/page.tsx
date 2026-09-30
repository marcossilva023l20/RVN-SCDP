import { EditorClient } from "@/components/editor-client";
import { db } from "@/db";
import { bilhetes, reports } from "@/db/schema";
import { reportToDraft } from "@/lib/types";
import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editor — RVN Fácil",
};

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; captura?: string }>;
}) {
  const { id } = await params;
  const { t, captura } = await searchParams;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, numId));
  if (!report) notFound();

  const rows = await db
    .select()
    .from(bilhetes)
    .where(eq(bilhetes.reportId, numId))
    .orderBy(asc(bilhetes.ordem), asc(bilhetes.id));

  const draft = { ...reportToDraft({ ...report, bilhetes: rows }), id: numId };

  return (
    <EditorClient
      initial={draft}
      textoInicial={t ?? ""}
      capturaScdp={captura === "1"}
    />
  );
}

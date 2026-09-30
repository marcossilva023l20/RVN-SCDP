import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { cabecalhoIncompleto, cabecalhoPreenchido } from "@/lib/org";
import { eq } from "drizzle-orm";

/**
 * Perfil do beneficiário — registro único (id 1).
 *
 * Além de criar o perfil na primeira execução, completa as linhas do
 * cabeçalho que estiverem em branco com o padrão do Batalhão. É o que
 * garante que o RVN saia sempre com as 5 linhas institucionais, mesmo em
 * perfis salvos antes desta atualização.
 */
export async function getPerfil(): Promise<Profile> {
  let [profile] = await db.select().from(profiles).limit(1);

  if (!profile) {
    [profile] = await db.insert(profiles).values({}).returning();
    return profile;
  }

  if (cabecalhoIncompleto(profile)) {
    const [atualizado] = await db
      .update(profiles)
      .set({ ...cabecalhoPreenchido(profile), updatedAt: new Date() })
      .where(eq(profiles.id, profile.id))
      .returning();
    return atualizado ?? profile;
  }

  return profile;
}

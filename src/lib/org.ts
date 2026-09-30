/**
 * Cabeçalho institucional do RVN — 5 linhas, Times New Roman 10pt, negrito,
 * centralizadas, acima do título "RELATÓRIO DE VIAGEM NACIONAL".
 *
 * Padrão do 3º Batalhão de Engenharia de Construção (1º Batalhão de
 * Engenharia/1942) — "Batalhão Visconde da Parnaíba".
 *
 * Este é o valor inicial gravado no banco e também a reserva usada quando
 * alguma linha fica em branco: o documento nunca sai sem o cabeçalho da OM.
 */
export const ORG_LINHAS_PADRAO = {
  orgLinha1: "MINISTÉRIO DA DEFESA",
  orgLinha2: "EXÉRCITO BRASILEIRO",
  orgLinha3: "3º BATALHÃO DE ENGENHARIA DE CONSTRUÇÃO",
  orgLinha4: "(1º BATALHÃO DE ENGENHARIA/1942)",
  orgLinha5: "BATALHÃO VISCONDE DA PARNAÍBA",
} as const;

export type OrgLinhas = {
  orgLinha1: string;
  orgLinha2: string;
  orgLinha3: string;
  orgLinha4: string;
  orgLinha5: string;
};

/** Rótulos das linhas na interface (o que cada linha significa). */
export const ORG_LINHAS_LABEL: Record<keyof OrgLinhas, string> = {
  orgLinha1: "Linha 1 — Ministério",
  orgLinha2: "Linha 2 — Força",
  orgLinha3: "Linha 3 — Organização Militar",
  orgLinha4: "Linha 4 — Designação histórica",
  orgLinha5: "Linha 5 — Nome histórico (sai entre aspas)",
};

const preenchida = (v: unknown): v is string =>
  typeof v === "string" && v.trim() !== "";

/**
 * Completa com o padrão do Batalhão apenas as linhas em branco.
 * Linhas já preenchidas (mesmo de outra OM) são preservadas como estão.
 */
export function cabecalhoPreenchido(org: Partial<OrgLinhas>): OrgLinhas {
  return {
    orgLinha1: preenchida(org.orgLinha1)
      ? org.orgLinha1
      : ORG_LINHAS_PADRAO.orgLinha1,
    orgLinha2: preenchida(org.orgLinha2)
      ? org.orgLinha2
      : ORG_LINHAS_PADRAO.orgLinha2,
    orgLinha3: preenchida(org.orgLinha3)
      ? org.orgLinha3
      : ORG_LINHAS_PADRAO.orgLinha3,
    orgLinha4: preenchida(org.orgLinha4)
      ? org.orgLinha4
      : ORG_LINHAS_PADRAO.orgLinha4,
    orgLinha5: preenchida(org.orgLinha5)
      ? org.orgLinha5
      : ORG_LINHAS_PADRAO.orgLinha5,
  };
}

/** As 5 linhas na ordem de impressão. */
export function cabecalhoEmLinhas(org: Partial<OrgLinhas>): string[] {
  const c = cabecalhoPreenchido(org);
  return [c.orgLinha1, c.orgLinha2, c.orgLinha3, c.orgLinha4, c.orgLinha5];
}

/** `true` quando alguma das 5 linhas está em branco. */
export function cabecalhoIncompleto(org: Partial<OrgLinhas>): boolean {
  return (
    !preenchida(org.orgLinha1) ||
    !preenchida(org.orgLinha2) ||
    !preenchida(org.orgLinha3) ||
    !preenchida(org.orgLinha4) ||
    !preenchida(org.orgLinha5)
  );
}

/**
 * Remove aspas externas (retas ou tipográficas) — o documento já coloca o
 * nome histórico entre aspas, então evita aspas duplicadas quando o texto
 * foi colado do Word/SCDP.
 */
export function semAspasExternas(texto: string): string {
  return texto
    .trim()
    .replace(/^["“”'‘’]+/, "")
    .replace(/["“”'‘’]+$/, "")
    .trim();
}

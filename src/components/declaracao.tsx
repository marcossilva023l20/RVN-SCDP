import Image from "next/image";
import { cabecalhoEmLinhas, semAspasExternas } from "@/lib/org";
import type { ReportDraft } from "@/lib/types";
import type { CSSProperties } from "react";

/**
 * DECLARAÇÃO DE EXTRAVIO DE COMPROVANTE DE EMBARQUE.
 *
 * Modelo do Batalhão: mesmo cabeçalho do RVN e, no corpo, a declaração de que
 * o canhoto de embarque foi extraviado, com a tabela EMPRESA · LOCALIZADOR ·
 * DATA · TRECHO.
 *
 * Os dados saem do próprio relatório: nome, CPF e os bilhetes da seção 9
 * (canhotos/cartões de embarque utilizados) — por isso o botão só aparece
 * quando essa seção está preenchida.
 */

export const TITULO_DECLARACAO =
  "DECLARAÇÃO DE EXTRAVIO DE COMPROVANTE DE EMBARQUE";

const FUNDAMENTO =
  "Visando compor o processo de prestação de contas, conforme determina o art. 25, § 1º, da Portaria nº 290-DGP, de 9 DEZ 2013,";

const cellStyle: CSSProperties = {
  border: "1.05pt solid #000001",
  padding: "0 0.123cm",
  verticalAlign: "middle",
  fontSize: "10pt",
  lineHeight: 1.35,
  textAlign: "center",
};

export interface LinhaDeclaracao {
  empresa: string;
  localizador: string;
  data: string;
  trecho: string;
}

/** A seção 9 está preenchida? (bilhetes utilizados/canhotos entregues) */
export function temDeclaracao(draft: ReportDraft): boolean {
  return draft.bilhetes.some((b) => b.tipo === "utilizado");
}

/**
 * "Quartel em Picos/PI, 30 de setembro de 2026." -> "Picos-PI, 30 de setembro
 * de 2026." — a mesma cidade/data que já aparece no rodapé do relatório.
 */
export function localDeclaracao(localData: string): string {
  const limpo = localData.trim().replace(/^Quartel em\s+/i, "");
  return limpo.replace(/\//g, "-");
}

/** Linha da assinatura: a do relatório, ou nome + posto (como no documento). */
export function assinaturaDeclaracao(draft: ReportDraft): string {
  if (draft.assinatura.trim()) return draft.assinatura.trim();
  if (!draft.nome.trim()) return "";
  return `${draft.nome.toUpperCase()}${
    draft.postoCargo.trim() ? ` – ${draft.postoCargo.toUpperCase()}` : ""
  }`;
}

/**
 * Dados da declaração, prontos para imprimir: quem declara, os trechos da
 * seção 9 e o fecho (local/data + assinatura).
 */
export function dadosDeclaracao(
  draft: ReportDraft,
  local: string,
): {
  nome: string;
  cpf: string;
  linhas: LinhaDeclaracao[];
  local: string;
  assinatura: string;
} {
  return {
    nome: draft.nome.trim() ? draft.nome.toUpperCase() : "____________________",
    cpf: draft.cpf.trim() || "____________",
    linhas: draft.bilhetes
      .filter((b) => b.tipo === "utilizado")
      .map((b) => ({
        // EMPRESA · LOCALIZADOR (código da reserva; sem ele, o do bilhete)
        empresa: b.cia || "",
        localizador: b.reserva || b.localizador || "",
        data: b.data || "",
        trecho: b.trecho || "",
      })),
    local: local.trim(),
    assinatura: assinaturaDeclaracao(draft),
  };
}

export function DeclaracaoExtravio({
  draft,
  local,
}: {
  draft: ReportDraft;
  /** linha do fecho, ex.: "Picos-PI, 30 de setembro de 2026." */
  local: string;
}) {
  const d = dadosDeclaracao(draft, local);
  const linhasCabecalho = cabecalhoEmLinhas(draft);

  return (
    <article
      className="rvn-doc mx-auto bg-white text-black"
      style={{
        fontFamily: '"Times New Roman", "Liberation Serif", Times, serif',
        fontSize: "10pt",
        lineHeight: 1.35,
      }}
    >
      {/* ===== Cabeçalho (igual ao do relatório) ===== */}
      <header
        className="text-center"
        style={{ lineHeight: 1.2, breakInside: "avoid" }}
      >
        <Image
          src="/images/brasao-republica.png"
          alt="Brasão da República Federativa do Brasil"
          width={959}
          height={959}
          unoptimized
          style={{
            display: "block",
            width: "1.5cm",
            height: "1.5cm",
            objectFit: "contain",
            margin: "0 auto 0.1cm",
          }}
        />
        {linhasCabecalho.map((l, i) => (
          <p key={i} style={{ margin: 0, fontWeight: 700, fontSize: "10pt" }}>
            {i === 4 ? `“${semAspasExternas(l)}”` : l}
          </p>
        ))}
        <p style={{ margin: 0, fontSize: "8pt" }}>&nbsp;</p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "11pt" }}>
          {TITULO_DECLARACAO}
        </p>
      </header>

      {/* ===== Corpo ===== */}
      <p
        style={{
          margin: "0.9cm 0 0",
          textAlign: "justify",
          textIndent: "1.5cm",
        }}
      >
        {FUNDAMENTO} eu, <strong>{d.nome}</strong>, CPF nº {d.cpf}, declaro que
        extraviei o canhoto de embarque de passagens aéreas/rodoviária,
        referente ao trecho abaixo discriminado:
      </p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "0.45cm",
          breakInside: "avoid",
        }}
      >
        <thead>
          <tr>
            {["EMPRESA", "LOCALIZADOR", "DATA", "TRECHO"].map((c, i) => (
              <th
                key={c}
                style={{
                  ...cellStyle,
                  fontWeight: 700,
                  width: ["22%", "20%", "14%", "44%"][i],
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {d.linhas.map((l, i) => (
            <tr key={i}>
              <td style={cellStyle}>{l.empresa || "\u00A0"}</td>
              <td style={cellStyle}>{l.localizador || "\u00A0"}</td>
              <td style={cellStyle}>{l.data || "\u00A0"}</td>
              <td style={cellStyle}>{l.trecho || "\u00A0"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== Fecho ===== */}
      {d.local && <p style={{ margin: "0.8cm 0 0" }}>{d.local}</p>}
      {d.assinatura && (
        <p
          style={{
            margin: "1.6cm 0 0",
            textAlign: "center",
            fontWeight: 700,
            breakInside: "avoid",
          }}
        >
          {d.assinatura}
        </p>
      )}
    </article>
  );
}

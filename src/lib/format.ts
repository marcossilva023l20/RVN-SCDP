/**
 * Utilitários de formatação pt-BR usados no Relatório de Viagem Nacional.
 */

export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const MESES_ABREV = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

/** 2025-11-14 -> 14/11/2025 */
export function dataBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/**
 * Converte data (yyyy-mm-dd) + hora (hh:mm) para o formato militar brasileiro.
 * Ex: 2025-11-14, 14:00 -> "141400NOV25"
 */
export function dataHoraMilitar(isoDate: string, time: string): string {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T${time || "00:00"}:00`);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const mes = MESES_ABREV[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${hh}${mm}${mes}${yy}`;
}

/** 2025-11-14 + 14:30 -> "14/11/2025 às 14:30" */
export function dataHoraCivil(isoDate: string, time: string): string {
  if (!isoDate) return "";
  const base = dataBR(isoDate);
  return time ? `${base} às ${time}` : base;
}

/** 2026-07-20 -> "20JUL26" (data militar sem hora) */
export function dataMilitar(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mes = MESES_ABREV[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mes}${yy}`;
}

/** 2024-09-25 -> "25 de setembro de 2024" */
export function dataPorExtenso(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

/** Monta a linha "Quartel em Cidade/UF, 12 de maio de 2026." */
export function montaLocalData(cidade: string, iso: string): string {
  const ext = dataPorExtenso(iso);
  if (!cidade && !ext) return "";
  if (!ext) return `Quartel em ${cidade}.`;
  if (!cidade) return `${ext}.`;
  return `Quartel em ${cidade}, ${ext}.`;
}

/** Extrai "R$ 1.234,56" (ou "1234.56") para número. */
export function parseMoeda(valor: string): number {
  if (!valor) return 0;
  const limpo = valor.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(limpo);
  return Number.isFinite(n) ? n : 0;
}

/** 1234.56 -> "R$ 1.234,56" */
export function formataMoeda(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const UNIDADES = [
  "",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
];
const DEZ_A_DEZENOVE = [
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];
const DEZENAS = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
];
const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

function tresDigitos(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const partes: string[] = [];
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (c > 0) partes.push(CENTENAS[c]);
  if (resto > 0) {
    if (resto < 10) partes.push(UNIDADES[resto]);
    else if (resto < 20) partes.push(DEZ_A_DEZENOVE[resto - 10]);
    else {
      const dz = Math.floor(resto / 10);
      const un = resto % 10;
      partes.push(un > 0 ? `${DEZENAS[dz]} e ${UNIDADES[un]}` : DEZENAS[dz]);
    }
  }
  return partes.join(" e ");
}

function inteiroPorExtenso(n: number): string {
  if (n === 0) return "zero";
  const escalas: Array<[number, string, string]> = [
    [1_000_000_000, "bilhão", "bilhões"],
    [1_000_000, "milhão", "milhões"],
    [1_000, "mil", "mil"],
  ];
  let restante = n;
  const partes: string[] = [];
  for (const [valor, singular, plural] of escalas) {
    const qtd = Math.floor(restante / valor);
    if (qtd > 0) {
      restante %= valor;
      if (valor === 1_000) {
        if (qtd === 1) partes.push("mil");
        else partes.push(`${inteiroPorExtenso(qtd)} mil`);
      } else {
        partes.push(
          `${inteiroPorExtenso(qtd)} ${qtd === 1 ? singular : plural}`,
        );
      }
    }
  }
  if (restante > 0) {
    const trecho = tresDigitos(restante);
    const precisaE =
      partes.length > 0 && (restante < 100 || restante % 100 === 0);
    partes.push(precisaE ? `e ${trecho}` : trecho);
  }
  return partes.join(partes.length > 1 && !partes[partes.length - 1].startsWith("e ") ? ", " : " ");
}

/** 1234.56 -> "mil duzentos e trinta e quatro reais e cinquenta e seis centavos" */
export function valorPorExtenso(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const reais = Math.floor(n);
  const centavos = Math.round((n - reais) * 100);
  const partes: string[] = [];
  if (reais > 0) {
    partes.push(
      `${inteiroPorExtenso(reais)} ${reais === 1 ? "real" : "reais"}`,
    );
  }
  if (centavos > 0) {
    const ext = `${tresDigitos(centavos)} ${
      centavos === 1 ? "centavo" : "centavos"
    }`;
    partes.push(ext);
  }
  if (partes.length === 0) return "zero reais";
  return partes.join(" e ");
}

/** "dd/mm/aaaa" a partir de ISO, tolerante a entrada vazia. */
export function formatDateTimeBR(dateISO: string, time: string): string {
  return dataHoraCivil(dateISO, time);
}

/** Título automático do relatório: "PCDP 013912/26 — CELESTIMAR RIBEIRO DE ARAÚJO" */
export function tituloPadrao(pcdpNumero?: string, nome?: string): string {
  const pcdp = (pcdpNumero ?? "").trim();
  const quem = (nome ?? "").trim();
  if (pcdp && quem) return `PCDP ${pcdp} — ${quem}`;
  if (pcdp) return `PCDP ${pcdp}`;
  if (quem) return `RVN — ${quem}`;
  return "Relatório sem título";
}

/**
 * O título ainda é o automático? (vale para o padrão antigo "RVN — PCDP …",
 * para "Relatório sem título" e para o padrão novo, que é regenerado quando
 * o nome do proposto é preenchido depois).
 */
export function tituloAutomatico(titulo: string): boolean {
  const t = (titulo ?? "").trim();
  return (
    !t ||
    t === "Relatório sem título" ||
    /^RVN\s*[—-]\s*PCDP/i.test(t) ||
    /^PCDP\b/i.test(t)
  );
}

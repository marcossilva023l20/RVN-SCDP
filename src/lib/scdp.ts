import { dataHoraMilitar, formataMoeda, parseMoeda, valorPorExtenso } from "@/lib/format";

/**
 * Campos do RVN que o parser consegue extrair do texto copiado das telas do
 * SCDP ("Informações da Viagem", "Roteiro da Viagem" e "Quadro de
 * Totalizações"). Tudo é opcional: importa-se o que for reconhecido.
 */
export interface ScdpImport {
  pcdpNumero?: string;
  pcdpData?: string;
  nome?: string;
  tipoBeneficiario?: string;
  cpf?: string;
  identidade?: string;
  email?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  idaDataHora?: string;
  voltaDataHora?: string;
  itinerario?: string;
  eventoInicio?: string;
  eventoTermino?: string;
  eventoDescricao?: string;
  diariasDias?: string;
  diariasValor?: string;
  diariasExtenso?: string;
}

/** Chaves importáveis, na ordem em que são aplicadas no editor/POST. */
export const CHAVES_IMPORT_SCDP = [
  "pcdpNumero",
  "pcdpData",
  "nome",
  "tipoBeneficiario",
  "cpf",
  "identidade",
  "email",
  "banco",
  "agencia",
  "conta",
  "idaDataHora",
  "voltaDataHora",
  "itinerario",
  "eventoInicio",
  "eventoTermino",
  "eventoDescricao",
  "diariasDias",
  "diariasValor",
  "diariasExtenso",
] as const satisfies ReadonlyArray<keyof ScdpImport>;

const DATA = "[0-9]{2}/[0-9]{2}/[0-9]{4}";

/** Tabs/espaços extras viram um espaço; quebras de linha são preservadas. */
function normalizar(texto: string): string {
  return texto
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

/**
 * Extrai os dados do RVN a partir do texto colado/copiado do SCDP.
 * Tolerante a variações de cópia (valores na mesma linha ou na seguinte).
 */
export function parseScdp(bruto: string): ScdpImport {
  const t = normalizar(bruto);
  const out: ScdpImport = {};
  if (!t) return out;

  /* ----- Informações da Viagem ----- */
  const mPcdp =
    t.match(new RegExp(`N[úu]mero da PCDP:\\s*([0-9]{3,7}\\s*/\\s*[0-9]{2,4})`, "i")) ??
    t.match(/\b([0-9]{6}\s*\/\s*[0-9]{2})\b/);
  if (mPcdp) out.pcdpNumero = mPcdp[1].replace(/\s+/g, "");

  const mSolic = t.match(new RegExp(`Data da Solicita[çc][ãa]o:\\s*(${DATA})`, "i"));
  if (mSolic) out.pcdpData = mSolic[1];

  const mNome = t.match(/Nome do Proposto:\s*\n?\s*([^\n]+)/i);
  if (mNome) {
    // Na cópia "tudo na mesma linha", corta no próximo rótulo conhecido.
    const nome = mNome[1]
      .split(
        /\s+(?:Tipo de Proposto|Per[íi]odo da Viagem|N[úu]mero da PCDP|Data da Solicita[çc][ãa]o|Motivo da Viagem|Descri[çc][ãa]o do Motivo)\s*:/i,
      )[0]
      .replace(/\s+/g, " ")
      .trim();
    if (nome) out.nome = nome;
  }

  const mTipo = t.match(/Tipo de Proposto:\s*\n?\s*([^\n]+)/i);
  if (mTipo && /militar/i.test(mTipo[1])) out.tipoBeneficiario = "militar";

  /* ----- Dados do Proposto (aba "Dados Atualizados") ----- */
  // Valor até a quebra de linha; "---" (sem dado) é ignorado.
  const pega = (re: RegExp): string => {
    const v = (t.match(re)?.[1] ?? "").replace(/\s+/g, " ").trim();
    return v && !/^-+$/.test(v) ? v : "";
  };

  if (!out.nome) {
    const n = pega(/\bNome:\s*\n?\s*([^\n]+)/i).split(
      /\s+(?:Matr[íi]cula|CPF|RG|E-?mail|Telefone)\s*[^:\n]*:/i,
    )[0];
    if (n.trim()) out.nome = n.trim();
  }
  if (!out.tipoBeneficiario && /PROPOSTO\s*\(\s*MILITAR/i.test(t)) {
    out.tipoBeneficiario = "militar";
  }

  const cpf = pega(/\bCPF:\s*\n?\s*([0-9][0-9.-]+)/i);
  if (cpf) out.cpf = cpf;

  const rg = pega(/\bRG:\s*\n?\s*([0-9A-Za-z-]+)/i);
  if (rg) out.identidade = rg;

  const email = pega(/\bE-?mail:\s*\n?\s*([^\s@]+@[^\s@]+)/i);
  if (email) out.email = email;

  /* ----- Dados para depósito das diárias ----- */
  const bancoRaw = pega(/\bBanco:\s*\n?\s*([^\n]+)/i);
  if (bancoRaw) {
    out.banco = /^0*1$/.test(bancoRaw) ? "Banco do Brasil" : bancoRaw;
  }

  const agencia = pega(/\bAg[êe]ncia:\s*\n?\s*([0-9A-Za-z-]+)/i);
  if (agencia) out.agencia = agencia;

  const contaRaw = pega(/\bConta \(com DV\):\s*\n?\s*([0-9-]+)/i);
  if (contaRaw) {
    let c = contaRaw;
    if (!c.includes("-")) {
      // "000000000000000140589" -> tira os zeros à esquerda -> "14058-9"
      c = c.replace(/^0+(?=\d)/, "");
      if (c.length > 1) c = `${c.slice(0, -1)}-${c.slice(-1)}`;
    }
    out.conta = c;
  }

  const mPeriodo = t.match(
    new RegExp(`Per[íi]odo da Viagem:\\s*(${DATA})\\s+a\\s+(${DATA})`, "i"),
  );

  /* ----- Roteiro da Viagem ----- */
  let ida = "";
  let volta = "";
  let itinerario = "";
  let evIni = "";
  let evFim = "";
  const reRoteiro = new RegExp(
    "([A-Za-zÀ-ú][\\w ./-]*?\\([A-Z]{2}\\))\\s+" + // origem
      "([A-Za-zÀ-ú][\\w ./-]*?\\([A-Z]{2}\\))\\s+" + // destino
      `(${DATA})\\s+a\\s+(${DATA})\\s+` + // permanência do trecho
      "(Trecho|Perman[êe]ncia|Retorno)",
    "gi",
  );
  for (const m of t.matchAll(reRoteiro)) {
    const [, origem, destino, d1, d2, tipo] = m;
    if (/trecho/i.test(tipo) && !itinerario) {
      itinerario = `${origem.trim()} > ${destino.trim()}`;
      ida = d1;
    }
    if (/perman/i.test(tipo)) {
      evIni = evIni || d1;
      evFim = evFim || d2;
    }
    if (/retorno/i.test(tipo)) volta = volta || d1;
  }

  // "Início do trabalho" (data + hora reais) vira o início do evento em
  // formato militar, ex.: 21/07/2026 07:00 -> 210700JUL26
  const mBlocoRoteiro = t.match(
    /ROTEIRO DA VIAGEM([\s\S]*?)(?=QUADRO DE TOTALIZA|$)/i,
  );
  if (mBlocoRoteiro) {
    const mIt = mBlocoRoteiro[1].match(
      new RegExp(`(${DATA}) ([0-9]{1,2}:[0-9]{2})`),
    );
    if (mIt) {
      const iso = mIt[1].split("/").reverse().join("-");
      const mil = dataHoraMilitar(iso, mIt[2]);
      if (mil) evIni = mil;
    }
  }

  if (!ida && mPeriodo) ida = mPeriodo[1];
  if (!volta && mPeriodo) volta = mPeriodo[2];
  if (!evIni && mPeriodo) evIni = mPeriodo[1];
  if (!evFim && mPeriodo) evFim = mPeriodo[2];

  if (itinerario) out.itinerario = itinerario;
  if (ida) out.idaDataHora = ida;
  if (volta) out.voltaDataHora = volta;
  if (evIni) out.eventoInicio = evIni;
  if (evFim) out.eventoTermino = evFim;

  /* ----- Quadro de Totalizações ----- */
  const mDias = t.match(/N[úu]mero de Di[áa]rias\s*\n?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (mDias) out.diariasDias = mDias[1].replace(".", ",");

  const mValor = t.match(
    /Valor da\(s\) Di[áa]ria\(s\)\s*\n?\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i,
  );
  if (mValor) {
    const v = parseMoeda(mValor[1]);
    if (v > 0) {
      out.diariasValor = formataMoeda(v);
      out.diariasExtenso = valorPorExtenso(v);
    }
  }

  /* ----- Descrição do motivo (para na próxima seção/aba, se houver) ----- */
  // Além das seções do RVN, corta nas abas/rótulos que o SCDP mostra logo
  // depois (Confirmação da viagem, Complemento, Resumo, Dados do Proposto,
  // Reunião de Colegiados, Lei ou Decreto, Portaria, Auxílios…) — isso não
  // faz parte da descrição do evento.
  const mDesc = t.match(
    /Descri[çc][ãa]o do Motivo da Viagem:\s*\n?\s*([\s\S]+?)(?=\n\s*(?:ROTEIRO DA VIAGEM|QUADRO DE TOTALIZA|CONFIRMA[ÇC][ÃA]O DA VIAGEM|COMPLEMENTO|RESUMO|DADOS DO PROPOSTO|DADOS ATUALIZADOS|REUNI[ÃA]O DE COLEGIADOS|LEI OU DECRETO|PORTARIA|AUX[ÍI]LIO-ALIMENTA|AUX[ÍI]LIO-TRANSPORTE)|$)/i,
  );
  if (mDesc) {
    const desc = mDesc[1].replace(/\s*\n+\s*/g, " ").trim();
    if (desc) out.eventoDescricao = desc;
  }

  return out;
}

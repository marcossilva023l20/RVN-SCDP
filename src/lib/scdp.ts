import {
  dataHoraMilitar,
  dataMilitar,
  formataMoeda,
  parseMoeda,
  valorPorExtenso,
} from "@/lib/format";

/**
 * Campos do RVN que o parser consegue extrair do texto copiado das telas do
 * SCDP ("Informações da Viagem", "Roteiro da Viagem" e "Quadro de
 * Totalizações"). Tudo é opcional: importa-se o que for reconhecido.
 */
export type ModalBilhete = "aereo" | "rodoviario" | "";

/** Uma linha da tabela "BILHETES A PRESTAR CONTAS" do SCDP. */
export interface BilheteImport {
  /** utilizado (canhotos, seção 9) ou nao_utilizado (devolvido, seção 8) */
  tipo: "utilizado" | "nao_utilizado";
  localizador: string; // Número do Bilhete
  data: string; // Data do processamento (ou a permanência do trecho)
  trecho: string; // "Origem > Destino"
  cia: string; // Companhia de Transporte (GOL, Gontijo…)
  voo: string; // Número do Voo (vazio quando 0/sem voo)
  reserva: string;
  horario: string;
  /** aéreo ou rodoviário, deduzido da companhia (só informativo) */
  modal: ModalBilhete;
}

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
  bilhetes?: BilheteImport[];
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

/**
 * "João Pessoa (PB)", "Crato (CE)", "São Luís (MA)"…
 *
 * - \p{L} (flag "u") aceita acentos em toda a palavra: com \w, "São Luís"
 *   era lido como "ís";
 * - cada palavra é ancorada (Title Case ou conector curto "de/do/dos"),
 *   números longos (nº do bilhete/voo) e palavras em CAIXA ALTA
 *   ("LTDA", "SOARES", "AGENCIA") quebram a sequência — sem isso o regex
 *   "engolia" tudo até o parêntese da cidade.
 */
const PALAVRA_CIDADE =
  "(?<![\\p{L}])(?![A-ZÀ-Þ]{2})(?![\\p{L}\\p{N}.'/-]*\\d{5})[A-ZÀ-Þ][\\p{L}\\p{N}.'/-]*";
const CONECTOR_CIDADE = "(?<![\\p{L}])[a-zà-ÿ]{1,4}";
const CIDADE = `((?:${PALAVRA_CIDADE})(?:\\s+(?:${PALAVRA_CIDADE}|${CONECTOR_CIDADE})){0,6}\\s*\\(\\s*[A-Z]{2}\\s*\\))`;

const limpaCidade = (c: string) =>
  c
    .replace(/\s+/g, " ")
    .replace(/\s*\(\s*/g, " (")
    .replace(/\s*\)/g, ")")
    .trim();

const mesmaCidade = (a: string, b: string) =>
  limpaCidade(a).toLowerCase() === limpaCidade(b).toLowerCase();

/** Companhia de transporte -> aéreo ou rodoviário (só para o resumo). */
function modalDaCia(cia: string): ModalBilhete {
  if (/gol|latam|\btam\b|azul|avianca|voepass|passaredo|a[eé]re|air\s?lines/i.test(cia))
    return "aereo";
  if (
    /gontijo|cometa|guanabara|itapemirim|[uú]til|reunidas|rodovi|expresso|[oô]nibus|bus/i.test(
      cia,
    )
  )
    return "rodoviario";
  return "";
}

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
  let evIni = "";
  let evFim = "";
  /** Todas as linhas do Roteiro (usadas no itinerário completo e nos bilhetes) */
  const trechos: Array<{
    origem: string;
    destino: string;
    d1: string;
    d2: string;
    tipo: string;
  }> = [];
  // Sem a flag "i": ela anularia a regra de CAIXA ALTA dentro de CIDADE
  // (com "i", `[A-ZÀ-Þ]{2}` também casaria "Pi").
  const reRoteiro = new RegExp(
    `${CIDADE}\\s+` + // origem
      `${CIDADE}\\s+` + // destino
      `(${DATA})\\s+[aA]\\s+(${DATA})\\s+` + // permanência do trecho
      "([Tt]recho|[Pp]erman[êe]ncia|[Pp]ermanencia|[Rr]etorno)",
    "gu",
  );
  for (const m of t.matchAll(reRoteiro)) {
    const [, origemRaw, destinoRaw, d1, d2, tipo] = m;
    const origem = limpaCidade(origemRaw);
    const destino = limpaCidade(destinoRaw);
    trechos.push({ origem, destino, d1, d2, tipo });
    if (/trecho/i.test(tipo) && !ida) {
      ida = d1;
    }
    if (/perman/i.test(tipo)) {
      evIni = evIni || d1;
      evFim = evFim || d2;
    }
    if (/retorno/i.test(tipo)) volta = volta || d1;
  }

  // Itinerário completo: encadeia origem/destino de TODOS os trechos, sem
  // repetir cidade (a linha de Permanência "X > X" não duplica).
  const caminho: string[] = [];
  for (const tr of trechos) {
    if (!caminho.length || !mesmaCidade(caminho[caminho.length - 1], tr.origem)) {
      caminho.push(tr.origem);
    }
    if (!mesmaCidade(caminho[caminho.length - 1], tr.destino)) {
      caminho.push(tr.destino);
    }
  }
  const itinerario = caminho.join(" > ");

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

  // Data civil só com o dia vira formato militar sem hora: 20/07/2026 -> 20JUL26.
  // Quando há hora real (ex.: "início do trabalho"), o militar completo
  // (210700JUL26) é mantido.
  const paraMilitar = (v: string) =>
    /^\d{2}\/\d{2}\/\d{4}$/.test(v)
      ? dataMilitar(v.split("/").reverse().join("-"))
      : v;

  if (itinerario) out.itinerario = itinerario;
  if (ida) out.idaDataHora = paraMilitar(ida);
  if (volta) out.voltaDataHora = paraMilitar(volta);
  if (evIni) out.eventoInicio = paraMilitar(evIni);
  if (evFim) out.eventoTermino = paraMilitar(evFim);

  /* ----- Bilhetes (tabela "a prestar contas" + detalhe do bilhete) --- */
  const listaBilhetes: BilheteImport[] = [];

  const mSecBil = t.match(/BILHETES?\s+A\s+PRESTAR\s+CONTAS/i);
  if (mSecBil?.index !== undefined) {
    const inicio = mSecBil.index;
    const resto = t.slice(inicio);
    // As duas tabelas (aérea e rodoviária) usam o mesmo título e ficam
    // juntas; a seção termina na próxima tela conhecida.
    const mFim = resto.match(
      /\n\s*(?:INFORMA[ÇC][ÕO]ES DA VIAGEM|ROTEIRO DA VIAGEM|QUADRO DE TOTALIZA[ÇC][ÕO]ES|DADOS ATUALIZADOS|DADOS DO PROPOSTO)/i,
    );
    let bloco = resto.slice(0, mFim?.index ?? resto.length);
    // Fora os títulos e os rótulos das colunas.
    for (const rotulo of [
      "BILHETES A PRESTAR CONTAS",
      "Companhia de Transporte",
      "Número do Bilhete",
      "Situação do Bilhete",
      "Data do Processamento",
      "Número do Voo",
      "Cidade de Origem",
      "Cidade de Destino",
      "Comprovação Automatizada",
    ]) {
      bloco = bloco.replace(new RegExp(rotulo.replace(/ /g, "\\s+"), "gi"), " ");
    }
    bloco = bloco.replace(/\s+/g, " ").trim();

    // Cada linha tem obrigatoriamente "Cidade (UF) Cidade (UF)".
    const pares: Array<{
      inicio: number;
      fim: number;
      origem: string;
      destino: string;
    }> = [];
    const rePar = new RegExp(`${CIDADE}\\s+${CIDADE}`, "gu");
    for (const m of bloco.matchAll(rePar)) {
      const i = m.index ?? 0;
      pares.push({
        inicio: i,
        fim: i + m[0].length,
        origem: limpaCidade(m[1]),
        destino: limpaCidade(m[2]),
      });
    }

    let fimAnterior = 0;
    for (let i = 0; i < pares.length; i++) {
      const p = pares[i];
      let prefixo = bloco.slice(fimAnterior, p.inicio);
      const depois = bloco.slice(
        p.fim,
        i + 1 < pares.length ? pares[i + 1].inicio : bloco.length,
      );
      const mComp = depois.match(/^\s*(Sim|N[aã]o)\b/i);
      fimAnterior = p.fim + (mComp ? mComp[0].length : 0);

      // Se a "Situação do Bilhete" indicar devolução, vai para a seção 8.
      const devolvido = /devolv|n[ãa]o\s+utiliz|cancelad/i.test(prefixo);

      const mData = prefixo.match(new RegExp(`\\b(${DATA})\\b`));
      const mBilhete = [...prefixo.matchAll(/\b[A-Z0-9]{10,}\b/g)]
        .filter((x) => (x[0].match(/\d/g)?.length ?? 0) >= 10)
        .pop();
      const localizador = mBilhete?.[0] ?? "";
      if (mBilhete?.index !== undefined) {
        prefixo =
          prefixo.slice(0, mBilhete.index) +
          " " +
          prefixo.slice(mBilhete.index + localizador.length);
      }
      if (mData) prefixo = prefixo.replace(mData[0], " ");

      prefixo = prefixo.replace(/\bn\/a\b/gi, " ").replace(/-{2,}/g, " ");
      const mVoo = prefixo.match(/(\D|^)(\d{1,5})\s*$/);
      const voo = mVoo?.[2] ?? "";
      const cia = prefixo
        .replace(/(\D|^)(\d{1,5})\s*$/, " ")
        .replace(/\b(Sim|N[ãa]o)\b/gi, " ")
        // "Situação do Bilhete" (coluna entre o nº e a data)
        .replace(
          /\b(?:devolvido|utilizado|emitido|cancelado|reservado|reembolsado)\b/gi,
          " ",
        )
        .replace(/[|;]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^[\s.,-]+|[\s.,-]+$/g, "")
        .trim();

      if (!cia && !localizador && !voo) continue;

      const trecho = `${p.origem} > ${p.destino}`;
      // Sem "Data do Processamento", usa a permanência do trecho igual no
      // Roteiro da Viagem (quando existir).
      const doRoteiro = trechos.find(
        (x) => mesmaCidade(x.origem, p.origem) && mesmaCidade(x.destino, p.destino),
      );
      const data = mData?.[1] || doRoteiro?.d1 || "";

      listaBilhetes.push({
        tipo: devolvido ? "nao_utilizado" : "utilizado",
        localizador,
        data: data ? paraMilitar(data) : "",
        trecho,
        cia,
        voo: voo && voo !== "0" ? voo : "",
        reserva: "",
        horario: "",
        modal: modalDaCia(cia),
      });
    }
  }

  /* ----- Detalhe do bilhete ("Código da Reserva") ----- */
  // Quadro que o SCDP mostra ao clicar num trecho: nº da reserva, agência e as
  // datas/horas de origem e destino. Casa com o bilhete da tabela anterior
  // pelo trecho; sozinho, também cria as linhas.
  if (/C[óo]digo da Reserva/i.test(t)) {
    let plano = t;
    for (const rotulo of [
      "Código da Reserva",
      "Companhia",
      "Tarifa de Embarque",
      "Tarifa",
      "Tx. de Serviço",
      "Situação do Bilhete",
      "Agência de Viagem",
      "Situação do Trajeto",
      "Origem",
      "Destino",
    ]) {
      plano = plano.replace(new RegExp(rotulo.replace(/ /g, "\\s+"), "gi"), " ");
    }
    plano = plano.replace(/\s+/g, " ").trim();

    const reDet = new RegExp(
      `${CIDADE}\\s*,\\s*(${DATA})\\s*([0-9]{1,2}:[0-9]{2})\\s+` +
        `${CIDADE}\\s*,\\s*(${DATA})\\s*([0-9]{1,2}:[0-9]{2})`,
      "gu",
    );
    let fim = 0;
    for (const m of plano.matchAll(reDet)) {
      const i = m.index ?? 0;
      const cabeca = plano.slice(fim, i);
      fim = i + m[0].length;

      // Código da reserva: último token com letras E dígitos antes das
      // tarifas (a companhia vem logo depois dele).
      const mReserva = [
        ...cabeca.matchAll(/\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{5,12}\b/g),
      ].pop();
      const reserva = mReserva?.[0] ?? "";
      let cia = "";
      if (mReserva?.index !== undefined) {
        cia = cabeca.slice(mReserva.index + reserva.length).split(/R\$/)[0];
      } else {
        const mCia = cabeca
          .split(/R\$/)[0]
          .match(
            /((?:[A-ZÀ-Þ][\p{L}\p{N}&.'-]*\s+){0,3}[A-ZÀ-Þ][\p{L}\p{N}&.'-]*)\s*$/u,
          );
        cia = mCia?.[1] ?? "";
      }
      cia = cia
        .replace(/\b(Sim|N[ãa]o)\b/gi, " ")
        .replace(/\b(?:emitido|devolvido|utilizado|cancelado)\b/gi, " ")
        .replace(/[|;]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^[\s.,-]+|[\s.,-]+$/g, "")
        .trim();

      // A "Situação do Bilhete" vem depois do "Emitido" do trajeto anterior.
      const posEmitido = cabeca.toLowerCase().lastIndexOf("emitido");
      const situacao = posEmitido >= 0 ? cabeca.slice(posEmitido + 7) : cabeca;
      const devolvido = /devolv|n[ãa]o\s+utiliz|cancelad/i.test(situacao);

      const origem = limpaCidade(m[1]);
      const destino = limpaCidade(m[4]);
      const data = paraMilitar(m[2]);
      const horario = m[3];

      const igual = listaBilhetes.find((b) => {
        const [o, d] = b.trecho.split(" > ");
        return mesmaCidade(o ?? "", origem) && mesmaCidade(d ?? "", destino);
      });
      if (igual) {
        if (reserva) igual.reserva = reserva;
        if (data) igual.data = data;
        if (horario) igual.horario = horario;
        if (!igual.cia) igual.cia = cia;
        if (!igual.modal) igual.modal = modalDaCia(igual.cia);
        if (devolvido) igual.tipo = "nao_utilizado";
      } else {
        listaBilhetes.push({
          tipo: devolvido ? "nao_utilizado" : "utilizado",
          localizador: "",
          data,
          trecho: `${origem} > ${destino}`,
          cia,
          voo: "",
          reserva,
          horario,
          modal: modalDaCia(cia),
        });
      }
    }
  }

  if (listaBilhetes.length) out.bilhetes = listaBilhetes;

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

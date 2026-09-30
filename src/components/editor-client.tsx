"use client";

import { RvnDocument } from "@/components/document";
import {
  ORG_LINHAS_LABEL,
  ORG_LINHAS_PADRAO,
  cabecalhoEmLinhas,
  semAspasExternas,
} from "@/lib/org";
import {
  DataHoraField,
  DocRadioGroup,
  Field,
  TextArea,
  TextInput,
} from "@/components/fields";
import {
  formataMoeda,
  montaLocalData,
  parseMoeda,
  valorPorExtenso,
} from "@/lib/format";
import {
  ACRESCIMO_OPCOES,
  RETORNO_OPCOES,
  TIPOS_BENEFICIARIO,
  type ReportDraft,
} from "@/lib/types";
import { parseScdp, CHAVES_IMPORT_SCDP } from "@/lib/scdp";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  ClipboardPaste,
  Copy,
  FileCheck2,
  FileText,
  Landmark,
  MapPin,
  PenLine,
  Plane,
  Printer,
  Plus,
  RotateCcw,
  Sparkles,
  Ticket,
  Trash2,
  User,
  Wand2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type BilheteRow = ReportDraft["bilhetes"][number];

/* ================= Seção colapsável do editor ================= */

function EditorSection({
  num,
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  done = false,
}: {
  num: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  defaultOpen?: boolean;
  done?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-sm backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04]"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7ba889]/15 font-display text-[13px] font-bold text-[#a9cfba]">
          {num}
        </span>
        <Icon className="h-4 w-4 text-[#7e9789]" />
        <span className="flex-1 text-[13px] font-semibold tracking-wide text-[#e6efe9]">
          {title}
        </span>
        {done && (
          <span className="flex items-center gap-1 rounded-full bg-[#7ba889]/15 px-2 py-0.5 text-[10px] font-semibold text-[#a9cfba]">
            <Check className="h-3 w-3" /> ok
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-[#6f8277] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="space-y-4 border-t border-white/[0.07] px-4 py-4">
          {children}
        </div>
      )}
    </section>
  );
}

/* ================= Editor de bilhetes ================= */

function BilhetesEditor({
  titulo,
  tipo,
  colunas,
  rows,
  onChange,
}: {
  titulo: string;
  tipo: "nao_utilizado" | "utilizado";
  colunas: Array<{ key: keyof BilheteRow; label: string; ph: string }>;
  rows: BilheteRow[];
  onChange: (rows: BilheteRow[]) => void;
}) {
  const add = () =>
    onChange([
      ...rows,
      {
        tipo,
        localizador: "",
        data: "",
        trecho: "",
        cia: "",
        voo: "",
        reserva: "",
        horario: "",
        ordem: rows.length,
      },
    ]);
  const upd = (i: number, key: keyof BilheteRow, v: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  const del = (i: number) => onChange(rows.filter((_, j) => j !== i));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9db3a5]">
          {titulo}
        </span>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 rounded-md bg-[#7ba889]/15 px-2.5 py-1 text-[11.5px] font-semibold text-[#a9cfba] transition-colors hover:bg-[#7ba889]/25"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar linha
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-[12px] text-[#6f8277]">
          Nenhuma linha — o documento exibirá campos em branco para
          preenchimento manual.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div
              key={i}
              className="grid gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2"
              style={{
                gridTemplateColumns: `repeat(${colunas.length}, 1fr) 30px`,
              }}
            >
              {colunas.map((c) => (
                <input
                  key={c.key}
                  value={(r[c.key] as string) ?? ""}
                  onChange={(e) => upd(i, c.key, e.target.value)}
                  placeholder={c.ph}
                  title={c.label}
                  className="min-w-0 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1.5 text-[12px] text-[#edf2ee] outline-none placeholder:text-[#5f7165] focus:border-[#7ba889]"
                />
              ))}
              <button
                type="button"
                onClick={() => del(i)}
                title="Remover linha"
                className="flex items-center justify-center rounded-md text-[#8aa392] transition-colors hover:bg-red-500/15 hover:text-red-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= Editor principal ================= */

const CAMPOS_OBRIGATORIOS: Array<[keyof ReportDraft, string]> = [
  ["pcdpNumero", "Nº do PCDP"],
  ["nome", "Nome do beneficiário"],
  ["idaDataHora", "Data/hora de ida"],
  ["itinerario", "Itinerário"],
  ["eventoDescricao", "Evento"],
  ["localData", "Local e data"],
];

export function EditorClient({ initial }: { initial: ReportDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ReportDraft>(initial);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">(
    "saved",
  );
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const lastSavedJson = useRef(JSON.stringify(initial));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // id do relatório (o server shell injeta no draft via propriedade extra)
  const reportId = (initial as unknown as { id: number }).id;

  const doSave = useCallback(
    async (d: ReportDraft) => {
      const json = JSON.stringify(d);
      if (json === lastSavedJson.current) {
        setSaveState("saved");
        return;
      }
      setSaveState("saving");
      try {
        const res = await fetch(`/api/reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: json,
        });
        if (res.ok) {
          lastSavedJson.current = json;
          setSaveState("saved");
        } else {
          setSaveState("dirty");
        }
      } catch {
        setSaveState("dirty");
      }
    },
    [reportId],
  );

  const upd = useCallback(
    (patch: Partial<ReportDraft>) => {
      setDraft((d) => {
        const nd = { ...d, ...patch };
        setSaveState("dirty");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => void doSave(nd), 800);
        return nd;
      });
    },
    [doSave],
  );

  // Salva ao sair da página
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const pendentes = useMemo(
    () => CAMPOS_OBRIGATORIOS.filter(([k]) => !String(draft[k]).trim()),
    [draft],
  );

  /* ---- Ações ---- */
  const excluir = async () => {
    if (!confirm("Excluir este relatório definitivamente?")) return;
    await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  };

  const duplicar = async () => {
    await doSave(draft);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromId: reportId }),
    });
    const data = (await res.json()) as { id: number };
    router.push(`/relatorios/${data.id}`);
    router.refresh();
  };

  const gerarExtenso = () => {
    const v = parseMoeda(draft.diariasValor);
    if (v > 0) upd({ diariasExtenso: valorPorExtenso(v) });
  };

  const formatarValor = () => {
    const v = parseMoeda(draft.diariasValor);
    if (v > 0) upd({ diariasValor: formataMoeda(v) });
  };

  const [geradorCidade, setGeradorCidade] = useState("");
  const hojeISO = new Date().toISOString().slice(0, 10);
  const [geradorData, setGeradorData] = useState(hojeISO);

  const gerarLocalData = () =>
    upd({ localData: montaLocalData(geradorCidade, geradorData) });

  const sugerirAssinatura = () =>
    upd({
      assinatura: `${draft.nome.toUpperCase()}${draft.postoCargo ? ` – ${draft.postoCargo.toUpperCase()}` : ""}`,
    });

  /* ---- Importar do SCDP (texto colado) ---- */
  const [textoScdp, setTextoScdp] = useState("");
  const [resumoImport, setResumoImport] = useState("");

  const importarScdp = () => {
    const importado = parseScdp(textoScdp);
    const patch: Partial<ReportDraft> = {};
    for (const chave of CHAVES_IMPORT_SCDP) {
      const v = importado[chave];
      if (v) patch[chave] = v;
    }
    const n = Object.keys(patch).length;
    if (n === 0) {
      setResumoImport(
        "Nada reconhecido — copie no SCDP as seções Informações da Viagem, Roteiro da Viagem e Quadro de Totalizações.",
      );
      return;
    }
    upd(patch);
    setResumoImport(
      `${n} ${n === 1 ? "campo preenchido" : "campos preenchidos"} — datas já em formato militar. Revise horas e complete o que faltar.`,
    );
  };

  const updBilhetes = (tipo: string) => (rows: BilheteRow[]) =>
    upd({
      bilhetes: [
        ...draft.bilhetes.filter((b) => b.tipo !== tipo),
        ...rows,
      ],
    });

  /* ---- Preview com escala ---- */
  const wrapRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  const [paperH, setPaperH] = useState(1200);

  useEffect(() => {
    const el = wrapRef.current;
    const paper = paperRef.current;
    if (!el || !paper) return;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, (el.clientWidth - 8) / paper.offsetWidth));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = paperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPaperH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const previewDoc = (
    <div ref={wrapRef} className="mx-auto w-full max-w-[850px]">
      <div
        className="relative overflow-hidden"
        style={{ height: paperH * scale }}
      >
        <div
          ref={paperRef}
          className="rvn-paper origin-top-left"
          style={{ transform: `scale(${scale})` }}
        >
          <RvnDocument draft={draft} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#0d150f] text-[#edf2ee]">
      {/* ===== Toolbar ===== */}
      <header className="no-print sticky top-0 z-40 border-b border-white/[0.08] bg-[#0d150f]/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-[#9db3a5] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Painel</span>
          </button>
          <div className="h-5 w-px bg-white/10" />
          <input
            value={draft.titulo}
            onChange={(e) => upd({ titulo: e.target.value })}
            placeholder="Título do relatório"
            className="min-w-[140px] flex-1 rounded-lg border border-transparent bg-transparent px-2 py-2 text-[14px] font-semibold text-white outline-none transition-colors placeholder:text-[#5f7165] hover:border-white/10 focus:border-[#7ba889]/50 focus:bg-white/[0.04] sm:max-w-[320px]"
          />
          <select
            value={draft.status}
            onChange={(e) => upd({ status: e.target.value })}
            className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-wider outline-none transition-colors ${
              draft.status === "finalizado"
                ? "border-[#7ba889]/50 bg-[#7ba889]/15 text-[#a9cfba]"
                : "border-[#c9a45c]/40 bg-[#c9a45c]/10 text-[#e3c68f]"
            } [&>option]:text-black`}
          >
            <option value="rascunho">Rascunho</option>
            <option value="finalizado">Finalizado</option>
          </select>

          {/* Indicador de salvamento */}
          <span className="flex items-center gap-1.5 text-[11.5px] text-[#7e9789]">
            {saveState === "saving" ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9a45c]" />
                Salvando…
              </>
            ) : saveState === "dirty" ? (
              <>
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#c9a45c]" />
                Alterações pendentes
              </>
            ) : (
              <>
                <BadgeCheck className="h-3.5 w-3.5 text-[#7ba889]" />
                Salvo
              </>
            )}
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            {pendentes.length > 0 && (
              <button
                type="button"
                title={`Pendentes: ${pendentes.map(([, l]) => l).join(", ")}`}
                className="mr-1 hidden items-center gap-1.5 rounded-full border border-[#c9a45c]/30 bg-[#c9a45c]/10 px-3 py-1.5 text-[11px] font-semibold text-[#e3c68f] md:flex"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                {pendentes.length}{" "}
                {pendentes.length === 1 ? "campo pendente" : "campos pendentes"}
              </button>
            )}
            <button
              onClick={() => setShowPreviewMobile((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[12px] font-semibold text-[#cfe0d5] transition-colors hover:bg-white/[0.06] lg:hidden"
            >
              <FileText className="h-4 w-4" />
              {showPreviewMobile ? "Editar" : "Ver documento"}
            </button>
            <button
              onClick={duplicar}
              title="Duplicar relatório"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#9db3a5] transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={excluir}
              title="Excluir relatório"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#9db3a5] transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <a
              href={`/relatorios/${reportId}/imprimir`}
              target="_blank"
              onClick={() => void doSave(draft)}
              className="flex items-center gap-2 rounded-lg bg-[#8fb99d] px-4 py-2 text-[12.5px] font-bold text-[#0d150f] transition-all hover:bg-[#a9cfba] active:scale-[0.98]"
            >
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </a>
          </div>
        </div>
      </header>

      {/* ===== Corpo ===== */}
      <div className="mx-auto flex w-full max-w-[1640px] flex-1 gap-0">
        {/* ---- Coluna do formulário ---- */}
        <div
          className={`w-full lg:w-[460px] lg:shrink-0 ${showPreviewMobile ? "hidden lg:block" : ""}`}
        >
          <div className="dark-scroll space-y-3 px-4 py-4 lg:h-[calc(100vh-57px)] lg:overflow-y-auto lg:pr-3">
            {/* 0. Importar do SCDP */}
            <EditorSection
              num="0"
              title="Importar do SCDP (colar texto)"
              icon={ClipboardPaste}
              defaultOpen={false}
            >
              <p className="-mt-1 text-[12px] leading-relaxed text-[#7e9789]">
                No SCDP, selecione e copie as seções{" "}
                <strong className="text-[#a9bcae]">Informações da Viagem</strong>,{" "}
                <strong className="text-[#a9bcae]">Roteiro da Viagem</strong> e{" "}
                <strong className="text-[#a9bcae]">Quadro de Totalizações</strong>.
                Cole abaixo: o app preenche nº do PCDP, datas, itinerário,
                evento, diárias e — da aba{" "}
                <strong className="text-[#a9bcae]">Dados Atualizados</strong> —
                CPF, RG, e-mail e dados bancários. Só o que for reconhecido é
                alterado.
              </p>
              <TextArea
                value={textoScdp}
                onChange={setTextoScdp}
                placeholder="Cole aqui o texto copiado do SCDP…"
                rows={5}
              />
              <button
                type="button"
                onClick={importarScdp}
                disabled={!textoScdp.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-[#7ba889]/20 px-3 py-2 text-[12px] font-semibold text-[#c9e6d2] transition-colors hover:bg-[#7ba889]/30 disabled:opacity-40"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Preencher campos
              </button>
              {resumoImport && (
                <p className="text-[12px] leading-relaxed text-[#a9cfba]">
                  {resumoImport}
                </p>
              )}
            </EditorSection>

            {/* Cabeçalho */}
            <EditorSection
              num="H"
              title="Cabeçalho do documento (OM)"
              icon={Landmark}
              defaultOpen={false}
              done={!!draft.orgLinha1 && !!draft.orgLinha2}
            >
              <p className="-mt-1 text-[12px] leading-relaxed text-[#7e9789]">
                Estas 5 linhas formam o cabeçalho oficial do documento (acima do
                título). Vêm do seu perfil — ajuste aqui apenas se este
                relatório for de outra Organização Militar.
              </p>
              {/* Prévia do cabeçalho, como sai na impressão */}
              <div
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center"
                style={{
                  fontFamily:
                    '"Times New Roman", "Liberation Serif", Times, serif',
                }}
              >
                {cabecalhoEmLinhas(draft).map((l, i) => (
                  <p
                    key={i}
                    className="text-[12px] font-bold leading-snug text-[#edf2ee]"
                  >
                    {i === 4 ? `“${semAspasExternas(l)}”` : l}
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => upd({ ...ORG_LINHAS_PADRAO })}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-[#cfe0d5] transition-colors hover:bg-white/[0.06]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar cabeçalho do 3º BEC
              </button>
              {(
                [
                  "orgLinha1",
                  "orgLinha2",
                  "orgLinha3",
                  "orgLinha4",
                  "orgLinha5",
                ] as const
              ).map((key) => (
                <Field key={key} label={ORG_LINHAS_LABEL[key]}>
                  <TextInput
                    value={draft[key]}
                    onChange={(v) => upd({ [key]: v })}
                    placeholder={ORG_LINHAS_PADRAO[key]}
                  />
                </Field>
              ))}
            </EditorSection>

            {/* 1. PCDP */}
            <EditorSection
              num="1"
              title="PCDP"
              icon={FileCheck2}
              done={!!draft.pcdpNumero}
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nº do PCDP" hint="no SCDP">
                  <TextInput
                    value={draft.pcdpNumero}
                    onChange={(v) => upd({ pcdpNumero: v })}
                    placeholder="057409/25"
                    mono
                  />
                </Field>
                <Field label="Data da concessão">
                  <TextInput
                    value={draft.pcdpData}
                    onChange={(v) => upd({ pcdpData: v })}
                    placeholder="17/11/2025"
                    mono
                  />
                </Field>
              </div>
              <p className="text-[12px] text-[#7e9789]">
                Copie direto da tela da missão no SCDP (número e data do
                processo de concessão de diárias e passagens).
              </p>
            </EditorSection>

            {/* 2. Beneficiário */}
            <EditorSection
              num="2"
              title="Beneficiário"
              icon={User}
              done={!!draft.nome && !!draft.cpf}
            >
              <Field label="Tipo de beneficiário">
                <DocRadioGroup
                  value={draft.tipoBeneficiario}
                  onChange={(v) => upd({ tipoBeneficiario: v })}
                  options={TIPOS_BENEFICIARIO}
                />
              </Field>
              <Field label="Nome completo">
                <TextInput
                  value={draft.nome}
                  onChange={(v) => upd({ nome: v })}
                  placeholder="Nome conforme identidade"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="OM">
                  <TextInput
                    value={draft.om}
                    onChange={(v) => upd({ om: v })}
                    placeholder="3º BEC"
                  />
                </Field>
                <Field label="Posto/Grad/Cargo">
                  <TextInput
                    value={draft.postoCargo}
                    onChange={(v) => upd({ postoCargo: v })}
                    placeholder="Soldado"
                  />
                </Field>
                <Field label="CPF">
                  <TextInput
                    value={draft.cpf}
                    onChange={(v) => upd({ cpf: v })}
                    placeholder="000.000.000-00"
                    mono
                  />
                </Field>
                <Field label="Identidade">
                  <TextInput
                    value={draft.identidade}
                    onChange={(v) => upd({ identidade: v })}
                    placeholder="000000000-0"
                    mono
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Banco">
                  <TextInput
                    value={draft.banco}
                    onChange={(v) => upd({ banco: v })}
                    placeholder="Banco do Brasil"
                  />
                </Field>
                <Field label="Agência">
                  <TextInput
                    value={draft.agencia}
                    onChange={(v) => upd({ agencia: v })}
                    placeholder="0000"
                    mono
                  />
                </Field>
                <Field label="Conta corrente">
                  <TextInput
                    value={draft.conta}
                    onChange={(v) => upd({ conta: v })}
                    placeholder="000000"
                    mono
                  />
                </Field>
              </div>
              <Field label="E-mail">
                <TextInput
                  value={draft.email}
                  onChange={(v) => upd({ email: v })}
                  placeholder="seu.email@exemplo.mil.br"
                />
              </Field>
            </EditorSection>

            {/* 3. Afastamento */}
            <EditorSection
              num="3"
              title="Afastamento da sede"
              icon={CalendarClock}
              done={!!draft.idaDataHora && !!draft.itinerario}
            >
              <DataHoraField
                label="Ida (data/hora)"
                value={draft.idaDataHora}
                onChange={(v) => upd({ idaDataHora: v })}
              />
              <DataHoraField
                label="Volta (data/hora)"
                value={draft.voltaDataHora}
                onChange={(v) => upd({ voltaDataHora: v })}
                hint="deixe “-” se não houver"
              />
              <Field label="BI que publicou a autorização">
                <TextArea
                  value={draft.biAutorizacao}
                  onChange={(v) => upd({ biAutorizacao: v })}
                  placeholder="ADT BI Nº 194 DE 12 DE NOVEMBRO DE 2025, do 3º BEC."
                  rows={2}
                />
              </Field>
              <Field label="Itinerário completo" hint="cidades da missão">
                <TextInput
                  value={draft.itinerario}
                  onChange={(v) => upd({ itinerario: v })}
                  placeholder="João Pessoa (PB) > Picos (PI)"
                />
              </Field>
            </EditorSection>

            {/* 4. Evento */}
            <EditorSection
              num="4"
              title="Evento"
              icon={MapPin}
              done={!!draft.eventoDescricao}
            >
              <DataHoraField
                label="Início (data/hora)"
                value={draft.eventoInicio}
                onChange={(v) => upd({ eventoInicio: v })}
              />
              <DataHoraField
                label="Término (data/hora)"
                value={draft.eventoTermino}
                onChange={(v) => upd({ eventoTermino: v })}
              />
              <Field label="Descrição do evento">
                <TextArea
                  value={draft.eventoDescricao}
                  onChange={(v) => upd({ eventoDescricao: v })}
                  placeholder="Ex.: Participação no Curso X / Reunião de alinhamento Y."
                  rows={3}
                />
              </Field>
            </EditorSection>

            {/* 5. Retorno */}
            <EditorSection
              num="5"
              title="Situação do retorno"
              icon={RotateCcw}
              defaultOpen={false}
              done
            >
              <DocRadioGroup
                value={draft.retornoSituacao}
                onChange={(v) => upd({ retornoSituacao: v })}
                options={RETORNO_OPCOES}
              />
              {(draft.retornoSituacao === "restituicao" ||
                draft.retornoSituacao === "complementacao") && (
                <Field label="Data efetiva do retorno" hint="dd/mm/aaaa">
                  <TextInput
                    value={draft.retornoData}
                    onChange={(v) => upd({ retornoData: v })}
                    placeholder="20/11/2025"
                    mono
                  />
                </Field>
              )}
            </EditorSection>

            {/* 6. Diárias */}
            <EditorSection
              num="6"
              title="Diárias"
              icon={CircleDollarSign}
              defaultOpen={false}
              done={!!draft.diariasBi}
            >
              <Field label="BI que publicou a concessão" hint="ou “Não é o caso.”">
                <TextArea
                  value={draft.diariasBi}
                  onChange={(v) => upd({ diariasBi: v })}
                  placeholder="Não é o caso."
                  rows={2}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nº de dias">
                  <TextInput
                    value={draft.diariasDias}
                    onChange={(v) => upd({ diariasDias: v })}
                    placeholder="3"
                    mono
                  />
                </Field>
                <Field label="Valor total recebido">
                  <TextInput
                    value={draft.diariasValor}
                    onChange={(v) =>
                      upd({ diariasValor: v, diariasExtenso: "" })
                    }
                    placeholder="R$ 1.234,56"
                    mono
                  />
                </Field>
              </div>
              <Field label="Valor por extenso">
                <TextArea
                  value={draft.diariasExtenso}
                  onChange={(v) => upd({ diariasExtenso: v })}
                  placeholder="mil duzentos e trinta e quatro reais"
                  rows={2}
                />
              </Field>
              <button
                type="button"
                onClick={() => {
                  formatarValor();
                  gerarExtenso();
                }}
                className="flex items-center gap-2 rounded-lg border border-[#7ba889]/30 bg-[#7ba889]/10 px-3 py-2 text-[12px] font-semibold text-[#a9cfba] transition-colors hover:bg-[#7ba889]/20"
              >
                <Wand2 className="h-4 w-4" />
                Formatar valor e gerar “por extenso” automaticamente
              </button>
            </EditorSection>

            {/* 7. Acréscimo */}
            <EditorSection
              num="7"
              title="Acréscimo de embarque e desembarque"
              icon={Plane}
              defaultOpen={false}
              done
            >
              <DocRadioGroup
                value={draft.acrescimoSituacao}
                onChange={(v) => upd({ acrescimoSituacao: v })}
                options={ACRESCIMO_OPCOES}
              />
            </EditorSection>

            {/* 8. Bilhetes não utilizados */}
            <EditorSection
              num="8"
              title="Bilhetes não utilizados"
              icon={Ticket}
              defaultOpen={false}
              done={!!draft.devolucaoJustificativa}
            >
              <BilhetesEditor
                titulo="Bilhetes devolvidos"
                tipo="nao_utilizado"
                rows={draft.bilhetes.filter((b) => b.tipo === "nao_utilizado")}
                onChange={updBilhetes("nao_utilizado")}
                colunas={[
                  { key: "localizador", label: "Localizador", ph: "ABC123" },
                  { key: "data", label: "Data", ph: "14/11/25" },
                  { key: "trecho", label: "Trecho", ph: "JPA > FOR" },
                  { key: "cia", label: "Cia", ph: "LATAM" },
                  { key: "voo", label: "Nº voo", ph: "3001" },
                  { key: "horario", label: "Horário", ph: "14:00" },
                ]}
              />
              <Field label="Justificativa">
                <TextArea
                  value={draft.devolucaoJustificativa}
                  onChange={(v) => upd({ devolucaoJustificativa: v })}
                  placeholder="Não houve."
                  rows={2}
                />
              </Field>
            </EditorSection>

            {/* 9. Canhotos */}
            <EditorSection
              num="9"
              title="Canhotos / bilhetes utilizados"
              icon={Banknote}
              defaultOpen={false}
              done={draft.bilhetes.some((b) => b.tipo === "utilizado")}
            >
              <BilhetesEditor
                titulo="Bilhetes utilizados"
                tipo="utilizado"
                rows={draft.bilhetes.filter((b) => b.tipo === "utilizado")}
                onChange={updBilhetes("utilizado")}
                colunas={[
                  { key: "data", label: "Data", ph: "14/11/25" },
                  { key: "trecho", label: "Trecho", ph: "João Pessoa > Picos" },
                  { key: "cia", label: "Cia", ph: "EXP. GUANABARA" },
                  { key: "reserva", label: "Reserva", ph: "Q2666Z98" },
                  { key: "horario", label: "Horário", ph: "14:00" },
                ]}
              />
            </EditorSection>

            {/* Assinatura */}
            <EditorSection
              num="✦"
              title="Local, data e assinatura"
              icon={PenLine}
              done={!!draft.localData}
            >
              <div className="grid grid-cols-[1fr_150px] gap-3">
                <Field label="Cidade / UF">
                  <TextInput
                    value={geradorCidade}
                    onChange={setGeradorCidade}
                    placeholder="Picos/PI"
                  />
                </Field>
                <Field label="Data">
                  <input
                    type="date"
                    value={geradorData}
                    onChange={(e) => setGeradorData(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[13px] text-[#edf2ee] outline-none [color-scheme:dark] focus:border-[#7ba889]"
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={gerarLocalData}
                className="flex items-center gap-2 rounded-lg border border-[#7ba889]/30 bg-[#7ba889]/10 px-3 py-2 text-[12px] font-semibold text-[#a9cfba] transition-colors hover:bg-[#7ba889]/20"
              >
                <Sparkles className="h-4 w-4" />
                Gerar “Quartel em …, … de … de ….”
              </button>
              <Field label="Frase final (como sairá no documento)">
                <TextInput
                  value={draft.localData}
                  onChange={(v) => upd({ localData: v })}
                  placeholder="Quartel em Picos/PI, 25 de novembro de 2025."
                />
              </Field>
              <Field label="Linha de assinatura">
                <TextInput
                  value={draft.assinatura}
                  onChange={(v) => upd({ assinatura: v })}
                  placeholder="NOME COMPLETO – POSTO"
                />
              </Field>
              <button
                type="button"
                onClick={sugerirAssinatura}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[12px] font-semibold text-[#cfe0d5] transition-colors hover:bg-white/[0.09]"
              >
                <User className="h-4 w-4" />
                Usar nome + posto do beneficiário
              </button>
            </EditorSection>

            <p className="px-1 pb-6 text-center text-[11px] leading-relaxed text-[#5f7165]">
              Ao imprimir, o documento é gerado em A4 no formato oficial.
              <br />
              Anexe o PDF assinado à prestação de contas no SCDP.
            </p>
          </div>
        </div>

        {/* ---- Coluna do preview ---- */}
        <div
          className={`min-w-0 flex-1 ${showPreviewMobile ? "block" : "hidden lg:block"}`}
        >
          <div className="dark-scroll relative h-[calc(100vh-57px)] overflow-y-auto border-l border-white/[0.07] bg-[#111a14]">
            <div className="pointer-events-none sticky top-0 z-10 flex justify-center py-3">
              <span className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#0d150f]/85 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7e9789] backdrop-blur">
                <FileText className="h-3.5 w-3.5" />
                Documento oficial · A4
              </span>
            </div>
            <div className="px-4 pb-16">{previewDoc}</div>
          </div>
        </div>
      </div>

      {/* Marca d'água sutil */}
      <div aria-hidden className="pointer-events-none fixed bottom-3 left-4 hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#41544a] lg:flex">
        <Building2 className="h-3 w-3" />
        RVN Fácil · SCDP
      </div>
    </div>
  );
}

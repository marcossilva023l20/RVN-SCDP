"use client";

import type { Profile, Report, ReportDraft } from "@/lib/types";
import {
  ORG_LINHAS_LABEL,
  ORG_LINHAS_PADRAO,
  cabecalhoEmLinhas,
  semAspasExternas,
} from "@/lib/org";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Check,
  ClipboardPaste,
  Copy,
  ExternalLink,
  FileText,
  ListChecks,
  Loader2,
  MapPin,
  MousePointerClick,
  PlaneTakeoff,
  Plus,
  Printer,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const fmtData = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

const fmtHora = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

/** Exemplo fiel ao modelo oficial (para demonstração com um clique). */
function exemploRVN(): Partial<ReportDraft> {
  return {
    titulo: "Exemplo — Conclusão CNH (Picos/PI)",
    status: "rascunho",
    pcdpNumero: "057409/25",
    pcdpData: "17/11/2025",
    tipoBeneficiario: "militar",
    nome: "Fulano de Tal da Silva",
    om: "3º BEC",
    postoCargo: "Soldado",
    cpf: "000.000.000-00",
    banco: "Banco do Brasil",
    agencia: "0000",
    conta: "000000",
    email: "exemplo@eb.mil.br",
    identidade: "000000000-0",
    idaDataHora: "141400NOV25",
    voltaDataHora: "-",
    biAutorizacao:
      "ADT BI Nº 194 DE 12 DE NOVEMBRO DE 2025, do 3º BEC.",
    itinerario: "João Pessoa (PB) > Picos (PI)",
    eventoInicio: "141400NOV25",
    eventoTermino: "-",
    eventoDescricao: "Retorno da Conclusão da mudança de categoria de CNH.",
    retornoSituacao: "prevista",
    diariasBi: "Não é o caso.",
    diariasDias: "-",
    diariasValor: "-",
    diariasExtenso: "-",
    acrescimoSituacao: "nao_utilizou",
    devolucaoJustificativa: "Não houve.",
    localData: "Quartel em Picos/PI, 25 de novembro de 2025.",
    assinatura: "FULANO DE TAL DA SILVA – SD NB",
    bilhetes: [
      {
        tipo: "utilizado",
        localizador: "",
        data: "14/11/25",
        trecho: "João Pessoa (PB) > Picos (PI)",
        cia: "EXPRESSO GUANABARA",
        voo: "",
        reserva: "Q2666Z98",
        horario: "14:00",
        ordem: 0,
      },
    ],
  };
}

export function DashboardClient({
  initialReports,
  initialProfile,
}: {
  initialReports: Report[];
  initialProfile: Profile;
}) {
  const router = useRouter();
  const [reports] = useState(initialReports);
  const [profile, setProfile] = useState(initialProfile);
  const [creating, setCreating] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const bookmarklet = useMemo(() => {
    if (!origin) return "#";
    const code = `(function(){var t=(window.getSelection?window.getSelection().toString():'')||'';var m=t.match(/\\d{4,7}\\s*\\/\\s*\\d{2,4}/);window.open('${origin}/novo?'+(m?('pcdp='+encodeURIComponent(m[0].replace(/\\s/g,''))):'')+'&t='+encodeURIComponent(t.slice(0,300)),'_blank');})()`;
    return `javascript:${code}`;
  }, [origin]);

  const criar = async (exemplo = false) => {
    setCreating(true);
    try {
      const res = await fetch("/api/reports", { method: "POST", body: "{}" });
      const { id } = (await res.json()) as { id: number };
      if (exemplo) {
        const dados = exemploRVN();
        await fetch(`/api/reports/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        });
      }
      router.push(`/relatorios/${id}`);
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  const excluir = async (id: number) => {
    if (!confirm("Excluir este relatório definitivamente?")) return;
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const duplicar = async (id: number) => {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromId: id }),
    });
    const { id: novoId } = (await res.json()) as { id: number };
    router.push(`/relatorios/${novoId}`);
    router.refresh();
  };

  const salvarPerfil = async (dados: Profile = profile) => {
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } finally {
      setSavingProfile(false);
    }
  };

  /**
   * Volta as 5 linhas do cabeçalho ao padrão do Batalhão — inclusive quando
   * ficou gravado texto de antes (ex.: só "3º BEC" na linha 3) ou quando uma
   * linha ficou vazia. Já salva o perfil.
   */
  const restaurarCabecalho = () => {
    const dados: Profile = { ...profile, ...ORG_LINHAS_PADRAO };
    setProfile(dados);
    void salvarPerfil(dados);
  };

  const rascunhos = reports.filter((r) => r.status === "rascunho").length;
  const finalizados = reports.length - rascunhos;

  const inputCls =
    "w-full rounded-lg border border-line bg-cream px-3 py-2 text-[13px] text-ink outline-none transition-all placeholder:text-ink/35 focus:border-pine focus:ring-2 focus:ring-pine/15";
  const labelCls =
    "mb-1 block text-[10.5px] font-bold uppercase tracking-[0.13em] text-ink-soft";

  return (
    <div className="min-h-screen">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine text-white shadow-sm">
              <PlaneTakeoff className="h-4.5 w-4.5" strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <p className="font-display text-[17px] font-bold tracking-tight">
                RVN Fácil
              </p>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                Relatório de Viagem · SCDP
              </p>
            </div>
          </div>
          <button
            onClick={() => void criar(false)}
            disabled={creating}
            className="flex items-center gap-2 rounded-full bg-pine px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-pine-deep hover:shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            )}
            Novo relatório
          </button>
        </div>
      </header>

      <div className="bg-grain">
        <div className="mx-auto max-w-7xl px-4 pb-20">
          {/* ===== Hero ===== */}
          <section className="grid gap-6 py-12 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:py-16">
            <div className="anim-rise">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-pine/25 bg-pine/[0.07] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-pine">
                <ShieldCheck className="h-3.5 w-3.5" />
                Modelo oficial RVN / PCDP
              </p>
              <h1 className="font-display max-w-[620px] text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.06] tracking-tight">
                Sua prestação de contas,{" "}
                <span className="italic text-pine">montada sozinha.</span>
              </h1>
              <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-ink-soft">
                Com o SCDP aberto ao lado, copie os dados da missão, preencha os
                campos guiados e receba o documento oficial em A4 — pronto para
                assinar e anexar. Sem Word, sem formatação manual.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void criar(false)}
                  disabled={creating}
                  className="group flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-cream shadow-md transition-all hover:bg-pine-deep hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                >
                  Começar agora
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={() => void criar(true)}
                  disabled={creating}
                  className="flex items-center gap-2 rounded-full border border-ink/20 bg-white/60 px-5 py-3 text-[13.5px] font-semibold text-ink transition-all hover:border-pine/40 hover:bg-white active:scale-[0.98] disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4 text-gold" />
                  Ver exemplo preenchido
                </button>
              </div>
            </div>

            <div className="anim-rise anim-rise-1 grid grid-cols-3 gap-3 lg:justify-items-end">
              {[
                { n: reports.length, l: "relatórios" },
                { n: rascunhos, l: "em rascunho" },
                { n: finalizados, l: "finalizados" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="w-full rounded-2xl border border-line bg-white/70 px-4 py-4 text-center shadow-sm lg:max-w-[130px]"
                >
                  <p className="font-display text-3xl font-bold text-pine">
                    {s.n}
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* ===== Lista de relatórios ===== */}
            <main className="anim-rise anim-rise-2 lg:col-span-8">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Meus relatórios
                </h2>
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Salvamento automático
                </span>
              </div>

              {reports.length === 0 ? (
                <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink/25 bg-white/50 px-6 py-16 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pine/[0.08] text-pine">
                    <FileText className="h-7 w-7" strokeWidth={1.6} />
                  </span>
                  <h3 className="font-display mt-4 text-lg font-semibold">
                    Nenhum relatório ainda
                  </h3>
                  <p className="mt-1 max-w-[340px] text-[13px] leading-relaxed text-ink-soft">
                    Crie seu primeiro RVN — ou gere o exemplo preenchido para
                    ver como o documento oficial sai montado.
                  </p>
                  <button
                    onClick={() => void criar(true)}
                    className="mt-5 flex items-center gap-2 rounded-full bg-pine px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-pine-deep"
                  >
                    <Wand2 className="h-4 w-4" />
                    Criar exemplo
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {reports.map((r) => (
                    <li
                      key={r.id}
                      className="group relative overflow-hidden rounded-2xl border border-line bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pine/35 hover:shadow-md"
                    >
                      <Link
                        href={`/relatorios/${r.id}`}
                        className="block px-5 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display truncate text-[16.5px] font-semibold tracking-tight">
                                {r.titulo || "Relatório sem título"}
                              </h3>
                              <span
                                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  r.status === "finalizado"
                                    ? "bg-pine/10 text-pine"
                                    : "bg-gold/15 text-[#8a6210]"
                                }`}
                              >
                                {r.status === "finalizado" ? (
                                  <BadgeCheck className="h-3 w-3" />
                                ) : (
                                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                                )}
                                {r.status === "finalizado"
                                  ? "Finalizado"
                                  : "Rascunho"}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-soft">
                              {r.pcdpNumero && (
                                <span className="font-mono text-[12px] font-semibold text-ink">
                                  PCDP {r.pcdpNumero}
                                </span>
                              )}
                              {r.itinerario && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-moss" />
                                  {r.itinerario}
                                </span>
                              )}
                              {!r.itinerario && r.eventoDescricao && (
                                <span className="truncate">
                                  {r.eventoDescricao}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 text-[11px] text-ink-soft/80">
                            {fmtHora(r.updatedAt as unknown as string)}
                          </span>
                        </div>
                      </Link>
                      <div className="flex items-center gap-1 border-t border-line/70 bg-cream/60 px-4 py-2">
                        <Link
                          href={`/relatorios/${r.id}`}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-pine transition-colors hover:bg-pine/10"
                        >
                          Abrir editor
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <div className="ml-auto flex items-center gap-1">
                          <a
                            href={`/relatorios/${r.id}/imprimir`}
                            target="_blank"
                            title="Imprimir / PDF"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
                          >
                            <Printer className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => void duplicar(r.id)}
                            title="Duplicar"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void excluir(r.id)}
                            title="Excluir"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </main>

            {/* ===== Aside ===== */}
            <aside className="space-y-5 lg:col-span-4">
              {/* Perfil */}
              <section className="anim-rise anim-rise-3 overflow-hidden rounded-3xl border border-line bg-white/85 shadow-sm">
                <header className="flex items-center gap-2.5 border-b border-line/70 bg-cream/70 px-5 py-3.5">
                  <UserRound className="h-4.5 w-4.5 text-pine" />
                  <div className="flex-1">
                    <h3 className="text-[13.5px] font-bold tracking-tight">
                      Perfil do beneficiário
                    </h3>
                    <p className="text-[11px] text-ink-soft">
                      Novos relatórios já nascem preenchidos
                    </p>
                  </div>
                  {profileSaved && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-pine">
                      <Check className="h-3.5 w-3.5" /> Salvo
                    </span>
                  )}
                </header>
                <div className="grid grid-cols-2 gap-3 px-5 py-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Nome completo</label>
                    <input
                      className={inputCls}
                      value={profile.nome}
                      onChange={(e) =>
                        setProfile({ ...profile, nome: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>OM</label>
                    <input
                      className={inputCls}
                      value={profile.om}
                      onChange={(e) =>
                        setProfile({ ...profile, om: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Posto/Grad/Cargo</label>
                    <input
                      className={inputCls}
                      value={profile.postoCargo}
                      onChange={(e) =>
                        setProfile({ ...profile, postoCargo: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>CPF</label>
                    <input
                      className={inputCls}
                      value={profile.cpf}
                      onChange={(e) =>
                        setProfile({ ...profile, cpf: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Identidade</label>
                    <input
                      className={inputCls}
                      value={profile.identidade}
                      onChange={(e) =>
                        setProfile({ ...profile, identidade: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Banco</label>
                    <input
                      className={inputCls}
                      value={profile.banco}
                      onChange={(e) =>
                        setProfile({ ...profile, banco: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Agência</label>
                      <input
                        className={inputCls}
                        value={profile.agencia}
                        onChange={(e) =>
                          setProfile({ ...profile, agencia: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Conta</label>
                      <input
                        className={inputCls}
                        value={profile.conta}
                        onChange={(e) =>
                          setProfile({ ...profile, conta: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>E-mail</label>
                    <input
                      className={inputCls}
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2 border-t border-line/70 pt-3">
                    <label className={labelCls}>Cabeçalho do documento</label>
                    {/* Prévia das 5 linhas, exatamente como saem no RVN */}
                    <div className="rounded-xl border border-line bg-cream/70 px-3 py-2.5 text-center">
                      {cabecalhoEmLinhas(profile).map((l, i) => (
                        <p
                          key={i}
                          className="text-[11px] font-bold leading-snug text-ink"
                          style={{
                            fontFamily:
                              '"Times New Roman", "Liberation Serif", Times, serif',
                          }}
                        >
                          {i === 4 ? `“${semAspasExternas(l)}”` : l}
                        </p>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
                      Linha em branco volta ao padrão do Batalhão ao salvar.
                    </p>
                    <button
                      type="button"
                      onClick={restaurarCabecalho}
                      disabled={savingProfile}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-pine/30 bg-pine/5 px-3 py-2 text-[12px] font-bold text-pine transition-colors hover:bg-pine/10 disabled:opacity-60"
                    >
                      {savingProfile ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Restaurar cabeçalho do 3º BEC
                    </button>
                  </div>
                  {(["orgLinha3", "orgLinha4", "orgLinha5"] as const).map(
                    (key) => (
                      <div key={key} className="col-span-2">
                        <label className={labelCls}>
                          {ORG_LINHAS_LABEL[key]}
                        </label>
                        <input
                          className={inputCls}
                          placeholder={ORG_LINHAS_PADRAO[key]}
                          value={profile[key]}
                          onChange={(e) =>
                            setProfile({ ...profile, [key]: e.target.value })
                          }
                        />
                      </div>
                    ),
                  )}
                </div>
                <div className="px-5 pb-4">
                  <button
                    onClick={() => void salvarPerfil()}
                    disabled={savingProfile}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-semibold text-cream transition-all hover:bg-pine-deep active:scale-[0.99] disabled:opacity-60"
                  >
                    {savingProfile && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Salvar perfil
                  </button>
                </div>
              </section>

              {/* Guia SCDP */}
              <section className="anim-rise anim-rise-4 overflow-hidden rounded-3xl bg-ink text-cream shadow-md">
                <header className="flex items-center gap-2.5 border-b border-white/10 px-5 py-3.5">
                  <BookOpenCheck className="h-4.5 w-4.5 text-[#a9cfba]" />
                  <h3 className="text-[13.5px] font-bold tracking-tight">
                    Como usar com o SCDP aberto
                  </h3>
                </header>
                <ol className="space-y-4 px-5 py-5">
                  {[
                    {
                      icon: ExternalLink,
                      t: "Deixe o SCDP aberto ao lado",
                      d: "Mantenha a aba do SCDP logada (ou divida a tela) e localize a sua missão.",
                    },
                    {
                      icon: ClipboardPaste,
                      t: "Copie os dados da missão",
                      d: "Nº do PCDP, datas de ida/volta, itinerário e o BI que publicou a autorização.",
                    },
                    {
                      icon: ListChecks,
                      t: "Preencha os campos guiados",
                      d: "O app monta o documento oficial sozinho, com data militar e valor por extenso automáticos.",
                    },
                    {
                      icon: Printer,
                      t: "Imprima, assine e anexe",
                      d: "Gere o PDF em A4, assine e faça o upload na prestação de contas do SCDP.",
                    },
                  ].map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-[#a9cfba]">
                        <s.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold">
                          {i + 1}. {s.t}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-cream/65">
                          {s.d}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                {/* Bookmarklet */}
                <div className="border-t border-white/10 bg-white/[0.04] px-5 py-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#a9cfba]">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    Bônus: capturar do SCDP
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-cream/65">
                    Arraste o botão abaixo para a sua{" "}
                    <strong className="text-cream">barra de favoritos</strong>.
                    Estando na página da missão no SCDP, selecione o texto e
                    clique no favorito: um relatório novo já abre com o nº do
                    PCDP detectado.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={bookmarklet}
                      onClick={(e) => {
                        if (bookmarklet === "#") e.preventDefault();
                        else {
                          e.preventDefault();
                          alert(
                            "Arraste este botão até a barra de favoritos do navegador (Ctrl+Shift+B).",
                          );
                        }
                      }}
                      className="inline-flex cursor-move items-center gap-1.5 rounded-full bg-[#a9cfba] px-4 py-2 text-[12px] font-bold text-ink shadow-sm transition-transform hover:scale-[1.03] active:scale-95"
                    >
                      <PlaneTakeoff className="h-3.5 w-3.5" />
                      ⌘ Capturar do SCDP
                    </a>
                    <span className="text-[11px] text-cream/50">
                      ← arraste p/ favoritos
                    </span>
                  </div>
                  <p className="mt-3 border-t border-white/[0.07] pt-3 text-[11.5px] leading-relaxed text-cream/50">
                    Organização: dados salvos somente neste ambiente — nada sai
                    do banco de dados local.
                  </p>
                </div>
              </section>

              <p className="px-2 text-center text-[11px] leading-relaxed text-ink-soft/70">
                Modelo de referência: Relatório de Viagem Nacional (RVN/PCDP)
                <br />
                atualizado em {fmtData(new Date().toISOString())}
              </p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

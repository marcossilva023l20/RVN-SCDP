"use client";

import { Loader2, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

const CONFIRMACAO = "EXCLUIR";

/**
 * Modal de confirmação do "Excluir todos". Deixa claro que a ação é
 * irreversível, que os bilhetes das seções 8 e 9 vão junto e que o perfil
 * é mantido. O botão vermelho só libera depois de digitar EXCLUIR.
 * Fecha com Esc, clique fora ou ✕.
 */
export function DeleteAllDialog({
  aberto,
  total,
  ocupado = false,
  onFechar,
  onConfirmar,
}: {
  aberto: boolean;
  total: number;
  ocupado?: boolean;
  onFechar: () => void;
  onConfirmar: () => void;
}) {
  if (!aberto) return null;
  // Ao abrir, o conteúdo é montado do zero: campo de confirmação sempre limpo.
  return (
    <DeleteAllDialogContent
      total={total}
      ocupado={ocupado}
      onFechar={onFechar}
      onConfirmar={onConfirmar}
    />
  );
}

function DeleteAllDialogContent({
  total,
  ocupado,
  onFechar,
  onConfirmar,
}: {
  total: number;
  ocupado: boolean;
  onFechar: () => void;
  onConfirmar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const liberado = texto.trim() === CONFIRMACAO && !ocupado;

  // Esc fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !ocupado) onFechar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ocupado, onFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="excluir-todos-titulo"
      onMouseDown={(e) => {
        // Clique fora fecha
        if (e.target === e.currentTarget && !ocupado) onFechar();
      }}
    >
      <div className="anim-rise w-full max-w-md overflow-hidden rounded-3xl border border-line bg-paper shadow-2xl">
        {/* Cabeçalho */}
        <header className="flex items-start gap-3 px-6 pb-4 pt-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
            <TriangleAlert className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="flex-1">
            <h3
              id="excluir-todos-titulo"
              className="font-display text-lg font-semibold tracking-tight"
            >
              Excluir todos os relatórios?
            </h3>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">
              Esta ação é irreversível.
            </p>
          </div>
          <button
            onClick={onFechar}
            disabled={ocupado}
            title="Fechar"
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Avisos + confirmação digitada */}
        <div className="space-y-3 px-6">
          <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3.5 text-[13px] leading-relaxed text-ink">
            <p>
              <strong>{total}</strong>{" "}
              {total === 1
                ? "relatório será excluído"
                : "relatórios serão excluídos"}{" "}
              definitivamente, junto com os bilhetes das seções 8 e 9.
            </p>
            <p className="mt-1.5 text-ink-soft">
              O seu perfil (dados do beneficiário e cabeçalho) é mantido.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmar-exclusao"
              className="mb-1 block text-[10.5px] font-bold uppercase tracking-[0.13em] text-ink-soft"
            >
              Digite <span className="text-red-600">EXCLUIR</span> para liberar
              o botão
            </label>
            <input
              id="confirmar-exclusao"
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && liberado) onConfirmar();
              }}
              placeholder="EXCLUIR"
              autoComplete="off"
              disabled={ocupado}
              className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-[13px] text-ink outline-none transition-all placeholder:text-ink/25 focus:border-red-500 focus:ring-2 focus:ring-red-500/15 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Ações */}
        <footer className="mt-5 flex items-center justify-end gap-2 border-t border-line/70 bg-cream/60 px-6 py-4">
          <button
            onClick={onFechar}
            disabled={ocupado}
            className="rounded-full border border-ink/20 bg-white/70 px-4 py-2.5 text-[13px] font-semibold text-ink transition-all hover:bg-white active:scale-[0.98] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={!liberado}
            className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {ocupado && <Loader2 className="h-4 w-4 animate-spin" />}
            Excluir os {total} {total === 1 ? "relatório" : "relatórios"}
          </button>
        </footer>
      </div>
    </div>
  );
}

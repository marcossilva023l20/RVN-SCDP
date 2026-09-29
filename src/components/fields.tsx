"use client";

import { dataHoraCivil, dataHoraMilitar } from "@/lib/format";
import { CalendarClock, Check } from "lucide-react";
import { useState, type ReactNode } from "react";

/* ---------- Inputs base (tema escuro do editor) ---------- */

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9db3a5]">
        {label}
        {hint && (
          <span className="text-[10px] font-normal normal-case tracking-normal text-[#6f8277]">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[13.5px] text-[#edf2ee] placeholder:text-[#5f7165] outline-none transition-all focus:border-[#7ba889] focus:bg-white/[0.09] focus:ring-2 focus:ring-[#7ba889]/20";

export function TextInput({
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputCls} ${mono ? "font-mono tracking-wide" : ""}`}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputCls} resize-y leading-relaxed`}
    />
  );
}

/* ---------- Radio estilo "checkbox do documento" ---------- */

export function DocRadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`group flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] transition-all ${
              active
                ? "border-[#7ba889]/50 bg-[#7ba889]/10 text-[#edf2ee]"
                : "border-white/8 bg-white/[0.03] text-[#a9bcae] hover:border-white/20 hover:bg-white/[0.06]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center border-[1.5px] transition-colors ${
                active
                  ? "border-[#9dc2a9] text-[#c9e6d2]"
                  : "border-[#5f7165] text-transparent group-hover:border-[#8aa392]"
              }`}
            >
              <Check className="h-3 w-3" strokeWidth={3.5} />
            </span>
            <span className="leading-snug">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Campo data/hora com gerador de formato militar ---------- */

export function DataHoraField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState("");
  const [h, setH] = useState("");

  const gerar = (estilo: "militar" | "civil") => {
    const v =
      estilo === "militar" ? dataHoraMilitar(d, h) : dataHoraCivil(d, h);
    if (v) {
      onChange(v);
      setOpen(false);
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <div className="flex-1">
          <TextInput
            value={value}
            onChange={onChange}
            placeholder="141400NOV25 ou 14/11/2025 às 14:00"
            mono
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          title="Gerar a partir do calendário"
          className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border transition-all ${
            open
              ? "border-[#7ba889] bg-[#7ba889]/15 text-[#c9e6d2]"
              : "border-white/10 bg-white/[0.06] text-[#9db3a5] hover:border-white/25 hover:text-white"
          }`}
        >
          <CalendarClock className="h-4.5 w-4.5" />
        </button>
      </div>
      {open && (
        <div className="anim-rise mt-2 rounded-lg border border-white/10 bg-[#101a13] p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={d}
              onChange={(e) => setD(e.target.value)}
              className={`${inputCls} [color-scheme:dark]`}
            />
            <input
              type="time"
              value={h}
              onChange={(e) => setH(e.target.value)}
              className={`${inputCls} [color-scheme:dark]`}
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => gerar("militar")}
              disabled={!d}
              className="flex-1 rounded-md bg-[#7ba889]/20 px-3 py-1.5 text-[12px] font-semibold text-[#c9e6d2] transition-colors hover:bg-[#7ba889]/30 disabled:opacity-40"
            >
              Militar (141400NOV25)
            </button>
            <button
              type="button"
              onClick={() => gerar("civil")}
              disabled={!d}
              className="flex-1 rounded-md bg-white/[0.07] px-3 py-1.5 text-[12px] font-semibold text-[#cfe0d5] transition-colors hover:bg-white/[0.12] disabled:opacity-40"
            >
              Civil (14/11/2025 às 14:00)
            </button>
          </div>
        </div>
      )}
    </Field>
  );
}

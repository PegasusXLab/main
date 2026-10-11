"use client";

// "Inspectable" switch + the inspection details (editor): when on, visitors can click the piece to
// open its panel; the creator fills the story / audio guide (children), a details table (Year,
// Medium, …) and a "learn more" link. When off, those fields fold away.

import React from "react";
import { Plus, X } from "lucide-react";
import type { InspectFact } from "@/lib/schema/types";
import { FACT_PRESETS, safeLink } from "@/lib/inspect";
import { Input, Label } from "@/components/ui";

const MAX_FACTS = 8;

export function InspectFields({
  idPrefix,
  inspectable,
  onInspectableChange,
  facts,
  onFactsChange,
  link,
  onLinkChange,
  children,
}: {
  idPrefix: string;
  inspectable: boolean;
  onInspectableChange: (on: boolean) => void;
  facts: InspectFact[];
  onFactsChange: (facts: InspectFact[]) => void;
  link: string;
  onLinkChange: (link: string) => void;
  /** Story + audio guide fields, shown only when inspectable. */
  children?: React.ReactNode;
}) {
  const setFact = (i: number, patch: Partial<InspectFact>) =>
    onFactsChange(facts.map((f, k) => (k === i ? { ...f, ...patch } : f)));
  const used = new Set(facts.map((f) => f.label.trim().toLowerCase()));
  const linkBad = link.trim() !== "" && !safeLink(link.trim());

  return (
    <div className="flex flex-col gap-3 rounded-[2px] border border-hairline bg-paper/60 p-2.5">
      <label className="flex cursor-pointer items-start justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-xs font-semibold text-graphite">Inspectable</span>
          <span className="text-[10px] leading-snug text-pencil">
            Visitors can click it to open its details. Leave off for decor.
          </span>
        </span>
        <span className="relative mt-0.5 inline-flex shrink-0">
          <input
            id={`${idPrefix}-inspectable`}
            type="checkbox"
            role="switch"
            aria-checked={inspectable}
            checked={inspectable}
            onChange={(e) => onInspectableChange(e.target.checked)}
            className="peer sr-only"
          />
          <span className="h-5 w-9 rounded-full bg-hairline transition-colors duration-[var(--duration-normal)] peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50" />
          <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-paper shadow transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out-default)] peer-checked:translate-x-4" />
        </span>
      </label>

      {inspectable ? (
        <>
          {children}

          <div className="flex flex-col gap-1.5">
            <Label>Details</Label>
            {facts.map((f, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-1.5">
                <Input
                  aria-label={`Detail ${i + 1} label`}
                  value={f.label}
                  maxLength={40}
                  placeholder="Label"
                  onChange={(e) => setFact(i, { label: e.target.value })}
                  className="text-xs"
                />
                <Input
                  aria-label={`Detail ${i + 1} value`}
                  value={f.value}
                  maxLength={160}
                  placeholder="Value"
                  onChange={(e) => setFact(i, { value: e.target.value })}
                  className="text-xs"
                />
                <button
                  type="button"
                  aria-label={`Remove detail ${f.label || i + 1}`}
                  onClick={() => onFactsChange(facts.filter((_, k) => k !== i))}
                  className="flex h-6 w-6 items-center justify-center rounded text-pencil hover:bg-plaster hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
            {facts.length < MAX_FACTS ? (
              <div className="flex flex-wrap items-center gap-1">
                {FACT_PRESETS.filter((p) => !used.has(p.toLowerCase())).map((p) => (
                  <button
                    key={p}
                    type="button"
                    data-testid={`${idPrefix}-fact-${p.toLowerCase()}`}
                    onClick={() => onFactsChange([...facts, { label: p, value: "" }])}
                    className="rounded-full border border-hairline bg-paper px-2 py-0.5 text-[10px] text-pencil transition-colors hover:border-accent hover:text-accent"
                  >
                    + {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onFactsChange([...facts, { label: "", value: "" }])}
                  className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-hairline px-2 py-0.5 text-[10px] text-pencil transition-colors hover:border-accent hover:text-accent"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" /> Custom
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-link`}>Learn more link (optional)</Label>
            <Input
              id={`${idPrefix}-link`}
              type="url"
              value={link}
              maxLength={500}
              placeholder="https://…"
              onChange={(e) => onLinkChange(e.target.value)}
              className="text-xs"
            />
            {linkBad ? <p className="text-[10px] text-danger">Use a full https:// link.</p> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Values to store: complete rows only, and a link only if it's https. */
export function cleanInspectDetails(facts: InspectFact[], link: string): { facts?: InspectFact[]; link?: string } {
  const rows = facts
    .map((f) => ({ label: f.label.trim(), value: f.value.trim() }))
    .filter((f) => f.label && f.value);
  const l = safeLink(link.trim()) ?? undefined;
  return { facts: rows.length ? rows : undefined, link: l };
}

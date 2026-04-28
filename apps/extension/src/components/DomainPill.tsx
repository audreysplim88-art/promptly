import React, { useState } from "react"
import { DOMAIN_COLORS, DOMAIN_LABELS } from "../lib/constants"
import type { Domain } from "@promptcraft/shared"

interface DomainPillProps {
  domain: Domain
  confidence: number
  onOverride: (d: Domain) => void
}

const ALL_DOMAINS: Domain[] = ["general", "creative", "technical", "professional"]

export function DomainPill({ domain, confidence, onOverride }: DomainPillProps) {
  const [open, setOpen] = useState(confidence < 0.75)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${DOMAIN_COLORS[domain]}`}>
        {DOMAIN_LABELS[domain]}
      </span>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600">
        {confidence < 0.75 ? "Is this right?" : "Change"}
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 w-full">
          {ALL_DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => { onOverride(d); setOpen(false) }}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${
                d === domain ? "opacity-100" : "opacity-50 hover:opacity-100"
              } ${DOMAIN_COLORS[d]}`}>
              {DOMAIN_LABELS[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

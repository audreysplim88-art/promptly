import React, { useState } from "react"
import { DOMAIN_COLORS, DOMAIN_LABELS } from "../../lib/constants"
import type { Domain } from "@promptcraft/shared"

const DOMAINS: Domain[] = ["general", "creative", "technical", "professional"]

interface DomainBadgeProps {
  domain: Domain
  confidence: number
  onOverride: (domain: Domain) => void
}

export function DomainBadge({ domain, confidence, onOverride }: DomainBadgeProps) {
  const [showPicker, setShowPicker] = useState(confidence < 0.75)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${DOMAIN_COLORS[domain]}`}>
        {DOMAIN_LABELS[domain]}
      </span>
      <button
        className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
        onClick={() => setShowPicker((v) => !v)}>
        {confidence < 0.75 ? "Is this right?" : "Change"}
      </button>

      {showPicker && (
        <div className="flex flex-wrap gap-1.5 w-full mt-1">
          {DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => {
                onOverride(d)
                setShowPicker(false)
              }}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${
                d === domain ? "opacity-100" : "opacity-60 hover:opacity-100"
              } ${DOMAIN_COLORS[d]}`}>
              {DOMAIN_LABELS[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

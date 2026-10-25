"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type Option = { id: number; label: string; hint?: string };

/** Searchable dropdown (Select2-style) with Urdu-friendly filtering and auto-focused search box. */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Search and select...",
  disabled,
}: {
  options: Option[];
  value: number | null;
  onChange: (id: number, label: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || String(o.id) === q);
  }, [options, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      // auto-focus the search box when the dropdown opens
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="input"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: selected ? "var(--ink)" : "var(--muted)" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} style={{ color: "var(--muted)" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: 3,
            boxShadow: "0 12px 26px rgba(15,23,42,.16)",
            maxHeight: 320,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", borderBottom: "1px solid var(--rule)" }}>
            <Search size={14} style={{ color: "var(--muted)" }} />
            <input
              ref={searchRef}
              className="input"
              style={{ border: "none", padding: "3px 0", boxShadow: "none" }}
              placeholder="Type to search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered[0]) {
                  e.preventDefault();
                  onChange(filtered[0].id, filtered[0].label);
                  setOpen(false);
                }
                if (e.key === "Escape") setOpen(false);
              }}
            />
          </div>
          <div style={{ overflowY: "auto" }}>
            {filtered.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => {
                  onChange(o.id, o.label);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 11px",
                  fontSize: 12.8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: o.id === value ? "var(--accent-tint)" : "transparent",
                  borderBottom: "1px solid var(--rule)",
                  cursor: "pointer",
                }}
              >
                <span style={{ flex: 1 }}>{o.label}</span>
                {o.hint && <span className="micro">{o.hint}</span>}
                {o.id === value && <Check size={13} style={{ color: "var(--accent-dark)" }} />}
              </button>
            ))}
            {!filtered.length && (
              <div style={{ padding: "12px 11px", color: "var(--muted)", fontSize: 12.5 }}>No matches.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

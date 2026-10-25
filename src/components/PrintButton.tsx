"use client";

import { Printer } from "lucide-react";

/** Client-only print trigger (server components cannot carry event handlers). */
export function PrintButton({ label = "Print", disabled = false }: { label?: string; disabled?: boolean }) {
  return (
    <button className="btn btn-primary no-print" onClick={() => window.print()} disabled={disabled}>
      <Printer size={15} /> {label}
    </button>
  );
}

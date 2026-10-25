"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { SearchSelect, Option } from "./SearchSelect";

export function StorePicker({ stores, action = "/print/store" }: { stores: Option[]; action?: string }) {
  const router = useRouter();
  const [storeId, setStoreId] = useState<number | null>(null);

  return (
    <div className="flex gap-3 flex-wrap items-end">
      <div style={{ minWidth: 280, flex: "1 1 280px" }}>
        <label className="field-label">Store / Account</label>
        <SearchSelect options={stores} value={storeId} onChange={(id) => setStoreId(id)} placeholder="Search store..." />
      </div>
      <button
        className="btn btn-primary"
        disabled={!storeId}
        onClick={() => router.push(`${action}/${storeId}`)}
      >
        <FileText size={15} /> Generate Printable Ledger
      </button>
    </div>
  );
}

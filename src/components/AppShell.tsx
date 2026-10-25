"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Gauge,
  Store as StoreIcon,
  Truck,
  ReceiptText,
  Wallet,
  Printer,
  Settings as SettingsIcon,
  KeyRound,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ShopMark } from "./ShopMark";

type Leaf = { href: string; label: string };
type Group = { label: string; icon: React.ReactNode; href?: string; children?: Leaf[] };

const NAV: Group[] = [
  { label: "Dashboard", href: "/", icon: <Gauge size={16} /> },
  { label: "Stores", href: "/stores", icon: <StoreIcon size={16} /> },
  {
    label: "Purchase",
    icon: <Truck size={16} />,
    children: [
      { href: "/purchases/new", label: "Add Purchase" },
      { href: "/purchases", label: "Manage Purchase" },
    ],
  },
  {
    label: "Invoices",
    icon: <ReceiptText size={16} />,
    children: [
      { href: "/invoices/new", label: "Create New Bill" },
      { href: "/invoices", label: "Manage Invoices" },
    ],
  },
  {
    label: "Payments",
    icon: <Wallet size={16} />,
    children: [
      { href: "/ledger/new", label: "Add Transaction" },
      { href: "/ledger", label: "Manage History" },
    ],
  },
  {
    label: "Print Session",
    icon: <Printer size={16} />,
    children: [
      { href: "/print/store", label: "Store Transaction" },
      { href: "/print/balance-sheet", label: "Balance Sheet" },
      { href: "/print/payment", label: "Generate Payment" },
    ],
  },
  { label: "Settings", href: "/settings", icon: <SettingsIcon size={16} /> },
  { label: "Change Password", href: "/account/password", icon: <KeyRound size={16} /> },
];

export function AppShell({
  children,
  username,
}: {
  children: React.ReactNode;
  username: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(() =>
    NAV.filter((g) => g.children?.some((c) => pathname.startsWith(c.href))).map((g) => g.label),
  );

  const toggle = (label: string) =>
    setExpanded((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));

  async function logout() {
    await fetch("/api/logout", { method: "POST", headers: { "x-csrf-token": getCsrf() } });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="shell">
      {open && <div className="sidebar-scrim no-print" onClick={() => setOpen(false)} />}
      <aside className={`sidebar no-print ${open ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="flex items-center gap-3">
            <ShopMark size={36} />
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em" }}>
                HAMDAN
              </div>
              <div className="micro" style={{ color: "#94a3b8" }}>
                Commission Shop
              </div>
            </div>
            <button
              className="ml-auto lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              style={{ color: "#cbd5e1" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="py-2 flex-1">
          {NAV.map((g) => {
            const activeSelf = g.href && (pathname === g.href || (g.href !== "/" && pathname.startsWith(g.href)));
            if (!g.children) {
              return (
                <Link
                  key={g.label}
                  href={g.href!}
                  className={`nav-item ${activeSelf ? "active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {g.icon}
                  <span>{g.label}</span>
                </Link>
              );
            }
            const isOpen = expanded.includes(g.label);
            const childActive = g.children.some((c) => pathname.startsWith(c.href));
            return (
              <div key={g.label}>
                <button className={`nav-item ${childActive ? "active" : ""}`} onClick={() => toggle(g.label)}>
                  {g.icon}
                  <span className="flex-1">{g.label}</span>
                  <ChevronDown
                    size={15}
                    style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 140ms ease-out" }}
                  />
                </button>
                {isOpen && (
                  <div>
                    {g.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={`nav-item nav-sub ${pathname === c.href ? "active" : ""}`}
                        onClick={() => setOpen(false)}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <button className="nav-item" onClick={logout} style={{ marginTop: 6 }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </nav>

        <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div className="micro" style={{ color: "#64748b" }}>
            Signed in
          </div>
          <div style={{ color: "#e2e8f0", fontSize: 12.5, fontWeight: 600 }}>{username}</div>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <div
          className="no-print"
          style={{
            background: "#fff",
            borderBottom: "1px solid var(--paper-edge)",
            padding: "12px 22px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            className="btn btn-ghost"
            style={{ padding: "6px 9px" }}
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={17} />
          </button>
          <div>
            <div className="micro">Hamdan Commission Shop · Arifwala</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
              Grain market commission portal · PKR
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn btn-ghost" onClick={() => window.print()}>
              <Printer size={15} /> Print
            </button>
          </div>
        </div>
        <div style={{ padding: "22px" }}>{children}</div>
      </main>
    </div>
  );
}

export function getCsrf(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)hcs_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Users,
  Settings,
  BookOpen,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/api-docs", label: "API Docs", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#1E3A5F] text-white shadow-xl z-10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2563EB] shadow-md">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight">Boarding AI</span>
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-medium">Backoffice</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[11px] text-white/40 leading-relaxed">
          Boarding AI Backoffice
          <br />
          <span className="text-white/25">v1.0 · For internal use only</span>
        </p>
      </div>
    </aside>
  );
}

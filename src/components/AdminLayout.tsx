'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  LayoutDashboard, MapPin, Users,
  Sparkles, PhoneCall, ListCollapse, Settings, ArrowLeft, Layers
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Cities & Localities", href: "/admin/cities", icon: MapPin },
    { name: "Users Management", href: "/admin/users", icon: Users },
    { name: "Vibe Upgrade Requests", href: "/admin/vibe-requests", icon: Sparkles },
    { name: "Call Networking", href: "/admin/call-logs", icon: PhoneCall },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: ListCollapse },
    { name: "Feature Management", href: "/admin/features", icon: Layers },
    { name: "System Config", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-gray-100/60 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col flex-shrink-0">
        {/* Title */}
        <div className="p-5 border-b border-slate-850 flex items-center justify-between">
          <div>
            <h1 className="text-white text-lg font-bold tracking-tight">FlatNFlatmates Backoffice</h1>
            <span className="text-[10px] text-brand-primary/60 font-semibold uppercase tracking-wider">Console v1.0</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${Active
                  ? "bg-brand-primary text-white shadow-sm"
                  : "hover:bg-slate-800 hover:text-white"
                  }`}>
                  <Icon className={`h-4.5 w-4.5 ${Active ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-850">
          <Link href="/">
            <div className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Exit Console</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pune Ops Control</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-2 w-2 rounded-full bg-status-successBg/150 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-600">Database connected</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

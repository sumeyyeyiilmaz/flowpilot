"use client";

import { useEffect, useState } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/layout/brand";
import { DemoStorageNotice } from "@/components/layout/demo-storage-notice";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const close = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Masaüstü kenar çubuğu */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <SidebarNav />
        </div>
        <div className="p-3">
          <SidebarFooter />
        </div>
      </aside>

      {/* Mobil kenar çubuğu */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        id="mobile-sidebar"
        aria-label="Mobil menü"
        inert={!mobileOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Brand />
          <Button variant="ghost" size="icon" onClick={close} aria-label="Menüyü kapat">
            <X />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <SidebarNav onNavigate={close} />
        </div>
        <div className="p-3">
          <SidebarFooter />
        </div>
      </aside>

      {/* İçerik */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Menüyü aç"
            aria-expanded={mobileOpen}
            aria-controls="mobile-sidebar"
          >
            <Menu />
          </Button>

          <div className="lg:hidden">
            <Brand />
          </div>

          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Proje, gereksinim veya hata ara…"
              aria-label="Ara"
              className="h-9 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">
              Demo verisi
            </Badge>
            <Button variant="ghost" size="icon" aria-label="Bildirimler" className="relative">
              <Bell />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <DemoStorageNotice />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

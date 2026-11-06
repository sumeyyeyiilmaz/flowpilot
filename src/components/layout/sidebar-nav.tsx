"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActivePath, mainNav } from "@/lib/navigation";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Ana menü" className="flex flex-col gap-1">
      <p className="px-3 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        Menü
      </p>
      {mainNav.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
              )}
              aria-hidden="true"
            />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

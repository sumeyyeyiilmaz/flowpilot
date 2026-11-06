export function SidebarFooter() {
  return (
    <div className="rounded-xl border border-sidebar-border bg-background p-3">
      <div className="flex items-center gap-3">
        <span
          className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          aria-hidden="true"
        >
          DK
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">Demo Kullanıcı</p>
          <p className="truncate text-xs text-muted-foreground">Kalite Yöneticisi</p>
        </div>
      </div>
    </div>
  );
}

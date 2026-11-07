import {
  Bug,
  FlaskConical,
  FolderKanban,
  Inbox,
  Kanban,
  LayoutDashboard,
  ListChecks,
  Network,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const mainNav: NavItem[] = [
  {
    title: "Genel Bakış",
    href: "/",
    icon: LayoutDashboard,
    description: "Portföyün anlık durumu ve son aktiviteler.",
  },
  {
    title: "Projeler",
    href: "/projeler",
    icon: FolderKanban,
    description: "Projeleri, ekipleri ve teslim tarihlerini yönetin.",
  },
  {
    title: "Talepler",
    href: "/talepler",
    icon: Inbox,
    description: "Yeni iş taleplerini ve mevcut sistem değişikliklerini yönetin.",
  },
  {
    title: "Sprintler",
    href: "/sprintler",
    icon: Kanban,
    description: "Product Backlog ve sprint planlama.",
  },
  {
    title: "Gereksinimler",
    href: "/gereksinimler",
    icon: ListChecks,
    description: "Gereksinimleri tanımlayın, önceliklendirin ve onaylayın.",
  },
  {
    title: "Test Yönetimi",
    href: "/test-yonetimi",
    icon: FlaskConical,
    description: "Test senaryolarını planlayın ve koşum sonuçlarını izleyin.",
  },
  {
    title: "Hata Yönetimi",
    href: "/hata-yonetimi",
    icon: Bug,
    description: "Hataları kaydedin, atayın ve çözüm sürecini takip edin.",
  },
  {
    title: "İzlenebilirlik",
    href: "/izlenebilirlik",
    icon: Network,
    description: "Gereksinim, test ve hata arasındaki bağlantıları görün.",
  },
];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

import Link from "next/link";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { mainNav } from "@/lib/navigation";

/** Henüz geliştirilmemiş modüller için ortak yer tutucu sayfa. */
export function ModulePlaceholder({ href }: { href: string }) {
  const item = mainNav.find((nav) => nav.href === href);
  if (!item) return null;
  const Icon = item.icon;

  return (
    <>
      <PageHeader title={item.title} description={item.description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="inline-flex items-center justify-center gap-1.5 font-medium">
              <Construction className="size-4 text-muted-foreground" aria-hidden="true" />
              Bu modül geliştirme aşamasında
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {item.title} ekranı demonun sonraki adımlarında eklenecek.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Genel bakışa dön</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

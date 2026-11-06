import { NextResponse, type NextRequest } from "next/server";
import { createSeedState } from "@/lib/demo/seed";

/**
 * Bilinmeyen proje kimliklerinde gerçek HTTP 404 döndürür.
 *
 * Partial Prefetching açıkken dinamik proje sayfası uygulama kabuğunu önceden gönderir;
 * sayfa içindeki notFound() çalıştığında durum kodu artık 200 olarak kalır (soft 404).
 * Proxy, sayfa çizilmeden önce çalıştığı için durum kodunu belirleyebilir.
 *
 * Demoda proje oluşturma yoktur; geçerli kimlikler sentetik başlangıç verisinden gelir.
 */
const KNOWN_PROJECT_IDS = new Set(createSeedState().projects.map((project) => project.id));

/** Hiçbir rotayla eşleşmeyen iç adres: Next.js burada standart 404 sayfasını üretir. */
const NOT_FOUND_PATH = "/__flowpilot-bulunamadi";

export function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean); // ["projeler", "<id>"]
  const projectId = decodeURIComponent(segments[1] ?? "");

  if (!KNOWN_PROJECT_IDS.has(projectId)) {
    // Adres çubuğundaki URL değişmez; içerik 404 sayfası olur.
    return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url), { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  // Yalnızca proje detay adresleri; diğer sayfalar, statik dosyalar ve varlıklar etkilenmez.
  matcher: "/projeler/:projeId",
};

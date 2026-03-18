"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const PAGE_NAMES: Record<string, string> = {
  "/": "Dashboard",
  "/horario": "Mi Horario",
  "/examenes": "Examenes",
  "/armar-horario": "Armar Horario",
  "/cargar-horario": "Cargar Horario",
  "/upload": "Subir Excel",
};

export function TopbarBreadcrumb() {
  const pathname = usePathname();
  const pageName = PAGE_NAMES[pathname] || "Pagina";
  const isHome = pathname === "/";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {!isHome && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">PoliFlow</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>{pageName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

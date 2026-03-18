"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  FileSpreadsheet,
  BookOpen,
  PlusCircle,
  Upload,
  LogOut,
  GraduationCap,
  User,
} from "lucide-react";

const mainNav = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Mi Horario", href: "/horario", icon: Calendar },
  { title: "Examenes", href: "/examenes", icon: FileSpreadsheet },
];

const toolsNav = [
  { title: "Armar Horario", href: "/armar-horario", icon: BookOpen },
  { title: "Cargar Horario", href: "/cargar-horario", icon: PlusCircle },
  { title: "Subir Excel", href: "/upload", icon: Upload },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || "Estudiante";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      {/* Header / Branding */}
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight">PoliFlow</span>
            <span className="text-[10px] text-sidebar-foreground/60">FPUNA - Gestion Academica</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Herramientas */}
        <SidebarGroup>
          <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer / User */}
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={userName} className="h-auto py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[10px] font-bold text-sidebar-accent-foreground">
                {initials}
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-medium">{userName}</span>
                <span className="text-[10px] text-sidebar-foreground/50">Estudiante</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut({ callbackUrl: "/login" })} tooltip="Cerrar Sesion">
              <LogOut />
              <span>Cerrar Sesion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

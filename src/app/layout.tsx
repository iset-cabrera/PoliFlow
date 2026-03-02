import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UniGestor - Gestion Academica FPUNA",
  description:
    "Sistema de gestion academica para estudiantes de la Facultad Politecnica",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAuthPage = false; // Handled by conditional rendering below

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {session ? (
            <>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-14 items-center gap-2 border-b px-6">
                  <SidebarTrigger />
                  <Separator orientation="vertical" className="h-6" />
                  <span className="text-sm text-muted-foreground">
                    Bienvenido, {session.user?.name}
                  </span>
                </header>
                <main className="flex-1 p-6">{children}</main>
              </SidebarInset>
            </>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}

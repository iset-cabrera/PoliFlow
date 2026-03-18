"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      documento,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Numero de documento o contrasena incorrectos");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      {/* Logo mobile */}
      <div className="flex flex-col items-center gap-2 lg:hidden">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold">PoliFlow</h1>
        <p className="text-xs text-muted-foreground">Gestion Academica — FPUNA</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Iniciar sesion</h2>
        <p className="text-sm text-muted-foreground">
          Ingresa con tu numero de documento
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="documento">Numero de Documento</Label>
          <Input
            id="documento"
            type="text"
            placeholder="Ej: 12345678"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contrasena</Label>
          <Input
            id="password"
            type="password"
            placeholder="Tu contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Ingresando..." : "Iniciar Sesion"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        No tenes cuenta?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, documento, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Error al registrar");
    } else {
      router.push("/login");
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
        <h2 className="text-2xl font-bold">Crear cuenta</h2>
        <p className="text-sm text-muted-foreground">
          Registrate para organizar tu semestre
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" type="text" placeholder="Juan Perez" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="documento">Numero de Documento</Label>
          <Input id="documento" type="text" placeholder="Ej: 12345678" value={documento} onChange={(e) => setDocumento(e.target.value)} required className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contrasena</Label>
          <Input id="password" type="password" placeholder="Minimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11" />
        </div>

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Creando cuenta..." : "Registrarse"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ya tenes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}

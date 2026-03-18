"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, User, MapPin, Clock } from "lucide-react";
import { GrillaHoraria, COLORES, type EventoGrilla } from "@/components/grilla-horaria";

interface HorarioEntry { dia: string; horaInicio: string; horaFin: string; aula: string; }
interface MateriaDetalle { nombre: string; semestre: number | null; seccion: string; turno: string; profesor: string; profesorEmail: string; plataforma: string; horarios: HorarioEntry[]; }
interface HorarioData { periodo: string; carrera: string; materias: MateriaDetalle[]; }

export default function HorarioPage() {
  const [data, setData] = useState<HorarioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mi-horario/detalle")
      .then((r) => r.json())
      .then((d) => { if (d.materias) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const eventos: EventoGrilla[] = useMemo(() => {
    if (!data) return [];
    return data.materias.flatMap((m, idx) =>
      m.horarios.map((h) => ({
        dia: h.dia,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        nombre: m.nombre,
        seccion: m.seccion,
        aula: h.aula,
        colorIdx: idx,
      }))
    );
  }, [data]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mi Horario Semanal</h1>
          <p className="text-muted-foreground">Vista de calendario con tus materias seleccionadas</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-4">Todavia no tenes un horario armado.</p>
            <Button asChild><Link href="/armar-horario"><BookOpen className="mr-2 h-4 w-4" /> Armar mi horario</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mi Horario Semanal</h1>
          <p className="text-muted-foreground">{data.carrera} — {data.periodo}</p>
        </div>
        <Button variant="outline" size="sm" asChild><Link href="/armar-horario">Modificar</Link></Button>
      </div>

      <GrillaHoraria eventos={eventos} />

      {/* Detalle de materias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detalle de materias ({data.materias.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.materias.map((m, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm truncate">{m.nombre}</div>
                  <Badge variant="outline" className={`${COLORES[i % COLORES.length]} border text-[10px] shrink-0`}>
                    {m.seccion}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {m.profesor || "Sin asignar"}</span>
                  {m.horarios.map((h, j) => (
                    <span key={j} className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {h.dia.slice(0, 3)} {h.horaInicio}-{h.horaFin}
                      {h.aula && (<><MapPin className="ml-1 h-3 w-3" />{h.aula}</>)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  BookOpen,
  MapPin,
  Clock,
  Users,
  CalendarDays,
} from "lucide-react";

interface ExamenEntry {
  tipo: string;
  fecha: string | null;
  hora: string | null;
  aula: string | null;
  presidenteMesa?: string | null;
  miembro1?: string | null;
  miembro2?: string | null;
}

interface RevisionEntry {
  tipo: string;
  fecha: string | null;
  hora: string | null;
}

interface MateriaDetalle {
  nombre: string;
  semestre: number | null;
  seccion: string;
  turno: string;
  examenes: ExamenEntry[];
  revisiones: RevisionEntry[];
}

interface HorarioData {
  periodo: string;
  carrera: string;
  materias: MateriaDetalle[];
}

const TIPO_LABELS: Record<string, string> = {
  PARCIAL_1: "1er Parcial",
  PARCIAL_2: "2do Parcial",
  FINAL_1: "1er Final",
  FINAL_2: "2do Final",
  REVISION_FINAL_1: "Revision 1er Final",
  REVISION_FINAL_2: "Revision 2do Final",
};

const TIPO_COLORS: Record<string, string> = {
  PARCIAL_1: "bg-blue-50 border-blue-200 text-blue-800",
  PARCIAL_2: "bg-blue-50 border-blue-200 text-blue-800",
  FINAL_1: "bg-red-50 border-red-200 text-red-800",
  FINAL_2: "bg-red-50 border-red-200 text-red-800",
  REVISION_FINAL_1: "bg-amber-50 border-amber-200 text-amber-800",
  REVISION_FINAL_2: "bg-amber-50 border-amber-200 text-amber-800",
};

function parseFecha(str: string): Date | null {
  const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;
  let anho = parseInt(match[3]);
  if (anho < 100) anho += 2000;
  return new Date(anho, parseInt(match[2]) - 1, parseInt(match[1]));
}

export default function ExamenesPage() {
  const [data, setData] = useState<HorarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<"cronologico" | "materia">("cronologico");

  useEffect(() => {
    fetch("/api/mi-horario/detalle")
      .then((r) => r.json())
      .then((d) => { if (d.materias) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Vista cronologica
  const examenesOrdenados = useMemo(() => {
    if (!data) return [];
    const todos: {
      nombre: string;
      seccion: string;
      tipo: string;
      fecha: string;
      fechaParsed: Date | null;
      hora: string | null;
      aula: string | null;
      presidenteMesa?: string | null;
      miembro1?: string | null;
      miembro2?: string | null;
      esRevision: boolean;
    }[] = [];

    for (const m of data.materias) {
      for (const ex of m.examenes) {
        if (ex.fecha) {
          todos.push({
            nombre: m.nombre, seccion: m.seccion, tipo: ex.tipo,
            fecha: ex.fecha, fechaParsed: parseFecha(ex.fecha),
            hora: ex.hora, aula: ex.aula,
            presidenteMesa: ex.presidenteMesa, miembro1: ex.miembro1, miembro2: ex.miembro2,
            esRevision: false,
          });
        }
      }
      for (const rev of m.revisiones) {
        if (rev.fecha) {
          todos.push({
            nombre: m.nombre, seccion: m.seccion, tipo: rev.tipo,
            fecha: rev.fecha, fechaParsed: parseFecha(rev.fecha),
            hora: rev.hora, aula: null, esRevision: true,
          });
        }
      }
    }

    return todos.sort((a, b) => {
      if (!a.fechaParsed && !b.fechaParsed) return 0;
      if (!a.fechaParsed) return 1;
      if (!b.fechaParsed) return -1;
      return a.fechaParsed.getTime() - b.fechaParsed.getTime();
    });
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Examenes</h1>
          <p className="text-muted-foreground">Fechas de parciales, finales y revisiones</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <FileSpreadsheet className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-4">Todavia no tenes un horario armado.</p>
            <Button asChild>
              <Link href="/armar-horario">
                <BookOpen className="mr-2 h-4 w-4" /> Armar mi horario
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Examenes</h1>
          <p className="text-muted-foreground">{data.carrera} — {data.periodo}</p>
        </div>
        <div className="flex gap-1">
          <Button
            variant={vista === "cronologico" ? "default" : "outline"}
            size="sm"
            onClick={() => setVista("cronologico")}
          >
            <CalendarDays className="mr-1 h-4 w-4" /> Cronologico
          </Button>
          <Button
            variant={vista === "materia" ? "default" : "outline"}
            size="sm"
            onClick={() => setVista("materia")}
          >
            <BookOpen className="mr-1 h-4 w-4" /> Por materia
          </Button>
        </div>
      </div>

      {vista === "cronologico" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Todos los examenes ({examenesOrdenados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examenesOrdenados.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay examenes con fecha asignada.</p>
            ) : (
              <div className="space-y-2">
                {examenesOrdenados.map((ex, i) => {
                  const hoy = new Date();
                  const isPast = ex.fechaParsed && ex.fechaParsed.getTime() < hoy.getTime() - 86400000;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 ${isPast ? "opacity-50" : ""} ${TIPO_COLORS[ex.tipo] || ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">{ex.nombre}</div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {TIPO_LABELS[ex.tipo] || ex.tipo}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {ex.fecha}
                        </span>
                        {ex.hora && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {ex.hora}
                          </span>
                        )}
                        {ex.aula && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {ex.aula}
                          </span>
                        )}
                        <span className="opacity-75">Sec. {ex.seccion}</span>
                      </div>
                      {!ex.esRevision && (ex.presidenteMesa || ex.miembro1) && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] opacity-60">
                          <Users className="h-3 w-3" />
                          Mesa: {[ex.presidenteMesa, ex.miembro1, ex.miembro2].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {vista === "materia" && (
        <div className="space-y-4">
          {data.materias.map((m, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{m.nombre}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {m.seccion} ({m.turno})
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {m.examenes.length === 0 && m.revisiones.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin examenes asignados</p>
                ) : (
                  <div className="space-y-2">
                    {m.examenes.map((ex, j) => (
                      <div key={`ex-${j}`} className={`rounded border p-2 text-xs ${TIPO_COLORS[ex.tipo] || ""}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{TIPO_LABELS[ex.tipo] || ex.tipo}</span>
                          {ex.fecha && <span>{ex.fecha}</span>}
                        </div>
                        {(ex.hora || ex.aula) && (
                          <div className="mt-1 flex gap-3 opacity-75">
                            {ex.hora && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ex.hora}</span>}
                            {ex.aula && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ex.aula}</span>}
                          </div>
                        )}
                        {(ex.presidenteMesa || ex.miembro1) && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] opacity-60">
                            <Users className="h-3 w-3" />
                            Mesa: {[ex.presidenteMesa, ex.miembro1, ex.miembro2].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                    {m.revisiones.map((rev, j) => (
                      <div key={`rev-${j}`} className={`rounded border p-2 text-xs ${TIPO_COLORS[rev.tipo] || ""}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{TIPO_LABELS[rev.tipo] || rev.tipo}</span>
                          {rev.fecha && <span>{rev.fecha}</span>}
                        </div>
                        {rev.hora && (
                          <div className="mt-1 opacity-75">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{rev.hora}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

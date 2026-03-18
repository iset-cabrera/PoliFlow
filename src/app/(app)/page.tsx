"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileSpreadsheet,
  BookOpen,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface HorarioEntry { dia: string; horaInicio: string; horaFin: string; aula: string; }
interface ExamenEntry { tipo: string; fecha: string | null; hora: string | null; aula: string | null; }
interface MateriaDetalle { nombre: string; semestre: number | null; seccion: string; turno: string; profesor: string; horarios: HorarioEntry[]; examenes: ExamenEntry[]; }
interface HorarioDetalle { periodo: string; carrera: string; materias: MateriaDetalle[]; }

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
function getDiaHoy(): string { return DIAS_SEMANA[new Date().getDay()]; }
function horaToMin(h: string): number { const [hh, mm] = h.split(":").map(Number); return hh * 60 + (mm || 0); }

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<HorarioDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mi-horario/detalle")
      .then((r) => r.json())
      .then((d) => { if (d.materias) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const diaHoy = getDiaHoy();
  const userName = session?.user?.name?.split(" ")[0] || "Estudiante";

  const clasesHoy = useMemo(() => {
    if (!data) return [];
    return data.materias
      .flatMap((m) => m.horarios.filter((h) => h.dia === diaHoy).map((h) => ({ ...h, nombre: m.nombre, seccion: m.seccion, profesor: m.profesor })))
      .sort((a, b) => horaToMin(a.horaInicio) - horaToMin(b.horaInicio));
  }, [data, diaHoy]);

  const proximoExamen = useMemo(() => {
    if (!data) return null;
    const hoy = new Date();
    let closest: { nombre: string; tipo: string; fecha: string; hora: string | null; aula: string | null; diff: number; diasFaltan: number } | null = null;
    for (const m of data.materias) {
      for (const ex of m.examenes) {
        if (!ex.fecha) continue;
        const match = ex.fecha.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (!match) continue;
        let anho = parseInt(match[3]); if (anho < 100) anho += 2000;
        const fechaExamen = new Date(anho, parseInt(match[2]) - 1, parseInt(match[1]));
        const diff = fechaExamen.getTime() - hoy.getTime();
        if (diff >= -86400000 && (!closest || diff < closest.diff)) {
          const tipoLabel = ex.tipo.replace("_", " ").replace("PARCIAL ", "Parcial ").replace("FINAL ", "Final ");
          closest = { nombre: m.nombre, tipo: tipoLabel, fecha: ex.fecha, hora: ex.hora, aula: ex.aula, diff, diasFaltan: Math.ceil(diff / 86400000) };
        }
      }
    }
    return closest;
  }, [data]);

  const totalHorasSemanales = useMemo(() => {
    if (!data) return 0;
    let mins = 0;
    for (const m of data.materias) for (const h of m.horarios) mins += horaToMin(h.horaFin) - horaToMin(h.horaInicio);
    return Math.round(mins / 60);
  }, [data]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  // Sin horario guardado
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 hidden sm:block"><Sparkles className="h-6 w-6 text-primary" /></div>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold">Hola, {userName}</h1>
              <p className="text-muted-foreground max-w-lg">Bienvenido a PoliFlow. Para empezar, arma tu horario del semestre seleccionando tus materias y secciones.</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild><Link href="/armar-horario"><BookOpen className="mr-2 h-4 w-4" /> Armar mi horario</Link></Button>
                <Button variant="outline" asChild><Link href="/upload"><FileSpreadsheet className="mr-2 h-4 w-4" /> Subir Excel</Link></Button>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: "1", title: "Arma tu horario", desc: "Selecciona carrera, materias y secciones", href: "/armar-horario" },
            { step: "2", title: "Revisa tu semana", desc: "Visualiza tu horario en formato calendario", href: "/horario" },
            { step: "3", title: "Controla examenes", desc: "Todas las fechas de parciales y finales", href: "/examenes" },
          ].map((item) => (
            <Link key={item.step} href={item.href}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{item.step}</div>
                    <div><div className="font-medium text-sm">{item.title}</div><div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div></div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Hola, {userName}</h1>
            <p className="text-sm text-muted-foreground">{data.carrera} — {data.periodo}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="self-start"><Link href="/armar-horario">Modificar horario</Link></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Materias", value: data.materias.length, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
          { label: "Clases hoy", value: clasesHoy.length, icon: Calendar, color: "bg-green-50 text-green-600" },
          { label: "Hs/semana", value: totalHorasSemanales, icon: Clock, color: "bg-purple-50 text-purple-600" },
          { label: "Prox. examen", value: proximoExamen ? `${proximoExamen.diasFaltan}d` : "—", icon: FileSpreadsheet, color: "bg-orange-50 text-orange-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two column */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Clases de hoy */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Hoy — {diaHoy}</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/horario" className="text-xs">Ver todo <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            {clasesHoy.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3"><Calendar className="h-5 w-5 text-muted-foreground" /></div>
                <p className="text-sm text-muted-foreground">No tenes clases hoy</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clasesHoy.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="text-center min-w-[50px]">
                      <div className="text-sm font-bold text-primary">{c.horaInicio}</div>
                      <div className="text-[10px] text-muted-foreground">{c.horaFin}</div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.nombre}</div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{c.seccion}</span>
                        {c.aula && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {c.aula}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proximo examen */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-primary" />Proximos examenes</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/examenes" className="text-xs">Ver todos <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            {!proximoExamen ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3"><FileSpreadsheet className="h-5 w-5 text-muted-foreground" /></div>
                <p className="text-sm text-muted-foreground">Sin examenes proximos</p>
              </div>
            ) : (
              <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{proximoExamen.nombre}</div>
                    <Badge variant="outline" className="mt-1 text-[10px] bg-white">{proximoExamen.tipo}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">{proximoExamen.diasFaltan}d</div>
                    <div className="text-[10px] text-muted-foreground">restantes</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{proximoExamen.fecha}</span>
                  {proximoExamen.hora && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{proximoExamen.hora}</span>}
                  {proximoExamen.aula && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{proximoExamen.aula}</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

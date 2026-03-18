"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  ChevronDown,
  ChevronRight,
  Save,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { GrillaHoraria, COLORES, type EventoGrilla } from "@/components/grilla-horaria";

// ============== TIPOS ==============

interface Horario {
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
}

interface ExamenInfo {
  tipo: string;
  fecha: string | null;
  hora: string | null;
  aula: string | null;
}

interface SeccionData {
  id: string;
  turno: string;
  seccion: string;
  plataforma: string;
  profesor: string;
  profesorEmail: string;
  horarios: Horario[];
  examenes: ExamenInfo[];
}

interface MateriaData {
  id: string;
  asignaturaCarreraId: string;
  nombre: string;
  nivel: number | null;
  semestre: number | null;
  departamento: string;
  plan: string | null;
  soloFinal: boolean;
  practicaLab: boolean;
  enfasis: string;
  secciones: SeccionData[];
}

interface CarreraOption {
  id: string;
  codigo: string;
  nombre: string;
  sede: string;
}

interface Conflicto {
  materia1: string;
  seccion1: string;
  materia2: string;
  seccion2: string;
  dia: string;
  rango: string;
}

// ============== HELPERS ==============


function horaToMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
}

function hayConflictoHorario(h1: Horario, h2: Horario): boolean {
  if (h1.dia !== h2.dia) return false;
  const inicio1 = horaToMinutos(h1.horaInicio);
  const fin1 = horaToMinutos(h1.horaFin || "23:59");
  const inicio2 = horaToMinutos(h2.horaInicio);
  const fin2 = horaToMinutos(h2.horaFin || "23:59");
  return inicio1 < fin2 && inicio2 < fin1;
}

// ============== COMPONENTE PRINCIPAL ==============

export default function ArmarHorarioPage() {
  const [carreras, setCarreras] = useState<CarreraOption[]>([]);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState("");
  const [materias, setMaterias] = useState<MateriaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodoNombre, setPeriodoNombre] = useState("");

  // Selecciones del usuario: materiaId -> seccionId
  const [selecciones, setSelecciones] = useState<Map<string, string>>(new Map());

  // Semestres expandidos en el panel de materias
  const [semestresExpandidos, setSemestresExpandidos] = useState<Set<number>>(new Set());

  // Estado de guardado
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedSelections, setSavedSelections] = useState<string>(""); // JSON para comparar

  // Cargar carreras y horario guardado al montar
  useEffect(() => {
    Promise.all([
      fetch("/api/carreras").then((r) => r.json()),
      fetch("/api/mi-horario").then((r) => r.json()),
    ])
      .then(([carrerasData, horarioData]) => {
        setCarreras(carrerasData);
        // Si hay horario guardado, pre-seleccionar la carrera
        if (horarioData.horario) {
          setCarreraSeleccionada(horarioData.horario.carreraCodigo);
        }
      })
      .catch(console.error);
  }, []);

  // Cargar materias cuando cambia la carrera y restaurar selecciones guardadas
  useEffect(() => {
    if (!carreraSeleccionada) {
      setMaterias([]);
      return;
    }
    setLoading(true);
    setSelecciones(new Map());
    setHasChanges(false);
    setSaved(false);

    Promise.all([
      fetch(`/api/materias?carrera=${carreraSeleccionada}`).then((r) => r.json()),
      fetch("/api/mi-horario").then((r) => r.json()),
    ])
      .then(([materiasData, horarioData]) => {
        const mats: MateriaData[] = materiasData.materias || [];
        setMaterias(mats);
        setPeriodoNombre(materiasData.periodo?.nombre || "");

        // Restaurar selecciones guardadas si la carrera coincide
        if (horarioData.horario && horarioData.horario.carreraCodigo === carreraSeleccionada) {
          const restored = new Map<string, string>();
          for (const item of horarioData.horario.items) {
            // Verificar que la materia y seccion existen en los datos actuales
            const materia = mats.find((m: MateriaData) => m.id === item.asignaturaId);
            if (materia) {
              const seccion = materia.secciones.find((s: SeccionData) => s.id === item.seccionId);
              if (seccion) {
                restored.set(item.asignaturaId, item.seccionId);
              }
            }
          }
          setSelecciones(restored);
          const snapshot = JSON.stringify([...restored.entries()].sort());
          setSavedSelections(snapshot);
          setSaved(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [carreraSeleccionada]);

  // Detectar cambios respecto al guardado
  useEffect(() => {
    const currentSnapshot = JSON.stringify([...selecciones.entries()].sort());
    setHasChanges(currentSnapshot !== savedSelections);
    if (currentSnapshot !== savedSelections) setSaved(false);
  }, [selecciones, savedSelections]);

  // Guardar horario
  const guardarHorario = useCallback(async () => {
    if (selecciones.size === 0 || !carreraSeleccionada) return;
    setSaving(true);
    try {
      const items = [...selecciones.entries()].map(([asignaturaId, seccionId]) => ({
        asignaturaId,
        seccionId,
      }));
      const res = await fetch("/api/mi-horario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carreraCodigo: carreraSeleccionada, selecciones: items }),
      });
      if (res.ok) {
        const snapshot = JSON.stringify([...selecciones.entries()].sort());
        setSavedSelections(snapshot);
        setSaved(true);
        setHasChanges(false);
      }
    } catch (err) {
      console.error("Error al guardar:", err);
    } finally {
      setSaving(false);
    }
  }, [selecciones, carreraSeleccionada]);

  // Agrupar materias por semestre
  const materiasPorSemestre = useMemo(() => {
    const map = new Map<number, MateriaData[]>();
    for (const m of materias) {
      const sem = m.semestre ?? 0;
      if (!map.has(sem)) map.set(sem, []);
      map.get(sem)!.push(m);
    }
    return new Map([...map.entries()].sort((a, b) => a[0] - b[0]));
  }, [materias]);

  // Toggle seccion
  const toggleSeccion = useCallback(
    (materiaId: string, seccionId: string) => {
      setSelecciones((prev) => {
        const next = new Map(prev);
        if (next.get(materiaId) === seccionId) {
          next.delete(materiaId);
        } else {
          next.set(materiaId, seccionId);
        }
        return next;
      });
    },
    []
  );

  // Quitar materia
  const quitarMateria = useCallback((materiaId: string) => {
    setSelecciones((prev) => {
      const next = new Map(prev);
      next.delete(materiaId);
      return next;
    });
  }, []);

  // Obtener secciones seleccionadas con su data
  const seccionesSeleccionadas = useMemo(() => {
    const result: { materia: MateriaData; seccion: SeccionData; colorIdx: number }[] = [];
    let idx = 0;
    for (const [materiaId, seccionId] of selecciones) {
      const materia = materias.find((m) => m.id === materiaId);
      if (!materia) continue;
      const seccion = materia.secciones.find((s) => s.id === seccionId);
      if (!seccion) continue;
      result.push({ materia, seccion, colorIdx: idx % COLORES.length });
      idx++;
    }
    return result;
  }, [selecciones, materias]);

  // Detectar conflictos
  const conflictos = useMemo(() => {
    const conflicts: Conflicto[] = [];
    for (let i = 0; i < seccionesSeleccionadas.length; i++) {
      for (let j = i + 1; j < seccionesSeleccionadas.length; j++) {
        const a = seccionesSeleccionadas[i];
        const b = seccionesSeleccionadas[j];
        for (const h1 of a.seccion.horarios) {
          for (const h2 of b.seccion.horarios) {
            if (hayConflictoHorario(h1, h2)) {
              conflicts.push({
                materia1: a.materia.nombre,
                seccion1: a.seccion.seccion,
                materia2: b.materia.nombre,
                seccion2: b.seccion.seccion,
                dia: h1.dia,
                rango: `${h1.horaInicio}-${h1.horaFin} / ${h2.horaInicio}-${h2.horaFin}`,
              });
            }
          }
        }
      }
    }
    return conflicts;
  }, [seccionesSeleccionadas]);

  // Convertir selecciones a EventoGrilla[] para el componente compartido
  const eventosGrilla = useMemo<EventoGrilla[]>(() => {
    const evts: EventoGrilla[] = [];
    for (const { materia, seccion, colorIdx } of seccionesSeleccionadas) {
      for (const h of seccion.horarios) {
        evts.push({
          nombre: materia.nombre,
          seccion: seccion.seccion,
          aula: h.aula,
          dia: h.dia,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          colorIdx,
        });
      }
    }
    return evts;
  }, [seccionesSeleccionadas]);

  // Toggle semestre expandido
  const toggleSemestre = useCallback((sem: number) => {
    setSemestresExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(sem)) next.delete(sem);
      else next.add(sem);
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Armar Horario</h1>
        <p className="text-muted-foreground">
          Selecciona tu carrera, elige materias y secciones, y visualiza tu horario semanal
        </p>
      </div>

      {/* Selector de carrera */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="text-sm font-medium">Carrera:</label>
            <Select value={carreraSeleccionada} onValueChange={setCarreraSeleccionada}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Selecciona tu carrera" />
              </SelectTrigger>
              <SelectContent>
                {carreras.map((c) => (
                  <SelectItem key={c.codigo} value={c.codigo}>
                    {c.codigo} - {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {periodoNombre && (
              <Badge variant="outline" className="ml-auto">
                {periodoNombre}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Barra de guardado */}
      {carreraSeleccionada && selecciones.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <div className="text-sm text-muted-foreground">
            {selecciones.size} materia{selecciones.size > 1 ? "s" : ""} seleccionada{selecciones.size > 1 ? "s" : ""}
            {saved && !hasChanges && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3.5 w-3.5" /> Guardado
              </span>
            )}
            {hasChanges && (
              <span className="ml-2 text-amber-600">
                — Cambios sin guardar
              </span>
            )}
          </div>
          <Button
            onClick={guardarHorario}
            disabled={saving || (saved && !hasChanges)}
            size="sm"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saved && !hasChanges ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Guardando..." : saved && !hasChanges ? "Guardado" : "Guardar mi horario"}
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3 text-sm text-muted-foreground">Cargando materias...</span>
        </div>
      )}

      {!loading && carreraSeleccionada && materias.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          {/* Panel izquierdo: materias por semestre */}
          <div className="space-y-2 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Materias disponibles ({materias.length})
            </h2>

            {[...materiasPorSemestre.entries()].map(([sem, mats]) => (
              <div key={sem} className="rounded-lg border">
                <button
                  onClick={() => toggleSemestre(sem)}
                  className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">
                    {sem === 0 ? "Sin semestre" : `Semestre ${sem}`}
                    <span className="ml-2 text-muted-foreground">({mats.length})</span>
                  </span>
                  {semestresExpandidos.has(sem) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {semestresExpandidos.has(sem) && (
                  <div className="border-t px-2 pb-2">
                    {mats.map((materia) => (
                      <MateriaItem
                        key={materia.id}
                        materia={materia}
                        seccionSeleccionada={selecciones.get(materia.id)}
                        onToggleSeccion={toggleSeccion}
                        onQuitar={quitarMateria}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Panel derecho: grilla horaria + resumen */}
          <div className="space-y-4">
            {/* Conflictos */}
            {conflictos.length > 0 && (
              <Card className="border-destructive">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    {conflictos.length} conflicto{conflictos.length > 1 ? "s" : ""} de horario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-xs">
                    {conflictos.map((c, i) => (
                      <li key={i}>
                        <strong>{c.materia1}</strong> ({c.seccion1}) vs{" "}
                        <strong>{c.materia2}</strong> ({c.seccion2}) - {c.dia} {c.rango}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Resumen de selecciones */}
            {seccionesSeleccionadas.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Materias seleccionadas ({seccionesSeleccionadas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {seccionesSeleccionadas.map(({ materia, seccion, colorIdx }) => (
                      <Badge
                        key={materia.id}
                        variant="outline"
                        className={`${COLORES[colorIdx]} cursor-pointer border`}
                        onClick={() => quitarMateria(materia.id)}
                      >
                        {materia.nombre} ({seccion.seccion})
                        <Trash2 className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grilla horaria */}
            <GrillaHoraria
              eventos={eventosGrilla}
              emptyMessage="Selecciona materias del panel izquierdo para ver tu horario aqui"
            />
          </div>
        </div>
      )}

      {!loading && carreraSeleccionada && materias.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              No hay materias cargadas para esta carrera en el periodo activo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============== MATERIA ITEM ==============

function MateriaItem({
  materia,
  seccionSeleccionada,
  onToggleSeccion,
  onQuitar,
}: {
  materia: MateriaData;
  seccionSeleccionada?: string;
  onToggleSeccion: (materiaId: string, seccionId: string) => void;
  onQuitar: (materiaId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = !!seccionSeleccionada;

  return (
    <div className={`mt-1 rounded-md border ${isSelected ? "border-primary bg-primary/5" : ""}`}>
      <div className="flex items-center gap-2 p-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center gap-2 text-left text-sm"
        >
          {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          <span className="font-medium leading-tight">{materia.nombre}</span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {materia.soloFinal && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">Final</Badge>
          )}
          <Badge variant="secondary" className="text-[10px] px-1 py-0">
            {materia.secciones.length} sec
          </Badge>
          {isSelected && (
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => onQuitar(materia.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-2 pb-2 pt-1 space-y-1">
          {materia.secciones.map((sec) => {
            const isThisSelected = seccionSeleccionada === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => onToggleSeccion(materia.id, sec.id)}
                className={`w-full rounded-md border p-2 text-left text-xs transition-colors ${
                  isThisSelected
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {sec.seccion} ({sec.turno})
                  </span>
                  {isThisSelected ? (
                    <Badge className="text-[10px] px-1 py-0">Elegida</Badge>
                  ) : (
                    <Plus className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> {sec.profesor || "Sin asignar"}
                  </span>
                </div>
                {sec.horarios.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-x-3 text-muted-foreground">
                    {sec.horarios.map((h, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {h.dia.slice(0, 3)} {h.horaInicio}-{h.horaFin}
                        {h.aula && (
                          <>
                            <MapPin className="ml-1 h-3 w-3" />
                            {h.aula}
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

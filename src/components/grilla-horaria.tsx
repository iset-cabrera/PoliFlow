"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

// ============== TIPOS ==============

export interface EventoGrilla {
  nombre: string;
  seccion: string;
  aula: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  colorIdx: number;
}

interface EventoProcessed extends EventoGrilla {
  startMin: number;
  endMin: number;
  col: number;
  totalCols: number;
}

// ============== CONSTANTES ==============

const DIAS_ORDEN = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

const COLORES_BG = [
  "bg-blue-100 border-blue-300 text-blue-900",
  "bg-emerald-100 border-emerald-300 text-emerald-900",
  "bg-violet-100 border-violet-300 text-violet-900",
  "bg-orange-100 border-orange-300 text-orange-900",
  "bg-pink-100 border-pink-300 text-pink-900",
  "bg-teal-100 border-teal-300 text-teal-900",
  "bg-indigo-100 border-indigo-300 text-indigo-900",
  "bg-amber-100 border-amber-300 text-amber-900",
  "bg-cyan-100 border-cyan-300 text-cyan-900",
  "bg-rose-100 border-rose-300 text-rose-900",
];

const COLORES_CONFLICTO = [
  "bg-blue-200/80 border-blue-400",
  "bg-emerald-200/80 border-emerald-400",
  "bg-violet-200/80 border-violet-400",
  "bg-orange-200/80 border-orange-400",
  "bg-pink-200/80 border-pink-400",
  "bg-teal-200/80 border-teal-400",
  "bg-indigo-200/80 border-indigo-400",
  "bg-amber-200/80 border-amber-400",
  "bg-cyan-200/80 border-cyan-400",
  "bg-rose-200/80 border-rose-400",
];

export { COLORES_BG as COLORES };

function toMin(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + (mm || 0);
}

// ============== OVERLAP ALGORITHM ==============
// Assign column positions to overlapping events (like Google Calendar)

function layoutEvents(events: (EventoGrilla & { startMin: number; endMin: number })[]): EventoProcessed[] {
  if (events.length === 0) return [];

  // Sort by start time, then by duration (longer first)
  const sorted = [...events].sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return (b.endMin - b.startMin) - (a.endMin - a.startMin);
  });

  // Find connected groups of overlapping events
  const groups: (typeof sorted)[] = [];
  let currentGroup: typeof sorted = [sorted[0]];
  let groupEnd = sorted[0].endMin;

  for (let i = 1; i < sorted.length; i++) {
    const ev = sorted[i];
    if (ev.startMin < groupEnd) {
      // Overlaps with current group
      currentGroup.push(ev);
      groupEnd = Math.max(groupEnd, ev.endMin);
    } else {
      groups.push(currentGroup);
      currentGroup = [ev];
      groupEnd = ev.endMin;
    }
  }
  groups.push(currentGroup);

  // Assign columns within each group
  const result: EventoProcessed[] = [];

  for (const group of groups) {
    // For each event, find the first available column
    const columns: { endMin: number }[] = [];

    for (const ev of group) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        if (ev.startMin >= columns[c].endMin) {
          columns[c].endMin = ev.endMin;
          result.push({ ...ev, col: c, totalCols: 0 }); // totalCols set later
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push({ endMin: ev.endMin });
        result.push({ ...ev, col: columns.length - 1, totalCols: 0 });
      }
    }

    // Set totalCols for all events in this group
    const totalCols = columns.length;
    for (const r of result) {
      if (group.includes(events.find((e) => e === r)!)) {
        // Match by reference won't work after spread, use index matching
      }
    }
    // Actually set totalCols for the events we just pushed
    const startIdx = result.length - group.length;
    for (let i = startIdx; i < result.length; i++) {
      result[i].totalCols = totalCols;
    }
  }

  return result;
}

// ============== COMPONENTE ==============

export function GrillaHoraria({
  eventos,
  emptyMessage,
}: {
  eventos: EventoGrilla[];
  emptyMessage?: string;
}) {
  // Process events: compute minutes, layout overlaps per day
  const { processedEvents, horaMin, horaMax, diasActivos } = useMemo(() => {
    if (eventos.length === 0) {
      return { processedEvents: [], horaMin: 7 * 60, horaMax: 22 * 60, diasActivos: DIAS_ORDEN.slice(0, 5) };
    }

    // Add minute values
    const withMin = eventos
      .filter((e) => DIAS_ORDEN.includes(e.dia))
      .map((e) => ({
        ...e,
        startMin: toMin(e.horaInicio),
        endMin: toMin(e.horaFin || e.horaInicio) || toMin(e.horaInicio) + 60,
      }));

    // Compute hour range
    let min = Infinity, max = -Infinity;
    for (const e of withMin) {
      if (e.startMin < min) min = e.startMin;
      if (e.endMin > max) max = e.endMin;
    }
    const horaMin = Math.floor(min / 60) * 60;
    const horaMax = Math.ceil(max / 60) * 60;

    // Active days
    const dias = new Set(withMin.map((e) => e.dia));
    const diasActivos = DIAS_ORDEN.filter((d) => dias.has(d));

    // Layout per day
    const processed: EventoProcessed[] = [];
    for (const dia of diasActivos) {
      const dayEvents = withMin.filter((e) => e.dia === dia);
      const laid = layoutEvents(dayEvents);
      processed.push(...laid);
    }

    return { processedEvents: processed, horaMin, horaMax, diasActivos };
  }, [eventos]);

  const totalMinutes = horaMax - horaMin;

  // Build hour labels
  const hourLabels: string[] = [];
  for (let m = horaMin; m < horaMax; m += 60) {
    hourLabels.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:00`);
  }

  if (eventos.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {emptyMessage || "Selecciona materias para ver tu horario aqui"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const ROW_HEIGHT = 60; // px per hour
  const gridHeight = hourLabels.length * ROW_HEIGHT;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Horario Semanal</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto pb-4">
        <div className="min-w-[600px]">
          {/* Header row */}
          <div
            className="grid border-b"
            style={{ gridTemplateColumns: `56px repeat(${diasActivos.length}, 1fr)` }}
          >
            <div className="p-2 text-[11px] font-medium text-muted-foreground">Hora</div>
            {diasActivos.map((dia) => (
              <div key={dia} className="p-2 text-center text-[11px] font-semibold border-l">
                {dia}
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div
            className="grid"
            style={{ gridTemplateColumns: `56px repeat(${diasActivos.length}, 1fr)` }}
          >
            {/* Hour labels column */}
            <div className="relative" style={{ height: gridHeight }}>
              {hourLabels.map((label, i) => (
                <div
                  key={label}
                  className="absolute right-2 text-[10px] text-muted-foreground -translate-y-1/2"
                  style={{ top: i * ROW_HEIGHT }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {diasActivos.map((dia) => {
              const dayEvents = processedEvents.filter((e) => e.dia === dia);
              return (
                <div key={dia} className="relative border-l" style={{ height: gridHeight }}>
                  {/* Hour grid lines */}
                  {hourLabels.map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-x-0 border-t border-dashed border-border/50"
                      style={{ top: i * ROW_HEIGHT }}
                    />
                  ))}

                  {/* Events */}
                  {dayEvents.map((ev, i) => {
                    const top = ((ev.startMin - horaMin) / totalMinutes) * gridHeight;
                    const height = ((ev.endMin - ev.startMin) / totalMinutes) * gridHeight;
                    const isOverlapping = ev.totalCols > 1;
                    const widthPct = 100 / ev.totalCols;
                    const leftPct = ev.col * widthPct;
                    const colorClass = isOverlapping
                      ? COLORES_CONFLICTO[ev.colorIdx % COLORES_CONFLICTO.length]
                      : COLORES_BG[ev.colorIdx % COLORES_BG.length];

                    return (
                      <div
                        key={i}
                        className={`absolute rounded-md border px-1.5 py-1 overflow-hidden transition-shadow hover:shadow-md hover:z-10 cursor-default ${colorClass}`}
                        style={{
                          top: top + 1,
                          height: Math.max(height - 2, 18),
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                        title={`${ev.nombre}\n${ev.seccion} | ${ev.horaInicio}-${ev.horaFin}\n${ev.aula}`}
                      >
                        <div className="text-[10px] font-semibold leading-tight truncate">
                          {ev.nombre}
                        </div>
                        {height > 30 && (
                          <div className="text-[9px] leading-tight opacity-80 truncate mt-0.5">
                            {ev.aula} — {ev.seccion}
                          </div>
                        )}
                        {height > 48 && (
                          <div className="text-[9px] leading-tight opacity-60 truncate">
                            {ev.horaInicio} - {ev.horaFin}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

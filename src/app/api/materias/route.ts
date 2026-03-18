import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/materias?carrera=IIN
// Retorna todas las materias de una carrera con sus secciones y horarios del periodo activo
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const carreraCodigo = searchParams.get("carrera");

  if (!carreraCodigo) {
    return NextResponse.json({ error: "Falta parametro carrera" }, { status: 400 });
  }

  const periodo = await prisma.periodoAcademico.findFirst({
    where: { activo: true },
  });

  if (!periodo) {
    return NextResponse.json({ error: "No hay periodo activo" }, { status: 404 });
  }

  const carrera = await prisma.carrera.findUnique({
    where: { codigo: carreraCodigo },
  });

  if (!carrera) {
    return NextResponse.json({ error: "Carrera no encontrada" }, { status: 404 });
  }

  // Obtener todas las asignaturas-carrera con secciones del periodo activo
  const asignaturaCarreras = await prisma.asignaturaCarrera.findMany({
    where: { carreraId: carrera.id },
    include: {
      asignatura: {
        include: { departamento: true },
      },
      secciones: {
        where: { periodoId: periodo.id },
        include: {
          horarios: true,
          examenes: true,
        },
        orderBy: { seccion: "asc" },
      },
    },
  });

  // Agrupar por asignatura: nombre -> { info, secciones[] }
  const materias = asignaturaCarreras
    .filter((ac) => ac.secciones.length > 0)
    .map((ac) => ({
      id: ac.asignatura.id,
      asignaturaCarreraId: ac.id,
      nombre: ac.asignatura.nombre,
      nivel: ac.asignatura.nivel,
      semestre: ac.asignatura.semestre,
      departamento: ac.asignatura.departamento.codigo,
      plan: ac.asignatura.plan,
      soloFinal: ac.asignatura.soloFinal,
      practicaLab: ac.asignatura.practicaLab,
      enfasis: ac.enfasisCodes,
      secciones: ac.secciones.map((s) => ({
        id: s.id,
        turno: s.turno,
        seccion: s.seccion,
        plataforma: s.plataforma,
        profesor: `${s.profesorTitulo} ${s.profesorNombre} ${s.profesorApellido}`.trim(),
        profesorEmail: s.profesorEmail,
        horarios: s.horarios.map((h) => ({
          dia: h.dia,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          aula: h.aula,
        })),
        examenes: s.examenes.map((e) => ({
          tipo: e.tipo,
          fecha: e.fecha,
          hora: e.hora,
          aula: e.aula,
        })),
      })),
    }))
    .sort((a, b) => {
      // Ordenar por semestre, luego por nombre
      const semA = a.semestre ?? 99;
      const semB = b.semestre ?? 99;
      if (semA !== semB) return semA - semB;
      return a.nombre.localeCompare(b.nombre);
    });

  return NextResponse.json({
    carrera: { id: carrera.id, codigo: carrera.codigo, nombre: carrera.nombre },
    periodo: { id: periodo.id, nombre: periodo.nombre },
    materias,
  });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/mi-horario/detalle - Horario guardado con datos completos
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const periodo = await prisma.periodoAcademico.findFirst({
    where: { activo: true },
  });

  if (!periodo) {
    return NextResponse.json({ error: "No hay periodo activo" }, { status: 404 });
  }

  const horario = await prisma.horarioGuardado.findUnique({
    where: {
      userId_periodoId: {
        userId: session.user.id,
        periodoId: periodo.id,
      },
    },
    include: { items: true },
  });

  if (!horario || horario.items.length === 0) {
    return NextResponse.json({ horario: null, periodo: periodo.nombre });
  }

  // Obtener secciones con todos los datos
  const seccionIds = horario.items.map((i) => i.seccionId);
  const secciones = await prisma.seccion.findMany({
    where: { id: { in: seccionIds } },
    include: {
      horarios: true,
      examenes: { orderBy: { tipo: "asc" } },
      revisiones: { orderBy: { tipo: "asc" } },
      asignaturaCarrera: {
        include: {
          asignatura: { include: { departamento: true } },
        },
      },
    },
  });

  const seccionMap = new Map(secciones.map((s) => [s.id, s]));

  const materias = horario.items
    .map((item) => {
      const sec = seccionMap.get(item.seccionId);
      if (!sec) return null;
      const asig = sec.asignaturaCarrera.asignatura;
      return {
        asignaturaId: item.asignaturaId,
        nombre: asig.nombre,
        semestre: asig.semestre,
        departamento: asig.departamento.codigo,
        seccion: sec.seccion,
        turno: sec.turno,
        profesor: `${sec.profesorTitulo} ${sec.profesorNombre} ${sec.profesorApellido}`.trim(),
        profesorEmail: sec.profesorEmail,
        plataforma: sec.plataforma,
        horarios: sec.horarios.map((h) => ({
          dia: h.dia,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          aula: h.aula,
        })),
        examenes: sec.examenes.map((e) => ({
          tipo: e.tipo,
          fecha: e.fecha,
          hora: e.hora,
          aula: e.aula,
          presidenteMesa: e.presidenteMesa,
          miembro1: e.miembro1,
          miembro2: e.miembro2,
        })),
        revisiones: sec.revisiones.map((r) => ({
          tipo: r.tipo,
          fecha: r.fecha,
          hora: r.hora,
        })),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a!.semestre ?? 99) - (b!.semestre ?? 99));

  return NextResponse.json({
    periodo: periodo.nombre,
    carrera: horario.carreraCodigo,
    updatedAt: horario.updatedAt,
    materias,
  });
}

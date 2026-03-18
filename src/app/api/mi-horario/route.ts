import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/mi-horario - Cargar horario guardado del usuario
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

  if (!horario) {
    return NextResponse.json({ horario: null });
  }

  return NextResponse.json({
    horario: {
      id: horario.id,
      carreraCodigo: horario.carreraCodigo,
      updatedAt: horario.updatedAt,
      items: horario.items.map((item) => ({
        asignaturaId: item.asignaturaId,
        seccionId: item.seccionId,
      })),
    },
  });
}

// POST /api/mi-horario - Guardar horario del usuario
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { carreraCodigo, selecciones } = body as {
    carreraCodigo: string;
    selecciones: { asignaturaId: string; seccionId: string }[];
  };

  if (!carreraCodigo || !Array.isArray(selecciones)) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const periodo = await prisma.periodoAcademico.findFirst({
    where: { activo: true },
  });

  if (!periodo) {
    return NextResponse.json({ error: "No hay periodo activo" }, { status: 404 });
  }

  // Upsert: crear o actualizar el horario del usuario para este periodo
  const horario = await prisma.horarioGuardado.upsert({
    where: {
      userId_periodoId: {
        userId: session.user.id,
        periodoId: periodo.id,
      },
    },
    update: {
      carreraCodigo,
      updatedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      periodoId: periodo.id,
      carreraCodigo,
    },
  });

  // Borrar items anteriores y crear los nuevos
  await prisma.horarioItem.deleteMany({
    where: { horarioGuardadoId: horario.id },
  });

  if (selecciones.length > 0) {
    await prisma.horarioItem.createMany({
      data: selecciones.map((s) => ({
        horarioGuardadoId: horario.id,
        asignaturaId: s.asignaturaId,
        seccionId: s.seccionId,
      })),
    });
  }

  return NextResponse.json({
    message: "Horario guardado",
    materias: selecciones.length,
  });
}

// DELETE /api/mi-horario - Borrar horario guardado
export async function DELETE() {
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

  await prisma.horarioGuardado.deleteMany({
    where: {
      userId: session.user.id,
      periodoId: periodo.id,
    },
  });

  return NextResponse.json({ message: "Horario eliminado" });
}

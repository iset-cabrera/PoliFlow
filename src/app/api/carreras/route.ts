import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const carreras = await prisma.carrera.findMany({
    orderBy: { codigo: "asc" },
    select: { id: true, codigo: true, nombre: true, sede: true },
  });
  return NextResponse.json(carreras);
}

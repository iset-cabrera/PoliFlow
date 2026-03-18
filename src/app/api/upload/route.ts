import { NextResponse } from "next/server";
import { parseExcelBuffer } from "@/lib/excel-parser";
import { saveParseResultToDb } from "@/lib/excel-to-db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envio archivo" }, { status: 400 });
    }

    if (!file.name.endsWith(".xlsx")) {
      return NextResponse.json(
        { error: "El archivo debe ser .xlsx" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const parseResult = parseExcelBuffer(buffer);

    // Guardar en base de datos
    const dbResult = await saveParseResultToDb(parseResult.carreras);

    return NextResponse.json({
      message: "Excel procesado correctamente",
      stats: {
        hojasProcesadas: parseResult.carreras.length,
        totalFilas: parseResult.totalRows,
        erroresParser: parseResult.totalErrors,
        asignaturasCreadas: dbResult.asignaturasCreadas,
        seccionesCreadas: dbResult.seccionesCreadas,
        horariosCreados: dbResult.horariosCreados,
        examenesCreados: dbResult.examenesCreados,
      },
      carreras: parseResult.carreras.map((c) => ({
        nombre: c.carrera,
        sede: c.sede,
        filas: c.rows.length,
        errores: c.errors.length,
      })),
      errors: parseResult.carreras.flatMap((c) => c.errors).slice(0, 20),
    });
  } catch (err) {
    console.error("Error procesando Excel:", err);
    return NextResponse.json(
      { error: "Error al procesar el archivo: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }
}

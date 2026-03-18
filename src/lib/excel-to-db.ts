import { prisma } from "./db";
import type { ParseResult } from "./excel-parser";

export async function saveParseResultToDb(carreras: ParseResult[]) {
  // Limpiar datos anteriores del periodo activo antes de importar
  const periodo = await prisma.periodoAcademico.findFirst({
    where: { activo: true },
  });

  if (!periodo) {
    throw new Error("No hay periodo academico activo. Ejecuta el seed primero.");
  }

  // Borrar datos previos de este periodo (reimportacion limpia)
  const oldSecciones = await prisma.seccion.findMany({
    where: { periodoId: periodo.id },
    select: { id: true },
  });
  const oldIds = oldSecciones.map((s) => s.id);

  if (oldIds.length > 0) {
    await prisma.revision.deleteMany({ where: { seccionId: { in: oldIds } } });
    await prisma.examen.deleteMany({ where: { seccionId: { in: oldIds } } });
    await prisma.horarioClase.deleteMany({ where: { seccionId: { in: oldIds } } });
    await prisma.seccion.deleteMany({ where: { periodoId: periodo.id } });
  }

  // Pre-cargar caches
  const deptCache = new Map<string, string>();
  const carreraCache = new Map<string, string>();
  const asigCache = new Map<string, string>(); // "nombre|deptId|plan" -> id
  const asigCarreraCache = new Map<string, string>(); // "asigId|carreraId" -> id

  for (const d of await prisma.departamento.findMany()) deptCache.set(d.codigo, d.id);
  for (const c of await prisma.carrera.findMany()) carreraCache.set(c.codigo, c.id);
  for (const a of await prisma.asignatura.findMany()) {
    asigCache.set(`${a.nombre}|${a.departamentoId}|${a.plan || ""}`, a.id);
  }
  for (const ac of await prisma.asignaturaCarrera.findMany()) {
    asigCarreraCache.set(`${ac.asignaturaId}|${ac.carreraId}`, ac.id);
  }

  let asignaturasCreadas = 0;
  let seccionesCreadas = 0;
  let horariosCreados = 0;
  let examenesCreados = 0;

  // Procesar en batches por carrera usando transacciones
  for (const carreraResult of carreras) {
    // Batch arrays para esta carrera
    const seccionBatch: Parameters<typeof prisma.seccion.create>[0]["data"][] = [];
    const horarioBatchMap: Map<number, Parameters<typeof prisma.horarioClase.create>[0]["data"][]> = new Map();
    const examenBatchMap: Map<number, Parameters<typeof prisma.examen.create>[0]["data"][]> = new Map();
    const revisionBatchMap: Map<number, Parameters<typeof prisma.revision.create>[0]["data"][]> = new Map();

    for (const row of carreraResult.rows) {
      // Resolver departamento
      let deptId = deptCache.get(row.departamento);
      if (!deptId) {
        const d = await prisma.departamento.upsert({
          where: { codigo: row.departamento },
          update: {},
          create: { codigo: row.departamento, nombre: row.departamento },
        });
        deptId = d.id;
        deptCache.set(row.departamento, deptId);
      }

      // Resolver carrera
      const carreraCodigo = row.siglaCarrera || carreraResult.carrera;
      let carreraId = carreraCache.get(carreraCodigo);
      if (!carreraId) {
        const c = await prisma.carrera.upsert({
          where: { codigo: carreraCodigo },
          update: {},
          create: { codigo: carreraCodigo, nombre: carreraCodigo, sede: carreraResult.sede },
        });
        carreraId = c.id;
        carreraCache.set(carreraCodigo, carreraId);
      }

      // Resolver asignatura
      const asigKey = `${row.asignatura}|${deptId}|${row.plan || ""}`;
      let asigId = asigCache.get(asigKey);
      if (!asigId) {
        const a = await prisma.asignatura.create({
          data: {
            nombre: row.asignatura,
            nivel: row.nivel,
            semestre: row.semestre,
            departamentoId: deptId,
            plan: row.plan || null,
            soloFinal: row.soloFinal,
            practicaLab: row.practicaLab,
          },
        });
        asigId = a.id;
        asigCache.set(asigKey, asigId);
        asignaturasCreadas++;
      }

      // Resolver asignatura-carrera
      const acKey = `${asigId}|${carreraId}`;
      let acId = asigCarreraCache.get(acKey);
      if (!acId) {
        const ac = await prisma.asignaturaCarrera.create({
          data: { asignaturaId: asigId, carreraId: carreraId, enfasisCodes: row.enfasis },
        });
        acId = ac.id;
        asigCarreraCache.set(acKey, acId);
      }

      // Acumular seccion data (se creara en batch)
      const secIdx = seccionBatch.length;
      seccionBatch.push({
        asignaturaCarreraId: acId,
        periodoId: periodo.id,
        turno: row.turno,
        seccion: row.seccion,
        plataforma: row.plataforma || "EDUCA",
        profesorTitulo: row.profesor.titulo,
        profesorApellido: row.profesor.apellido,
        profesorNombre: row.profesor.nombre,
        profesorEmail: row.profesor.email,
      });

      // Acumular horarios
      const horarios = row.horarioSemanal.map((h) => ({
        seccionId: "", // se asignara despues
        dia: h.dia,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        aula: h.aula,
        fechasSabado: h.dia === "Sabado" ? row.fechasSabadoNoche : null,
      }));
      if (horarios.length > 0) horarioBatchMap.set(secIdx, horarios);

      // Acumular examenes
      const examenes: Parameters<typeof prisma.examen.create>[0]["data"][] = [];
      const examTypes = [
        { tipo: "PARCIAL_1", data: row.examenes.parcial1 },
        { tipo: "PARCIAL_2", data: row.examenes.parcial2 },
        { tipo: "FINAL_1", data: row.examenes.final1 },
        { tipo: "FINAL_2", data: row.examenes.final2 },
      ] as const;
      for (const ex of examTypes) {
        if (ex.data.fecha || ex.data.hora) {
          examenes.push({
            seccionId: "",
            tipo: ex.tipo,
            fecha: ex.data.fecha || null,
            hora: ex.data.hora || null,
            aula: ex.data.aula || null,
            presidenteMesa: row.mesa.presidente || null,
            miembro1: row.mesa.miembro1 || null,
            miembro2: row.mesa.miembro2 || null,
          });
        }
      }
      if (examenes.length > 0) examenBatchMap.set(secIdx, examenes);

      // Acumular revisiones
      const revisiones: Parameters<typeof prisma.revision.create>[0]["data"][] = [];
      const revTypes = [
        { tipo: "REVISION_FINAL_1", data: row.revisiones.revision1 },
        { tipo: "REVISION_FINAL_2", data: row.revisiones.revision2 },
      ] as const;
      for (const rev of revTypes) {
        if (rev.data.fecha || rev.data.hora) {
          revisiones.push({
            seccionId: "",
            tipo: rev.tipo,
            fecha: rev.data.fecha || null,
            hora: rev.data.hora || null,
          });
        }
      }
      if (revisiones.length > 0) revisionBatchMap.set(secIdx, revisiones);
    }

    // Insertar secciones en batch y luego sus hijos
    // Procesamos en chunks de 50 para no bloquear demasiado
    const CHUNK = 50;
    for (let i = 0; i < seccionBatch.length; i += CHUNK) {
      const chunk = seccionBatch.slice(i, i + CHUNK);

      await prisma.$transaction(async (tx) => {
        for (let j = 0; j < chunk.length; j++) {
          const globalIdx = i + j;
          const seccion = await tx.seccion.create({ data: chunk[j] });
          seccionesCreadas++;

          // Horarios
          const horarios = horarioBatchMap.get(globalIdx);
          if (horarios && horarios.length > 0) {
            await tx.horarioClase.createMany({
              data: horarios.map((h) => ({ ...h, seccionId: seccion.id })),
            });
            horariosCreados += horarios.length;
          }

          // Examenes
          const examenes = examenBatchMap.get(globalIdx);
          if (examenes && examenes.length > 0) {
            await tx.examen.createMany({
              data: examenes.map((e) => ({ ...e, seccionId: seccion.id })),
            });
            examenesCreados += examenes.length;
          }

          // Revisiones
          const revisiones = revisionBatchMap.get(globalIdx);
          if (revisiones && revisiones.length > 0) {
            await tx.revision.createMany({
              data: revisiones.map((r) => ({ ...r, seccionId: seccion.id })),
            });
          }
        }
      });
    }
  }

  return { asignaturasCreadas, seccionesCreadas, horariosCreados, examenesCreados };
}

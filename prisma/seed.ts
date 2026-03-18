import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";
import { parseExcelBuffer } from "../src/lib/excel-parser";
import { saveParseResultToDb } from "../src/lib/excel-to-db";

const prisma = new PrismaClient();

async function main() {
  // Departamentos (del Excel - hoja Codigos)
  const departamentos = [
    { codigo: "DCB", nombre: "Departamento de Ciencias Basicas" },
    { codigo: "DG", nombre: "Departamento de Gestion" },
    { codigo: "DEI", nombre: "Departamento de Informatica" },
    { codigo: "DEE", nombre: "Departamento de Electricidad y Electronica" },
  ];

  for (const dept of departamentos) {
    await prisma.departamento.upsert({
      where: { codigo: dept.codigo },
      update: {},
      create: dept,
    });
  }

  // Carreras (del Excel - hoja Codigos)
  const carreras = [
    { codigo: "IIN", nombre: "Ingenieria en Informatica", sede: "Asuncion" },
    { codigo: "IEL", nombre: "Ingenieria en Electricidad", sede: "Asuncion" },
    { codigo: "IEK", nombre: "Ingenieria en Electronica", sede: "Asuncion" },
    { codigo: "ICM", nombre: "Ingenieria en Ciencias de los Materiales", sede: "Asuncion" },
    { codigo: "IAE", nombre: "Ingenieria Aeronautica", sede: "Asuncion" },
    { codigo: "IEN", nombre: "Ingenieria en Energia", sede: "Asuncion" },
    { codigo: "ISP", nombre: "Ingenieria en Sistemas de Produccion", sede: "Asuncion" },
    { codigo: "IMK", nombre: "Ingenieria en Marketing", sede: "Asuncion" },
    { codigo: "LCA", nombre: "Licenciatura en Ciencias Atmosfericas", sede: "Asuncion" },
    { codigo: "LCI", nombre: "Licenciatura en Ciencias de la Informacion", sede: "Asuncion" },
    { codigo: "LCIk", nombre: "Licenciatura en Ciencias Informaticas", sede: "Asuncion" },
    { codigo: "LEL", nombre: "Licenciatura en Electricidad", sede: "Asuncion" },
    { codigo: "LGH", nombre: "Licenciatura en Gestion de la Hospitalidad", sede: "Asuncion" },
    { codigo: "TSE", nombre: "Tecnico Superior en Electronica", sede: "Asuncion" },
  ];

  for (const carrera of carreras) {
    await prisma.carrera.upsert({
      where: { codigo: carrera.codigo },
      update: {},
      create: carrera,
    });
  }

  // Enfasis (del Excel - hoja Codigos)
  const enfasisData = [
    { codigo: "EM", nombre: "Electronica Medica", carreraCodigo: "IEK" },
    { codigo: "TI", nombre: "Teleprocesamiento", carreraCodigo: "IEK" },
    { codigo: "CI", nombre: "Control Industrial", carreraCodigo: "IEK" },
    { codigo: "MEC", nombre: "Mecatronica", carreraCodigo: "IEK" },
    { codigo: "G", nombre: "Gastronomia", carreraCodigo: "LGH" },
    { codigo: "H", nombre: "Hoteleria", carreraCodigo: "LGH" },
    { codigo: "T", nombre: "Turismo", carreraCodigo: "LGH" },
    { codigo: "ASI", nombre: "Analisis de Sistemas", carreraCodigo: "LCIk" },
    { codigo: "PC", nombre: "Programacion de Computadoras", carreraCodigo: "LCIk" },
  ];

  for (const enf of enfasisData) {
    const carrera = await prisma.carrera.findUnique({
      where: { codigo: enf.carreraCodigo },
    });
    if (carrera) {
      await prisma.enfasis.upsert({
        where: {
          codigo_carreraId: { codigo: enf.codigo, carreraId: carrera.id },
        },
        update: {},
        create: {
          codigo: enf.codigo,
          nombre: enf.nombre,
          carreraId: carrera.id,
        },
      });
    }
  }

  // Periodo academico actual
  await prisma.periodoAcademico.upsert({
    where: { anho_periodo: { anho: 2026, periodo: 1 } },
    update: {},
    create: {
      nombre: "Primer Periodo Academico 2026",
      anho: 2026,
      periodo: 1,
      activo: true,
    },
  });

  // Usuario de prueba
  const testPassword = await hash("123456", 12);
  await prisma.user.upsert({
    where: { documento: "12345678" },
    update: {},
    create: {
      documento: "12345678",
      password: testPassword,
      name: "Estudiante Demo",
    },
  });

  console.log("Seed base completado: departamentos, carreras, enfasis, periodo y usuario de prueba.");
  console.log("Usuario de prueba -> Documento: 12345678 | Contrasena: 123456");

  // Cargar datos del Excel del periodo 2026-1
  const excelPath = join(__dirname, "..", "data", "excel", "Horario de clases y examenes Primer Periodo 2026 version web 27022026.xlsx");
  try {
    const buffer = readFileSync(excelPath);
    console.log("\nCargando Excel del Primer Periodo 2026...");
    const parseResult = parseExcelBuffer(buffer.buffer as ArrayBuffer);
    console.log(`  Hojas encontradas: ${parseResult.sheetNames.join(", ")}`);
    console.log(`  Carreras parseadas: ${parseResult.carreras.length}`);
    console.log(`  Filas totales: ${parseResult.totalRows}`);

    const dbResult = await saveParseResultToDb(parseResult.carreras);
    console.log(`\nDatos del periodo cargados:`);
    console.log(`  Asignaturas: ${dbResult.asignaturasCreadas}`);
    console.log(`  Secciones: ${dbResult.seccionesCreadas}`);
    console.log(`  Horarios de clase: ${dbResult.horariosCreados}`);
    console.log(`  Examenes: ${dbResult.examenesCreados}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("\nExcel no encontrado en data/excel/. Omitiendo carga de horarios.");
      console.log("Puedes cargar los datos luego desde la pagina 'Subir Excel'.");
    } else {
      throw err;
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

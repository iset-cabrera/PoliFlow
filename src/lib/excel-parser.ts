import type { ExcelRow } from "@/types";

// Mapeo de columnas del Excel (A=0, B=1, etc.)
export const COLUMN_MAP = {
  item: 0, // A
  departamento: 1, // B
  asignatura: 2, // C
  nivel: 3, // D
  semestre: 4, // E
  siglaCarrera: 5, // F
  enfasis: 6, // G
  plan: 7, // H
  turno: 8, // I
  seccion: 9, // J
  plataforma: 10, // K
  profesorTitulo: 11, // L
  profesorApellido: 12, // M
  profesorNombre: 13, // N
  profesorEmail: 14, // O
  // Examenes: P-AE (15-30)
  parcial1Dia: 15,
  parcial1Hora: 16,
  parcial1Aula: 17,
  parcial2Dia: 18,
  parcial2Hora: 19,
  parcial2Aula: 20,
  final1Dia: 21,
  final1Hora: 22,
  final1Aula: 23,
  revision1Dia: 24,
  revision1Hora: 25,
  final2Dia: 26,
  final2Hora: 27,
  final2Aula: 28,
  revision2Dia: 29,
  revision2Hora: 30,
  // Mesa examinadora
  presidenteMesa: 31, // AF
  miembro1: 32, // AG
  miembro2: 33, // AH
  // Horario semanal (pares AULA/HORA por dia)
  lunesAula: 34, // AI
  lunesHora: 35, // AJ
  martesAula: 36, // AK
  martesHora: 37, // AL
  miercolesAula: 38, // AM
  miercolesHora: 39, // AN
  juevesAula: 40, // AO
  juevesHora: 41, // AP
  viernesAula: 42, // AQ
  viernesHora: 43, // AR
  sabadoAula: 44, // AS
  sabadoHora: 45, // AT
  fechasSabado: 46, // AU
} as const;

// Hojas de carreras del campus principal
export const CAREER_SHEETS = [
  "IAE",
  "ICM",
  "IEK",
  "IEL",
  "IEN",
  "IIN",
  "IMK",
  "ISP",
  "LCA",
  "LCI",
  "LCIk",
  "LEL",
  "LGH",
  "TSE",
];

// Hojas de sedes
export const BRANCH_SHEETS = ["Cnel. Oviedo", "Villarrica"];

// Fila donde empiezan los datos (0-indexed, row 12 en Excel = index 11)
export const DATA_START_ROW = 11;

/**
 * Detecta si una asignatura tiene marcadores especiales.
 * (*) = solo derecho a final, sin clases
 * (**) = ver horario de practicas de laboratorio
 */
export function parseAsignaturaFlags(nombre: string): {
  nombreLimpio: string;
  soloFinal: boolean;
  practicaLab: boolean;
} {
  let nombreLimpio = nombre.trim();
  const soloFinal = nombreLimpio.includes("(*)");
  const practicaLab = nombreLimpio.includes("(**)");

  nombreLimpio = nombreLimpio
    .replace(/\s*\(\*\*\)\s*/g, "")
    .replace(/\s*\(\*\)\s*/g, "")
    .trim();

  return { nombreLimpio, soloFinal, practicaLab };
}

// TODO: Implementar parseExcelFile() en la proxima sesion
// Esta funcion recibira un File/Buffer del Excel y retornara ExcelRow[]
export async function parseExcelFile(
  _buffer: ArrayBuffer
): Promise<ExcelRow[]> {
  throw new Error("Parser no implementado todavia. Proximamente...");
}

import * as XLSX from "xlsx";

// ============== TIPOS ==============

export interface ParsedRow {
  item: number;
  departamento: string;
  asignatura: string;
  soloFinal: boolean;
  practicaLab: boolean;
  nivel: number | null;
  semestre: number | null;
  siglaCarrera: string;
  enfasis: string;
  plan: string;
  turno: string;
  seccion: string;
  plataforma: string;
  profesor: {
    titulo: string;
    apellido: string;
    nombre: string;
    email: string;
  };
  examenes: {
    parcial1: ExamenInfo;
    parcial2: ExamenInfo;
    final1: ExamenInfo;
    final2: ExamenInfo;
  };
  revisiones: {
    revision1: RevisionInfo;
    revision2: RevisionInfo;
  };
  mesa: {
    presidente: string;
    miembro1: string;
    miembro2: string;
  };
  horarioSemanal: DiaClaseInfo[];
  fechasSabadoNoche: string;
}

export interface ExamenInfo {
  fecha: string;
  hora: string;
  aula: string;
}

export interface RevisionInfo {
  fecha: string;
  hora: string;
}

export interface DiaClaseInfo {
  dia: string;
  aula: string;
  horaInicio: string;
  horaFin: string;
}

export interface ParseResult {
  carrera: string;
  sede: string;
  rows: ParsedRow[];
  errors: string[];
}

// ============== CONSTANTES ==============

// Mapeo de columnas del Excel campus principal (A=0, B=1, etc.) - 47 columnas
const COL = {
  item: 0,
  departamento: 1,
  asignatura: 2,
  nivel: 3,
  semestre: 4,
  siglaCarrera: 5,
  enfasis: 6,
  plan: 7,
  turno: 8,
  seccion: 9,
  plataforma: 10,
  profesorTitulo: 11,
  profesorApellido: 12,
  profesorNombre: 13,
  profesorEmail: 14,
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
  presidenteMesa: 31,
  miembro1: 32,
  miembro2: 33,
  lunesAula: 34,
  lunesHora: 35,
  martesAula: 36,
  martesHora: 37,
  miercolesAula: 38,
  miercolesHora: 39,
  juevesAula: 40,
  juevesHora: 41,
  viernesAula: 42,
  viernesHora: 43,
  sabadoAula: 44,
  sabadoHora: 45,
  fechasSabado: 46,
} as const;

// Hojas de carreras del campus principal
export const CAREER_SHEETS = [
  "IAE", "ICM", "IEK", "IEL", "IEN", "IIN",
  "IMK", "ISP", "LCA", "LCI", "LCIk", "LEL", "LGH", "TSE",
];

// Hojas de sedes (estructura simplificada - 36 columnas)
export const BRANCH_SHEETS = ["Cnel. Oviedo", "Villarrica"];

// Fila donde empiezan los datos (0-indexed)
const DATA_START_ROW = 11;

// ============== HELPERS ==============

function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val);
  // Manejar objetos Date que SheetJS puede devolver para horas
  if (val instanceof Date) {
    const h = val.getHours().toString().padStart(2, "0");
    const m = val.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  return String(val).trim();
}

function num(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const s = str(val);
  if (s === "" || s === "---") return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

/** Normaliza hora: "datetime" objects, "08:00", "8:00", etc. */
function normalizeHora(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) {
    const h = val.getHours().toString().padStart(2, "0");
    const m = val.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  const s = str(val);
  // Si es un numero decimal (fraccion de dia de Excel), convertir
  if (/^\d+(\.\d+)?$/.test(s) && parseFloat(s) < 1) {
    const totalMinutes = Math.round(parseFloat(s) * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
  return s;
}

/**
 * Detecta marcadores especiales en nombre de asignatura.
 * (*) = solo derecho a final, sin clases
 * (**) = ver horario de practicas de laboratorio
 */
function parseAsignaturaFlags(nombre: string) {
  let limpio = nombre.trim();
  const soloFinal = limpio.includes("(*)") && !limpio.includes("(**)");
  const practicaLab = limpio.includes("(**)");
  limpio = limpio.replace(/\s*\(\*\*\)\s*/g, "").replace(/\s*\(\*\)\s*/g, "").trim();
  return { nombreLimpio: limpio, soloFinal, practicaLab };
}

/** Extrae horario de un par aula/hora para un dia */
function parseDiaHorario(aula: unknown, hora: unknown, dia: string): DiaClaseInfo | null {
  const aulaStr = str(aula);
  const horaStr = str(hora);
  if (!horaStr) return null;

  // El formato tipico es "08:00 - 10:15"
  const match = horaStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (match) {
    return { dia, aula: aulaStr, horaInicio: match[1], horaFin: match[2] };
  }
  // Si no matchea el patron pero hay hora, guardar como inicio
  return { dia, aula: aulaStr, horaInicio: horaStr, horaFin: "" };
}

// ============== PARSER PRINCIPAL ==============

function parseCareerSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  isBranch: boolean
): ParseResult {
  const rows: ParsedRow[] = [];
  const errors: string[] = [];
  const sede = isBranch ? sheetName : "Asuncion";
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

  for (let r = DATA_START_ROW; r <= range.e.r; r++) {
    // Leer celda de item (columna A)
    const itemCell = sheet[XLSX.utils.encode_cell({ r, c: COL.item })];
    const itemVal = num(itemCell?.v);
    // Saltar filas vacias (sin numero de item)
    if (itemVal === null) continue;

    // Leer celda de asignatura
    const asigRaw = str(sheet[XLSX.utils.encode_cell({ r, c: COL.asignatura })]?.v);
    if (!asigRaw) continue;

    const { nombreLimpio, soloFinal, practicaLab } = parseAsignaturaFlags(asigRaw);

    try {
      // Horario semanal (solo campus principal)
      const horarioSemanal: DiaClaseInfo[] = [];
      if (!isBranch) {
        const dias = [
          { dia: "Lunes", aulaCol: COL.lunesAula, horaCol: COL.lunesHora },
          { dia: "Martes", aulaCol: COL.martesAula, horaCol: COL.martesHora },
          { dia: "Miercoles", aulaCol: COL.miercolesAula, horaCol: COL.miercolesHora },
          { dia: "Jueves", aulaCol: COL.juevesAula, horaCol: COL.juevesHora },
          { dia: "Viernes", aulaCol: COL.viernesAula, horaCol: COL.viernesHora },
          { dia: "Sabado", aulaCol: COL.sabadoAula, horaCol: COL.sabadoHora },
        ];
        for (const d of dias) {
          const aulaVal = sheet[XLSX.utils.encode_cell({ r, c: d.aulaCol })]?.v;
          const horaVal = sheet[XLSX.utils.encode_cell({ r, c: d.horaCol })]?.v;
          const parsed = parseDiaHorario(aulaVal, horaVal, d.dia);
          if (parsed) horarioSemanal.push(parsed);
        }
      }

      const row: ParsedRow = {
        item: itemVal,
        departamento: str(sheet[XLSX.utils.encode_cell({ r, c: COL.departamento })]?.v),
        asignatura: nombreLimpio,
        soloFinal,
        practicaLab,
        nivel: num(sheet[XLSX.utils.encode_cell({ r, c: COL.nivel })]?.v),
        semestre: num(sheet[XLSX.utils.encode_cell({ r, c: COL.semestre })]?.v),
        siglaCarrera: str(sheet[XLSX.utils.encode_cell({ r, c: COL.siglaCarrera })]?.v),
        enfasis: str(sheet[XLSX.utils.encode_cell({ r, c: COL.enfasis })]?.v)
          .replace(/-- --/g, "").trim(),
        plan: str(sheet[XLSX.utils.encode_cell({ r, c: COL.plan })]?.v),
        turno: str(sheet[XLSX.utils.encode_cell({ r, c: COL.turno })]?.v),
        seccion: str(sheet[XLSX.utils.encode_cell({ r, c: COL.seccion })]?.v),
        plataforma: str(sheet[XLSX.utils.encode_cell({ r, c: COL.plataforma })]?.v),
        profesor: {
          titulo: str(sheet[XLSX.utils.encode_cell({ r, c: COL.profesorTitulo })]?.v),
          apellido: str(sheet[XLSX.utils.encode_cell({ r, c: COL.profesorApellido })]?.v),
          nombre: str(sheet[XLSX.utils.encode_cell({ r, c: COL.profesorNombre })]?.v),
          email: str(sheet[XLSX.utils.encode_cell({ r, c: COL.profesorEmail })]?.v),
        },
        examenes: {
          parcial1: {
            fecha: str(sheet[XLSX.utils.encode_cell({ r, c: COL.parcial1Dia })]?.v),
            hora: normalizeHora(sheet[XLSX.utils.encode_cell({ r, c: COL.parcial1Hora })]?.v),
            aula: str(sheet[XLSX.utils.encode_cell({ r, c: COL.parcial1Aula })]?.v),
          },
          parcial2: {
            fecha: str(sheet[XLSX.utils.encode_cell({ r, c: COL.parcial2Dia })]?.v),
            hora: normalizeHora(sheet[XLSX.utils.encode_cell({ r, c: COL.parcial2Hora })]?.v),
            aula: str(sheet[XLSX.utils.encode_cell({ r, c: COL.parcial2Aula })]?.v),
          },
          final1: {
            fecha: str(sheet[XLSX.utils.encode_cell({ r, c: COL.final1Dia })]?.v),
            hora: normalizeHora(sheet[XLSX.utils.encode_cell({ r, c: COL.final1Hora })]?.v),
            aula: str(sheet[XLSX.utils.encode_cell({ r, c: COL.final1Aula })]?.v),
          },
          final2: {
            fecha: str(sheet[XLSX.utils.encode_cell({ r, c: COL.final2Dia })]?.v),
            hora: normalizeHora(sheet[XLSX.utils.encode_cell({ r, c: COL.final2Hora })]?.v),
            aula: str(sheet[XLSX.utils.encode_cell({ r, c: COL.final2Aula })]?.v),
          },
        },
        revisiones: {
          revision1: {
            fecha: str(sheet[XLSX.utils.encode_cell({ r, c: COL.revision1Dia })]?.v),
            hora: normalizeHora(sheet[XLSX.utils.encode_cell({ r, c: COL.revision1Hora })]?.v),
          },
          revision2: {
            fecha: str(sheet[XLSX.utils.encode_cell({ r, c: COL.revision2Dia })]?.v),
            hora: normalizeHora(sheet[XLSX.utils.encode_cell({ r, c: COL.revision2Hora })]?.v),
          },
        },
        mesa: {
          presidente: str(sheet[XLSX.utils.encode_cell({ r, c: COL.presidenteMesa })]?.v),
          miembro1: str(sheet[XLSX.utils.encode_cell({ r, c: COL.miembro1 })]?.v),
          miembro2: str(sheet[XLSX.utils.encode_cell({ r, c: COL.miembro2 })]?.v),
        },
        horarioSemanal,
        fechasSabadoNoche: !isBranch
          ? str(sheet[XLSX.utils.encode_cell({ r, c: COL.fechasSabado })]?.v)
          : "",
      };

      rows.push(row);
    } catch (err) {
      errors.push(`Fila ${r + 1} en ${sheetName}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    carrera: sheetName,
    sede,
    rows,
    errors,
  };
}

// ============== API PUBLICA ==============

/**
 * Parsea el archivo Excel completo del semestre.
 * Retorna los datos de todas las carreras encontradas.
 */
export function parseExcelBuffer(buffer: ArrayBuffer): {
  carreras: ParseResult[];
  sheetNames: string[];
  totalRows: number;
  totalErrors: number;
} {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetNames = workbook.SheetNames;
  const carreras: ParseResult[] = [];
  let totalRows = 0;
  let totalErrors = 0;

  // Parsear hojas de campus principal
  for (const name of CAREER_SHEETS) {
    if (sheetNames.includes(name)) {
      const sheet = workbook.Sheets[name];
      const result = parseCareerSheet(sheet, name, false);
      carreras.push(result);
      totalRows += result.rows.length;
      totalErrors += result.errors.length;
    }
  }

  // Parsear hojas de sedes
  for (const name of BRANCH_SHEETS) {
    if (sheetNames.includes(name)) {
      const sheet = workbook.Sheets[name];
      const result = parseCareerSheet(sheet, name, true);
      carreras.push(result);
      totalRows += result.rows.length;
      totalErrors += result.errors.length;
    }
  }

  return { carreras, sheetNames, totalRows, totalErrors };
}

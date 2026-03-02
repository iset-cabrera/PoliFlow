// Tipos para el parser del Excel
export interface ExcelRow {
  item: number;
  departamento: string;
  asignatura: string;
  nivel: number | null;
  semestre: number | null;
  siglaCarrera: string;
  enfasis: string;
  plan: string;
  turno: string;
  seccion: string;
  plataforma: string;
  profesorTitulo: string;
  profesorApellido: string;
  profesorNombre: string;
  profesorEmail: string;
  // Examenes
  parcial1: ExamenData;
  parcial2: ExamenData;
  final1: ExamenData;
  revision1: RevisionData;
  final2: ExamenData;
  revision2: RevisionData;
  // Mesa examinadora
  presidenteMesa: string;
  miembro1: string;
  miembro2: string;
  // Horario semanal
  horario: DiaClase[];
}

export interface ExamenData {
  fecha: string | null;
  hora: string | null;
  aula: string | null;
}

export interface RevisionData {
  fecha: string | null;
  hora: string | null;
}

export interface DiaClase {
  dia: string;
  aula: string;
  horario: string; // "08:00 - 10:15"
}

// Tipos para la app
export interface CarreraInfo {
  id: string;
  codigo: string;
  nombre: string;
  sede: string;
}

export interface MateriaResumen {
  id: string;
  nombre: string;
  seccion: string;
  turno: string;
  profesor: string;
  horarios: DiaClase[];
}

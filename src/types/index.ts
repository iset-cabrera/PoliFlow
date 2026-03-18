// Tipos reutilizables para la app

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
  aula: string;
  horarios: { dia: string; horaInicio: string; horaFin: string; aula: string }[];
}

export interface MallaSemestre {
  numero: number;
  materias: MallaMateria[];
}

export interface MallaMateria {
  codigo: string;
  nombre: string;
  tipo: string;
  creditos: number;
  prerrequisitos: string[];
  requisitoEspecial?: string;
}

export interface MallaCompleta {
  carrera: string;
  nombre: string;
  plan: string;
  semestres: MallaSemestre[];
}

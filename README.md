# 📚 UniGestor - Sistema de Gestión Académica

## Descripción

UniGestor es un sistema web de gestión académica personal diseñado para estudiantes de la Facultad Politécnica (FPUNA). El sistema permite organizar tu vida universitaria de forma eficiente: desde visualizar horarios y exámenes hasta armar tu semestre de manera inteligente respetando la malla curricular.

El sistema se alimenta del Excel oficial que la facultad publica cada semestre con los horarios de clases y exámenes, parseando automáticamente toda la información de todas las carreras disponibles.

---

## Problema que resuelve

Cada semestre, la facultad publica un archivo Excel con toda la información académica (horarios, exámenes, profesores, aulas). Este archivo es difícil de navegar: tiene múltiples hojas, datos densos y no permite interactividad. Los estudiantes pierden tiempo buscando información, detectando choques de horario manualmente y planificando qué materias cursar.

UniGestor transforma ese Excel estático en una herramienta dinámica y personalizada.

---

## Funcionalidades principales

### 1. Carga del Excel semestral
- Subir el archivo Excel oficial del semestre.
- El sistema parsea automáticamente todas las carreras, materias, horarios, exámenes, profesores y aulas.
- Soporte para todas las carreras de la facultad (IIN, IEL, ICM, LCA, etc.).

### 2. Armar Horario (modo inteligente)
- El estudiante selecciona las materias que ya aprobó.
- El sistema cruza esa información con la malla curricular y los prerrequisitos.
- Muestra únicamente las materias habilitadas para cursar.
- Permite elegir entre las materias disponibles y sus secciones.
- Detecta automáticamente choques de horario entre materias seleccionadas.

### 3. Cargar Horario (modo libre)
- Permite elegir cualquier materia sin restricciones de prerrequisitos.
- Útil para estudiantes que ya saben qué van a cursar o tienen situaciones excepcionales.
- También detecta choques de horario.

### 4. Vista de horario semanal
- Visualización tipo calendario semanal con las materias seleccionadas.
- Información de aula, profesor y sección por cada bloque.
- Diferenciación visual por materia.

### 5. Gestión de exámenes
- Listado de exámenes (parciales y finales) con fechas.
- Countdown hacia el próximo examen.
- Filtrado por materia y tipo de examen.

### 6. Dashboard personal
- Resumen del semestre actual.
- Próximas clases y exámenes.
- Progreso en la carrera (materias aprobadas vs. pendientes).

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Lenguaje | TypeScript |
| Base de datos | SQLite + Prisma ORM |
| UI | Tailwind CSS + shadcn/ui |
| Parser Excel | SheetJS |
| Estado | React Context / Zustand |

### ¿Por qué este stack?

- **Next.js fullstack**: frontend + API Routes en un solo proyecto, sin necesidad de un backend separado. Simplifica el desarrollo y el deploy.
- **SQLite**: base de datos en un solo archivo, cero configuración, ideal para proyecto personal. Migrable a PostgreSQL en el futuro con solo cambiar la config de Prisma.
- **SheetJS**: librería robusta para parsear archivos Excel directamente en el navegador o servidor.

---

## Modelo de datos

```
Carrera
├── código (IIN, IEL, ICM...)
├── nombre
└── sede (Asunción, Cnel. Oviedo, Villarrica)

MallaCurricular
├── carrera
├── semestre (1, 2, 3...)
├── materia
└── prerrequisitos[] → referencias a otras materias

Materia
├── código
├── nombre
├── semestre (según malla)
├── departamento (DCB, DG, DEI, DEE)
└── carrera

Horario
├── materia
├── sección (A, B, C...)
├── día (Lunes-Sábado)
├── hora inicio
├── hora fin
├── aula
└── profesor

Examen
├── materia
├── tipo (parcial 1, parcial 2, final)
├── fecha
├── hora
└── aula

PerfilAlumno
├── carrera
├── materias aprobadas[]
├── materias en curso[]
└── semestre actual
```

---

## Estructura del proyecto

```
unicestor/
├── prisma/
│   ├── schema.prisma          # Modelos de base de datos
│   └── seed.ts                # Seed inicial
├── public/
│   └── mallas/                # JSONs de mallas curriculares por carrera
│       ├── IIN.json
│       ├── IEL.json
│       └── ...
├── src/
│   ├── app/                   # App Router de Next.js
│   │   ├── page.tsx           # Dashboard principal
│   │   ├── horario/           # Vista de horario semanal
│   │   ├── examenes/          # Vista de exámenes
│   │   ├── armar-horario/     # Modo inteligente
│   │   ├── cargar-horario/    # Modo libre
│   │   └── api/               # API Routes
│   │       ├── upload/        # Subida y parseo del Excel
│   │       ├── materias/      # CRUD materias
│   │       └── perfil/        # Perfil del alumno
│   ├── components/            # Componentes reutilizables
│   ├── lib/
│   │   ├── db.ts              # Cliente Prisma
│   │   ├── excel-parser.ts    # Lógica de parseo del Excel
│   │   └── malla-engine.ts    # Motor de prerrequisitos
│   └── types/                 # Tipos TypeScript
├── data/
│   └── excel/                 # Archivos Excel subidos
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Recurso externo necesario: Malla Curricular

La malla curricular con prerrequisitos **no viene incluida en el Excel oficial**. Este recurso debe ser investigado e incorporado manualmente por cada carrera.

El formato esperado es un JSON por carrera ubicado en `public/mallas/`. Ejemplo para IIN:

```json
{
  "carrera": "IIN",
  "semestres": [
    {
      "numero": 1,
      "materias": [
        {
          "codigo": "CB100",
          "nombre": "Matemática I",
          "prerrequisitos": []
        },
        {
          "codigo": "CB101",
          "nombre": "Física I",
          "prerrequisitos": []
        }
      ]
    },
    {
      "numero": 2,
      "materias": [
        {
          "codigo": "CB200",
          "nombre": "Matemática II",
          "prerrequisitos": ["CB100"]
        }
      ]
    }
  ]
}
```

---

## Roadmap

- [x] Definición del proyecto y modelo de datos
- [ ] Scaffold del proyecto Next.js
- [ ] Parser del Excel oficial
- [ ] Modelo de base de datos con Prisma
- [ ] Funcionalidad "Cargar Horario" (modo libre)
- [ ] Vista de horario semanal
- [ ] Vista de exámenes con countdown
- [ ] Carga de malla curricular por carrera
- [ ] Funcionalidad "Armar Horario" (modo inteligente)
- [ ] Dashboard personal
- [ ] Deploy web
- [ ] Migración a APK (futuro)

---

## Instalación y uso

```bash

---

## Autor

Proyecto personal para uso académico en la Facultad Politécnica - UNA (Universidad Nacional de Asunción).
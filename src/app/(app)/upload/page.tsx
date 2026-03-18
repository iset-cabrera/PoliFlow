"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UploadStats {
  hojasProcesadas: number;
  totalFilas: number;
  erroresParser: number;
  asignaturasCreadas: number;
  seccionesCreadas: number;
  horariosCreados: number;
  examenesCreados: number;
}

interface CarreraInfo {
  nombre: string;
  sede: string;
  filas: number;
  errores: number;
}

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    stats: UploadStats;
    carreras: CarreraInfo[];
    errors: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    setResult(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar");
      } else {
        setResult({
          stats: data.stats,
          carreras: data.carreras,
          errors: data.errors,
        });
      }
    } catch {
      setError("Error de conexion al subir el archivo");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subir Excel</h1>
        <p className="text-muted-foreground">
          Carga el archivo Excel oficial del semestre con horarios y examenes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Cargar Archivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            {uploading ? (
              <>
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  Procesando {fileName}...
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Esto puede tomar unos segundos
                </p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm font-medium">
                  Arrastra el archivo Excel aqui o haz click para seleccionar
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Formato: .xlsx (Excel oficial de la Facultad Politecnica)
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Excel procesado correctamente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Carreras procesadas" value={result.stats.hojasProcesadas} />
                <Stat label="Filas totales" value={result.stats.totalFilas} />
                <Stat label="Asignaturas" value={result.stats.asignaturasCreadas} />
                <Stat label="Secciones" value={result.stats.seccionesCreadas} />
                <Stat label="Horarios de clase" value={result.stats.horariosCreados} />
                <Stat label="Examenes" value={result.stats.examenesCreados} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle por Carrera</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.carreras.map((c) => (
                  <Badge
                    key={c.nombre}
                    variant={c.errores > 0 ? "destructive" : "secondary"}
                    className="text-sm"
                  >
                    {c.nombre} ({c.sede}) - {c.filas} filas
                    {c.errores > 0 && ` | ${c.errores} errores`}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {result.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">
                  Errores ({result.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button
              onClick={() => {
                setResult(null);
                setFileName("");
              }}
              variant="outline"
            >
              Subir otro archivo
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function UploadPage() {
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
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12">
            <Upload className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium">
              Arrastra el archivo Excel aqui o haz click para seleccionar
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Formato: .xlsx (Excel oficial de la Facultad Politecnica)
            </p>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            El parser del Excel sera implementado en la proxima sesion. El
            archivo sera procesado automaticamente para extraer horarios,
            examenes, profesores y aulas de todas las carreras.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

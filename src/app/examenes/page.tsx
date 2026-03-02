import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";

export default function ExamenesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Examenes</h1>
        <p className="text-muted-foreground">
          Fechas de parciales, finales y revisiones
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Calendario de Examenes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No hay examenes cargados. Primero sube el Excel del semestre y
            selecciona tus materias.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

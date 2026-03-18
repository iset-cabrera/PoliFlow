import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function CargarHorarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cargar Horario</h1>
        <p className="text-muted-foreground">
          Modo libre: elige cualquier materia sin restricciones de
          prerrequisitos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Seleccionar Materias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Primero sube el Excel del semestre para ver las materias
            disponibles. Luego podras seleccionar las que vas a cursar y ver si
            hay choques de horario.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

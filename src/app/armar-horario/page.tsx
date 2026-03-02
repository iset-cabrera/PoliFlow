import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function ArmarHorarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Armar Horario</h1>
        <p className="text-muted-foreground">
          Modo inteligente: selecciona materias aprobadas y el sistema te
          muestra las habilitadas segun la malla curricular
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Armado Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidad requiere que se cargue la malla curricular de tu
            carrera y el Excel del semestre. Proximamente disponible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

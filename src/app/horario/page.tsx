import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function HorarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Horario Semanal</h1>
        <p className="text-muted-foreground">
          Vista de calendario con tus materias seleccionadas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Horario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aun no tienes materias cargadas. Ve a{" "}
            <strong>Cargar Horario</strong> o <strong>Armar Horario</strong>{" "}
            para seleccionar tus materias del semestre.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

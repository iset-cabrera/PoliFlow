import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo decorativo - solo desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-lg">PoliFlow</div>
            <div className="text-xs text-white/70">FPUNA</div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Tu semestre,<br />organizado.
          </h2>
          <p className="text-white/80 max-w-md text-lg">
            Arma tu horario, controla tus examenes y organiza tu semestre academico en la Facultad Politecnica.
          </p>
          <div className="flex gap-6 text-sm text-white/60">
            <div><span className="block text-2xl font-bold text-white">14</span>carreras</div>
            <div><span className="block text-2xl font-bold text-white">950+</span>materias</div>
            <div><span className="block text-2xl font-bold text-white">2100+</span>secciones</div>
          </div>
        </div>

        <p className="text-xs text-white/40">
          Facultad Politecnica — Universidad Nacional de Asuncion
        </p>
      </div>

      {/* Panel derecho con formulario */}
      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

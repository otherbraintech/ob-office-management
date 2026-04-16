import Link from "next/link";
import { Button } from "@/components/ui/button";

import { getSession } from "@/app/actions/auth";

export default async function Home() {
  const session = await getSession();
  const hasSession = !!session;

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-8 text-center bg-background">
      <main className="max-w-xl flex flex-col items-center gap-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          OB-Workspace
        </h1>
        <p className="text-muted-foreground text-lg">
          La plataforma integral para la gestión de tu empresa tecnológica.
        </p>
        <div className="flex gap-4">
          {hasSession ? (
            <Button asChild size="lg">
              <Link href="/dashboard">Ir al Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

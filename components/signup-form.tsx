"use client"

import { useTransition, useState } from "react"
import { signup } from "@/app/actions/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { ModeToggle } from "@/components/mode-toggle"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = await signup(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex justify-end pr-1">
        <ModeToggle />
      </div>
      <Card className="overflow-hidden p-0 border-2 border-foreground/10 bg-background transition-colors duration-500">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form action={handleSubmit} className="p-6 md:p-8 bg-background">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight">Crea tu cuenta</h1>
                <p className="text-balance text-foreground/60 text-sm">
                  Ingresa tus datos a continuación para registrarte
                </p>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-none mb-4 text-center">
                  {error}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="name">Nombre Completo</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Juan Pérez"
                  className="rounded-none border-foreground/20 focus-visible:ring-foreground"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="username">Nombre de Usuario</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="juanp"
                  className="rounded-none border-foreground/20 focus-visible:ring-foreground"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@ejemplo.com"
                  className="rounded-none border-foreground/20 focus-visible:ring-foreground"
                  required
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="Escribe tu contraseña"
                    className="rounded-none border-foreground/20 focus-visible:ring-foreground" 
                    required 
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirmar
                  </FieldLabel>
                  <Input 
                    id="confirm-password" 
                    name="confirm-password" 
                    type="password" 
                    placeholder="Escribe tu contraseña de nuevo"
                    className="rounded-none border-foreground/20 focus-visible:ring-foreground" 
                    required 
                  />
                </Field>
              </div>

              <Field>
                <Button type="submit" className="w-full rounded-none font-bold hover:cursor-pointer" disabled={isPending}>
                  {isPending ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </Field>
              
              <FieldDescription className="text-center pt-2">
                ¿Ya tienes una cuenta? <a href="/login" className="underline underline-offset-4 hover:text-primary font-bold">Inicia sesión</a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-background md:flex md:items-center md:justify-center overflow-hidden border-l border-foreground/10">
            <img
              src="/obom-presentation.svg"
              alt="OB-Workspace"
              className="absolute inset-0 h-full w-full object-contain p-16 invert dark:invert-0 transition-all duration-700"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

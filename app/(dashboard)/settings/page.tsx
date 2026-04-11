import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings2, Bell, Shield, User, Globe, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "@/app/actions/auth";

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Settings2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus preferencias personales y de la cuenta.</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Mi Perfil</CardTitle>
              </div>
              <CardDescription>Esta información será visible para el resto del equipo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" defaultValue={session?.name || ''} placeholder="Tu nombre" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="flex gap-2">
                    <Input id="email" type="email" defaultValue={session?.email || ''} readOnly className="bg-muted" />
                    <Button variant="outline" size="icon" title="Email verificado">
                      <Shield className="h-4 w-4 text-green-500" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol en la Empresa</Label>
                  <Input id="role" defaultValue={session?.role || ''} readOnly className="bg-muted capitalize" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lang">Idioma Preferido</Label>
                  <Input id="lang" defaultValue="Español (España)" readOnly className="bg-muted" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>Guardar Cambios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Preferencias de Notificación</CardTitle>
              </div>
              <CardDescription>Elige cómo y cuándo quieres recibir actualizaciones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Menciones Directas</Label>
                    <p className="text-sm text-muted-foreground">Recibe un correo cuando alguien te mencione en un ticket.</p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Recordatorios de Tiempo</Label>
                    <p className="text-sm text-muted-foreground">Alertas si olvidas iniciar el contador al empezar el día.</p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Resumen Semanal</Label>
                    <p className="text-sm text-muted-foreground">Informe de progreso y horas registradas cada lunes.</p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Actualizar Preferencias</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Seguridad de la Cuenta</CardTitle>
              </div>
              <CardDescription>Protege tu cuenta con contraseñas fuertes y autenticación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 max-w-sm">
                <div className="space-y-2">
                  <Label htmlFor="current-pass">Contraseña Actual</Label>
                  <Input id="current-pass" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pass">Nueva Contraseña</Label>
                  <Input id="new-pass" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pass">Confirmar Contraseña</Label>
                  <Input id="confirm-pass" type="password" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button variant="destructive">Cambiar Contraseña</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

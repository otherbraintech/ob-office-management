import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExpenseType } from '@prisma/client';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { Wallet, Plus, Calendar, Tag, Briefcase } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createExpense } from '@/app/actions/expenses';

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [expenses, projects] = await Promise.all([
    prisma.expense.findMany({
      include: { project: true },
      orderBy: { billDate: 'desc' },
    }),
    prisma.project.findMany()
  ]);

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const recurringExpenses = expenses.filter(exp => exp.type === ExpenseType.RECURRING);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Gastos y Suscripciones</h1>
          </div>
          <p className="text-muted-foreground text-sm">Gestiona los egresos, facturas y pagos recurrentes de la empresa.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario para agregar gasto */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Nuevo Gasto
            </CardTitle>
            <CardDescription>Registra un nuevo movimiento financiero.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createExpense} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Concepto / Categoría</label>
                <Input name="category" placeholder="Ej: AWS, Alquiler, Licencia..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Monto ($)</label>
                  <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Fecha</label>
                  <Input name="billDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Proyecto (Opcional)</label>
                <select name="projectId" className="w-full h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <option value="null">General / Sin Proyecto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Tipo</label>
                <select name="type" className="w-full h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <option value={ExpenseType.INTERNAL}>Gasto Interno</option>
                  <option value={ExpenseType.COMPANY}>Gasto de Empresa</option>
                  <option value={ExpenseType.RECURRING}>Suscripción Recurrente</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Descripción</label>
                <Input name="description" placeholder="Detalles adicionales..." />
              </div>
              <Button type="submit" className="w-full">Registrar Gasto</Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de gastos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gasto Acumulado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Suscripciones Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recurringExpenses.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{exp.category}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(exp.billDate).toLocaleDateString('es-ES')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-normal uppercase">
                          {exp.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{exp.project?.name || 'General'}</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">
                        ${exp.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                        No hay gastos registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

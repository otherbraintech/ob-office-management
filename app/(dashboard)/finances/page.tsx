import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExpenseType } from '@prisma/client';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, PieChart, ReceiptText } from "lucide-react";

export default async function FinancesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const expenses = await prisma.expense.findMany({
    include: { project: true, user: true },
    orderBy: { billDate: 'desc' },
  });

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const monthlyExpenses = expenses
    .filter(exp => new Date(exp.billDate).getMonth() === new Date().getMonth())
    .reduce((acc, exp) => acc + exp.amount, 0);

  const expensesByProject = expenses.reduce((acc: Record<string, number>, exp) => {
    const projectName = exp.project?.name || 'Sin Asignar';
    acc[projectName] = (acc[projectName] || 0) + exp.amount;
    return acc;
  }, {});

  const recurringExpenses = expenses.filter(exp => exp.type === ExpenseType.RECURRING);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
        <p className="text-muted-foreground">Control de gastos, facturación y presupuestos del equipo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Acumulado histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos este Mes</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-green-600 mt-1">Dentro del presupuesto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurrentes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recurringExpenses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Suscripciones activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Todo al día</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Últimos Gastos</CardTitle>
            <CardDescription>Registro detallado de transacciones recientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.slice(0, 5).map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{exp.category}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">{exp.description || 'Sin descripción'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-[10px]">
                        {exp.project?.name || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                       {new Date(exp.billDate).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${exp.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                      No se han registrado gastos aún.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Distribución por Proyecto</CardTitle>
            <CardDescription>Gastos acumulados por cada cliente/proyecto.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(expensesByProject).map(([project, amount]) => (
                <div key={project} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{project}</span>
                    <span className="font-bold">${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(amount / totalExpenses) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(expensesByProject).length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No hay datos de distribución disponibles.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, FileText, Plus } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Facturación</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturado este mes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450.00</div>
            <p className="text-xs text-muted-foreground">+5% vs mes anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Facturas Recientes</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
             <Plus className="h-4 w-4" /> Crear Factura
          </button>
        </div>

        <Card>
           <CardContent className="p-0">
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b bg-muted/50 text-muted-foreground font-medium">
                     <th className="text-left px-4 py-2">Factura</th>
                     <th className="text-left px-4 py-2">Cliente</th>
                     <th className="text-left px-4 py-2">Estado</th>
                     <th className="text-right px-4 py-2">Monto</th>
                   </tr>
                 </thead>
                 <tbody>
                    {[
                      { id: "INV-001", client: "Google", status: "Pagada", amount: "$5,000.00" },
                      { id: "INV-002", client: "Microsoft", status: "Pendiente", amount: "$7,450.00" },
                    ].map((inv, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                         <td className="px-4 py-3 font-semibold text-blue-600">{inv.id}</td>
                         <td className="px-4 py-3">{inv.client}</td>
                         <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${inv.status === 'Pagada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {inv.status}
                            </span>
                         </td>
                         <td className="px-4 py-3 text-right font-bold">{inv.amount}</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Timer, CheckCircle2, ChevronDown, Rocket, AlertTriangle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProfileHistoryProps {
    totalHours: number;
    manHoursCompleted: number;
    tickets: any[];
}

export function ProfileHistory({ totalHours, manHoursCompleted, tickets }: ProfileHistoryProps) {
    const formatTimeSeconds = (seconds: number) => {
        const hrs = Math.floor(Math.abs(seconds) / 3600);
        const mins = Math.floor((Math.abs(seconds) % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m ${Math.abs(seconds) % 60}s`;
    };

    const formatTimeMinutes = (minutes: number) => {
        const hrs = Math.floor(Math.abs(minutes) / 60);
        const mins = Math.abs(minutes) % 60;
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Header - Refined for Pro look */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <Card className="rounded-none border-2 border-foreground/5 bg-background hover:border-primary/20 transition-all group">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horas Totales</CardTitle>
                        <Clock className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black font-mono tracking-tighter">{totalHours}</span>
                            <span className="text-xs font-black uppercase text-muted-foreground">horas</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-none border-2 border-foreground/5 bg-background hover:border-green-500/20 transition-all group">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Productividad HH</CardTitle>
                        <Timer className="size-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black font-mono tracking-tighter">{manHoursCompleted}</span>
                            <span className="text-xs font-black uppercase text-muted-foreground">horas</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-none border-2 border-foreground/5 bg-background hover:border-blue-500/20 transition-all group sm:col-span-2 xl:col-span-1">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Misiones OK</CardTitle>
                        <CheckCircle2 className="size-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black font-mono tracking-tighter">{tickets.filter(t => t.status === 'DONE').length}</span>
                            <span className="text-xs font-black uppercase text-muted-foreground">tickets</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* History List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b-2 border-foreground/5 pb-4">
                    <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                        <Layers className="size-5 text-primary" /> Historial Operativo
                    </h3>
                    <Badge variant="secondary" className="rounded-none font-bold text-[9px] px-2 py-0.5">
                        {tickets.length} REGISTROS
                    </Badge>
                </div>
                
                <div className="space-y-4">
                    {tickets.map(ticket => {
                        const isUnderBudget = ticket.estimatedTime > 0 && ticket.realTime <= (ticket.estimatedTime * 60);
                        const isOverBudget = ticket.estimatedTime > 0 && ticket.realTime > (ticket.estimatedTime * 60);
                        
                        return (
                            <Collapsible key={ticket.id} className="group/collapsible bg-background border-2 border-foreground/5 hover:border-foreground/10 transition-all overflow-hidden">
                                <CollapsibleTrigger className="w-full cursor-pointer">
                                    <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-muted/30 transition-colors text-left gap-4">
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Badge variant="outline" className={cn(
                                                    "rounded-none text-[8px] font-black uppercase px-2 h-4",
                                                    ticket.status === 'DONE' ? "border-green-500/30 text-green-500 bg-green-500/5" : "border-primary/30 text-primary bg-primary/5"
                                                )}>
                                                    {ticket.status}
                                                </Badge>
                                                {ticket.project && (
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground bg-muted/50 px-1.5 rounded-none">
                                                        {ticket.project.name}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-black text-sm md:text-base uppercase tracking-tight truncate group-hover/collapsible:text-primary transition-colors">
                                                {ticket.title}
                                            </h4>
                                        </div>
                                        
                                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t border-foreground/5 md:border-0">
                                            {/* Profit/Loss logic */}
                                            {ticket.status === 'DONE' && (
                                                <div className="flex flex-col items-end">
                                                    {ticket.estimatedTime > 0 ? (
                                                        <>
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Delta Desempeño</span>
                                                            {isUnderBudget ? (
                                                                <div className="flex items-center gap-1 text-green-500 font-mono text-[10px] font-black">
                                                                    <Rocket className="size-3" /> +{formatTimeSeconds((ticket.estimatedTime * 60) - ticket.realTime)}
                                                                </div>
                                                            ) : isOverBudget ? (
                                                                <div className="flex items-center gap-1 text-red-500 font-mono text-[10px] font-black">
                                                                    <AlertTriangle className="size-3" /> -{formatTimeSeconds(ticket.realTime - (ticket.estimatedTime * 60))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] font-mono font-black text-muted-foreground">A TIEMPO</span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Costo Final</span>
                                                            <span className="font-mono font-bold text-[11px]">{formatTimeSeconds(ticket.realTime)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            <ChevronDown className="size-4 text-muted-foreground group-data-[state=open]/collapsible:rotate-180 transition-transform" />
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="bg-muted/5 border-t border-foreground/5 p-5 space-y-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Original Est.</span>
                                                <p className="font-mono text-xs font-bold">{formatTimeMinutes(ticket.estimatedTime)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Real Inv.</span>
                                                <p className="font-mono text-xs font-bold">{formatTimeSeconds(ticket.realTime)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Eficiencia</span>
                                                <p className="font-mono text-xs font-bold">
                                                    {ticket.estimatedTime > 0 
                                                        ? `${Math.round(((ticket.estimatedTime * 60) / (ticket.realTime || 1)) * 100)}%`
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Último Update</span>
                                                <p className="text-[10px] font-bold uppercase">{new Date(ticket.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        {ticket.subtasks && ticket.subtasks.length > 0 && (
                                            <div className="space-y-3 pt-4 border-t border-foreground/5">
                                                <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Análisis Técnico de Subtareas</h5>
                                                <div className="grid gap-2">
                                                    {ticket.subtasks.map((st: any) => (
                                                        <div key={st.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background border border-foreground/5 gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("size-2 rotate-45 shrink-0", st.status === 'DONE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-primary/20')} />
                                                                <span className="text-[10px] font-bold uppercase truncate">{st.title}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-[9px] font-mono shrink-0 justify-end">
                                                                <span className="text-muted-foreground">EST: {st.estimatedTime}m</span>
                                                                <span className={cn(
                                                                    "font-black px-1.5 py-0.5",
                                                                    (st.realTime / 60) > st.estimatedTime ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                                                                )}>
                                                                    REAL: {formatTimeSeconds(st.realTime)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}

                    {tickets.length === 0 && (
                        <div className="text-center py-24 border-2 border-dashed border-foreground/5">
                            <div className="inline-flex size-14 items-center justify-center rounded-none bg-muted mb-4">
                                <Layers className="size-6 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground/60">Sin Historial de Operaciones</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-2">Inicia un ticket para comenzar el despliegue.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

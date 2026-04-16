import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Timer, CheckCircle2, ChevronDown, Rocket, AlertTriangle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProfileHistoryProps {
    totalHours: number;
    tickets: any[];
}

export function ProfileHistory({ totalHours, tickets }: ProfileHistoryProps) {
    const formatTime = (minutes: number) => {
        const hrs = Math.floor(Math.abs(minutes) / 60);
        const mins = Math.abs(minutes) % 60;
        return `${hrs}h ${mins}m`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="rounded-none border-2 border-foreground/5 bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horas Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="size-5 text-primary" />
                            <span className="text-3xl font-black font-mono">{totalHours}h</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-none border-2 border-foreground/5 bg-muted/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Misiones Completadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-5 text-green-500" />
                            <span className="text-3xl font-black font-mono">{tickets.filter(t => t.status === 'DONE').length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* History List */}
            <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 border-b-2 border-foreground/5 pb-2">
                    <Layers className="size-5 text-primary" /> Historial de Operaciones
                </h3>
                
                <div className="space-y-3">
                    {tickets.map(ticket => {
                        const isUnderBudget = ticket.estimatedTime > 0 && ticket.realTime <= ticket.estimatedTime;
                        const isOverBudget = ticket.estimatedTime > 0 && ticket.realTime > ticket.estimatedTime;
                        
                        return (
                            <Collapsible key={ticket.id} className="group/collapsible border-2 border-foreground/5 bg-background">
                                <CollapsibleTrigger className="w-full">
                                    <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <Badge variant="outline" className={cn(
                                                    "rounded-none text-[8px] font-black uppercase px-2",
                                                    ticket.status === 'DONE' ? "border-green-500/30 text-green-500 bg-green-500/5" : "border-primary/30 text-primary bg-primary/5"
                                                )}>
                                                    {ticket.status}
                                                </Badge>
                                                {ticket.project && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                                                        [{ticket.project.name.slice(0, 15)}]
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-black text-sm uppercase tracking-tight truncate group-hover/collapsible:text-primary transition-colors">
                                                {ticket.title}
                                            </h4>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 shrink-0">
                                            {/* Logic for Profit vs Loss in Time */}
                                            {ticket.estimatedTime > 0 ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Delta</span>
                                                    <div className="flex items-center gap-1.5">
                                                        {isUnderBudget ? (
                                                            <Badge variant="outline" className="rounded-none border-green-500 text-green-500 bg-green-500/10 font-mono font-black gap-1">
                                                                <Rocket className="size-3" /> PROFIT +{formatTime(ticket.estimatedTime - ticket.realTime)}
                                                            </Badge>
                                                        ) : isOverBudget ? (
                                                            <Badge variant="outline" className="rounded-none border-red-500 text-red-500 bg-red-500/10 font-mono font-black gap-1">
                                                                <AlertTriangle className="size-3" /> RETRASO -{formatTime(ticket.realTime - ticket.estimatedTime)}
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Costo Real</span>
                                                    <span className="font-mono font-bold text-sm text-muted-foreground">{formatTime(ticket.realTime || 0)}</span>
                                                </div>
                                            )}
                                            <ChevronDown className="size-4 text-muted-foreground group-data-[state=open]/collapsible:rotate-180 transition-transform" />
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="bg-muted/10 border-t-2 border-foreground/5 p-4 space-y-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-foreground/5">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Tiempo Estimado</span>
                                                <p className="font-mono text-sm">{formatTime(ticket.estimatedTime)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Tiempo Invertido</span>
                                                <p className="font-mono text-sm">{formatTime(ticket.realTime)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Autor</span>
                                                <p className="text-xs font-bold truncate">{ticket.creator?.name || 'Sistema'}</p>
                                            </div>
                                        </div>

                                        {ticket.subtasks && ticket.subtasks.length > 0 ? (
                                            <div className="space-y-2">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Desglose de Subtareas</h5>
                                                {ticket.subtasks.map((st: any) => (
                                                    <div key={st.id} className="flex justify-between items-center p-2.5 bg-background border border-foreground/5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("size-1.5 rotate-45 rounded-none", st.status === 'DONE' ? 'bg-green-500' : 'bg-primary/20')} />
                                                            <span className="text-xs font-bold uppercase">{st.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-[10px] font-mono">
                                                            <span className="text-muted-foreground">Est: {st.estimatedTime}m</span>
                                                            <span className={st.realTime > st.estimatedTime ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                                                                Real: {st.realTime}m
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground/60 italic text-center py-4">Este requerimiento no contiene subtareas registradas.</p>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}

                    {tickets.length === 0 && (
                        <div className="text-center py-20 border-4 border-dashed border-foreground/5 opacity-50">
                            <h3 className="text-xl font-black uppercase tracking-widest">Sin Historial</h3>
                            <p className="text-sm font-bold uppercase tracking-tight">El operador aún no ha registrado despliegues.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

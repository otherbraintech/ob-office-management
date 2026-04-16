"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Timer as TimerIcon, StopCircle, CheckCircle2, ListTodo, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getActiveTimers, startShift, stopShift } from "@/app/actions/time";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

export function ShiftManager() {
    const router = useRouter();
    const [openStart, setOpenStart] = useState(false);
    const [openStop, setOpenStop] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Timer states
    const [shiftActive, setShiftActive] = useState(false);
    const [shiftSeconds, setShiftSeconds] = useState(0);
    
    const [ticketActive, setTicketActive] = useState(false);
    const [ticketEstimate, setTicketEstimate] = useState(0);
    const [ticketRealSeconds, setTicketRealSeconds] = useState(0);
    const [activeTicket, setActiveTicket] = useState<any>(null);

    // Initial load
    useEffect(() => {
        let mounted = true;
        getActiveTimers().then(data => {
            if (!mounted || !data) return;
            
            if (data.shift) {
                setShiftActive(true);
                const shiftDiff = Math.floor((new Date().getTime() - new Date(data.shift.startTime).getTime()) / 1000);
                setShiftSeconds(shiftDiff);
            }
            
            if (data.ticketSession && data.ticketSession.ticket) {
                setTicketActive(true);
                const ticketDiff = Math.floor((new Date().getTime() - new Date(data.ticketSession.startTime).getTime()) / 1000);
                const baseRealSeconds = (data.ticketSession.ticket.realTime || 0) * 60;
                setTicketRealSeconds(baseRealSeconds + ticketDiff);
                setTicketEstimate((data.ticketSession.ticket.estimatedTime || 0) * 60);
                setActiveTicket(data.ticketSession.ticket);
            }
        });
        return () => { mounted = false; };
    }, []);

    // Intervals
    // Shift interval
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (shiftActive) {
            interval = setInterval(() => {
                setShiftSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [shiftActive]);

    // Ticket interval
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (ticketActive) {
            interval = setInterval(() => {
                setTicketRealSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [ticketActive]);

    const formatTime = (totalSeconds: number) => {
        const hrs = Math.floor(Math.abs(totalSeconds) / 3600);
        const mins = Math.floor((Math.abs(totalSeconds) % 3600) / 60);
        const secs = Math.abs(totalSeconds) % 60;
        const sign = totalSeconds < 0 ? '-' : '';
        return `${sign}${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStopShift = async (status: 'BACKLOG' | 'TODO' | 'DONE') => {
        setLoading(true);
        try {
            await stopShift(status);
            setShiftActive(false);
            setTicketActive(false);
            setOpenStop(false);
            setActiveTicket(null);
            toast.success("Turno finalizado y registrado");
            router.refresh();
        } catch (e) {
            toast.error("Error al finalizar turno");
        } finally {
            setLoading(false);
        }
    };

    const deltaSeconds = ticketEstimate > 0 ? ticketEstimate - ticketRealSeconds : 0;
    const isDelayed = ticketEstimate > 0 && deltaSeconds < 0;

    return (
        <>
            <div className="flex items-center gap-6 h-full px-4">
                {/* Global Shift Timer */}
                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                            "size-8 rounded-none transition-all",
                            shiftActive ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                        )}
                        onClick={() => shiftActive ? setOpenStop(true) : setOpenStart(true)}
                    >
                        {shiftActive ? <Square className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
                    </Button>
                    <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">
                            Turno Global
                        </span>
                        <span className={cn("font-mono font-bold text-sm leading-tight", shiftActive ? "text-foreground" : "text-muted-foreground/50")}>
                            {formatTime(shiftSeconds)}
                        </span>
                    </div>
                </div>

                {/* Vertical Separator */}
                <div className="h-2/3 w-px bg-border/50" />

                {/* Active Ticket Speedrun Timer */}
                <div className="flex flex-col justify-center min-w-[200px]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none flex items-center gap-1.5">
                        <TimerIcon className={cn("size-2.5", ticketActive && "text-primary animate-pulse")} />
                        Misión Activa
                    </span>
                    {ticketActive && activeTicket ? (
                        <div className="flex items-center justify-between gap-4 mt-0.5">
                            <span className="text-xs font-bold truncate max-w-[150px] uppercase tracking-tighter" title={activeTicket.title}>
                                {activeTicket.title}
                            </span>
                            <span className={cn(
                                "font-mono font-black text-sm",
                                ticketEstimate === 0 ? "text-foreground" : 
                                isDelayed ? "text-red-500" : "text-green-500"
                            )}>
                                {ticketEstimate === 0 ? formatTime(ticketRealSeconds) : formatTime(deltaSeconds)}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs font-medium text-muted-foreground mt-0.5 italic">Esperando asignación...</span>
                    )}
                </div>
            </div>

            {/* Start Shift Dialog (Selection) */}
            <StartShiftDialog open={openStart} setOpen={setOpenStart} onStart={() => {
                setShiftActive(true);
                // The dialog marks what to set as ticket
                window.location.reload(); // Quick refresh to get new state
            }} />

            {/* Stop Shift Dialog (Debrief) */}
            <Dialog open={openStop} onOpenChange={setOpenStop}>
                <DialogContent className="sm:max-w-md rounded-none border-4 border-foreground/5 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <StopCircle className="size-6 text-red-500" /> Finalizar Turno
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                            Resumen de Operaciones
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted/20 border-2 border-foreground/5 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tiempo Total</span>
                                <p className="font-mono font-black text-xl">{formatTime(shiftSeconds)}</p>
                            </div>
                            {activeTicket && (
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Misión Activa</span>
                                    <p className="font-mono font-black text-xl">{formatTime(ticketRealSeconds)}</p>
                                </div>
                            )}
                        </div>

                        {activeTicket && (
                            <div className="space-y-3 pt-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destino del Requerimiento en curso:</p>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start rounded-none border-2 border-foreground/10 h-auto py-3 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30"
                                    onClick={() => handleStopShift('DONE')}
                                    disabled={loading}
                                >
                                    <CheckCircle2 className="size-4 mr-3" />
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-bold uppercase tracking-wide">Misión Cumplida (DONE)</span>
                                        <span className="text-[9px] opacity-70">El requerimiento se marcará como completado.</span>
                                    </div>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start rounded-none border-2 border-foreground/10 h-auto py-3"
                                    onClick={() => handleStopShift('TODO')}
                                    disabled={loading}
                                >
                                    <ListTodo className="size-4 mr-3" />
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-bold uppercase tracking-wide">Pausar en Pendientes (TODO)</span>
                                        <span className="text-[9px] opacity-70">El requerimiento se detendrá y volverá a la cola.</span>
                                    </div>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start rounded-none border-2 border-foreground/10 h-auto py-3 hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/30"
                                    onClick={() => handleStopShift('BACKLOG')}
                                    disabled={loading}
                                >
                                    <AlertTriangle className="size-4 mr-3" />
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-bold uppercase tracking-wide">Devolver al Backlog</span>
                                        <span className="text-[9px] opacity-70">Pausar y relegar al historial del proyecto.</span>
                                    </div>
                                </Button>
                            </div>
                        )}
                        {!activeTicket && (
                            <Button 
                                className="w-full rounded-none font-black uppercase tracking-widest h-12"
                                onClick={() => handleStopShift('BACKLOG')}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="size-4 animate-spin" /> : "Cerrar Registro"}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Subcomponente para aislar la carga de tickets
import { getAvailableTicketsForShift } from "@/app/actions/time";

function StartShiftDialog({ open, setOpen, onStart }: { open: boolean, setOpen: (o: boolean) => void, onStart: () => void }) {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getAvailableTicketsForShift().then(data => {
                setTickets(data);
                setLoading(false);
            });
        }
    }, [open]);

    const handleSelect = async (ticketId: string) => {
        setStarting(true);
        try {
            await startShift(ticketId);
            onStart();
            setOpen(false);
            toast.success("Turno iniciado");
        } catch (e) {
            toast.error("Error al iniciar turno");
        } finally {
            setStarting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl rounded-none border-4 border-foreground/5 p-6 h-[80vh] flex flex-col">
                <DialogHeader className="shrink-0 mb-4">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <Play className="size-6 text-primary" /> Iniciar Protocolo de Trabajo
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                        Selecciona un requerimiento para comenzar a acumular tiempo
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                        <Loader2 className="size-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ScrollArea className="flex-1 border-2 border-foreground/5 bg-muted/10 p-2">
                        <div className="space-y-2">
                            {tickets.map(t => (
                                <button 
                                    key={t.id}
                                    disabled={starting}
                                    onClick={() => handleSelect(t.id)}
                                    className="w-full text-left p-4 bg-background border-2 border-foreground/5 hover:border-primary/40 focus:border-primary focus:bg-primary/5 outline-none transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="rounded-none text-[8px] font-black px-1.5 py-0 border-primary/20 bg-primary/5 text-primary">
                                            {t.priority}
                                        </Badge>
                                        {t.estimatedTime > 0 && (
                                            <span className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                <TimerIcon className="size-3" /> {Math.round(t.estimatedTime / 60)}h
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors pr-6">
                                        {t.title}
                                    </h4>
                                    <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 group-focus:opacity-100 group-focus:translate-x-0">
                                        {starting ? <Loader2 className="size-5 animate-spin text-primary" /> : <Play className="size-5 text-primary" />}
                                    </div>
                                </button>
                            ))}
                            {tickets.length === 0 && (
                                <div className="p-12 text-center flex flex-col items-center gap-6 text-muted-foreground">
                                    <CheckCircle2 className="size-16 text-primary/30" />
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Matriz Despejada</h3>
                                        <p className="text-[12px] font-bold uppercase tracking-tight opacity-60">No hay misiones perfiladas en "Por Hacer" (TODO).</p>
                                    </div>
                                    <Button 
                                        onClick={() => {
                                            setOpen(false);
                                            window.location.href = '/kanban';
                                        }}
                                        className="rounded-none font-black uppercase tracking-widest h-12 mt-4 px-8"
                                    >
                                        Ir al Tablero Kanban
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}

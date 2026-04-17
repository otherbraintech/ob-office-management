'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assignTicket, updateSubtaskTime, addSubtaskToTicket, deleteSubtask, unassignTicket, rebuildTicketSubtasks, reorderSubtask, cancelTicket, completeTicket } from '@/app/actions/tickets';
import { Textarea } from '@/components/ui/textarea';
import { completeSubtask } from '@/app/actions/time';
import { suggestSubtasksAI, improveSubtaskTextAI, regenerateFullSubtasksAI } from '@/app/actions/ai-tools';
import { Clock, Plus, Trash2, CheckCircle2, UserPlus, Sparkles, X, User, LayoutList, Loader2, UserCheck, ArrowUp, ArrowDown, Check, ChevronsUpDown, Pencil, Play, Square, PauseCircle, XCircle } from 'lucide-react';
import { toast } from "sonner";
import { startShift, pauseActiveTicket, resumeTicket } from '@/app/actions/time';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatarProfile } from "./user-avatar-profile";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function TicketCard({ 
    ticket, 
    currentUserId, 
    allUsers = []
}: { 
    ticket: any, 
    currentUserId: string,
    allUsers?: any[] 
}) {
    const [isAssigning, setIsAssigning] = useState(false);
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newSubtaskTime, setNewSubtaskTime] = useState(30);
    const [isAILoading, setIsAILoading] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [localSubtasks, setLocalSubtasks] = useState([...ticket.subtasks].sort((a, b) => a.order - b.order));
    const [localLeadId, setLocalLeadId] = useState(ticket.leadId);
    const [localCollaboratorIds, setLocalCollaboratorIds] = useState<string[]>(ticket.collaborators?.map((c: any) => c.id) || []);
    const [isSyncing, setIsSyncing] = useState(false);
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    
    // Total Ticket Estimate Summary
    const totalEstimateSeconds = localSubtasks.reduce((acc: number, st: any) => acc + ((st.estimatedTime || 0) * 60), 0);

    // Cancel & Completion Forms
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReasonText, setCancelReasonText] = useState('');
    const [showCompletionForm, setShowCompletionForm] = useState(false);
    const [completionCommentText, setCompletionCommentText] = useState('');

    // Speedrun Execution States
    const [activeSpeedrunId, setActiveSpeedrunId] = useState<string | null>(null);
    const [speedrunSeconds, setSpeedrunSeconds] = useState(0);
    const [totalRealSeconds, setTotalRealSeconds] = useState(ticket.realTime || 0);
    const [isMasterActive, setIsMasterActive] = useState(false);
    const [pausedSubtaskTimes, setPausedSubtaskTimes] = useState<Record<string, number>>({});
    const startSubtaskTimer = (stId: string, resumeFromSeconds?: number) => {
        const offset = resumeFromSeconds || 0;
        setActiveSpeedrunId(stId);
        setSpeedrunSeconds(offset);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`speedrun_active_${ticket.id}`, stId);
            // Start stamp offset so elapsed calc = now - (now - offset) = offset
            localStorage.setItem(`speedrun_start_${stId}`, (Date.now() - offset * 1000).toString());
            // Clear any paused state
            localStorage.removeItem(`speedrun_paused_${ticket.id}`);
            localStorage.removeItem(`speedrun_paused_secs_${stId}`);
        }
    };

    const pauseSubtaskTimer = () => {
        if (activeSpeedrunId && typeof window !== 'undefined') {
            // Guardar segundos acumulados para restaurar después
            localStorage.setItem(`speedrun_paused_${ticket.id}`, activeSpeedrunId);
            localStorage.setItem(`speedrun_paused_secs_${activeSpeedrunId}`, speedrunSeconds.toString());
            localStorage.removeItem(`speedrun_active_${ticket.id}`);
            localStorage.removeItem(`speedrun_start_${activeSpeedrunId}`);
        }
        setActiveSpeedrunId(null);
        // NO resetear speedrunSeconds — se conserva visualmente
    };

    const stopSubtaskTimer = () => {
        if (typeof window !== 'undefined') {
            // Limpiar todo: activo y pausado
            const pausedId = localStorage.getItem(`speedrun_paused_${ticket.id}`);
            if (pausedId) {
                localStorage.removeItem(`speedrun_paused_secs_${pausedId}`);
            }
            localStorage.removeItem(`speedrun_active_${ticket.id}`);
            localStorage.removeItem(`speedrun_paused_${ticket.id}`);
            if (activeSpeedrunId) {
                localStorage.removeItem(`speedrun_start_${activeSpeedrunId}`);
            }
        }
        setActiveSpeedrunId(null);
        setSpeedrunSeconds(0);
    };

    const formatChronometer = (seconds: number) => {
        const hrs = Math.floor(Math.abs(seconds) / 3600);
        const mins = Math.floor((Math.abs(seconds) % 3600) / 60);
        const secs = Math.abs(seconds) % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    function MovingMilli({ active }: { active: boolean }) {
        const [m, setM] = useState(0);
        useEffect(() => {
            if (!active) return;
            const interval = setInterval(() => {
                setM(prev => (prev + 7) % 100);
            }, 50);
            return () => clearInterval(interval);
        }, [active]);
        return <span className="text-xl opacity-40 leading-none tabular-nums">.{active ? m.toString().padStart(2, '0') : '00'}</span>;
    }

    // Persistence between revalidations & Refresh (F5)
    useEffect(() => {
        setLocalSubtasks([...ticket.subtasks].sort((a, b) => a.order - b.order));
        setLocalLeadId(ticket.leadId);
        setLocalCollaboratorIds(ticket.collaborators?.map((c: any) => c.id) || []);
        
        if (typeof window !== 'undefined') {
            // 1. Recover Subtask Timer (Only if ticket is active)
            const runningId = localStorage.getItem(`speedrun_active_${ticket.id}`);
            if (runningId && ticket.isActive) {
                const startStamp = localStorage.getItem(`speedrun_start_${runningId}`);
                if (startStamp) {
                    const elapsed = Math.floor((Date.now() - parseInt(startStamp)) / 1000);
                    setActiveSpeedrunId(runningId);
                    setSpeedrunSeconds(elapsed > 0 ? elapsed : 0);
                }
            } else {
                setActiveSpeedrunId(null);
            }

            // 2. Recover Master Mission Timer
            const localMissionStart = localStorage.getItem(`mission_start_${ticket.id}`);
            
            if (localMissionStart) {
                const elapsed = Math.floor((Date.now() - parseInt(localMissionStart)) / 1000);
                setTotalRealSeconds((ticket.realTime || 0) + elapsed);
                setIsMasterActive(true);
            } else if (ticket.isActive && ticket.lastStartedAt) {
                // Telemetría Oficial del Servidor
                const elapsed = Math.floor((Date.now() - new Date(ticket.lastStartedAt).getTime()) / 1000);
                setTotalRealSeconds((ticket.realTime || 0) + elapsed);
                setIsMasterActive(true);
            } else {
                setTotalRealSeconds(ticket.realTime || 0);
                setIsMasterActive(false);
            }
            // 3. Scan for all paused subtask times
            const pausedMap: Record<string, number> = {};
            localSubtasks.forEach(st => {
                const s = localStorage.getItem(`speedrun_paused_secs_${st.id}`);
                if (s) pausedMap[st.id] = parseInt(s);
            });
            setPausedSubtaskTimes(pausedMap);
        }
    }, [ticket.id, ticket.subtasks, ticket.leadId, ticket.collaborators, ticket.isActive, ticket.lastStartedAt, ticket.realTime, localSubtasks.length]);

    // Speedrun Interval Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeSpeedrunId) {
            interval = setInterval(() => {
                setSpeedrunSeconds((s: number) => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeSpeedrunId]);

    // Master Ticket Interval Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (ticket.status === 'IN_PROGRESS' && isMasterActive) {
            interval = setInterval(() => {
                setTotalRealSeconds((s: number) => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [ticket.status, isMasterActive]);

    const handleToggleSpeedrun = (stId: string) => {
        if (activeSpeedrunId === stId) {
            stopSubtaskTimer(); // Pause
        } else {
            startSubtaskTimer(stId);
        }
    };

    const handleCompleteSpeedrun = async (stId: string) => {
        const addedSeconds = speedrunSeconds;
        try {
            const res = await completeSubtask(stId, addedSeconds);
            const currentOrder = localSubtasks.find(s => s.id === stId)?.order ?? -1;
            const newSubtasks = localSubtasks.map(s => s.id === stId ? { ...s, status: 'DONE', realTime: (s.realTime || 0) + addedSeconds } : s);
            setLocalSubtasks(newSubtasks);
            stopSubtaskTimer();
            toast.success('Fragmento completado.');

            if (res.allDone) {
                toast.success('¡OPERACIÓN FINALIZADA! Todas las subtareas completadas.');
                pauseSubtaskTimer();
                setIsMasterActive(false);
                setShowCompletionForm(true);
            } else {
                // Auto-Secuencia: Iniciar la siguiente tarea disponible
                const nextSubtask = [...newSubtasks].sort((a,b) => a.order - b.order).find(s => s.order > currentOrder && s.status !== 'DONE' && !s.id.startsWith('new-'));
                if (nextSubtask) {
                    setTimeout(() => startSubtaskTimer(nextSubtask.id), 500);
                    toast.info(`Auto-Secuencia: Desplegando '${nextSubtask.title}'`);
                }
            }
        } catch {
            toast.error('No se pudo sincronizar el tiempo.');
        }
    };

    const handleMasterStart = async () => {
        if (!localLeadId) {
            toast.error("SIN ABORTAR: Se requiere asignar un Comandante/Responsable antes de iniciar misiones secundarias.");
            return;
        }
        setIsSyncing(true);
        try {
            const res = await resumeTicket(ticket.id);
            if (res.error) {
                // Try startShift just in case
                const shiftRes = await startShift(ticket.id);
                if (!shiftRes.success) {
                    toast.error(res.error);
                    return;
                }
            }

            // Marcar inicio de misión en disco
            if (typeof window !== 'undefined') {
                localStorage.setItem(`mission_start_${ticket.id}`, Date.now().toString());
            }
            setIsMasterActive(true);

            toast.success("Misión Global en Marcha");
            
            // Intentar reanudar subtarea pausada
            if (typeof window !== 'undefined') {
                const pausedSubtaskId = localStorage.getItem(`speedrun_paused_${ticket.id}`);
                if (pausedSubtaskId) {
                    const savedSecs = parseInt(localStorage.getItem(`speedrun_paused_secs_${pausedSubtaskId}`) || '0');
                    startSubtaskTimer(pausedSubtaskId, savedSecs);
                    toast.info(`Reanudando subtarea desde ${formatChronometer(savedSecs)}`);
                    return;
                }
            }

            // Auto-start first subtask si no había ninguna pausada
            const firstSubtask = [...localSubtasks].sort((a,b) => a.order - b.order).find(s => s.status !== 'DONE' && !s.id.startsWith('new-'));
            if (firstSubtask && !activeSpeedrunId) {
                startSubtaskTimer(firstSubtask.id);
            }
        } catch (e) {
            toast.error("Error al arrancar misión");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleMasterPause = async () => {
        setIsMasterActive(false);
        pauseSubtaskTimer();
        if (typeof window !== 'undefined') {
            localStorage.removeItem(`mission_start_${ticket.id}`);
        }
        setIsSyncing(true);
        try {
            await pauseActiveTicket();
            toast.info("Misión Pausada");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleMasterCancel = async () => {
        if (!cancelReasonText.trim()) {
            toast.error('Debes indicar un motivo para cancelar.');
            return;
        }
        setIsSyncing(true);
        try {
            await pauseActiveTicket();
            const res = await cancelTicket(ticket.id, cancelReasonText.trim());
            if (res.error) toast.error(res.error);
            else {
                toast.success("Misión Cancelada");
                stopSubtaskTimer();
                setIsMasterActive(false);
                setShowCancelForm(false);
                setCancelReasonText('');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(`mission_start_${ticket.id}`);
                }
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCompleteTicket = async () => {
        setIsSyncing(true);
        try {
            await pauseActiveTicket();
            const res = await completeTicket(ticket.id, completionCommentText.trim() || undefined);
            if (res.error) toast.error(res.error);
            else {
                toast.success('¡Ticket Completado!');
                stopSubtaskTimer();
                setIsMasterActive(false);
                setShowCompletionForm(false);
                setCompletionCommentText('');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(`mission_start_${ticket.id}`);
                }
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const isDirty = (JSON.stringify(localSubtasks) !== JSON.stringify([...ticket.subtasks].sort((a, b) => a.order - b.order))) ||  
                    (localLeadId !== ticket.leadId) ||
                    (JSON.stringify([...localCollaboratorIds].sort()) !== JSON.stringify((ticket.collaborators?.map((c: any) => c.id) || []).sort()));

    const isLocked = ticket.status !== 'TODO' && ticket.status !== 'BACKLOG';

    const handleAssign = (userId: string) => {
        if (localLeadId === userId) {
            // Si es el líder, lo quitamos por completo
            setLocalLeadId(null);
        } else if (localCollaboratorIds.includes(userId)) {
            // Si es colaborador, lo quitamos
            setLocalCollaboratorIds(prev => prev.filter(id => id !== userId));
        } else {
            // Si no está, lo añadimos
            if (!localLeadId) {
                setLocalLeadId(userId);
            } else {
                setLocalCollaboratorIds(prev => [...prev, userId]);
            }
        }
    };

    const handleUnassign = () => {
        setLocalLeadId(null);
        setLocalCollaboratorIds([]);
    };

    const handleAddTime = (subtaskId: string, delta: number) => {
        setLocalSubtasks(prev => prev.map(st => 
            st.id === subtaskId ? { ...st, estimatedTime: Math.max(5, st.estimatedTime + delta) } : st
        ));
    };

    const handleReorderLocal = (subtaskId: string, direction: 'UP' | 'DOWN') => {
        const index = localSubtasks.findIndex(st => st.id === subtaskId);
        if (index === -1) return;
        
        const newSubtasks = [...localSubtasks];
        if (direction === 'UP' && index > 0) {
            [newSubtasks[index - 1], newSubtasks[index]] = [newSubtasks[index], newSubtasks[index - 1]];
        } else if (direction === 'DOWN' && index < newSubtasks.length - 1) {
            [newSubtasks[index + 1], newSubtasks[index]] = [newSubtasks[index], newSubtasks[index + 1]];
        }
        
        setLocalSubtasks(newSubtasks.map((st, i) => ({ ...st, order: i })));
    };

    const handleLocalDelete = (subtaskId: string) => {
        setLocalSubtasks(prev => prev.filter(st => st.id !== subtaskId).map((st, i) => ({ ...st, order: i })));
    };

    const handleSync = async () => {
        try {
            setIsSyncing(true);
            
            // 1. Sync Assignees if changed
            const currentCollaboratorIds = ticket.collaborators?.map((c: any) => c.id) || [];
            if (localLeadId !== ticket.leadId || JSON.stringify([...localCollaboratorIds].sort()) !== JSON.stringify(currentCollaboratorIds.sort())) {
                const { updateTicketAssignees } = await import('@/app/actions/tickets');
                await updateTicketAssignees(ticket.id, localLeadId, localCollaboratorIds);
            }

            // 2. Sync Subtasks
            const res = await rebuildTicketSubtasks(ticket.id, localSubtasks.map(st => ({ 
                title: st.title, 
                estimatedTime: st.estimatedTime 
            })));
            
            if (res.error) {
                alert("Error al guardar sub-tareas: " + res.error);
            }
        } catch (e) {
            alert("Error crítico al sincronizar datos.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAddNewSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;
        const newSt = {
            id: `temp-${Date.now()}`,
            title: newSubtaskTitle,
            estimatedTime: newSubtaskTime,
            order: localSubtasks.length,
            status: 'TODO'
        };
        setLocalSubtasks([...localSubtasks, newSt]);
        setNewSubtaskTitle('');
        setIsAddingSubtask(false);
    };

    const handleAISuggest = async () => {
        setIsAILoading(true);
        setIsAddingSubtask(true);
        const existingTitles = ticket.subtasks.map((st: any) => st.title);
        const res = await suggestSubtasksAI(ticket.title, ticket.description || '', existingTitles);
        if (res.data && res.data.length > 0) {
            const suggestion = res.data[0];
            setNewSubtaskTitle(suggestion.title);
            setNewSubtaskTime(suggestion.estimatedTime);
        }
        setIsAILoading(false);
    };

    const handleAIRegenerate = async () => {
        setIsAILoading(true);
        const res = await regenerateFullSubtasksAI(ticket.title || 'Nuevo Requerimiento', ticket.description || 'Sin descripción detallada');
        if (res.data) {
            await rebuildTicketSubtasks(ticket.id, res.data);
            setLocalSubtasks(res.data.map((st: any, i: number) => ({
                ...st,
                id: `ai-${Date.now()}-${i}`,
                order: i,
                status: 'TODO'
            })));
        }
        setIsAILoading(false);
    };

    return (
        <div className="flex flex-col bg-background min-h-[90vh] md:min-h-0">
            {/* Mission Hero Header */}
            <div className="relative overflow-hidden border-b-2 border-foreground/10 bg-muted/30 px-6 py-8 md:px-12 md:py-12">
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-none bg-primary text-primary-foreground font-black text-[10px] tracking-[0.2em] px-3 py-1 uppercase shadow-xl shadow-primary/20">
                                Ticket #{ticket.id.slice(-4).toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={cn(
                                "rounded-none border-2 font-black text-[10px] tracking-widest px-3 py-1 uppercase",
                                ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? "border-red-500/50 text-red-500 bg-red-500/5" : "border-primary/50 text-primary bg-primary/5"
                            )}>
                                {ticket.priority === 'URGENT' ? 'Criterio Crítico' : 
                                 ticket.priority === 'HIGH' ? 'Prioridad Alta' : 
                                 ticket.priority === 'MEDIUM' ? 'Prioridad Media' : 'Prioridad Baja'}
                            </Badge>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none text-foreground">
                            {ticket.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-none border-foreground/10 bg-foreground/5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                                Est. Total: {(() => {
                                    const totalMinutes = localSubtasks.reduce((acc: number, cur: any) => acc + cur.estimatedTime, 0);
                                    return formatChronometer(totalMinutes * 60);
                                })()}
                            </Badge>
                            <Badge variant="outline" className="rounded-none border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                                Estado: {
                                    ticket.status === 'TODO' ? 'Por Hacer' :
                                    ticket.status === 'IN_PROGRESS' ? 'En Operación' :
                                    ticket.status === 'DONE' ? 'Finalizado' :
                                    ticket.status === 'CANCELLED' ? 'Anulado' :
                                    ticket.status === 'BACKLOG' ? 'Backlog' :
                                    ticket.status
                                }
                            </Badge>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground/80 font-medium leading-relaxed max-w-xl">
                            {ticket.description || "Sin descripción detallada."}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-right">Proyecto:</span>
                         <span className="text-sm font-bold uppercase tracking-tight text-foreground/60 border-b-2 border-primary/20 pb-1">
                            {ticket.project?.name || ticket.module?.project?.name || "Sin Clasificar"}
                         </span>
                    </div>
                </div>
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] flex-1">
                {/* Main Content Area */}
                <div className="p-6 md:p-12 space-y-12">
                    
                    {/* Subtasks / Fragments */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b-2 border-foreground/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10">
                                    <LayoutList className="size-5 text-primary" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tighter">Lista de Tareas</h3>
                                <Badge variant="secondary" className="rounded-none font-bold text-[10px] px-2 bg-foreground/5">
                                    {localSubtasks.length}
                                </Badge>
                                {isDirty && (
                                    <span className="text-[10px] font-bold text-primary italic animate-pulse lowercase ml-2 flex items-center gap-1">
                                        (Cambios sin sincronizar)
                                    </span>
                                )}
                            </div>

                            {!isLocked && (
                                <div className="flex items-center gap-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all cursor-pointer">
                                                <Sparkles className="size-3 mr-2" /> Recrear Subtareas
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-none border-4 border-foreground/5">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="font-black uppercase tracking-tighter text-xl">¿Re-Estructurar Tareas?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-xs font-medium uppercase tracking-wide leading-relaxed">
                                                    Esta acción utilizará inteligencia artificial para regenerar totalmente la secuencia de trabajo basado en la descripción actual. Se perderán las tareas existentes.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-8">
                                                <AlertDialogCancel className="rounded-none font-bold uppercase text-[10px] cursor-pointer">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleAIRegenerate} className="rounded-none font-black uppercase text-[10px] px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 cursor-pointer">
                                                    Continuar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button 
                                        onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 rounded-none border-2 border-foreground/10 text-[10px] font-black uppercase tracking-widest hover:border-primary/50 transition-all cursor-pointer"
                                    >
                                        <Plus className="size-3 mr-2" /> Añadir Tarea
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Add Subtask Inline Form */}
                        {isAddingSubtask && (
                            <div className="p-6 bg-primary/5 border-2 border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex gap-4">
                                    <Input 
                                        placeholder="Título de la tarea..." 
                                        className="rounded-none bg-background border-2 border-foreground/10 font-bold focus-visible:ring-primary"
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewSubtask()}
                                    />
                                    <Button onClick={handleAISuggest} disabled={isAILoading} size="icon" className="shrink-0 size-11 rounded-none bg-primary hover:bg-primary/80">
                                        {isAILoading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tiempo Estimado (minutos):</span>
                                        <Input 
                                            type="number" 
                                            className="w-20 rounded-none h-8 text-xs font-black border-2 border-foreground/10"
                                            value={newSubtaskTime}
                                            onChange={(e) => setNewSubtaskTime(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="font-bold text-[10px] uppercase cursor-pointer" onClick={() => setIsAddingSubtask(false)}>Cancelar</Button>
                                        <Button size="sm" className="rounded-none font-black text-[10px] uppercase px-8 cursor-pointer" onClick={handleAddNewSubtask}>Confirmar</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Subtasks List */}
                        <div className="space-y-3 relative">
                            {isAILoading && (
                                <div className="absolute inset-x-[-8px] inset-y-[-8px] z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="size-10 text-primary animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Sincronizando IA</span>
                                    </div>
                                </div>
                            )}

                            {localSubtasks.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-foreground/5 opacity-40">
                                    <LayoutList className="size-12 mb-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">Sin tareas asignadas</span>
                                </div>
                            ) : (
                                localSubtasks.map((st: any) => (
                                    <div 
                                        key={st.id} 
                                        className={cn(
                                            "group relative flex items-center gap-4 p-4 border-l-4 transition-colors duration-200",
                                            activeSpeedrunId === st.id ? "bg-primary/5 border-primary shadow-xl shadow-primary/5" : 
                                            st.status === 'DONE' ? "bg-muted/10 border-green-500/30" : "bg-muted/20 border-foreground/10 hover:border-foreground/30 hover:bg-muted/30"
                                        )}
                                    >
                                        {/* Drag/Reorder Handles (Hidden if locked) */}
                                        {!isLocked && (
                                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleReorderLocal(st.id, 'UP')} className="p-1 hover:bg-green-500/10 hover:text-green-500 transition-all cursor-pointer"><ArrowUp className="size-3" /></button>
                                                <button onClick={() => handleReorderLocal(st.id, 'DOWN')} className="p-1 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer"><ArrowDown className="size-3" /></button>
                                            </div>
                                        )}

                                        <div className="flex-1 space-y-2">
                                            {editingSubtaskId === st.id ? (
                                                <div className="flex gap-2">
                                                    <Input 
                                                        autoFocus
                                                        value={editingTitle}
                                                        onChange={(e) => setEditingTitle(e.target.value)}
                                                        className="h-8 rounded-none border-2 border-primary/30 font-bold"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                setLocalSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, title: editingTitle } : s));
                                                                setEditingSubtaskId(null);
                                                            }
                                                        }}
                                                    />
                                                    <Button size="icon" className="h-8 w-8 rounded-none cursor-pointer" onClick={() => {
                                                        setLocalSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, title: editingTitle } : s));
                                                        setEditingSubtaskId(null);
                                                    }}><Check className="size-4" /></Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "text-sm font-black uppercase tracking-tight",
                                                        st.status === 'DONE' && "line-through text-foreground"
                                                    )}>
                                                        {st.title}
                                                    </span>
                                                    {!isLocked && st.status !== 'DONE' && (
                                                        <button 
                                                            onClick={() => { setEditingSubtaskId(st.id); setEditingTitle(st.title); }}
                                                            className="opacity-0 group-hover:opacity-40 hover:opacity-100 transition-all cursor-pointer"
                                                        >
                                                            <Pencil className="size-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 md:gap-6 whitespace-nowrap">
                                                {/* Timer Tags */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground/40">Estimado</span>
                                                    <div className="flex items-center gap-1">
                                                        {!isLocked && st.status !== 'DONE' && <button onClick={() => handleAddTime(st.id, -5)} className="size-4 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 text-xs cursor-pointer">-</button>}
                                                        <span className="text-sm font-mono font-black bg-foreground/5 px-3 py-1">{formatChronometer(st.estimatedTime * 60)}</span>
                                                        {!isLocked && st.status !== 'DONE' && <button onClick={() => handleAddTime(st.id, 5)} className="size-4 flex items-center justify-center hover:bg-green-500/10 hover:text-green-500 text-xs cursor-pointer">+</button>}
                                                    </div>
                                                </div>

                                                {st.status === 'DONE' && (
                                                    <div className="flex items-center gap-2 border-l-2 border-foreground/5 pl-4 ml-2">
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground/40 shrink-0">Completado</span>
                                                        <div className="flex items-center gap-2 font-mono text-sm font-black">
                                                            <span className="text-foreground/80">
                                                                {formatChronometer(st.realTime || 0)}
                                                            </span>
                                                            {(st.realTime || 0) !== (st.estimatedTime * 60) && (
                                                                <span className={cn(
                                                                    "tracking-tight",
                                                                    (st.realTime || 0) > (st.estimatedTime * 60) ? "text-red-500" : "text-green-500"
                                                                )}>
                                                                    {(st.realTime || 0) > (st.estimatedTime * 60) ? "+" : "-"} {formatChronometer(Math.abs((st.realTime || 0) - (st.estimatedTime * 60)))}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {activeSpeedrunId === st.id && (
                                                    <div className="flex items-center gap-2 border-l-2 border-primary/20 pl-4 ml-2">
                                                        <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest shrink-0">Ejecutando</span>
                                                        <div className="flex items-center gap-2 font-mono text-sm font-black">
                                                            <span className="text-amber-400">
                                                                {formatChronometer(speedrunSeconds)}<MovingMilli active={true} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {st.status !== 'DONE' && activeSpeedrunId !== st.id && pausedSubtaskTimes[st.id] > 0 && (
                                                    <div className="flex items-center gap-2 border-l-2 border-amber-500/20 pl-4 ml-2">
                                                        <span className="text-[9px] font-black uppercase text-amber-500/60 shrink-0">Pausado</span>
                                                        <span className="text-amber-400 font-mono text-sm font-black italic">
                                                            {formatChronometer(pausedSubtaskTimes[st.id])}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button for subtask */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {activeSpeedrunId === st.id && (
                                                <Button 
                                                    size="sm" 
                                                    className="rounded-none bg-green-500 hover:bg-green-600 text-[9px] font-black uppercase px-4 h-8 animate-in zoom-in-50 duration-300 cursor-pointer shrink-0"
                                                    onClick={() => handleCompleteSpeedrun(st.id)}
                                                >
                                                    Finalizar <CheckCircle2 className="size-3.5 ml-2" />
                                                </Button>
                                            )}
                                            
                                            {!isLocked && st.status !== 'DONE' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="size-8 rounded-none opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                                    onClick={() => handleLocalDelete(st.id)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            )}

                                            {st.status === 'DONE' && (
                                                <div className="size-8 flex items-center justify-center text-green-500">
                                                    <CheckCircle2 className="size-5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="bg-muted/20 border-l-2 border-foreground/5 flex flex-col min-h-full">
                    
                    {/* Telemetry Block */}
                    <div className="p-6 border-b-2 border-foreground/5 bg-background">
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2">
                                    <Clock className={cn("size-3", isMasterActive && "text-primary animate-pulse")} /> 
                                    Cronómetro de Ticket
                                </span>
                                <div className="flex flex-col">
                                    <div className={cn(
                                        "text-5xl font-mono font-black tracking-tighter tabular-nums leading-none",
                                        isMasterActive ? "text-amber-400" : 
                                        (ticket.status === 'DONE' || ticket.status === 'TESTING' || totalRealSeconds > 0) ? "text-foreground" :
                                        "text-muted-foreground/20"
                                    )}>
                                        {formatChronometer(totalRealSeconds)}<MovingMilli active={isMasterActive} />
                                    </div>

                                    {(totalRealSeconds > 0 || isMasterActive) && (
                                        <div className={cn(
                                            "text-3xl font-mono font-black tracking-tight self-end mt-1 px-2 py-0.5",
                                            totalRealSeconds <= totalEstimateSeconds ? "text-green-500 bg-green-500/5" : "text-red-500 bg-red-500/5 ripple-excess"
                                        )}>
                                            {totalRealSeconds <= totalEstimateSeconds ? "-" : "+"}
                                            {formatChronometer(Math.abs(totalRealSeconds - totalEstimateSeconds))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {!isMasterActive && ticket.status !== 'DONE' && ticket.status !== 'CANCELLED' && (
                                    <Button 
                                        onClick={handleMasterStart} 
                                        className="h-14 rounded-none bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                        disabled={isSyncing}
                                    >
                                        {(ticket.realTime || 0) > 0 || ticket.status === 'IN_PROGRESS' ? 'Reanudar Trabajo' : 'Iniciar Trabajo'}
                                    </Button>
                                )}
                                {isMasterActive && (
                                    <Button 
                                        variant="outline"
                                        onClick={handleMasterPause} 
                                        className="h-12 rounded-none border-4 border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-white font-black uppercase tracking-[0.2em] transition-all cursor-pointer"
                                        disabled={isSyncing}
                                    >
                                        <PauseCircle className="size-5 mr-3" /> Pausar Tiempo
                                    </Button>
                                )}
                                
                                {isDirty && !isLocked && !isSyncing && (
                                    <Button 
                                        onClick={handleSync}
                                        className="h-12 rounded-none bg-green-600 hover:bg-green-700 font-black uppercase tracking-widest animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
                                    >
                                        Guardar Cambios
                                    </Button>
                                )}
                                {isSyncing && (
                                    <Button disabled className="h-12 rounded-none opacity-50 font-black uppercase tracking-widest">
                                        <Loader2 className="size-4 animate-spin mr-3" /> Procesando
                                    </Button>
                                )}
                            </div>
                            
                            {/* Cancellation Trigger */}
                            {ticket.status !== 'DONE' && ticket.status !== 'CANCELLED' && (
                                <button 
                                    onClick={() => setShowCancelForm(!showCancelForm)}
                                    className="w-full text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-red-500 transition-colors pt-2 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Operational Details */}
                    <div className="p-6 flex-1 space-y-10 overflow-y-auto no-scrollbar">
                        
                        {/* Team Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Equipo Responsable</span>
                                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <button 
                                            disabled={isLocked || isMasterActive}
                                            className="text-muted-foreground/30 hover:text-primary transition-all cursor-pointer disabled:opacity-0"
                                        >
                                            <Plus className="size-3" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="rounded-none border-4 border-foreground/10 p-0 w-[280px]" align="end">
                                        <Command className="rounded-none">
                                            <CommandInput placeholder="Filtrar operadores..." className="h-10 text-xs font-bold uppercase" />
                                            <CommandList>
                                                <CommandEmpty className="p-4 text-[10px] font-bold text-center uppercase">Sin coincidencias</CommandEmpty>
                                                <CommandGroup>
                                                    {allUsers.map((u) => (
                                                        <CommandItem key={u.id} onSelect={() => handleAssign(u.id)} className="p-3 cursor-pointer hover:bg-primary/5">
                                                            <div className="flex items-center gap-3 w-full">
                                                                <Avatar className="size-8 rounded-none border-2 border-foreground/10">
                                                                    <AvatarFallback className="text-[10px] font-black uppercase bg-muted">{u.username?.[0] || 'U'}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col flex-1">
                                                                    <span className="text-[10px] font-black uppercase leading-none">{u.username || u.email}</span>
                                                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                                                                        {localLeadId === u.id ? 'Comandante' : localCollaboratorIds.includes(u.id) ? 'Despliegue' : 'Disponible'}
                                                                    </span>
                                                                </div>
                                                                {(localLeadId === u.id || localCollaboratorIds.includes(u.id)) && <CheckCircle2 className="size-4 text-primary" />}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                            {localLeadId && (
                                                <div className="p-2 border-t bg-muted/20">
                                                    <Button variant="ghost" onClick={handleUnassign} className="w-full h-8 text-[9px] font-black uppercase text-red-500 hover:bg-red-500/10 rounded-none cursor-pointer">
                                                        <X className="size-3 mr-2" /> Limpiar Todo
                                                    </Button>
                                                </div>
                                            )}
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="bg-muted/20 border-2 border-foreground/5 p-4 space-y-4">
                                <div className="space-y-4">
                                     {localLeadId ? (
                                        <div className="flex items-center gap-4 bg-background/50 p-2 border border-foreground/5 h-14">
                                            <div className="relative shrink-0">
                                                <UserAvatarProfile userId={localLeadId} allUsers={allUsers} isLead={true} size="md" />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-xs font-black uppercase truncate tracking-tight">{allUsers.find(u => u.id === localLeadId)?.username || 'Desconocido'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] font-bold uppercase text-muted-foreground/40 italic py-2">Sin responsable asignado</div>
                                    )}

                                    {localCollaboratorIds.length > 0 && (
                                        <div className="space-y-2">

                                            <div className="grid grid-cols-1 gap-2">
                                                {localCollaboratorIds.map(id => (
                                                    <div key={id} className="flex items-center gap-3 bg-background/30 p-1.5 border border-foreground/5">
                                                        <UserAvatarProfile userId={id} allUsers={allUsers} isLead={false} size="sm" />
                                                        <span className="text-[10px] font-bold uppercase truncate">{allUsers.find(u => u.id === id)?.username}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                

                            </div>
                        </div>



                    </div>
                    
                    {/* Fixed Footer for Actions */}
                    <div className="mt-auto p-4 border-t-2 border-foreground/5 bg-background/50 backdrop-blur-md">
                        <div className="flex flex-col gap-2">
                            {showCancelForm && (
                                <div className="p-4 border-2 border-red-500/30 bg-red-500/5 space-y-4 mb-4 animate-in slide-in-from-bottom-2">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Motivo de Cancelación</span>
                                     <Textarea 
                                        className="rounded-none bg-background border-2 border-red-500/20 text-xs focus-visible:ring-red-500 min-h-[80px]"
                                        placeholder="Describa el fallo o cambio de prioridad..."
                                        value={cancelReasonText}
                                        onChange={(e) => setCancelReasonText(e.target.value)}
                                     />
                                     <div className="flex gap-2">
                                        <Button variant="ghost" className="flex-1 rounded-none text-[10px] font-bold uppercase cursor-pointer" onClick={() => setShowCancelForm(false)}>Cerrar</Button>
                                        <Button className="flex-1 rounded-none bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase cursor-pointer" onClick={handleMasterCancel} disabled={!cancelReasonText.trim()}>Confirmar Cancelación</Button>
                                     </div>
                                </div>
                            )}

                             {showCompletionForm && (
                                <div className="p-4 border-2 border-green-500/30 bg-green-500/5 space-y-4 mb-4 animate-in slide-in-from-bottom-2">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-2">
                                        <CheckCircle2 className="size-4" /> Tarea Completada
                                     </span>
                                     <Textarea 
                                        className="rounded-none bg-background border-2 border-green-500/20 text-xs focus-visible:ring-green-500 min-h-[80px]"
                                        placeholder="Comentarios finales (opcional)..."
                                        value={completionCommentText}
                                        onChange={(e) => setCompletionCommentText(e.target.value)}
                                     />
                                     <Button className="w-full rounded-none bg-green-600 hover:bg-green-700 text-[10px] font-black uppercase h-12 cursor-pointer" onClick={handleCompleteTicket}>
                                        Finalizar Ticket
                                     </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

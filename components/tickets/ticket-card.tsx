'use client';

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assignTicket, updateSubtaskTime, addSubtaskToTicket, deleteSubtask, unassignTicket, rebuildTicketSubtasks, reorderSubtask, cancelTicket, completeTicket } from '@/app/actions/tickets';
import { Textarea } from '@/components/ui/textarea';
import { completeSubtask } from '@/app/actions/time';
import { suggestSubtasksAI, improveSubtaskTextAI, regenerateFullSubtasksAI } from '@/app/actions/ai-tools';
import { Clock, Plus, Trash2, CheckCircle2, UserPlus, Sparkles, X, User, LayoutList, Loader2, UserCheck, ArrowUp, ArrowDown, ArrowRight, Check, ChevronsUpDown, Pencil, Play, Square, PauseCircle, XCircle } from 'lucide-react';
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
    allUsers = [],
    isSimple = false
}: { 
    ticket: any, 
    currentUserId: string,
    allUsers?: any[],
    isSimple?: boolean
}) {
    const [isAssigning, setIsAssigning] = useState(false);
    const [showSubtasks, setShowSubtasks] = useState(!isSimple);
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newSubtaskTime, setNewSubtaskTime] = useState(30);
    const [isAILoading, setIsAILoading] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [localSubtasks, setLocalSubtasks] = useState<any[]>([]);
    
    // Initialize subtasks on mount to avoid hydration mismatch
    useEffect(() => {
        setLocalSubtasks([...ticket.subtasks]
            .sort((a, b) => a.order - b.order)
            .map((st: any, i: number) => ({ ...st, initialIndex: i }))
        );
    }, [ticket.id]); // Only re-init when ticket changes
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
        setLocalLeadId(ticket.leadId);
        setLocalCollaboratorIds(ticket.collaborators?.map((c: any) => c.id) || []);
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

    const isDirty = useMemo(() => {
        const subtasksChanged = JSON.stringify(localSubtasks.map(({ initialIndex, ...st }: any) => {
            const { id, ...rest } = st;
            return rest;
        })) !== JSON.stringify([...ticket.subtasks].sort((a, b) => a.order - b.order).map((st: any) => {
            const { id, initialIndex, ...rest } = st;
            return rest;
        }));

        const leadChanged = localLeadId !== ticket.leadId;
        const collaboratorsChanged = JSON.stringify([...localCollaboratorIds].sort()) !== 
                                   JSON.stringify((ticket.collaborators?.map((c: any) => c.id) || []).sort());

        return subtasksChanged || leadChanged || collaboratorsChanged;
    }, [localSubtasks, ticket.subtasks, localLeadId, ticket.leadId, localCollaboratorIds, ticket.collaborators]);

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
        <div className={cn(
            "flex flex-col bg-background border-2 border-foreground/5",
            !isSimple && "min-h-[90vh] md:min-h-0"
        )}>
            {/* Mission Hero Header */}
            <div className={cn(
                "relative overflow-hidden border-b-2 border-foreground/10 bg-muted/30",
                isSimple ? "px-4 py-4" : "px-6 py-8 md:px-10 md:py-10"
            )}>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-3 max-w-3xl">
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
                        <h2 className={cn(
                            "font-black tracking-tighter uppercase leading-none text-foreground",
                            isSimple ? "text-xl" : "text-2xl md:text-3xl"
                        )}>
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
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Descripción General:</span>
                            <p className="text-sm md:text-base text-foreground font-bold leading-relaxed max-w-5xl">
                                {ticket.description || "Sin descripción detallada."}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-right">Proyecto:</span>
                         <span className="text-sm font-bold uppercase tracking-tight text-foreground/60 border-b-2 border-primary/20 pb-1">
                            {ticket.project?.name || ticket.module?.project?.name || "Sin Clasificar"}
                         </span>
                    </div>
                </div>
                
                {/* Background Decor */}
                {!isSimple && <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />}
            </div>

            <div className={cn(
                "grid grid-cols-1 flex-1",
                !isSimple && "lg:grid-cols-[1fr_340px]"
            )}>
                {/* Main Content Area */}
                <div className={cn(
                    "flex-1 space-y-8",
                    isSimple ? "p-4" : "p-4 md:p-6"
                )}>
                    
                    {/* Subtasks / Fragments */}
                    <div className={isSimple ? "space-y-4" : "space-y-6"}>
                        <div className="flex items-center justify-between border-b-2 border-foreground/5 pb-4 cursor-pointer hover:bg-foreground/5 transition-all px-2" onClick={() => isSimple && setShowSubtasks(!showSubtasks)}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10">
                                    <LayoutList className="size-5 text-primary" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-tighter">
                                    {isSimple && (showSubtasks ? <ArrowDown className="size-4 inline mr-2" /> : <ArrowRight className="size-4 inline mr-2" />)}
                                    Lista de Tareas
                                </h3>
                                <Badge variant="secondary" className="rounded-none font-bold text-[10px] px-2 bg-foreground/5">
                                    {localSubtasks.length}
                                </Badge>
                                {isDirty && (
                                    <span className="text-[10px] font-bold text-primary italic animate-pulse lowercase ml-2 flex items-center gap-1">
                                        (Cambios sin guardar)
                                    </span>
                                )}
                            </div>
                        </div>

                        {showSubtasks && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* Subtask Management Toolbar */}
                                <div className="flex flex-wrap items-center justify-between p-3 bg-muted/30 border-2 border-foreground/5 rounded-none gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-4">Herramientas:</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-9 rounded-none border-2 border-foreground/10 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all cursor-pointer">
                                                    <Sparkles className="size-3 mr-2 text-primary" /> Recrear con IA
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-none border-4 border-foreground/5">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-black uppercase tracking-tighter text-xl">¿Refactorizar Plan de Trabajo?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-xs font-medium uppercase tracking-wide leading-relaxed">
                                                        La IA analizará la descripción actual para regenerar una secuencia de subtareas optimizada. Se sobrescribirán las tareas existentes.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="mt-8">
                                                    <AlertDialogCancel className="rounded-none font-bold uppercase text-[10px] cursor-pointer">Abortar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleAIRegenerate} className="rounded-none font-black uppercase text-[10px] px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 cursor-pointer">
                                                        Ejecutar Refactorización
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        <Button 
                                            onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                                            variant="outline" 
                                            size="sm" 
                                            className={cn(
                                                "h-9 rounded-none border-2 font-black uppercase text-[10px] tracking-widest transition-all px-6 cursor-pointer",
                                                isAddingSubtask ? "border-primary bg-primary text-primary-foreground" : "border-foreground/10 hover:border-primary/50"
                                            )}
                                        >
                                            <Plus className="size-3 mr-2" /> Nueva Subtarea
                                        </Button>

                                        {isDirty && !isLocked && (
                                            <Button 
                                                onClick={handleSync}
                                                disabled={isSyncing}
                                                className="h-9 rounded-none bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest px-6 cursor-pointer border-2 border-green-700/50 shadow-lg shadow-green-500/20 animate-in fade-in zoom-in-95"
                                            >
                                                {isSyncing ? <Loader2 className="size-3 animate-spin mr-2" /> : <Check className="size-3 mr-2" />}
                                                Guardar Cambios
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Add Subtask Inline Form */}
                                {isAddingSubtask && (
                                    <div className="p-6 bg-primary/5 border-2 border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl shadow-primary/5">
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
                                localSubtasks.map((st: any, index: number) => (
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
                                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-all gap-0.5">
                                                <button onClick={() => handleReorderLocal(st.id, 'UP')} className="p-1 hover:bg-green-500/10 hover:text-green-500 transition-all cursor-pointer"><ArrowUp className="size-3" /></button>
                                                <button onClick={() => handleReorderLocal(st.id, 'DOWN')} className="p-1 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer"><ArrowDown className="size-3" /></button>
                                            </div>
                                        )}

                                        {/* Movement Indicator */}
                                        <div className="min-w-[16px] flex items-center justify-center">
                                            {typeof st.initialIndex !== 'undefined' ? (
                                                <>
                                                    {index < st.initialIndex && (
                                                        <ArrowUp className="size-3 text-green-500 animate-in fade-in slide-in-from-bottom-1" />
                                                    )}
                                                    {index > st.initialIndex && (
                                                        <ArrowDown className="size-3 text-red-500 animate-in fade-in slide-in-from-top-1" />
                                                    )}
                                                    {index === st.initialIndex && (
                                                        <div className="size-1 rounded-full bg-muted-foreground/10" />
                                                    )}
                                                </>
                                            ) : (
                                                <Plus className="size-3 text-primary animate-pulse" />
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
                                            {/* Subtask Title & Edit */}
                                            <div className="flex-1 w-full min-w-0">
                                                {editingSubtaskId === st.id ? (
                                                    <div className="flex gap-2 w-full">
                                                        <Input 
                                                            autoFocus
                                                            value={editingTitle}
                                                            onChange={(e) => setEditingTitle(e.target.value)}
                                                            className="h-10 rounded-none border-2 border-primary/30 font-medium text-sm flex-1"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    setLocalSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, title: editingTitle } : s));
                                                                    setEditingSubtaskId(null);
                                                                }
                                                                if (e.key === 'Escape') setEditingSubtaskId(null);
                                                            }}
                                                        />
                                                        <div className="flex gap-1 shrink-0">
                                                            <button 
                                                                className="size-10 flex items-center justify-center bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white transition-all cursor-pointer border-2 border-green-500/20" 
                                                                onClick={() => {
                                                                    setLocalSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, title: editingTitle } : s));
                                                                    setEditingSubtaskId(null);
                                                                }}
                                                            >
                                                                <Check className="size-5" />
                                                            </button>
                                                            <button 
                                                                className="size-10 flex items-center justify-center bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer border-2 border-red-500/20" 
                                                                onClick={() => setEditingSubtaskId(null)}
                                                            >
                                                                <X className="size-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <span className={cn(
                                                            "text-sm font-medium leading-tight",
                                                            st.status === 'DONE' ? "line-through text-muted-foreground opacity-50" : "text-foreground"
                                                        )}>
                                                            {st.title}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mobile Divider */}
                                            <div className="md:hidden w-full h-px bg-foreground/5" />

                                            {/* Controls Group (Timer + Actions) */}
                                            <div className="flex items-center justify-between md:justify-end gap-2 md:gap-6 w-full md:w-auto shrink-0 bg-muted/5 md:bg-transparent p-2 md:p-0">
                                                {/* Timer Section */}
                                                <div className="flex items-center gap-3 whitespace-nowrap">
                                                    {/* Operational Tags (Running/Paused) */}
                                                    {activeSpeedrunId === st.id && (
                                                        <div className="flex items-center gap-2 border-r-2 border-primary/20 pr-3">
                                                            <span className="text-[8px] font-black uppercase text-amber-500">RUNNING</span>
                                                            <span className="text-amber-400 font-mono text-xs font-black">
                                                                {formatChronometer(speedrunSeconds)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Estimation Controls */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground/30">Est.</span>
                                                        <div className="flex items-center gap-1 border-2 border-foreground/5 p-0.5 bg-background/50">
                                                            {!isLocked && st.status !== 'DONE' && (
                                                                <button 
                                                                    onClick={() => handleAddTime(st.id, -5)} 
                                                                    className="size-7 flex items-center justify-center border border-foreground/5 hover:border-red-500/50 hover:bg-red-500/5 text-[10px] font-black cursor-pointer"
                                                                > - </button>
                                                            )}
                                                            <span className="text-xs font-mono font-black px-1.5 min-w-[45px] text-center">{formatChronometer(st.estimatedTime * 60)}</span>
                                                            {!isLocked && st.status !== 'DONE' && (
                                                                <button 
                                                                    onClick={() => handleAddTime(st.id, 5)} 
                                                                    className="size-7 flex items-center justify-center border border-foreground/5 hover:border-green-500/50 hover:bg-green-500/5 text-[10px] font-black cursor-pointer"
                                                                > + </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {st.status === 'DONE' && (
                                                        <div className="flex items-center gap-2 border-l border-foreground/10 pl-3">
                                                            <span className="text-[8px] font-black uppercase text-muted-foreground/30">REAL</span>
                                                            <span className="text-foreground/80 font-mono text-xs font-black">
                                                                {formatChronometer(st.realTime || 0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons (Edit + Delete) */}
                                                <div className="flex items-center gap-0.5 md:border-l-2 md:border-foreground/5 md:pl-4">
                                                    {!isLocked && st.status !== 'DONE' && (
                                                        <>
                                                            <button 
                                                                onClick={() => { setEditingSubtaskId(st.id); setEditingTitle(st.title); }}
                                                                className="size-8 flex items-center justify-center text-blue-500/50 hover:text-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer"
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleLocalDelete(st.id)}
                                                                className="size-8 flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all cursor-pointer"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    {activeSpeedrunId === st.id && (
                                                        <Button 
                                                            size="sm" 
                                                            className="rounded-none bg-green-500 hover:bg-green-600 text-[8px] font-black uppercase px-3 h-8 cursor-pointer shrink-0"
                                                            onClick={() => handleCompleteSpeedrun(st.id)}
                                                        >
                                                            FINISH <CheckCircle2 className="size-3 ml-1" />
                                                        </Button>
                                                    )}

                                                    {st.status === 'DONE' && (
                                                        <div className="px-2 text-green-500">
                                                            <CheckCircle2 className="size-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        </div>
                        )}
                    </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="bg-muted/20 border-l-2 border-foreground/5 flex flex-col min-h-full">
                    
                    {/* Operational Details (Scrollable) */}
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

'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assignTicket, updateSubtaskTime, addSubtaskToTicket, deleteSubtask, unassignTicket, rebuildTicketSubtasks, reorderSubtask, cancelTicket } from '@/app/actions/tickets';
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

    // Speedrun Execution States
    const [activeSpeedrunId, setActiveSpeedrunId] = useState<string | null>(null);
    const [speedrunSeconds, setSpeedrunSeconds] = useState(0);
    const [totalRealSeconds, setTotalRealSeconds] = useState(ticket.realTime || 0);
    const [isMasterActive, setIsMasterActive] = useState(false);

    const startSubtaskTimer = (stId: string) => {
        setActiveSpeedrunId(stId);
        setSpeedrunSeconds(0);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`speedrun_active_${ticket.id}`, stId);
            localStorage.setItem(`speedrun_start_${stId}`, Date.now().toString());
        }
    };

    const stopSubtaskTimer = () => {
        setActiveSpeedrunId(null);
        setSpeedrunSeconds(0);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(`speedrun_active_${ticket.id}`);
        }
    };

    const formatChronometer = (seconds: number) => {
        const hrs = Math.floor(Math.abs(seconds) / 3600);
        const mins = Math.floor((Math.abs(seconds) % 3600) / 60);
        const secs = Math.abs(seconds) % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Persistence between revalidations & Refresh (F5)
    useEffect(() => {
        setLocalSubtasks([...ticket.subtasks].sort((a, b) => a.order - b.order));
        setLocalLeadId(ticket.leadId);
        setLocalCollaboratorIds(ticket.collaborators?.map((c: any) => c.id) || []);
        
        if (typeof window !== 'undefined') {
            // 1. Recover Subtask Timer
            const runningId = localStorage.getItem(`speedrun_active_${ticket.id}`);
            if (runningId) {
                const startStamp = localStorage.getItem(`speedrun_start_${runningId}`);
                if (startStamp) {
                    const elapsed = Math.floor((Date.now() - parseInt(startStamp)) / 1000);
                    setActiveSpeedrunId(runningId);
                    setSpeedrunSeconds(elapsed > 0 ? elapsed : 0);
                }
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
        }
    }, [ticket.id, ticket.subtasks, ticket.leadId, ticket.collaborators]);

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
        toast.promise(completeSubtask(stId, addedSeconds), {
            loading: 'Registrando fragmento...',
            success: () => {
                const currentOrder = localSubtasks.find(s => s.id === stId)?.order ?? -1;
                // Update local optimistically
                const newSubtasks = localSubtasks.map(s => s.id === stId ? { ...s, status: 'DONE', realTime: (s.realTime || 0) + addedSeconds } : s);
                setLocalSubtasks(newSubtasks);
                stopSubtaskTimer();

                // Auto-Secuencia: Encontrar siguiente subtarea
                const nextSubtask = [...newSubtasks].sort((a,b) => a.order - b.order).find(s => s.order > currentOrder && s.status !== 'DONE' && !s.id.startsWith('new-'));
                if (nextSubtask) {
                    setTimeout(() => startSubtaskTimer(nextSubtask.id), 500);
                    toast.info(`Auto-Secuencia: Iniciando '${nextSubtask.title}'`);
                } else {
                    toast.success('¡Todas las misiones secundarias completadas!');
                }

                return 'Fragmento completado.';
            },
            error: 'No se pudo sincronizar el tiempo.'
        });
    };

    const handleMasterStart = async () => {
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
            
            // Auto-start first subtask
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
        setIsSyncing(true);
        try {
            await pauseActiveTicket();
            stopSubtaskTimer(); // Pause subtask too
            setIsMasterActive(false);
            if (typeof window !== 'undefined') {
                localStorage.removeItem(`mission_start_${ticket.id}`);
            }
            toast.info("Misión Pausada");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleMasterCancel = async () => {
        if (!confirm("¿Cancelar toda la misión? Esto abortará el ticket entero.")) return;
        setIsSyncing(true);
        try {
            // Ensure no timers are running
            await pauseActiveTicket();
            const res = await cancelTicket(ticket.id);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Misión Cancelada");
                stopSubtaskTimer();
                setIsMasterActive(false);
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
        <div className="group relative flex flex-col p-4 md:p-8 bg-background transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div className="flex flex-col gap-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-2xl tracking-tight leading-none">{ticket.title}</h2>
                        <Badge variant="outline" className={cn(
                            "text-[10px] border-primary/30 uppercase font-black px-2 py-0.5",
                            ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-primary/5 text-primary border-primary/30"
                        )}>
                            {(() => {
                                switch(ticket.priority) {
                                    case 'LOW': return 'Baja Prioridad';
                                    case 'MEDIUM': return 'Prioridad Media';
                                    case 'HIGH': return 'Alta Prioridad';
                                    case 'URGENT': return '¡URGENTE!';
                                    default: return ticket.priority;
                                }
                            })()}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-2xl mb-4">{ticket.description || "Sin descripción proporcionada."}</p>
                    
                    {/* Master Controls and Telemetry */}
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/20 border-2 border-foreground/10 mb-2">
                        <div className="flex flex-col mr-6 border-r pr-6 border-foreground/10">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Tiempo Global</span>
                            <span className={cn(
                                "text-3xl font-mono font-black tracking-tighter leading-none mt-1",
                                ticket.status === 'IN_PROGRESS' ? "text-amber-400 animate-pulse" : 
                                ticket.status === 'DONE' ? ((totalRealSeconds <= (ticket.estimatedTime * 60)) ? "text-green-500" : "text-red-500") :
                                "text-muted-foreground/30"
                            )}>
                                {formatChronometer(totalRealSeconds)}
                            </span>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 rounded-none border-green-500/30 text-green-600 bg-green-500/5 hover:bg-green-500/20 font-bold uppercase text-[10px] tracking-widest"
                            onClick={handleMasterStart}
                            disabled={isSyncing}
                        >
                            <Play className="size-3 mr-2" /> Empezar / Reanudar
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 rounded-none border-orange-500/30 text-orange-600 bg-orange-500/5 hover:bg-orange-500/20 font-bold uppercase text-[10px] tracking-widest"
                            onClick={handleMasterPause}
                            disabled={isSyncing}
                        >
                            <PauseCircle className="size-3 mr-2" /> Pausar
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 rounded-none border-red-500/30 text-red-600 bg-red-500/5 hover:bg-red-500/20 font-bold uppercase text-[10px] tracking-widest ml-auto"
                            disabled={isSyncing}
                            onClick={handleMasterCancel}
                        >
                            <XCircle className="size-3 mr-2" /> Cancelar
                        </Button>
                    </div>
                </div>
                
                {/* Asignación con Popover (Combobox Inline) */}
                {(() => {
                    const currentLead = localLeadId 
                        ? allUsers.find(u => u.id === localLeadId) || (localLeadId === ticket.leadId ? ticket.lead : null)
                        : null;
                        
                    return (
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    className={cn(
                                        "rounded-none border-2 h-10 transition-all cursor-pointer min-w-[180px] justify-start px-2",
                                        (localLeadId || localCollaboratorIds.length > 0) ? 'border-foreground/20 bg-foreground/5' : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                                    )}
                                >
                                    {(localLeadId || localCollaboratorIds.length > 0) ? (
                                        <div className="flex items-center gap-1.5 overflow-hidden w-full">
                                            <div className="flex -space-x-2.5 overflow-hidden items-center mr-1">
                                                {localLeadId && (
                                                    <UserAvatarProfile 
                                                        userId={localLeadId} 
                                                        allUsers={allUsers} 
                                                        isLead={true}
                                                        size="sm"
                                                    />
                                                )}
                                                {localCollaboratorIds.map(id => (
                                                    <UserAvatarProfile 
                                                        key={id}
                                                        userId={id} 
                                                        allUsers={allUsers} 
                                                        isLead={false}
                                                        size="sm"
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase truncate flex-1 text-left tracking-widest text-muted-foreground/80 ml-1">
                                                {localLeadId || localCollaboratorIds.length > 0 ? 'Equipo' : 'Responsables'}
                                            </span>
                                            <ChevronsUpDown className="size-3 ml-auto text-muted-foreground shrink-0" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-primary">
                                            <UserPlus className="size-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Responsables</span>
                                        </div>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="rounded-none border-2 border-primary/20 p-0 w-[240px]" align="end">
                                <Command className="rounded-none">
                                    <CommandInput placeholder="Buscar..." className="text-xs h-9" />
                                    <CommandList className="max-h-[200px]">
                                        <CommandEmpty className="p-4 text-xs text-center border-none">No hay resultados.</CommandEmpty>
                                        <CommandGroup>
                                            {allUsers.map((u) => (
                                                <CommandItem
                                                    key={u.id}
                                                    onSelect={() => handleAssign(u.id)}
                                                    className="cursor-pointer flex items-center justify-between p-2 hover:bg-primary/5"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="size-6 rounded-full border border-foreground/10">
                                                            <AvatarFallback className={cn(
                                                                "text-[9px] font-bold uppercase rounded-full",
                                                                localLeadId === u.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                            )}>
                                                                {u.username?.[0] || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold uppercase leading-none">{u.username || u.email}</span>
                                                            <span className="text-[8px] text-muted-foreground uppercase">
                                                                {u.id === currentUserId ? 'Tú' : localLeadId === u.id ? 'Líder' : localCollaboratorIds.includes(u.id) ? 'Equipo' : 'Disponible'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {(localLeadId === u.id || localCollaboratorIds.includes(u.id)) && <Check className="size-3 text-primary" />}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                    {localLeadId && (
                                        <div className="p-2 border-t bg-muted/20">
                                            <Button 
                                                variant="ghost" 
                                                className="w-full rounded-none font-bold uppercase text-[8px] h-7 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                onClick={handleUnassign}
                                            >
                                                <X className="size-3 mr-2" /> Liberar Asignación
                                            </Button>
                                        </div>
                                    )}
                                </Command>
                            </PopoverContent>
                        </Popover>
                    );
                })()}
            </div>

            {/* Subtasks Section */}
            <div className="mt-4 pt-4 border-t border-foreground/5 space-y-3 relative overflow-hidden">
                {/* Loading Overlay */}
                {isAILoading && (
                    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-[1px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <Loader2 className="size-8 text-primary animate-spin" />
                                <Sparkles className="size-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">Optimizando con IA...</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tareas ({localSubtasks.length}) {isDirty && <span className="text-primary italic animate-pulse lowercase font-normal ml-2">(sin guardar)</span>}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                        {isDirty && !isLocked && (
                            <Button 
                                disabled={isSyncing}
                                size="sm" 
                                className="h-8 bg-primary text-primary-foreground text-[10px] font-bold uppercase rounded-none px-4 shadow-lg shadow-primary/20 animate-in zoom-in-95 duration-200"
                                onClick={handleSync}
                            >
                                {isSyncing ? <Loader2 className="size-3 mr-2 animate-spin" /> : <CheckCircle2 className="size-3 mr-2" />}
                                Guardar Cambios
                            </Button>
                        )}
                        {!isLocked && (
                            <div className="flex items-center gap-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 text-[10px] uppercase font-bold text-primary hover:bg-primary/5 cursor-pointer"
                                        >
                                            <Sparkles className="size-3 mr-1" /> Re-Planear con IA
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-none border-2 border-primary/20">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-sm font-bold uppercase tracking-widest">¿Confirmar Reestructuración?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-xs leading-relaxed">
                                                Se borrarán las subtareas actuales y se creará un nuevo plan de trabajo optimizado por IA basado en la descripción del ticket. Esta acción no se puede deshacer.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="mt-6">
                                            <AlertDialogCancel className="rounded-none text-[10px] uppercase font-bold px-6">Cancelar</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={handleAIRegenerate}
                                                className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-bold uppercase px-6"
                                            >
                                                Sí, Re-Estructurar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => !isLocked && setIsAddingSubtask(!isAddingSubtask)}
                                >
                                    <Plus className="size-3 mr-1" /> Añadir Tarea
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {isAddingSubtask && (
                    <div className="flex flex-col gap-2 p-3 bg-primary/5 border border-dashed border-primary/30 mb-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Nueva tarea..." 
                                className="h-8 text-xs rounded-none bg-background border-primary/20 focus-visible:ring-primary"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            />
                            <Button 
                                disabled={isAILoading}
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-none border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                                onClick={handleAISuggest}
                            >
                                <Sparkles className={`size-4 ${isAILoading ? 'animate-pulse' : ''}`} />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Minutos:</span>
                                <div className="flex items-center gap-1 border bg-background px-2 h-7">
                                    <Clock className="size-3 text-muted-foreground" />
                                    <input 
                                        type="number" 
                                        className="w-10 bg-transparent text-xs font-bold focus:outline-none cursor-pointer" 
                                        value={newSubtaskTime}
                                        onChange={(e) => setNewSubtaskTime(parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[10px] font-bold uppercase cursor-pointer" 
                                    onClick={() => setIsAddingSubtask(false)}
                                >
                                    X
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="h-7 rounded-none px-4 font-bold uppercase text-[10px] cursor-pointer" 
                                    onClick={handleAddNewSubtask}
                                >
                                    OK
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {localSubtasks.map((st: any) => (
                        <div key={st.id} className="flex items-center justify-between p-3 bg-muted/20 border border-transparent hover:border-foreground/10 group/item transition-colors">
                            <div className="flex items-center gap-3">
                                {!isLocked && (
                                    <div className="flex flex-col transition-opacity">
                                        <button onClick={() => handleReorderLocal(st.id, 'UP')} className="text-muted-foreground/40 hover:text-green-500 cursor-pointer transition-colors p-0.5"><ArrowUp className="size-3" /></button>
                                        <button onClick={() => handleReorderLocal(st.id, 'DOWN')} className="text-muted-foreground/40 hover:text-red-500 cursor-pointer transition-colors p-0.5"><ArrowDown className="size-3" /></button>
                                    </div>
                                )}
                                <div className="flex flex-col flex-1">
                                    {editingSubtaskId === st.id ? (
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                className="h-7 text-xs rounded-none bg-background border-primary/30"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setLocalSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, title: editingTitle } : s));
                                                        setEditingSubtaskId(null);
                                                    }
                                                }}
                                            />
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="size-7 text-green-500 cursor-pointer"
                                                onClick={() => {
                                                    setLocalSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, title: editingTitle } : s));
                                                    setEditingSubtaskId(null);
                                                }}
                                            >
                                                <Check className="size-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group/title">
                                            <span className={cn("text-sm font-medium", st.status === 'DONE' && "line-through text-muted-foreground/50")}>{st.title}</span>
                                            
                                            {/* Speedrun Live Timer Status */}
                                            {activeSpeedrunId === st.id && (
                                                <span className={cn(
                                                    "ml-2 font-mono text-[10px] animate-pulse font-black tracking-widest",
                                                    speedrunSeconds > (st.estimatedTime * 60) ? "text-red-500" : "text-amber-400"
                                                )}>
                                                    [{formatChronometer(speedrunSeconds)}]
                                                </span>
                                            )}

                                            {/* Final Result Status */}
                                            {st.status === 'DONE' && (
                                                <span className={cn(
                                                    "ml-2 font-mono text-[10px] font-bold tracking-tight",
                                                    (st.realTime || 0) <= (st.estimatedTime * 60) ? "text-green-500" : "text-red-500"
                                                )}>
                                                    REAL: {formatChronometer(st.realTime || 0)}
                                                </span>
                                            )}

                                            {/* Speedrun Check (Finish) */}
                                            {!st.id.startsWith('new-') && st.status !== 'DONE' && activeSpeedrunId === st.id && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 rounded-none border-green-500/40 text-green-600 bg-green-500/5 hover:bg-green-500 hover:text-white px-3 ml-2 cursor-pointer transition-all animate-in fade-in slide-in-from-left-2 group/check"
                                                    onClick={() => handleCompleteSpeedrun(st.id)}
                                                >
                                                    <span className="text-[9px] font-black uppercase tracking-widest mr-2">Completar</span>
                                                    <CheckCircle2 className="size-3.5 group-hover/check:scale-110 transition-transform" />
                                                </Button>
                                            )}

                                            {!isLocked && (
                                                <button 
                                                    onClick={() => {
                                                        setEditingSubtaskId(st.id);
                                                        setEditingTitle(st.title);
                                                    }}
                                                    className="transition-opacity text-muted-foreground/40 hover:text-primary p-1 cursor-pointer"
                                                >
                                                    <Pencil className="size-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                               <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    {!isLocked && <button onClick={() => handleAddTime(st.id, -5)} className="size-4 flex items-center justify-center text-muted-foreground/30 hover:text-red-500 text-[10px] cursor-pointer transition-colors">-</button>}
                                    <span className="text-[10px] font-mono w-[60px] text-center font-bold text-muted-foreground opacity-60" title="Estimación Original">
                                        {formatChronometer(st.estimatedTime * 60)}
                                    </span>
                                    {!isLocked && <button onClick={() => handleAddTime(st.id, 5)} className="size-4 flex items-center justify-center text-muted-foreground/30 hover:text-green-500 text-[10px] cursor-pointer transition-colors">+</button>}
                                </div>                     </div>
                                {!isLocked && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="size-7 text-muted-foreground/40 hover:text-destructive cursor-pointer"
                                        onClick={() => handleLocalDelete(st.id)}
                                    >
                                        <Trash2 className="size-3" />
                                    </Button>
                                )}
                            </div>
                    ))}
                </div>
            </div>

            {/* Footer Metadata */}
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 border-t pt-3">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 opacity-60">
                        <span className="size-1.5 rounded-full bg-primary" /> 
                        {ticket.project?.name || ticket.module?.project?.name || "Sin Proyecto / Módulo"}
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter">EQUIPO:</span>
                        <TooltipProvider>
                            <div className="flex -space-x-2 overflow-hidden items-center">
                            {localLeadId && (
                                <UserAvatarProfile 
                                    userId={localLeadId} 
                                    allUsers={allUsers} 
                                    isLead={true}
                                    ticketLead={ticket.lead}
                                    size="sm"
                                />
                            )}
                            {localCollaboratorIds.map(id => (
                                <UserAvatarProfile 
                                    key={id} 
                                    userId={id} 
                                    allUsers={allUsers} 
                                    isLead={false}
                                    size="sm"
                                />
                            ))}
                        </div>
                    </TooltipProvider>
                </div>

                <span className="flex items-center gap-2">
                    <Clock className="size-3" />
                    EST. TOTAL: {(() => {
                        const totalMinutes = localSubtasks.reduce((acc: number, cur: any) => acc + cur.estimatedTime, 0);
                        return formatChronometer(totalMinutes * 60);
                    })()}
                </span>
            </div>
        </div>
        </div>
    );
}

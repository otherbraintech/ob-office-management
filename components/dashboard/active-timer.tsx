'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PlayIcon, StopCircleIcon, TimerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActiveSession, getAvailableSubtasks, startWorkSession, stopWorkSession } from '@/app/actions/tracking';

export function ActiveTimer() {
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [subtasks, setSubtasks] = useState<{id: string, title: string}[]>([]);
  const [selectedSubtask, setSelectedSubtask] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitial() {
      // 1. Check open sessions
      const active = await getActiveSession();
      if (active && active.endTime == null) {
          setIsActive(true);
          setCurrentSessionId(active.id);
          setSelectedSubtask(active.subtaskId);
          const diffSeconds = Math.floor((new Date().getTime() - new Date(active.startTime).getTime()) / 1000);
          setElapsedTime(diffSeconds);
      }
      
      // 2. Load available tasks to track
      const available = await getAvailableSubtasks();
      setSubtasks(available);
      setLoading(false);
    }
    loadInitial();
  }, []);

  useEffect(() => {
    let interval: string | number | NodeJS.Timeout | undefined;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const toggleTimer = async () => {
    if (!isActive) {
      if (!selectedSubtask) {
          alert('Por favor selecciona una Tarea antes de iniciar el turno.');
          return;
      }
      
      const newSession = await startWorkSession(selectedSubtask);
      setCurrentSessionId(newSession.id);
      setIsActive(true);
      setElapsedTime(0);
    } else {
      if (currentSessionId) {
         await stopWorkSession(currentSessionId);
      }
      setIsActive(false);
      setCurrentSessionId(null);
    }
  };

  if (loading) return <Card className="border-l-4 border-l-muted opacity-50"><CardContent className="p-4">Cargando Tracker...</CardContent></Card>;

  return (
    <Card className={`border-l-4 ${isActive ? 'border-l-primary shadow-md' : 'border-l-muted'}`}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isActive ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-muted'}`}>
                <TimerIcon className="size-5" />
              </div>
              <div>
                 <p className="text-sm font-semibold">{isActive ? 'Turno Activo' : 'Iniciar Nuevo Turno'}</p>
                 <p className="text-2xl font-mono tabular-nums leading-none mt-1">{formatTime(elapsedTime)}</p>
              </div>
            </div>
            <Button size="icon" variant={isActive ? 'destructive' : 'default'} onClick={toggleTimer} className="rounded-full size-10 shadow-lg">
              {isActive ? <StopCircleIcon /> : <PlayIcon fill="currentColor" />}
            </Button>
        </div>

        {!isActive && subtasks.length > 0 && (
           <div className="pt-2">
             <Select value={selectedSubtask} onValueChange={setSelectedSubtask}>
               <SelectTrigger className="w-full text-xs h-8">
                 <SelectValue placeholder="Seleccionar tarea a trackear..." />
               </SelectTrigger>
               <SelectContent>
                  {subtasks.map(t => (
                     <SelectItem key={t.id} value={t.id} className="text-xs">{t.title}</SelectItem>
                  ))}
               </SelectContent>
             </Select>
           </div>
        )}
        {!isActive && subtasks.length === 0 && (
            <p className="text-xs text-muted-foreground pt-2">No tienes tareas asignadas.</p>
        )}
        {isActive && (
            <p className="text-xs text-muted-foreground pt-2 border-t mt-2 truncate w-full">
              Trackeando: {subtasks.find(s => s.id === selectedSubtask)?.title || 'Tarea activa'}
            </p>
        )}
      </CardContent>
    </Card>
  );
}

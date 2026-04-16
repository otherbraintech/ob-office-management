"use client"

import { useState, useEffect } from "react"
import { Play, Square, Timer as TimerIcon, StopCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FloatingTimer() {
  const [isActive, setIsActive] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [currentTask, setCurrentTask] = useState<string | null>("OBS-12: Implementar Navbar")

  // Efecto de cronómetro simple
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggleTimer = () => {
    setIsActive(!isActive)
    // TODO: Llamar server action para iniciar/parar WorkSession
  }

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-background border-2 border-foreground/10 p-2 shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-2 pl-2">
        <TimerIcon className={`size-4 ${isActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
            {isActive ? "Turno Activo" : "Sin Turno"}
          </span>
          <span className={`font-mono font-bold leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
            {formatTime(seconds)}
          </span>
        </div>
      </div>
      
      {currentTask && (
         <div className="hidden md:flex border-l border-foreground/10 pl-3 flex-col justify-center max-w-[200px]">
           <span className="text-[10px] font-bold text-primary uppercase tracking-wider leading-none">Tarea</span>
           <span className="text-xs truncate font-medium text-foreground">{currentTask}</span>
         </div>
      )}

      <div className="flex gap-1 ml-2">
        <Button 
          variant={isActive ? "destructive" : "default"} 
          size="icon" 
          className="rounded-none h-8 w-8"
          onClick={toggleTimer}
        >
          {isActive ? <Square className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
        </Button>
      </div>
    </div>
  )
}

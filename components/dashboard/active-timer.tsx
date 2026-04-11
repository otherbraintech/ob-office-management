'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PlayIcon, StopCircleIcon, TimerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ActiveTimer() {
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

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

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (!isActive) {
      // Logic to startWorkSession action
    } else {
      // Logic to stopWorkSession action
    }
  };

  return (
    <Card className={`border-l-4 ${isActive ? 'border-l-primary animate-pulse' : 'border-l-muted'}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <TimerIcon className="size-5" />
          </div>
          <div>
             <p className="text-sm font-semibold">{isActive ? 'Time Tracking Active' : 'Start New Shift'}</p>
             <p className="text-2xl font-mono tabular-nums leading-none mt-1">{formatTime(elapsedTime)}</p>
          </div>
        </div>
        <Button size="icon" variant={isActive ? 'destructive' : 'default'} onClick={toggleTimer} className="rounded-full size-10 shadow-lg">
          {isActive ? <StopCircleIcon /> : <PlayIcon fill="currentColor" />}
        </Button>
      </CardContent>
    </Card>
  );
}

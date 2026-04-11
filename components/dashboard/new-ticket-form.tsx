'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SparklesIcon, SaveIcon } from 'lucide-react';
import { aiAnalyzeTicket } from '@/app/actions/ai';
import { createTicket } from '@/app/actions/dashboard';
import { TicketPriority, TicketStatus } from '@prisma/client';

export function NewTicketForm({ moduleId, userId }: { moduleId: string; userId: string }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTicket, setSuggestedTicket] = useState<{
    title: string;
    description: string;
    priority: TicketPriority;
  } | null>(null);

  const handleGenerateAI = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const result = await aiAnalyzeTicket(prompt);
      if (result.data) {
        setSuggestedTicket(result.data);
      } else {
        console.error(result.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTicket = async () => {
    if (!suggestedTicket) return;
    try {
      await createTicket({
        title: suggestedTicket.title,
        description: suggestedTicket.description,
        priority: suggestedTicket.priority,
        moduleId: moduleId,
        leadId: userId
      });
      alert('¡Ticket guardado!');
      setSuggestedTicket(null);
      setPrompt('');
    } catch (e) {
      console.error(e);
      alert('Error al guardar el ticket');
    }
  };

  return (
    <Card className="h-full border-dashed">
      <CardHeader className="p-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          Creación Rápida de Tickets
        </CardTitle>
        <CardDescription>Introduce una idea y deja que la IA genere los detalles por ti.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Idea / Tarea pendiente</Label>
          <div className="flex gap-2">
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Arreglar la alineación en el header..."
              disabled={isGenerating}
            />
            <Button onClick={handleGenerateAI} disabled={isGenerating || !prompt} variant="outline" className="shrink-0 shadow-sm border-primary/50">
              {isGenerating ? '...' : <SparklesIcon className="size-4" />}
            </Button>
          </div>
        </div>

        {suggestedTicket && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2">
             <div className="flex justify-between items-start">
               <h4 className="font-semibold text-sm">{suggestedTicket.title}</h4>
               <span className="text-[10px] uppercase font-bold text-primary">{suggestedTicket.priority}</span>
             </div>
             <p className="text-xs text-muted-foreground">{suggestedTicket.description}</p>
             <Button size="sm" onClick={handleSaveTicket} className="w-full gap-2">
               <SaveIcon className="size-3" />
               Crear Ticket
             </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

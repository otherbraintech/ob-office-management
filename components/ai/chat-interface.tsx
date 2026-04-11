'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SendIcon, SparklesIcon, SaveIcon, UserIcon, BotIcon, CheckCircle2Icon, ClockIcon } from 'lucide-react';
import { aiChat, createTicketFromAI } from '@/app/actions/ai';
import { cn } from '@/lib/utils';
import { TicketPriority } from '@prisma/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TicketProposal {
  title: string;
  description: string;
  priority: TicketPriority;
  subtasks: { title: string; estimatedTime: number }[];
}

export function AIChatInterface({ moduleId, userId }: { moduleId: string; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente de OB-OfficeManagement. ¿En qué puedo ayudarte hoy? Describe una tarea o problema y te ayudaré a crear un ticket.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proposal, setProposal] = useState<TicketProposal | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, proposal]);

  const parseProposal = (content: string) => {
    const match = content.match(/```JSON_PROPOSAL\n([\s\S]*?)\n```/);
    if (match) {
      try {
        const json = JSON.parse(match[1]);
        if (json.type === 'ticket_proposal') {
          setProposal(json.data);
          return content.replace(match[0], '').trim();
        }
      } catch (e) {
        console.error("Failed to parse AI proposal", e);
      }
    }
    return content;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setProposal(null);

    try {
      const response = await aiChat([...messages, userMessage]);
      if (response.data) {
        const cleanedContent = parseProposal(response.data);
        setMessages(prev => [...prev, { role: 'assistant', content: cleanedContent || 'He generado una propuesta de ticket para ti.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu solicitud: ' + response.error }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ocurrió un error inesperado.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!proposal) return;
    setIsLoading(true);
    try {
      const result = await createTicketFromAI({
        ...proposal,
        moduleId,
        leadId: userId
      });
      if (result.data) {
        setMessages(prev => [...prev, { role: 'assistant', content: '¡Perfecto! El ticket "' + proposal.title + '" ha sido creado con éxito.' }]);
        setProposal(null);
      } else {
        alert("Error al crear el ticket: " + result.error);
      }
    } catch (e) {
      alert("Error inesperado al crear el ticket.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto border rounded-xl bg-background shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
        <SparklesIcon className="size-5 text-primary" />
        <div>
          <h2 className="font-semibold">Asistente de Gestión</h2>
          <p className="text-xs text-muted-foreground font-inter">Personaliza tus tickets conversando con la IA</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <Avatar className="size-8 border">
                <AvatarFallback className={m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"}>
                  {m.role === 'user' ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                m.role === 'user'
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-muted/50 border rounded-tl-none whitespace-pre-wrap"
              )}>
                {m.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="size-8 border animate-pulse">
                <AvatarFallback className="bg-muted"><BotIcon className="size-4" /></AvatarFallback>
              </Avatar>
              <div className="bg-muted/50 border rounded-2xl rounded-tl-none px-4 py-2 flex gap-1 items-center h-9">
                <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}

          {proposal && (
            <div className="ml-11 mr-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-primary/20 shadow-md">
                <CardHeader className="pb-3 border-b bg-primary/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{proposal.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">{proposal.description}</CardDescription>
                    </div>
                    <Badge variant={proposal.priority === 'URGENT' ? 'destructive' : proposal.priority === 'HIGH' ? 'default' : 'secondary'} className="uppercase">
                      {proposal.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-2 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <CheckCircle2Icon className="size-3" /> Subtareas sugeridas
                  </h4>
                  <div className="grid gap-2">
                    {proposal.subtasks.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm p-2 rounded bg-muted/30 border border-transparent hover:border-border transition-colors">
                        <span className="flex-1 truncate">{s.title}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
                          <ClockIcon className="size-3" /> {s.estimatedTime}m
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 pt-4 flex justify-end gap-2">
                   <Button variant="ghost" size="sm" onClick={() => setProposal(null)}>Descartar</Button>
                   <Button size="sm" className="gap-2" onClick={handleCreateTicket} disabled={isLoading}>
                     <SaveIcon className="size-4" />
                     Aprobar y Crear Ticket
                   </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t bg-background">
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe aquí para discutir el ticket..."
            className="flex-1 h-11"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="size-11 shrink-0" disabled={isLoading || !input.trim()}>
            <SendIcon className="size-5" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-2 font-inter">
          La IA puede cometer errores. Por favor, revisa la propuesta antes de aprobar.
        </p>
      </div>
    </div>
  );
}

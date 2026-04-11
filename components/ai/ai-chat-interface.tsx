'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendIcon, BotIcon, UserIcon, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { aiChat, createTicketFromAI } from '@/app/actions/ai';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AIChatInterface({ availableModules, currentUserId }: { availableModules: any[], currentUserId: string }) {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
      { role: 'assistant', content: '¡Hola! Soy tu asistente de proyectos. Cuéntame sobre el nuevo requerimiento técnico y yo estructuraré un ticket con subtareas y estimación de tiempo automáticamente.' }
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState(availableModules[0]?.id || '');

  const handleSend = async () => {
    if (!draft.trim()) return;
    const newMsgs = [...messages, { role: 'user' as const, content: draft }];
    setMessages(newMsgs);
    setDraft('');
    setLoading(true);

    try {
      const resp = await aiChat(newMsgs);
      if (resp.error) throw new Error(resp.error);
      setMessages([...newMsgs, { role: 'assistant', content: resp.data || '' }]);
    } catch (e: any) {
      setMessages([...newMsgs, { role: 'assistant', content: 'Lo siento, hubo un error de red o timeout conectando con LLM. Revisa tu consola.' }]);
    } finally {
      setLoading(false);
    }
  };

  const parseContent = (content: string) => {
    const jsonMatch = content.match(/```JSON_PROPOSAL\n([\s\S]*?)\n```/);
    if (!jsonMatch) return { text: content, proposal: null };

    const textPart = content.replace(/```JSON_PROPOSAL\n[\s\S]*?\n```/, '');
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return { text: textPart, proposal: parsed.data };
    } catch (e) {
      return { text: content, proposal: null };
    }
  }

  const handleApproveProposal = async (proposal: any) => {
      setLoading(true);
      try {
          const resp = await createTicketFromAI({
              ...proposal,
              moduleId: selectedModule,
              leadId: currentUserId
          });
          if (resp.error) throw new Error(resp.error);
          
          setMessages([...messages, { role: 'assistant', content: '¡Éxito! ✅ El ticket y las subtareas han sido inyectadas a la base de datos y al Kanban.'}]);
      } catch (e) {
          alert('Failed to insert');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <div className="flex border-b items-center justify-between p-3 shrink-0 bg-background">
         <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
             <Sparkles className="size-4 text-blue-500" /> Ticket Architect: Ready
         </div>
         <div className="flex items-center gap-2">
             <span className="text-xs text-muted-foreground whitespace-nowrap">Asignar a Módulo:</span>
             <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="Selecciona un módulo" />
                </SelectTrigger>
                <SelectContent>
                    {availableModules.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">{m.project.name} {'>'} {m.name}</SelectItem>
                    ))}
                </SelectContent>
             </Select>
         </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-4">
          {messages.map((msg, i) => {
             const { text, proposal } = parseContent(msg.content);
             const isAssistant = msg.role === 'assistant';

             return (
              <div key={i} className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${isAssistant ? 'bg-blue-600 text-white' : 'bg-primary text-primary-foreground'}`}>
                   {isAssistant ? <BotIcon size={16} /> : <UserIcon size={16} />}
                </div>
                <div className={`flex flex-col gap-2 max-w-[80%] ${isAssistant ? 'items-start' : 'items-end'}`}>
                   <div className={`p-3 rounded-2xl whitespace-pre-wrap text-sm ${isAssistant ? 'bg-background border shadow-sm' : 'bg-primary text-primary-foreground'}`}>
                      {text.trim()}
                   </div>

                   {/* Render Proposal Card if parsed */}
                   {proposal && (
                       <Card className="w-full mt-2 border-primary/40 bg-blue-500/5 shadow-md">
                           <CardContent className="p-4 space-y-3">
                               <div className="flex items-start justify-between">
                                  <div>
                                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Propuesta de Ticket (AI)</p>
                                      <h3 className="font-bold">{proposal.title}</h3>
                                  </div>
                                  <Badge variant="destructive">{proposal.priority}</Badge>
                               </div>
                               <p className="text-xs text-muted-foreground">{proposal.description}</p>
                               <div className="space-y-2 mt-4 bg-background p-3 rounded-md border">
                                  <p className="text-xs font-semibold">Subtareas a generar ({proposal.subtasks.length}):</p>
                                  <ul className="text-xs space-y-1">
                                      {proposal.subtasks.map((st: any, idx: number) => (
                                          <li key={idx} className="flex justify-between items-center bg-muted/50 p-1.5 rounded">
                                              <span>{idx+1}. {st.title}</span>
                                              <span className="font-mono text-muted-foreground">{st.estimatedTime}m</span>
                                          </li>
                                      ))}
                                  </ul>
                                  <div className="pt-2 flex justify-end font-bold text-xs border-t mt-2 text-primary">
                                      Total Estimado: {proposal.subtasks.reduce((acc: number, cur: any) => acc + cur.estimatedTime, 0) / 60} horas
                                  </div>
                               </div>
                               <Button size="sm" className="w-full mt-2" onClick={() => handleApproveProposal(proposal)}>
                                  <CheckCircle2 className="size-4 mr-2" /> Aprobar e Insertar en Módulo
                               </Button>
                           </CardContent>
                       </Card>
                   )}
                </div>
              </div>
            )
          })}
          {loading && (
             <div className="flex gap-3">
                <div className="size-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                   <BotIcon size={16} />
                </div>
                <div className="p-3 rounded-2xl bg-background border flex items-center gap-2 text-sm text-muted-foreground shadow-sm">
                   <Loader2 className="animate-spin size-4" /> Pensando la arquitectura óptima...
                </div>
             </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background border-t shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 max-w-4xl mx-auto relative">
          <Input 
             disabled={loading}
             placeholder="Ej: La API de pagos está fallando on-load. Estímame subtareas de debugging para mi..." 
             value={draft}
             onChange={e => setDraft(e.target.value)}
             className="pr-12 bg-muted/50 focus-visible:bg-background h-12 rounded-xl"
          />
          <Button disabled={loading || !draft.trim()} size="icon" type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 size-9 rounded-lg shadow-none hover:bg-primary/90">
             <SendIcon className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

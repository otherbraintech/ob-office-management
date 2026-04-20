'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendIcon, BotIcon, UserIcon, Loader2, Sparkles, CheckCircle2, Plus, MessageSquare } from 'lucide-react';
import { aiChat, createTicketFromAI, addAiMessage, createAiConversation, getAiConversationMessages } from '@/app/actions/ai';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, useRouter } from 'next/navigation';

export function AIChatInterface({ 
  availableModules, 
  availableProjects,
  currentUserId,
  currentUserRole,
  initialConversations,
  contextProject
}: { 
  availableModules: any[], 
  availableProjects: any[],
  currentUserId: string,
  currentUserRole: string,
  initialConversations: any[],
  contextProject?: any
}) {
  const [conversations, setConversations] = useState<any[]>(initialConversations);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<{role: 'user' | 'assistant' | 'system', content: string}[]>([
      { role: 'assistant', content: contextProject 
        ? `¡Hola! Veo que estás trabajando en el proyecto "${contextProject.name}". Cuéntame qué necesitas añadir y te ayudaré a estructurarlo.` 
        : '¡Hola! Soy tu Asistente IA. Cuéntame sobre lo que necesitas y te guiaré para crear y detallar tu requerimiento en el sistema.' 
      }
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(
    contextProject ? `project_${contextProject.id}` : (availableModules[0] ? `module_${availableModules[0].id}` : '')
  );
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipFetchRef = useRef(false);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }
  }, [messages, loading]);

  // Load messages when selecting a conversation
  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }

    if (currentConvId) {
      setLoading(true);
      getAiConversationMessages(currentConvId).then(res => {
        if (res.data) {
          setMessages(res.data.map((m: any) => ({ role: m.role, content: m.content })));
        }
        setLoading(false);
      });
    } else {
      setMessages([{ role: 'assistant', content: '¡Hola! Soy tu Asistente IA. Cuéntame sobre lo que necesitas y te guiaré para crear y detallar tu requerimiento en el sistema.' }]);
    }
  }, [currentConvId]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPromptProcessed = useRef(false);
  const [contextProjectId, setContextProjectId] = useState<string | null>(null);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    const moduleId = searchParams.get('moduleId');
    const projectId = searchParams.get('projectId');
    
    if (moduleId) {
      setSelectedTarget(`module_${moduleId}`);
    } else if (projectId) {
      setSelectedTarget(`project_${projectId}`);
    }
    
    if (projectId) {
      setContextProjectId(projectId);
    }

    if (prompt && !initialPromptProcessed.current) {
      initialPromptProcessed.current = true;
      
      // Limpiar la URL de los parámetros del prompt para evitar re-ejecuciones al recargar (F5)
      const newUrl = window.location.pathname;
      router.replace(newUrl);

      // Pequeño delay para asegurar que el componente esté totalmente hidratado
      // y evitar el error "Cannot update a component while rendering"
      setTimeout(() => {
        handleSend(prompt);
      }, 100);
    }
  }, [searchParams]); // Quitar 'conversations' de aquí

  const handleNewChat = () => {
    setCurrentConvId(null);
  };

  const isSending = useRef(false);

  const handleSend = async (manualPrompt?: string) => {
    if (isSending.current) return;
    const userDraft = (manualPrompt || draft).trim();
    if (!userDraft) return;
    
    isSending.current = true;
    // UI Update IMMEDIATE to ensure user sees their message
    setMessages(prev => [...prev, { role: 'user' as const, content: userDraft }]);
    setDraft('');
    setLoading(true);

    try {
      let convIdToUse = currentConvId;
      
      // Si no hay conversación activa, crear una primero al vuelo
      if (!convIdToUse) {
        const title = userDraft.substring(0, 30) + (userDraft.length > 30 ? '...' : '');
        const newConvRes = await createAiConversation(currentUserId, title);
        if (newConvRes.data) {
          convIdToUse = newConvRes.data.id;
          skipFetchRef.current = true; // Mark to skip the useEffect fetch
          setCurrentConvId(convIdToUse);
          setConversations(prev => [newConvRes.data, ...prev]);
          // Guardar el mensaje inicial de bienvenida en la nueva conver en plano secundario
          // Usamos una referencia estable o el valor inicial directamente
          addAiMessage(newConvRes.data.id, 'assistant', '¡Hola! Soy tu Asistente IA. Cuéntame sobre lo que necesitas y te guiaré para crear y detallar tu requerimiento en el sistema.');
        }
      }

      if (convIdToUse) {
        // Guardar mensaje del usuario
        await addAiMessage(convIdToUse, 'user', userDraft);
      }

      // Obtener el estado más reciente de mensajes para la llamada a la IA
      // Construimos el array manualmente para evitar cierres de variables (closures) antiguos
      // y no llamamos a performAiChat dentro de un setState
      const latestMessages = [
        ...messages,
        { role: 'user' as const, content: userDraft }
      ];
      
      await performAiChat(latestMessages, convIdToUse);

    } catch (e: any) {
      console.error("AI Chat Frontend Error:", e);
      setMessages(prev => [...prev, { role: 'assistant', content: `Lo siento, hubo un error. Detalle: ${e.message}` }]);
      setLoading(false);
      isSending.current = false;
    }
  };

  const performAiChat = async (msgs: any[], convId: string | null) => {
    try {
      const resp = await aiChat(msgs, currentUserRole);
      if (resp.error) throw new Error(resp.error);
      
      const aiResponseContent = resp.data || 'Sin respuesta';
      
      // Update UI with AI response
      setMessages(prev => [...prev, { role: 'assistant' as const, content: aiResponseContent }]);
      
      if (convId) {
        // Guardar respuesta en BD en segundo plano
        addAiMessage(convId, 'assistant', aiResponseContent);
      }
    } catch (e: any) {
      console.error("AI Chat Response Error:", e);
      setMessages(prev => [...prev, { role: 'assistant', content: `Lo siento, hubo un error al procesar la respuesta. Reintenta enviar tu mensaje.` }]);
    } finally {
      setLoading(false);
      isSending.current = false;
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
          const [type, targetId] = selectedTarget.split('_');
          const resp = await createTicketFromAI({
              ...proposal,
              moduleId: type === 'module' ? targetId : undefined,
              projectId: type === 'project' ? targetId : (availableModules.find(m => m.id === targetId)?.projectId),
              leadId: currentUserId
          });
          if (resp.error) throw new Error(resp.error);
          
          const successMsg = '¡Éxito! ✅ El ticket y las subtareas han sido inyectadas a la base de datos y al Kanban.';
          setMessages(prev => [...prev, { role: 'assistant', content: successMsg }]);
          if (currentConvId) {
             await addAiMessage(currentConvId, 'system', successMsg);
          }
      } catch (e: any) {
          alert('Error al insertar el ticket: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background flex-col md:flex-row">
      {/* Sidebar de Historial */}
      <div className="w-full md:w-1/4 md:min-w-[280px] border-r flex flex-col bg-muted/10 shrink-0">
        <div className="p-4 border-b">
           <Button onClick={handleNewChat} className="w-full justify-start rounded-none font-bold" variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Chat
           </Button>
        </div>
        <ScrollArea className="flex-1">
           <div className="p-2 space-y-1">
             {conversations.length === 0 && <p className="text-xs text-muted-foreground p-2 text-center mt-4">Sin historial</p>}
             {conversations.map(conv => (
               <Button 
                key={conv.id} 
                variant={currentConvId === conv.id ? "secondary" : "ghost"}
                className={`w-full justify-start font-normal rounded-none h-10 px-3 ${currentConvId === conv.id ? 'bg-primary/10 text-primary' : ''}`}
                onClick={() => setCurrentConvId(conv.id)}
               >
                 <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                 <span className="truncate">{conv.title}</span>
               </Button>
             ))}
           </div>
        </ScrollArea>
      </div>

      {/* Zona Principal de Chat */}
      <div className="flex-1 flex flex-col bg-background/50">
        <div className="flex border-b items-center justify-between p-3 shrink-0 bg-background/80 backdrop-blur-sm">
           <div className="flex items-center gap-2 text-sm font-medium">
               <Sparkles className="size-4 text-primary" /> 
               <span className="font-bold text-foreground">
                {currentConvId 
                  ? conversations.find(c => c.id === currentConvId)?.title 
                  : 'Nuevo Chat'}
               </span>
               {contextProject && (
                 <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-wider font-bold">
                   PROYECTO: {contextProject.name}
                 </Badge>
               )}
           </div>
        </div>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="flex flex-col gap-4 max-w-3xl mx-auto py-4">
            {messages.map((msg, i) => {
               const { text, proposal } = parseContent(msg.content);
               const isAssistant = msg.role === 'assistant' || msg.role === 'system';

               return (
                <div key={i} className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
                  <div className={`size-8 rounded-none flex items-center justify-center shrink-0 ${isAssistant ? 'bg-foreground text-background' : 'bg-primary/20 text-primary'}`}>
                     {isAssistant ? <BotIcon size={16} /> : <UserIcon size={16} />}
                  </div>
                  <div className={`flex flex-col gap-2 max-w-[85%] ${isAssistant ? 'items-start' : 'items-end'}`}>
                     <div className={`p-3 rounded-none border whitespace-pre-wrap text-[13px] leading-relaxed ${isAssistant ? 'bg-background border-foreground/10 shadow-sm' : 'bg-primary/20 border-transparent text-foreground'}`}>
                        {text.trim()}
                     </div>

                     {/* Render Proposal Card if parsed */}
                     {proposal && (
                         <Card className="w-full mt-2 border-primary/20 rounded-none bg-primary/5 shadow-none">
                             <CardContent className="p-5 space-y-4">
                                 <div className="flex items-start justify-between border-b border-primary/10 pb-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Propuesta de Arquitectura</p>
                                        <h3 className="font-bold text-lg">{proposal.title}</h3>
                                    </div>
                                    <Badge variant="outline" className="rounded-none border-primary/50 text-primary font-bold">
                                      {proposal.priority === 'LOW' ? 'BAJA' : 
                                       proposal.priority === 'MEDIUM' ? 'MEDIA' : 
                                       proposal.priority === 'HIGH' ? 'ALTA' : 'URGENTE'}
                                    </Badge>
                                 </div>
                                 <p className="text-sm text-foreground/80">{proposal.description}</p>
                                 <div className="space-y-3 mt-4 bg-background/50 p-4 border border-foreground/10">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subtareas Estructuradas ({proposal.subtasks.length})</p>
                                    <ul className="text-sm space-y-2">
                                        {proposal.subtasks.map((st: any, idx: number) => (
                                            <li key={idx} className="flex justify-between items-start border-b border-foreground/5 pb-2 last:border-0 last:pb-0">
                                                <span className="pr-4"><span className="text-muted-foreground font-mono mr-2">{idx+1}.</span> {st.title}</span>
                                                <span className="font-mono text-muted-foreground bg-muted px-2 py-0.5 whitespace-nowrap">{st.estimatedTime}m</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pt-3 flex justify-between items-center font-bold text-sm border-t border-foreground/10 mt-3">
                                        <span className="text-muted-foreground">Impacto de Tiempo:</span>
                                        <span>{proposal.subtasks.reduce((acc: number, cur: any) => acc + cur.estimatedTime, 0) / 60} hrs</span>
                                    </div>
                                 </div>
                                  {/* Destino del Ticket */}
                                  <div className="space-y-2 pt-2 border-t border-primary/10">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Destino del Requerimiento</label>
                                    <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                                      <SelectTrigger className="h-9 rounded-none bg-background/50 border-primary/20 text-xs">
                                        <SelectValue placeholder="Seleccionar destino..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase bg-muted/30">Proyectos Raíz</div>
                                        {availableProjects.map(proj => (
                                          <SelectItem key={`p-${proj.id}`} value={`project_${proj.id}`} className="text-xs">
                                            Proyecto: {proj.name}
                                          </SelectItem>
                                        ))}
                                        
                                        <div className="p-2 mt-2 text-[10px] font-bold text-muted-foreground uppercase bg-muted/30 border-t">Módulos Específicos</div>
                                        {availableModules.map(mod => (
                                          <SelectItem key={`m-${mod.id}`} value={`module_${mod.id}`} className="text-xs">
                                            {mod.project?.name} &gt; {mod.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <Button size="sm" className="w-full mt-2 rounded-none font-bold" onClick={() => handleApproveProposal(proposal)}>
                                     <CheckCircle2 className="size-4 mr-2" /> Aprobar y Crear Ticket
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
                  <div className="size-8 bg-foreground text-background flex items-center justify-center shrink-0">
                     <BotIcon size={16} />
                  </div>
                  <div className="p-4 border bg-background border-foreground/10 flex items-center gap-3 text-sm text-muted-foreground shadow-sm">
                     <Loader2 className="animate-spin size-4" /> Ejecutando inferencia estructurada...
                  </div>
               </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 bg-background/80 backdrop-blur-sm border-t border-foreground/5 shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 max-w-3xl mx-auto relative">
            <Input 
               disabled={loading}
               placeholder="Ej: La API de pagos está fallando on-load. Estímame subtareas de debugging para mi..." 
               value={draft}
               onChange={e => setDraft(e.target.value)}
               className="pr-12 bg-background border-foreground/20 focus-visible:ring-primary h-12 rounded-none"
            />
            <Button disabled={loading || !draft.trim()} size="icon" type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 size-9 rounded-none shadow-none">
               <SendIcon className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

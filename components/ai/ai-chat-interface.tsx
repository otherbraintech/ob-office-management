'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SendIcon, BotIcon, UserIcon, Loader2, Sparkles, CheckCircle2, Plus, MessageSquare, Mic, MicOff, History, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react';
import { aiChat, createTicketFromAI, addAiMessage, createAiConversation, getAiConversationMessages, updateAiConversationTitle } from '@/app/actions/ai';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';

export function AIChatInterface({ 
  availableModules, 
  availableProjects,
  user,
  initialConversations,
  contextProject
}: { 
  availableModules: any[], 
  availableProjects: any[],
  user: any,
  initialConversations: any[],
  contextProject?: any
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useSidebar();

  const urlChatId = searchParams.get('chatId');

  const [conversations, setConversations] = useState<any[]>(initialConversations);
  const [currentConvId, setCurrentConvId] = useState<string | null>(urlChatId);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant' | 'system', content: string}[]>([]);
  const [loading, setLoading] = useState(!!urlChatId);
  const [draft, setDraft] = useState('');
  
  const [selectedTarget, setSelectedTarget] = useState(
    contextProject ? `project_${contextProject.id}` : (availableModules[0] ? `module_${availableModules[0].id}` : '')
  );

  const [greeted, setGreeted] = useState(false);
  const [displayedGreeting, setDisplayedGreeting] = useState('');
  const fullGreeting = contextProject 
    ? `¡Hola! Veo que estás trabajando en el proyecto "${contextProject.name}". Cuéntame qué necesitas añadir y te ayudaré a estructurarlo.` 
    : '¡Hola! Soy tu Asistente IA. Cuéntame sobre lo que necesitas y te guiaré para crear y detallar tu requerimiento en el sistema.';

  useEffect(() => {
    if (!currentConvId && !greeted) {
      let index = 0;
      setDisplayedGreeting('');
      const interval = setInterval(() => {
        setDisplayedGreeting(prev => prev + fullGreeting[index]);
        index++;
        if (index >= fullGreeting.length) {
          clearInterval(interval);
          setGreeted(true);
        }
      }, 10);
      return () => clearInterval(interval);
    } else {
        setDisplayedGreeting(fullGreeting);
    }
  }, [currentConvId]);

  // Sincronizar chatId con la URL para persistencia en F5
  useEffect(() => {
    const chatId = searchParams.get('chatId');
    if (chatId && chatId !== currentConvId) {
      setCurrentConvId(chatId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentConvId && currentConvId !== urlChatId) {
      const url = new URL(window.location.href);
      url.searchParams.set('chatId', currentConvId);
      window.history.replaceState(null, '', url.toString());
    }
  }, [currentConvId]);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [showHistory, setShowHistory] = useState(true);

  // Default hide history on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowHistory(false);
    }
  }, []);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipFetchRef = useRef(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  useEffect(() => {
    if (currentConvId) {
      const conv = conversations.find(c => c.id === currentConvId);
      if (conv) setTempTitle(conv.title);
    }
  }, [currentConvId]);

  const handleSaveTitle = async () => {
    if (!currentConvId || !tempTitle.trim()) return;
    const res = await updateAiConversationTitle(currentConvId, tempTitle.trim());
    if (res.data) {
      setConversations(prev => prev.map(c => c.id === currentConvId ? { ...c, title: tempTitle.trim() } : c));
      setIsEditingTitle(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
    // Re-scroll shortly after to catch images or cards rendering
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, loading, greeted, displayedGreeting]);

  // Load messages when selecting a conversation
  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }

    if (currentConvId) {
      setLoading(true);
      setMessages([]); // Limpiar mensajes mientras carga para evitar confusión
      getAiConversationMessages(currentConvId).then(res => {
        if (res.data) {
          setMessages(res.data.map((m: any) => ({ role: m.role, content: m.content })));
        }
        setLoading(false);
      });
    } else {
      setMessages([]);
    }
  }, [currentConvId]);

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
    setShowHistory(false);
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
        const newConvRes = await createAiConversation(user.id, title);
        if (newConvRes.data) {
          convIdToUse = newConvRes.data.id;
          skipFetchRef.current = true; // Mark to skip the useEffect fetch
          setCurrentConvId(convIdToUse);
          setConversations(prev => [newConvRes.data, ...prev]);
          // Guardar el mensaje inicial de bienvenida en la nueva conver en plano secundario
          addAiMessage(newConvRes.data.id, 'assistant', fullGreeting);
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
      const resp = await aiChat(msgs, user.role);
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
              leadId: user.id
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

  const toggleVoiceRecord = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta el reconocimiento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setDraft(prev => prev + ' ' + transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background flex-row min-h-0 relative border-t border-foreground/5">
      {/* Zona Principal de Chat */}
      <div className="flex-1 flex flex-col bg-background/50 min-h-0 overflow-hidden relative">
        <div className="flex border-b items-center justify-between p-3 shrink-0 bg-background/80 backdrop-blur-sm z-10">
           <div className="flex items-center gap-3 text-sm font-medium flex-1">
               {/* Vanessa Avatar + Profile Dialog */}
               <Dialog>
                 <DialogTrigger asChild>
                   <button className="relative cursor-pointer shrink-0 group" aria-label="Ver perfil de Vanessa">
                     <Avatar className="size-9 rounded-full border-2 border-primary/20 shadow-sm transition-all group-hover:border-primary/60">
                       <AvatarImage src="/vanessa.png" className="object-cover" />
                       <AvatarFallback className="text-xs font-bold">VN</AvatarFallback>
                     </Avatar>
                     <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-400 border-2 border-background" />
                   </button>
                 </DialogTrigger>
                 <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border border-foreground/10 shadow-2xl">
                   <div className="relative">
                     <img src="/vanessa.png" alt="Vanessa" className="w-full h-52 object-cover object-top" />
                     <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                     <div className="absolute bottom-4 left-4">
                       <p className="text-xs font-bold uppercase tracking-widest text-primary opacity-80">AGENTE IA · OB WORKSPACE</p>
                       <h2 className="text-2xl font-black tracking-tight">Vanessa Reyes</h2>
                     </div>
                   </div>
                   <div className="p-5 space-y-3">
                     <div className="flex items-center gap-2">
                       <span className="size-2 rounded-full bg-green-400 shrink-0" />
                       <span className="text-xs font-bold text-green-500 uppercase tracking-widest">En línea</span>
                     </div>
                     <div className="grid grid-cols-2 gap-3 text-xs">
                       <div className="bg-muted/40 rounded-xl p-3 border border-foreground/5">
                         <p className="text-muted-foreground uppercase tracking-wider font-bold mb-1">Edad</p>
                         <p className="font-black text-base">24 años</p>
                       </div>
                       <div className="bg-muted/40 rounded-xl p-3 border border-foreground/5">
                         <p className="text-muted-foreground uppercase tracking-wider font-bold mb-1">Rol</p>
                         <p className="font-black text-base">Orquestadora</p>
                       </div>
                     </div>
                     <div className="bg-muted/40 rounded-xl p-3 border border-foreground/5 text-xs space-y-1">
                       <p className="text-muted-foreground uppercase tracking-wider font-bold">Especialidades</p>
                       <div className="flex flex-wrap gap-1 pt-1">
                         {["Tickets", "Arquitectura", "Subtareas", "Estimaciones", "Estructuración"].map(s => (
                           <Badge key={s} variant="secondary" className="text-[9px] font-bold uppercase rounded-full">{s}</Badge>
                         ))}
                       </div>
                     </div>
                     <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-3">
                       "De la idea al ticket en segundos, cariño ✨"
                     </p>
                   </div>
                 </DialogContent>
               </Dialog>

               <div className="flex items-center gap-2 flex-1">
                 {isEditingTitle ? (
                   <div className="flex items-center gap-1 flex-1 max-w-sm">
                     <Input 
                       value={tempTitle}
                       onChange={e => setTempTitle(e.target.value)}
                       className="h-7 text-xs rounded-lg focus-visible:ring-1"
                       autoFocus
                       onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                     />
                     <Button size="icon-sm" variant="ghost" onClick={handleSaveTitle} className="size-7 cursor-pointer">
                       <Check className="size-3 text-green-600" />
                     </Button>
                     <Button size="icon-sm" variant="ghost" onClick={() => setIsEditingTitle(false)} className="size-7 cursor-pointer">
                       <X className="size-3 text-red-600" />
                     </Button>
                   </div>
                 ) : (
                   <div className="flex items-center gap-2 group">
                     <span className="font-bold text-foreground truncate max-w-[150px] md:max-w-none">
                      {currentConvId 
                        ? (conversations.find(c => c.id === currentConvId)?.title || tempTitle) 
                        : 'Vanessa'}
                     </span>
                     {currentConvId && (
                       <Button 
                         size="icon-sm" 
                         variant="ghost" 
                         onClick={() => setIsEditingTitle(true)}
                         className="size-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       >
                         <Pencil className="size-3 text-muted-foreground" />
                       </Button>
                     )}
                   </div>
                 )}
               </div>
               {contextProject && (
                 <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-wider font-bold hidden sm:flex font-mono">
                   {contextProject.name}
                 </Badge>
               )}
           </div>


           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => setShowHistory(!showHistory)}
             className={`rounded-lg px-3 flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors h-9 cursor-pointer ${!showHistory ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
           >
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Historial</span>
             <History className="size-3.5" />
           </Button>
        </div>

        <ScrollArea className="flex-1 px-4 md:px-8" ref={scrollRef}>
          <div className="flex flex-col gap-6 w-full py-8">
            {/* CENTRAL LOADING STATE */}
            {loading && messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <Loader2 className="size-8 text-primary animate-spin mb-4" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Cargando conversación...</p>
              </div>
            )}

            {/* GREETING MESSAGE ELIMINADO */}


            {messages.map((msg, i) => {
               const { text, proposal } = parseContent(msg.content);
               const isAssistant = msg.role === 'assistant' || msg.role === 'system';

               return (
                <div key={i} className={`flex gap-4 ${isAssistant ? '' : 'flex-row-reverse'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`size-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${isAssistant ? 'bg-foreground text-background border-foreground/10' : 'bg-primary text-primary-foreground border-primary overflow-hidden'}`}>
                     {isAssistant ? (
                       <Avatar className="size-full rounded-full">
                         <AvatarImage src="/vanessa.png" className="object-cover" />
                         <AvatarFallback>VN</AvatarFallback>
                       </Avatar>
                     ) : (
                       <Avatar className="size-full rounded-full">
                         <AvatarImage src={user.image} />
                         <AvatarFallback className="rounded-full bg-primary text-primary-foreground">{user.name?.[0] || user.username?.[0]}</AvatarFallback>
                       </Avatar>
                     )}
                  </div>
                  <div className={`flex flex-col gap-2 max-w-[90%] md:max-w-[75%] ${isAssistant ? 'items-start' : 'items-end'}`}>
                     <div className={`p-4 border whitespace-pre-wrap text-[13px] leading-relaxed w-full overflow-hidden shadow-sm ${isAssistant 
                        ? 'bg-muted/40 border-foreground/5 text-foreground font-medium rounded-2xl rounded-tl-none' 
                        : 'bg-background border-primary/20 text-foreground rounded-2xl rounded-tr-none'}`}>
                        {text.trim()}
                     </div>

                     {/* Render Proposal Card if parsed */}
                     {proposal && (
                         <Card className="w-full mt-2 border-primary/20 rounded-2xl bg-primary/5 shadow-none overflow-hidden">
                             <CardContent className="p-5 space-y-4">
                                 <div className="flex items-start justify-between border-b border-primary/10 pb-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Propuesta de Arquitectura</p>
                                        <h3 className="font-bold text-lg">{proposal.title}</h3>
                                    </div>
                                    <Badge variant="outline" className="rounded-lg border-primary/50 text-primary font-bold">
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
                                      <SelectTrigger className="h-9 rounded-lg bg-background/50 border-primary/20 text-xs">
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

                                  <Button size="sm" className="w-full mt-2 rounded-lg font-bold cursor-pointer" onClick={() => handleApproveProposal(proposal)}>
                                     <CheckCircle2 className="size-4 mr-2" /> Aprobar y Crear Ticket
                                  </Button>
                             </CardContent>
                         </Card>
                     )}
                  </div>
                </div>
              )
            })}
            {loading && messages.length > 0 && (
               <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <div className="size-9 rounded-full flex items-center justify-center shrink-0 border bg-background text-foreground border-foreground/10 overflow-hidden">
                     <Avatar className="size-full rounded-full">
                        <AvatarImage src="/vanessa.png" className="object-cover" />
                        <AvatarFallback>VN</AvatarFallback>
                     </Avatar>
                  </div>
                  <div className="p-4 border bg-muted/40 border-foreground/5 flex items-center gap-1 text-sm text-foreground/50 shadow-sm min-w-16 rounded-2xl rounded-tl-none">
                     <span className="flex gap-1">
                        <span className="size-1 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="size-1 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="size-1 bg-foreground/30 rounded-full animate-bounce"></span>
                     </span>
                  </div>
               </div>
            )}
          </div>
        </ScrollArea>

        {!(loading && messages.length === 0) && (
          <div className="p-3 bg-background/80 backdrop-blur-sm border-t border-foreground/5 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 max-w-3xl mx-auto relative">
              <Input 
                 disabled={loading}
                 placeholder="Dime tus requerimientos para el ticket de hoy y te ayudare a estructurarlos" 
                 value={draft}
                 onChange={e => setDraft(e.target.value)}
                 className="pr-24 bg-background border-foreground/10 focus-visible:ring-1 focus-visible:ring-primary/20 h-12 rounded-xl transition-all"
              />
              <div className="absolute right-1 top-1 bottom-1 flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        type="button"
                        onClick={toggleVoiceRecord}
                        size="icon" 
                        className={`size-10 rounded-full shadow-none cursor-pointer bg-transparent hover:bg-muted transition-all ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{isListening ? 'Detener dictado' : 'Dictar mensaje'}</p>
                    </TooltipContent>
                  </Tooltip>
  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        disabled={loading || !draft.trim()} 
                        size="icon" 
                        type="submit" 
                        className="size-10 cursor-pointer rounded-full shadow-none bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                      >
                        <SendIcon className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Enviar mensaje</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Sidebar de Historial (Ahora a la derecha) */}
      {/* Sidebar de Historial (Ahora a la derecha con transición suave) */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-[80%] sm:w-[350px] bg-background border-l flex flex-col shadow-2xl 
        transition-all duration-300 ease-in-out lg:relative lg:inset-auto lg:z-auto lg:shadow-none overflow-hidden
        ${showHistory ? 'translate-x-0 lg:w-[350px] lg:opacity-100 lg:border-l' : 'translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:border-none'}
      `}>
          <div className="p-3 border-b shrink-0 flex items-center justify-between min-w-[350px]">
             <Button onClick={() => { handleNewChat(); setGreeted(false); }} className="flex-1 justify-start rounded-lg font-bold h-9 text-xs cursor-pointer" variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Chat
             </Button>
             <Button variant="ghost" size="icon" className="lg:hidden cursor-pointer" onClick={() => setShowHistory(false)}>
                <ChevronRight className="size-4" />
             </Button>
          </div>
          <ScrollArea className="flex-1 min-w-[350px]">
             <div className="p-2 space-y-1">
               {conversations.length === 0 && <p className="text-[10px] text-muted-foreground p-2 text-center mt-2 uppercase tracking-widest font-bold">Sin historial</p>}
               {conversations.map(conv => (
                 <Button 
                  key={conv.id} 
                  variant={currentConvId === conv.id ? "secondary" : "ghost"}
                  className={`w-full justify-start font-normal rounded-lg h-9 px-3 text-xs cursor-pointer ${currentConvId === conv.id ? 'bg-primary/10 text-primary border-l-2 border-primary' : ''}`}
                  onClick={() => {
                    setCurrentConvId(conv.id);
                    if (window.innerWidth < 1024) setShowHistory(false);
                  }}
                 >
                   <MessageSquare className="mr-2 h-3 w-3 shrink-0" />
                   <span className="truncate">{conv.title}</span>
                 </Button>
               ))}
             </div>
          </ScrollArea>
      </div>

      {/* Overlay para cerrar en móvil */}
      {showHistory && (
        <div 
          className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-40 lg:hidden" 
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Briefcase, 
  Box, 
  Ticket, 
  ListTodo, 
  ArrowRight, 
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-10 max-w-5xl mx-auto w-full overflow-x-hidden">
      <div className="flex flex-col gap-3 text-center md:text-left">
        <div className="flex items-center gap-2 justify-center md:justify-start text-primary">
          <HelpCircle className="size-6" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Guía de Estructura y Gestión</h1>
        </div>
        <p className="text-muted-foreground text-base md:text-lg">
          Aprende cómo organizar el trabajo en OB-Workspace utilizando nuestra jerarquía de 4 niveles.
        </p>
      </div>

      {/* Diagrama Jerárquico Reestructurado para Precisión de Líneas */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 md:p-8 rounded-none overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
        <div className="w-[850px] mx-auto h-[430px] relative font-sans">
          
          {/* SVG Baseline para conectar todo */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible" style={{ zIndex: 0 }}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="fill-zinc-300 dark:fill-zinc-700" />
              </marker>
            </defs>
            
            {/* LÍNEAS NIVEL 1 -> 2 */}
            <path d="M 425 60 L 425 80" fill="none" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" />
            <path d="M 425 80 L 250 80 L 250 110" fill="none" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <path d="M 425 80 L 600 80 L 600 110" fill="none" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" markerEnd="url(#arrowhead)" />
            
            {/* LÍNEAS TICKET DIRECTO */}
            <path d="M 425 80 L 780 80 Q 780 80 780 210" fill="none" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" markerEnd="url(#arrowhead)" />

            {/* LÍNEAS NIVEL 2 -> 3 (Módulo A) */}
            <path d="M 250 165 L 250 185" fill="none" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" />
            <path d="M 250 185 L 150 185 L 150 210" fill="none" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <path d="M 250 185 L 350 185 L 350 210" fill="none" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" markerEnd="url(#arrowhead)" />

            {/* LÍNEAS NIVEL 3 -> 4 (IA BREAKDOWN) */}
            {/* Ticket 1 */}
            <path d="M 150 270 L 150 330" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1" strokeDasharray="4" markerEnd="url(#arrowhead)" />
            <g transform="translate(95, 290)">
              <rect width="110" height="18" fill="white" className="fill-zinc-50 dark:fill-zinc-900 border border-zinc-200 dark:border-zinc-800" />
              <text x="55" y="12" textAnchor="middle" className="text-[8px] font-bold uppercase tracking-tighter fill-primary/40">Desglose Automático IA</text>
            </g>

            {/* Ticket 2 */}
            <path d="M 350 270 L 350 330" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1" strokeDasharray="4" markerEnd="url(#arrowhead)" />
            <g transform="translate(295, 290)">
              <rect width="110" height="18" fill="white" className="fill-zinc-50 dark:fill-zinc-900 border border-zinc-200 dark:border-zinc-800" />
              <text x="55" y="12" textAnchor="middle" className="text-[8px] font-bold uppercase tracking-tighter fill-primary/40">Desglose Automático IA</text>
            </g>

            {/* Ticket 3 */}
            <path d="M 780 270 L 780 330" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1" strokeDasharray="4" markerEnd="url(#arrowhead)" />
            <g transform="translate(725, 290)">
              <rect width="110" height="18" fill="white" className="fill-zinc-50 dark:fill-zinc-900 border border-zinc-200 dark:border-zinc-800" />
              <text x="55" y="12" textAnchor="middle" className="text-[8px] font-bold uppercase tracking-tighter fill-primary/40">Desglose Automático IA</text>
            </g>
          </svg>

          {/* NODOS (Posicionados de forma absoluta para matching perfecto) */}
          
          {/* Etiquetas a la izquierda */}
          <div className="absolute left-0 top-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Proyecto</div>
          <div className="absolute left-0 top-130 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50" style={{top: '120px'}}>Módulo</div>
          <div className="absolute left-0 top-230 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50" style={{top: '220px'}}>Ticket</div>
          <div className="absolute left-0 top-340 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50" style={{top: '340px'}}>Subtarea</div>

          {/* Nivel 1 */}
          <div className="absolute" style={{ left: '325px', top: '10px' }}>
            <DiagramNode icon={<Briefcase className="size-4" />} title="P [Proyecto]" id="1" />
          </div>

          {/* Nivel 2 */}
          <div className="absolute" style={{ left: '150px', top: '110px' }}>
            <DiagramNode icon={<Box className="size-4" />} title="M1 [Módulo A]" id="2" />
          </div>
          <div className="absolute" style={{ left: '500px', top: '110px' }}>
            <DiagramNode icon={<Box className="size-4" />} title="M2 [Módulo B]" id="5" />
          </div>

          {/* Nivel 3 */}
          <div className="absolute" style={{ left: '50px', top: '215px' }}>
            <DiagramNode icon={<Ticket className="size-4" />} title="T1 [Ticket 1]" id="1" hasAI />
          </div>
          <div className="absolute" style={{ left: '250px', top: '215px' }}>
            <DiagramNode icon={<Ticket className="size-4" />} title="T2 [Ticket 2]" id="2" hasAI />
          </div>
          <div className="absolute" style={{ left: '680px', top: '215px' }}>
            <DiagramNode icon={<Ticket className="size-4" />} title="T3 [Ticket Directo]" id="3" hasAI />
          </div>

          {/* Nivel 4 */}
          <div className="absolute" style={{ left: '50px', top: '340px' }}>
            <DiagramNode icon={<ListTodo className="size-4" />} title="S1 [Subtarea 1.1]" id="1" isSubtask />
          </div>
          <div className="absolute" style={{ left: '250px', top: '340px' }}>
            <DiagramNode icon={<ListTodo className="size-4" />} title="S2 [Subtarea 1.2]" id="2" isSubtask />
          </div>
          <div className="absolute" style={{ left: '680px', top: '340px' }}>
            <DiagramNode icon={<ListTodo className="size-4" />} title="S3 [Subtarea 3.1]" id="4" isSubtask />
          </div>

        </div>
      </div>

      {/* Tutorial Paso a Paso */}
      <div className="space-y-6 mt-4">
        <h2 className="text-2xl font-bold border-b pb-2">Tutorial: Flujo de Trabajo</h2>
        
        <div className="grid gap-6">
          <TutorialStep 
            number="01"
            title="Define el Proyecto (Opcional)"
            content="Todo comienza con un Proyecto, pero no es obligatorio. Puedes crear tickets independientes para tareas externas o generales que no pertenecen a ninguna iniciativa específica."
            badge="Iniciando"
          />
          
          <TutorialStep 
            number="02"
            title="Crea Módulos o Mantén la Flexibilidad"
            content="Si un proyecto es complejo, usa Módulos. Si es una tarea directa, sáltate este paso. Un ticket puede estar en la raíz del proyecto o totalmente suelto."
            badge="Organizando"
          />

          <TutorialStep 
            number="03"
            title="Tickets con o sin Subtareas"
            content="Usa la IA para generar subtareas técnicas en requerimientos complejos. Para tareas simples, un ticket solo con título y descripción es suficiente."
            badge="Ejecutando"
          />

          <TutorialStep 
            number="04"
            title="Gestiona en el Kanban"
            content="Mueve tus tickets por los estados (Backlog, En Progreso, Hecho). Las subtareas te servirán como checklist técnico para no olvidar ningún detalle."
            badge="Finalizando"
          />
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-primary/5 border-primary/10 rounded-none overflow-hidden relative">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="size-4" /> Flexibilidad Total
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          En OB-Workspace, los tickets pueden ser "independientes": no necesitan un Proyecto, ni un Módulo, ni Subtareas. Úsalos para tareas externas o recordatorios rápidos.
        </CardContent>
        <div className="absolute -right-4 -bottom-4 opacity-5">
            <Sparkles className="size-32" />
        </div>
      </Card>
    </div>
  );
}

function DiagramNode({ icon, title, id, hasAI, isSubtask }: { icon: any, title: string, id: string, hasAI?: boolean, isSubtask?: boolean }) {
  return (
    <div className={`
      relative z-10 flex items-center gap-3 px-4 py-3 border bg-background shadow-sm
      ${isSubtask ? 'border-dashed text-muted-foreground' : 'font-bold'}
      min-w-[180px] transition-all cursor-pointer group
      hover:bg-primary hover:text-primary-foreground hover:border-primary
      hover:shadow-md
    `}>
      <div className={`
        shrink-0 size-8 flex items-center justify-center border
        ${isSubtask ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200'}
        group-hover:bg-primary-foreground group-hover:text-primary transition-colors
      `}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-tight">{title}</span>
        <span className="text-[9px] opacity-70 font-mono">ID: {id}</span>
      </div>
      {hasAI && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground p-1 rounded-none shadow-sm group-hover:bg-primary-foreground group-hover:text-primary border border-transparent group-hover:border-primary transition-colors">
           <Sparkles className="size-2.5" />
        </div>
      )}
    </div>
  );
}

function TutorialStep({ number, title, content, badge }: { number: string, title: string, content: string, badge: string }) {
  return (
    <div className="flex gap-4 md:gap-6 group">
      <div className="flex flex-col items-center">
        <div className="size-10 rounded-none border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm font-mono font-bold bg-background shrink-0 group-hover:border-primary transition-colors">
          {number}
        </div>
        <div className="flex-1 w-px bg-zinc-200 dark:bg-zinc-800 mt-2 mb-2 group-last:hidden" />
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-lg">{title}</h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 border text-muted-foreground uppercase tracking-widest leading-none rounded-none">{badge}</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {content}
        </p>
      </div>
    </div>
  );
}

"use client"

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Wand2, Download, Ticket, Eye, Code, Copy, Sparkles } from "lucide-react";
import { updateDocument, generateTicketsFromDocument, assistDocumentGeneration } from "@/app/actions/documents";
import { useTransition } from "react";
import { toast } from "sonner";
import { exportDocumentsToZip } from "@/lib/utils/export";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentEditorProps {
  document: any;
  projectName: string;
}

export function DocumentEditor({ document, projectName }: DocumentEditorProps) {
  const [content, setContent] = useState(document.content);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssisting, setIsAssisting] = useState(false);

  useEffect(() => {
    setContent(document.content);
  }, [document]);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateDocument(document.id, content);
        toast.success("Guardado");
      } catch (error) {
        toast.error("Error al guardar");
      }
    });
  };

  const handleExport = () => {
    exportDocumentsToZip(projectName, [{ name: document.name, content }]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado al portapapeles");
  };

  const handleGenerateTickets = () => {
    setIsGenerating(true);
    startTransition(async () => {
      try {
        const result = await generateTicketsFromDocument(document.id, document.projectId);
        toast.success(`Se han generado ${result.count} tickets en el módulo 'Planificación'`);
      } catch (error) {
        toast.error("Error al generar tickets");
      } finally {
        setIsGenerating(false);
      }
    });
  };

  const handleAssistGeneration = () => {
    setIsAssisting(true);
    startTransition(async () => {
       try {
           const updatedDoc = await assistDocumentGeneration(document.projectId, document.id);
           setContent(updatedDoc.content);
           toast.success("Plantilla generada con éxito");
       } catch (error) {
           toast.error("Error al generar la plantilla");
       } finally {
           setIsAssisting(false);
       }
    });
  };

  return (
    <div className="flex flex-col gap-4 flex-1 h-[calc(100vh-250px)]">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{document.name}.md</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} title="Exportar como .zip">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Exportar</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopy} title="Copiar Markdown">
             <Copy className="h-4 w-4 mr-2" />
             <span className="hidden md:inline">Copiar</span>
          </Button>
          <Button size="sm" variant="secondary" onClick={handleGenerateTickets} disabled={isGenerating || isPending}>
            <Ticket className="h-4 w-4 mr-2" />
            {isGenerating ? "Generando..." : <span className="hidden md:inline">Generar Tickets</span>}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Guardando..." : <span className="hidden md:inline">Guardar</span>}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="edit" className="flex-1 flex flex-col h-full w-full">
        <div className="flex items-center justify-between mb-2">
            <TabsList>
                <TabsTrigger value="edit" className="gap-2"><Code className="h-4 w-4" /> Editar</TabsTrigger>
                <TabsTrigger value="preview" className="gap-2"><Eye className="h-4 w-4" /> Vista Previa</TabsTrigger>
            </TabsList>
            
            <Button size="sm" variant="ghost" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950" onClick={handleAssistGeneration} disabled={isAssisting || isPending}>
                <Sparkles className="h-4 w-4 mr-2" />
                {isAssisting ? "Generando..." : "Generar Plantilla IA"}
            </Button>
        </div>

        <TabsContent value="edit" className="flex-1 mt-0 h-full border rounded-md relative data-[state=active]:flex">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none border-none h-full min-h-[400px] w-full font-mono text-sm p-4 leading-relaxed bg-muted/10 shadow-none focus-visible:ring-0"
              placeholder="# Título del documento..."
            />
            <div className="absolute bottom-4 right-4 opacity-30 pointer-events-none">
              <Wand2 className="h-8 w-8" />
            </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 mt-0 border rounded-md p-6 bg-background overflow-y-auto data-[state=active]:block">
            {content ? (
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none w-full prose-headings:scroll-m-20 prose-a:text-primary hover:prose-a:text-primary/80">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            ) : (
                <div className="text-center text-muted-foreground italic pt-12">
                    El documento está vacío. Añade contenido o usa la plantilla IA.
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

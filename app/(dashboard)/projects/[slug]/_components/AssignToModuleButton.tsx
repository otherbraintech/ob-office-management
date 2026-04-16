"use client"

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FolderInput, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { assignTicketToModule } from "@/app/actions/projects";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AssignToModuleButtonProps {
  ticketId: string;
  modules: { id: string, name: string }[];
}

export function AssignToModuleButton({ ticketId, modules }: AssignToModuleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAssign = (moduleId: string) => {
    startTransition(async () => {
      try {
        await assignTicketToModule(ticketId, moduleId);
        toast.success("Ticket movido al módulo");
        router.refresh();
      } catch (error) {
        toast.error("Error al mover el ticket");
      }
    });
  };

  if (modules.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
            variant="ghost" 
            size="icon" 
            className="size-7 rounded-none hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover/backlog:opacity-100"
            disabled={isPending}
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <FolderInput className="size-3" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none border-2 border-primary/20 w-48">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Mover a Módulo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {modules.map((mod) => (
          <DropdownMenuItem 
            key={mod.id} 
            onSelect={() => handleAssign(mod.id)}
            className="text-xs font-bold uppercase cursor-pointer hover:bg-primary/5"
          >
            {mod.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

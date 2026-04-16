'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface UserAvatarProfileProps {
    userId: string;
    allUsers: any[];
    isLead: boolean;
    ticketLead?: any;
    size?: "sm" | "md" | "lg";
}

export function UserAvatarProfile({ userId, allUsers, isLead, ticketLead, size = "sm" }: UserAvatarProfileProps) {
    const user = allUsers.find(u => u.id === userId) || (isLead ? ticketLead : null);
    if (!user) return null;

    const sizeClasses = {
        sm: "size-6",
        md: "size-8",
        lg: "size-12"
    };

    return (
        <Dialog>
            <TooltipProvider>
                <Tooltip>
                    <DialogTrigger asChild>
                        <TooltipTrigger asChild>
                            <Avatar 
                                onClick={(e) => e.stopPropagation()} 
                                className={cn(
                                    sizeClasses[size],
                                    "rounded-full ring-2 ring-background cursor-pointer transition-transform hover:scale-110",
                                    isLead ? "z-10" : "z-0"
                                )}
                            >
                                <AvatarFallback className={cn(
                                    "text-[10px] font-bold uppercase rounded-full",
                                    isLead ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {user.username?.[0] || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                    </DialogTrigger>
                    <TooltipContent className="rounded-none border-2 border-primary/20 bg-background text-[10px] font-bold uppercase tracking-widest text-foreground px-3 py-1.5">
                        {isLead ? 'Líder: ' : 'Equipo: '} {user.username || user.email}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DialogContent className="max-w-xs p-0 border-2 border-primary/20 rounded-none bg-background overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <DialogHeader className="sr-only">
                    <DialogTitle>Perfil de {user.username || user.email}</DialogTitle>
                </DialogHeader>
                <div className="h-20 bg-muted/30 w-full flex items-center justify-center border-b border-foreground/5 relative">
                    <div className="absolute top-4 right-4 text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5">
                        {isLead ? 'Líder' : 'Colaborador'}
                    </div>
                </div>
                <div className="p-6 pt-0 -mt-10 flex flex-col items-center">
                    <Avatar className="size-20 rounded-full border-4 border-background ring-2 ring-foreground/5 shadow-xl">
                        <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground rounded-full">
                            {user.username?.[0] || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="mt-4 text-center w-full">
                        <h3 className="font-bold text-lg leading-none">{user.username || "Sin nombre"}</h3>
                        <p className="text-xs text-muted-foreground mt-1 lowercase font-medium">{user.email}</p>
                    </div>
                    <div className="w-full mt-6 flex flex-col gap-2">
                        <div className="p-3 bg-muted/20 border border-foreground/5 text-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estado</span>
                            <div className="text-[10px] font-bold text-foreground uppercase mt-1">Activo en el Sistema</div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { getTeamData } from "@/app/actions/teams";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Users, 
    Briefcase, 
    CheckCircle2, 
    Clock, 
    Layers, 
    TrendingUp, 
    ShieldCheck, 
    Code2, 
    Zap,
    Mail,
    ChevronRight,
    Search,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function TeamsPage() {
    const team = await getTeamData();

    return (
        <div className="flex flex-col gap-10 p-4 md:p-10 max-w-[1700px] mx-auto min-h-screen bg-background/50 animate-in fade-in duration-1000">
            {/* Header / Command Center */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-foreground pb-12 pt-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary text-primary-foreground font-black text-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.15)] rounded-none">
                            TEAM
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="rounded-none border-primary/40 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-3 h-5">
                                    Operational Registry
                                </Badge>
                                <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-tight">Active Nodes: {team.length}</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Directorio de Equipo</h1>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-bold max-w-2xl leading-relaxed uppercase tracking-tight opacity-70">
                        Visualización de rendimiento individual y métricas de despliegue para el equipo de OtherBrain Universe.
                    </p>
                </div>
                
                <div className="relative group min-w-[320px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input 
                        className="w-full bg-muted/20 border-2 border-foreground/5 h-12 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest focus:border-primary focus:bg-background outline-none transition-all rounded-none"
                        placeholder="Filtrar operador..."
                    />
                </div>
            </div>

            {/* Matrix / Team Grid */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {team.map((user) => (
                    <Card key={user.id} className="rounded-none border-2 border-foreground/5 bg-background shadow-none hover:border-primary/40 transition-all group overflow-hidden relative">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-1 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                             <Layers className="size-32 -mr-10 -mt-10 rotate-12" />
                        </div>

                        <CardHeader className="space-y-6 pb-4 relative z-10">
                            <div className="flex justify-between items-start">
                                <Avatar className="size-20 rounded-none border-2 border-foreground/5 p-1 bg-muted/30 group-hover:border-primary/20 transition-all">
                                    <AvatarImage src={user.avatar} className="rounded-none" />
                                    <AvatarFallback className="rounded-none font-black text-xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-end gap-1.5">
                                    <Badge variant="outline" className={cn(
                                        "rounded-none text-[8px] font-black tracking-widest uppercase border-2 px-2 h-5",
                                        user.role === 'CEO' ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/10 border-foreground/5 text-muted-foreground'
                                    )}>
                                        {user.role}
                                    </Badge>
                                    <div className="flex items-center gap-1.5 pt-1">
                                         <div className="size-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                         <span className="text-[8px] font-bold uppercase text-muted-foreground opacity-60">Status: Active</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <h3 className="text-xl font-black uppercase tracking-tighter group-hover:text-primary transition-colors">
                                    {user.name}
                                </h3>
                                <div className="flex items-center gap-2 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                                    <Mail className="size-3" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest truncate">{user.email}</span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-4 space-y-6 relative z-10">
                            {/* Stats Matrix */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/30 border-2 border-foreground/5 space-y-1 group-hover:bg-primary/5 group-hover:border-primary/10 transition-all">
                                    <div className="flex items-center gap-2 text-muted-foreground/60">
                                        <Briefcase className="size-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Involucrado</span>
                                    </div>
                                    <p className="text-lg font-black tracking-tight">{user.stats.projectsInvolved} PROY</p>
                                </div>
                                <div className="p-3 bg-muted/30 border-2 border-foreground/5 space-y-1 group-hover:bg-primary/5 group-hover:border-primary/10 transition-all">
                                    <div className="flex items-center gap-2 text-muted-foreground/60">
                                        <TrendingUp className="size-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Tickets</span>
                                    </div>
                                    <p className="text-lg font-black tracking-tight">{user.stats.ticketsTaken} TOTAL</p>
                                </div>
                                <div className="p-3 bg-muted/30 border-2 border-foreground/5 space-y-1 group-hover:bg-primary/5 group-hover:border-primary/10 transition-all">
                                    <div className="flex items-center gap-2 text-muted-foreground/60">
                                        <CheckCircle2 className="size-3 text-green-500" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Done</span>
                                    </div>
                                    <p className="text-lg font-black tracking-tight text-green-600">{user.stats.ticketsFinished} OK</p>
                                </div>
                                <div className="p-3 bg-muted/30 border-2 border-foreground/5 space-y-1 group-hover:bg-primary/5 group-hover:border-primary/10 transition-all">
                                    <div className="flex items-center gap-2 text-muted-foreground/60">
                                        <Clock className="size-3 text-primary" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Tiempo</span>
                                    </div>
                                    <p className="text-lg font-black tracking-tight">{user.stats.activeHours} HRS</p>
                                </div>
                            </div>

                            {/* Efficiency Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Eficiencia de Despliegue</span>
                                    <span className="text-[10px] font-black text-primary">
                                        {user.stats.ticketsTaken > 0 
                                            ? Math.round((user.stats.ticketsFinished / user.stats.ticketsTaken) * 100) 
                                            : 0}%
                                    </span>
                                </div>
                                <div className="h-2 bg-muted/50 border border-foreground/5 rounded-none overflow-hidden">
                                     <div 
                                        className="h-full bg-primary transition-all duration-1000 shadow-[2px_0_10px_rgba(var(--primary),0.5)]" 
                                        style={{ 
                                            width: `${user.stats.ticketsTaken > 0 
                                                ? Math.round((user.stats.ticketsFinished / user.stats.ticketsTaken) * 100) 
                                                : 0}%` 
                                        }} 
                                     />
                                </div>
                            </div>

                            <Button variant="outline" className="w-full rounded-none border-2 border-foreground/5 text-[9px] font-black uppercase tracking-[0.2em] h-10 hover:bg-foreground hover:text-background transition-all group-hover:border-primary/20">
                                Ver Registro Detallado
                                <ChevronRight className="size-3 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                {/* Invite Node CTA */}
                <div className="border-4 border-dashed border-foreground/5 rounded-none p-10 text-center flex flex-col items-center justify-center gap-6 group hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer">
                    <div className="size-20 bg-muted/20 border-2 border-foreground/10 rounded-none flex items-center justify-center group-hover:scale-110 group-hover:rotate-90 transition-all duration-700">
                        <Plus className="size-10 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Anexar Nuevo Operador</p>
                        <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/30 px-6 leading-relaxed">
                            Añade un nuevo nodo de ejecución a la arquitectura de OtherBrain.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

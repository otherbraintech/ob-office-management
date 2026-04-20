'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Pencil, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateUserAdmin } from '@/app/actions/teams';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function UserEditDialog({ user }: { user: any }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user.name || '');
    const [username, setUsername] = useState(user.username || '');
    const [email, setEmail] = useState(user.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState(user.role);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        try {
            const payload = { name, username, email, role, ...(password ? { password } : {}) };
            await updateUserAdmin(user.id, payload);
            toast.success('Usuario actualizado correctamente');
            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset states when closing
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setName(user.displayName || user.name || '');
            setUsername(user.username || '');
            setEmail(user.email || '');
            setRole(user.role);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 rounded-none border border-foreground/5 hover:border-primary/20 hover:text-primary transition-all"
                >
                    <Pencil className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-none border border-foreground/10 shadow-lg shadow-foreground/5">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">Gestionar Operador</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Completo</Label>
                        <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="rounded-none border-2 border-foreground/10 focus:border-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                        <Input 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            className="rounded-none border-2 border-foreground/10 focus:border-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                        <Input 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            type="email"
                            className="rounded-none border-2 border-foreground/10 focus:border-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nueva Contraseña (Opcional)</Label>
                        <div className="relative">
                            <Input 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                type={showPassword ? "text" : "password"}
                                placeholder="Dejar en blanco para no cambiar"
                                className="rounded-none border-2 border-foreground/10 focus:border-primary placeholder:text-[10px] placeholder:tracking-widest placeholder:uppercase pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirmar Contraseña</Label>
                        <Input 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            type={showPassword ? "text" : "password"}
                            placeholder="Repite la nueva contraseña"
                            className="rounded-none border-2 border-foreground/10 focus:border-primary placeholder:text-[10px] placeholder:tracking-widest placeholder:uppercase"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rol Asignado</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="rounded-none border-2 border-foreground/10 focus:ring-0 focus:border-primary h-10">
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none border-2 border-foreground shadow-xl">
                                <SelectItem value="CEO" className="font-bold uppercase tracking-tight focus:bg-primary/10">CEO</SelectItem>
                                <SelectItem value="ADMIN_DEV" className="font-bold uppercase tracking-tight focus:bg-primary/10">Desarrollador (Admin)</SelectItem>
                                <SelectItem value="DEVELOPER" className="font-bold uppercase tracking-tight focus:bg-primary/10">Desarrollador</SelectItem>
                                <SelectItem value="INTERN" className="font-bold uppercase tracking-tight focus:bg-primary/10">Pasante</SelectItem>
                                <SelectItem value="EXTERNAL_CLIENT" className="font-bold uppercase tracking-tight focus:bg-primary/10">Cliente Externo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4">
                        <Button 
                            disabled={loading}
                            className="w-full h-10 rounded-none font-bold uppercase tracking-widest text-xs transition-all"
                        >
                            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : 'Actualizar Operador'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

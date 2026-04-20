'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/app/actions/auth';
import { uploadToObFile } from '@/app/actions/files';
import { toast } from 'sonner';
import { Loader2, Save, User as UserIcon, Mail, Shield, Plus, Camera, X, Pencil, Eye, EyeOff, Lock } from 'lucide-react';
import { translateRole } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function ProfileForm({ user }: { user: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name || '');
    const [username, setUsername] = useState(user.username || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [image, setImage] = useState(user.image || '');
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, sube solo imágenes');
            return;
        }

        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const res = await uploadToObFile(base64, file.name, file.type);
                
                if (res.url) {
                    setImage(res.url);
                    toast.success('Imagen subida correctamente');
                } else {
                    toast.error('Error al subir la imagen');
                }
                setIsUploading(false);
            };
        } catch (error) {
            toast.error('Error procesando el archivo');
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        
        try {
            const payload = { name, username, image, ...(password ? { password } : {}) };
            const res = await updateProfile(user.id, payload);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Perfil actualizado correctamente');
                setIsEditing(false);
            }
        } catch (error) {
            toast.error('Error al actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative group/avatar">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 via-transparent to-primary/20 rounded-full blur opacity-0 group-hover/avatar:opacity-100 transition duration-500" />
                    <Avatar className="size-32 md:size-40 rounded-full border-4 border-background shadow-2xl relative transition-transform duration-500 group-hover/avatar:scale-[1.02]">
                        <AvatarImage src={image} className="object-cover" />
                        <AvatarFallback className="bg-primary text-primary-foreground font-black text-4xl">
                            {username[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    
                    {isEditing && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full overflow-hidden cursor-pointer">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className="size-full text-white hover:bg-transparent rounded-none cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-8" />}
                            </Button>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                    />
                </div>

                <div className="space-y-2 w-full">
                    {/* Full Name Block */}
                    <div className="flex items-center justify-center gap-2 group/name px-2">
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none py-1">
                            {name || "Sin Nombre"}
                        </h2>
                        {!isEditing && (
                            <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                onClick={() => setIsEditing(true)}
                                className="size-8 rounded-none hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
                            >
                                <Pencil className="size-4 text-muted-foreground group-hover/name:text-primary transition-colors" />
                            </Button>
                        )}
                    </div>

                    {/* Username and Role Block */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-muted-foreground tracking-tight">@{username}</span>
                            <Badge variant="outline" className="rounded-none border-primary/40 text-primary text-[8px] font-black uppercase tracking-widest px-1.5 h-4 shrink-0 bg-primary/5">
                                {translateRole(user.role)}
                            </Badge>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" /> Operador Ecosistema OB
                        </p>
                    </div>
                </div>
            </div>

            {/* Information Grid */}
            <div className="grid gap-5 pt-4 border-t-2 border-foreground/5">
                <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <UserIcon className="size-3 text-primary/60" /> Nombre Completo
                    </Label>
                    {isEditing ? (
                        <Input 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Tu nombre"
                            className="rounded-none border-2 border-primary/20 focus-visible:ring-primary h-10 bg-background font-medium"
                        />
                    ) : (
                        <p className="text-sm font-bold py-1 border-b border-foreground/5">{name || "No definido"}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Shield className="size-3 text-primary/60" /> Identificador
                    </Label>
                    {isEditing ? (
                        <Input 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="usuario_ob"
                            className="rounded-none border-2 border-primary/20 focus-visible:ring-primary h-10 bg-background font-medium"
                        />
                    ) : (
                        <p className="text-sm font-bold py-1 border-b border-foreground/5">@{username}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Mail className="size-3 text-primary/60" /> Email Institucional
                    </Label>
                    <p className="text-sm font-bold py-1 border-b border-foreground/5 text-muted-foreground/70">{user.email}</p>
                </div>

                {/* Password Change Block (Visible in Edit Mode Only) */}
                {isEditing && (
                    <div className="space-y-3 pt-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Lock className="size-3 text-primary/60" /> Nueva Contraseña (Opcional)
                        </Label>
                        <div className="relative">
                            <Input 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                type={showPassword ? "text" : "password"}
                                placeholder="Déjalo en blanco para no cambiarla"
                                className="rounded-none border-2 border-primary/20 focus-visible:ring-primary h-10 bg-background font-medium placeholder:text-xs placeholder:italic pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {password && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 pt-1">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Lock className="size-3 text-primary/60" /> Confirmar Nueva Contraseña
                                </Label>
                                <Input 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Repite la nueva contraseña"
                                    className="rounded-none border-2 border-primary/20 focus-visible:ring-primary h-10 bg-background font-medium placeholder:text-xs placeholder:italic pr-10"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="flex flex-col gap-3 pt-4 animate-in fade-in slide-in-from-top-2">
                    <Button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full h-11 rounded-none font-black uppercase tracking-widest shadow-lg shadow-primary/10"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => {
                            setIsEditing(false);
                            setName(user.name || '');
                            setUsername(user.username || '');
                            setPassword('');
                            setConfirmPassword('');
                        }}
                        className="w-full h-10 rounded-none font-bold uppercase tracking-widest text-[10px] text-muted-foreground hover:text-foreground"
                    >
                        Cancelar Edición
                    </Button>
                </div>
            )}
        </form>
    );
}

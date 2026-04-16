'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/app/actions/auth';
import { uploadToObFile } from '@/app/actions/files';
import { toast } from 'sonner';
import { Loader2, Save, User as UserIcon, Mail, Shield, Plus, Camera, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function ProfileForm({ user }: { user: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name || '');
    const [username, setUsername] = useState(user.username || '');
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
        setLoading(true);
        
        try {
            const res = await updateProfile(user.id, { name, username, image });
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
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b-2 border-foreground/5">
                <div className="relative group/avatar">
                    <Avatar className="size-32 rounded-none border-4 border-foreground/5 shadow-2xl transition-all group-hover/avatar:border-primary/40">
                        <AvatarImage src={image} className="object-cover" />
                        <AvatarFallback className="bg-primary text-primary-foreground font-black text-3xl rounded-none">
                            {username[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    
                    {isEditing && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className="size-full text-white hover:bg-transparent"
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

                <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                         <h2 className="text-3xl font-black uppercase tracking-tighter">{name || username}</h2>
                         <Badge variant="outline" className="rounded-none border-primary/40 text-primary text-[9px] font-black uppercase tracking-widest px-2 h-5">
                             {user.role}
                         </Badge>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                        <span className="size-2 rounded-full bg-green-500" /> Operador Activo en Ecosistema OB
                    </p>
                </div>

                {!isEditing && (
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(true)}
                        className="rounded-none border-2 border-primary/20 hover:bg-primary/5 font-black uppercase text-[11px] h-11 px-8 tracking-widest"
                    >
                        Configurar Perfil
                    </Button>
                )}
            </div>

            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <UserIcon className="size-3" /> Nombre Completo
                    </Label>
                    {isEditing ? (
                        <Input 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Tu nombre"
                            className="rounded-none border-2 border-primary/20 focus-visible:ring-primary h-11 bg-background"
                        />
                    ) : (
                        <p className="text-lg font-medium py-2 px-1 border-b border-foreground/5">{name || "No definido"}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Shield className="size-3" /> Nombre de Usuario
                    </Label>
                    {isEditing ? (
                        <Input 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="usuario_ob"
                            className="rounded-none border-2 border-primary/20 focus-visible:ring-primary h-11 bg-background"
                        />
                    ) : (
                        <p className="text-lg font-medium py-2 px-1 border-b border-foreground/5">@{username}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Mail className="size-3" /> Email Institucional
                    </Label>
                    <p className="text-lg font-medium py-2 px-1 border-b border-foreground/5 opacity-60">{user.email}</p>
                </div>

                <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Plus className="size-3" /> Rol Asignado
                    </Label>
                    <p className="text-sm font-bold uppercase tracking-widest py-2 px-1 border-b border-foreground/5 text-primary">{user.role}</p>
                </div>
            </div>

            {isEditing && (
                <div className="flex gap-4 pt-4 animate-in fade-in slide-in-from-top-2">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => {
                            setIsEditing(false);
                            setName(user.name || '');
                            setUsername(user.username || '');
                        }}
                        className="flex-1 h-12 rounded-none font-bold uppercase tracking-widest"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={loading} 
                        className="flex-1 h-12 rounded-none font-bold uppercase tracking-widest"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                </div>
            )}
        </form>
    );
}

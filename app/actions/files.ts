"use server"

import { getSession } from "./auth";

/**
 * Sube una imagen al backend administrado de OB-FILE
 * @param formData FormData que contiene el campo 'file' con el archivo
 */
export async function uploadToObFile(formData: FormData) {
    const session = await getSession();
    if (!session) return { error: "No autorizado" };

    const token = process.env['OB-FILE'];
    if (!token) return { error: "El token de OB-FILE no está configurado en el servidor" };

    const file = formData.get('file') as File;
    if (!file) return { error: "No file provided" };

    try {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const filename = file.name;
        const mimeType = file.type;

        const response = await fetch('https://otherbrain-tech-ob-files-oficial.ddt6vc.easypanel.host/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token_project: token,
                filename: filename,
                file: base64,
                mimeType: mimeType
            })
        });

        const data = await response.json();

        if (data.success) {
            return { url: data.url };
        } else {
            console.error("OB-FILE Error:", data);
            return { error: "Fallo en la subida al servidor de archivos" };
        }
    } catch (error) {
        console.error("File Upload Exception:", error);
        return { error: "Error de red al subir el archivo" };
    }
}

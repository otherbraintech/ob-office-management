"use server"

import { getSession } from "./auth";

/**
 * Sube una imagen al backend administrado de OB-FILE
 * @param base64 Archivo en formato base64 sin el prefijo data:image/...
 * @param filename Nombre del archivo
 * @param mimeType Tipo MIME
 */
export async function uploadToObFile(base64: string, filename: string, mimeType: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const token = process.env['OB-FILE'];
    if (!token) throw new Error("OB-FILE token not found in environment");

    try {
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

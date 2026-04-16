import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function exportDocumentsToZip(projectName: string, documents: { name: string, content: string }[]) {
  const zip = new JSZip();
  const folder = zip.folder(projectName);

  documents.forEach((doc) => {
    folder?.file(`${doc.name}.md`, doc.content);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${projectName.replace(/\s+/g, '_')}_plan.zip`);
}

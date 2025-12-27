
import JSZip from 'jszip';

export const createZipArchive = async (files: { name: string; bytes: Uint8Array }[]): Promise<Blob> => {
  const zip = new JSZip();
  
  files.forEach(file => {
    zip.file(file.name, file.bytes);
  });
  
  return await zip.generateAsync({ type: 'blob' });
};


import { PDFDocument } from 'pdf-lib';
import { SplitRange } from '../types';

export const getPageCount = async (data: Uint8Array): Promise<number> => {
  const pdfDoc = await PDFDocument.load(data);
  return pdfDoc.getPageCount();
};

export const splitToIndividualPages = async (data: Uint8Array): Promise<{ name: string; bytes: Uint8Array }[]> => {
  const sourceDoc = await PDFDocument.load(data);
  const pageCount = sourceDoc.getPageCount();
  const results: { name: string; bytes: Uint8Array }[] = [];

  for (let i = 0; i < pageCount; i++) {
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(sourceDoc, [i]);
    newDoc.addPage(copiedPage);
    const bytes = await newDoc.save();
    results.push({
      name: `page-${i + 1}.pdf`,
      bytes
    });
  }

  return results;
};

export const splitToRanges = async (data: Uint8Array, ranges: SplitRange[]): Promise<{ name: string; bytes: Uint8Array }[]> => {
  const sourceDoc = await PDFDocument.load(data);
  const results: { name: string; bytes: Uint8Array }[] = [];

  for (const range of ranges) {
    const newDoc = await PDFDocument.create();
    // pdf-lib pages are 0-indexed, but users input 1-indexed
    const pageIndices = [];
    for (let i = range.start - 1; i < range.end; i++) {
      pageIndices.push(i);
    }
    
    const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach(page => newDoc.addPage(page));
    
    const bytes = await newDoc.save();
    results.push({
      name: `range-${range.start}-to-${range.end}.pdf`,
      bytes
    });
  }

  return results;
};


export enum SplitMode {
  INDIVIDUAL = 'INDIVIDUAL',
  RANGES = 'RANGES'
}

export interface SplitRange {
  id: string;
  start: number;
  end: number;
}

export interface PDFFileState {
  file: File;
  name: string;
  pageCount: number;
  data: Uint8Array;
}

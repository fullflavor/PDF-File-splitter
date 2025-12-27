
import React, { useState, useCallback } from 'react';
import { 
  FileText, 
  Scissors, 
  Package, 
  Download, 
  Plus, 
  Trash2, 
  X,
  FileUp,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { PDFFileState, SplitMode, SplitRange } from './types';
import { getPageCount, splitToIndividualPages, splitToRanges } from './services/pdfService';
import { createZipArchive } from './services/zipService';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [pdfState, setPdfState] = useState<PDFFileState | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>(SplitMode.INDIVIDUAL);
  const [ranges, setRanges] = useState<SplitRange[]>([{ id: '1', start: 1, end: 1 }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const pageCount = await getPageCount(uint8Array);
      
      setPdfState({
        file,
        name: file.name,
        pageCount,
        data: uint8Array
      });
      // Reset ranges when a new file is uploaded
      setRanges([{ id: Math.random().toString(36).substr(2, 9), start: 1, end: pageCount }]);
    } catch (err) {
      console.error("Error loading PDF:", err);
      alert("Failed to load PDF. It might be encrypted or corrupted.");
    }
  };

  const addRange = () => {
    if (!pdfState) return;
    setRanges([...ranges, { 
      id: Math.random().toString(36).substr(2, 9), 
      start: 1, 
      end: pdfState.pageCount 
    }]);
  };

  const removeRange = (id: string) => {
    if (ranges.length === 1) return;
    setRanges(ranges.filter(r => r.id !== id));
  };

  const updateRange = (id: string, field: 'start' | 'end', value: number) => {
    if (!pdfState) return;
    const clampedValue = Math.max(1, Math.min(value, pdfState.pageCount));
    setRanges(ranges.map(r => r.id === id ? { ...r, [field]: clampedValue } : r));
  };

  const handleProcess = async () => {
    if (!pdfState) return;
    setIsProcessing(true);
    setStatusMessage('Splitting PDF pages...');

    try {
      let splitResults;
      if (splitMode === SplitMode.INDIVIDUAL) {
        splitResults = await splitToIndividualPages(pdfState.data);
      } else {
        splitResults = await splitToRanges(pdfState.data, ranges);
      }

      setStatusMessage('Creating ZIP archive...');
      const zipBlob = await createZipArchive(splitResults);
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdfState.name.replace('.pdf', '')}_split.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage('Download complete!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error("Process failed:", err);
      alert("An error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPdfState(null);
    setSplitMode(SplitMode.INDIVIDUAL);
    setRanges([{ id: '1', start: 1, end: 1 }]);
    setIsProcessing(false);
    setStatusMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Scissors className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">
              PDF Splitter
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1"><ShieldCheck size={16} /> Privacy First</span>
            <span className="flex items-center gap-1"><Package size={16} /> Client-Side Only</span>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full p-6 py-10">
        {!pdfState ? (
          /* Upload State */
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-indigo-400 transition-colors duration-300">
            <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileUp className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Upload your PDF</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              Choose a PDF file to split it into multiple parts. All processing happens in your browser.
            </p>
            <label className="inline-block">
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <div className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold cursor-pointer hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200">
                Select PDF File
              </div>
            </label>
          </div>
        ) : (
          /* Editor State */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-red-50 p-3 rounded-xl">
                    <FileText className="text-red-500 w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{pdfState.name}</h3>
                    <p className="text-sm text-slate-500">{pdfState.pageCount} Pages • {(pdfState.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={reset}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <label className="text-sm font-semibold text-slate-700 mb-4 block">Split Configuration</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-8">
                  <button 
                    onClick={() => setSplitMode(SplitMode.INDIVIDUAL)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${splitMode === SplitMode.INDIVIDUAL ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    Every Page
                  </button>
                  <button 
                    onClick={() => setSplitMode(SplitMode.RANGES)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${splitMode === SplitMode.RANGES ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    Custom Ranges
                  </button>
                </div>

                {splitMode === SplitMode.INDIVIDUAL ? (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                    <div className="bg-indigo-600 p-1.5 rounded text-white mt-1">
                      <Scissors size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-900">Automatic Split</p>
                      <p className="text-xs text-indigo-700">We will generate {pdfState.pageCount} separate PDF files, one for each page.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ranges.map((range, index) => (
                      <div key={range.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                        <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {index + 1}
                        </span>
                        <div className="flex-grow flex items-center gap-3">
                          <div className="flex flex-col flex-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">From</span>
                            <input 
                              type="number"
                              min={1}
                              max={pdfState.pageCount}
                              value={range.start}
                              onChange={(e) => updateRange(range.id, 'start', parseInt(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <ChevronRight size={16} className="text-slate-300 mt-5" />
                          <div className="flex flex-col flex-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">To</span>
                            <input 
                              type="number"
                              min={1}
                              max={pdfState.pageCount}
                              value={range.end}
                              onChange={(e) => updateRange(range.id, 'end', parseInt(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => removeRange(range.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          disabled={ranges.length === 1}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={addRange}
                      className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-medium"
                    >
                      <Plus size={16} /> Add Another Range
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {statusMessage && (
                <div className="flex items-center gap-3 justify-center animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-sm font-medium text-slate-600">{statusMessage}</span>
                </div>
              )}
              <Button 
                onClick={handleProcess}
                isLoading={isProcessing}
                className="w-full h-14 text-lg rounded-2xl"
              >
                <Download size={20} />
                Split & Download ZIP
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm">
            Powered by WebAssembly and client-side processing. Your data never leaves your computer.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;

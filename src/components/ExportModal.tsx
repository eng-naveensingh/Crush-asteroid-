/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, FileCode, FolderArchive, ArrowRight } from 'lucide-react';
import { PROJECT_SOURCE_FILES } from '../projectSourceFiles';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const fileNames = Object.keys(PROJECT_SOURCE_FILES);
  const [selectedFile, setSelectedFile] = useState<string>(fileNames[0] || 'src/App.tsx');
  const [copiedFile, setCopiedFile] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyCurrentFile = async () => {
    const content = PROJECT_SOURCE_FILES[selectedFile];
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyAllFilesJson = async () => {
    try {
      const fullExport = JSON.stringify(PROJECT_SOURCE_FILES, null, 2);
      await navigator.clipboard.writeText(fullExport);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadAllZip = () => {
    // Generate a simple downloadable JSON bundle which can be extracted or saved directly
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(PROJECT_SOURCE_FILES, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'crush-asteroid-source-bundle.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadCurrentFile = () => {
    const content = PROJECT_SOURCE_FILES[selectedFile] || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    const fileName = selectedFile.split('/').pop() || 'file.txt';
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[90vh] max-h-[820px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-arcade text-base sm:text-lg font-bold text-white tracking-wide">
                EXPORT & COPY PROJECT
              </h2>
              <p className="text-xs text-slate-400">
                16 full source files &middot; 100% self-contained TypeScript + React + Canvas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAllFilesJson}
              className="py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95"
              title="Copy entire project dictionary as JSON"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'Entire Project Copied!' : 'Copy Entire Project (JSON)'}</span>
            </button>
            <button
              onClick={handleDownloadAllZip}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
              title="Download all files bundle"
            >
              Download JSON
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-2"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar + Viewer */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* File Explorer sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-3 overflow-y-auto shrink-0 max-h-48 md:max-h-none">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-2">
              Project Files ({fileNames.length})
            </span>
            <div className="space-y-1">
              {fileNames.map((name) => {
                const isSelected = selectedFile === name;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedFile(name);
                      setCopiedFile(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center justify-between group ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{name}</span>
                    <ArrowRight className={`w-3 h-3 transition-opacity ${isSelected ? 'opacity-100 text-sky-400' : 'opacity-0 group-hover:opacity-60'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/70">
            {/* File sub-header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2 text-sky-400">
                <FileCode className="w-4 h-4" />
                <span className="font-semibold text-slate-200">{selectedFile}</span>
                <span className="text-slate-500">
                  ({(PROJECT_SOURCE_FILES[selectedFile]?.length || 0).toLocaleString()} bytes)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCurrentFile}
                  className="py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-colors"
                >
                  Download File
                </button>
                <button
                  onClick={handleCopyCurrentFile}
                  className="py-1 px-2.5 rounded bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/40 text-[11px] font-medium transition-colors flex items-center gap-1.5"
                >
                  {copiedFile ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedFile ? 'Copied File!' : 'Copy File Content'}</span>
                </button>
              </div>
            </div>

            {/* Code Pre container */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300 selection:bg-sky-500/30">
              <pre className="whitespace-pre tab-[2]">
                {PROJECT_SOURCE_FILES[selectedFile] || ''}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>
            How to run locally: Run <code className="text-sky-300 font-mono">npm install</code> followed by <code className="text-sky-300 font-mono">npm run dev</code>.
          </span>
          <span className="text-slate-400 font-mono">
            Vite 8 &middot; React 19 &middot; Tailwind CSS 4 &middot; HTML5 Canvas
          </span>
        </div>

      </div>
    </div>
  );
};

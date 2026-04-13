'use client';

import { useState } from 'react';

interface DetailPanelProps {
  title: string;
  children: React.ReactNode;
}

export function DetailButton({ title, children }: DetailPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={`Details: ${title}`}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
          transition-all cursor-pointer ${
          open
            ? 'bg-apple-blue text-white'
            : 'bg-gray-200 text-gray-500 hover:bg-apple-blue hover:text-white'
        }`}
      >
        i
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed z-50 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px]
            bottom-4 sm:bottom-auto sm:top-1/3
            bg-white border border-apple-border rounded-xl shadow-2xl p-5 text-left max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-apple-text">{title}</h4>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>
            <div className="text-xs text-gray-600 leading-relaxed space-y-2">
              {children}
            </div>
          </div>
        </>
      )}
    </span>
  );
}

export function FormulaBlock({ label, formula, result }: { label: string; formula: string; result?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2.5 font-mono text-[11px]">
      <div className="text-gray-400 text-[10px] mb-1">{label}</div>
      <div className="text-apple-text">{formula}</div>
      {result && <div className="text-apple-blue font-semibold mt-1">= {result}</div>}
    </div>
  );
}

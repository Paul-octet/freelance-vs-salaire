'use client';

import { useState } from 'react';

interface Props {
  text: string;
}

export default function Tooltip({ text }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        aria-label={text}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full
                   text-xs font-bold text-apple-text-sec border border-apple-border
                   hover:text-apple-blue hover:border-apple-blue transition-colors
                   focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
      >
        ?
      </button>
      {visible && (
        <span
          role="tooltip"
          className="absolute left-6 top-1/2 -translate-y-1/2 z-50
                     max-w-xs bg-gray-900 text-white text-xs rounded-lg p-3
                     shadow-lg w-56 leading-relaxed pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  );
}

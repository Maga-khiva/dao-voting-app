import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export const CopyButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label || 'Address'} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group"
      title={`Copy ${label}`}
    >
      <span className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-500 transition-colors">
        {text.slice(0, 6)}...{text.slice(-4)}
      </span>
      {copied ? (
        <Check size={12} className="text-green-500" />
      ) : (
        <Copy size={12} className="text-slate-400 group-hover:text-cyan-500" />
      )}
    </button>
  );
};
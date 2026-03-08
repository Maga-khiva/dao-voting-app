import React from 'react';

export const StatusBadge = ({ status, deadline, className = "" }) => {
  const isExpired = deadline && (deadline * 1000) < Date.now();
  
  // Determine the actual display status
  let displayStatus = status;
  if (status === "Active" && isExpired) {
    displayStatus = "Ended";
  }

  const getStatusStyles = () => {
    switch (displayStatus) {
      case "Active":
        return "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400";
      case "Ended":
      case "Closed":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
      case "Executed":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400";
      case "Rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400";
    }
  };

  return (
    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest min-w-[80px] text-center ${getStatusStyles()} ${className}`}>
      <span className="w-full">{displayStatus}</span>
    </div>
  );
};
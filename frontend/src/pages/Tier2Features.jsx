import React from "react";
import { VoteDelegation } from "../components/VoteDelegation";
import { RoleManagement } from "../components/RoleManagement";
import { TokenTransfer } from "../components/TokenTransfer";
import { Logo } from "../components/Logo";

export const Tier2Features = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = React.useState("delegation");

  const tabs = [
    { id: "delegation", label: "DELEGATION", icon: "🤝" },
    { id: "roles", label: "ROLES", icon: "🛡️" },
    { id: "transfer", label: "TRANSFER", icon: "📤" },
    { id: "info", label: "PROTOCOL", icon: "💎" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Logo className="w-10 h-10" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold glacier-gradient-text tracking-tight uppercase">
              Advanced Protocol
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
              Manage voting power, protocol roles, and token assets.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate("home")}
          className="glacier-btn-secondary py-2 px-4 text-sm"
        >
          ← BACK HOME
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                : "bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 border border-white/20"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glacier-card p-8 sm:p-12">
        {activeTab === "delegation" && <VoteDelegation />}
        {activeTab === "roles" && <RoleManagement />}
        {activeTab === "transfer" && (
          <div className="flex justify-center">
            <TokenTransfer />
          </div>
        )}
        {activeTab === "info" && (
          <div className="space-y-10">
            <section>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 uppercase tracking-widest">Snapshot Mechanism</h3>
              <div className="p-6 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Voting power is locked at the exact block of proposal creation. This prevents "flash-loan" style attacks where tokens are moved just to influence a specific vote.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 uppercase tracking-widest">Role-Based Access</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-white/20">
                  <p className="font-black text-cyan-600 dark:text-cyan-400 text-[10px] mb-1 uppercase">Member</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vote & Propose</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-white/20">
                  <p className="font-black text-blue-600 dark:text-blue-400 text-[10px] mb-1 uppercase">Moderator</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage Amendments</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-white/20">
                  <p className="font-black text-purple-600 dark:text-purple-400 text-[10px] mb-1 uppercase">Admin</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Full Permissions</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
import React from 'react';

export const GuideSection = () => {
  const steps = [
    {
      icon: "🪙",
      title: "Acquire Voting Power",
      description: "Hold GOV tokens in your wallet to participate. Your voting weight is directly proportional to your token balance at the time a proposal is created."
    },
    {
      icon: "📝",
      title: "Create Proposals",
      description: "Any member with a positive token balance can initiate a proposal. Define the title, description, and category (Treasury, Governance, etc.) to start a vote."
    },
    {
      icon: "🗳️",
      title: "Cast Your Vote",
      description: "Review active proposals and vote 'Yes' or 'No'. Our snapshot mechanism ensures that only tokens held before the proposal started can be used, preventing manipulation."
    },
    {
      icon: "🔐",
      title: "Multi-Sig Execution",
      description: "Once a proposal passes and the voting period ends, it enters the execution phase. Designated approvers must sign off to finalize the action on-chain."
    }
  ];

  return (
    <section className="glacier-card p-8 sm:p-10 mb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 uppercase tracking-tight">
          How It Works
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
          MAGA Orbit Market Governance allows the community to collectively manage the protocol. 
          Follow these steps to participate in the decentralized decision-making process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <div key={index} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-white/20 hover:border-cyan-400/30 transition-colors group">
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{step.icon}</div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2 uppercase tracking-widest">{step.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 p-4 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
        <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
          <span>💡</span>
          Why use this? Decentralized governance ensures transparency, security, and community-driven growth without central points of failure.
        </p>
      </div>
    </section>
  );
};

export default GuideSection;
import React from "react";
import { CreateProposal } from "../components/CreateProposal";
import { Logo } from "../components/Logo";

export const CreateProposalPage = ({ onNavigate, onProposalCreated }) => {
  const handleSuccess = () => {
    if (onProposalCreated) {
      onProposalCreated();
    }
    setTimeout(() => {
      onNavigate("home");
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Logo className="w-10 h-10" />
          <h1 className="text-2xl sm:text-3xl font-extrabold glacier-gradient-text tracking-tight">
            NEW PROPOSAL
          </h1>
        </div>
        <button
          onClick={() => onNavigate("home")}
          className="glacier-btn-secondary py-2 px-4 text-sm"
        >
          ← BACK HOME
        </button>
      </div>

      <div className="glacier-card p-8 sm:p-12">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Initiate Governance Action
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Submit a new proposal to the DAO crystal. Your voting power will be used to validate the submission.
          </p>
        </div>

        <CreateProposal onSuccess={handleSuccess} />
      </div>
    </div>
  );
};
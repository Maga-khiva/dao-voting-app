import React from "react";
import { VoteBox } from "../components/VoteBox";
import { ProposalAmendments } from "../components/ProposalAmendments";
import { SnapshotDisplay } from "../components/SnapshotDisplay";
import { Logo } from "../components/Logo";

export const VotePage = ({ onNavigate, proposalId, onVoteSuccess }) => {
  const handleVoteSuccess = () => {
    if (onVoteSuccess) {
      onVoteSuccess();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Logo className="w-10 h-10" />
          <h1 className="text-2xl sm:text-3xl font-extrabold glacier-gradient-text tracking-tight uppercase">
            Proposal Details
          </h1>
        </div>
        <button
          onClick={() => onNavigate("home")}
          className="glacier-btn-secondary py-2 px-4 text-sm"
        >
          ← BACK HOME
        </button>
      </div>

      {proposalId !== null ? (
        <div className="space-y-8">
          {/* Snapshot Information */}
          <div className="max-w-3xl">
            <SnapshotDisplay proposalId={proposalId} />
          </div>

          {/* Voting Box */}
          <VoteBox
            proposalId={proposalId}
            onVoteSuccess={handleVoteSuccess}
          />

          {/* Amendments Section */}
          <div className="glacier-card p-8 sm:p-12">
            <ProposalAmendments proposalId={proposalId} />
          </div>
        </div>
      ) : (
        <div className="glacier-card p-20 text-center">
          <div className="text-6xl mb-6 opacity-50">🔍</div>
          <h3 className="text-2xl font-bold text-slate-700 dark:text-white mb-2">Proposal Not Found</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Please select a valid proposal from the home page.</p>
          <button
            onClick={() => onNavigate("home")}
            className="glacier-btn-primary"
          >
            RETURN TO DASHBOARD
          </button>
        </div>
      )}
    </div>
  );
};
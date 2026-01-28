import React from "react";
import { VoteBox } from "../components/VoteBox";
import { ProposalAmendments } from "../components/ProposalAmendments";
import { SnapshotDisplay } from "../components/SnapshotDisplay";

export const VotePage = ({ onNavigate, proposalId, onVoteSuccess }) => {
  const handleVoteSuccess = () => {
    if (onVoteSuccess) {
      onVoteSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => onNavigate("home")}
          className="mb-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {proposalId !== null ? (
            <div className="space-y-6">
              {/* Snapshot Information */}
              <SnapshotDisplay proposalId={proposalId} />

              {/* Voting Box */}
              <VoteBox
                proposalId={proposalId}
                onVoteSuccess={handleVoteSuccess}
              />

              {/* Amendments Section */}
              <div className="border-t pt-6">
                <ProposalAmendments proposalId={proposalId} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-base sm:text-lg">
                Please select a proposal from the home page
              </p>
              <button
                onClick={() => onNavigate("home")}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Go to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

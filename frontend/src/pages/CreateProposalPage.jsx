import React from "react";
import { CreateProposal } from "../components/CreateProposal";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => onNavigate("home")}
          className="mb-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Create New Proposal
          </h1>
          <p className="text-gray-600 mb-8">
            Submit a proposal for the DAO to vote on. Only DAO owners can create
            proposals.
          </p>

          <CreateProposal onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
};

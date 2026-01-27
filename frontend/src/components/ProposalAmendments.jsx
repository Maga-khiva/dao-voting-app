import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../hooks/useWeb3";

export const ProposalAmendments = ({ proposalId }) => {
  const { contract, account, signer } = useWeb3();
  const [amendments, setAmendments] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [isProposing, setIsProposing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loadingAmendments, setLoadingAmendments] = useState(true);
  
  // Derived states
  const isMember = userRole >= 1; // Member (1), Moderator (2), Admin (3)
  const isModerator = userRole >= 2; // Moderator (2), Admin (3)

  // Helper function to load amendments
  const loadAmendments = async () => {
    if (!contract || proposalId === null || proposalId === undefined) return;
    
    setLoadingAmendments(true);
    try {
      const amendmentIds = await contract.getProposalAmendments(proposalId);
      const amendmentData = [];

      for (const amendId of amendmentIds) {
        const amendment = await contract.getAmendment(Number(amendId));
        
        // Handle both array and object returns from contract
        const amendmentObj = Array.isArray(amendment)
          ? {
              proposalId: amendment[0],
              title: amendment[1],
              description: amendment[2],
              proposedBy: amendment[3],
              timestamp: amendment[4],
              approved: amendment[5],
              status: amendment[6],
            }
          : amendment;
        
        amendmentData.push({
          id: Number(amendId),
          ...amendmentObj,
        });
      }

      setAmendments(amendmentData);
    } catch (err) {
      console.error("Error loading amendments:", err);
    } finally {
      setLoadingAmendments(false);
    }
  };

  // Load user role and amendments
  useEffect(() => {
    if (!contract || !account) return;

    const loadUserRole = async () => {
      try {
        const role = await contract.getUserRole(account);
        setUserRole(Number(role));
      } catch (err) {
        console.error("Error loading user role:", err);
      }
    };

    loadUserRole();
    loadAmendments();
  }, [contract, account, proposalId]);

  const handleProposeAmendment = async (e) => {
    e.preventDefault();
    if (!title || !description || !contract || !signer || proposalId === null) return;

    setError(null);
    setSuccess(null);
    setIsProposing(true);

    try {
      const tx = await contract.connect(signer).proposeAmendment(proposalId, title, description);
      await tx.wait();

      setSuccess("Amendment proposed successfully!");
      setTitle("");
      setDescription("");

      // Reload amendments
      await loadAmendments();
    } catch (err) {
      setError(err.message || "Failed to propose amendment");
    } finally {
      setIsProposing(false);
    }
  };

  const handleApproveAmendment = async (amendmentId) => {
    if (!contract || !signer) return;

    setError(null);
    setSuccess(null);

    try {
      const tx = await contract.connect(signer).approveAmendment(amendmentId);
      await tx.wait();

      setSuccess("Amendment approved!");

      // Reload amendments
      await loadAmendments();
    } catch (err) {
      setError(err.message || "Failed to approve amendment");
    }
  };

  const handleRejectAmendment = async (amendmentId) => {
    if (!contract || !signer) return;

    setError(null);
    setSuccess(null);

    try {
      const tx = await contract.connect(signer).rejectAmendment(amendmentId);
      await tx.wait();

      setSuccess("Amendment rejected!");

      // Reload amendments
      await loadAmendments();
    } catch (err) {
      setError(err.message || "Failed to reject amendment");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Proposal Amendments</h3>

      {/* Role Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
        <p className="text-gray-700">
          <span className="font-semibold">Your Role:</span>{" "}
          {userRole === 1 ? "Member" : userRole === 2 ? "Moderator" : userRole === 3 ? "Admin" : "None"}
        </p>
      </div>

      {/* Propose Amendment - Members only */}
      {isMember && (
        <form onSubmit={handleProposeAmendment} className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Propose Amendment</h4>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Title</label>
            <input
              type="text"
              placeholder="Enter new proposal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isProposing}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Description</label>
            <textarea
              placeholder="Enter new proposal description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength="500"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isProposing}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
          </div>

          <button
            type="submit"
            disabled={isProposing || !title || !description}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
          >
            {isProposing ? "Proposing..." : "Propose Amendment"}
          </button>
        </form>
      )}

      {!isMember && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-800">
          You need to be a Member to propose amendments. Contact an Admin to assign your role.
        </div>
      )}

      {/* Amendments List */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-800 mb-3">
          Amendments ({amendments.length})
        </h4>

        {loadingAmendments ? (
          <p className="text-gray-600">Loading amendments...</p>
        ) : amendments.length === 0 ? (
          <p className="text-gray-600">No amendments proposed yet</p>
        ) : (
          <div className="space-y-3">
            {amendments.map((amendment) => (
              <div
                key={amendment.id}
                className={`p-4 border rounded-lg ${
                  amendment.status === "Approved"
                    ? "bg-green-50 border-green-200"
                    : amendment.status === "Rejected"
                    ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{amendment.title}</p>
                    <p className="text-sm text-gray-600">
                      Proposed by {amendment.proposedBy ? `${amendment.proposedBy.slice(0, 6)}...${amendment.proposedBy.slice(-4)}` : "Unknown"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      amendment.status === "Approved"
                        ? "bg-green-200 text-green-800"
                        : amendment.status === "Rejected"
                        ? "bg-red-200 text-red-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {amendment.status}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-3">{amendment.description}</p>

                {/* Moderator Actions */}
                {isModerator && amendment.status === "Pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveAmendment(amendment.id)}
                      className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectAmendment(amendment.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
    </div>
  );
};

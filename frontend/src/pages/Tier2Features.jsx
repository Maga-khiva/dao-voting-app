import React from "react";
import { VoteDelegation } from "../components/VoteDelegation";
import { RoleManagement } from "../components/RoleManagement";
import { TokenTransfer } from "../components/TokenTransfer";

export const Tier2Features = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = React.useState("delegation");

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate("home")}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Advanced Features</h1>
          <p className="text-gray-600 mt-2">Manage your voting power and governance permissions</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("delegation")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === "delegation"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Vote Delegation
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === "roles"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Role Management
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === "transfer"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Transfer Tokens
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === "info"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Information
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === "delegation" && (
            <div>
              <VoteDelegation proposalId={null} />
            </div>
          )}

          {activeTab === "roles" && (
            <div>
              <RoleManagement />
            </div>
          )}

          {activeTab === "transfer" && (
            <div className="flex justify-center">
              <TokenTransfer />
            </div>
          )}

          {activeTab === "info" && (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Snapshot-Based Voting</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-700 mb-2">
                    Your voting power is locked when a proposal is created. This prevents manipulation
                    through token transfers after a proposal opens.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Voting weight determined at proposal creation block</li>
                    <li>Token transfers don't affect your voting power</li>
                    <li>Fair and transparent voting mechanism</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Vote Delegation</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-700 mb-2">
                    Delegate your voting power to someone you trust. They'll receive your voting weight.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Delegate to any Ethereum address</li>
                    <li>Voting power = your tokens + delegated tokens</li>
                    <li>Revoke delegation anytime to regain control</li>
                    <li>Cannot vote while delegation is active</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Role-Based Access Control</h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-gray-700 mb-3">Three roles control governance permissions:</p>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-purple-100">
                      <p className="font-semibold text-gray-800">👤 Member</p>
                      <p className="text-sm text-gray-600">Vote on proposals & propose amendments</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-purple-100">
                      <p className="font-semibold text-gray-800">🛡️ Moderator</p>
                      <p className="text-sm text-gray-600">All Member permissions + approve/reject amendments</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-purple-100">
                      <p className="font-semibold text-gray-800">⚡ Admin</p>
                      <p className="text-sm text-gray-600">All permissions + assign/revoke roles</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Proposal Amendments</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-700 mb-2">
                    Members can propose changes to active proposals. Moderators review and approve/reject.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Members can amend title and description</li>
                    <li>Amendments must be within 5 minutes of proposal close</li>
                    <li>Moderators approve/reject amendments</li>
                    <li>Approved amendments instantly update the proposal</li>
                  </ul>
                </div>
              </section>

              <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">🔐 Security & Fairness</h4>
                <p className="text-sm text-gray-700">
                  These Tier 2 features enhance security and fairness in governance:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mt-2">
                  <li>Snapshot voting prevents last-minute manipulation</li>
                  <li>Delegation enables participation proxies</li>
                  <li>RBAC ensures proper permission management</li>
                  <li>Amendments allow proposal refinement</li>
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

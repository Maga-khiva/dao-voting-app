import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../hooks/useWeb3";

export const RoleManagement = () => {
  const { contract, account, signer } = useWeb3();
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [targetAddress, setTargetAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState("1"); // 1=Member
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const ROLES = {
    0: "None",
    1: "Member",
    2: "Moderator",
    3: "Admin",
  };

  // Load user role
  useEffect(() => {
    if (!contract || !account) return;

    const loadUserRole = async () => {
      try {
        const role = await contract.getUserRole(account);
        const roleNum = Number(role);
        setUserRole(roleNum);
        setIsAdmin(roleNum === 3); // 3 = Admin
      } catch (err) {
        console.error("Error loading user role:", err);
      }
    };

    loadUserRole();
  }, [contract, account]);

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!targetAddress || !contract || !signer || !isAdmin) return;

    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    try {
      // Validate address
      const trimmedAddress = targetAddress.trim();
      if (!ethers.isAddress(trimmedAddress)) {
        throw new Error(
          `Invalid address format. Expected Ethereum address starting with 0x. Got: "${trimmedAddress}". ` +
          `Example of valid format: 0x1234567890123456789012345678901234567890`
        );
      }

      // Validate role
      if (!["1", "2", "3"].includes(selectedRole)) {
        throw new Error("Invalid role selection");
      }

      const tx = await contract.connect(signer).assignRole(trimmedAddress, Number(selectedRole));
      await tx.wait();

      setSuccess(`Role assigned successfully! ${trimmedAddress.slice(0, 6)}...${trimmedAddress.slice(-4)} is now a ${ROLES[Number(selectedRole)]}`);
      setTargetAddress("");
      setSelectedRole("1");

      // Add to users list if not already there
      const userExists = users.some((u) => u.address.toLowerCase() === trimmedAddress.toLowerCase());
      if (!userExists) {
        setUsers([...users, { address: trimmedAddress, role: Number(selectedRole) }]);
      }
    } catch (err) {
      setError(err.message || "Failed to assign role");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeRole = async (targetAddr) => {
    if (!contract || !signer || !isAdmin) return;

    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    try {
      const tx = await contract.connect(signer).revokeRole(targetAddr);
      await tx.wait();

      setSuccess(`Role revoked for ${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)}`);

      // Update users list
      setUsers(users.map((u) => (u.address.toLowerCase() === targetAddr.toLowerCase() ? { ...u, role: 0 } : u)));
    } catch (err) {
      setError(err.message || "Failed to revoke role");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!account) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-gray-600">Connect wallet to manage roles</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Role Management</h3>

      {/* Current Role Info */}
      <div className={`rounded-lg p-4 mb-6 ${isAdmin ? "bg-purple-50 border border-purple-200" : "bg-gray-50 border border-gray-200"}`}>
        <p className="text-sm text-gray-600">Your Role</p>
        <p className="text-2xl font-bold text-gray-800">{ROLES[userRole || 0]}</p>
        {isAdmin && <p className="text-xs text-purple-600 mt-2">✅ You have permission to manage roles</p>}
      </div>

      {/* Admin-Only Section */}
      {!isAdmin ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-semibold mb-2">Admin Only</p>
          <p>Only Admins can assign and revoke roles. Contact an existing Admin for role assignment.</p>
        </div>
      ) : (
        <>
          {/* Assign Role Form */}
          <form onSubmit={handleAssignRole} className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Assign Role to User</h4>
            <p className="text-xs text-gray-700 mb-3 bg-white p-2 rounded border border-blue-300">
              💡 <strong>How to delegate:</strong> Enter the wallet address (0x format). 
              Example: <code className="bg-gray-200 px-1">0x1234567890123456789012345678901234567890</code>
            </p>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">User Address</label>
              <input
                type="text"
                placeholder="Enter user address (0x...)"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              >
                <option value="1">Member - Can vote & propose amendments</option>
                <option value="2">Moderator - Can approve amendments & govern</option>
                <option value="3">Admin - Full permissions</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !targetAddress}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
            >
              {isProcessing ? "Assigning..." : "Assign Role"}
            </button>
          </form>

          {/* Recent Assignments */}
          {users.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">Managed Users</h4>
              <div className="space-y-2">
                {users.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">
                        {user.address.slice(0, 6)}...{user.address.slice(-4)}
                      </p>
                      <p className="text-sm text-gray-600">Current: {ROLES[user.role]}</p>
                    </div>
                    {user.role !== 0 && (
                      <button
                        onClick={() => handleRevokeRole(user.address)}
                        disabled={isProcessing}
                        className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 disabled:bg-gray-400 transition"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="font-semibold text-gray-800 mb-3">Role Permissions</p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-gray-700">Member</p>
                <ul className="text-xs text-gray-600 ml-4">
                  <li>✓ Vote on proposals</li>
                  <li>✓ Propose amendments</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Moderator</p>
                <ul className="text-xs text-gray-600 ml-4">
                  <li>✓ All Member permissions</li>
                  <li>✓ Approve/reject amendments</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Admin</p>
                <ul className="text-xs text-gray-600 ml-4">
                  <li>✓ All Moderator permissions</li>
                  <li>✓ Assign/revoke roles</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Feedback Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
          {success}
        </div>
      )}
    </div>
  );
};

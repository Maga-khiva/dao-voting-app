import React from "react";

export const DisconnectModal = ({ isOpen, onClose, onReconnect }) => {
  if (!isOpen) return null;

  const handleReconnect = () => {
    // Clear the logout flag
    localStorage.removeItem("userLoggedOut");
    // Close the modal
    onClose();
    // Trigger reconnection
    if (onReconnect) {
      onReconnect();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphism backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 animate-fade-in">
        {/* Wallet Icon with Disconnect Mark */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
              👛
            </div>
            <div className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm border-2 border-white">
              ✕
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-3">
          Successfully Logged Out
        </h2>

        {/* Body Text */}
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          You have been disconnected from the app session. However, your wallet
          permission may still be active in MetaMask.
        </p>

        {/* Instruction Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            💡 To fully revoke access:
          </p>
          <ol className="text-xs text-blue-800 space-y-1">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Open MetaMask</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Click the 3 dots (⋮) menu</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Select "Connected Sites"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Click "Disconnect"</span>
            </li>
          </ol>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleReconnect}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg hover:scale-105 transition-all active:scale-95"
          >
            🔗 Connect Again
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors active:scale-95"
          >
            Got it
          </button>
        </div>

        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

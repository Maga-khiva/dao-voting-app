import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export const DisconnectModal = ({ isOpen, onClose, onReconnect }) => {
  const handleReconnect = () => {
    localStorage.removeItem("userLoggedOut");
    onClose();
    if (onReconnect) {
      onReconnect();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8"
          >
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

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-3">
              Successfully Logged Out
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
              You have been disconnected from the app session. However, your wallet
              permission may still be active in MetaMask.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                💡 To fully revoke access:
              </p>
              <ol className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
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

            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReconnect}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all"
              >
                🔗 Connect Again
              </motion.button>
              <button
                onClick={onClose}
                className="w-full bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
              >
                Got it
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
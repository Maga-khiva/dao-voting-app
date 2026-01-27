/**
 * DAO Service - Helper functions for proposal management
 */

/**
 * Check if voting is still active for a proposal
 * @param {Object} proposal - Proposal object with deadline property
 * @returns {boolean} - True if voting is still active, false if ended
 */
export const isVotingActive = (proposal) => {
  if (!proposal || !proposal.deadline) {
    return false;
  }
  
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return currentTimestamp < proposal.deadline;
};

/**
 * Get voting status text
 * @param {Object} proposal - Proposal object
 * @returns {string} - Status text (Active, Closed, Executed)
 */
export const getVotingStatus = (proposal) => {
  if (!proposal) return "Unknown";
  if (proposal.executed) return "Executed";
  if (!isVotingActive(proposal)) return "Closed";
  return "Active";
};

/**
 * Get time remaining until voting ends
 * @param {Object} proposal - Proposal object with deadline property
 * @returns {number} - Seconds remaining (0 if voting ended)
 */
export const getTimeRemaining = (proposal) => {
  if (!proposal || !proposal.deadline) {
    return 0;
  }
  
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const remaining = proposal.deadline - currentTimestamp;
  
  return Math.max(0, remaining);
};

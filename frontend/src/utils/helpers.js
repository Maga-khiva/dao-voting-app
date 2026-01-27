/**
 * Format address to show first 6 and last 4 characters
 */
export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(-4)}`;
};

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Export proposals to CSV format
 * @param {Array} proposals - Array of proposal objects
 * @returns {void} - Downloads CSV file
 */
export const exportProposalsToCSV = (proposals) => {
  if (!proposals || proposals.length === 0) {
    alert("No proposals to export");
    return;
  }

  // CSV headers
  const headers = [
    "ID",
    "Title",
    "Description",
    "Yes Votes",
    "No Votes",
    "Status",
    "Creator",
  ];

  // CSV rows
  const rows = proposals.map((p) => [
    p.id,
    `"${p.title}"`, // Quote to handle commas in titles
    `"${p.description.substring(0, 100)}"`, // Truncate description
    p.yesVotes,
    p.noVotes,
    p.executed ? "Executed" : p.yesVotes > p.noVotes ? "Passing" : "Failing",
    p.creator,
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `dao-proposals-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};

/**
 * Get vote status
 */
export const getVoteStatus = (yesVotes, noVotes, isExecuted, isVotingOpen) => {
  if (isExecuted) return "Executed";
  if (!isVotingOpen) return "Closed";
  if (yesVotes > noVotes) return "Passing";
  if (noVotes > yesVotes) return "Failing";
  return "Open";
};

/**
 * Parse error message from ethers error object
 * Extracts clean error message from complex error objects
 */
export const parseErrorMessage = (error) => {
  if (!error) return "An unknown error occurred";

  // If it's a string, return it
  if (typeof error === "string") {
    return error;
  }

  // If it's an Error object with a message
  if (error instanceof Error) {
    // Check for revert reason
    if (error.reason) {
      return error.reason;
    }

    // Check for shortMessage (ethers.js v6)
    if (error.shortMessage) {
      return error.shortMessage;
    }

    // Extract from message like "reverted with reason string 'Only owner...'"
    const reasonMatch = error.message.match(
      /reverted with reason string '([^']+)'/
    );
    if (reasonMatch) {
      return reasonMatch[1];
    }

    // Check for ACTION_REJECTED (user denied transaction)
    if (error.code === "ACTION_REJECTED") {
      return "Transaction rejected. Please approve in MetaMask.";
    }

    // Check for INSUFFICIENT_FUNDS
    if (error.code === "INSUFFICIENT_FUNDS") {
      return "Insufficient funds to complete this transaction.";
    }

    // Check for NETWORK_ERROR
    if (error.code === "NETWORK_ERROR") {
      return "Network error. Please check your connection.";
    }

    // Check for CALL_EXCEPTION (contract error)
    if (error.code === "CALL_EXCEPTION") {
      if (error.revert && error.revert.args && error.revert.args.length > 0) {
        return error.revert.args[0];
      }
    }

    // Default to message
    return error.message;
  }

  // If it's an object, try to find an error message
  if (typeof error === "object") {
    if (error.message) return error.message;
    if (error.reason) return error.reason;
    if (error.error) return parseErrorMessage(error.error);
  }

  return "An unknown error occurred";
};


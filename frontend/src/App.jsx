import React, { useState, useEffect } from "react";
import { Web3Provider } from "./context/Web3Provider";
import { Home } from "./pages/Home";
import { CreateProposalPage } from "./pages/CreateProposalPage";
import { VotePage } from "./pages/VotePage";
import { Analytics } from "./pages/Analytics";
import { Tier2Features } from "./pages/Tier2Features";
import contractInfo from "./config/contract.json";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [pageParams, setPageParams] = useState({});

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  const handleProposalCreated = () => {
    setCurrentPage("home");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <Home onNavigate={handleNavigate} />
        );
      case "create":
        return (
          <CreateProposalPage
            onNavigate={handleNavigate}
            onProposalCreated={handleProposalCreated}
          />
        );
      case "vote":
        return (
          <VotePage
            onNavigate={handleNavigate}
            proposalId={pageParams.proposalId}
            onVoteSuccess={handleProposalCreated}
          />
        );
      case "analytics":
        return (
          <Analytics onNavigate={handleNavigate} />
        );
      case "tier2":
        return (
          <Tier2Features onNavigate={handleNavigate} />
        );
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <Web3Provider contractAddress={contractInfo.address}>
      <div className="min-h-screen bg-gray-100">
        {renderPage()}
      </div>
    </Web3Provider>
  );
}

export default App;

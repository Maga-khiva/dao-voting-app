import React, { useState, useEffect, createContext, useContext } from "react";
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
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

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
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      <Web3Provider contractAddress={contractInfo.address}>
        <div className={"min-h-screen " + (darkMode ? "bg-gray-900" : "bg-[#f8fafc]")}>
          {/* Dark mode toggle button in header */}
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="rounded-full p-2 bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 hover:scale-110 transition-all"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <span role="img" aria-label="Light">🌞</span>
              ) : (
                <span role="img" aria-label="Dark">🌙</span>
              )}
            </button>
          </div>
          {renderPage()}
        </div>
      </Web3Provider>
    </DarkModeContext.Provider>
  );
}

export const DarkModeContext = createContext({ darkMode: false, setDarkMode: () => {} });
export const useDarkMode = () => useContext(DarkModeContext);
export default App;

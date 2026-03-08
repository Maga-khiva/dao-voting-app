import React, { useState, useEffect, createContext, useContext } from "react";
import { Toaster } from "react-hot-toast";
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
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home": return <Home onNavigate={handleNavigate} />;
      case "create": return <CreateProposalPage onNavigate={handleNavigate} onProposalCreated={() => handleNavigate("home")} />;
      case "vote": return <VotePage onNavigate={handleNavigate} proposalId={pageParams.proposalId} />;
      case "analytics": return <Analytics onNavigate={handleNavigate} />;
      case "tier2": return <Tier2Features onNavigate={handleNavigate} />;
      default: return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      <Web3Provider contractAddress={contractInfo.address}>
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'glacier-card !bg-white/90 dark:!bg-slate-900/90 !text-slate-800 dark:!text-white !border-white/20',
            duration: 4000,
          }}
        />
        <div className={`min-h-screen transition-colors duration-500 ${darkMode ? "glacier-bg-dark" : "glacier-bg-light"}`}>
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="glacier-card p-4 hover:scale-110 active:scale-95 transition-all shadow-2xl border-cyan-400/30"
            >
              {darkMode ? "🌞" : "🌙"}
            </button>
          </div>
          <div className="relative z-10">{renderPage()}</div>
        </div>
      </Web3Provider>
    </DarkModeContext.Provider>
  );
}

export const DarkModeContext = createContext({ darkMode: false, setDarkMode: () => {} });
export const useDarkMode = () => useContext(DarkModeContext);
export default App;
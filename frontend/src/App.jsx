import React, { useState, useEffect, createContext, useContext } from "react";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
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

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  const renderPage = () => {
    return (
      <motion.div
        key={currentPage}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {(() => {
          switch (currentPage) {
            case "home": return <Home onNavigate={handleNavigate} />;
            case "create": return <CreateProposalPage onNavigate={handleNavigate} onProposalCreated={() => handleNavigate("home")} />;
            case "vote": return <VotePage onNavigate={handleNavigate} proposalId={pageParams.proposalId} />;
            case "analytics": return <Analytics onNavigate={handleNavigate} />;
            case "tier2": return <Tier2Features onNavigate={handleNavigate} />;
            default: return <Home onNavigate={handleNavigate} />;
          }
        })()}
      </motion.div>
    );
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
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDarkMode((d) => !d)}
              className="glacier-card p-4 shadow-2xl border-cyan-400/30"
            >
              {darkMode ? "🌞" : "🌙"}
            </motion.button>
          </div>
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {renderPage()}
            </AnimatePresence>
          </div>
        </div>
      </Web3Provider>
    </DarkModeContext.Provider>
  );
}

export const DarkModeContext = createContext({ darkMode: false, setDarkMode: () => {} });
export const useDarkMode = () => useContext(DarkModeContext);
export default App;
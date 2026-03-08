import { useState } from "react";

export function ProposalFilter({ onFilterChange }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc"); // Default to Newest First

  const handleChange = (newFilters) => {
    onFilterChange({ ...{ search, category, status, sortOrder }, ...newFilters });
  };

  const handleClear = () => {
    setSearch("");
    setCategory("All");
    setStatus("All");
    setSortOrder("desc");
    onFilterChange({ search: "", category: "All", status: "All", sortOrder: "desc" });
  };

  return (
    <div className="glacier-card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Filter Engine</h3>
        {(search || category !== "All" || status !== "All" || sortOrder !== "desc") && (
          <button
            onClick={handleClear}
            className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors"
          >
            RESET FILTERS
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">SEARCH</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Find proposal..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleChange({ search: e.target.value });
              }}
              className="glacier-input pl-10"
            />
            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">CATEGORY</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              handleChange({ category: e.target.value });
            }}
            className="glacier-input appearance-none"
          >
            <option value="All">All Categories</option>
            <option value="Treasury">💰 Treasury</option>
            <option value="Governance">🏛️ Governance</option>
            <option value="Operations">⚙️ Operations</option>
            <option value="Other">📌 Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">STATUS</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              handleChange({ status: e.target.value });
            }}
            className="glacier-input appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">🟢 Active</option>
            <option value="Closed">🔵 Closed</option>
            <option value="Executed">✅ Executed</option>
            <option value="Rejected">❌ Rejected</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">SORT ORDER</label>
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              handleChange({ sortOrder: e.target.value });
            }}
            className="glacier-input appearance-none"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
}
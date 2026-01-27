import { useState } from "react";

export function ProposalFilter({ onFilterChange }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  const handleChange = () => {
    onFilterChange({ search, category, status });
  };

  const handleClear = () => {
    setSearch("");
    setCategory("All");
    setStatus("All");
    onFilterChange({ search: "", category: "All", status: "All" });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">🔍 Filter Proposals</h3>
        {(search || category !== "All" || status !== "All") && (
          <button
            onClick={handleClear}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search by Title
          </label>
          <input
            type="text"
            placeholder="Type to search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onFilterChange({ search: e.target.value, category, status });
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              handleChange();
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Treasury">💰 Treasury</option>
            <option value="Governance">🏛️ Governance</option>
            <option value="Operations">⚙️ Operations</option>
            <option value="Other">📌 Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              handleChange();
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">🟢 Active</option>
            <option value="Closed">🔵 Closed</option>
            <option value="Executed">✅ Executed</option>
            <option value="Rejected">❌ Rejected</option>
          </select>
        </div>
      </div>
    </div>
  );
}

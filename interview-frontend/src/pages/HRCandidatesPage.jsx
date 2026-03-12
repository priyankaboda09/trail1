import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CandidateTable from "../components/CandidateTable";
import { hrApi } from "../services/api";

export default function HRCandidatesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCandidates = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await hrApi.listCandidates({
        q: searchTerm,
        status: statusFilter,
        sort,
        page: targetPage,
      });
      setData(response);
      setPage(response.page || targetPage);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sort, statusFilter]);

  useEffect(() => {
    loadCandidates(1);
  }, [loadCandidates]);

  async function handleDeleteCandidate(candidate) {
    try {
      await hrApi.deleteCandidate(candidate.uid || candidate.candidate_uid);
      await loadCandidates(page);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function handleScheduleCandidate(candidate) {
    navigate(`/hr/candidates/${candidate.uid || candidate.candidate_uid}`);
  }

  function handleExportCsv() {
    const header = ["Candidate UID", "Name", "Email", "Role", "Resume Score", "Status", "Decision"];
    const rows = (data?.candidates || []).map((candidate) => [
      candidate.candidate_uid,
      candidate.name,
      candidate.email,
      candidate.role,
      candidate.resumeScore,
      candidate.status?.label || "",
      candidate.finalDecision?.label || "",
    ]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "candidates.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Candidate Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review all candidates owned by this HR account.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => loadCandidates(page)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error ? <p className="alert error">{error}</p> : null}

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by candidate UID, name, or email..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-56">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none dark:text-white font-medium"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white font-medium"
          >
            <option value="newest">Newest Applied</option>
            <option value="score_desc">Score: High to Low</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <p className="center muted py-12">Loading candidates...</p>
        ) : (
          <CandidateTable
            candidates={data?.candidates || []}
            onDeleteCandidate={handleDeleteCandidate}
            onScheduleCandidate={handleScheduleCandidate}
          />
        )}

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Showing <span className="text-slate-900 dark:text-white">{(data?.candidates || []).length}</span> of{" "}
            <span className="text-slate-900 dark:text-white">{data?.total_results || 0}</span> candidates
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all border border-slate-200 dark:border-slate-800 disabled:opacity-30"
              disabled={!data?.has_prev || loading}
              onClick={() => loadCandidates(page - 1)}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 text-sm font-bold text-slate-900 dark:text-white">
              Page {data?.page || 1} of {data?.total_pages || 1}
            </div>
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all border border-slate-200 dark:border-slate-800 disabled:opacity-30"
              disabled={!data?.has_next || loading}
              onClick={() => loadCandidates(page + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

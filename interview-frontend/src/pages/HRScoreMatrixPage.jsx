import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  ArrowUpDown,
  Table as TableIcon,
  LayoutGrid,
  Users,
  Target,
  BarChart3,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import ScoreBadge from "../components/ScoreBadge";
import ScoreProgressCell from "../components/ScoreProgressCell";
import MetricCard from "../components/MetricCard";
import { hrApi } from "../services/api";
import { cn } from "../utils/utils";

function SortButton({ column, label, sortKey, onSort }) {
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="flex items-center space-x-1 hover:text-blue-600 transition-colors uppercase tracking-wider font-bold"
    >
      <span>{label}</span>
      <ArrowUpDown size={12} className={cn(sortKey === column ? "text-blue-600" : "text-slate-400 opacity-50")} />
    </button>
  );
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function HRScoreMatrixPage() {
  const [view, setView] = useState("table");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "finalAIScore", direction: "desc" });
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  async function loadRows() {
    setLoading(true);
    setError("");
    try {
      let pageNumber = 1;
      let hasMore = true;
      let allCandidates = [];

      while (hasMore) {
        const response = await hrApi.listCandidates({ page: pageNumber });
        allCandidates = allCandidates.concat(response.candidates || []);
        hasMore = response.has_next;
        pageNumber += 1;
      }

      const details = await Promise.all(
        allCandidates.map((candidate) => hrApi.candidateDetail(candidate.candidate_uid)),
      );

      const detailMap = new Map(details.map((detail) => [detail.candidate.candidate_uid, detail]));
      const mergedRows = allCandidates.map((candidate) => {
        const detail = detailMap.get(candidate.candidate_uid);
        const detailCandidate = detail?.candidate || {};
        const application = detail?.applications?.[0] || {};
        return {
          ...candidate,
          uid: candidate.candidate_uid,
          semanticScore: Number(detailCandidate.semanticScore || 0),
          skillMatchScore: Number(detailCandidate.skillMatchScore || 0),
          resumeScore: Number(detailCandidate.resumeScore || candidate.resumeScore || 0),
          interviewScore:
            detailCandidate.interviewScore === null || detailCandidate.interviewScore === undefined
              ? 0
              : Number(detailCandidate.interviewScore),
          behavioralScore:
            detailCandidate.behavioralScore === null || detailCandidate.behavioralScore === undefined
              ? 0
              : Number(detailCandidate.behavioralScore),
          communicationScore:
            detailCandidate.communicationScore === null || detailCandidate.communicationScore === undefined
              ? 0
              : Number(detailCandidate.communicationScore),
          finalAIScore: Number(detailCandidate.finalAIScore || candidate.resumeScore || 0),
          finalDecision: detailCandidate.finalDecision || candidate.finalDecision,
          interviewStatus: application.status || candidate.status,
        };
      });

      setRows(mergedRows);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  const roles = useMemo(() => {
    return ["all", ...new Set(rows.map((candidate) => candidate.role).filter(Boolean))];
  }, [rows]);

  const filteredCandidates = useMemo(() => {
    return rows
      .filter((candidate) => {
        const matchesSearch =
          candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(candidate.candidate_uid || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || candidate.role === roleFilter;
        const matchesStatus = statusFilter === "all" || candidate.interviewStatus?.key === statusFilter;
        const matchesDecision = decisionFilter === "all" || candidate.finalDecision?.key === decisionFilter;
        return matchesSearch && matchesRole && matchesStatus && matchesDecision;
      })
      .sort((left, right) => {
        const leftValue = Number(left[sortConfig.key] || 0);
        const rightValue = Number(right[sortConfig.key] || 0);
        if (leftValue < rightValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (leftValue > rightValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [decisionFilter, roleFilter, rows, searchTerm, sortConfig, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, statusFilter, decisionFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / itemsPerPage));
  const paginatedCandidates = filteredCandidates.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const requestSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  async function handleDelete(candidateUid) {
    try {
      await hrApi.deleteCandidate(candidateUid);
      await loadRows();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  const resumeScores = filteredCandidates.map((candidate) => candidate.resumeScore);
  const interviewScores = filteredCandidates.map((candidate) => candidate.interviewScore).filter((value) => value > 0);
  const finalScores = filteredCandidates.map((candidate) => candidate.finalAIScore);
  const shortlistedCount = filteredCandidates.filter((candidate) => candidate.finalDecision?.key === "shortlisted" || candidate.finalDecision?.key === "selected").length;

  if (loading) {
    return <p className="center muted">Loading candidate score matrix...</p>;
  }

  return (
    <div className="space-y-8 pb-12">
      {error ? <p className="alert error">{error}</p> : null}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Candidate Score Matrix</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Compare backend-derived screening and interview metrics across all candidates.
          </p>
        </div>
        <div className="flex p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              view === "table" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700",
            )}
          >
            <TableIcon size={18} />
            <span>Table View</span>
          </button>
          <button
            type="button"
            onClick={() => setView("matrix")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              view === "matrix" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700",
            )}
          >
            <LayoutGrid size={18} />
            <span>Matrix View</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total Candidates" value={filteredCandidates.length} icon={Users} color="blue" />
        <MetricCard title="Avg Resume Score" value={`${average(resumeScores)}%`} icon={FileText} color="purple" />
        <MetricCard title="Avg Interview Score" value={`${average(interviewScores)}%`} icon={Target} color="green" />
        <MetricCard title="Top Final Score" value={`${Math.max(...finalScores, 0)}%`} icon={BarChart3} color="yellow" />
        <MetricCard title="Shortlisted Count" value={shortlistedCount} icon={CheckCircle2} color="green" />
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, UID..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium dark:text-white"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium dark:text-white capitalize"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role === "all" ? "All Roles" : role}
              </option>
            ))}
          </select>

          <select
            className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium dark:text-white"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Interview Status: All</option>
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium dark:text-white"
            value={decisionFilter}
            onChange={(event) => setDecisionFilter(event.target.value)}
          >
            <option value="all">Decision: All</option>
            <option value="selected">Selected</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-1">
          Showing {paginatedCandidates.length} of {filteredCandidates.length} matching candidates
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest font-black">Candidate Info</th>
                <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest font-black">Applied Role</th>
                <th className="px-6 py-5 min-w-[120px]"><SortButton column="semanticScore" label="Semantic" sortKey={sortConfig.key} onSort={requestSort} /></th>
                <th className="px-6 py-5 min-w-[120px]"><SortButton column="skillMatchScore" label="Skill Match" sortKey={sortConfig.key} onSort={requestSort} /></th>
                <th className="px-6 py-5 min-w-[120px]"><SortButton column="resumeScore" label="Resume" sortKey={sortConfig.key} onSort={requestSort} /></th>
                <th className="px-6 py-5 min-w-[120px]"><SortButton column="interviewScore" label="Interview" sortKey={sortConfig.key} onSort={requestSort} /></th>
                <th className="px-6 py-5 min-w-[120px]"><SortButton column="behavioralScore" label="Behavioral" sortKey={sortConfig.key} onSort={requestSort} /></th>
                <th className="px-6 py-5 min-w-[120px]"><SortButton column="communicationScore" label="Comm." sortKey={sortConfig.key} onSort={requestSort} /></th>
                <th className="px-6 py-5 min-w-[120px] bg-blue-50/20 dark:bg-blue-900/10"><SortButton column="finalAIScore" label="Final AI" sortKey={sortConfig.key} onSort={requestSort} /></th>
                <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest font-black">Decision</th>
                <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest font-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {!paginatedCandidates.length ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No candidates match the current filters.
                  </td>
                </tr>
              ) : paginatedCandidates.map((candidate) => (
                <tr key={candidate.candidate_uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-100 dark:group-hover:ring-blue-900 transition-all">
                        <img src={candidate.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{candidate.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{candidate.candidate_uid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{candidate.role}</p>
                  </td>
                  <td className="px-6 py-4">{view === "matrix" ? <ScoreProgressCell score={candidate.semanticScore} /> : <ScoreBadge score={candidate.semanticScore} />}</td>
                  <td className="px-6 py-4">{view === "matrix" ? <ScoreProgressCell score={candidate.skillMatchScore} /> : <ScoreBadge score={candidate.skillMatchScore} />}</td>
                  <td className="px-6 py-4">{view === "matrix" ? <ScoreProgressCell score={candidate.resumeScore} /> : <ScoreBadge score={candidate.resumeScore} />}</td>
                  <td className="px-6 py-4">{view === "matrix" ? <ScoreProgressCell score={candidate.interviewScore} /> : <ScoreBadge score={candidate.interviewScore} />}</td>
                  <td className="px-6 py-4">{view === "matrix" ? <ScoreProgressCell score={candidate.behavioralScore} /> : <ScoreBadge score={candidate.behavioralScore} />}</td>
                  <td className="px-6 py-4">{view === "matrix" ? <ScoreProgressCell score={candidate.communicationScore} /> : <ScoreBadge score={candidate.communicationScore} />}</td>
                  <td className="px-6 py-4 bg-blue-50/20 dark:bg-blue-900/5">
                    {view === "matrix" ? <ScoreProgressCell score={candidate.finalAIScore} /> : <ScoreBadge score={candidate.finalAIScore} className="scale-110 shadow-sm" />}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={candidate.finalDecision} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center space-x-2">
                      <Link to={`/hr/candidates/${candidate.candidate_uid}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                        <Eye size={18} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(candidate.candidate_uid)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50/30 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">
            Showing <span className="text-slate-900 dark:text-white">{paginatedCandidates.length}</span> candidates per page
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-900 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center space-x-1 px-4">
              <span className="text-sm font-black text-slate-900 dark:text-white">Page {page}</span>
              <span className="text-sm text-slate-400">of {totalPages}</span>
            </div>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-900 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

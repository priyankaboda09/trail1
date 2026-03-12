import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Target,
  MessageCircle,
  Zap,
  CheckCircle2,
  ArrowLeft,
  Briefcase,
} from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { candidateApi } from "../services/api";
import { cn } from "../utils/utils";

export default function FinalResultPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await candidateApi.dashboard();
        setDashboard(response);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const result = dashboard?.result || null;
  const explanation = result?.explanation || {};
  const scores = {
    overall: Math.round(Number(result?.score || 0)),
    technical: Math.round(Number(explanation?.weighted_skill_score || 0)),
    communication: Math.round(Number(explanation?.semantic_score || 0)),
    confidence: Math.round(Number(explanation?.experience_score || 0)),
  };

  const metrics = [
    { label: "Skill Match", value: scores.technical, icon: Target, color: "blue" },
    { label: "Semantic Fit", value: scores.communication, icon: MessageCircle, color: "purple" },
    { label: "Experience Fit", value: scores.confidence, icon: Zap, color: "yellow" },
  ];

  if (loading) {
    return <p className="center muted">Loading interview performance...</p>;
  }

  if (error && !dashboard) {
    return <p className="alert error">{error}</p>;
  }

  return (
    <div className="space-y-8 pb-12">
      {error ? <p className="alert error">{error}</p> : null}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/candidate" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-slate-100 dark:border-slate-800">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Application Performance</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Latest backend-derived scoring preview for your selected JD.</p>
          </div>
        </div>
        <StatusBadge status={result?.shortlisted ? "Shortlisted" : "Pending"} className="text-sm px-5 py-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm p-10 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp size={200} />
            </div>

            <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 dark:border-slate-800 flex items-center justify-center relative mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-blue-600"
                  strokeDasharray={`${scores.overall * 2.83} 283`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-6xl font-black text-slate-900 dark:text-white">{scores.overall}</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Score</p>
              </div>
            </div>

            <div className="max-w-md">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {result?.shortlisted ? "Shortlist Ready" : "Needs Improvement"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                {Array.isArray(explanation?.reasons) && explanation.reasons.length
                  ? explanation.reasons[0]
                  : "The backend has scored your latest resume submission for the selected job description."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
                  metric.color === "blue" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" :
                  metric.color === "purple" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600" :
                  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600",
                )}>
                  <metric.icon size={24} />
                </div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">{metric.label}</h4>
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{metric.value}%</span>
                  <TrendingUp size={18} className="text-emerald-500 mb-1" />
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      metric.color === "blue" ? "bg-blue-600" : metric.color === "purple" ? "bg-purple-600" : "bg-yellow-600",
                    )}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center font-display">
              <CheckCircle2 className="text-emerald-500 mr-2" size={24} />
              AI Screening Notes
            </h3>
            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 mb-6">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                Status: {result?.shortlisted ? "Strong Match" : "Review Needed"}
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-500/80 mt-2 leading-relaxed font-medium">
                {Array.isArray(explanation?.reasons) && explanation.reasons.length > 1
                  ? explanation.reasons[1]
                  : "Review the matched and missing skills on the candidate dashboard before the next submission."}
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Top Highlights</h4>
              <div className="flex flex-wrap gap-2">
                {(explanation?.matched_skills || []).slice(0, 6).map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold border border-slate-100 dark:border-slate-700">
                    {tag}
                  </span>
                ))}
                {!explanation?.matched_skills?.length ? (
                  <span className="text-sm text-slate-500 dark:text-slate-400">No matched skills captured yet.</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-8">Role Insights</h4>
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Briefcase size={28} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">{dashboard?.available_jds?.find((jd) => jd.id === dashboard?.selected_jd_id)?.title || "Selected JD"}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Candidate workflow</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <span>Matched Skills</span>
                  <span>{Math.round(Number(explanation?.matched_percentage || 0))}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full" style={{ width: `${Math.round(Number(explanation?.matched_percentage || 0))}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <span>Education Check</span>
                  <span>{Math.round(Number(explanation?.education_score || 0))}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${Math.round(Number(explanation?.education_score || 0))}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 dark:shadow-none">
            <BarChart3 className="mb-6 opacity-80" size={40} />
            <h3 className="text-xl font-bold font-display leading-tight mb-4">Improve the next submission</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              Review missing skills, update resume bullet points, and retry the screening flow from the dashboard.
            </p>
            <Link to="/candidate" className="block w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-sm hover:scale-[1.02] transition-all shadow-lg text-center">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

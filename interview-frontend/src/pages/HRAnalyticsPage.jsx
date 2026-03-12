import { useEffect, useState } from "react";
import MetricCard from "../components/MetricCard";
import StatusBadge from "../components/StatusBadge";
import { hrApi } from "../services/api";

export default function HRAnalyticsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError("");
      try {
        const response = await hrApi.dashboard();
        setDashboard(response);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const overview = dashboard?.analytics?.overview || {};
  const pipeline = dashboard?.analytics?.pipeline || [];
  const missingSkills = dashboard?.analytics?.top_missing_skills || [];
  const matchedSkills = dashboard?.analytics?.top_matched_skills || [];
  const jobs = dashboard?.jobs || [];
  const topJob = jobs[0] || null;

  if (loading) {
    return <p className="center muted">Loading analytics...</p>;
  }

  if (error && !dashboard) {
    return <p className="alert error">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">HR Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Live recruitment analytics sourced from the backend dashboard endpoint.</p>
      </div>

      {error ? <p className="alert error">{error}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total Jobs" value={overview.total_jobs || 0} color="blue" />
        <MetricCard title="Applications" value={overview.total_applications || 0} color="purple" />
        <MetricCard title="Active Candidates" value={overview.active_candidates || 0} color="green" />
        <MetricCard title="Avg Resume Score" value={`${Math.round(Number(overview.avg_resume_score || 0))}%`} color="yellow" />
        <MetricCard title="Shortlist Rate" value={`${Math.round(Number(overview.shortlist_rate || 0))}%`} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Pipeline</h3>
          <div className="space-y-4">
            {pipeline.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <StatusBadge status={item} />
                <span className="text-lg font-bold text-slate-900 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Top Missing Skills</h3>
          <div className="space-y-4">
            {missingSkills.length ? missingSkills.map((item) => (
              <div key={item.skill} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.skill}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{item.count}</span>
              </div>
            )) : <p className="text-sm text-slate-500 dark:text-slate-400">No missing-skill data yet.</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Top Matched Skills</h3>
          <div className="space-y-4">
            {matchedSkills.length ? matchedSkills.map((item) => (
              <div key={item.skill} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.skill}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{item.count}</span>
              </div>
            )) : <p className="text-sm text-slate-500 dark:text-slate-400">No matched-skill data yet.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Current Job Focus</h3>
        {topJob ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{topJob.jd_title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                Cutoff {topJob.cutoff_score}% | Question count {topJob.question_count}
              </p>
            </div>
            <div className="space-y-3">
              {Object.entries(topJob.skill_scores || {}).slice(0, 6).map(([skill, weight]) => (
                <div key={skill} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{skill}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{weight}</span>
                </div>
              ))}
              {!Object.keys(topJob.skill_scores || {}).length ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No skill weights configured yet.</p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No jobs available yet.</p>
        )}
      </div>
    </div>
  );
}

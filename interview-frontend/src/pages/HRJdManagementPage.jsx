import { useCallback, useEffect, useMemo, useState } from "react";
import MetricCard from "../components/MetricCard";
import StatusBadge from "../components/StatusBadge";
import { hrApi } from "../services/api";

function buildInitialForm() {
  return {
    id: null,
    title: "",
    jd_text: "",
    weights_json: "{}",
    qualify_score: 65,
    min_academic_percent: 0,
    total_questions: 8,
    project_question_ratio: 0.8,
  };
}

function weightsToString(value) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return "{}";
  }
}

export default function HRJdManagementPage() {
  const [jds, setJds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(buildInitialForm());

  const filteredJds = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return jds;
    return jds.filter((jd) => {
      return [jd.title, jd.jd_text]
        .some((value) => String(value || "").toLowerCase().includes(needle));
    });
  }, [jds, search]);

  const loadJds = useCallback(async (selectedJdId) => {
    setLoading(true);
    setError("");
    try {
      const response = await hrApi.listJds();
      const rows = response?.jds || [];
      setJds(rows);

      const activeId = selectedJdId || rows[0]?.id || null;
      if (activeId) {
        const detail = await hrApi.getJd(activeId);
        const jd = detail.jd;
        setSelectedId(jd.id);
        setForm({
          id: jd.id,
          title: jd.title || "",
          jd_text: jd.jd_text || "",
          weights_json: weightsToString(jd.weights_json),
          qualify_score: jd.qualify_score ?? 65,
          min_academic_percent: jd.min_academic_percent ?? 0,
          total_questions: jd.total_questions ?? 8,
          project_question_ratio: jd.project_question_ratio ?? 0.8,
        });
      } else {
        setSelectedId(null);
        setForm(buildInitialForm());
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJds();
  }, [loadJds]);

  async function handleSelectJd(jdId) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const detail = await hrApi.getJd(jdId);
      const jd = detail.jd;
      setSelectedId(jd.id);
      setForm({
        id: jd.id,
        title: jd.title || "",
        jd_text: jd.jd_text || "",
        weights_json: weightsToString(jd.weights_json),
        qualify_score: jd.qualify_score ?? 65,
        min_academic_percent: jd.min_academic_percent ?? 0,
        total_questions: jd.total_questions ?? 8,
        project_question_ratio: jd.project_question_ratio ?? 0.8,
      });
    } catch (selectError) {
      setError(selectError.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedId(null);
    setForm(buildInitialForm());
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    let parsedWeights;
    try {
      parsedWeights = JSON.parse(form.weights_json || "{}");
    } catch {
      setSaving(false);
      setError("Weights JSON is invalid.");
      return;
    }

    const payload = {
      title: form.title,
      jd_text: form.jd_text,
      weights_json: parsedWeights,
      qualify_score: Number(form.qualify_score),
      min_academic_percent: Number(form.min_academic_percent),
      total_questions: Number(form.total_questions),
      project_question_ratio: Number(form.project_question_ratio),
    };

    try {
      if (selectedId) {
        await hrApi.updateJd(selectedId, payload);
        setMessage("JD updated successfully.");
        await loadJds(selectedId);
      } else {
        const response = await hrApi.createJd(payload);
        const newId = response?.jd?.id;
        setMessage("JD created successfully.");
        await loadJds(newId);
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading && !jds.length && !selectedId) {
    return <p className="center muted">Loading JD management...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">JD Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create and update the job descriptions used for screening and interview generation.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-200 dark:shadow-none"
        >
          Create New JD
        </button>
      </div>

      {error ? <p className="alert error">{error}</p> : null}
      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3">
          {message}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total JDs" value={jds.length} color="blue" />
        <MetricCard title="Average Qualify Score" value={jds.length ? `${Math.round(jds.reduce((sum, jd) => sum + Number(jd.qualify_score || 0), 0) / jds.length)}%` : "0%"} color="green" />
        <MetricCard title="Total Questions Configured" value={jds.reduce((sum, jd) => sum + Number(jd.total_questions || 0), 0)} color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <input
              type="search"
              placeholder="Search JDs..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {!filteredJds.length ? (
              <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No JDs found.</div>
            ) : filteredJds.map((jd) => (
              <button
                key={jd.id}
                type="button"
                onClick={() => handleSelectJd(jd.id)}
                className={`w-full text-left p-6 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  selectedId === jd.id ? "bg-blue-50/60 dark:bg-blue-900/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{jd.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">{jd.jd_text}</p>
                  </div>
                  <StatusBadge status={{ label: `${jd.total_questions} Questions`, tone: "primary" }} />
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Qualify score {jd.qualify_score}% | Academic floor {jd.min_academic_percent}%
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedId ? "Edit Job Description" : "Create Job Description"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">This form writes directly to the live `/api/hr/jds` endpoints.</p>
            </div>
            {selectedId ? (
              <StatusBadge status={{ label: `JD #${selectedId}`, tone: "secondary" }} />
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Qualify Score</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.qualify_score}
                  onChange={(event) => setForm((current) => ({ ...current, qualify_score: event.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">JD Text</label>
              <textarea
                rows={10}
                value={form.jd_text}
                onChange={(event) => setForm((current) => ({ ...current, jd_text: event.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Min Academic %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.min_academic_percent}
                  onChange={(event) => setForm((current) => ({ ...current, min_academic_percent: event.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Total Questions</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.total_questions}
                  onChange={(event) => setForm((current) => ({ ...current, total_questions: event.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Project Ratio</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step="0.1"
                  value={form.project_question_ratio}
                  onChange={(event) => setForm((current) => ({ ...current, project_question_ratio: event.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Weights JSON</label>
              <textarea
                rows={8}
                value={form.weights_json}
                onChange={(event) => setForm((current) => ({ ...current, weights_json: event.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Example: {"{"}"react": 5, "node.js": 4, "sql": 3{"}"}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {saving ? "Saving..." : selectedId ? "Update JD" : "Create JD"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

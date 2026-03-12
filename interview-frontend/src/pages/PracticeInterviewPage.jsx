import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  ArrowRight,
  Clock,
  MessageSquare,
  Play,
  RotateCcw,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { candidateApi } from "../services/api";
import { cn } from "../utils/utils";

export default function PracticeInterviewPage() {
  const [data, setData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(90);
  const [isFinished, setIsFinished] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const questions = data?.practice?.questions || [];
  const activeQuestion = questions[currentIndex] || null;
  const tips = useMemo(() => data?.resume_advice?.rewrite_tips || [], [data]);

  async function loadPracticeKit() {
    setLoading(true);
    setError("");
    try {
      const response = await candidateApi.practiceKit();
      setData(response);
      setCurrentIndex(0);
      setAnswer("");
      setTimeLeft(90);
      setIsFinished(false);
      setAnswers([]);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPracticeKit();
  }, []);

  const handleNext = useCallback(() => {
    if (!activeQuestion) return;

    setAnswers((currentAnswers) => [
      ...currentAnswers,
      { q: activeQuestion.text, a: answer, topic: activeQuestion.topic, type: activeQuestion.type },
    ]);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setAnswer("");
      setTimeLeft(90);
    } else {
      setIsFinished(true);
    }
  }, [activeQuestion, answer, currentIndex, questions.length]);

  useEffect(() => {
    if (loading || isFinished || !activeQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNext();
          return 90;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuestion, handleNext, isFinished, loading]);

  if (loading) {
    return <p className="center muted">Loading practice kit...</p>;
  }

  if (error && !data) {
    return <p className="alert error">{error}</p>;
  }

  if (!questions.length) {
    return (
      <div className="space-y-6">
        {error ? <p className="alert error">{error}</p> : null}
        <div className="card stack">
          <h3>No practice kit available yet.</h3>
          <p className="muted">Upload a resume and select a JD from the candidate dashboard first.</p>
          <Link to="/candidate" className="button-link subtle-button">
            Go to Candidate Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-4 py-8">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-50">
            <Award size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white font-display">Practice Complete</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            This practice set was generated from your selected JD and current resume profile.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <MessageSquare className="mr-2 text-blue-600" size={24} />
              Response Summary
            </h3>
            <div className="space-y-6">
              {answers.map((item, index) => (
                <div key={`${item.q}-${index}`} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Question {index + 1}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">{item.q}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{item.type} | {item.topic}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">"{item.a || "No response recorded"}"</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[40px] text-white shadow-xl">
              <ShieldCheck className="mb-6 opacity-80" size={40} />
              <h3 className="text-2xl font-bold font-display leading-tight mb-4">Practice insights</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                JD: <span className="font-bold">{data?.jd?.title || "Selected role"}</span>
              </p>
              <p className="text-indigo-100 text-sm leading-relaxed mb-8">
                Resume score preview: <span className="font-bold">{Math.round(Number(data?.score_preview || 0))}%</span>
              </p>
              <Link to="/candidate" className="block w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-center hover:scale-[1.02] transition-all">
                Back to Candidate Dashboard
              </Link>
            </div>

            <button
              type="button"
              onClick={loadPracticeKit}
              className="w-full flex items-center justify-center space-x-2 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <RotateCcw size={20} />
              <span>Reload Practice Kit</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error ? <p className="alert error">{error}</p> : null}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white">
            <Play size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">AI Practice Mode</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Generated from your selected JD and resume. Responses stay local to this browser session.</p>
          </div>
        </div>
        <div className="flex items-center bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Clock className={cn("mr-3", timeLeft < 15 ? "text-red-500 animate-pulse" : "text-blue-600")} size={20} />
          <span className={cn("text-xl font-black font-mono", timeLeft < 15 ? "text-red-500" : "text-slate-900 dark:text-white")}>
            00:{timeLeft.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-6">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/50">
                {activeQuestion?.type || "Question"}
              </span>
              <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700">
                {activeQuestion?.difficulty || "Mixed"}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-display leading-tight mb-3">
              {activeQuestion?.text}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{activeQuestion?.topic || "General"}</p>

            <textarea
              className="w-full h-48 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-6 text-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none font-medium leading-relaxed mt-8"
              placeholder="Type your practice response here..."
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
            />

            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {questions.map((question, index) => (
                    <div
                      key={`${question.text}-${index}`}
                      className={cn(
                        "w-8 h-1.5 rounded-full transition-all duration-500",
                        index === currentIndex ? "bg-blue-600 w-12" : index < currentIndex ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800",
                      )}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Step {currentIndex + 1} of {questions.length}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center justify-center space-x-3 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none transition-all group"
              >
                <span>{currentIndex === questions.length - 1 ? "Finish Session" : "Next Question"}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-8 flex items-center">
              <Zap className="mr-2 text-yellow-500" size={18} />
              Practice Tips
            </h4>
            <div className="space-y-6">
              {(tips.length ? tips : [
                "Be concise and use clear examples.",
                "Anchor answers to the selected JD skills.",
                "Prefer measurable outcomes over generic tool lists.",
              ]).map((tip, index) => (
                <div key={tip} className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 text-xs font-bold">{index + 1}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] text-white">
            <Target className="mb-6 text-blue-500" size={40} />
            <h3 className="text-xl font-bold font-display leading-tight mb-4">Current Practice Context</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Role: <span className="text-white font-bold">{data?.jd?.title || "Selected JD"}</span>
            </p>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Total questions: <span className="text-white font-bold">{questions.length}</span>
            </p>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Score preview: <span className="text-white font-bold">{Math.round(Number(data?.score_preview || 0))}%</span>
            </p>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold">
              <span>Generated by backend practice-kit</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

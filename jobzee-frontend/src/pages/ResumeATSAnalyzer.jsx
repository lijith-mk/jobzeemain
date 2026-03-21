import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  analyzeResumeATS,
  getResumeATSAnalysis,
  getResumeATSHistory,
} from '../services/resumeATSService';

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const componentLabels = {
  skill_match_score: 'Skill Match',
  experience_score: 'Experience',
  project_score: 'Projects',
  resume_structure_score: 'Structure',
  keyword_score: 'Keywords',
};

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch (_) {
    return value;
  }
};

const normalizeStoredAnalysis = (record) => ({
  analysisId: record._id,
  ats_score: record.atsScore,
  component_scores: record.componentScores || {},
  matched_skills: record.matchedSkills || [],
  missing_skills: record.missingSkills || [],
  matched_keywords: record.matchedKeywords || [],
  experience_years: record.experienceYears || 0,
  required_years: record.requiredYears || 0,
  feedback: record.feedback || [],
  improvement_suggestions: record.improvementSuggestions || [],
  suggestion_categories: record.suggestionCategories || {},
  filename: record.originalFilename,
  name: record.structuredResume?.name || '',
  email: record.structuredResume?.email || '',
  phone: record.structuredResume?.phone || '',
  skills: record.structuredResume?.skills || [],
  skills_by_category: record.structuredResume?.skills_by_category || {},
  education: record.structuredResume?.education || [],
  experience: record.structuredResume?.experience || [],
  projects: record.structuredResume?.projects || [],
  summary: record.structuredResume?.summary || '',
  createdAt: record.createdAt,
});

const ScoreRing = ({ score }) => {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const color = safeScore >= 80 ? 'from-emerald-500 to-teal-400' : safeScore >= 65 ? 'from-amber-500 to-orange-400' : 'from-rose-500 to-pink-500';

  return (
    <div className="relative h-40 w-40">
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${color} p-[10px] shadow-2xl`}>
        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-white">
          <div className="text-center">
            <div className="text-4xl font-black">{safeScore}</div>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-300">ATS Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultChipList = ({ title, items, emptyText, tone = 'slate' }) => {
  const toneMap = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-rose-100 text-rose-800',
  };

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">{title}</h3>
      {items?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className={`rounded-full px-3 py-1 text-sm font-medium ${toneMap[tone]}`}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
};

const ResumeATSAnalyzer = () => {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    loadHistory();
  }, [navigate]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getResumeATSHistory();
      setHistory(data.analyses || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load ATS history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Resume size should be less than 10MB');
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error('Please upload a PDF or DOCX resume');
      return;
    }

    setResumeFile(file);
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();

    if (!resumeFile) {
      toast.error('Please upload a resume for ATS analysis');
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Please paste the target job description');
      return;
    }

    setSubmitting(true);
    try {
      const data = await analyzeResumeATS(resumeFile, jobDescription.trim());
      setResult({
        ...data.analysis,
        analysisId: data.analysisId,
      });
      setSelectedHistoryId(data.analysisId);
      toast.success('ATS analysis completed');
      await loadHistory();
    } catch (error) {
      toast.error(error.message || 'Failed to analyze resume');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectHistory = async (analysisId) => {
    setSelectedHistoryId(analysisId);
    try {
      const data = await getResumeATSAnalysis(analysisId);
      setResult(normalizeStoredAnalysis(data.analysis));
    } catch (error) {
      toast.error(error.message || 'Failed to load saved ATS analysis');
    }
  };

  const sortedComponents = useMemo(() => {
    const components = result?.component_scores || {};
    return Object.entries(components);
  }, [result]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] bg-slate-950/95 p-8 text-white shadow-2xl ring-1 ring-white/10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">Separate ATS workspace</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Resume ATS Analyzer</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Upload a dedicated resume for ATS scoring, compare it against a job description, and store the result without changing your main profile resume.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/profile" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Back to Profile
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_1.3fr]">
          <div className="space-y-8">
            <form onSubmit={handleAnalyze} className="rounded-[28px] bg-white/88 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Analyze a new resume</h2>
                  <p className="mt-1 text-sm text-slate-500">Upload a PDF or DOCX resume and paste the exact job description.</p>
                </div>
                <div className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                  ATS only
                </div>
              </div>

              <div className="space-y-5">
                <label className="block rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{resumeFile ? resumeFile.name : 'Choose ATS resume'}</p>
                  <p className="mt-1 text-sm text-slate-500">PDF or DOCX, max 10MB</p>
                </label>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Job description</label>
                  <textarea
                    rows={10}
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    placeholder="Paste the full job description here so the ATS engine can compare required skills, keywords, projects, and experience."
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-900 to-emerald-700 px-5 py-4 text-sm font-bold uppercase tracking-[0.3em] text-white shadow-xl transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Analyzing resume...' : 'Run ATS analysis'}
                </button>
              </div>
            </form>

            <div className="rounded-[28px] bg-white/88 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Saved analyses</h2>
                  <p className="mt-1 text-sm text-slate-500">Open earlier ATS runs stored in MongoDB.</p>
                </div>
              </div>

              {historyLoading ? (
                <div className="py-10 text-center text-sm text-slate-500">Loading ATS history...</div>
              ) : history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
                  No ATS analyses yet. Upload a resume above to create your first one.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleSelectHistory(item._id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedHistoryId === item._id ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.originalFilename}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">{formatDate(item.createdAt)}</p>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-sm font-black ${item.atsScore >= 80 ? 'bg-emerald-100 text-emerald-800' : item.atsScore >= 65 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'}`}>
                          {item.atsScore}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {result ? (
              <>
                <div className="rounded-[28px] bg-slate-950 p-8 text-white shadow-2xl ring-1 ring-white/10">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">Analysis result</p>
                      <h2 className="mt-3 text-3xl font-black">{result.filename || 'Resume analysis'}</h2>
                      <p className="mt-2 max-w-2xl text-sm text-slate-300">
                        {result.summary || 'Use this score and the improvement suggestions below to tailor your ATS resume before applying.'}
                      </p>
                      {result.createdAt ? (
                        <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-400">Stored {formatDate(result.createdAt)}</p>
                      ) : null}
                    </div>
                    <ScoreRing score={result.ats_score} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                  {sortedComponents.map(([key, value]) => (
                    <div key={key} className="rounded-3xl bg-white/88 p-5 shadow-lg ring-1 ring-slate-200/70 backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{componentLabels[key] || key}</p>
                      <p className="mt-3 text-3xl font-black text-slate-900">{Math.round(value)}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-[28px] bg-white/88 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
                    <div className="grid gap-6">
                      <ResultChipList title="Matched skills" items={result.matched_skills} emptyText="No matched skills detected yet." tone="green" />
                      <ResultChipList title="Missing skills" items={result.missing_skills} emptyText="No missing ATS skills found for this description." tone="red" />
                      <ResultChipList title="Matched keywords" items={result.matched_keywords} emptyText="No matching keywords were captured." tone="slate" />
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-white/88 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Experience comparison</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-emerald-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Detected</p>
                        <p className="mt-2 text-3xl font-black text-emerald-900">{result.experience_years || 0}</p>
                        <p className="text-sm text-emerald-700">years in resume</p>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">Required</p>
                        <p className="mt-2 text-3xl font-black text-amber-900">{result.required_years || 0}</p>
                        <p className="text-sm text-amber-700">years in job description</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[28px] bg-white/88 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Improvement suggestions</h3>
                    <div className="mt-5 space-y-3">
                      {(result.improvement_suggestions || []).map((suggestion) => (
                        <div key={suggestion} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-white/88 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Suggestion categories</h3>
                    <div className="mt-5 space-y-5">
                      {Object.entries(result.suggestion_categories || {}).map(([key, items]) => (
                        <div key={key}>
                          <p className="text-sm font-bold capitalize text-slate-900">{key.replaceAll('_', ' ')}</p>
                          {items?.length ? (
                            <ul className="mt-2 space-y-2 text-sm text-slate-600">
                              {items.map((item) => (
                                <li key={item} className="rounded-xl bg-slate-50 px-3 py-3">{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm text-slate-400">No issues detected in this category.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[640px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-xl backdrop-blur">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-xl">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 17v-6m3 6V7m3 10v-3m6 7H3a2 2 0 01-2-2V5a2 2 0 012-2h18a2 2 0 012 2v14a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="mt-6 text-3xl font-black text-slate-900">No ATS result yet</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                    Upload a resume and a job description to get a stored ATS score, missing-skill analysis, and targeted improvement suggestions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeATSAnalyzer;
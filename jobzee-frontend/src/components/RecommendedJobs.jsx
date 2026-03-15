import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaStar,
  FaSpinner,
  FaRobot,
  FaExclamationCircle,
  FaCheckCircle,
  FaSync,
} from 'react-icons/fa';
import { API_BASE_URL } from '../config/api';

// ─── helpers ────────────────────────────────────────────────────────────────

const scoreToPercent = (score) => Math.round(score * 100);

const scoreColor = (pct) => {
  if (pct >= 85) return { bar: 'bg-green-500', badge: 'bg-green-100 text-green-800' };
  if (pct >= 70) return { bar: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-800'  };
  if (pct >= 55) return { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800' };
  return          { bar: 'bg-red-400',          badge: 'bg-red-100 text-red-800'    };
};

const formatSalary = (salary) => {
  if (!salary || (!salary.min && !salary.max)) return null;
  const sym = salary.currency === 'USD' ? '$' : '₹';
  if (salary.min && salary.max)
    return `${sym}${salary.min.toLocaleString()} – ${sym}${salary.max.toLocaleString()}`;
  if (salary.min) return `${sym}${salary.min.toLocaleString()}+`;
  return `Up to ${sym}${salary.max.toLocaleString()}`;
};

// ─── sub-components ─────────────────────────────────────────────────────────

const MatchBar = ({ score }) => {
  const pct = scoreToPercent(score);
  const { bar, badge } = scoreColor(pct);
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-medium">Match Score</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>
          {pct}% Match
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ease-out ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const JobCard = ({ job, isApplied, isApplying, onApply }) => {
  const pct = scoreToPercent(job.score);
  const salary = formatSalary(job.salary);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">{job.title}</h3>
          {job.company && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">{job.company}</p>
          )}
        </div>
        {pct >= 85 && (
          <span className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
            <FaStar className="text-yellow-400" size={10} /> Top Match
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
        {job.location && (
          <span className="flex items-center gap-1">
            <FaMapMarkerAlt size={11} /> {job.location}
          </span>
        )}
        {job.jobType && (
          <span className="flex items-center gap-1">
            <FaBriefcase size={11} /> {job.jobType}
          </span>
        )}
        {salary && (
          <span className="font-medium text-gray-700">{salary}</span>
        )}
      </div>

      {/* Skills */}
      {Array.isArray(job.skills) && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.skills.slice(0, 5).map((skill, i) => (
            <span
              key={i}
              className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span className="text-xs text-gray-400">+{job.skills.length - 5} more</span>
          )}
        </div>
      )}

      {/* Match bar */}
      <MatchBar score={job.score} />

      {/* Apply button */}
      <button
        onClick={() => onApply(job._id)}
        disabled={isApplied || isApplying}
        className={`mt-4 w-full py-2 rounded-xl text-sm font-semibold transition-colors duration-150 flex items-center justify-center gap-2
          ${isApplied
            ? 'bg-green-100 text-green-700 cursor-default'
            : isApplying
            ? 'bg-indigo-300 text-white cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
      >
        {isApplied ? (
          <><FaCheckCircle size={13} /> Applied</>
        ) : isApplying ? (
          <><FaSpinner className="animate-spin" size={13} /> Applying…</>
        ) : (
          'Quick Apply'
        )}
      </button>
    </div>
  );
};

// ─── main component ──────────────────────────────────────────────────────────

const RecommendedJobs = () => {
  const navigate = useNavigate();

  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [appliedJobs, setAppliedJobs]   = useState(new Set());
  const [applyingJobs, setApplyingJobs] = useState(new Set());

  // ── fetch recommendations ────────────────────────────────────────────────
  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    const raw   = localStorage.getItem('user');

    if (!token || !raw) {
      navigate('/login');
      return;
    }

    let userId;
    try {
      userId = JSON.parse(raw)._id || JSON.parse(raw).id;
    } catch {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/jobs/recommendations/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load recommendations');
      }

      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // ── quick apply ──────────────────────────────────────────────────────────
  const handleApply = async (jobId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to apply for jobs');
      return;
    }

    setApplyingJobs((prev) => new Set([...prev, jobId]));

    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/quick-apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Application submitted! 🎉');
        setAppliedJobs((prev) => new Set([...prev, jobId]));
      } else {
        toast.error(
          data.requiresResume
            ? 'Please upload your resume before applying'
            : data.message || 'Failed to apply'
        );
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setApplyingJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  // ── render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
        <FaSpinner className="animate-spin text-indigo-600" size={32} />
        <p className="text-sm">Analysing your resume and finding best matches…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
        <FaExclamationCircle className="text-red-400" size={36} />
        <p className="text-gray-700 font-medium">{error}</p>
        {error.includes('resume') ? (
          <button
            onClick={() => navigate('/profile')}
            className="mt-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl"
          >
            Upload Resume
          </button>
        ) : (
          <button
            onClick={fetchRecommendations}
            className="mt-1 flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl"
          >
            <FaSync size={12} /> Try Again
          </button>
        )}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
        <FaRobot className="text-indigo-300" size={40} />
        <p className="text-gray-600 font-medium">No recommendations yet</p>
        <p className="text-sm text-gray-400">Make sure your resume is uploaded and active jobs exist.</p>
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
            <FaRobot className="text-white" size={17} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recommended Jobs For You</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} matched based on your resume
            </p>
          </div>
        </div>
        <button
          onClick={fetchRecommendations}
          title="Refresh recommendations"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <FaSync size={14} />
        </button>
      </div>

      {/* Job grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            isApplied={appliedJobs.has(job._id)}
            isApplying={applyingJobs.has(job._id)}
            onApply={handleApply}
          />
        ))}
      </div>
    </section>
  );
};

export default RecommendedJobs;

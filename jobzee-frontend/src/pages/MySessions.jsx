import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";
import "../styles/MySessions.css";

const API_URL = `${API_BASE_URL}/api`;

const MySessions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("all"); // all, upcoming, past, completed, cancelled
  const [newLinkAvailable, setNewLinkAvailable] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(Date.now());
  const [showLastRefreshed, setShowLastRefreshed] = useState(false);

  // Initial data load
  useEffect(() => {
    fetchMySessions();
  }, []);

  // Set up auto-refresh for upcoming sessions with no meeting links
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      // Only refresh if it's been at least 1 minute since last refresh
      if (now - lastRefreshedAt >= 60000) {
        // Only refresh if there are scheduled sessions without meeting links
        const hasScheduledWithoutLinks = sessions.some(
          (s) => s.sessionStatus === "scheduled" && !s.meetingLink,
        );

        if (hasScheduledWithoutLinks) {
          console.log("Auto-refreshing sessions to check for meeting links...");
          refreshSessionLinks();
        }
      }
    }, 120000); // Check every 2 minutes

    return () => clearInterval(intervalId);
  }, [sessions, lastRefreshedAt]);

  const refreshSessionLinks = async () => {
    setRefreshing(true);
    setShowLastRefreshed(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setRefreshing(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/sessions/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Check if any session got a new link compared to current sessions
        const currentSessionsWithoutLinks = sessions.filter(
          (s) => s.sessionStatus === "scheduled" && !s.meetingLink,
        );

        const newSessions = response.data.data;
        const newLinksAdded = currentSessionsWithoutLinks.some((oldSession) => {
          const updatedSession = newSessions.find(
            (s) => s._id === oldSession._id,
          );
          return (
            updatedSession &&
            updatedSession.meetingLink &&
            !oldSession.meetingLink
          );
        });

        if (newLinksAdded) {
          setNewLinkAvailable(true);
          toast.info(
            "A mentor has added a meeting link to one of your sessions!",
            {
              autoClose: 10000, // Close after 10 seconds
            },
          );
        }

        setSessions(newSessions);
        setLastRefreshedAt(Date.now());
      }
    } catch (error) {
      console.error("Error refreshing sessions:", error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
        setLastRefreshedAt(Date.now());
      }, 500); // Small delay for better UX
    }
  };

  const fetchMySessions = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to view your sessions");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/sessions/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to cancel this session?")) {
      return;
    }

    const token = localStorage.getItem("token");
    const reason = prompt(
      "Please provide a reason for cancellation (optional):",
    );

    try {
      const response = await axios.patch(
        `${API_URL}/sessions/${sessionId}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Session cancelled successfully");
        fetchMySessions(); // Refresh the list
      }
    } catch (error) {
      console.error("Error cancelling session:", error);
      toast.error(error.response?.data?.message || "Failed to cancel session");
    }
  };

  const handleDownloadInvoice = async (sessionId, e) => {
    e.stopPropagation(); // Prevent card clicks if any
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/session-payments/invoice/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  const getFilteredSessions = () => {
    const now = new Date();

    switch (filter) {
      case "upcoming":
        return sessions
          .filter(
            (s) =>
              new Date(s.scheduledDate) >= now &&
              s.sessionStatus === "scheduled",
          )
          .sort(
            (a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate),
          );
      case "past":
        return sessions
          .filter(
            (s) =>
              new Date(s.scheduledDate) < now &&
              s.sessionStatus !== "cancelled" &&
              s.sessionStatus !== "completed",
          )
          .sort(
            (a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate),
          );
      case "completed":
        return sessions
          .filter((s) => s.sessionStatus === "completed")
          .sort(
            (a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate),
          );
      case "cancelled":
        return sessions
          .filter((s) => s.sessionStatus === "cancelled")
          .sort(
            (a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate),
          );
      default:
        // For "all", we show all sessions sorted by date (upcoming first, then past)
        return [...sessions].sort((a, b) => {
          // Sort scheduled sessions first by date (ascending)
          if (
            a.sessionStatus === "scheduled" &&
            b.sessionStatus === "scheduled"
          ) {
            return new Date(a.scheduledDate) - new Date(b.scheduledDate);
          }
          // Scheduled sessions come before all other types
          if (
            a.sessionStatus === "scheduled" &&
            b.sessionStatus !== "scheduled"
          ) {
            return -1;
          }
          if (
            a.sessionStatus !== "scheduled" &&
            b.sessionStatus === "scheduled"
          ) {
            return 1;
          }
          // For other session types, sort by date descending
          return new Date(b.scheduledDate) - new Date(a.scheduledDate);
        });
    }
  };

  const filteredSessions = getFilteredSessions();

  if (loading) {
    return (
      <div className="my-sessions-page">
        <div className="loading-spinner">Loading your sessions...</div>
      </div>
    );
  }

  return (
    <div className="my-sessions-page">
      <div className="sessions-container">
        <div className="sessions-header">
          <div className="flex items-center flex-wrap mb-2 sm:mb-0">
            <h1>My Sessions</h1>
            {newLinkAvailable && (
              <div className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full animate-pulse flex items-center">
                <svg
                  className="w-4 h-4 mr-1 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                New meeting link(s) available!
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            {showLastRefreshed && (
              <div className="text-white text-xs opacity-80 mr-2">
                Last refreshed: {new Date(lastRefreshedAt).toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                className="btn-secondary flex items-center gap-1"
                onClick={() => {
                  refreshSessionLinks();
                  setNewLinkAvailable(false);
                }}
                disabled={refreshing}
              >
                <svg
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate("/mentors")}
              >
                Book New Session
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Sessions ({sessions.length})
          </button>
          <button
            className={`filter-tab ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`filter-tab ${filter === "past" ? "active" : ""}`}
            onClick={() => setFilter("past")}
          >
            Past
          </button>
          <button
            className={`filter-tab ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
          <button
            className={`filter-tab ${filter === "cancelled" ? "active" : ""}`}
            onClick={() => setFilter("cancelled")}
          >
            Cancelled
          </button>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No sessions found</h3>
            <p>
              {filter === "all"
                ? "You haven't booked any sessions yet"
                : `No ${filter} sessions`}
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate("/mentors")}
            >
              Find a Mentor
            </button>
          </div>
        ) : (
          <div className="sessions-grid">
            {filteredSessions.map((session) => (
              <div key={session._id} className="session-card">
                <div className="session-card-header">
                  <div className="mentor-info">
                    <img
                      src={session.mentorId?.photo || "/default-avatar.png"}
                      alt={session.mentorId?.name}
                      className="mentor-avatar-small"
                    />
                    <div>
                      <h3>{session.mentorId?.name}</h3>
                      <p className="mentor-location">
                        {session.mentorId?.city}, {session.mentorId?.country}
                      </p>
                    </div>
                  </div>
                  <span className={`status-badge ${session.sessionStatus}`}>
                    {session.sessionStatus}
                  </span>
                </div>

                <div className="session-card-body">
                  <div className="session-info-row">
                    <span className="info-icon">📚</span>
                    <span>{session.sessionTypeId?.title}</span>
                  </div>
                  <div className="session-info-row">
                    <span className="info-icon">📅</span>
                    <span>
                      {new Date(session.scheduledDate).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  <div className="session-info-row">
                    <span className="info-icon">⏰</span>
                    <span>{session.scheduledTime}</span>
                  </div>
                  <div className="session-info-row">
                    <span className="info-icon">⏱️</span>
                    <span>{session.duration} minutes</span>
                  </div>
                  <div className="session-info-row">
                    <span className="info-icon">💰</span>
                    <span className="amount-text">
                      {session.amount === 0 ? "FREE" : `₹${session.amount}`}
                    </span>
                  </div>

                  {/* Cancellation Details */}
                  {session.sessionStatus === "cancelled" && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                      <div className="font-semibold mb-1">
                        Cancelled by:{" "}
                        {session.cancelledBy === "mentor" ? "Mentor" : "You"}
                      </div>
                      {session.cancellationReason && (
                        <div>
                          <span className="font-medium">Reason:</span>{" "}
                          {session.cancellationReason}
                        </div>
                      )}
                    </div>
                  )}

                  {session.paymentStatus === "paid" && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "12px",
                      }}
                    >
                      <div
                        className="payment-badge-small"
                        style={{ marginTop: 0 }}
                      >
                        <span className="badge-icon">✓</span>
                        <span>Paid</span>
                      </div>
                      <button
                        onClick={(e) => handleDownloadInvoice(session._id, e)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-2 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                        title="Download Invoice"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Invoice
                      </button>
                    </div>
                  )}
                </div>

                <div className="session-card-footer">
                  <button
                    className="btn-view-details"
                    onClick={() =>
                      navigate(`/employee/sessions/${session._id}`)
                    }
                  >
                    View Details
                  </button>

                  {/* Join Button for Scheduled Sessions */}
                  {session.sessionStatus === "scheduled" &&
                    session.meetingLink &&
                    (() => {
                      const now = new Date();
                      // session.scheduledDate is Date (UTCHours 0). session.scheduledTime is "10:00 AM"
                      // We need to construct the full start Date object

                      const timePart = session.scheduledTime
                        .split("-")[0]
                        .trim();
                      const [timeStr, modifier] = timePart.split(" ");
                      let [hours, minutes] = timeStr.split(":").map(Number);
                      if (modifier === "PM" && hours < 12) hours += 12;
                      if (modifier === "AM" && hours === 12) hours = 0;

                      const sessionStart = new Date(session.scheduledDate);
                      sessionStart.setHours(hours, minutes, 0, 0);

                      const diffMinutes = (sessionStart - now) / 1000 / 60;

                      // Show join button if within 10 minutes or if session already started
                      // (Assuming duration check elsewhere or just generic visibility)
                      const canJoin = diffMinutes <= 10;

                      if (canJoin) {
                        return (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-join"
                            onClick={async (e) => {
                              try {
                                const token = localStorage.getItem("token");
                                await axios.patch(
                                  `${API_URL}/sessions/${session._id}/join`,
                                  {},
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  },
                                );
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          >
                            Join Session
                          </a>
                        );
                      } else {
                        return (
                          <button
                            className="btn-secondary"
                            disabled
                            style={{ opacity: 0.6, cursor: "not-allowed" }}
                            title="Join button activates 10 minutes before session"
                          >
                            Link Added - Join at {session.scheduledTime}
                          </button>
                        );
                      }
                    })()}

                  {/* Handle case where link missing */}
                  {session.sessionStatus === "scheduled" &&
                    !session.meetingLink && (
                      <div className="flex flex-wrap items-center justify-between p-2 bg-blue-50 rounded-md mt-2">
                        <span className="text-sm text-gray-600">
                          Link not yet added by mentor
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshSessionLinks();
                            setNewLinkAvailable(false);
                          }}
                          className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full flex items-center gap-1 hover:bg-blue-700 transition-colors"
                          title="Check for link updates"
                          disabled={refreshing}
                        >
                          {refreshing ? (
                            <>
                              <svg
                                className="w-3 h-3 animate-spin"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              Checking...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              Check now
                            </>
                          )}
                        </button>
                      </div>
                    )}

                  {session.sessionStatus === "scheduled" &&
                    new Date(session.scheduledDate) > new Date() && (
                      <button
                        className="btn-cancel"
                        onClick={() => handleCancelSession(session._id)}
                      >
                        Cancel
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySessions;

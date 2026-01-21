
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const MentorSessions = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("upcoming");
    const [mentor, setMentor] = useState(null);

    // Cancellation State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedSessionForCancel, setSelectedSessionForCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState("");

    const handleCancelClick = (session) => {
        setSelectedSessionForCancel(session);
        setShowCancelModal(true);
    };

    const submitCancellation = async () => {
        if (!selectedSessionForCancel || !cancelReason.trim()) return;

        try {
            const token = localStorage.getItem("mentorToken");
            const sessionId = selectedSessionForCancel.sessionId || selectedSessionForCancel._id;
            const response = await fetch(`${API_BASE_URL}/api/sessions/mentor/sessions/${sessionId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionStatus: "cancelled",
                    cancellationReason: cancelReason
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Session cancelled successfully");
                setShowCancelModal(false);
                setCancelReason("");
                setSelectedSessionForCancel(null);
                fetchSessions(token); // Refresh list
            } else {
                toast.error(data.message || "Failed to cancel session");
            }
        } catch (error) {
            console.error("Error cancelling session:", error);
            toast.error("Failed to cancel session");
        }
    };

    useEffect(() => {
        const mentorData = JSON.parse(localStorage.getItem("mentor") || "{}");
        const token = localStorage.getItem("mentorToken");

        if (!mentorData._id || !token) {
            toast.error("Please login first");
            navigate("/mentor/login");
            return;
        }
        setMentor(mentorData);
        fetchSessions(token);
    }, [navigate]);

    const fetchSessions = async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions/mentor/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSessions(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
            toast.error("Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("mentorToken");
        localStorage.removeItem("mentor");
        navigate("/mentor/login");
    };

    const filteredSessions = sessions.filter(session => {
        if (activeTab === "upcoming") {
            return ["scheduled", "paid"].includes(session.sessionStatus);
        }
        if (activeTab === "completed") {
            return session.sessionStatus === "completed";
        }
        if (activeTab === "cancelled") {
            return ["cancelled", "no-show"].includes(session.sessionStatus);
        }
        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'paid': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Copied/Simplified from Dashboard */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <svg className="w-6 h-6 text-cyan-500" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" />
                            <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" />
                            <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" />
                        </svg>
                        <span className="text-xl font-bold text-gray-900">JOBZEE</span>
                    </div>
                </div>

                <div className="p-6 border-b border-gray-200 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
                        {mentor?.photo ? (
                            <img src={mentor.photo} alt={mentor.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-2xl">{mentor?.name?.charAt(0) || 'M'}</span>
                        )}
                    </div>
                    <h3 className="font-bold text-gray-900">{mentor?.name}</h3>
                    <p className="text-sm text-gray-500">Mentor</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => navigate("/mentor/dashboard")} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        <span className="font-medium">Dashboard</span>
                    </button>

                    <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-cyan-50 text-cyan-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-medium">My Sessions</span>
                    </button>

                    <button onClick={() => navigate("/mentor/availability")} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="font-medium">Availability</span>
                    </button>

                    <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mt-auto">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span className="font-medium">Logout</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
                    <div className="md:hidden">
                        {/* Mobile menu button could go here */}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-gray-50">

                    {/* Tabs */}
                    <div className="flex space-x-1 mb-6 bg-white p-1 rounded-xl shadow-sm w-fit">
                        {['upcoming', 'completed', 'cancelled'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Sessions List */}
                    <div className="grid gap-4">
                        {filteredSessions.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">No {activeTab} sessions found</h3>
                                <p className="text-gray-500">Any {activeTab} sessions will appear here.</p>
                            </div>
                        ) : (
                            filteredSessions.map((session) => (
                                <div key={session._id || session.sessionId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Session Info */}
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
                                                {new Date(session.scheduledDate).getDate()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{session.sessionTypeId?.title || "Mentorship Session"}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                                                    <span className="flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                        {session.userId?.name || "Unknown User"}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {session.scheduledTime} ({session.duration} mins)
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.sessionStatus)}`}>
                                                        {session.sessionStatus.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex items-center gap-3">
                                            {activeTab === 'upcoming' && session.meetingLink && (
                                                <a
                                                    href={session.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                                                >
                                                    Join Meeting
                                                </a>
                                            )}
                                            {activeTab === 'upcoming' && (
                                                <button
                                                    onClick={() => handleCancelClick(session)}
                                                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/mentor/sessions/${session.sessionId}`)}
                                                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </main>
            </div>
            {/* Cancel Session Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Session</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to cancel this session? This action cannot be undone.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for cancellation</label>
                            <textarea
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                rows="3"
                                placeholder="Please provide a reason..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelReason(""); setSelectedSessionForCancel(null); }}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Keep Session
                            </button>
                            <button
                                onClick={submitCancellation}
                                disabled={!cancelReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel Session
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorSessions;

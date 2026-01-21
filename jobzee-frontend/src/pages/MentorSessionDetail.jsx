
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";
import SessionChat from "../components/SessionChat";

const MentorSessionDetail = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Note state
    const [notes, setNotes] = useState("");
    const [evaluation, setEvaluation] = useState("");
    const [meetingLink, setMeetingLink] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("mentorToken");
        if (!token) {
            navigate("/mentor/login");
            return;
        }
        fetchSessionDetails(token);
    }, [sessionId, navigate]);

    const fetchSessionDetails = async (token) => {
        try {
            // sessionId can be the mongo ID or the custom sessionId string. The controller handles both.
            const response = await fetch(`${API_BASE_URL}/api/sessions/mentor/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSession(data.data);
                setNotes(data.data.notes || "");
                setEvaluation(data.data.evaluation || "");
                setMeetingLink(data.data.meetingLink || "");
            } else {
                toast.error(data.message);
                navigate("/mentor/sessions");
            }
        } catch (error) {
            console.error("Error fetching session:", error);
            toast.error("Failed to load session details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (field, value) => {
        setUpdating(true);
        try {
            const token = localStorage.getItem("mentorToken");
            const body = { [field]: value };

            const response = await fetch(`${API_BASE_URL}/api/sessions/mentor/sessions/${sessionId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (data.success) {
                setSession(prev => ({ ...prev, [field]: value }));
                toast.success(`${field} updated successfully`);
            } else {
                toast.error(data.message || "Update failed");
            }

        } catch (error) {
            toast.error("Failed to update session");
        } finally {
            setUpdating(false);
        }
    };

    const handleCompleteSession = async () => {
        if (!window.confirm("Are you sure you want to mark this session as completed?")) return;
        handleUpdate("sessionStatus", "completed");
    };

    const isMockInterview = session?.sessionTypeId?.category === "mock-interview" || session?.sessionTypeId?.title?.toLowerCase().includes("mock");

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
    if (!session) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/mentor/sessions")} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{session.sessionTypeId?.title}</h1>
                        <div className="text-sm text-gray-500">
                            ID: {session.sessionId} • {new Date(session.scheduledDate).toLocaleDateString()} at {session.scheduledTime}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium 
                    ${session.sessionStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            session.sessionStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                        {session.sessionStatus.toUpperCase()}
                    </span>
                    {session.sessionStatus === 'scheduled' && (
                        <button
                            onClick={handleCompleteSession}
                            disabled={updating}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                        >
                            Mark Completed
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Mentee Info & Session Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Mentee Details</h2>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                    {session.userId?.name?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-gray-900">{session.userId?.name}</div>
                                    <div className="text-gray-500 text-sm">{session.userId?.email}</div>
                                    <div className="text-gray-500 text-sm">{session.userId?.country || "Location not set"}</div>
                                </div>
                            </div>
                            {session.userId?.resume && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <a
                                        href={session.userId.resume}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-full px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        View Resume
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Session Info</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Duration</span>
                                    <span className="font-medium">{session.duration} minutes</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Price</span>
                                    <span className="font-medium">{session.currency} {session.amount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Payment Status</span>
                                    <span className={`font-medium ${session.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                                        {session.paymentStatus.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Key Actions */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Meeting Link Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Meeting Details</h2>
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <input
                                    type="text"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                    placeholder="Enter Google Meet / Zoom Link"
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
                                />
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => handleUpdate("meetingLink", meetingLink)}
                                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                                    >
                                        Save Link
                                    </button>
                                    {session.meetingLink && ['scheduled', 'paid'].includes(session.sessionStatus) && (
                                        <a
                                            href={session.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center justify-center cursor-pointer"
                                            onClick={async (e) => {
                                                // Optional: Track join
                                                try {
                                                    const token = localStorage.getItem("mentorToken");
                                                    await fetch(`${API_BASE_URL}/api/sessions/mentor/sessions/${session.sessionId}/join`, {
                                                        method: "PATCH",
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                } catch (err) { }
                                            }}
                                        >
                                            Join
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900">Session Notes</h2>
                                <button onClick={() => handleUpdate('notes', notes)} className="text-sm text-blue-600 font-medium hover:text-blue-800">
                                    Save Notes
                                </button>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Write private notes about this session here... (Only visible to you)"
                            />
                        </div>

                        {/* Evaluation Section (Conditionally Rendered) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900">
                                    {isMockInterview ? "Mock Interview Evaluation" : "Feedback / Summary"}
                                    <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Visible to Mentee</span>
                                </h2>
                                <button onClick={() => handleUpdate('evaluation', evaluation)} className="text-sm text-blue-600 font-medium hover:text-blue-800">
                                    Save Evaluation
                                </button>
                            </div>
                            <div className="mb-2 text-sm text-gray-500">
                                Provide constructive feedback for the mentee.
                            </div>
                            <textarea
                                value={evaluation}
                                onChange={(e) => setEvaluation(e.target.value)}
                                className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder={isMockInterview ? "Rate: Technical Skills, Communication, etc." : "Summary of discussion and next steps..."}
                            />
                        </div>

                    </div>

                    {/* Right Column: Chat */}
                    <div className="lg:col-span-1">
                        <SessionChat sessionId={session._id} currentUserType="mentor" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorSessionDetail;

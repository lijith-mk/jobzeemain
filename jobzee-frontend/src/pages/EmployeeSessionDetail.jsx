import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/BookingConfirmation.css";
import SessionChat from "../components/SessionChat";
import API_BASE_URL from "../config/api";

const EmployeeSessionDetail = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        fetchSessionDetails();
    }, [sessionId]);

    const fetchSessionDetails = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login to view session details");
            navigate("/login");
            return;
        }

        try {
            // Using existing endpoint that returns user session view
            const response = await axios.get(`${API_BASE_URL}/api/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setSession(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching session:", error);
            toast.error("Failed to load session details");
            navigate("/my-sessions");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/api/session-payments/invoice/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${sessionId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error("Failed to download invoice");
        }
    };

    if (loading) {
        return (
            <div className="confirmation-page">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    if (!session) return null;

    const isFree = session.amount === 0;
    const isPaid = session.paymentStatus === "paid";

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <button onClick={() => navigate("/my-sessions")} className="flex items-center text-gray-600 hover:text-gray-900">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to My Sessions
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Session Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900">Session Information</h2>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${session.sessionStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                    session.sessionStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {session.sessionStatus.toUpperCase()}
                                </span>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={session.mentorId?.photo || "/default-avatar.png"}
                                        alt={session.mentorId?.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <div className="text-sm text-gray-500">Mentor</div>
                                        <div className="font-semibold text-gray-900">{session.mentorId?.name}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <div className="text-sm text-gray-500">Topic</div>
                                        <div className="font-medium">{session.sessionTypeId?.title}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Date</div>
                                        <div className="font-medium">
                                            {new Date(session.scheduledDate).toLocaleDateString("en-US", {
                                                month: "short", day: "numeric", year: "numeric", weekday: "short"
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Time</div>
                                        <div className="font-medium">{session.scheduledTime}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Duration</div>
                                        <div className="font-medium">{session.duration} mins</div>
                                    </div>
                                </div>

                                {isPaid && (
                                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <div>
                                            <div className="text-sm text-gray-500">Payment Status</div>
                                            <div className="font-medium text-green-600 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                Paid
                                            </div>
                                        </div>
                                        <button onClick={handleDownloadInvoice} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                                            Download Invoice
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Join Button Area */}
                            {session.sessionStatus === "scheduled" && (
                                <div className="p-6 bg-gray-50 border-t border-gray-100">
                                    {session.meetingLink ? (
                                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer"
                                            className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-sm">
                                            Join Meeting
                                        </a>
                                    ) : (
                                        <div className="text-center text-gray-500 bg-gray-100 py-3 rounded-lg border border-dashed border-gray-300">
                                            Meeting link will be shared by mentor soon
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Evaluation / Feedback from Mentor */}
                        {session.evaluation && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h2 className="text-lg font-bold text-gray-900">Mentor Feedback</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-700 whitespace-pre-wrap">{session.evaluation}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Chat */}
                    <div className="space-y-6">
                        <SessionChat sessionId={session._id} currentUserType="user" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeSessionDetail;

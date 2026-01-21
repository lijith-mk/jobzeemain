import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/BookingConfirmation.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const API_URL = API_BASE.replace(/\/$/, "").endsWith("/api")
    ? API_BASE.replace(/\/$/, "")
    : `${API_BASE.replace(/\/$/, "")}/api`;

const BookingConfirmation = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Get session from navigation state or fetch it
        if (location.state?.session) {
            setSession(location.state.session);
            setLoading(false);
        } else {
            fetchSessionDetails();
        }
    }, [sessionId]);

    const fetchSessionDetails = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login to view session details");
            navigate("/login");
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setSession(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching session:", error);
            toast.error("Failed to load session details");
            navigate("/mentors");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/session-payments/invoice/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob', // Important for PDF
            });

            // Create blob link to download
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

    const handleViewSessions = () => {
        navigate("/my-sessions");
    };

    const handleBackToMentors = () => {
        navigate("/mentors");
    };

    if (loading) {
        return (
            <div className="confirmation-page">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="confirmation-page">
                <div className="error-message">Session not found</div>
            </div>
        );
    }

    const isFree = session.amount === 0;
    const isPaid = session.paymentStatus === "paid";

    return (
        <div className="confirmation-page">
            <div className="confirmation-container">
                {/* Success Icon */}
                <div className="success-animation">
                    <div className="checkmark-circle">
                        <div className="checkmark"></div>
                    </div>
                </div>

                {/* Success Message */}
                <h1 className="confirmation-title">Booking Confirmed! 🎉</h1>
                <p className="confirmation-subtitle">
                    Your session has been successfully {isFree ? "booked" : "booked and paid"}
                </p>

                {/* Session Details Card */}
                <div className="session-details-card">
                    <div className="card-header">
                        <h3>Session Details</h3>
                        <span className={`status-badge ${session.sessionStatus}`}>
                            {session.sessionStatus}
                        </span>
                    </div>

                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-icon">👤</span>
                            <div className="detail-content">
                                <span className="detail-label">Mentor</span>
                                <strong className="detail-value">{session.mentorId?.name}</strong>
                            </div>
                        </div>

                        <div className="detail-item">
                            <span className="detail-icon">📚</span>
                            <div className="detail-content">
                                <span className="detail-label">Session Type</span>
                                <strong className="detail-value">{session.sessionTypeId?.title}</strong>
                            </div>
                        </div>

                        <div className="detail-item">
                            <span className="detail-icon">📅</span>
                            <div className="detail-content">
                                <span className="detail-label">Date</span>
                                <strong className="detail-value">
                                    {new Date(session.scheduledDate).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </strong>
                            </div>
                        </div>

                        <div className="detail-item">
                            <span className="detail-icon">⏰</span>
                            <div className="detail-content">
                                <span className="detail-label">Time</span>
                                <strong className="detail-value">{session.scheduledTime}</strong>
                            </div>
                        </div>

                        <div className="detail-item">
                            <span className="detail-icon">⏱️</span>
                            <div className="detail-content">
                                <span className="detail-label">Duration</span>
                                <strong className="detail-value">{session.duration} minutes</strong>
                            </div>
                        </div>

                        <div className="detail-item">
                            <span className="detail-icon">💰</span>
                            <div className="detail-content">
                                <span className="detail-label">Amount</span>
                                <strong className="detail-value amount-highlight">
                                    {isFree ? "FREE" : `₹${session.amount}`}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* Session ID */}
                    <div className="session-id-section">
                        <span className="session-id-label">Session ID:</span>
                        <code className="session-id-code">{session.sessionId}</code>
                    </div>

                    {/* Payment Info for Paid Sessions */}
                    {isPaid && session.paymentId && (
                        <div className="payment-info-section">
                            <div className="payment-success-badge">
                                <span className="badge-icon">✓</span>
                                <span>Payment Successful</span>
                            </div>
                            <div className="payment-details-row">
                                <div className="payment-id">
                                    <span>Payment ID:</span>
                                    <code>{session.paymentId}</code>
                                </div>
                                <button
                                    onClick={handleDownloadInvoice}
                                    className="btn-download-invoice"
                                >
                                    <span>📄</span> Download Invoice
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {session.notes && (
                        <div className="notes-section">
                            <h4>Your Notes:</h4>
                            <p className="notes-text">{session.notes}</p>
                        </div>
                    )}
                </div>

                {/* Next Steps */}
                <div className="next-steps-card">
                    <h3>What's Next?</h3>
                    <ul className="steps-list">
                        <li>
                            <span className="step-icon">📧</span>
                            <span>You'll receive a confirmation email with session details</span>
                        </li>
                        <li>
                            <span className="step-icon">🔗</span>
                            <span>Meeting link will be shared 15 minutes before the session</span>
                        </li>
                        <li>
                            <span className="step-icon">📝</span>
                            <span>Prepare any questions or topics you'd like to discuss</span>
                        </li>
                        <li>
                            <span className="step-icon">⏰</span>
                            <span>Join the session on time for the best experience</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button className="btn-secondary" onClick={handleBackToMentors}>
                        Browse More Mentors
                    </button>
                    <button className="btn-secondary" onClick={handleViewSessions}>
                        View My Sessions
                    </button>

                    {/* Join Button Logic */}
                    {session.sessionStatus === "scheduled" && session.meetingLink && (
                        (() => {
                            const now = new Date();
                            const timePart = session.scheduledTime.split("-")[0].trim();
                            const [timeStr, modifier] = timePart.split(" ");
                            let [hours, minutes] = timeStr.split(":").map(Number);
                            if (modifier === "PM" && hours < 12) hours += 12;
                            if (modifier === "AM" && hours === 12) hours = 0;

                            const sessionStart = new Date(session.scheduledDate);
                            sessionStart.setHours(hours, minutes, 0, 0);

                            const diffMinutes = (sessionStart - now) / 1000 / 60;
                            const canJoin = diffMinutes <= 10;

                            if (canJoin) {
                                return (
                                    <a
                                        href={session.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary btn-join-large"
                                        onClick={async () => {
                                            try {
                                                const token = localStorage.getItem("token");
                                                await axios.patch(`${API_URL}/sessions/${session._id}/join`, {}, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                            } catch (err) { console.error(err) }
                                        }}
                                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <span>🎥</span> Join Session
                                    </a>
                                );
                            } else {
                                return (
                                    <button
                                        className="btn-secondary"
                                        disabled
                                        style={{ opacity: 0.7, cursor: 'not-allowed', background: '#f3f4f6', borderColor: '#e5e7eb' }}
                                        title={`Join button activates 10 minutes before ${session.scheduledTime}`}
                                    >
                                        Join (Starts at {session.scheduledTime})
                                    </button>
                                );
                            }
                        })()
                    )}
                </div>

                {/* Support Note */}
                <div className="support-note">
                    <p>
                        Need help? Contact us at{" "}
                        <a href="mailto:support@jobzee.com">support@jobzee.com</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BookingConfirmation;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/PaymentPage.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const API_URL = API_BASE.replace(/\/$/, "").endsWith("/api")
    ? API_BASE.replace(/\/$/, "")
    : `${API_BASE.replace(/\/$/, "")}/api`;

// Load Razorpay script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const PaymentPage = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [session, setSession] = useState(null);
    const [paymentOrder, setPaymentOrder] = useState(null);

    useEffect(() => {
        // Get session from navigation state or fetch it
        if (location.state?.session) {
            setSession(location.state.session);
            createPaymentOrder(location.state.session);
        } else {
            fetchSessionDetails();
        }
    }, [sessionId]);

    const fetchSessionDetails = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login to continue");
            navigate("/login");
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                const sessionData = response.data.data;
                setSession(sessionData);

                // Check if payment is already completed
                if (sessionData.paymentStatus === "paid") {
                    toast.info("Payment already completed");
                    navigate(`/sessions/${sessionId}/confirmation`, {
                        state: { session: sessionData },
                    });
                    return;
                }

                // Check if it's a free session
                if (sessionData.amount === 0) {
                    toast.info("This is a free session");
                    navigate(`/sessions/${sessionId}/confirmation`, {
                        state: { session: sessionData },
                    });
                    return;
                }

                createPaymentOrder(sessionData);
            }
        } catch (error) {
            console.error("Error fetching session:", error);
            toast.error("Failed to load session details");
            navigate("/mentors");
        }
    };

    const createPaymentOrder = async (sessionData) => {
        const token = localStorage.getItem("token");

        try {
            const response = await axios.post(
                `${API_URL}/session-payments/create`,
                { sessionId: sessionData._id || sessionData.sessionId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setPaymentOrder(response.data.data);
            }
        } catch (error) {
            console.error("Error creating payment order:", error);
            toast.error("Failed to create payment order");
        } finally {
            setLoading(false);
        }
    };

    const handleRazorpayPayment = async () => {
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            toast.error("Failed to load Razorpay. Please try again.");
            return;
        }

        setProcessing(true);
        const token = localStorage.getItem("token");

        // Get user details for prefill
        let userDetails = {};
        try {
            const userResponse = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (userResponse.data.success) {
                userDetails = {
                    name: userResponse.data.user.name,
                    email: userResponse.data.user.email,
                    contact: userResponse.data.user.phone || "",
                };
            }
        } catch (error) {
            console.log("Could not fetch user details for prefill");
        }

        const options = {
            key: paymentOrder.razorpayKeyId,
            amount: paymentOrder.amount * 100, // Amount in paise
            currency: paymentOrder.currency,
            name: "JobZee - Mentor Session",
            description: paymentOrder.sessionTitle,
            order_id: paymentOrder.orderId,
            prefill: userDetails,
            theme: {
                color: "#667eea",
            },
            handler: async function (response) {
                try {
                    // Verify payment with backend
                    const verifyResponse = await axios.post(
                        `${API_URL}/session-payments/verify`,
                        {
                            sessionId: session._id || session.sessionId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (verifyResponse.data.success) {
                        toast.success("Payment successful!");
                        navigate(`/sessions/${sessionId}/confirmation`, {
                            state: { session: verifyResponse.data.data.session },
                        });
                    }
                } catch (error) {
                    console.error("Error verifying payment:", error);
                    toast.error(error.response?.data?.message || "Payment verification failed");
                } finally {
                    setProcessing(false);
                }
            },
            modal: {
                ondismiss: function () {
                    setProcessing(false);
                    toast.info("Payment cancelled");
                },
            },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
    };

    if (loading) {
        return (
            <div className="payment-page">
                <div className="loading-spinner">Loading payment details...</div>
            </div>
        );
    }

    if (!session || !paymentOrder) {
        return (
            <div className="payment-page">
                <div className="error-message">Unable to load payment details</div>
            </div>
        );
    }

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="payment-header">
                    <h1>Complete Payment</h1>
                    <p className="payment-subtitle">Secure your session with {session.mentorId?.name}</p>
                </div>

                <div className="payment-content">
                    {/* Session Summary */}
                    <div className="session-summary-card">
                        <h3>Session Details</h3>
                        <div className="summary-row">
                            <span>Mentor:</span>
                            <strong>{session.mentorId?.name}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Session Type:</span>
                            <strong>{session.sessionTypeId?.title}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Duration:</span>
                            <strong>{session.duration} minutes</strong>
                        </div>
                        <div className="summary-row">
                            <span>Date:</span>
                            <strong>
                                {new Date(session.scheduledDate).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </strong>
                        </div>
                        <div className="summary-row">
                            <span>Time:</span>
                            <strong>{session.scheduledTime}</strong>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-row total-row">
                            <span>Total Amount:</span>
                            <strong className="amount-large">
                                ₹{session.amount} {session.currency}
                            </strong>
                        </div>
                    </div>

                    {/* Payment Card */}
                    <div className="payment-card">
                        <div className="payment-mode-badge">
                            <span className="badge-icon">🔒</span>
                            <span>Secure Payment via Razorpay</span>
                        </div>

                        <div className="payment-info" style={{ background: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
                            <p className="info-text" style={{ color: '#2e7d32' }}>
                                Your payment is <strong>100% secure</strong> and encrypted.
                            </p>
                            <p className="info-text" style={{ color: '#2e7d32' }}>Powered by Razorpay - India's leading payment gateway.</p>
                        </div>

                        <div className="payment-order-info">
                            <div className="order-detail">
                                <span>Order ID:</span>
                                <code>{paymentOrder.orderId}</code>
                            </div>
                            <div className="order-detail">
                                <span>Amount:</span>
                                <strong>₹{paymentOrder.amount}</strong>
                            </div>
                        </div>

                        <button
                            className="btn-razorpay-payment"
                            onClick={handleRazorpayPayment}
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <span className="spinner"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span className="payment-icon">💳</span>
                                    Pay with Razorpay
                                </>
                            )}
                        </button>

                        <div className="payment-methods-info">
                            <p className="methods-title">Accepted Payment Methods:</p>
                            <div className="methods-icons">
                                <span>💳 Credit/Debit Cards</span>
                                <span>🏦 Net Banking</span>
                                <span>📱 UPI</span>
                                <span>💰 Wallets</span>
                            </div>
                        </div>

                        <div className="payment-footer">
                            <p className="footer-note">
                                By proceeding, you agree to our terms and conditions.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="payment-security-note">
                    <span className="security-icon">🛡️</span>
                    <span>Your payment information is secure and encrypted with 256-bit SSL</span>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;

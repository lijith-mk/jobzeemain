import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/BookingPage.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const API_URL = API_BASE.replace(/\/$/, "").endsWith("/api")
    ? API_BASE.replace(/\/$/, "")
    : `${API_BASE.replace(/\/$/, "")}/api`;

const BookingPage = () => {
    const { mentorId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [mentor, setMentor] = useState(null);
    const [sessionTypes, setSessionTypes] = useState([]);
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [selectedSessionType, setSelectedSessionType] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [notes, setNotes] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);

    useEffect(() => {
        fetchMentorDetails();
        fetchSessionTypes();
    }, [mentorId]);

    useEffect(() => {
        if (selectedDate && mentor) {
            calculateAvailableSlots();
        }
    }, [selectedDate, mentor]);

    const fetchMentorDetails = async () => {
        try {
            const response = await axios.get(`${API_URL}/mentors/${mentorId}`);
            if (response.data.success) {
                setMentor(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching mentor:", error);
            toast.error("Failed to load mentor details");
        }
    };

    const fetchSessionTypes = async () => {
        try {
            const response = await axios.get(`${API_URL}/mentor-sessions/public/${mentorId}`);
            if (response.data.success) {
                setSessionTypes(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching session types:", error);
            toast.error("Failed to load session types");
        } finally {
            setLoading(false);
        }
    };

    const calculateAvailableSlots = async () => {
        if (!selectedDate || !mentor?.availability) {
            setAvailableSlots([]);
            return;
        }

        const date = new Date(selectedDate);
        const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });

        const dayAvailability = mentor.availability.find((avail) => avail.day === dayOfWeek);

        if (dayAvailability && dayAvailability.slots) {
            try {
                // Fetch booked slots for this date
                const response = await axios.get(`${API_URL}/sessions/availability`, {
                    params: {
                        mentorId,
                        date: selectedDate
                    }
                });

                if (response.data.success) {
                    const bookedSlots = response.data.bookedSlots || [];
                    const filteredSlots = dayAvailability.slots.filter(
                        (slot) => !bookedSlots.includes(slot)
                    );
                    setAvailableSlots(filteredSlots);
                } else {
                    // Fallback to all slots if check fails, but ideally should warn
                    setAvailableSlots(dayAvailability.slots);
                }
            } catch (error) {
                console.error("Error checking availability:", error);
                // Fallback to all slots or show error? 
                // Better to show all slots and let server reject if booked
                setAvailableSlots(dayAvailability.slots);
            }
        } else {
            setAvailableSlots([]);
        }
    };

    const handleSessionTypeSelect = (sessionType) => {
        setSelectedSessionType(sessionType);
        setCurrentStep(2);
    };

    const handleDateSelect = () => {
        if (!selectedDate) {
            toast.error("Please select a date");
            return;
        }
        setCurrentStep(3);
    };

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
        setCurrentStep(4);
    };

    const handleBooking = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login to book a session");
            navigate("/login");
            return;
        }

        try {
            const bookingData = {
                mentorId,
                sessionTypeId: selectedSessionType._id,
                scheduledDate: selectedDate,
                scheduledTime: selectedTime,
                notes,
            };

            const response = await axios.post(`${API_URL}/sessions/book`, bookingData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                const session = response.data.data;

                if (response.data.requiresPayment) {
                    // Redirect to payment page for paid sessions
                    navigate(`/sessions/${session._id}/payment`, {
                        state: { session },
                    });
                } else {
                    // Free session - go directly to confirmation
                    toast.success("Session booked successfully!");
                    navigate(`/sessions/${session._id}/confirmation`, {
                        state: { session },
                    });
                }
            }
        } catch (error) {
            console.error("Error booking session:", error);
            toast.error(error.response?.data?.message || "Failed to book session");
        }
    };

    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 60); // 60 days from now
        return maxDate.toISOString().split("T")[0];
    };

    if (loading) {
        return (
            <div className="booking-page">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="booking-page">
            <div className="booking-container">
                {/* Progress Steps */}
                <div className="booking-steps">
                    <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
                        <div className="step-number">1</div>
                        <div className="step-label">Session Type</div>
                    </div>
                    <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
                        <div className="step-number">2</div>
                        <div className="step-label">Select Date</div>
                    </div>
                    <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
                        <div className="step-number">3</div>
                        <div className="step-label">Select Time</div>
                    </div>
                    <div className={`step ${currentStep >= 4 ? "active" : ""}`}>
                        <div className="step-number">4</div>
                        <div className="step-label">Confirm</div>
                    </div>
                </div>

                {/* Mentor Info */}
                {mentor && (
                    <div className="mentor-info-card">
                        <img
                            src={mentor.photo || "/default-avatar.png"}
                            alt={mentor.name}
                            className="mentor-avatar"
                        />
                        <div className="mentor-details">
                            <h2>{mentor.name}</h2>
                            <p>
                                {mentor.city}, {mentor.country}
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 1: Select Session Type */}
                {currentStep === 1 && (
                    <div className="booking-step">
                        <h3>Select Session Type</h3>
                        <div className="session-types-grid">
                            {sessionTypes.map((sessionType) => (
                                <div
                                    key={sessionType._id}
                                    className="session-type-card"
                                    onClick={() => handleSessionTypeSelect(sessionType)}
                                >
                                    <h4>{sessionType.title}</h4>
                                    <p className="session-duration">{sessionType.duration} minutes</p>
                                    <p className="session-description">{sessionType.description}</p>
                                    <div className="session-price">
                                        {sessionType.price === 0 ? (
                                            <span className="free-badge">FREE</span>
                                        ) : (
                                            <span className="price-tag">
                                                ₹{sessionType.price}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Select Date */}
                {currentStep === 2 && (
                    <div className="booking-step">
                        <h3>Select Date</h3>
                        <div className="selected-session-info">
                            <strong>{selectedSessionType?.title}</strong> - {selectedSessionType?.duration} min
                        </div>

                        <div className="date-selection-container">
                            <p className="section-label">Available Dates (Next 30 Days)</p>

                            {(() => {
                                const validDates = [];
                                if (mentor?.availability) {
                                    const availableDays = mentor.availability.map(a => a.day);
                                    const today = new Date();
                                    for (let i = 1; i <= 30; i++) {
                                        const nextDate = new Date(today);
                                        nextDate.setDate(today.getDate() + i);
                                        const dayName = nextDate.toLocaleDateString("en-US", { weekday: "long" });

                                        if (availableDays.includes(dayName)) {
                                            validDates.push({
                                                dateObj: nextDate,
                                                dateString: nextDate.toISOString().split("T")[0],
                                                dayName: dayName,
                                                formattedDate: nextDate.toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric"
                                                })
                                            });
                                        }
                                    }
                                }

                                if (validDates.length === 0) {
                                    return (
                                        <div className="no-dates-message">
                                            <p>No available dates found for this mentor.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="dates-grid">
                                        {validDates.map((dateItem) => (
                                            <button
                                                key={dateItem.dateString}
                                                className={`date-card ${selectedDate === dateItem.dateString ? "selected" : ""}`}
                                                onClick={() => {
                                                    setSelectedDate(dateItem.dateString);
                                                    // Optional: auto-advance or let user click continue
                                                }}
                                            >
                                                <span className="date-card-day">{dateItem.dayName.substring(0, 3)}</span>
                                                <span className="date-card-date">{dateItem.formattedDate}</span>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={() => setCurrentStep(1)}>
                                Back
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleDateSelect}
                                disabled={!selectedDate}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Select Time */}
                {currentStep === 3 && (
                    <div className="booking-step">
                        <h3>Select Time Slot</h3>
                        <div className="selected-session-info">
                            <strong>{selectedSessionType?.title}</strong> on{" "}
                            {new Date(selectedDate).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </div>
                        {availableSlots.length > 0 ? (
                            <div className="time-slots-grid">
                                {availableSlots.map((slot, index) => (
                                    <button
                                        key={index}
                                        className={`time-slot ${selectedTime === slot ? "selected" : ""}`}
                                        onClick={() => handleTimeSelect(slot)}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="no-slots-message">
                                No available slots for this date. Please select another date.
                            </p>
                        )}
                        <div className="step-actions">
                            <button className="btn-secondary" onClick={() => setCurrentStep(2)}>
                                Back
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Confirm Booking */}
                {currentStep === 4 && (
                    <div className="booking-step">
                        <h3>Confirm Booking</h3>
                        <div className="booking-summary">
                            <div className="summary-item">
                                <span>Session Type:</span>
                                <strong>{selectedSessionType?.title}</strong>
                            </div>
                            <div className="summary-item">
                                <span>Duration:</span>
                                <strong>{selectedSessionType?.duration} minutes</strong>
                            </div>
                            <div className="summary-item">
                                <span>Date:</span>
                                <strong>
                                    {new Date(selectedDate).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </strong>
                            </div>
                            <div className="summary-item">
                                <span>Time:</span>
                                <strong>{selectedTime}</strong>
                            </div>
                            <div className="summary-item">
                                <span>Amount:</span>
                                <strong className="amount-highlight">
                                    {selectedSessionType?.price === 0 ? "FREE" : `₹${selectedSessionType?.price}`}
                                </strong>
                            </div>
                        </div>

                        <div className="notes-section">
                            <label>Additional Notes (Optional)</label>
                            <textarea
                                className="notes-input"
                                placeholder="Any specific topics or questions you'd like to discuss..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows="4"
                            />
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={() => setCurrentStep(3)}>
                                Back
                            </button>
                            <button className="btn-primary btn-large" onClick={handleBooking}>
                                {selectedSessionType?.price === 0 ? "Confirm Booking" : "Proceed to Payment"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;

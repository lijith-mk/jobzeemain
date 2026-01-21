import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const MentorAvailability = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [timezone, setTimezone] = useState("Asia/Kolkata");
    const [selectedDays, setSelectedDays] = useState({});
    const [daySlots, setDaySlots] = useState({});

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Predefined time slots (24-hour format)
    const timeSlots = [
        "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00",
        "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00",
        "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00"
    ];

    const timezones = [
        "Asia/Kolkata",
        "America/New_York",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Paris",
        "Asia/Tokyo",
        "Australia/Sydney",
        "Asia/Dubai",
        "Asia/Singapore"
    ];

    useEffect(() => {
        const token = localStorage.getItem("mentorToken");
        if (!token) {
            toast.error("Please login first");
            navigate("/mentor/login");
            return;
        }
        fetchAvailability(token);
    }, [navigate]);

    const fetchAvailability = async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/mentors/availability`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTimezone(data.timezone || "Asia/Kolkata");

                // Parse existing availability
                const days = {};
                const slots = {};

                if (data.availability && data.availability.length > 0) {
                    data.availability.forEach(item => {
                        days[item.day] = true;
                        slots[item.day] = item.slots || [];
                    });
                }

                setSelectedDays(days);
                setDaySlots(slots);
            } else {
                const error = await response.json();
                toast.error(error.message || "Failed to load availability");
            }
        } catch (error) {
            console.error("Error fetching availability:", error);
            toast.error("Failed to load availability");
        } finally {
            setLoading(false);
        }
    };

    const handleDayToggle = (day) => {
        setSelectedDays(prev => {
            const newSelected = { ...prev };
            if (newSelected[day]) {
                delete newSelected[day];
                // Also clear slots for this day
                setDaySlots(prevSlots => {
                    const newSlots = { ...prevSlots };
                    delete newSlots[day];
                    return newSlots;
                });
            } else {
                newSelected[day] = true;
                // Initialize empty slots array
                setDaySlots(prevSlots => ({
                    ...prevSlots,
                    [day]: []
                }));
            }
            return newSelected;
        });
    };

    const handleSlotToggle = (day, slot) => {
        setDaySlots(prev => {
            const currentSlots = prev[day] || [];
            const newSlots = currentSlots.includes(slot)
                ? currentSlots.filter(s => s !== slot)
                : [...currentSlots, slot];

            return {
                ...prev,
                [day]: newSlots
            };
        });
    };

    const handleSave = async () => {
        // Validate that at least one day is selected
        if (Object.keys(selectedDays).length === 0) {
            toast.warning("Please select at least one day");
            return;
        }

        // Build availability array
        const availability = Object.keys(selectedDays).map(day => ({
            day,
            slots: daySlots[day] || []
        }));

        setSaving(true);
        try {
            const token = localStorage.getItem("mentorToken");
            const response = await fetch(`${API_BASE_URL}/api/mentors/availability`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    availability,
                    timezone
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Availability updated successfully!");
            } else {
                toast.error(data.message || "Failed to update availability");
            }
        } catch (error) {
            console.error("Error saving availability:", error);
            toast.error("Failed to save availability");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading availability...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/mentor/dashboard")}
                        className="group flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-300 mb-4"
                    >
                        <svg
                            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        <span className="font-medium">Back to Dashboard</span>
                    </button>

                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent mb-2">
                        Availability Setup
                    </h1>
                    <p className="text-gray-600">
                        Set your weekly availability to help mentees book sessions with you
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        {/* Timezone Selection */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Timezone
                            </label>
                            <select
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                {timezones.map(tz => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>

                        {/* Days Selection */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Available Days
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {daysOfWeek.map(day => (
                                    <button
                                        key={day}
                                        onClick={() => handleDayToggle(day)}
                                        className={`px-4 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${selectedDays[day]
                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Slots for Selected Days */}
                        {Object.keys(selectedDays).length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Select Time Slots
                                </h3>

                                {Object.keys(selectedDays).sort((a, b) =>
                                    daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b)
                                ).map(day => (
                                    <div key={day} className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                            {day}
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                            {timeSlots.map(slot => (
                                                <button
                                                    key={slot}
                                                    onClick={() => handleSlotToggle(day, slot)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${(daySlots[day] || []).includes(slot)
                                                            ? "bg-blue-600 text-white shadow-md"
                                                            : "bg-white border border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                        {(!daySlots[day] || daySlots[day].length === 0) && (
                                            <p className="text-sm text-gray-500 mt-3 italic">No slots selected for this day</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="mt-8 flex justify-end space-x-4">
                            <button
                                onClick={() => navigate("/mentor/dashboard")}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Save Availability</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                        <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="font-bold text-blue-900 mb-1">How it works</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Select the days you're available for mentoring sessions</li>
                                <li>• Choose specific time slots for each selected day</li>
                                <li>• Your availability will be displayed to mentees on your profile</li>
                                <li>• You can update your availability anytime</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorAvailability;

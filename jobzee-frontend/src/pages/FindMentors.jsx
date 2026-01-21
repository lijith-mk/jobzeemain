import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";
import sessionManager from "../utils/sessionManager";

const FindMentors = () => {
    const navigate = useNavigate();
    const [mentors, setMentors] = useState([]);
    const [recommendedMentors, setRecommendedMentors] = useState([]);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [recommendationMessage, setRecommendationMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIndustry, setSelectedIndustry] = useState("All");
    const [showFreeOnly, setShowFreeOnly] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showInvoicesModal, setShowInvoicesModal] = useState(false);
    const [mySessions, setMySessions] = useState([]);

    useEffect(() => {
        setIsLoggedIn(sessionManager.isLoggedIn());
        fetchMentors();
        if (sessionManager.isLoggedIn()) {
            fetchMySessions();
            fetchRecommendedMentors();
        }
    }, []);

    const fetchMySessions = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const response = await fetch(`${API_BASE_URL}/api/sessions/my-bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMySessions(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    };

    const handleDownloadInvoice = async (sessionId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/session-payments/invoice/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `invoice-${sessionId}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
            } else {
                toast.error("Failed to download invoice");
            }
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error("Failed to download invoice");
        }
    };


    const fetchMentors = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/mentor-applications/public`,
            );
            if (response.ok) {
                const data = await response.json();
                setMentors(data);
            } else {
                toast.error("Failed to fetch mentors");
            }
        } catch (error) {
            console.error("Error fetching mentors:", error);
            toast.error("Error loading mentors");
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendedMentors = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/mentors/recommended`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.length > 0) {
                    setRecommendedMentors(data.data);
                    setShowRecommendations(true);
                    setRecommendationMessage(data.message || "Personalized recommendations for you");
                }
            }
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            // Silently fail - recommendations are optional
        }
    };

    const industries = ["All", ...new Set(mentors.map((m) => m.industry))];

    const filteredMentors = mentors.filter((mentor) => {
        const matchesSearch =
            mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mentor.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mentor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mentor.skills.some((skill) =>
                skill.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        const matchesIndustry =
            selectedIndustry === "All" || mentor.industry === selectedIndustry;
        const matchesType = !showFreeOnly || (mentor.price === "Free" || mentor.price?.toLowerCase().includes("free"));

        return matchesSearch && matchesIndustry && matchesType;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modern Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white overflow-hidden pb-32">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-200 text-sm font-medium mb-6 animate-fade-in-up">
                        🚀 Accelerate Your Career
                    </span>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 animate-fade-in-up animation-delay-100">
                        Master Your Craft with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                            World-Class Mentors
                        </span>
                    </h1>
                    <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200">
                        Connect with industry leaders from top companies who can guide your path
                        and help you achieve your professional goals faster.
                    </p>

                    {/* My Sessions Action */}
                    {isLoggedIn && (
                        <div className="mb-8 flex justify-center gap-4 animate-fade-in-up animation-delay-300">
                            <Link
                                to="/my-sessions"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                View My Sessions
                            </Link>

                            <Link
                                to="/messages"
                                className="inline-flex items-center px-6 py-3 border border-white/30 text-base font-medium rounded-full shadow-sm text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm focus:outline-none transition-all duration-300 transform hover:scale-105"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Messages
                            </Link>

                            <button
                                onClick={() => setShowInvoicesModal(true)}
                                className="inline-flex items-center px-6 py-3 border border-white/30 text-base font-medium rounded-full shadow-sm text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm focus:outline-none transition-all duration-300 transform hover:scale-105"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Invoices
                            </button>
                        </div>
                    )}

                    {/* Search and Filter Container - Floated */}
                    <div className="max-w-4xl mx-auto transform translate-y-8 animate-fade-in-up animation-delay-300">
                        <div className="bg-white rounded-2xl shadow-xl p-2 md:p-3 flex flex-col md:flex-row gap-2">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                                    placeholder="Search by name, role, company, or skills..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 px-2 md:px-0">
                                {/* Simplified Industry Filter for cleaner look */}
                                <select
                                    value={selectedIndustry}
                                    onChange={(e) => setSelectedIndustry(e.target.value)}
                                    className="bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                                </select>

                                <div className="flex items-center px-2">
                                    <label className="inline-flex items-center cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={showFreeOnly}
                                            onChange={(e) => setShowFreeOnly(e.target.checked)}
                                            className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">Free Only</span>
                                    </label>
                                </div>
                                <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-8">
                {/* AI-Powered Recommended Mentors Section */}
                {showRecommendations && recommendedMentors.length > 0 && (
                    <div className="mb-16">
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        Recommended For You
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                                            AI Powered
                                        </span>
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">{recommendationMessage}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recommended Mentors Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                            {recommendedMentors.map((mentor) => (
                                <Link
                                    to={`/mentors/${mentor.mentorId}`}
                                    key={mentor._id}
                                    className="group bg-gradient-to-br from-white to-purple-50/30 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-purple-100 flex flex-col relative overflow-hidden cursor-pointer"
                                >
                                    {/* AI Badge */}
                                    <div className="absolute top-2 right-2 z-10">
                                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            {mentor.matchScore}%
                                        </div>
                                    </div>

                                    {/* Animated Background Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    {/* Card Header - Compact */}
                                    <div className="p-3 pb-0 flex flex-col items-center relative z-10">
                                        <div className="relative mb-2">
                                            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300 ring-1 ring-purple-100">
                                                {mentor.photo ? (
                                                    <img
                                                        src={mentor.photo}
                                                        alt={mentor.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-600 text-lg font-bold">
                                                        {mentor.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Online indicator */}
                                            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
                                                <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content - Compact */}
                                    <div className="p-3 pt-1 flex-1 flex flex-col text-center">
                                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-0.5 line-clamp-1">
                                            {mentor.name}
                                        </h3>
                                        <p className="text-[10px] font-medium text-gray-500 mb-2 line-clamp-1">
                                            {mentor.role} @ {mentor.company}
                                        </p>

                                        {/* Match Indicators - Compact */}
                                        <div className="flex flex-wrap gap-1 justify-center mb-2">
                                            {mentor.commonSkills && mentor.commonSkills.length > 0 && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                                                    ✓ {mentor.commonSkills.length} Skills
                                                </span>
                                            )}
                                            {mentor.previousSessions > 0 && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    🤝 {mentor.previousSessions} Sess.
                                                </span>
                                            )}
                                        </div>

                                        {/* Footer Row */}
                                        <div className="mt-auto flex items-center justify-center gap-2 text-[10px]">
                                            <div className="inline-flex items-center space-x-0.5 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100">
                                                <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                <span className="font-bold text-gray-900">{mentor.rating}</span>
                                            </div>
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium border ${(mentor.price === "Free" || mentor.price?.toLowerCase().includes("free"))
                                                ? "bg-green-50 text-green-700 border-green-100"
                                                : "bg-purple-50 text-purple-700 border-purple-100"
                                                }`}>
                                                {(mentor.price === "Free" || mentor.price?.toLowerCase().includes("free")) ? "Free" : mentor.price}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="relative my-12">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-4 bg-gray-50 text-sm font-medium text-gray-500">
                                    Browse All Mentors
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Industry Chips - Optional alternative display */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {industries.slice(0, 6).map((industry) => (
                        industry !== "All" && (
                            <button
                                key={industry}
                                onClick={() => setSelectedIndustry(industry)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedIndustry === industry
                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:text-purple-600"
                                    }`}
                            >
                                {industry}
                            </button>
                        )
                    ))}
                </div>

                {/* Results Info */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {showRecommendations ? "All Mentors" : "Top Mentors"} <span className="text-gray-400 font-normal text-lg ml-2">{filteredMentors.length} found</span>
                    </h2>
                    <div className="text-sm text-gray-500">
                        Sorted by: <span className="font-semibold text-gray-900 cursor-pointer">Relevance</span>
                    </div>
                </div>

                {/* Mentors Grid */}
                {filteredMentors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredMentors.map((mentor) => (
                            <div
                                key={mentor._id}
                                className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col relative overflow-hidden"
                            >
                                {/* Top Accent Line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

                                {/* Card Header */}
                                <div className="p-6 pb-0 flex items-start justify-between relative z-10">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                                            {mentor.photo ? (
                                                <img
                                                    src={mentor.photo}
                                                    alt={mentor.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-purple-600 text-xl font-bold">
                                                    {mentor.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                            <div className="w-4 h-4 rounded-full bg-green-500 border border-white"></div>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${(mentor.price === "Free" || mentor.price?.toLowerCase().includes("free"))
                                        ? "bg-green-50 text-green-700 border-green-100"
                                        : "bg-purple-50 text-purple-700 border-purple-100"
                                        }`}>
                                        {(mentor.price === "Free" || mentor.price?.toLowerCase().includes("free")) ? "Free" : mentor.price}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-6 pt-4 flex-1 flex flex-col">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-1 line-clamp-1">
                                            {mentor.name}
                                        </h3>
                                        <p className="text-sm font-medium text-gray-600 mb-3 line-clamp-2 h-10">
                                            {mentor.role} @ <span className="text-gray-900">{mentor.company}</span>
                                        </p>

                                        {/* Rating Pill */}
                                        <div className="inline-flex items-center space-x-1.5 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100 mb-4">
                                            <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-xs font-bold text-gray-900">{mentor.rating || "5.0"}</span>
                                            <span className="text-xs text-gray-400">({mentor.reviewCount || 0})</span>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    <div className="mt-auto">
                                        <div className="flex flex-wrap gap-1.5 mb-5 h-16 overflow-hidden content-start">
                                            {mentor.skills.slice(0, 4).map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-[11px] font-medium border border-gray-100"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {mentor.skills.length > 4 && (
                                                <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-[11px] font-medium border border-gray-100">
                                                    +{mentor.skills.length - 4}
                                                </span>
                                            )}
                                        </div>

                                        <Link
                                            to={`/mentors/${mentor._id}`}
                                            className="block w-full py-2.5 rounded-xl font-semibold text-center text-sm transition-all duration-300
                        bg-gray-900 text-white 
                        group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-indigo-600 
                        group-hover:shadow-lg group-hover:shadow-purple-500/30"
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No mentors found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            We couldn't find any mentors matching your criteria. Try adjusting your search or filters.
                        </p>
                        <button
                            onClick={() => { setSearchTerm(""); setSelectedIndustry("All") }}
                            className="mt-6 text-purple-600 font-medium hover:text-purple-700 hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Invoices Modal */}
            {showInvoicesModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowInvoicesModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Payment History & Invoices</h3>
                                            <button onClick={() => setShowInvoicesModal(false)} className="text-gray-400 hover:text-gray-500">
                                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-500">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentor</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {mySessions
                                                            .filter(s => s.amount > 0 && (s.paymentStatus === 'paid' || s.paymentStatus === 'failed'))
                                                            .map((session) => (
                                                                <tr key={session._id}>
                                                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(session.scheduledDate).toLocaleDateString()}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{session.mentorId?.name}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">₹{session.amount}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                            {session.paymentStatus}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                        {session.paymentStatus === 'paid' ? (
                                                                            <button onClick={() => handleDownloadInvoice(session._id)} className="text-indigo-600 hover:text-indigo-900 flex items-center">
                                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                                Download
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-gray-400">N/A</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                                {mySessions.filter(s => s.amount > 0 && (s.paymentStatus === 'paid' || s.paymentStatus === 'failed')).length === 0 && (
                                                    <div className="text-center py-8 text-gray-500">No payment history found</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindMentors;

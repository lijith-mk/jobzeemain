import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const MentorProfileDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mentor, setMentor] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMentorProfile();
        fetchMentorSessions();
    }, [id]);

    const fetchMentorProfile = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/mentor-applications/public/${id}`);
            if (response.ok) {
                const data = await response.json();
                setMentor(data);
            } else {
                toast.error("Failed to fetch mentor profile");
            }
        } catch (error) {
            console.error("Error fetching mentor profile:", error);
            toast.error("Error loading profile");
        } finally {
            setLoading(false);
        }
    };

    const fetchMentorSessions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/mentor-sessions/public/${id}`);
            if (response.ok) {
                const data = await response.json();
                setSessions(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching mentor sessions:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
            </div>
        );
    }

    if (!mentor) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Mentor Not Found</h2>
                <Link to="/mentors" className="text-purple-600 hover:text-purple-700 font-medium">
                    ← Back to Mentors
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Hero Section */}
            <div className="relative h-80 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-800 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-10">
                    <Link
                        to="/mentors"
                        className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all text-sm font-medium"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Mentors
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 pb-20">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-8">
                        {/* Profile Header Flex */}
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-40 h-40 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-white">
                                    {mentor.photo ? (
                                        <img
                                            src={mentor.photo}
                                            alt={mentor.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600 text-5xl font-bold">
                                            {mentor.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 pt-2">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{mentor.name}</h1>
                                        <p className="text-lg text-gray-600 font-medium">
                                            {mentor.role} @ <span className="text-gray-900 font-bold">{mentor.company}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <a
                                            href={mentor.linkedinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                            </svg>
                                        </a>
                                        <button
                                            onClick={() => navigate(`/mentors/${id}/book`)}
                                            className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-0.5 ${sessions.some(s => s.price === 0)
                                                    ? "bg-green-600 text-white shadow-green-600/20 hover:bg-green-700"
                                                    : "bg-gray-900 text-white shadow-gray-900/20 hover:bg-black"
                                                }`}
                                        >
                                            Book Session
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                                    <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {mentor.city}, {mentor.country}
                                    </div>
                                    <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                                        </svg>
                                        {mentor.yearsOfExperience} Years Experience
                                    </div>
                                    <div className="flex items-center bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg border border-yellow-100">
                                        <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="font-bold mr-1">{mentor.rating}</span> ({mentor.reviewCount} reviews)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 border-t border-gray-100 pt-8">
                            {/* Left Column - Details */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* About */}
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                                        About Me
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                        {mentor.motivation || mentor.bio || "No description provided."}
                                    </p>
                                </section>

                                {/* Skills */}
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                                        Expertise
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {mentor.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium border border-gray-100"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                {/* Sessions & Pricing */}
                                {sessions.length > 0 && (
                                    <section>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
                                            Sessions & Pricing
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {sessions.map((session) => (
                                                <div
                                                    key={session.sessionTypeId}
                                                    className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all hover:border-purple-200"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="font-bold text-gray-900 text-lg flex-1">
                                                            {session.title}
                                                        </h4>
                                                        {session.price === 0 ? (
                                                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                                                                FREE
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-bold rounded-full border border-purple-200">
                                                                ₹{session.price}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center text-gray-600 text-sm mb-4">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {session.duration} minutes
                                                    </div>

                                                    {session.description && (
                                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                            {session.description}
                                                        </p>
                                                    )}

                                                    <button
                                                        onClick={() => navigate(`/mentors/${id}/book`)}
                                                        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                                                    >
                                                        Book Session
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Right Column - Stats/Sidebar */}
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Session Info</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Response Time</span>
                                            <span className="font-medium text-gray-900">Within 24h</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Language</span>
                                            <span className="font-medium text-gray-900">English</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Availability Card */}
                                {mentor.availability && mentor.availability.length > 0 && (
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Availability
                                        </h3>
                                        <div className="space-y-3">
                                            {mentor.availability.map((dayAvail, index) => (
                                                <div key={index} className="bg-white rounded-xl p-3 border border-gray-200">
                                                    <div className="font-bold text-gray-900 text-sm mb-2">{dayAvail.day}</div>
                                                    {dayAvail.slots && dayAvail.slots.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {dayAvail.slots.map((slot, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                                                                >
                                                                    {slot}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-500 italic">No slots</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {mentor.timezone && (
                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Timezone: {mentor.timezone}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorProfileDetails;

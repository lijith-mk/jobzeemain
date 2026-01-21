import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for editing
  const [basicFormData, setBasicFormData] = useState({
    name: "",
    phone: "",
    country: "",
    city: "",
  });

  const [professionalFormData, setProfessionalFormData] = useState({
    industry: "",
    currentRole: "",
    company: "",
    yearsOfExperience: "",
    linkedinUrl: "",
    skills: [],
    whyMentor: "",
  });

  // Session State
  const [activeTemplates, setActiveTemplates] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [bookedSessions, setBookedSessions] = useState([]); // Real booked sessions
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showEditSession, setShowEditSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    templateId: "",
    title: "",
    duration: "",
    price: "",
    currency: "INR",
    description: ""
  });

  useEffect(() => {
    // Check if mentor is logged in
    const mentorData = JSON.parse(localStorage.getItem("mentor") || "{}");
    const token = localStorage.getItem("mentorToken");

    if (!mentorData._id || !token) {
      toast.error("Please login first");
      navigate("/mentor/login");
      return;
    }

    setMentor(mentorData);
    fetchMentorProfile(token);
    fetchApplicationData(mentorData._id, token);
    fetchBookedSessions(token); // Fetch real booked sessions
  }, [navigate]);

  useEffect(() => {
    if (activeSection === "sessions") {
      const token = localStorage.getItem("mentorToken");
      fetchActiveTemplates(token);
      fetchMySessions(token);
    }
  }, [activeSection]);


  const fetchActiveTemplates = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/session-templates?isActive=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setActiveTemplates(data.data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchMySessions = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mentor-sessions/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setMySessions(data.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  }

  const fetchBookedSessions = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/mentor/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Filter for upcoming sessions only
        const upcoming = data.data.filter(session => {
          const sessionDate = new Date(session.scheduledDate);
          return sessionDate >= new Date() && session.sessionStatus === 'scheduled';
        });
        setBookedSessions(upcoming);
      }
    } catch (error) {
      console.error("Error fetching booked sessions:", error);
    }
  }

  const handleCreateSession = async () => {
    try {
      const token = localStorage.getItem("mentorToken");
      const response = await fetch(`${API_BASE_URL}/api/mentor-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionForm),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Session created successfully");
        setShowCreateSession(false);
        fetchMySessions(token);
        setSessionForm({ templateId: "", title: "", duration: "", price: "", currency: "INR", description: "" });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to create session");
    }
  };

  const handleUpdateSession = async () => {
    try {
      const token = localStorage.getItem("mentorToken");
      const response = await fetch(`${API_BASE_URL}/api/mentor-sessions/${selectedSession.sessionTypeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionForm),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Session updated successfully");
        setShowEditSession(false);
        fetchMySessions(token);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update session");
    }
  };

  const toggleSessionStatus = async (session) => {
    try {
      const token = localStorage.getItem("mentorToken");
      const response = await fetch(`${API_BASE_URL}/api/mentor-sessions/${session.sessionTypeId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchMySessions(token);
      }
    } catch (error) {
      toast.error("Status update failed");
    }
  }

  const handleDeleteSession = async (session) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      const token = localStorage.getItem("mentorToken");
      const response = await fetch(`${API_BASE_URL}/api/mentor-sessions/${session.sessionTypeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success("Session deleted");
        fetchMySessions(token);
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  }

  const fetchMentorProfile = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mentors/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMentor(data);
        // Update localStorage with fresh data including phone, country, and city
        localStorage.setItem("mentor", JSON.stringify(data));

        // Initialize basic form data
        setBasicFormData({
          name: data.name || "",
          phone: data.phone || "",
          country: data.country || "",
          city: data.city || "",
        });
      }
    } catch (error) {
      console.error("Error fetching mentor profile:", error);
      toast.error("Failed to load profile data");
    }
  };

  const fetchApplicationData = async (mentorId, token) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/mentor-applications/mentor/${mentorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setApplication(data);

        // Initialize professional form data
        setProfessionalFormData({
          industry: data.industry || "",
          currentRole: data.currentRole || "",
          company: data.company || "",
          yearsOfExperience: data.yearsOfExperience || "",
          linkedinUrl: data.linkedinUrl || "",
          skills: data.skills || [],
          whyMentor: data.whyMentor || "",
        });
      } else if (response.status === 404) {
        // Application not found - redirect to application form
        navigate("/mentor/application");
        return;
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load application data");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBasicInfo = () => {
    setBasicFormData({
      name: mentor.name || "",
      phone: mentor.phone || "",
      country: mentor.country || "",
      city: mentor.city || "",
    });
    setIsEditingBasic(true);
  };

  const handleCancelBasicEdit = () => {
    setIsEditingBasic(false);
  };

  const handleSaveBasicInfo = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("mentorToken");
      const response = await fetch(`${API_BASE_URL}/api/mentors/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(basicFormData),
      });

      if (response.ok) {
        const data = await response.json();
        setMentor(data.mentor);
        localStorage.setItem("mentor", JSON.stringify(data.mentor));
        toast.success("Profile updated successfully!");
        setIsEditingBasic(false);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProfessional = () => {
    setIsEditingProfessional(true);
  };

  const handleCancelProfessionalEdit = () => {
    // Reset form data to original values
    if (application) {
      setProfessionalFormData({
        industry: application.industry || "",
        currentRole: application.currentRole || "",
        company: application.company || "",
        yearsOfExperience: application.yearsOfExperience || "",
        linkedinUrl: application.linkedinUrl || "",
        skills: application.skills || [],
        whyMentor: application.whyMentor || "",
      });
    }
    setIsEditingProfessional(false);
  };

  const handleSaveProfessional = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("mentorToken");
      const response = await fetch(
        `${API_BASE_URL}/api/mentor-applications/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(professionalFormData),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setApplication(data.application);
        toast.success("Professional information updated successfully!");
        setIsEditingProfessional(false);
      } else {
        const error = await response.json();
        toast.error(
          error.message || "Failed to update professional information",
        );
      }
    } catch (error) {
      console.error("Error updating professional information:", error);
      toast.error("Failed to update professional information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkillAdd = (skill) => {
    if (skill.trim() && !professionalFormData.skills.includes(skill.trim())) {
      setProfessionalFormData({
        ...professionalFormData,
        skills: [...professionalFormData.skills, skill.trim()],
      });
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setProfessionalFormData({
      ...professionalFormData,
      skills: professionalFormData.skills.filter(
        (skill) => skill !== skillToRemove,
      ),
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("mentorToken");
    localStorage.removeItem("mentor");
    window.dispatchEvent(new Event("user-updated"));
    navigate("/mentor/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!mentor) return null;

  // Removed dummy mock data - using real booked sessions from state

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <svg
              className="w-6 h-6 text-cyan-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="3"
                y="3"
                width="7"
                height="7"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="14"
                y="3"
                width="7"
                height="7"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="3"
                y="14"
                width="7"
                height="7"
                rx="1"
                fill="currentColor"
              />
            </svg>
            <span className="text-xl font-bold text-gray-900">JOBZEE</span>
          </div>
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-gray-200 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
            {mentor.photo ? (
              <img
                src={mentor.photo}
                alt={mentor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-2xl">
                {mentor.name?.charAt(0).toUpperCase() || "M"}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900">{mentor.name}</h3>
          <p className="text-sm text-gray-500">Mentor</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveSection("dashboard")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-2 ${activeSection === "dashboard"
              ? "bg-cyan-50 text-cyan-600"
              : "text-gray-600 hover:bg-gray-50"
              }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="font-medium">Dashboard</span>
          </button>

          <div className="mt-6 mb-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase px-4">
              My Activities
            </h4>
          </div>

          <button
            onClick={() => navigate("/mentor/messages")}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mb-2">
            <div className="flex items-center space-x-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <span className="font-medium">Messages</span>
            </div>
          </button>

          <button
            onClick={() => navigate("/mentor/calendar")}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mb-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium">Calendar</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mb-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="font-medium">Info Session</span>
          </button>

          <div className="mt-6 mb-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase px-4">
              Account Settings
            </h4>
          </div>

          <button
            onClick={() => setActiveSection("profile")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-2 ${activeSection === "profile"
              ? "bg-cyan-50 text-cyan-600"
              : "text-gray-600 hover:bg-gray-50"
              }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="font-medium">Personal Info</span>
          </button>

          <button
            onClick={() => setActiveSection("sessions")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-2 ${activeSection === "sessions"
              ? "bg-cyan-50 text-cyan-600"
              : "text-gray-600 hover:bg-gray-50"
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Session Templates</span>
          </button>

          <button
            onClick={() => navigate("/mentor/sessions")}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mb-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">My Sessions</span>
          </button>

          <button
            onClick={() => navigate("/mentor/availability")}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mb-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Availability</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="font-medium">Login/Security</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer overflow-hidden">
                {mentor.photo ? (
                  <img
                    src={mentor.photo}
                    alt={mentor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  mentor.name?.charAt(0).toUpperCase() || "M"
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
          {activeSection === "profile" ? (
            // Profile Section - Ultra Modern Design
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Elegant Header Bar */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent mb-2">
                    My Profile
                  </h1>
                  <p className="text-gray-600">
                    Manage your professional presence and personal information
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection("dashboard")}
                  className="group flex items-center space-x-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-300"
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
                  <span className="font-medium">Back</span>
                </button>
              </div>

              {/* Profile Header Card */}
              <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-5"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>

                <div className="relative p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Profile Image */}
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
                        <div className="relative w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl">
                          {mentor.photo ? (
                            <img
                              src={mentor.photo}
                              alt={mentor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-4xl">
                              {mentor.name?.charAt(0).toUpperCase() || "M"}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-lg border-3 border-white shadow-lg flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Profile Info */}
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h2 className="text-3xl font-bold text-gray-900">
                            {mentor.name}
                          </h2>
                          {mentor.status === "approved" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3 flex items-center space-x-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{mentor.email}</span>
                        </p>
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
                            <svg
                              className="w-4 h-4 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Mentor
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
                            ID: {mentor.mentorId || "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="flex space-x-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center min-w-[100px] border border-blue-200 shadow-sm">
                        <div className="text-2xl font-bold text-blue-900 mb-1">
                          4.9
                        </div>
                        <div className="flex items-center justify-center space-x-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className="w-3 h-3 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <div className="text-xs text-blue-700 font-medium">
                          Rating
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center min-w-[100px] border border-purple-200 shadow-sm">
                        <div className="text-2xl font-bold text-purple-900 mb-1">
                          127
                        </div>
                        <div className="text-xs text-purple-700 font-medium">
                          Sessions
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        Basic Information
                      </h3>
                      <p className="text-sm text-gray-600">
                        Personal details and contact information
                      </p>
                    </div>
                    {!isEditingBasic && (
                      <button
                        onClick={handleEditBasicInfo}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {isEditingBasic && (
                    <div className="flex items-center justify-end space-x-3 mb-6 pb-6 border-b border-gray-200">
                      <button
                        onClick={handleCancelBasicEdit}
                        disabled={isSaving}
                        className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBasicInfo}
                        disabled={isSaving}
                        className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                    <div className="group">
                      <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>Full Name</span>
                      </label>
                      {isEditingBasic ? (
                        <input
                          type="text"
                          value={basicFormData.name}
                          onChange={(e) =>
                            setBasicFormData({
                              ...basicFormData,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-white px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-900 font-medium transition-all"
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                          <p className="text-gray-900 font-medium">
                            {mentor.name || "N/A"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Email Address</span>
                      </label>
                      <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                        <p className="text-gray-900 font-medium">
                          {mentor.email}
                        </p>
                      </div>
                    </div>

                    <div className="group">
                      <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span>Phone Number</span>
                      </label>
                      {isEditingBasic ? (
                        <input
                          type="tel"
                          value={basicFormData.phone}
                          onChange={(e) =>
                            setBasicFormData({
                              ...basicFormData,
                              phone: e.target.value,
                            })
                          }
                          className="w-full bg-white px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-900 font-medium transition-all"
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                          <p className="text-gray-900 font-medium">
                            {mentor.phone || "N/A"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Country</span>
                      </label>
                      {isEditingBasic ? (
                        <input
                          type="text"
                          value={basicFormData.country}
                          onChange={(e) =>
                            setBasicFormData({
                              ...basicFormData,
                              country: e.target.value,
                            })
                          }
                          className="w-full bg-white px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-900 font-medium transition-all"
                          placeholder="Enter your country"
                        />
                      ) : (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                          <p className="text-gray-900 font-medium">
                            {mentor.country || "N/A"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>City</span>
                      </label>
                      {isEditingBasic ? (
                        <input
                          type="text"
                          value={basicFormData.city}
                          onChange={(e) =>
                            setBasicFormData({
                              ...basicFormData,
                              city: e.target.value,
                            })
                          }
                          className="w-full bg-white px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-900 font-medium transition-all"
                          placeholder="Enter your city"
                        />
                      ) : (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                          <p className="text-gray-900 font-medium">
                            {mentor.city || "N/A"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                          />
                        </svg>
                        <span>Mentor ID</span>
                      </label>
                      <div className="bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-200">
                        <p className="text-gray-900 font-mono font-semibold">
                          {mentor.mentorId || "Pending"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Account Information
                    </h3>
                    <p className="text-sm text-gray-600">
                      Your account details and activity
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Created
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {mentor.createdAt
                          ? new Date(mentor.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                          : "N/A"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-bold text-gray-900">
                          {mentor.isActive ? "Active" : "Inactive"}
                        </p>
                        <div
                          className={`w-2 h-2 rounded-full ${mentor.isActive ? "bg-green-500" : "bg-red-500"
                            } animate-pulse`}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Updated
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {mentor.updatedAt
                          ? new Date(mentor.updatedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              {application && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          Professional Information
                        </h3>
                        <p className="text-sm text-gray-600">
                          Your expertise and career background
                        </p>
                      </div>
                      {!isEditingProfessional && (
                        <button
                          onClick={handleEditProfessional}
                          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-700 text-white rounded-lg hover:from-amber-700 hover:to-orange-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    {isEditingProfessional && (
                      <div className="flex items-center justify-end space-x-3 mb-6 pb-6 border-b border-gray-200">
                        <button
                          onClick={handleCancelProfessionalEdit}
                          disabled={isSaving}
                          className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfessional}
                          disabled={isSaving}
                          className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium disabled:opacity-50"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-5 mb-6">
                      <div className="group">
                        <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          <span>Industry</span>
                        </label>
                        {isEditingProfessional ? (
                          <input
                            type="text"
                            value={professionalFormData.industry}
                            onChange={(e) =>
                              setProfessionalFormData({
                                ...professionalFormData,
                                industry: e.target.value,
                              })
                            }
                            className="w-full bg-white px-4 py-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none text-gray-900 font-medium transition-all"
                            placeholder="Enter your industry"
                          />
                        ) : (
                          <div className="bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
                            <p className="text-gray-900 font-medium">
                              {application.industry || "N/A"}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="group">
                        <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span>Current Role</span>
                        </label>
                        {isEditingProfessional ? (
                          <input
                            type="text"
                            value={professionalFormData.currentRole}
                            onChange={(e) =>
                              setProfessionalFormData({
                                ...professionalFormData,
                                currentRole: e.target.value,
                              })
                            }
                            className="w-full bg-white px-4 py-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none text-gray-900 font-medium transition-all"
                            placeholder="Enter your current role"
                          />
                        ) : (
                          <div className="bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
                            <p className="text-gray-900 font-medium">
                              {application.currentRole || "N/A"}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="group">
                        <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          <span>Company</span>
                        </label>
                        {isEditingProfessional ? (
                          <input
                            type="text"
                            value={professionalFormData.company}
                            onChange={(e) =>
                              setProfessionalFormData({
                                ...professionalFormData,
                                company: e.target.value,
                              })
                            }
                            className="w-full bg-white px-4 py-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none text-gray-900 font-medium transition-all"
                            placeholder="Enter your company"
                          />
                        ) : (
                          <div className="bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
                            <p className="text-gray-900 font-medium">
                              {application.company || "N/A"}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="group">
                        <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                            />
                          </svg>
                          <span>Years of Experience</span>
                        </label>
                        {isEditingProfessional ? (
                          <input
                            type="number"
                            min="0"
                            value={professionalFormData.yearsOfExperience}
                            onChange={(e) =>
                              setProfessionalFormData({
                                ...professionalFormData,
                                yearsOfExperience: e.target.value,
                              })
                            }
                            className="w-full bg-white px-4 py-3 rounded-lg border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none text-gray-900 font-medium transition-all"
                            placeholder="Years of experience"
                          />
                        ) : (
                          <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                            <p className="text-gray-900 font-medium">
                              {application.yearsOfExperience || "N/A"} years
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="col-span-2 group">
                        <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          <span>Profile Link</span>
                        </label>
                        {isEditingProfessional ? (
                          <input
                            type="url"
                            value={professionalFormData.linkedinUrl}
                            onChange={(e) =>
                              setProfessionalFormData({
                                ...professionalFormData,
                                linkedinUrl: e.target.value,
                              })
                            }
                            className="w-full bg-white px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-900 font-medium transition-all"
                            placeholder="https://example.com/yourprofile"
                          />
                        ) : application.linkedinUrl ? (
                          <a
                            href={application.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 hover:border-blue-300 transition-all hover:shadow-sm group"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-blue-600 font-medium group-hover:underline truncate">
                                {application.linkedinUrl}
                              </p>
                              <svg
                                className="w-4 h-4 text-blue-600 transform group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </div>
                          </a>
                        ) : (
                          <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                            <p className="text-gray-500 font-medium">N/A</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills Section */}
                    <div className="mb-6">
                      <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        <span>Skills & Expertise</span>
                      </label>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                        {isEditingProfessional ? (
                          <div>
                            <div className="flex gap-2 mb-4">
                              <input
                                type="text"
                                id="skillInput"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSkillAdd(e.target.value);
                                    e.target.value = "";
                                  }
                                }}
                                className="flex-1 bg-white px-4 py-2 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none text-gray-900 transition-all"
                                placeholder="Type a skill and press Enter"
                              />
                              <button
                                onClick={() => {
                                  const input =
                                    document.getElementById("skillInput");
                                  handleSkillAdd(input.value);
                                  input.value = "";
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                              >
                                Add
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {professionalFormData.skills.length > 0 ? (
                                professionalFormData.skills.map(
                                  (skill, index) => (
                                    <span
                                      key={index}
                                      className="group relative px-3 py-1.5 bg-white rounded-lg border border-purple-300 shadow-sm flex items-center space-x-2"
                                    >
                                      <span className="font-medium text-gray-800 text-sm">
                                        {skill}
                                      </span>
                                      <button
                                        onClick={() => handleSkillRemove(skill)}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                      >
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    </span>
                                  ),
                                )
                              ) : (
                                <p className="text-gray-500 italic text-sm">
                                  No skills added yet
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {application.skills &&
                              application.skills.length > 0 ? (
                              application.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1.5 bg-white rounded-lg border border-purple-300 shadow-sm"
                                >
                                  <span className="font-medium text-gray-800 text-sm flex items-center space-x-1">
                                    <svg
                                      className="w-3 h-3 text-purple-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span>{skill}</span>
                                  </span>
                                </span>
                              ))
                            ) : (
                              <p className="text-gray-500 italic text-sm">
                                No skills added
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Why Mentor Section */}
                    <div className="mb-6">
                      <label className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span>Why Mentor?</span>
                      </label>
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                        {isEditingProfessional ? (
                          <textarea
                            value={professionalFormData.whyMentor}
                            onChange={(e) =>
                              setProfessionalFormData({
                                ...professionalFormData,
                                whyMentor: e.target.value,
                              })
                            }
                            rows="6"
                            className="w-full bg-white px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-800 leading-relaxed transition-all resize-none"
                            placeholder="Why do you want to be a mentor? (50-1000 characters)"
                          />
                        ) : (
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {application.whyMentor || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Application Status */}
                    {application.verificationStatus && (
                      <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                              Application Status
                            </p>
                            <p className="text-2xl font-bold text-indigo-900 capitalize">
                              {application.verificationStatus}
                            </p>
                          </div>
                          {application.submittedAt && (
                            <div className="text-right bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                              <p className="text-xs text-gray-600 font-semibold mb-1">
                                Submitted on
                              </p>
                              <p className="text-sm font-bold text-gray-900">
                                {new Date(
                                  application.submittedAt,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                        {application.rejectionReason && (
                          <div className="mt-4 bg-white rounded-lg p-4 border border-red-200 shadow-sm">
                            <p className="text-sm font-bold text-red-700 mb-2 flex items-center space-x-2">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Rejection Reason</span>
                            </p>
                            <p className="text-gray-800 leading-relaxed text-sm">
                              {application.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeSection === "sessions" ? (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Sessions & Pricing</h1>
                  <p className="text-gray-600">Create and manage your mentorship session offerings</p>
                </div>
                <button onClick={() => setShowCreateSession(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all">
                  + Create Session
                </button>
              </div>

              {/* Session List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySessions.map((session) => (
                  <div key={session.sessionTypeId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${session.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {session.isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="flex space-x-2">
                        <button onClick={() => { setSelectedSession(session); setSessionForm(session); setShowEditSession(true); }} className="text-gray-400 hover:text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteSession(session)} className="text-gray-400 hover:text-red-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{session.title}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{session.description}</p>
                    <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-4 ">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {session.duration} mins
                      </div>
                      <div className="flex items-center">
                        {session.price > 0 ? `₹${session.price}` : <span className="text-red-600">Invalid Price</span>}
                      </div>
                    </div>
                    <button onClick={() => toggleSessionStatus(session)} className={`w-full py-2 rounded-lg text-sm font-medium border ${session.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                      {session.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                ))}
                {mySessions.length === 0 && (
                  <div className="col-span-full text-center py-10 text-gray-500">
                    No sessions created yet. Click "Create Session" to get started!
                  </div>
                )}
              </div>

              {/* Create Session Modal */}
              {showCreateSession && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Create New Session</h3>
                      <button onClick={() => setShowCreateSession(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                        <select
                          className="w-full border rounded-lg px-3 py-2"
                          value={sessionForm.templateId}
                          onChange={(e) => {
                            const template = activeTemplates.find(t => t.templateId === e.target.value || t._id === e.target.value);
                            setSessionForm({
                              ...sessionForm,
                              templateId: e.target.value,
                              title: template?.title || "",
                              duration: template?.defaultDuration || "",
                              description: template?.description || ""
                            });
                          }}
                        >
                          <option value="">Choose a session type...</option>
                          {activeTemplates.map(t => (
                            <option key={t.templateId} value={t.templateId}>{t.title} ({t.defaultDuration} mins)</option>
                          ))}
                        </select>
                      </div>
                      {sessionForm.templateId && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input className="w-full border rounded-lg px-3 py-2" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                              <input type="number" className="w-full border rounded-lg px-3 py-2" value={sessionForm.duration} onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                              <input type="number" min="1" className="w-full border rounded-lg px-3 py-2" value={sessionForm.price} onChange={(e) => setSessionForm({ ...sessionForm, price: e.target.value })} placeholder="Enter amount" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea className="w-full border rounded-lg px-3 py-2" rows="3" value={sessionForm.description} onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })} />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button onClick={() => setShowCreateSession(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                      <button onClick={handleCreateSession} disabled={!sessionForm.templateId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Create Session</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Session Modal */}
              {showEditSession && selectedSession && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Edit Session</h3>
                      <button onClick={() => setShowEditSession(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input className="w-full border rounded-lg px-3 py-2" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                          <input type="number" className="w-full border rounded-lg px-3 py-2" value={sessionForm.duration} onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                          <input type="number" min="1" className="w-full border rounded-lg px-3 py-2" value={sessionForm.price} onChange={(e) => setSessionForm({ ...sessionForm, price: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea className="w-full border rounded-lg px-3 py-2" rows="3" value={sessionForm.description} onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })} />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button onClick={() => setShowEditSession(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                      <button onClick={handleUpdateSession} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Session</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome,{" "}
                    <span className="text-blue-600">
                      {mentor.name?.split(" ")[0] || "Mentor"}
                    </span>
                  </h1>
                  <p className="text-gray-600">
                    Manage all the things from single Dashboard. See latest info
                    sessions, recent conversations and update your
                    recommendations.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="w-40 h-40" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="80" r="30" fill="#FFB8B8" />
                    <rect
                      x="85"
                      y="110"
                      width="30"
                      height="50"
                      rx="5"
                      fill="#FF6B6B"
                    />
                    <rect
                      x="70"
                      y="120"
                      width="15"
                      height="40"
                      rx="5"
                      fill="#FFB8B8"
                    />
                    <rect
                      x="115"
                      y="120"
                      width="15"
                      height="40"
                      rx="5"
                      fill="#FFB8B8"
                    />
                    <circle cx="90" cy="75" r="3" fill="#000" />
                    <circle cx="110" cy="75" r="3" fill="#000" />
                    <path
                      d="M 90 85 Q 100 90 110 85"
                      stroke="#000"
                      strokeWidth="2"
                      fill="none"
                    />
                    <rect
                      x="75"
                      y="160"
                      width="20"
                      height="30"
                      rx="5"
                      fill="#4A90E2"
                    />
                    <rect
                      x="105"
                      y="160"
                      width="20"
                      height="30"
                      rx="5"
                      fill="#4A90E2"
                    />
                    <rect
                      x="60"
                      y="40"
                      width="80"
                      height="40"
                      rx="20"
                      fill="#2C3E50"
                    />
                    <path
                      d="M 120 100 L 140 110 L 140 140"
                      stroke="#FFB8B8"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Ongoing Info Sessions */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Upcoming Sessions
                  </h3>
                  <div className="space-y-4">
                    {bookedSessions.length === 0 ? (
                      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-sm">No upcoming sessions</p>
                        <p className="text-gray-400 text-xs mt-1">Sessions booked by students will appear here</p>
                      </div>
                    ) : (
                      bookedSessions.slice(0, 3).map((session) => {
                        const sessionDate = new Date(session.scheduledDate);
                        const now = new Date();
                        const hoursUntil = Math.round((sessionDate - now) / (1000 * 60 * 60));

                        return (
                          <div
                            key={session._id}
                            className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-semibold text-green-600">
                                  {hoursUntil > 0 ? `${hoursUntil}h until session` : 'Starting soon'}
                                </span>
                              </div>
                              <button
                                onClick={() => navigate('/mentor/sessions')}
                                className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                              >
                                View
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">
                              Student: {session.userId?.name || 'Unknown'}
                            </p>
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                              {session.sessionTypeId?.title || 'Mentorship Session'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {session.scheduledTime}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Sessions</p>
                          <p className="text-2xl font-bold text-gray-900">{bookedSessions.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Session Types</p>
                          <p className="text-2xl font-bold text-gray-900">{mySessions.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 shadow-sm text-white">
                      <p className="text-xs text-gray-300 mb-2">Quick Actions</p>
                      <button
                        onClick={() => setActiveSection('sessions')}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors mb-2"
                      >
                        Manage Sessions
                      </button>
                      <button
                        onClick={() => navigate('/mentor/sessions')}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                      >
                        View All Bookings
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Recommendations */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Your Recommendations
                  </h3>
                  <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                    See all
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                      <svg
                        className="w-8 h-8 text-pink-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Books</h4>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Videos</h4>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Courses</h4>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;

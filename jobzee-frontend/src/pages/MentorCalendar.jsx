import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const MentorCalendar = () => {
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // month, week, day
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    const mentorData = JSON.parse(localStorage.getItem("mentor") || "{}");
    const token = localStorage.getItem("mentorToken");

    if (!mentorData._id || !token) {
      toast.error("Please login first");
      navigate("/mentor/login");
      return;
    }

    setMentor(mentorData);
    fetchCalendarData(token);
    fetchCalendarNotes(token);
  }, [navigate, currentDate, view]);

  const fetchCalendarData = async (token) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/sessions/mentor/calendar`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();

      if (data.success) {
        setEvents(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
      toast.error("Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarNotes = async (token) => {
    try {
      setNotesLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript months are 0-based

      const response = await fetch(
        `${API_BASE_URL}/api/calendar-notes?year=${year}&month=${month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();

      if (data.success) {
        setNotes(data.data);
      } else {
        console.error("Failed to load calendar notes:", data.message);
      }
    } catch (error) {
      console.error("Error fetching calendar notes:", error);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mentorToken");
    localStorage.removeItem("mentor");
    navigate("/mentor/login");
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      );
    } else if (view === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      );
    } else if (view === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const getNotesForDate = (date) => {
    if (!notes || notes.length === 0) return [];

    return notes.filter((note) => {
      const noteDate = new Date(note.date);
      return noteDate.toDateString() === date.toDateString();
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedNote(null); // Reset selected note when adding a new one
    setShowNoteModal(true);
  };

  const handleNoteClick = (note) => {
    setSelectedNote(note);
    setSelectedDate(new Date(note.date));
    setShowNoteModal(true);
  };

  const handleAddNote = async (noteData) => {
    try {
      const token = localStorage.getItem("mentorToken");
      const method = selectedNote ? "PATCH" : "POST";
      const url = selectedNote
        ? `${API_BASE_URL}/api/calendar-notes/${selectedNote.noteId}`
        : `${API_BASE_URL}/api/calendar-notes`;

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(noteData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          selectedNote
            ? "Note updated successfully"
            : "Note added successfully",
        );
        setShowNoteModal(false);
        fetchCalendarNotes(token);
      } else {
        toast.error(data.message || "Failed to save note");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      const token = localStorage.getItem("mentorToken");
      const response = await fetch(
        `${API_BASE_URL}/api/calendar-notes/${selectedNote.noteId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Note deleted successfully");
        setShowNoteModal(false);
        fetchCalendarNotes(token);
      } else {
        toast.error(data.message || "Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } =
      getDaysInMonth(currentDate);
    const days = [];
    const today = new Date();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-[120px] bg-gray-50 border border-gray-200"
        ></div>,
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <div
          key={day}
          className={`min-h-[120px] border border-gray-200 p-2 ${isToday ? "bg-blue-50 border-blue-300" : "bg-white"} hover:bg-gray-50 transition-colors cursor-pointer`}
          onClick={() => handleDateClick(date)}
        >
          <div
            className={`text-sm font-semibold mb-2 ${isToday ? "text-blue-600" : "text-gray-700"}`}
          >
            {day}
            {isToday && <span className="ml-1 text-xs">(Today)</span>}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div
                key={idx}
                onClick={() => handleEventClick(event)}
                className="text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: event.color + "20",
                  borderLeft: `3px solid ${event.color}`,
                }}
              >
                <div className="font-medium truncate">
                  {new Date(event.start).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
                <div className="truncate text-gray-700">{event.title}</div>
                <div className="truncate text-gray-600">
                  {event.employeeName}
                </div>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 pl-1.5">
                +{dayEvents.length - 3} more
              </div>
            )}

            {/* Display Notes for this day */}
            {getNotesForDate(date).map((note, idx) => (
              <div
                key={`note-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNoteClick(note);
                }}
                className="text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity mt-1 flex items-center"
                style={{
                  backgroundColor: note.color + "20",
                  borderLeft: `3px solid ${note.color}`,
                }}
              >
                <div
                  className="w-3 h-3 mr-1.5"
                  style={{ backgroundColor: note.color, borderRadius: "50%" }}
                ></div>
                <div className="truncate font-medium">{note.title}</div>
                {note.isImportant && (
                  <span className="ml-1 text-red-500">★</span>
                )}
              </div>
            ))}
          </div>
        </div>,
      );
    }

    return days;
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
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
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

        <div className="p-6 border-b border-gray-200 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
            {mentor?.photo ? (
              <img
                src={mentor.photo}
                alt={mentor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-2xl">
                {mentor?.name?.charAt(0) || "M"}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900">{mentor?.name}</h3>
          <p className="text-sm text-gray-500">Mentor</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigate("/mentor/dashboard")}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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

          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-cyan-50 text-cyan-600 transition-colors">
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

          <button
            onClick={() => navigate("/mentor/sessions")}
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">My Sessions</span>
          </button>

          <button
            onClick={() => navigate("/mentor/availability")}
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium">Availability</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mt-auto"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {/* Calendar Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleToday}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Today
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevious}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
                    {currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <button
                    onClick={handleNext}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setView("month")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === "month" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setView("week")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === "week" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  disabled
                >
                  Week
                </button>
                <button
                  onClick={() => setView("day")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === "day" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  disabled
                >
                  Day
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Scheduled</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-600">No-Show</span>
              </div>
              <div className="text-sm text-gray-500 italic ml-4">
                (Cancelled sessions are hidden from calendar)
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          {view === "month" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">{renderMonthView()}</div>
            </div>
          )}

          {events.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
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
              <h3 className="text-lg font-medium text-gray-900">
                No sessions scheduled
              </h3>
              <p className="text-gray-500">
                Booked sessions will appear on your calendar
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedEvent.title}
                </h3>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(selectedEvent.status)}`}
                >
                  {selectedEvent.status.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
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
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedEvent.employeePhoto ? (
                    <img
                      src={selectedEvent.employeePhoto}
                      alt={selectedEvent.employeeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {selectedEvent.employeeName.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedEvent.employeeName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedEvent.employeeEmail}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 mr-3"
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
                  <span>
                    {new Date(selectedEvent.start).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 mr-3"
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
                  <span>
                    {new Date(selectedEvent.start).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(selectedEvent.end).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    ({selectedEvent.duration} mins)
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>₹{selectedEvent.amount}</span>
                </div>
              </div>

              {selectedEvent.notes && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Notes:
                  </p>
                  <p className="text-sm text-gray-600">{selectedEvent.notes}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                {selectedEvent.meetingLink &&
                  selectedEvent.status === "scheduled" && (
                    <a
                      href={selectedEvent.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                    >
                      Join Meeting
                    </a>
                  )}
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    navigate(`/mentor/sessions/${selectedEvent.sessionId}`);
                  }}
                  className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* End Event Modal */}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedNote ? "Edit Note" : "Add Note"}
              </h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
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
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddNote({
                  title: formData.get("title"),
                  content: formData.get("content"),
                  date: formData.get("date"),
                  color: formData.get("color"),
                  isImportant: formData.get("isImportant") === "on",
                });
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={
                    selectedDate
                      ? selectedDate.toISOString().split("T")[0]
                      : new Date().toISOString().split("T")[0]
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={selectedNote?.title || ""}
                  className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="Note title"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  name="content"
                  defaultValue={selectedNote?.content || ""}
                  className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  rows="3"
                  placeholder="Note details..."
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    name="color"
                    defaultValue={selectedNote?.color || "#3498db"}
                    className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  >
                    <option value="#3498db">Blue</option>
                    <option value="#2ecc71">Green</option>
                    <option value="#e74c3c">Red</option>
                    <option value="#f39c12">Orange</option>
                    <option value="#9b59b6">Purple</option>
                    <option value="#1abc9c">Teal</option>
                    <option value="#34495e">Navy</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isImportant"
                      defaultChecked={selectedNote?.isImportant || false}
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mark as Important
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                {selectedNote && (
                  <button
                    type="button"
                    onClick={handleDeleteNote}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
                <div className={selectedNote ? "" : "ml-auto"}>
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {selectedNote ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* End Note Modal */}
    </div>
  );
};

export default MentorCalendar;

import React from "react";

const AdminSidebar = ({
  activeTab,
  onTabChange,
  onLogout,
  admin,
  isMobile = false,
  open = false,
  onClose,
}) => {
  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: "📊" },
    { id: "users", name: "Users", icon: "👥" },
    { id: "employers", name: "Employers", icon: "🏢" },
    { id: "mentors", name: "Mentors", icon: "👨‍🏫" },
    { id: "mentor-applications", name: "Mentor Applications", icon: "📝" },
    { id: "session-templates", name: "Session Templates", icon: "📋" },
    { id: "jobs", name: "Jobs", icon: "💼" },
    { id: "internships", name: "Internships", icon: "🎓" },
    { id: "courses", name: "Courses", icon: "📚" },
    { id: "learning-paths", name: "Learning Paths", icon: "🎯" },
    { id: "events", name: "Events", icon: "🎉" },
    { id: "tests", name: "Tests", icon: "📝" },
    { id: "payments", name: "Payments", icon: "💰" },
    { id: "plans", name: "Plans", icon: "💳" },
    { id: "products", name: "Products", icon: "🛒" },
    { id: "queries", name: "Queries", icon: "✉️" },
    { id: "analytics", name: "Analytics", icon: "📈" },
  ];

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <aside className="w-64 min-h-screen hidden md:flex md:flex-col bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
        {/* Premium header */}
        <div className="relative px-5 py-5 border-b border-white/40 bg-white/70 backdrop-blur-xl">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <div className="text-xl font-extrabold tracking-tight text-gray-900">
              JobZee Admin
            </div>
            <div className="text-sm text-gray-600 mt-1 truncate">
              {admin?.name || "Administrator"}
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                  ? "text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600"
                  : "text-gray-700 hover:text-gray-900 hover:bg-white/60 hover:shadow"
                }`}
            >
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full transition-all ${activeTab === tab.id
                    ? "bg-white/90"
                    : "bg-transparent group-hover:bg-blue-500/60"
                  }`}
              />
              <span
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ring-1 ${activeTab === tab.id
                    ? "bg-white/20 ring-white/30 text-white"
                    : "bg-white/70 ring-gray-200 text-gray-700 group-hover:bg-white"
                  }`}
              >
                <span className="text-base">{tab.icon}</span>
              </span>
              <span className="font-semibold tracking-wide">{tab.name}</span>
              <svg
                className={`ml-auto w-4 h-4 transition-transform ${activeTab === tab.id ? "opacity-90" : "opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5"}`}
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
          ))}
        </nav>
        <div className="p-4 border-t border-white/40 bg-white/60 backdrop-blur">
          <button
            onClick={onLogout}
            className="group w-full flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
    );
  }

  // Mobile Drawer Sidebar
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <aside className="relative bg-gradient-to-b from-slate-50 via-white to-blue-50/30 w-72 h-full shadow-xl flex flex-col">
        <div className="px-4 py-4 border-b border-white/40 bg-white/70 backdrop-blur flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">JobZee Admin</div>
            <div className="text-xs text-gray-600 mt-0.5 truncate">
              {admin?.name || "Administrator"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                onClose && onClose();
              }}
              className={`group relative w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                  ? "text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600"
                  : "text-gray-700 hover:text-gray-900 hover:bg-white/60 hover:shadow"
                }`}
            >
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full transition-all ${activeTab === tab.id
                    ? "bg-white/90"
                    : "bg-transparent group-hover:bg-blue-500/60"
                  }`}
              />
              <span
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ring-1 ${activeTab === tab.id
                    ? "bg-white/20 ring-white/30 text-white"
                    : "bg-white/70 ring-gray-200 text-gray-700 group-hover:bg-white"
                  }`}
              >
                <span className="text-base">{tab.icon}</span>
              </span>
              <span className="font-semibold tracking-wide">{tab.name}</span>
              <svg
                className={`ml-auto w-4 h-4 transition-transform ${activeTab === tab.id ? "opacity-90" : "opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5"}`}
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
          ))}
        </nav>
        <div className="p-4 border-t border-white/40 bg-white/60 backdrop-blur">
          <button
            onClick={() => {
              onLogout();
              onClose && onClose();
            }}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
    </div>
  );
};

export default AdminSidebar;

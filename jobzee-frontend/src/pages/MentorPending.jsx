import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const MentorPending = () => {
  const navigate = useNavigate();
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    // Check if mentor is logged in
    const mentor = JSON.parse(localStorage.getItem("mentor") || "{}");
    if (!mentor._id) {
      toast.error("Please login first");
      navigate("/mentor/login");
      return;
    }

    // Check application status
    const checkApplicationStatus = async () => {
      try {
        // First check status
        const statusResponse = await fetch(
          `${API_BASE_URL}/api/mentor-applications/check/${mentor._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("mentorToken")}`,
            },
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          
          // If application doesn't exist, redirect to application form
          if (!statusData.exists) {
            navigate("/mentor/application");
            return;
          }

          // If application is approved, redirect to dashboard
          if (statusData.verificationStatus === "approved") {
            navigate("/mentor/dashboard");
            return;
          }

          setApplicationStatus(statusData.verificationStatus || "pending");

          // If rejected, fetch full application to get rejection reason
          if (statusData.verificationStatus === "rejected") {
            const appResponse = await fetch(
              `${API_BASE_URL}/api/mentor-applications/mentor/${mentor._id}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("mentorToken")}`,
                },
              }
            );

            if (appResponse.ok) {
              const appData = await appResponse.json();
              setRejectionReason(appData.rejectionReason || "");
            }
          }
        }
      } catch (error) {
        console.error("Error checking application status:", error);
      }
    };

    checkApplicationStatus();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
          {/* Status Badge */}
          <div className="mb-8">
            {applicationStatus === "rejected" ? (
              <>
                <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
                  <svg
                    className="w-12 h-12 text-red-600"
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
                </div>
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-red-100 border-2 border-red-400">
                  <span className="text-red-800 font-bold text-lg">
                    🔴 STATUS: REJECTED
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-6 animate-pulse">
                  <svg
                    className="w-12 h-12 text-yellow-600"
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
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-yellow-100 border-2 border-yellow-400">
                  <span className="text-yellow-800 font-bold text-lg">
                    🟡 STATUS: PENDING
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {applicationStatus === "rejected" ? (
              <>
                {/* Rejected Badge */}
                <div className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-red-50 border-2 border-red-400">
                  <svg
                    className="w-6 h-6 text-red-600 mr-2"
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
                  <span className="text-red-800 font-semibold text-xl">
                    Application Rejected
                  </span>
                </div>

                {/* Rejection Message */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your mentor application has been rejected
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Unfortunately, your application did not meet our requirements at this time.
                  </p>
                </div>

                {/* Rejection Reason */}
                {rejectionReason && (
                  <div className="mt-6 p-6 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start space-x-4">
                      <svg
                        className="w-6 h-6 text-red-600 mt-1 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-left flex-1">
                        <h3 className="text-sm font-semibold text-red-900 mb-2">
                          Rejection Reason:
                        </h3>
                        <p className="text-sm text-red-800">{rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-4">
                    <svg
                      className="w-6 h-6 text-gray-500 mt-1 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm text-gray-600">
                        If you believe this decision was made in error or would like to reapply,
                        please contact our support team for assistance.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Success Badge */}
                <div className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-green-50 border-2 border-green-400">
                  <svg
                    className="w-6 h-6 text-green-600 mr-2"
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
                  <span className="text-green-800 font-semibold text-xl">
                    Application Submitted
                  </span>
                </div>

                {/* Message */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your mentor application is under review
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Our team is verifying your profile. This usually takes{" "}
                    <span className="font-semibold text-gray-800">24–48 hours</span>.
                  </p>
                </div>
              </>
            )}

            {/* Info Box */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-4">
                <svg
                  className="w-6 h-6 text-gray-500 mt-1 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-sm text-gray-600">
                    You will receive an email notification once your application
                    has been reviewed. Please check your email regularly.
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Option */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  localStorage.removeItem("mentorToken");
                  localStorage.removeItem("mentor");
                  window.dispatchEvent(new Event("user-updated"));
                  navigate("/mentor/login");
                }}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorPending;


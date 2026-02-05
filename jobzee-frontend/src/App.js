import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import sessionManager from "./utils/sessionManager";
import { CartProvider } from "./contexts/CartContext";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import HomeModern from "./pages/HomeModern"; // Ultra-modern version
import About from "./pages/About";
import Contact from "./pages/Contact";
import PageNotFound from "./pages/PageNotFound";
import Dashboard from "./pages/Dashboard";
import SavedJobs from "./pages/SavedJobs";

import Register from "./components/Register";
import Login from "./components/Login";
import JobSearch from "./components/JobSearch";
import Onboarding from "./components/Onboarding";
import UserProfile from "./components/UserProfile";
import EmployerRegister from "./components/EmployerRegister";
import EmployerLogin from "./components/EmployerLogin";
import MentorLogin from "./components/MentorLogin";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import EmployerForgotPassword from "./components/EmployerForgotPassword";
import EmployerResetPassword from "./components/EmployerResetPassword";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerProfile from "./components/EmployerProfile";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminCreateCourse from "./components/AdminCreateCourse";
import AdminCourseView from "./components/AdminCourseView";
import AdminCourseAnalytics from "./pages/AdminCourseAnalytics";
import EmployerPostJob from "./components/EmployerPostJob";
import EmployerPostInternship from "./components/EmployerPostInternship";
import EmployerInternships from "./pages/EmployerInternships";
import EmployerMyJobs from "./pages/EmployerMyJobs";
import EmployerEditJob from "./pages/EmployerEditJob";
import JobApplications from "./pages/JobApplications";
import MyApplications from "./pages/MyApplications";
import MyInterviews from "./pages/MyInterviews";
import EmployerNotifications from "./pages/EmployerNotifications";
import Pricing from "./pages/Pricing";
import EmployerBilling from "./pages/EmployerBilling";
import EmployerInterviews from "./pages/EmployerInterviews";
import EmployerEvents from "./pages/EmployerEvents";
import EmployerCreateEvent from "./pages/EmployerCreateEvent";
import EmployerEditEvent from "./pages/EmployerEditEvent";
import EmployerViewEvent from "./pages/EmployerViewEvent";
import UserEventDetails from "./pages/UserEventDetails";
import UserPayments from "./pages/UserPayments";
import Participate from "./pages/Participate";
import MyTickets from "./pages/MyTickets";
import MyEvents from "./pages/MyEvents";
import TicketDisplay from "./pages/TicketDisplay";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ProductDetails from "./pages/ProductDetails";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import ShopPayments from "./pages/ShopPayments";
import MyPurchases from "./pages/MyPurchases";
import OrderDetails from "./pages/OrderDetails";
import Internships from "./pages/Internships";
import InternshipDetails from "./pages/InternshipDetails";
import InternshipApplications from "./pages/InternshipApplications";
import MyInternshipApplications from "./pages/MyInternshipApplications";
import MentorRegister from "./pages/MentorRegister";
import MentorApplicationForm from "./pages/MentorApplicationForm";
import MentorPending from "./pages/MentorPending";
import MentorDashboard from "./pages/MentorDashboard";
import FindMentors from "./pages/FindMentors";
import MentorProfileDetails from "./pages/MentorProfileDetails";
import MentorAvailability from "./pages/MentorAvailability";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import BookingConfirmation from "./pages/BookingConfirmation";
import MySessions from "./pages/MySessions";
import MentorSessions from "./pages/MentorSessions";
import MentorSessionDetail from "./pages/MentorSessionDetail";
import MentorCalendar from "./pages/MentorCalendar";
import Messages from "./pages/Messages";
import MentorMessages from "./pages/MentorMessages";
import EmployeeSessionDetail from "./pages/EmployeeSessionDetail";
import Tests from "./pages/Tests";
import TakeTest from "./pages/TakeTest";
import TestResult from "./pages/TestResult";
import TestHistory from "./pages/TestHistory";
import EmployerTests from "./pages/EmployerTests";
import LearningHub from "./pages/LearningHub";
import CourseView from "./pages/CourseView";
import LessonViewer from "./pages/LessonViewer";
import MicroQuizBuilder from "./pages/MicroQuizBuilder";
import QuizTaker from "./pages/QuizTaker";
import QuizResults from "./pages/QuizResults";
import QuizStatistics from "./pages/QuizStatistics";
import QuizAttempts from "./pages/QuizAttempts";
import Certificates from "./pages/Certificates";
import CertificateDetail from "./pages/CertificateDetail";
import VerifyCertificate from "./pages/VerifyCertificate";

function App() {
  // Initialize session manager and handle auto-logout
  useEffect(() => {
    // Check session on app load
    if (!sessionManager.isLoggedIn()) {
      // Clear any stale data
      sessionManager.clearSession();
    }

    // Add click outside functionality for dropdowns
    const handleClickOutside = (event) => {
      // Close any open dropdowns when clicking outside
      const dropdowns = document.querySelectorAll("[data-dropdown]");
      dropdowns.forEach((dropdown) => {
        if (!dropdown.contains(event.target)) {
          const closeEvent = new CustomEvent("closeDropdown");
          dropdown.dispatchEvent(closeEvent);
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Router>
      <CartProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeModern />} />
            <Route path="/home-classic" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/plans" element={<Pricing />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/marketplace" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/shop/products/:id" element={<ProductDetails />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/payments/shop" element={<ShopPayments />} />
            <Route path="/orders" element={<MyPurchases />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<JobSearch />} />
            <Route path="/events" element={<Participate />} />
            <Route path="/events/:eventId" element={<UserEventDetails />} />
            <Route path="/participate" element={<Participate />} />
            <Route path="/payments" element={<UserPayments />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/ticket/:ticketId" element={<TicketDisplay />} />
            <Route path="/saved-jobs" element={<SavedJobs />} />
            {/* Tests Routes */}
            <Route path="/tests" element={<Tests />} />
            <Route path="/tests/:testId/take" element={<TakeTest />} />
            <Route path="/tests/:testId/result" element={<TestResult />} />
            <Route path="/tests/result/:resultId" element={<TestResult />} />
            <Route path="/tests/history" element={<TestHistory />} />
            {/* Learning Hub Route */}
            <Route path="/learning-hub" element={<LearningHub />} />
            <Route path="/course/:courseId" element={<CourseView />} />
            <Route path="/lesson/:lessonId" element={<LessonViewer />} />
            {/* Micro Quiz Routes */}
            <Route path="/admin/quiz/create/:lessonId" element={<MicroQuizBuilder />} />
            <Route path="/admin/quiz/edit/:quizId" element={<MicroQuizBuilder />} />
            <Route path="/admin/quiz/:quizId/stats" element={<QuizStatistics />} />
            <Route path="/admin/quiz/:quizId/attempts" element={<QuizAttempts />} />
            <Route path="/lesson/:lessonId/quiz" element={<QuizTaker />} />
            <Route path="/quiz/results/:attemptId" element={<QuizResults />} />
            {/* Certificate Routes */}
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/certificates/:certificateId" element={<CertificateDetail />} />
            <Route path="/verify-certificate" element={<VerifyCertificate />} />
            <Route path="/verify-certificate/:certificateId" element={<VerifyCertificate />} />
            {/* Internships listing page - public access */}
            <Route path="/internships" element={<Internships />} />
            <Route path="/internships/:id" element={<InternshipDetails />} />
            <Route
              path="/my-internship-applications"
              element={<MyInternshipApplications />}
            />
            <Route path="/applications" element={<MyApplications />} />
            <Route path="/my-applications" element={<MyApplications />} />
            <Route path="/interviews" element={<MyInterviews />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/user-profile" element={<UserProfile />} />

            {/* User Password Reset Routes */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Mentor Routes */}
            <Route path="/mentor/register" element={<MentorRegister />} />
            <Route path="/mentor/login" element={<MentorLogin />} />
            <Route path="/mentor/application" element={<MentorApplicationForm />} />
            <Route path="/mentor/pending" element={<MentorPending />} />
            <Route path="/mentor/dashboard" element={<MentorDashboard />} />
            <Route path="/mentor/calendar" element={<MentorCalendar />} />
            <Route path="/mentor/availability" element={<MentorAvailability />} />
            <Route path="/mentor/sessions" element={<MentorSessions />} />
            <Route path="/mentor/sessions/:sessionId" element={<MentorSessionDetail />} />

            {/* Find Mentors - Public/User */}
            <Route path="/mentors" element={<FindMentors />} />
            <Route path="/mentors/:id" element={<MentorProfileDetails />} />

            {/* Session Booking Routes */}
            <Route path="/mentors/:mentorId/book" element={<BookingPage />} />
            <Route path="/sessions/:sessionId/payment" element={<PaymentPage />} />
            <Route path="/sessions/:sessionId/confirmation" element={<BookingConfirmation />} />
            <Route path="/employee/sessions/:sessionId" element={<EmployeeSessionDetail />} />
            <Route path="/my-sessions" element={<MySessions />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/mentor/messages" element={<MentorMessages />} />

            {/* Employer Routes */}
            <Route path="/employer/register" element={<EmployerRegister />} />
            <Route path="/employer/login" element={<EmployerLogin />} />
            <Route
              path="/employer/forgot-password"
              element={<EmployerForgotPassword />}
            />
            <Route
              path="/employer/reset-password/:token"
              element={<EmployerResetPassword />}
            />
            <Route path="/employer/dashboard" element={<EmployerDashboard />} />
            <Route path="/employer/profile" element={<EmployerProfile />} />
            <Route path="/employer/events" element={<EmployerEvents />} />
            <Route
              path="/employer/events/create"
              element={<EmployerCreateEvent />}
            />
            <Route
              path="/employer/events/:eventId/edit"
              element={<EmployerEditEvent />}
            />
            <Route
              path="/employer/events/:eventId"
              element={<EmployerViewEvent />}
            />
            <Route path="/employer/post-job" element={<EmployerPostJob />} />
            <Route
              path="/employer/post-internship"
              element={<EmployerPostInternship />}
            />
            <Route
              path="/employer/internships"
              element={<EmployerInternships />}
            />
            <Route
              path="/employer/internships/:internshipId"
              element={<InternshipDetails />}
            />
            <Route
              path="/employer/internships/:internshipId/applications"
              element={<InternshipApplications />}
            />
            <Route path="/employer/my-jobs" element={<EmployerMyJobs />} />
            <Route
              path="/employer/jobs/:jobId/edit"
              element={<EmployerEditJob />}
            />
            <Route
              path="/employer/jobs/:jobId/applications"
              element={<JobApplications />}
            />
            <Route
              path="/employer/interviews"
              element={<EmployerInterviews />}
            />
            <Route
              path="/employer/notifications"
              element={<EmployerNotifications />}
            />
            <Route path="/employer/billing" element={<EmployerBilling />} />
            <Route path="/employer/tests" element={<EmployerTests />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/create-course" element={<AdminCreateCourse />} />
            <Route path="/admin/courses/:courseId" element={<AdminCourseView />} />
            <Route path="/admin/courses/:courseId/analytics" element={<AdminCourseAnalytics />} />

            <Route path="*" element={<PageNotFound />} />
          </Routes>

          {/* Toast Container for notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Layout>
      </CartProvider>
    </Router>
  );
}

export default App;

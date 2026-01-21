import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// 🏠 Ultra-Modern Home Component with Glassmorphism
const Home = () => {
  const [currentTip, setCurrentTip] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleStats, setVisibleStats] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    setAnimate(true);
    
    // Auto-rotate tips
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % jobTips.length);
    }, 4000);

    // Auto-rotate features
    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 6000);

    // Mouse tracking for interactive elements
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === statsRef.current) {
              setVisibleStats(true);
            }
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.2 }
    );

    // Observe multiple elements for scroll animations
    const scrollElements = document.querySelectorAll('.scroll-reveal');
    scrollElements.forEach(el => observer.observe(el));

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(tipInterval);
      clearInterval(featureInterval);
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  const jobTips = [
    {
      title: "Optimize Your Resume",
      description: "Tailor your resume for each job application. Use keywords from the job description and highlight relevant experience.",
      icon: "📄",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Network Effectively",
      description: "Connect with professionals in your field on LinkedIn and attend industry events to expand your network.",
      icon: "🤝",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Prepare for Interviews",
      description: "Research the company, practice common questions, and prepare thoughtful questions to ask the interviewer.",
      icon: "🎯",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Follow Up",
      description: "Send a thank-you email within 24 hours after interviews and follow up on applications after a week.",
      icon: "📧",
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Continuous Learning",
      description: "Stay updated with industry trends and consider taking online courses to enhance your skills.",
      icon: "📚",
      color: "from-red-500 to-red-600"
    }
  ];

  // Mock statistics data
  const stats = [
    { number: "50K+", label: "Active Jobs", icon: "💼", color: "from-blue-500 to-cyan-500" },
    { number: "25K+", label: "Companies", icon: "🏢", color: "from-purple-500 to-pink-500" },
    { number: "100K+", label: "Job Seekers", icon: "👥", color: "from-green-500 to-emerald-500" },
    { number: "95%", label: "Success Rate", icon: "🎯", color: "from-orange-500 to-red-500" },
  ];

  const features = [
    {
      icon: "🤖",
      title: "AI-Powered Matching",
      description: "Our advanced AI algorithm matches you with the perfect jobs based on your skills and preferences",
      color: "from-blue-400 to-purple-600",
      delay: "animation-delay-100"
    },
    {
      icon: "⚡",
      title: "Instant Applications",
      description: "Apply to multiple jobs with a single click using our smart application system",
      color: "from-green-400 to-blue-600",
      delay: "animation-delay-200"
    },
    {
      icon: "🔒",
      title: "Verified Companies",
      description: "All companies are thoroughly verified to ensure legitimate and high-quality job opportunities",
      color: "from-purple-400 to-pink-600",
      delay: "animation-delay-300"
    },
    {
      icon: "📊",
      title: "Real-time Analytics",
      description: "Track your application status and get insights to improve your job search strategy",
      color: "from-orange-400 to-red-600",
      delay: "animation-delay-400"
    },
    {
      icon: "🌐",
      title: "Global Opportunities",
      description: "Access job opportunities from companies worldwide with remote work options",
      color: "from-cyan-400 to-green-600",
      delay: "animation-delay-500"
    },
    {
      icon: "💬",
      title: "Direct Messaging",
      description: "Connect directly with recruiters and hiring managers through our built-in messaging system",
      color: "from-pink-400 to-purple-600",
      delay: "animation-delay-600"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 animate-float"></div>
      <div className="absolute top-40 right-16 w-16 h-16 bg-gradient-to-br from-pink-400 to-red-600 rotate-45 opacity-20 animate-bounce-subtle animation-delay-500"></div>
      <div className="absolute bottom-32 left-20 w-12 h-12 bg-gradient-to-br from-green-400 to-cyan-600 rounded-full opacity-30 animate-pulse-slow animation-delay-1000"></div>
      <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full opacity-25 animate-bounce-subtle animation-delay-700"></div>

      {/* Particle Effects */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${20 + i * 15}%`,
            animationDelay: `${i * 0.5}s`,
            width: `${4 + Math.random() * 4}px`,
            height: `${4 + Math.random() * 4}px`,
          }}
        ></div>
      ))}

      {/* 🏷️ Main Heading */}
      <h1 className={`text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 mb-6 ${
        animate ? 'animate-fade-in-down' : 'opacity-0'
      }`}>
        Welcome to JobZee
      </h1>

      {/* 📄 Subheading/Description */}
      <p className={`text-lg md:text-xl text-gray-700 mb-12 max-w-xl text-center leading-relaxed tracking-wide ${
        animate ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
      }`}>
        Your trusted job portal to explore top opportunities and get hired by leading companies.
      </p>

      {/* 🔗 Call-to-action Buttons: Register & Login */}
      <div className={`space-x-6 mb-16 flex justify-center ${
        animate ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
      }`}>
        <Link
          to="/register"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 hover:scale-105 transform transition duration-300 hover-lift"
          aria-label="Register"
        >
          Register
        </Link>
        <Link
          to="/login"
          className="inline-block px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-700 hover:scale-105 transform transition duration-300 hover-lift"
          aria-label="Login"
        >
          Login
        </Link>
      </div>

      {/* 💡 Features Section */}
      <section className={`max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-16 ${
        animate ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
      }`}>
        
        {/* ✅ Feature 1: Verified Employers */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300 hover-lift animate-fade-in-up animation-delay-700">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 01-8 0" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">Verified Employers</h3>
          <p className="text-gray-600 text-sm">Find jobs from trusted and verified companies only.</p>
        </div>

        {/* ✅ Feature 2: Easy Applications */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300 hover-lift animate-fade-in-up animation-delay-800">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v-6" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">Easy Applications</h3>
          <p className="text-gray-600 text-sm">Apply with a single click and track your applications easily.</p>
        </div>

        {/* ✅ Feature 3: Personalized Matches */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300 hover-lift animate-fade-in-up animation-delay-900">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">Personalized Matches</h3>
          <p className="text-gray-600 text-sm">Get job recommendations tailored to your skills and interests.</p>
        </div>
      </section>

      {/* 💡 Useful Tips Section */}
      <section className={`max-w-4xl w-full mb-16 ${
        animate ? 'animate-fade-in-up animation-delay-1000' : 'opacity-0'
      }`}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 gradient-text">
            💡 Useful Tips for Job Seekers
          </h2>
          <p className="text-gray-600">Expert advice to help you land your dream job</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 animate-pulse-slow"></div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 bg-gradient-to-r ${jobTips[currentTip].color} rounded-full flex items-center justify-center text-white text-2xl animate-bounce-slow`}>
                {jobTips[currentTip].icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{jobTips[currentTip].title}</h3>
                <p className="text-gray-600">{jobTips[currentTip].description}</p>
              </div>
            </div>
          </div>

          {/* Tip Navigation */}
          <div className="flex justify-center space-x-2">
            {jobTips.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTip(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTip 
                    ? 'bg-blue-500 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Additional Tips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-500 hover-lift">
              <h4 className="font-semibold text-blue-800 mb-2">📝 Customize Your Cover Letter</h4>
              <p className="text-sm text-blue-700">Personalize each cover letter to match the company's culture and values.</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border-l-4 border-green-500 hover-lift">
              <h4 className="font-semibold text-green-800 mb-2">🎨 Build Your Personal Brand</h4>
              <p className="text-sm text-green-700">Create a strong online presence through LinkedIn and professional portfolios.</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border-l-4 border-purple-500 hover-lift">
              <h4 className="font-semibold text-purple-800 mb-2">⏰ Set Job Search Goals</h4>
              <p className="text-sm text-purple-700">Set daily/weekly targets for applications and networking activities.</p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border-l-4 border-orange-500 hover-lift">
              <h4 className="font-semibold text-orange-800 mb-2">📊 Track Your Progress</h4>
              <p className="text-sm text-orange-700">Keep a spreadsheet of applications, interviews, and follow-ups.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 Call to Action */}
      <div className={`text-center mb-16 ${
        animate ? 'animate-fade-in-up animation-delay-1200' : 'opacity-0'
      }`}>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl hover-lift">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h3>
          <p className="text-blue-100 mb-6">Join thousands of professionals who found their dream jobs through JobZee</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/jobs"
              className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 hover:scale-105 transform transition duration-300"
            >
              Browse Jobs
            </Link>
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-lg hover:bg-green-600 hover:scale-105 transform transition duration-300"
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </div>

      {/* Spacing for footer */}
      <div className="mt-20 mb-8"></div>
    </div>
  );
};

export default Home;

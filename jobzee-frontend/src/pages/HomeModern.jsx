import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// 🚀 Ultra-Modern Home Component with Glassmorphism & Advanced Animations
const HomeModern = () => {
  const [currentTip, setCurrentTip] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleStats, setVisibleStats] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [countedStats, setCountedStats] = useState({ jobs: 0, companies: 0, users: 0, success: 0 });
  const [typedTitle, setTypedTitle] = useState("");
  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

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

    // Mouse tracking for parallax effects
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / 50,
        y: (e.clientY - window.innerHeight / 2) / 50,
      });
    };

    // Stats counter animation
    if (visibleStats) {
      const animateCounter = (target, key, duration = 2000) => {
        const start = 0;
        const end = target;
        const startTime = Date.now();

        const updateCounter = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = Math.floor(start + (end - start) * progress);

          setCountedStats(prev => ({ ...prev, [key]: current }));

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          }
        };

        updateCounter();
      };

      animateCounter(50000, 'jobs');
      animateCounter(25000, 'companies');
      animateCounter(100000, 'users');
      animateCounter(95, 'success');
    }

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

    // Observe elements for scroll animations
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
  }, [visibleStats]);

  const jobTips = [
    {
      title: "AI-Enhanced Resume Optimization",
      description: "Use AI to tailor your resume with industry-specific keywords and ATS-friendly formatting for maximum visibility.",
      imageUrl: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756234790/desonne_dekuvm.png",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Strategic Networking",
      description: "Build meaningful connections through industry events, LinkedIn engagement, and professional communities.",
      imageUrl: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756234885/destwo_eyzqlh.png",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Interview Mastery",
      description: "Practice with AI-powered mock interviews and behavioral question frameworks to ace any interview.",
      imageUrl: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756235085/Screenshot_2025-08-27_003230_qplwzk.png",
      color: "from-purple-500 to-violet-500"
    },
    {
      title: "Personal Branding",
      description: "Create a compelling professional brand across all platforms to stand out in your industry.",
      imageUrl: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756235037/Screenshot_2025-08-27_003315_jzlvrp.png",
      color: "from-orange-500 to-red-500"
    }
  ];

  const stats = [
    {
      number: countedStats.jobs > 1000 ? `${Math.floor(countedStats.jobs / 1000)}K+` : countedStats.jobs,
      label: "Active Jobs",
      icon: "💼",
      color: "from-blue-500 to-cyan-500"
    },
    {
      number: countedStats.companies > 1000 ? `${Math.floor(countedStats.companies / 1000)}K+` : countedStats.companies,
      label: "Companies",
      icon: "🏢",
      color: "from-purple-500 to-pink-500"
    },
    {
      number: countedStats.users > 1000 ? `${Math.floor(countedStats.users / 1000)}K+` : countedStats.users,
      label: "Job Seekers",
      icon: "👥",
      color: "from-green-500 to-emerald-500"
    },
    {
      number: `${countedStats.success}%`,
      label: "Success Rate",
      icon: "🎯",
      color: "from-orange-500 to-red-500"
    },
  ];

  const features = [
    {
      title: "AI-Powered Job Matching",
      description: "Advanced machine learning algorithms that understand your career goals and match you with perfect opportunities",
      color: "from-blue-400 to-purple-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-purple-50",
      imageUrl: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756235243/desfive_xbhzn4.png"
    },
    {
      title: "One-Click Applications",
      description: "Apply to multiple positions instantly with our smart application system and auto-filled profiles",
      color: "from-green-400 to-blue-600",
      bgColor: "bg-gradient-to-br from-green-50 to-blue-50",
      imageUrl: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756235423/dessix_eistky.png"
    },
    {
      title: "Verified Premium Companies",
      description: "Access exclusive opportunities from Fortune 500 companies and verified startups",
      color: "from-purple-400 to-pink-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
      imageUrl: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756235471/desseven_vimrmy.png"
    },
    {
      title: "Career Analytics Dashboard",
      description: "Track your application success rate, market trends, and career progression insights",
      color: "from-orange-400 to-red-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-red-50",
      imageUrl: "https://images.unsplash.com/photo-1551281044-8d8f1e1f4510?q=80&w=400&auto=format&fit=crop"
    },
    {
      title: "Global Remote Opportunities",
      description: "Access worldwide remote positions and international career opportunities",
      color: "from-cyan-400 to-green-600",
      bgColor: "bg-gradient-to-br from-cyan-50 to-green-50",
      imageUrl: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756235596/deseight_eeq2mp.png"
    },
    {
      title: "Direct Recruiter Chat",
      description: "Connect instantly with hiring managers and recruiters through our integrated messaging system",
      color: "from-pink-400 to-purple-600",
      bgColor: "bg-gradient-to-br from-pink-50 to-purple-50",
      imageUrl: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756235603/desnine_evawhu.png"
    }
  ];
  // Three dark feature cards content matching the reference design
  const referenceCards = [
    {
      title: "Smart Job Matching",
      subtitle: "Frontier Intelligence",
      description:
        "Powered by advanced matching models, we surface the most relevant jobs fast.",
      image: "https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Seamless Experience",
      subtitle: "Feels Familiar",
      description:
        "Import your preferences and profile in one click. Apply without the friction.",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Privacy Options",
      subtitle: "You’re in Control",
      description:
        "Enable Privacy Mode to keep your data local. Your career, your consent.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop",
    },
  ];

  // Single soft gradient background for all feature cards
  const cardGradient = 'from-indigo-500/10 via-blue-500/10 to-cyan-500/10';

  // Typing effect for tip title
  useEffect(() => {
    const fullText = jobTips[currentTip].title;
    setTypedTitle("");
    let index = 0;
    const typingInterval = setInterval(() => {
      index += 1;
      setTypedTitle(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(typingInterval);
      }
    }, 30);
    return () => clearInterval(typingInterval);
  }, [currentTip]);

  // Handlers for parallax tilt
  const handleCardMouseMove = (e, index) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6; // tilt range
    const rotateY = ((x - centerX) / centerX) * 6;
    setHoveredFeatureIndex(index);
    setTilt({ rotateX, rotateY });
  };

  const handleCardMouseLeave = () => {
    setHoveredFeatureIndex(null);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-cyan-400/20 animate-gradient-x"></div>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 25%),
              radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.15) 0%, transparent 25%),
              radial-gradient(circle at 75% 25%, rgba(34, 197, 94, 0.15) 0%, transparent 25%),
              radial-gradient(circle at 25% 75%, rgba(249, 115, 22, 0.15) 0%, transparent 25%)
            `,
            backgroundSize: '100px 100px',
            animation: 'float 20s ease-in-out infinite'
          }}
        />
      </div>

      {/* Floating 3D Elements */}
      <div
        className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-3xl opacity-20 animate-float"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg)`
        }}
      />
      <div
        className="absolute top-40 right-16 w-16 h-16 bg-gradient-to-br from-pink-400 to-red-600 rotate-45 opacity-20 animate-bounce-subtle"
        style={{
          transform: `translate(${mousePosition.x * -0.5}px, ${mousePosition.y * -0.5}px) rotate(${45 + mousePosition.x}deg)`
        }}
      />
      <div
        className="absolute bottom-32 left-20 w-12 h-12 bg-gradient-to-br from-green-400 to-cyan-600 rounded-full opacity-30 animate-pulse-slow"
        style={{
          transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">

        {/* Hero Section - Dark split card with portraits */}
        <section ref={heroRef} className="w-full max-w-7xl mx-auto mb-10">
          <div className={`relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white ${animate ? 'animate-fade-in-down' : 'opacity-0'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left: Headline, copy, CTAs */}
              <div className="px-8 sm:px-12 py-12 sm:py-16 flex flex-col justify-center">
                <div className="flex items-center space-x-2 mb-6 opacity-90">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold">JZ</span>
                  </div>
                  <span className="text-sm tracking-wider uppercase text-blue-200">JobZee</span>
                </div>
                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-tight">
                  The best jobsite
                  <br className="hidden sm:block" />
                  for your <span className="px-3 py-1 rounded-xl bg-yellow-400 text-slate-900 inline-block">future</span>
                </h1>
                <p className="mt-5 text-slate-300 text-lg max-w-xl">
                  We help you find the best job to build your future and grow your career with trusted companies worldwide.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/register"
                    className="px-7 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 font-semibold shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition"
                  >
                    Get it now
                  </Link>
                  <Link
                    to="/login"
                    className="px-7 py-3 rounded-xl border border-white/20 font-semibold text-slate-100 hover:bg-white/10 transition"
                  >
                    Learn more →
                  </Link>
                  <Link
                    to="/mentor/register"
                    className="px-7 py-3 rounded-xl bg-purple-100 text-purple-900 font-bold shadow-lg hover:bg-purple-200 hover:scale-[1.02] transition"
                  >
                    Become a Mentor
                  </Link>
                </div>

                {/* Sponsor strip */}
                <div className="mt-10">
                  <p className="text-sm text-slate-400 mb-3">Supported by 3k+ companies</p>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4 opacity-90">
                    <span className="text-slate-300/90 font-semibold">Meta</span>
                    <span className="text-slate-300/90 font-semibold">Google</span>
                    <span className="text-slate-300/90 font-semibold">LinkedIn</span>
                    <span className="text-slate-300/90 font-semibold">Slack</span>
                    <Link 
                      to="/verify-certificate"
                      className="text-blue-300 font-semibold hover:text-blue-200 transition-colors duration-200 flex items-center gap-1.5"
                    >
                      🔍 Verify Certificate
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right: Portraits with concentric rings */}
              <div className="relative px-8 sm:px-12 py-16 lg:py-0 min-h-[380px] flex items-center justify-center">
                {/* Concentric rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-64 h-64 rounded-full border border-white/10"></div>
                  <div className="absolute w-80 h-80 rounded-full border border-white/10"></div>
                  <div className="absolute w-96 h-96 rounded-full border border-white/10"></div>
                </div>
                {/* Portrait cards */}
                <div className="relative w-full max-w-md">
                  <img
                    src="https://res.cloudinary.com/dxspcarx8/image/upload/v1762845192/vxkddtbawkout8pdvb2b.jpg"
                    alt="Portrait 1"
                    className="absolute -top-6 right-2 w-28 h-36 object-cover rounded-3xl shadow-2xl border border-white/10"
                  />
                  <img
                    src="https://res.cloudinary.com/dxspcarx8/image/upload/v1756233548/Screenshot_2025-08-27_000846_tosgf7.png"
                    alt="Portrait 2"
                    className="absolute bottom-4 right-10 w-28 h-36 object-cover rounded-3xl shadow-2xl border border-white/10"
                  />
                  <img
                    src="https://res.cloudinary.com/dxspcarx8/image/upload/v1756233661/Screenshot_2025-08-27_001042_xmsi2f.png"
                    alt="Portrait 3"
                    className="absolute top-10 left-6 w-28 h-28 object-cover rounded-full shadow-2xl border-4 border-slate-900"
                  />
                  <img
                    src="https://res.cloudinary.com/dxspcarx8/image/upload/v1756233914/Screenshot_2025-08-27_001451_sr2ihr.png"
                    alt="Portrait 4"
                    className="absolute bottom-12 left-2 w-28 h-28 object-cover rounded-full shadow-2xl border-4 border-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Slim stats bar below hero */}
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-slate-800 to-indigo-900 text-blue-100 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-8 py-6 text-center">
              <div>
                <div className="text-3xl font-extrabold">1.9K+</div>
                <div className="text-sm text-blue-200/80">Ready Job Vacancy</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold">276K+</div>
                <div className="text-sm text-blue-200/80">Job Seekers Active</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold">3.4K+</div>
                <div className="text-sm text-blue-200/80">Incorporated Company</div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats cards section removed as per request */}

        {/* Reference three-card dark grid */}
        <section className="scroll-reveal w-full max-w-7xl mx-auto mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {referenceCards.map((card, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 border border-white/10 overflow-hidden ${animate ? 'animate-fade-in-up' : 'opacity-0'}`}
              >
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{card.subtitle}</h3>
                  <h4 className="text-xl font-semibold text-white mb-3">{card.title}</h4>
                  <p className="text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                <div className="px-8 pb-8">
                  <div className="relative h-40 rounded-xl bg-slate-800/60 border border-white/10 overflow-hidden">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-slate-900/20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tips Section with Interactive Cards */
        /* Replaces emoji with job-related image and adds typing title effect */}
        <section className="scroll-reveal w-full max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              💡 Career Success Tips
            </h2>
            <p className="text-xl text-gray-600">
              Expert insights to accelerate your career journey
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-2xl shadow-black/40">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-transparent to-slate-900/40" />
              <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 blur-xl" />
            </div>

            <div className="relative z-10 p-8 md:p-12">
              {/* Current Tip Display */}
              <div className="flex flex-col md:flex-row items-center gap-10 mb-10">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-r ${jobTips[currentTip].color} flex items-center justify-center overflow-hidden shadow-2xl`}>
                  <img
                    src={jobTips[currentTip].imageUrl}
                    alt={jobTips[currentTip].title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
                    {typedTitle}
                  </h3>
                  <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
                    {jobTips[currentTip].description}
                  </p>
                </div>
              </div>

              {/* Tip Navigation */}
              <div className="flex justify-center space-x-3">
                {jobTips.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTip(index)}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ring-1 ring-white/10 ${index === currentTip
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-125 shadow-lg shadow-blue-900/40'
                      : 'bg-slate-700/80 hover:bg-slate-600 hover:scale-110'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="scroll-reveal w-full max-w-4xl mx-auto text-center">
          <div className="relative">
            {/* Photo background with overlay */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                backgroundImage: "url('https://res.cloudinary.com/dxspcarx8/image/upload/v1756234202/Screenshot_2025-08-27_001943_m7cybz.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-black/55 via-black/35 to-black/55"></div>

            <div className="relative glass-card p-12 rounded-3xl border border-white/10 bg-white/5">
              <h3 className="text-4xl font-extrabold mb-4 text-white drop-shadow-md">
                🚀 Ready to Transform Your Career?
              </h3>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join over 100,000 professionals who found their dream jobs through our AI-powered platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <div className="relative">
                  <Link
                    to="/jobs"
                    className="btn-liquid text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 block"
                  >
                    🔍 Explore Jobs
                  </Link>
                  {/* Hidden Admin Link */}
                  <Link
                    to="/admin/login"
                    className="absolute -bottom-8 left-0 right-0 text-[10px] text-black/30 hover:text-black/50 transition-colors duration-300 inline-flex items-center justify-center gap-1 opacity-40 hover:opacity-70"
                    style={{ textShadow: '0 0 2px rgba(0,0,0,0.1)' }}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="tracking-tight">Admin Access</span>
                  </Link>
                </div>
                <Link
                  to="/register"
                  className="btn-magnetic px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-green-500/25 hover:scale-105 transition-all duration-300"
                >
                  🎯 Get Started Free
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomeModern;

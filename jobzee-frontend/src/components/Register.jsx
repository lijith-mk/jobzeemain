import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GoogleSignIn from './GoogleSignIn';
import { validateEmail, validatePhone, validatePassword, validateName } from '../utils/validationUtils';
import API_BASE_URL from '../config/api';
import '../animations/registerAnimations.css';

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [fieldStates, setFieldStates] = useState({}); // For storing validation suggestions and info
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const validateField = (fieldName, value, onFocus = false) => {
    let result;
    
    switch (fieldName) {
      case 'name':
        result = validateName(value, { minLength: 2, maxLength: 50 });
        break;
      
      case 'email':
        result = validateEmail(value);
        break;
      
      case 'phone':
        // Extract phone number without country code for validation
        let cleanPhone = value;
        if (value.startsWith('91') && value.length > 10) {
          cleanPhone = '+' + value;
        }
        result = validatePhone(cleanPhone, { region: 'IN', requireCountryCode: false });
        break;
      
      case 'password':
        result = validatePassword(value);
        break;
      
      case 'confirmPassword':
        result = {
          isValid: value === form.password && value.length > 0,
          errors: value === form.password && value.length > 0 ? [] : ['Passwords do not match']
        };
        break;
      
      default:
        result = { isValid: true, errors: [] };
    }
    
    return result;
  };

  useEffect(() => {
    const newErrors = {};
    const newFieldStates = {};
    let allFieldsValid = true;
    
    Object.keys(form).forEach(fieldName => {
      const validation = validateField(fieldName, form[fieldName]);
      newFieldStates[fieldName] = validation;
      
      if (!validation.isValid) {
        newErrors[fieldName] = validation.errors[0]; // Show first error
        allFieldsValid = false;
      }
    });
    
    setErrors(newErrors);
    setFieldStates(newFieldStates);
    // Check that all fields have non-empty trimmed values
    setIsValid(allFieldsValid && Object.values(form).every(x => x && x.trim() !== ""));
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Prevent leading spaces for all text fields
    if (name === 'name' || name === 'email') {
      const trimmedValue = value.trimStart();
      setForm({ ...form, [name]: trimmedValue });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = (fieldName) => {
    setFocusedField(null);
    // Trim the value before validation for name field
    let valueToValidate = form[fieldName];
    if (fieldName === 'name' && valueToValidate) {
      const trimmedValue = valueToValidate.trim();
      if (trimmedValue !== valueToValidate) {
        setForm(prev => ({ ...prev, [fieldName]: trimmedValue }));
        valueToValidate = trimmedValue;
      }
    }
    
    // Trigger validation on blur
    const validation = validateField(fieldName, valueToValidate);
    setFieldStates(prev => ({ ...prev, [fieldName]: validation }));
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [fieldName]: validation.errors[0] }));
    } else {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const handlePhoneChange = (value) => {
    setForm({ ...form, phone: value });
  };

  const getFieldIcon = (fieldName, isValid) => {
    if (!form[fieldName]) return null;
    
    return isValid ? (
      <svg className="w-5 h-5 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-red-500 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  };

  const renderFieldHelp = (fieldName) => {
    const fieldState = fieldStates[fieldName];
    if (!fieldState || !focusedField === fieldName) return null;

    if (fieldName === 'phone' && fieldState.provider) {
      return (
        <div className="mt-1 text-xs text-blue-600">
          📱 Provider: {fieldState.provider} | Format: +91 XXXXXXXXXX
        </div>
      );
    }

    if (fieldName === 'password' && fieldState.strength !== undefined) {
      const strength = fieldState.strength;
      const strengthText = strength < 40 ? 'Weak' : strength < 70 ? 'Medium' : 'Strong';
      const strengthColor = strength < 40 ? 'text-red-500' : strength < 70 ? 'text-yellow-500' : 'text-green-500';
      
      return (
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Password Strength</span>
            <span className={strengthColor}>{strengthText}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${strengthColor.includes('red') ? 'bg-red-500' : strengthColor.includes('yellow') ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${strength}%` }}
            ></div>
          </div>
          {fieldState.suggestions && fieldState.suggestions.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              💡 {fieldState.suggestions[0]}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration successful!");
        setForm({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        // Handle different types of errors
        if (data.errors) {
          // Backend validation errors
          Object.keys(data.errors).forEach(field => {
            toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${data.errors[field]}`);
          });
        } else {
          toast.error(data.message || "Registration failed.");
        }
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
      console.error("Register error:", error);
    }

    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#F8FAFF] bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.10),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(34,197,94,0.10),transparent_35%),radial-gradient(circle_at_20%_90%,rgba(124,58,237,0.10),transparent_35%)]">
      {/* Background subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to_right, rgba(37,99,235,0.08) 1px, transparent 1px), linear-gradient(to_bottom, rgba(37,99,235,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      ></div>

      {/* Left Side - Brand/benefits panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-1/2 px-10 py-12 justify-center items-center">
        <div className="relative w-full max-w-md overflow-hidden rounded-4xl shadow-2xl hover-lift">
          {/* Animated gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-indigo-600 to-fuchsia-600 animate-gradient"></div>
          {/* Soft noise/pattern overlay */}
          <div className="absolute inset-0 opacity-15" style={{backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "14px 14px", color: "#ffffff"}}></div>

          <div className="relative p-9 text-white">
            {/* Illustration */}
            <div className="flex justify-center mb-7">
              <svg viewBox="0 0 400 200" className="w-full max-w-xs tech-element animate-fade-in-up">
                <g fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="30" y="70" width="130" height="80" rx="14" fill="rgba(255,255,255,0.08)"/>
                  <path d="M50 70v-8a14 14 0 0 1 14-14h62a14 14 0 0 1 14 14v8"/>
                  <path d="M30 106h130"/>
                  <circle cx="230" cy="120" r="22" fill="rgba(255,255,255,0.08)"/>
                  <path d="M246 136l26 26"/>
                  <rect x="210" y="40" width="150" height="100" rx="12" fill="rgba(255,255,255,0.08)"/>
                  <circle cx="246" cy="70" r="10"/>
                  <path d="M270 70h64M224 96h112M224 116h86"/>
                </g>
              </svg>
            </div>

            <h3 className="text-3xl font-semibold tracking-tight mb-3">Level up your career</h3>
            <p className="text-white/85 mb-6">Create a standout profile and get matched to opportunities that matter.</p>

            <ul className="space-y-3">
              <li className="group flex items-start">
                <span className="mt-0.5 mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <p className="text-white/95">Polished profile with smart suggestions</p>
              </li>
              <li className="group flex items-start">
                <span className="mt-0.5 mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <p className="text-white/95">Personalised job alerts from verified employers</p>
              </li>
              <li className="group flex items-start">
                <span className="mt-0.5 mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <p className="text-white/95">Track applications and grow faster</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-200"
          noValidate
        >
        <h2 className="text-3xl font-bold mb-2 text-center text-slate-900 tracking-tight">Sign Up</h2>
        <p className="text-center text-slate-600 mb-6">Create your JobZee account</p>

        {/* Name */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-slate-700" htmlFor="name">
            <span className="flex items-center">
              👤 Full Name *
            </span>
          </label>
          <div className="relative">
            <input
              className={`w-full border-2 rounded-lg px-4 py-3 pr-12 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.name ? "border-red-300 bg-red-50" : fieldStates.name?.isValid ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-blue-400"
              }`}
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              onFocus={() => handleFocus('name')}
              onBlur={() => handleBlur('name')}
              placeholder="Enter your full name"
            />
            {getFieldIcon('name', fieldStates.name?.isValid)}
          </div>
          {errors.name && (
            <div className="flex items-center mt-2 text-red-300 text-sm animate-fade-in-up">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.name}
            </div>
          )}
        </div>

        {/* Email */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-slate-700" htmlFor="email">
            <span className="flex items-center">
              📧 Email Address *
            </span>
          </label>
          <div className="relative">
            <input
              className={`w-full border-2 rounded-lg px-4 py-3 pr-12 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.email ? "border-red-300 bg-red-50" : fieldStates.email?.isValid ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-blue-400"
              }`}
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onFocus={() => handleFocus('email')}
              onBlur={() => handleBlur('email')}
              placeholder="Enter your email address"
            />
            {getFieldIcon('email', fieldStates.email?.isValid)}
          </div>
          {errors.email && (
            <div className="flex items-center mt-2 text-red-300 text-sm animate-fade-in-up">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.email}
            </div>
          )}
          {fieldStates.email?.suggestions && fieldStates.email.suggestions.length > 0 && (
            <div className="mt-1 text-xs text-slate-600">
              💡 Did you mean: {fieldStates.email.suggestions[0]}?
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-slate-700">
            <span className="flex items-center">
              📱 Phone Number *
              <span className="ml-2 text-xs text-gray-500 font-normal">(India +91)</span>
            </span>
          </label>
          <div className="relative">
            <PhoneInput
              country={"in"}
              value={form.phone}
              onChange={handlePhoneChange}
              onFocus={() => handleFocus('phone')}
              onBlur={() => handleBlur('phone')}
              inputClass="w-full"
              containerClass="w-full"
              inputStyle={{
                width: "100%",
                padding: "12px 14px",
                paddingLeft: "60px",
                borderRadius: "0.5rem",
                border: `2px solid ${errors.phone ? "#fca5a5" : fieldStates.phone?.isValid ? "#34d399" : "#d1d5db"}`,
                backgroundColor: "#ffffff",
                color: "#111827",
                fontSize: "16px"
              }}
              buttonStyle={{
                border: "none",
                borderRight: "1px solid #d1d5db",
                borderRadius: "0.5rem 0 0 0.5rem",
                backgroundColor: "#f9fafb"
              }}
            />
          </div>
          {errors.phone && (
            <div className="flex items-center mt-2 text-red-300 text-sm animate-fade-in-up">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.phone}
            </div>
          )}
          {renderFieldHelp('phone')}
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-slate-700" htmlFor="password">
            <span className="flex items-center">
              🔒 Password *
            </span>
          </label>
          
          {/* Password Requirements */}
          <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-700 font-medium mb-2">Password Requirements:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                At least 8 characters
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                One uppercase letter (A-Z)
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                One lowercase letter (a-z)
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                One number (0-9)
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                One special character (@$!%*?&)
              </div>
            </div>
          </div>
          
          <div className="relative">
            <input
              className={`w-full border-2 rounded-lg px-4 py-3 pr-12 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.password ? "border-red-300 bg-red-50" : fieldStates.password?.isValid ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-blue-400"
              }`}
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
              placeholder="Create a strong password"
            />
            {getFieldIcon('password', fieldStates.password?.isValid)}
          </div>
          {errors.password && (
            <div className="flex items-center mt-2 text-red-300 text-sm animate-fade-in-up">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.password}
            </div>
          )}
          {renderFieldHelp('password')}
          
          {/* Password Tip */}
          <div className="mt-2 text-xs text-slate-600">
            💡 <strong>Tip:</strong> Use a mix of letters, numbers, and symbols for a strong password
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-8">
          <label className="block mb-2 font-semibold text-slate-700" htmlFor="confirmPassword">
            <span className="flex items-center">
              🔐 Confirm Password *
            </span>
          </label>
          <div className="relative">
            <input
              className={`w-full border-2 rounded-lg px-4 py-3 pr-12 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.confirmPassword ? "border-red-300 bg-red-50" : fieldStates.confirmPassword?.isValid ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-blue-400"
              }`}
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              onFocus={() => handleFocus('confirmPassword')}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="Confirm your password"
            />
            {getFieldIcon('confirmPassword', fieldStates.confirmPassword?.isValid)}
          </div>
          {errors.confirmPassword && (
            <div className="flex items-center mt-2 text-red-300 text-sm animate-fade-in-up">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || loading}
          className={`w-full py-3 rounded-lg text-white font-semibold transition ${isValid && !loading ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg" : "bg-slate-400 cursor-not-allowed"}`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <div className="mt-4 text-center">
          <p className="text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Login here
            </Link>
          </p>
        </div>

        {/* Social Registration Options */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-slate-600">Or register with</span>
            </div>
          </div>
          <div className="mt-4">
            <GoogleSignIn 
              disabled={loading}
              onSuccess={(data) => {
                console.log('Google registration successful:', data.user.email);
                toast.success(`Welcome ${data.user.name}! Account created with Google.`);
                // Navigation is handled by the GoogleSignIn component
              }}
              onError={(error) => {
                console.error('Google registration error:', error);
                toast.error('Google registration failed. Please try again.');
              }}
            />
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={3000} />
      </form>
      </div>
    </div>
  );
};

export default Register;

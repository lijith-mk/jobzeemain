import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { validateEmail, validatePhone, validatePassword, validateZipCode, normalizeCountryToISO, getZipExampleForCountry, validateName } from '../utils/validationUtils';

import API_BASE_URL from '../config/api';
const EmployerRegister = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || "";
  
  const [formData, setFormData] = useState({
    // Company Basic Info
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    password: "",
    confirmPassword: "",
    image: null,
    // Contact Person
    contactPersonName: "",
    contactPersonTitle: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    
    // Company Details
    industry: "",
    companySize: "",
    foundedYear: "",
    website: "",
    
    // Headquarters
    headquarters: {
      address: "",
      city: "",
      state: "",
      country: "",
      zipCode: ""
    }
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Location autocomplete (Mapbox) state
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Company name validation: Required, length, allowed characters, no emojis/special symbols
  const validateCompanyName = (raw) => {
    const value = String(raw || '').trim();
    if (!value) {
      return { isValid: false, error: 'Company name is required' };
    }
    if (value.length < 2) {
      return { isValid: false, error: 'Company name must be at least 2 characters' };
    }
    if (value.length > 150) {
      return { isValid: false, error: 'Company name cannot exceed 150 characters' };
    }
    // Allow letters, numbers, space, &, ., -, , (comma)
    const allowedCharsRegex = /^[A-Za-z0-9&.\-,\s]+$/;
    if (!allowedCharsRegex.test(value)) {
      return { isValid: false, error: 'Only letters, numbers, spaces, &, ., -, , are allowed' };
    }
    return { isValid: true, error: '' };
  };

  // Contact person title validation: required, 2-100 chars, simple allowed chars
  const validateContactTitle = (raw) => {
    const value = String(raw || '').trim();
    if (!value) return { isValid: false, error: 'Contact person title is required' };
    if (value.length < 2) return { isValid: false, error: 'Title must be at least 2 characters' };
    if (value.length > 100) return { isValid: false, error: 'Title cannot exceed 100 characters' };
    // Allow letters, numbers, spaces and basic punctuation .,-&
    const allowed = /^[A-Za-z0-9&.\-\s]+$/;
    if (!allowed.test(value)) return { isValid: false, error: 'Only letters, numbers, spaces, ., -, & are allowed' };
    return { isValid: true, error: '' };
  };

  // Allow only digits with optional leading '+' for phone inputs
  const isPhoneCharsValid = (value) => {
    return /^\+?\d*$/.test(String(value || ''));
  };

  // Email helpers
  const normalizeEmail = (raw) => String(raw || '').trim().toLowerCase();
  const validateCompanyEmail = (raw) => {
    const value = normalizeEmail(raw);
    if (!value) return { isValid: false, error: 'Email is required' };
    const v = validateEmail(value, { requireCorporateDomain: false });
    return { isValid: v.isValid, error: v.isValid ? '' : v.errors[0] };
  };

  // Phone helpers: normalize and validate per requirements
  const normalizePhone = (raw) => String(raw || '').replace(/[\s\-().]/g, '');

  const validateCompanyPhone = (rawValue, country) => {
    const value = normalizePhone(rawValue);
    if (!value || !value.trim()) {
      return { isValid: false, error: 'Company phone is required' };
    }
    if (!/^\+?\d+$/.test(value)) {
      return { isValid: false, error: 'Only digits are allowed (optional leading +)' };
    }
    const region = (normalizeCountryToISO(country) || 'IN').toUpperCase();

    if (region === 'IN') {
      let local = value;
      if (local.startsWith('+91')) local = local.slice(3);
      else if (local.startsWith('91') && local.length === 12) local = local.slice(2);
      else if (local.startsWith('0')) local = local.slice(1);

      if (!/^\d{10}$/.test(local)) {
        return { isValid: false, error: 'Indian mobile must be exactly 10 digits' };
      }
      if (!/^[6-9]/.test(local)) {
        return { isValid: false, error: 'Indian mobile must start with 6–9' };
      }
      return { isValid: true, error: '' };
    }

    // International E.164 format
    if (!/^\+[1-9]\d{6,14}$/.test(value)) {
      return { isValid: false, error: 'Use E.164 format: + country code and number (max 15)' };
    }
    return { isValid: true, error: '' };
  };

  useEffect(() => {
    setAnimate(true);
  }, []);

  const steps = [
    {
      title: "Company Information",
      description: "Tell us about your company",
      icon: "🏢"
    },
    {
      title: "Contact Details",
      description: "Primary contact information",
      icon: "👤"
    },
    {
      title: "Company Profile",
      description: "Company size and industry",
      icon: "📊"
    },
    {
      title: "Location",
      description: "Company headquarters",
      icon: "📍"
    }
  ];

  const industries = [
    "Technology", "Finance", "Healthcare", "Education", "Retail",
    "Manufacturing", "Consulting", "Marketing", "Real Estate",
    "Hospitality", "Transportation", "Energy", "Media", "Other"
  ];

  const companySizes = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1000+", label: "1000+ employees" }
  ];

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0:
        // Company name validation - check for space-only input
        const trimmedCompanyName = formData.companyName.trim();
        if (!trimmedCompanyName) {
          newErrors.companyName = "Company name is required";
        } else if (trimmedCompanyName.length < 2) {
          newErrors.companyName = "Company name must be at least 2 characters";
        }
        
        // Company email validation + duplicate against contact email
        const trimmedCompanyEmail = formData.companyEmail.trim();
        if (!trimmedCompanyEmail) {
          newErrors.companyEmail = "Company email is required";
        } else {
          const v = validateCompanyEmail(trimmedCompanyEmail);
          if (!v.isValid) newErrors.companyEmail = v.error;
          const a = normalizeEmail(trimmedCompanyEmail);
          const b = normalizeEmail(formData.contactPersonEmail);
          if (!newErrors.companyEmail && a && b && a === b) {
            newErrors.companyEmail = 'This email is already used in another field';
          }
        }
        
        // Enhanced phone validation using utility
        const trimmedCompanyPhone = formData.companyPhone.trim();
        if (!trimmedCompanyPhone) {
          newErrors.companyPhone = "Company phone is required";
        } else {
          if (!isPhoneCharsValid(trimmedCompanyPhone)) {
            newErrors.companyPhone = "Only digits are allowed (optional leading +)";
            break;
          }
          const phoneValidation = validatePhone(trimmedCompanyPhone, {
            region: 'IN',
            requireCountryCode: true
          });
          if (!phoneValidation.isValid) {
            newErrors.companyPhone = phoneValidation.errors[0];
          }
        }
        
        // Enhanced password validation using utility
        if (!formData.password) {
          newErrors.password = "Password is required";
        } else {
          const passwordValidation = validatePassword(formData.password);
          if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.errors[0];
          }
        }
        
        // Confirm password validation
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords don't match";
        }
        break;

      case 1:
        const trimmedContactPersonName = formData.contactPersonName.trim();
        if (!trimmedContactPersonName) newErrors.contactPersonName = "Contact person name is required";
        else {
          const nameValidation = validateName(trimmedContactPersonName);
          if (!nameValidation.isValid) newErrors.contactPersonName = nameValidation.errors[0];
        }
        
        const trimmedContactPersonTitle = formData.contactPersonTitle.trim();
        if (!trimmedContactPersonTitle) newErrors.contactPersonTitle = "Contact person title is required";
        else {
          const v = validateContactTitle(trimmedContactPersonTitle);
          if (!v.isValid) newErrors.contactPersonTitle = v.error;
        }
        
        const trimmedContactPersonEmail = formData.contactPersonEmail.trim();
        if (!trimmedContactPersonEmail) newErrors.contactPersonEmail = "Contact person email is required";
        else {
          const v = validateCompanyEmail(trimmedContactPersonEmail);
          if (!v.isValid) newErrors.contactPersonEmail = v.error;
          const a = normalizeEmail(trimmedContactPersonEmail);
          const b = normalizeEmail(formData.companyEmail);
          if (!newErrors.contactPersonEmail && a && b && a === b) {
            newErrors.contactPersonEmail = 'This email is already used in another field';
          }
        }
        
        const trimmedContactPersonPhone = formData.contactPersonPhone.trim();
        if (!trimmedContactPersonPhone) newErrors.contactPersonPhone = "Contact person phone is required";
        else {
          if (!isPhoneCharsValid(trimmedContactPersonPhone)) {
            newErrors.contactPersonPhone = "Only digits are allowed (optional leading +)";
            break;
          }
          const region = normalizeCountryToISO(formData.headquarters.country) || 'IN';
          const cPhone = validatePhone(trimmedContactPersonPhone, { region, requireCountryCode: true });
          if (!cPhone.isValid) newErrors.contactPersonPhone = cPhone.errors[0];
        }
        break;

      case 2:
        if (!formData.industry) newErrors.industry = "Industry is required";
        if (!formData.companySize) newErrors.companySize = "Company size is required";
        // Founded Year: required, digits only, 4 digits, not exceed current year
        {
          const yearStr = String(formData.foundedYear || '').trim();
          const currentYear = new Date().getFullYear();
          if (!yearStr) {
            newErrors.foundedYear = "Founded year is required";
          } else if (!/^\d+$/.test(yearStr)) {
            newErrors.foundedYear = "Year must be numeric digits only";
          } else if (!/^\d{4}$/.test(yearStr)) {
            newErrors.foundedYear = "Enter a 4-digit year";
          } else if (Number(yearStr) > currentYear) {
            newErrors.foundedYear = "Year cannot exceed current year";
          }
        }
        break;

      case 3:
        const trimmedAddress = formData.headquarters.address.trim();
        const trimmedCity = formData.headquarters.city.trim();
        const trimmedState = formData.headquarters.state.trim();
        const trimmedCountry = formData.headquarters.country.trim();
        const trimmedZipCode = String(formData.headquarters.zipCode).trim();
        
        if (!trimmedAddress) newErrors.address = "Address is required";
        if (!trimmedCity) newErrors.city = "City is required";
        if (!trimmedState) newErrors.state = "State is required";
        if (!trimmedCountry) newErrors.country = "Country is required";
        if (!trimmedZipCode) {
          newErrors.zipCode = "ZIP/Postal code is required";
        } else {
          const countryCode = normalizeCountryToISO(trimmedCountry) || '';
          const zipVal = validateZipCode(trimmedZipCode, countryCode);
          if (!zipVal.isValid) newErrors.zipCode = zipVal.errors[0];
        }
        break;
    }

    return newErrors;
  };

  const handleInputChange = (field, value) => {
    // Prevent leading spaces for text fields
    const textFields = ['companyName', 'contactPersonName', 'contactPersonTitle', 'companyEmail', 'contactPersonEmail', 'website', 'headquarters.address', 'headquarters.city', 'headquarters.state', 'headquarters.country', 'headquarters.zipCode'];
    const processedValue = textFields.includes(field) ? value.trimStart() : value;
    
    // Early character-level validation for phone fields
    if (field === 'companyPhone' || field === 'contactPersonPhone') {
      if (!isPhoneCharsValid(processedValue)) {
        setErrors(prev => ({ ...prev, [field]: 'Only digits are allowed (optional leading +)' }));
      } else if (errors[field] && errors[field] === 'Only digits are allowed (optional leading +)') {
        // Clear this specific error if characters become valid; other errors will be set by blur/step
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: processedValue
        }
      }));
    } else {
      // For companyName, do not allow disallowed characters live and clear related errors real-time
      if (field === 'companyName') {
        const nextVal = processedValue;
        setFormData(prev => ({ ...prev, [field]: nextVal }));
        const v = validateCompanyName(nextVal);
        setErrors(prev => ({ ...prev, companyName: v.isValid ? '' : v.error }));
      } else if (field === 'password') {
        const nextVal = processedValue;
        setFormData(prev => ({ ...prev, password: nextVal }));
        const v = validatePassword(nextVal);
        setErrors(prev => ({ ...prev, password: v.isValid ? '' : v.errors[0] }));
        // Also re-validate confirm password if filled
        if (formData.confirmPassword) {
          const match = nextVal.length > 0 && nextVal === formData.confirmPassword;
          setErrors(prev => ({ ...prev, confirmPassword: match ? '' : 'Passwords do not match' }));
        }
      } else if (field === 'confirmPassword') {
        const nextVal = processedValue;
        setFormData(prev => ({ ...prev, confirmPassword: nextVal }));
        const match = nextVal.length > 0 && nextVal === formData.password;
        setErrors(prev => ({ ...prev, confirmPassword: match ? '' : 'Passwords do not match' }));
      } else if (field === 'companyPhone') {
        const nextVal = processedValue;
        setFormData(prev => ({ ...prev, companyPhone: nextVal }));
        const v = validateCompanyPhone(nextVal, formData.headquarters.country);
        let err = v.isValid ? '' : v.error;
        const a = normalizePhone(nextVal);
        const b = normalizePhone(formData.contactPersonPhone);
        if (!err && a && b && a === b) err = 'This phone number is already used in another field';
        setErrors(prev => ({ ...prev, companyPhone: err }));
      } else if (field === 'contactPersonPhone') {
        const nextVal = processedValue;
        setFormData(prev => ({ ...prev, contactPersonPhone: nextVal }));
        const v = validateCompanyPhone(nextVal, formData.headquarters.country);
        let err = v.isValid ? '' : v.error;
        const a = normalizePhone(formData.companyPhone);
        const b = normalizePhone(nextVal);
        if (!err && a && b && a === b) err = 'This phone number is already used in another field';
        setErrors(prev => ({ ...prev, contactPersonPhone: err }));
      } else if (field === 'contactPersonTitle') {
        const nextVal = processedValue;
        setFormData(prev => ({ ...prev, contactPersonTitle: nextVal }));
        const v = validateContactTitle(nextVal);
        setErrors(prev => ({ ...prev, contactPersonTitle: v.isValid ? '' : v.error }));
      } else {
        setFormData(prev => ({ ...prev, [field]: processedValue }));
      }
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFocus = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field.includes('.')
      ? field.split('.').reduce((acc, key) => acc && acc[key], formData)
      : formData[field];
    if (field === 'companyName') {
      const v = validateCompanyName(value);
      setErrors(prev => ({ ...prev, companyName: v.isValid ? '' : v.error }));
    } else if (field === 'contactPersonTitle') {
      const v = validateContactTitle(value);
      setErrors(prev => ({ ...prev, contactPersonTitle: v.isValid ? '' : v.error }));
    } else if (field === 'password') {
      const v = validatePassword(value);
      setErrors(prev => ({ ...prev, password: v.isValid ? '' : v.errors[0] }));
    } else if (field === 'confirmPassword') {
      const match = String(value || '').length > 0 && String(value) === String(formData.password || '');
      setErrors(prev => ({ ...prev, confirmPassword: match ? '' : 'Passwords do not match' }));
    } else if (field === 'companyEmail') {
      const v = validateCompanyEmail(value);
      let err = v.isValid ? '' : v.error;
      const a = normalizeEmail(value);
      const b = normalizeEmail(formData.contactPersonEmail);
      if (!err && a && b && a === b) err = 'This email is already used in another field';
      setErrors(prev => ({ ...prev, companyEmail: err }));
    } else if (field === 'contactPersonEmail') {
      const v = validateCompanyEmail(value);
      let err = v.isValid ? '' : v.error;
      const a = normalizeEmail(value);
      const b = normalizeEmail(formData.companyEmail);
      if (!err && a && b && a === b) err = 'This email is already used in another field';
      setErrors(prev => ({ ...prev, contactPersonEmail: err }));
    } else if (field === 'companyPhone') {
      const v = validateCompanyPhone(value, formData.headquarters.country);
      setErrors(prev => ({ ...prev, companyPhone: v.isValid ? '' : v.error }));
    } else if (field === 'contactPersonPhone') {
      const v = validateCompanyPhone(value, formData.headquarters.country);
      setErrors(prev => ({ ...prev, contactPersonPhone: v.isValid ? '' : v.error }));
    } else {
      if (!String(value || '').trim()) {
        setErrors(prev => ({ ...prev, [field.includes('.') ? field.split('.')[1] : field]: 'This field is required' }));
      }
    }
  };

  const handleBlur = (field) => {
    // Field-level validation on blur
    const key = field.includes('.') ? field.split('.')[1] : field;
    let message = '';
    const getValue = () => field.includes('.')
      ? field.split('.').reduce((acc, k) => acc && acc[k], formData)
      : formData[field];
    let value = String(getValue() || '').trim();

    // Trim text fields and re-validate on blur
    const textFields = ['companyName', 'contactPersonName', 'contactPersonTitle', 'companyEmail', 'contactPersonEmail', 'website', 'headquarters.address', 'headquarters.city', 'headquarters.state', 'headquarters.country', 'headquarters.zipCode'];
    if (textFields.includes(field)) {
      const currentValue = getValue();
      if (currentValue !== value) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          setFormData(prev => ({
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: value
            }
          }));
        } else {
          setFormData(prev => ({ ...prev, [field]: value }));
        }
      }
    }

    // Special handling for companyName
    if (field === 'companyName') {
      const v = validateCompanyName(value);
      message = v.isValid ? '' : v.error;
    }

    switch (field) {
      case 'companyEmail': {
        const v = validateCompanyEmail(value);
        message = v.isValid ? '' : v.error;
        // Duplicate within form against contactPersonEmail
        if (!message) {
          const a = normalizeEmail(value);
          const b = normalizeEmail(formData.contactPersonEmail);
          if (a && b && a === b) message = 'This email is already used in another field';
        }
        break;
      }
      case 'password': {
        const v = validatePassword(value);
        message = v.isValid ? '' : v.errors[0];
        break;
      }
      case 'confirmPassword': {
        if (!value) {
          message = 'Please confirm your password';
          break;
        }
        const match = value === String(formData.password || '');
        message = match ? '' : "Passwords don't match";
        break;
      }
      case 'companyPhone': {
        if (!isPhoneCharsValid(value)) {
          message = 'Only digits are allowed (optional leading +)';
          break;
        }
        const v = validateCompanyPhone(value, formData.headquarters.country);
        message = v.isValid ? '' : v.error;
        const a = normalizePhone(value);
        const b = normalizePhone(formData.contactPersonPhone);
        if (!message && a && b && a === b) message = 'This phone number is already used in another field';
        break;
      }
      case 'contactPersonPhone': {
        if (!isPhoneCharsValid(value)) {
          message = 'Only digits are allowed (optional leading +)';
          break;
        }
        const v = validateCompanyPhone(value, formData.headquarters.country);
        message = v.isValid ? '' : v.error;
        const a = normalizePhone(value);
        const b = normalizePhone(formData.companyPhone);
        if (!message && a && b && a === b) message = 'This phone number is already used in another field';
        break;
      }
      case 'contactPersonEmail': {
        const v = validateCompanyEmail(value);
        message = v.isValid ? '' : v.error;
        if (!message) {
          const a = normalizeEmail(value);
          const b = normalizeEmail(formData.companyEmail);
          if (a && b && a === b) message = 'This email is already used in another field';
        }
        break;
      }
      case 'contactPersonName': {
        const v = validateName(value);
        if (!v.isValid) message = v.errors[0];
        break;
      }
      case 'contactPersonPhone': {
        if (!isPhoneCharsValid(value)) {
          message = 'Only digits are allowed (optional leading +)';
          break;
        }
        const region = normalizeCountryToISO(formData.headquarters.country) || 'IN';
        const v = validatePhone(value, { region, requireCountryCode: true });
        if (!v.isValid) message = v.errors[0];
        break;
      }
      case 'headquarters.zipCode': {
        const countryCode = normalizeCountryToISO(formData.headquarters.country) || '';
        const v = validateZipCode(value, countryCode);
        if (!v.isValid) message = v.errors[0];
        break;
      }
      case 'foundedYear': {
        const currentYear = new Date().getFullYear();
        if (!value) {
          message = 'Founded year is required';
          break;
        }
        if (!/^\d+$/.test(value)) {
          message = 'Year must be numeric digits only';
          break;
        }
        if (!/^\d{4}$/.test(value)) {
          message = 'Enter a 4-digit year';
          break;
        }
        if (Number(value) > currentYear) {
          message = 'Year cannot exceed current year';
        }
        break;
      }
      default: {
        if (!value) message = 'This field is required';
      }
    }

    setErrors(prev => ({ ...prev, [key]: message }));
  };

  // Debounced Mapbox suggestions
  useEffect(() => {
    let active = true;
    const fetchSuggestions = async () => {
      if (!MAPBOX_TOKEN || !locationQuery || locationQuery.trim().length < 2) {
        if (active) setLocationSuggestions([]);
        return;
      }
      try {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationQuery)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&types=place,locality,region,country,neighborhood,postcode&limit=5`;
        const res = await fetch(endpoint);
        const data = await res.json();
        if (active) setLocationSuggestions(Array.isArray(data.features) ? data.features : []);
      } catch (e) {
        if (active) setLocationSuggestions([]);
      }
    };
    const id = setTimeout(fetchSuggestions, 250);
    return () => { active = false; clearTimeout(id); };
  }, [locationQuery, MAPBOX_TOKEN]);

  const extractLocationParts = (feature) => {
    const parts = { city: "", state: "", country: "", zipCode: "" };
    if (!feature) return parts;
    const ctx = feature.context || [];
    const byId = {};
    ctx.forEach(c => { if (c && c.id) byId[c.id.split('.')[0]] = c; });
    // Prefer place/locality as city
    if (feature.place_type && (feature.place_type.includes('place') || feature.place_type.includes('locality'))) {
      parts.city = feature.text || "";
    }
    if (!parts.city && byId.place) parts.city = byId.place.text || "";
    if (!parts.city && byId.locality) parts.city = byId.locality.text || "";
    // State/region
    if (byId.region) parts.state = byId.region.text || "";
    if (!parts.state && byId.district) parts.state = byId.district.text || "";
    // Country
    if (byId.country) parts.country = byId.country.text || "";
    // Postcode
    if (byId.postcode) parts.zipCode = byId.postcode.text || "";
    return parts;
  };

  const handleSelectLocation = (feature) => {
    const { city, state, country, zipCode } = extractLocationParts(feature);
    setFormData(prev => ({
      ...prev,
      headquarters: {
        ...prev.headquarters,
        address: feature.place_name || prev.headquarters.address,
        city,
        state,
        country,
        zipCode: zipCode || prev.headquarters.zipCode
      }
    }));
    setLocationQuery(feature.place_name || "");
    setShowLocationSuggestions(false);
    // Clear related errors when selected
    setErrors(prev => ({ ...prev, city: "", state: "", country: "" }));
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/employers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        toast.error(data.message || "Registration failed");
        return;
      }

      toast.success("🎉 Company registered successfully! Please login to continue.");
      setTimeout(() => {
        navigate("/employer/login");
      }, 2000);

    } catch (err) {
      toast.error("Network error! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                onFocus={() => handleFocus('companyName')}
                onBlur={() => handleBlur('companyName')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.companyName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter company name"
              />
              {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Email *</label>
              <input
                type="email"
                value={formData.companyEmail}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                onFocus={() => handleFocus('companyEmail')}
                onBlur={() => handleBlur('companyEmail')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.companyEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="company@example.com"
              />
              {errors.companyEmail && <p className="text-red-500 text-sm mt-1">{errors.companyEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Phone *</label>
              <input
                type="tel"
                value={formData.companyPhone}
                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                onFocus={() => handleFocus('companyPhone')}
                onBlur={() => handleBlur('companyPhone')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.companyPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+91XXXXXXXXXX"
              />
              {errors.companyPhone && <p className="text-red-500 text-sm mt-1">{errors.companyPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter secure password"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onFocus={() => handleFocus('confirmPassword')}
                onBlur={() => handleBlur('confirmPassword')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person Name *</label>
              <input
                type="text"
                value={formData.contactPersonName}
                onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                onFocus={() => handleFocus('contactPersonName')}
                onBlur={() => handleBlur('contactPersonName')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contactPersonName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter contact person name"
              />
              {errors.contactPersonName && <p className="text-red-500 text-sm mt-1">{errors.contactPersonName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person Title *</label>
              <input
                type="text"
                value={formData.contactPersonTitle}
                onChange={(e) => handleInputChange('contactPersonTitle', e.target.value)}
                onFocus={() => handleFocus('contactPersonTitle')}
                onBlur={() => handleBlur('contactPersonTitle')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contactPersonTitle ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., HR Manager, CEO"
              />
              {errors.contactPersonTitle && <p className="text-red-500 text-sm mt-1">{errors.contactPersonTitle}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person Email *</label>
              <input
                type="email"
                value={formData.contactPersonEmail}
                onChange={(e) => handleInputChange('contactPersonEmail', e.target.value)}
                onFocus={() => handleFocus('contactPersonEmail')}
                onBlur={() => handleBlur('contactPersonEmail')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contactPersonEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="contact@example.com"
              />
              {errors.contactPersonEmail && <p className="text-red-500 text-sm mt-1">{errors.contactPersonEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person Phone *</label>
              <input
                type="tel"
                value={formData.contactPersonPhone}
                onChange={(e) => handleInputChange('contactPersonPhone', e.target.value)}
                onFocus={() => handleFocus('contactPersonPhone')}
                onBlur={() => handleBlur('contactPersonPhone')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contactPersonPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+91XXXXXXXXXX"
              />
              {errors.contactPersonPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPersonPhone}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.industry ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Size *</label>
              <select
                value={formData.companySize}
                onChange={(e) => handleInputChange('companySize', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.companySize ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select company size</option>
                {companySizes.map(size => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </select>
              {errors.companySize && <p className="text-red-500 text-sm mt-1">{errors.companySize}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Founded Year *</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\\d*"
                maxLength={4}
                value={String(formData.foundedYear || '')}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                  handleInputChange('foundedYear', digitsOnly);
                }}
                onBlur={() => handleBlur('foundedYear')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.foundedYear ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., 2020"
              />
              {errors.foundedYear && <p className="text-red-500 text-sm mt-1">{errors.foundedYear}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.company.com"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <input
                type="text"
                value={formData.headquarters.address}
                onChange={(e) => handleInputChange('headquarters.address', e.target.value)}
                onFocus={() => handleFocus('headquarters.address')}
                onBlur={() => handleBlur('headquarters.address')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Street address"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location (City/State/Country) *</label>
              <div className="relative">
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => { setLocationQuery(e.target.value); setShowLocationSuggestions(true); }}
                  onFocus={() => setShowLocationSuggestions(true)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    (errors.city || errors.state || errors.country) ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={MAPBOX_TOKEN ? "Search location" : "Search location (set REACT_APP_MAPBOX_TOKEN)"}
                />
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                    {locationSuggestions.map((f) => (
                      <li
                        key={f.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onMouseDown={(e) => { e.preventDefault(); handleSelectLocation(f); }}
                      >
                        {f.place_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {(errors.city || errors.state || errors.country) && (
                <p className="text-red-500 text-sm mt-1">City, State and Country are required</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={formData.headquarters.zipCode}
                  onChange={(e) => handleInputChange('headquarters.zipCode', e.target.value)}
                  onFocus={() => handleFocus('headquarters.zipCode')}
                  onBlur={() => handleBlur('headquarters.zipCode')}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.zipCode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={getZipExampleForCountry(formData.headquarters.country)}
                />
                {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 ${animate ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">{steps[currentStep].icon}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your Company</h1>
          <p className="text-gray-600">{steps[currentStep].description}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div>
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover-lift"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 hover-lift"
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    <span>Registering...</span>
                  </div>
                ) : (
                  "Complete Registration"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link to="/employer/login" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployerRegister;

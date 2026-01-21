// Advanced validation utilities with region-specific rules

/**
 * Email validation with enhanced checks
 */
export const validateEmail = (email, options = {}) => {
  const { 
    allowDomainList = [], 
    blockDomainList = [], 
    requireCorporateDomain = false 
  } = options;
  
  const errors = [];
  
  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  
  if (!email || !email.trim()) {
    return { isValid: false, errors: ['Email is required'] };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, errors: ['Please enter a valid email address'] };
  }
  
  const [localPart, domain] = email.split('@');
  
  // Check local part length
  if (localPart.length > 64) {
    errors.push('Email username is too long (max 64 characters)');
  }
  
  // Check domain length
  if (domain.length > 253) {
    errors.push('Email domain is too long');
  }
  
  // Check for consecutive dots
  if (email.includes('..')) {
    errors.push('Email cannot contain consecutive dots');
  }
  
  // Domain whitelist check
  if (allowDomainList.length > 0 && !allowDomainList.some(allowedDomain => domain.endsWith(allowedDomain))) {
    errors.push(`Email domain must be from: ${allowDomainList.join(', ')}`);
  }
  
  // Domain blacklist check
  if (blockDomainList.length > 0 && blockDomainList.some(blockedDomain => domain.endsWith(blockedDomain))) {
    errors.push('This email domain is not allowed');
  }
  
  // Corporate domain check
  if (requireCorporateDomain) {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'mail.com', 'yandex.com', 'protonmail.com', 'tutanota.com'
    ];
    if (personalDomains.some(personalDomain => domain.toLowerCase().endsWith(personalDomain))) {
      errors.push('Please use a corporate email address');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    suggestions: generateEmailSuggestions(email, errors)
  };
};

/**
 * Phone number validation with region-specific rules
 */
export const validatePhone = (phone, options = {}) => {
  const { 
    region = 'IN', // Default to India
    allowInternational = true,
    requireCountryCode = false 
  } = options;
  
  const errors = [];
  let cleanPhone = phone.replace(/[\s\-\(\)\.]/g, ''); // Remove common separators
  
  if (!phone || !phone.trim()) {
    return { isValid: false, errors: ['Phone number is required'] };
  }
  
  // Region-specific validation
  switch (region.toUpperCase()) {
    case 'IN': // India
      return validateIndianPhone(cleanPhone, { allowInternational, requireCountryCode });
    case 'US': // United States
      return validateUSPhone(cleanPhone, { allowInternational, requireCountryCode });
    case 'GB': // United Kingdom
      return validateUKPhone(cleanPhone, { allowInternational, requireCountryCode });
    default:
      return validateInternationalPhone(cleanPhone);
  }
};

/**
 * Indian phone number validation
 */
const validateIndianPhone = (phone, options) => {
  const errors = [];
  const { allowInternational, requireCountryCode } = options;
  
  // Remove country code if present
  let localPhone = phone;
  let hasCountryCode = false;
  
  if (phone.startsWith('+91')) {
    localPhone = phone.substring(3);
    hasCountryCode = true;
  } else if (phone.startsWith('91') && phone.length === 12) {
    localPhone = phone.substring(2);
    hasCountryCode = true;
  } else if (phone.startsWith('0')) {
    localPhone = phone.substring(1);
  }
  
  // Check if country code is required
  if (requireCountryCode && !hasCountryCode) {
    errors.push('Country code (+91) is required for Indian numbers');
  }
  
  // Indian mobile number validation
  if (localPhone.length === 10) {
    // Mobile number validation - must start with 6, 7, 8, or 9
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(localPhone)) {
      errors.push('Indian mobile numbers must start with 6, 7, 8, or 9');
    }
  } else if (localPhone.length >= 6 && localPhone.length <= 8) {
    // Landline number validation
    const landlineRegex = /^\d{6,8}$/;
    if (!landlineRegex.test(localPhone)) {
      errors.push('Please enter a valid Indian landline number');
    }
  } else {
    errors.push('Indian phone numbers should be 10 digits for mobile or 6-8 digits for landline');
  }
  
  // Additional checks for mobile numbers
  if (localPhone.length === 10) {
    const firstDigit = localPhone[0];
    const validProviders = {
      '6': ['Airtel', 'Vodafone', 'BSNL'],
      '7': ['Airtel', 'Jio', 'Vodafone', 'BSNL'],
      '8': ['Airtel', 'Jio', 'Vodafone', 'BSNL'],
      '9': ['Airtel', 'Jio', 'Vodafone', 'BSNL']
    };
    
    // Check for obviously fake numbers
    const repeatingPattern = new RegExp(`^${firstDigit}{10}$`);
    if (repeatingPattern.test(localPhone)) {
      errors.push('Phone number cannot have all same digits');
    }
    
    // Check for sequential numbers
    const isSequential = isSequentialNumber(localPhone);
    if (isSequential) {
      errors.push('Phone number cannot be sequential (e.g., 1234567890)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    formattedPhone: hasCountryCode ? `+91 ${localPhone}` : localPhone,
    provider: getIndianProvider(localPhone)
  };
};

/**
 * US phone number validation
 */
const validateUSPhone = (phone, options) => {
  const errors = [];
  const { requireCountryCode } = options;
  
  let localPhone = phone;
  let hasCountryCode = false;
  
  if (phone.startsWith('+1')) {
    localPhone = phone.substring(2);
    hasCountryCode = true;
  } else if (phone.startsWith('1') && phone.length === 11) {
    localPhone = phone.substring(1);
    hasCountryCode = true;
  }
  
  if (requireCountryCode && !hasCountryCode) {
    errors.push('Country code (+1) is required for US numbers');
  }
  
  if (localPhone.length !== 10) {
    errors.push('US phone numbers must be 10 digits');
  } else {
    const usPhoneRegex = /^[2-9]\d{2}[2-9]\d{6}$/;
    if (!usPhoneRegex.test(localPhone)) {
      errors.push('Please enter a valid US phone number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    formattedPhone: hasCountryCode ? `+1 (${localPhone.slice(0,3)}) ${localPhone.slice(3,6)}-${localPhone.slice(6)}` : localPhone
  };
};

/**
 * UK phone number validation
 */
const validateUKPhone = (phone, options) => {
  const errors = [];
  const { requireCountryCode } = options;
  
  let localPhone = phone;
  let hasCountryCode = false;
  
  if (phone.startsWith('+44')) {
    localPhone = phone.substring(3);
    hasCountryCode = true;
  } else if (phone.startsWith('44') && phone.length >= 12) {
    localPhone = phone.substring(2);
    hasCountryCode = true;
  } else if (phone.startsWith('0')) {
    localPhone = phone.substring(1);
  }
  
  if (requireCountryCode && !hasCountryCode) {
    errors.push('Country code (+44) is required for UK numbers');
  }
  
  if (localPhone.length < 9 || localPhone.length > 10) {
    errors.push('UK phone numbers should be 9-10 digits');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    formattedPhone: hasCountryCode ? `+44 ${localPhone}` : `0${localPhone}`
  };
};

/**
 * International phone validation (fallback)
 */
const validateInternationalPhone = (phone) => {
  const errors = [];
  
  if (phone.length < 7 || phone.length > 15) {
    errors.push('Phone number should be 7-15 digits');
  }
  
  const intlPhoneRegex = /^\+?[1-9]\d{6,14}$/;
  if (!intlPhoneRegex.test(phone)) {
    errors.push('Please enter a valid international phone number');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    formattedPhone: phone.startsWith('+') ? phone : `+${phone}`
  };
};

/**
 * Password strength validation
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    specialChars = '@$!%*?&',
    preventCommon = true
  } = options;
  
  const errors = [];
  const suggestions = [];
  
  if (!password) {
    return { isValid: false, errors: ['Password is required'], strength: 0 };
  }
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (password.length > maxLength) {
    errors.push(`Password must not exceed ${maxLength} characters`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add an uppercase letter (A-Z)');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add a lowercase letter (a-z)');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add a number (0-9)');
  }
  
  if (requireSpecialChars && !new RegExp(`[${specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
    errors.push(`Password must contain at least one special character (${specialChars})`);
    suggestions.push(`Add a special character (${specialChars})`);
  }
  
  // Check for common weak passwords
  if (preventCommon && isCommonPassword(password)) {
    errors.push('This password is too common. Please choose a more unique password');
  }
  
  const strength = calculatePasswordStrength(password);
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    suggestions: suggestions,
    strength: strength
  };
};

/**
 * Helper functions
 */
const generateEmailSuggestions = (email, errors) => {
  const suggestions = [];
  
  if (errors.some(error => error.includes('format'))) {
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const [localPart] = email.split('@');
    if (localPart) {
      commonDomains.forEach(domain => {
        suggestions.push(`${localPart}@${domain}`);
      });
    }
  }
  
  return suggestions.slice(0, 3); // Limit to 3 suggestions
};

const isSequentialNumber = (phone) => {
  let ascending = true;
  let descending = true;
  
  for (let i = 1; i < phone.length; i++) {
    const current = parseInt(phone[i]);
    const previous = parseInt(phone[i - 1]);
    
    if (current !== previous + 1) ascending = false;
    if (current !== previous - 1) descending = false;
  }
  
  return ascending || descending;
};

const getIndianProvider = (phone) => {
  if (phone.length !== 10) return null;
  
  const prefixMap = {
    '60': 'Vodafone', '61': 'Vodafone', '62': 'Vodafone', '63': 'Vodafone',
    '70': 'Airtel', '71': 'Airtel', '72': 'Airtel', '73': 'Airtel', '74': 'Airtel',
    '75': 'Airtel', '76': 'Airtel', '77': 'Airtel', '78': 'Airtel', '79': 'Airtel',
    '80': 'BSNL', '81': 'BSNL', '82': 'BSNL', '83': 'BSNL', '84': 'BSNL',
    '85': 'BSNL', '86': 'BSNL', '87': 'BSNL', '88': 'Jio', '89': 'Jio',
    '90': 'Airtel', '91': 'Airtel', '92': 'Airtel', '93': 'Airtel', '94': 'Airtel',
    '95': 'Airtel', '96': 'Airtel', '97': 'Airtel', '98': 'Airtel', '99': 'Airtel'
  };
  
  const prefix = phone.substring(0, 2);
  return prefixMap[prefix] || 'Unknown';
};

const isCommonPassword = (password) => {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', 'login', 'password1',
    'qwerty123', 'password12', 'admin123'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Length score
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;
  
  // Character variety score
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  
  return Math.min(score, 100);
};

/**
 * Real-time validation for form fields
 */
export const createFieldValidator = (fieldType, options = {}) => {
  return (value, onFocus = false) => {
    switch (fieldType) {
      case 'email':
        return validateEmail(value, options);
      case 'phone':
        return validatePhone(value, options);
      case 'password':
        return validatePassword(value, options);
      case 'name':
        return validateName(value, options);
      case 'zip':
        return validateZipCode(value, options.country || options.region || '');
      default:
        return { isValid: true, errors: [] };
    }
  };
};

/**
 * Form validation state manager
 */
export class FormValidator {
  constructor() {
    this.fields = {};
    this.validators = {};
  }
  
  addField(name, validator, options = {}) {
    this.validators[name] = { validator, options };
    this.fields[name] = { isValid: false, errors: [], touched: false };
  }
  
  validateField(name, value, onFocus = false) {
    if (!this.validators[name]) return;
    
    const { validator, options } = this.validators[name];
    const result = validator(value, { ...options, onFocus });
    
    this.fields[name] = {
      ...result,
      touched: true
    };
    
    return result;
  }
  
  validateAll(formData) {
    let isFormValid = true;
    
    Object.keys(this.validators).forEach(name => {
      const result = this.validateField(name, formData[name]);
      if (!result.isValid) {
        isFormValid = false;
      }
    });
    
    return {
      isValid: isFormValid,
      fields: this.fields
    };
  }
  
  getFieldState(name) {
    return this.fields[name] || { isValid: false, errors: [], touched: false };
  }
  
  isFormValid() {
    return Object.values(this.fields).every(field => field.isValid);
  }
}

/**
 * Human name validation (supports letters, spaces, hyphens, apostrophes)
 */
export const validateName = (name, options = {}) => {
  const { minLength = 2, maxLength = 100 } = options;
  if (!name || !name.trim()) {
    return { isValid: false, errors: ['Name is required'] };
  }
  const trimmed = name.trim();
  if (trimmed.length < minLength) {
    return { isValid: false, errors: [`Name must be at least ${minLength} characters`] };
  }
  if (trimmed.length > maxLength) {
    return { isValid: false, errors: [`Name must be under ${maxLength} characters`] };
  }
  // Allow letters with spaces, hyphens, or apostrophes
  const nameRegex = /^[A-Za-z][A-Za-z '\-]*[A-Za-z]$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, errors: ['Name can include letters, spaces, hyphens, and apostrophes'] };
  }
  return { isValid: true, errors: [] };
};

/**
 * Normalize a country value (name or code) to 2-letter ISO code
 */
export const normalizeCountryToISO = (country) => {
  if (!country) return '';
  const c = String(country).trim().toUpperCase();
  const map = {
    'US': 'US', 'USA': 'US', 'UNITED STATES': 'US', 'UNITED STATES OF AMERICA': 'US',
    'IN': 'IN', 'INDIA': 'IN',
    'GB': 'GB', 'UK': 'GB', 'UNITED KINGDOM': 'GB', 'GREAT BRITAIN': 'GB',
    'CA': 'CA', 'CANADA': 'CA',
    'AU': 'AU', 'AUSTRALIA': 'AU',
    'DE': 'DE', 'GERMANY': 'DE',
    'FR': 'FR', 'FRANCE': 'FR'
  };
  return map[c] || c.slice(0, 2);
};

const countryZipPatterns = {
  US: {
    regex: /^\d{5}(-\d{4})?$/,
    example: '12345 or 12345-6789',
    name: 'ZIP code'
  },
  IN: {
    regex: /^\d{6}$/,
    example: '560001',
    name: 'PIN code'
  },
  GB: {
    // Simplified but commonly acceptable UK postcode regex
    regex: /^(GIR 0AA|(?:(?:[A-Z]\d{1,2}|[A-Z][A-HJ-Y]\d{1,2}|[A-Z]\d[A-Z]|[A-Z][A-HJ-Y]\d[A-Z])\s?\d[ABD-HJLN-UW-Z]{2}))$/i,
    example: 'SW1A 1AA',
    name: 'Postcode'
  },
  CA: {
    regex: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    example: 'K1A 0B1',
    name: 'Postal code'
  },
  AU: {
    regex: /^\d{4}$/,
    example: '2000',
    name: 'Postcode'
  },
  DE: {
    regex: /^\d{5}$/,
    example: '10115',
    name: 'Postleitzahl'
  },
  FR: {
    regex: /^\d{5}$/,
    example: '75001',
    name: 'Code postal'
  }
};

export const getZipExampleForCountry = (country) => {
  const code = normalizeCountryToISO(country);
  return (countryZipPatterns[code] && countryZipPatterns[code].example) || 'e.g., 12345';
};

/**
 * Country-based ZIP/Postal code validation
 */
export const validateZipCode = (zip, country) => {
  const errors = [];
  if (!zip || !String(zip).trim()) {
    return { isValid: false, errors: ['ZIP/Postal code is required'] };
  }
  const code = normalizeCountryToISO(country);
  const pattern = countryZipPatterns[code];
  const value = String(zip).trim();
  if (pattern) {
    if (!pattern.regex.test(value)) {
      errors.push(`Please enter a valid ${pattern.name} (${pattern.example})`);
    }
  } else {
    // Fallback: 3-10 alphanumeric
    if (!/^[A-Za-z0-9\-\s]{3,10}$/.test(value)) {
      errors.push('Please enter a valid ZIP/Postal code');
    }
  }
  return { isValid: errors.length === 0, errors };
};

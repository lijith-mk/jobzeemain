import React, { useState, useEffect } from "react";
import {
  validateEmail,
  validatePhone,
  validateName,
} from "../utils/validationUtils";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminSidebar from "./AdminSidebar";
import AdminEventsModeration from "./AdminEventsModeration";
import TestPerformanceMonitor from "./TestPerformanceMonitor";
import AdminLearningPaths from "./AdminLearningPaths";

import API_BASE_URL from "../config/api";
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [queries, setQueries] = useState([]);
  const [queryPage, setQueryPage] = useState(1);
  const [queryTotalPages, setQueryTotalPages] = useState(1);
  const [querySearch, setQuerySearch] = useState("");
  const [queryStatus, setQueryStatus] = useState("");
  const [users, setUsers] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showViewUser, setShowViewUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user",
    password: "",
  });
  const [createErrors, setCreateErrors] = useState({});
  const [createTouched, setCreateTouched] = useState({});
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: "user",
  });
  const [employers, setEmployers] = useState([]);
  const [showCreateEmployer, setShowCreateEmployer] = useState(false);
  const [createEmployerForm, setCreateEmployerForm] = useState({
    companyName: "",
    companyEmail: "",
    contactPersonName: "",
    phone: "",
    password: "",
  });
  const [createEmployerErrors, setCreateEmployerErrors] = useState({});
  const [createEmployerTouched, setCreateEmployerTouched] = useState({});
  const [showViewEmployer, setShowViewEmployer] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [showEditEmployer, setShowEditEmployer] = useState(false);
  const [editEmployerForm, setEditEmployerForm] = useState({
    companyName: "",
    companyPhone: "",
    contactPersonName: "",
  });
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditJob, setShowEditJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [employerOptions, setEmployerOptions] = useState([]);
  const [jobForm, setJobForm] = useState({
    jobTitle: "",
    description: "",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    location: "",
    employmentType: "full-time",
    remote: "on-site",
    category: "",
    experienceLevel: "entry",
  });
  const [jobFormErrors, setJobFormErrors] = useState({});
  const [createJobForm, setCreateJobForm] = useState({
    employerId: "",
    jobTitle: "",
    description: "",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    location: "",
    employmentType: "full-time",
    remote: "on-site",
    experienceLevel: "entry",
    status: "approved",
    requirementsCSV: "",
    benefitsCSV: "",
    skillsCSV: "",
  });

  // Payment management state
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentPlan, setPaymentPlan] = useState("");
  const [paymentStartDate, setPaymentStartDate] = useState("");
  const [orderStats, setOrderStats] = useState(null);
  const [orderStatsStartDate, setOrderStatsStartDate] = useState("");
  const [orderStatsEndDate, setOrderStatsEndDate] = useState("");
  const [paymentEndDate, setPaymentEndDate] = useState("");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Plan management state
  const [plans, setPlans] = useState([]);
  const [planPage, setPlanPage] = useState(1);
  const [planTotalPages, setPlanTotalPages] = useState(1);
  const [planSearch, setPlanSearch] = useState("");
  const [planStatus, setPlanStatus] = useState("");
  const [planCategory, setPlanCategory] = useState("");
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showViewPlan, setShowViewPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [createPlanForm, setCreatePlanForm] = useState({
    planId: "",
    name: "",
    description: "",
    price: { amount: 0, currency: "INR", period: "monthly" },
    features: [],
    jobPostingLimit: 0,
    featuredJobsLimit: 0,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
    apiAccess: false,
    whiteLabel: false,
    dedicatedSupport: false,
    trialDays: 0,
    trialAvailable: false,
    billingCycle: "monthly",
    autoRenew: true,
    tags: [],
    category: "standard",
    isActive: true,
    isAvailable: true,
    sortOrder: 0,
  });
  const [createPlanErrors, setCreatePlanErrors] = useState({});
  const [editPlanForm, setEditPlanForm] = useState({});
  const [editPlanErrors, setEditPlanErrors] = useState({});

  // Product management state
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productStatus, setProductStatus] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    currency: "USD",
    category: "Templates",
    productType: "digital",
    stock: 0,
    isUnlimited: true,
    status: "active",
    isVisible: true,
    isFeatured: false,
    imageUrl: "",
    imageAlt: "",
  });
  const [productErrors, setProductErrors] = useState({});
  const [productTouched, setProductTouched] = useState({});
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  // Product purchase details state
  const [showProductPurchases, setShowProductPurchases] = useState(false);
  const [productPurchases, setProductPurchases] = useState([]);
  const [productPurchaseStats, setProductPurchaseStats] = useState(null);
  const [productPurchasePage, setProductPurchasePage] = useState(1);
  const [productPurchaseTotalPages, setProductPurchaseTotalPages] = useState(1);
  const [productPurchaseSearch, setProductPurchaseSearch] = useState("");
  const [productPurchaseStatus, setProductPurchaseStatus] = useState("");
  const [productPurchasePaymentStatus, setProductPurchasePaymentStatus] =
    useState("");
  const [productPurchaseStartDate, setProductPurchaseStartDate] = useState("");
  const [productPurchaseEndDate, setProductPurchaseEndDate] = useState("");

  // Shop Analytics state
  const [shopPayments, setShopPayments] = useState([]);
  const [shopAnalytics, setShopAnalytics] = useState(null);
  const [shopPaymentPage, setShopPaymentPage] = useState(1);
  const [shopPaymentTotalPages, setShopPaymentTotalPages] = useState(1);
  const [shopPaymentSearch, setShopPaymentSearch] = useState("");
  const [shopPaymentStatus, setShopPaymentStatus] = useState("");
  const [shopPaymentMethod, setShopPaymentMethod] = useState("");
  const [shopStartDate, setShopStartDate] = useState("");
  const [shopEndDate, setShopEndDate] = useState("");
  const [shopCategory, setShopCategory] = useState("");
  const [showShopPaymentDetails, setShowShopPaymentDetails] = useState(false);
  const [selectedShopPayment, setSelectedShopPayment] = useState(null);

  // Internship management state
  const [internships, setInternships] = useState([]);
  const [internshipPage, setInternshipPage] = useState(1);
  const [internshipTotalPages, setInternshipTotalPages] = useState(1);
  const [internshipSearch, setInternshipSearch] = useState("");
  const [internshipStatus, setInternshipStatus] = useState("");
  const [showCreateInternship, setShowCreateInternship] = useState(false);
  const [showEditInternship, setShowEditInternship] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [internshipForm, setInternshipForm] = useState({
    title: "",
    description: "",
    stipendMin: "",
    stipendMax: "",
    stipendCurrency: "INR",
    location: "",
    duration: "",
    remote: "on-site",
    experienceLevel: "entry",
  });
  const [internshipFormErrors, setInternshipFormErrors] = useState({});
  const [createInternshipForm, setCreateInternshipForm] = useState({
    employerId: "",
    title: "",
    description: "",
    stipendMin: "",
    stipendMax: "",
    stipendCurrency: "INR",
    location: "",
    duration: "",
    remote: "on-site",
    experienceLevel: "entry",
    status: "approved",
    requirementsCSV: "",
    skillsCSV: "",
  });

  // Course management state
  const [courses, setCourses] = useState([]);
  const [coursePage, setCoursePage] = useState(1);
  const [courseTotalPages, setCourseTotalPages] = useState(1);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [courseLevel, setCourseLevel] = useState("");
  const [courseStatus, setCourseStatus] = useState("");
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [createInternshipFormErrors, setCreateInternshipFormErrors] = useState(
    {},
  );

  // Internship applications state
  const [showInternshipApplications, setShowInternshipApplications] =
    useState(false);
  const [internshipApplications, setInternshipApplications] = useState([]);
  const [applicationStats, setApplicationStats] = useState({});
  const [applicationPage, setApplicationPage] = useState(1);
  const [applicationTotalPages, setApplicationTotalPages] = useState(1);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("");
  const [selectedInternshipForApps, setSelectedInternshipForApps] =
    useState(null);

  // Mentor management state
  const [mentors, setMentors] = useState([]);

  // Mentor applications state
  const [mentorApplications, setMentorApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [applicationToReject, setApplicationToReject] = useState(null);

  // Session Templates state
  const [sessionTemplates, setSessionTemplates] = useState([]);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    title: "",
    description: "",
    defaultDuration: 30,
    category: "",
    isActive: true,
  });

  // Tests Management state
  const [tests, setTests] = useState([]);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showEditTest, setShowEditTest] = useState(false);
  const [showViewTest, setShowViewTest] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showManageQuestions, setShowManageQuestions] = useState(false);
  const [testSubTab, setTestSubTab] = useState('management');
  const [testStatistics, setTestStatistics] = useState(null);
  const [testAttempts, setTestAttempts] = useState([]);
  const [attemptPage, setAttemptPage] = useState(1);
  const [attemptPagination, setAttemptPagination] = useState({});
  const [selectedAttemptFilter, setSelectedAttemptFilter] = useState('');
  const [testForm, setTestForm] = useState({
    title: "",
    description: "",
    jobRole: "",
    skill: "",
    type: "mcq",
    duration: 30,
    totalMarks: 100,
    passingMarks: 40,
    category: "technical",
    difficulty: "medium",
    isActive: false,
  });
  const [testFormErrors, setTestFormErrors] = useState({});
  const [testFormTouched, setTestFormTouched] = useState({});
  const [testQuestions, setTestQuestions] = useState([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    type: "mcq",
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 1,
    explanation: "",
    codingDetails: {
      problemStatement: '',
      inputFormat: '',
      outputFormat: '',
      constraints: '',
      sampleInput: '',
      sampleOutput: '',
      expectedSolution: '',
      testCases: [{ input: '', expectedOutput: '', isHidden: false }],
      starterCode: { javascript: '', python: '', java: '', cpp: '' },
      language: 'javascript',
      timeLimit: 2000,
      memoryLimit: 256
    },
    essayDetails: {
      wordLimit: 500,
      minWords: 100,
      gradingCriteria: '',
      expectedAnswer: ''
    }
  });

  const fetchSessionTemplates = async () => {
    try {
      // Fetch all templates (isActive filter is optional, let's get all)
      const res = await fetch(`${API_BASE_URL}/api/session-templates`);
      if (res.ok) {
        const data = await res.json();
        setSessionTemplates(data.data);
      } else {
        toast.error("Failed to fetch session templates");
      }
    } catch (error) {
      console.error("Fetch session templates error:", error);
      toast.error("Network error");
    }
  };

  const createSessionTemplate = async () => {
    if (!templateForm.title || !templateForm.defaultDuration || !templateForm.category) {
      toast.error("Please fill required fields (Title, Duration, Category)");
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/session-templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Template created successfully");
        setShowCreateTemplate(false);
        setTemplateForm({
          title: "",
          description: "",
          defaultDuration: 30,
          category: "",
          isActive: true,
        });
        fetchSessionTemplates();
      } else {
        toast.error(data.message || "Failed to create template");
      }
    } catch (error) {
      console.error("Create template error:", error);
      toast.error("Network error");
    }
  };

  const updateSessionTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/session-templates/${selectedTemplate.templateId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Template updated successfully");
        setShowEditTemplate(false);
        setSelectedTemplate(null);
        fetchSessionTemplates();
      } else {
        toast.error(data.message || "Failed to update template");
      }
    } catch (error) {
      console.error("Update template error:", error);
      toast.error("Network error");
    }
  };

  const toggleTemplateStatus = async (template) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/session-templates/${template.templateId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !template.isActive }),
      });
      if (res.ok) {
        toast.success(`Template ${!template.isActive ? "enabled" : "disabled"}`);
        fetchSessionTemplates();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error("Network error");
    }
  };

  // Tests Management Functions
  const fetchTests = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/tests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTests(data.tests || []);
      } else {
        toast.error("Failed to fetch tests");
      }
    } catch (error) {
      console.error("Fetch tests error:", error);
      toast.error("Network error");
    }
  };

  // Course Management Functions
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (courseCategory) params.append('category', courseCategory);
      if (courseLevel) params.append('level', courseLevel);
      if (courseStatus) params.append('isActive', courseStatus);
      if (coursePage) params.append('page', coursePage);
      
      const res = await fetch(`${API_BASE_URL}/api/admin/courses?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        setCourseTotalPages(data.totalPages || 1);
      } else {
        toast.error("Failed to fetch courses");
      }
    } catch (error) {
      console.error("Fetch courses error:", error);
      toast.error("Network error");
    }
  };

  const toggleCourseStatus = async (courseId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/courses/${courseId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Course status updated");
        fetchCourses();
      } else {
        toast.error("Failed to update course status");
      }
    } catch (error) {
      console.error("Toggle course status error:", error);
      toast.error("Network error");
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This will also delete all associated lessons.')) {
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Course deleted successfully");
        fetchCourses();
      } else {
        toast.error("Failed to delete course");
      }
    } catch (error) {
      console.error("Delete course error:", error);
      toast.error("Network error");
    }
  };

  const fetchTestStatistics = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const url = selectedAttemptFilter 
        ? `${API_BASE_URL}/api/admin/tests/statistics?testId=${selectedAttemptFilter}`
        : `${API_BASE_URL}/api/admin/tests/statistics`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTestStatistics(data.statistics);
      } else {
        toast.error("Failed to fetch test statistics");
      }
    } catch (error) {
      console.error("Fetch test statistics error:", error);
      toast.error("Network error");
    }
  };

  const fetchTestAttempts = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const url = selectedAttemptFilter
        ? `${API_BASE_URL}/api/admin/tests/attempts?testId=${selectedAttemptFilter}&page=${attemptPage}&limit=20`
        : `${API_BASE_URL}/api/admin/tests/attempts?page=${attemptPage}&limit=20`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTestAttempts(data.attempts || []);
        setAttemptPagination(data.pagination);
      } else {
        toast.error("Failed to fetch test attempts");
      }
    } catch (error) {
      console.error("Fetch test attempts error:", error);
      toast.error("Network error");
    }
  };

  // Test form validation functions
  const validateTestField = (fieldName, value) => {
    const errors = {};
    
    switch (fieldName) {
      case 'title':
        if (!value || !value.trim()) {
          errors.title = 'Test title is required';
        } else if (value.trim().length < 3) {
          errors.title = 'Title must be at least 3 characters';
        } else if (value.trim().length > 100) {
          errors.title = 'Title must not exceed 100 characters';
        }
        break;
      
      case 'duration':
        if (!value || value < 1) {
          errors.duration = 'Duration must be at least 1 minute';
        } else if (value > 480) {
          errors.duration = 'Duration cannot exceed 480 minutes (8 hours)';
        }
        break;
      
      case 'totalMarks':
        if (!value || value < 1) {
          errors.totalMarks = 'Total marks must be at least 1';
        } else if (value > 1000) {
          errors.totalMarks = 'Total marks cannot exceed 1000';
        }
        break;
      
      case 'passingMarks':
        if (!value || value < 1) {
          errors.passingMarks = 'Passing marks must be at least 1';
        } else if (value > testForm.totalMarks) {
          errors.passingMarks = `Passing marks cannot exceed total marks (${testForm.totalMarks})`;
        }
        break;
    }

    return errors;
  };

  const handleTestFieldBlur = (fieldName) => {
    setTestFormTouched({ ...testFormTouched, [fieldName]: true });
    const fieldErrors = validateTestField(fieldName, testForm[fieldName]);
    setTestFormErrors({ ...testFormErrors, ...fieldErrors });
    
    // Clear error if valid
    if (Object.keys(fieldErrors).length === 0) {
      const { [fieldName]: removed, ...rest } = testFormErrors;
      setTestFormErrors(rest);
    }
  };

  const handleTestFieldFocus = (fieldName) => {
    // Clear error on focus for better UX
    const { [fieldName]: removed, ...rest } = testFormErrors;
    setTestFormErrors(rest);
  };

  const validateTestForm = () => {
    const errors = {};
    
    if (!testForm.title.trim()) {
      errors.title = 'Test title is required';
    } else if (testForm.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    
    if (testForm.duration < 1) {
      errors.duration = 'Duration must be at least 1 minute';
    }
    
    if (testForm.totalMarks < 1) {
      errors.totalMarks = 'Total marks must be at least 1';
    }
    
    if (testForm.passingMarks < 1) {
      errors.passingMarks = 'Passing marks must be at least 1';
    } else if (testForm.passingMarks > testForm.totalMarks) {
      errors.passingMarks = `Passing marks cannot exceed total marks (${testForm.totalMarks})`;
    }
    
    setTestFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createTest = async () => {
    // Validate form
    if (!validateTestForm()) {
      toast.error("Please fix the validation errors before creating the test");
      // Mark all fields as touched to show errors
      setTestFormTouched({
        title: true,
        duration: true,
        totalMarks: true,
        passingMarks: true
      });
      return;
    }
    
    // Validation
    if (!testForm.title || !testForm.type) {
      toast.error("Please fill required fields (Title, Type)");
      return;
    }
    
    // Show warning that test will be created as inactive
    if (testForm.isActive) {
      toast.info("Test will be created as inactive. Add questions and then activate it.");
    }
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/tests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Test created successfully");
        setShowCreateTest(false);
        setTestForm({
          title: "",
          description: "",
          jobRole: "",
          skill: "",
          type: "mcq",
          duration: 30,
          totalMarks: 100,
          passingMarks: 40,
          category: "technical",
          difficulty: "medium",
          isActive: false,
        });
        setTestFormErrors({});
        setTestFormTouched({});
        fetchTests();
      } else {
        toast.error(data.message || "Failed to create test");
      }
    } catch (error) {
      console.error("Create test error:", error);
      toast.error("Network error");
    }
  };

  const updateTest = async () => {
    if (!selectedTest) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/tests/${selectedTest._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Test updated successfully");
        setShowEditTest(false);
        setSelectedTest(null);
        fetchTests();
      } else {
        toast.error(data.message || "Failed to update test");
      }
    } catch (error) {
      console.error("Update test error:", error);
      toast.error("Network error");
    }
  };

  const deleteTest = async (testId) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/tests/${testId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Test deleted successfully");
        fetchTests();
      } else {
        toast.error("Failed to delete test");
      }
    } catch (error) {
      console.error("Delete test error:", error);
      toast.error("Network error");
    }
  };

  const toggleTestStatus = async (test) => {
    // Validate test has questions before activation
    if (!test.isActive && (!test.questions || test.questions.length === 0)) {
      toast.error("Cannot activate test without questions. Please add at least one question first.");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/tests/${test._id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !test.isActive }),
      });
      if (res.ok) {
        toast.success(`Test ${!test.isActive ? "activated" : "deactivated"}`);
        fetchTests();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update test status");
      }
    } catch (error) {
      console.error("Toggle test status error:", error);
      toast.error("Network error");
    }
  };

  // Question Management Functions
  const handleSaveQuestion = async () => {
    // Validation
    if (!questionForm.questionText) {
      toast.error("Question text is required");
      return;
    }
    
    // Only validate correctAnswer for MCQ and True-False
    if ((questionForm.type === 'mcq' || questionForm.type === 'true-false') && !questionForm.correctAnswer) {
      toast.error("Please select the correct answer");
      return;
    }
    
    // For MCQ, check all options are filled
    if (questionForm.type === 'mcq') {
      const emptyOptions = questionForm.options.some(opt => !opt.trim());
      if (emptyOptions) {
        toast.error("All options must be filled for MCQ questions");
        return;
      }
    }

    // For Coding, validate required fields
    if (questionForm.type === 'coding') {
      if (!questionForm.codingDetails?.problemStatement) {
        toast.error("Problem statement is required for coding questions");
        return;
      }
      if (!questionForm.codingDetails?.testCases || questionForm.codingDetails.testCases.length === 0) {
        toast.error("At least one test case is required");
        return;
      }
      const emptyTestCase = questionForm.codingDetails.testCases.some(tc => !tc.input || !tc.expectedOutput);
      if (emptyTestCase) {
        toast.error("All test cases must have input and expected output");
        return;
      }
    }

    // For Essay, validate word limits
    if (questionForm.type === 'essay') {
      if (questionForm.essayDetails?.minWords > questionForm.essayDetails?.wordLimit) {
        toast.error("Minimum words cannot be greater than word limit");
        return;
      }
    }

    try {
      const token = localStorage.getItem("adminToken");
      const url = questionForm._id 
        ? `${API_BASE_URL}/api/admin/tests/${selectedTest._id}/questions/${questionForm._id}`
        : `${API_BASE_URL}/api/admin/tests/${selectedTest._id}/questions`;
      
      const method = questionForm._id ? "PUT" : "POST";

      const requestBody = {
        questionText: questionForm.questionText,
        type: questionForm.type,
        marks: questionForm.marks,
        explanation: questionForm.explanation,
      };

      // Add type-specific fields
      if (questionForm.type === 'mcq' || questionForm.type === 'true-false') {
        requestBody.options = questionForm.options;
        requestBody.correctAnswer = questionForm.correctAnswer;
      } else if (questionForm.type === 'coding') {
        requestBody.codingDetails = questionForm.codingDetails;
      } else if (questionForm.type === 'essay') {
        requestBody.essayDetails = questionForm.essayDetails;
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(questionForm._id ? "Question updated successfully" : "Question added successfully");
        setShowAddQuestion(false);
        setQuestionForm({
          questionText: '',
          type: 'mcq',
          options: ['', '', '', ''],
          correctAnswer: '',
          marks: 1,
          explanation: '',
        });
        // Refresh the test data to show updated questions
        const refreshRes = await fetch(`${API_BASE_URL}/api/admin/tests/${selectedTest._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setSelectedTest(refreshData.test);
        }
        fetchTests();
      } else {
        toast.error(data.message || "Failed to save question");
      }
    } catch (error) {
      console.error("Save question error:", error);
      toast.error("Network error");
    }
  };

  const handleEditQuestion = (question, index) => {
    setQuestionForm({
      _id: question._id,
      questionText: question.questionText,
      type: question.type,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      marks: question.marks,
      explanation: question.explanation || '',
    });
    setShowAddQuestion(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/tests/${selectedTest._id}/questions/${questionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Question deleted successfully");
        // Refresh the test data
        const refreshRes = await fetch(`${API_BASE_URL}/api/admin/tests/${selectedTest._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setSelectedTest(refreshData.test);
        }
        fetchTests();
      } else {
        toast.error("Failed to delete question");
      }
    } catch (error) {
      console.error("Delete question error:", error);
      toast.error("Network error");
    }
  };


  const fetchMentorApplications = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/api/mentor-applications/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMentorApplications(data);
      } else {
        toast.error("Failed to fetch mentor applications");
      }
    } catch (error) {
      console.error("Mentor applications fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const reviewMentorApplication = async (applicationId, action, reason = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/mentor-applications/review/${applicationId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, rejectionReason: reason }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Application ${action === "approve" ? "approved" : "rejected"} successfully`
        );
        fetchMentorApplications();
        fetchMentors(); // Refresh mentors list
        setShowApplicationDetails(false);
        setShowRejectModal(false);
        setRejectionReason("");
        setApplicationToReject(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to review application");
      }
    } catch (error) {
      console.error("Review application error:", error);
      toast.error("Network error occurred");
    }
  };

  const handleRejectClick = (application) => {
    setApplicationToReject(application);
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (applicationToReject) {
      reviewMentorApplication(applicationToReject._id, "reject", rejectionReason);
    }
  };

  const fetchMentors = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/api/mentors/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMentors(data);
      } else {
        toast.error("Failed to fetch mentors");
      }
    } catch (error) {
      console.error("Mentors fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const updateMentorStatus = async (mentorId, status) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/mentors/${mentorId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );
      if (response.ok) {
        toast.success(`Mentor status updated to ${status}`);
        fetchMentors();
      } else {
        toast.error("Failed to update mentor status");
      }
    } catch (error) {
      console.error("Update mentor status error:", error);
      toast.error("Network error occurred");
    }
  };

  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "mentors") {
      fetchMentors();
    }
    if (activeTab === "mentor-applications") {
      fetchMentorApplications();
    }
    if (activeTab === "session-templates") {
      fetchSessionTemplates();
    }
    if (activeTab === "tests") {
      fetchTests();
    }
    if (activeTab === "courses") {
      fetchCourses();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "courses") {
      fetchCourses();
    }
  }, [coursePage, courseCategory, courseLevel, courseStatus]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        toast.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1, search = "", status = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users?page=${page}&search=${search}&status=${status}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Users fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const validateCreateForm = () => {
    const errs = {};
    const nameRes = validateName(createForm.name);
    if (!nameRes.isValid) errs.name = nameRes.errors[0];
    const emailRes = validateEmail(createForm.email);
    if (!emailRes.isValid) errs.email = emailRes.errors[0];
    // Phone is optional for admin-created users; validate only if provided
    if (String(createForm.phone || "").trim()) {
      const phoneRes = validatePhone(createForm.phone, {
        region: "IN",
        requireCountryCode: false,
      });
      if (!phoneRes.isValid) errs.phone = phoneRes.errors[0];
    }
    return errs;
  };

  const handleCreateFocus = (field) => {
    setCreateTouched((prev) => ({ ...prev, [field]: true }));
    if (!String(createForm[field] || "").trim()) {
      setCreateErrors((prev) => ({
        ...prev,
        [field]: "This field is required",
      }));
    }
  };

  const handleCreateBlur = (field) => {
    const value = String(createForm[field] || "").trim();
    let message = "";
    if (!value) {
      message = "This field is required";
    } else {
      if (field === "name") {
        const r = validateName(value);
        if (!r.isValid) message = r.errors[0];
      } else if (field === "email") {
        const r = validateEmail(value);
        if (!r.isValid) message = r.errors[0];
      } else if (field === "phone") {
        const r = validatePhone(value, {
          region: "IN",
          requireCountryCode: false,
        });
        if (!r.isValid) message = r.errors[0];
      }
    }
    setCreateErrors((prev) => ({ ...prev, [field]: message }));
  };

  const createUser = async () => {
    const errs = validateCreateForm();
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      toast.error("Please fix the errors before creating the user");
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("User created");
        setShowCreateUser(false);
        setCreateForm({
          name: "",
          email: "",
          phone: "",
          role: "user",
          password: "",
        });
        setCreateErrors({});
        setCreateTouched({});
        fetchUsers(1, searchTerm, filterStatus);
      } else {
        toast.error(data.message || "Failed to create user");
      }
    } catch (e) {
      console.error("Create user error:", e);
      toast.error("Network error");
    }
  };

  const openEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || "",
      phone: user.phone || "",
      role: user.role || "user",
    });
    setShowEditUser(true);
  };

  const openViewUser = (user) => {
    setSelectedUser(user);
    setShowViewUser(true);
  };

  const saveEditUser = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE_URL}/api/admin/users/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("User updated");
        setShowEditUser(false);
        setSelectedUser(null);
        fetchUsers(currentPage, searchTerm, filterStatus);
      } else {
        toast.error(data.message || "Failed to update user");
      }
    } catch (e) {
      console.error("Edit user error:", e);
      toast.error("Network error");
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete user ${user.name}?`)) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE_URL}/api/admin/users/${user._id}?hard=true`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "User deleted");
        fetchUsers(currentPage, searchTerm, filterStatus);
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (e) {
      console.error("Delete user error:", e);
      toast.error("Network error");
    }
  };

  const fetchEmployers = async (page = 1, search = "", status = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/employers?page=${page}&search=${search}&status=${status}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setEmployers(data.employers);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } else {
        toast.error("Failed to fetch employers");
      }
    } catch (error) {
      console.error("Employers fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const updateEmployerVerification = async (employerId, payload) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/employers/${employerId}/verification`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Verification updated");
        setEmployers((prev) =>
          prev.map((e) =>
            e._id === employerId ? { ...e, ...data.employer } : e,
          ),
        );
      } else {
        toast.error(data.message || "Failed to update verification");
      }
    } catch (error) {
      console.error("Update employer verification error:", error);
      toast.error("Network error occurred");
    }
  };

  const fetchJobs = async (page = 1, search = "", status = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/jobs?page=${page}&search=${search}&status=${status}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } else {
        toast.error("Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Jobs fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const openCreateJobModal = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE_URL}/api/admin/employers?page=1&limit=1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setEmployerOptions(data.employers || []);
      }
    } catch (_) { }
    setShowCreateJob(true);
  };

  const createJob = async () => {
    if (
      !createJobForm.employerId ||
      !createJobForm.jobTitle ||
      !createJobForm.description ||
      !createJobForm.location
    ) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        employerId: createJobForm.employerId,
        title: createJobForm.jobTitle,
        description: createJobForm.description,
        location: createJobForm.location,
        jobType: createJobForm.employmentType,
        experienceLevel: createJobForm.experienceLevel,
        remote: createJobForm.remote,
        status: createJobForm.status,
        salary: {
          min:
            createJobForm.salaryMin !== ""
              ? Number(createJobForm.salaryMin)
              : undefined,
          max:
            createJobForm.salaryMax !== ""
              ? Number(createJobForm.salaryMax)
              : undefined,
          currency: createJobForm.salaryCurrency || "USD",
        },
        requirements: String(createJobForm.requirementsCSV || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        benefits: String(createJobForm.benefitsCSV || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        skills: String(createJobForm.skillsCSV || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Job created");
        setShowCreateJob(false);
        setCreateJobForm({
          employerId: "",
          jobTitle: "",
          description: "",
          salaryMin: "",
          salaryMax: "",
          salaryCurrency: "USD",
          location: "",
          employmentType: "full-time",
          remote: "on-site",
          experienceLevel: "entry",
          status: "approved",
          requirementsCSV: "",
          benefitsCSV: "",
          skillsCSV: "",
        });
        fetchJobs(1, searchTerm, filterStatus);
      } else {
        toast.error(data.message || "Failed to create job");
      }
    } catch (e) {
      console.error("Create job error:", e);
      toast.error("Network error");
    }
  };

  const deleteJob = async (job) => {
    if (
      !window.confirm(
        `Delete job "${job.title}"? This will remove applications and saved jobs.`,
      )
    )
      return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/jobs/${job._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Job deleted");
        fetchJobs(currentPage, searchTerm, filterStatus);
      } else {
        toast.error(data.message || "Failed to delete job");
      }
    } catch (e) {
      console.error("Delete job error:", e);
      toast.error("Network error");
    }
  };

  const openEditJob = (job) => {
    setSelectedJob(job);
    setJobForm({
      jobTitle: job.title || "",
      description: job.description || "",
      salaryMin: job.salary?.min ?? "",
      salaryMax: job.salary?.max ?? "",
      salaryCurrency: job.salary?.currency || "USD",
      location: job.location || "",
      employmentType: job.jobType || "full-time",
      remote: job.remote || "on-site",
      category: "",
      experienceLevel: job.experienceLevel || "entry",
    });
    setJobFormErrors({});
    setShowEditJob(true);
  };

  // Real-time validation for individual fields
  const handleJobFormChange = (field, value) => {
    setJobForm((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (jobFormErrors[field]) {
      setJobFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Real-time validation for salary fields
    if (field === "salaryMin" || field === "salaryMax") {
      const salaryMin =
        field === "salaryMin" ? Number(value) : Number(jobForm.salaryMin);
      const salaryMax =
        field === "salaryMax" ? Number(value) : Number(jobForm.salaryMax);

      if (salaryMin && salaryMax && salaryMin > salaryMax) {
        setJobFormErrors((prev) => ({
          ...prev,
          salaryMin: "Minimum salary cannot be greater than maximum salary",
          salaryMax: "Maximum salary cannot be less than minimum salary",
        }));
      } else {
        setJobFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.salaryMin;
          delete newErrors.salaryMax;
          return newErrors;
        });
      }
    }
  };

  // Job form validation functions
  const validateJobForm = (formData) => {
    const errors = {};
    let isValid = true;

    // Job Title validation
    if (!formData.jobTitle || formData.jobTitle.trim().length === 0) {
      errors.jobTitle = "Job title is required";
      isValid = false;
    } else if (formData.jobTitle.trim().length < 3) {
      errors.jobTitle = "Job title must be at least 3 characters";
      isValid = false;
    } else if (formData.jobTitle.trim().length > 100) {
      errors.jobTitle = "Job title must be less than 100 characters";
      isValid = false;
    }

    // Description validation
    if (!formData.description || formData.description.trim().length === 0) {
      errors.description = "Job description is required";
      isValid = false;
    } else if (formData.description.trim().length < 20) {
      errors.description = "Job description must be at least 20 characters";
      isValid = false;
    } else if (formData.description.trim().length > 2000) {
      errors.description = "Job description must be less than 2000 characters";
      isValid = false;
    }

    // Location validation
    if (!formData.location || formData.location.trim().length === 0) {
      errors.location = "Location is required";
      isValid = false;
    } else if (formData.location.trim().length < 2) {
      errors.location = "Location must be at least 2 characters";
      isValid = false;
    } else if (formData.location.trim().length > 100) {
      errors.location = "Location must be less than 100 characters";
      isValid = false;
    }

    // Salary validation
    const salaryMin = formData.salaryMin ? Number(formData.salaryMin) : null;
    const salaryMax = formData.salaryMax ? Number(formData.salaryMax) : null;

    if (salaryMin !== null && (isNaN(salaryMin) || salaryMin < 0)) {
      errors.salaryMin = "Minimum salary must be a positive number";
      isValid = false;
    }

    if (salaryMax !== null && (isNaN(salaryMax) || salaryMax < 0)) {
      errors.salaryMax = "Maximum salary must be a positive number";
      isValid = false;
    }

    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      errors.salaryMin = "Minimum salary cannot be greater than maximum salary";
      errors.salaryMax = "Maximum salary cannot be less than minimum salary";
      isValid = false;
    }

    // Currency validation
    if (formData.salaryCurrency && formData.salaryCurrency.length > 3) {
      errors.salaryCurrency = "Currency code must be 3 characters or less";
      isValid = false;
    }

    return { isValid, errors };
  };

  const saveJobEdits = async () => {
    if (!selectedJob) return;

    // Validate form before submission
    const validation = validateJobForm(jobForm);
    if (!validation.isValid) {
      setJobFormErrors(validation.errors);
      toast.error("Please fix the validation errors before saving");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        jobTitle: jobForm.jobTitle.trim(),
        description: jobForm.description.trim(),
        location: jobForm.location.trim(),
        employmentType: jobForm.employmentType,
        experienceLevel: jobForm.experienceLevel,
        remote: jobForm.remote,
        salary: {
          min: jobForm.salaryMin !== "" ? Number(jobForm.salaryMin) : undefined,
          max: jobForm.salaryMax !== "" ? Number(jobForm.salaryMax) : undefined,
          currency: jobForm.salaryCurrency || "USD",
        },
      };

      const res = await fetch(
        `${API_BASE_URL}/api/admin/jobs/${selectedJob._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        toast.success("Job updated successfully");
        setShowEditJob(false);
        setJobFormErrors({});
        fetchJobs(currentPage, searchTerm, filterStatus);
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update job");
      }
    } catch (error) {
      console.error("Save job edits error:", error);
      toast.error("Network error occurred");
    }
  };

  const updateUserStatus = async (userId, isActive, reason = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive, reason }),
        },
      );

      if (response.ok) {
        toast.success(
          `User ${isActive ? "activated" : "suspended"} successfully`,
        );
        fetchUsers(currentPage, searchTerm, filterStatus);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update user status");
      }
    } catch (error) {
      console.error("Update user status error:", error);
      toast.error("Network error occurred");
    }
  };

  const updateEmployerStatus = async (employerId, isApproved, reason = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/employers/${employerId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isApproved, reason }),
        },
      );

      if (response.ok) {
        toast.success(
          `Employer ${isApproved ? "approved" : "rejected"} successfully`,
        );
        fetchEmployers(currentPage, searchTerm, filterStatus);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update employer status");
      }
    } catch (error) {
      console.error("Update employer status error:", error);
      toast.error("Network error occurred");
    }
  };

  const openViewEmployer = (employer) => {
    setSelectedEmployer(employer);
    setShowViewEmployer(true);
  };

  const updateEmployerActiveStatus = async (
    employerId,
    isActive,
    reason = "",
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/employers/${employerId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive,
            suspensionReason: !isActive ? reason : undefined,
          }),
        },
      );

      const data = await response.json();
      if (response.ok) {
        toast.success(
          `Employer ${isActive ? "activated" : "suspended"} successfully`,
        );
        // Optimistically update row in-place so it doesn't disappear
        setEmployers((prev) =>
          prev.map((emp) =>
            emp._id === employerId ? { ...emp, isActive } : emp,
          ),
        );
      } else {
        toast.error(data.message || "Failed to update employer status");
      }
    } catch (error) {
      console.error("Update employer active status error:", error);
      toast.error("Network error occurred");
    }
  };

  const validateCreateEmployerForm = () => {
    const errs = {};
    const nameRes = validateName(createEmployerForm.companyName);
    if (!nameRes.isValid) errs.companyName = nameRes.errors[0];
    const contactRes = validateName(createEmployerForm.contactPersonName);
    if (!contactRes.isValid) errs.contactPersonName = contactRes.errors[0];
    const emailRes = validateEmail(createEmployerForm.companyEmail);
    if (!emailRes.isValid) errs.companyEmail = emailRes.errors[0];
    if (String(createEmployerForm.phone || "").trim()) {
      const phoneRes = validatePhone(createEmployerForm.phone, {
        region: "IN",
        requireCountryCode: false,
      });
      if (!phoneRes.isValid) errs.phone = phoneRes.errors[0];
    }
    return errs;
  };

  const handleCreateEmployerFocus = (field) => {
    setCreateEmployerTouched((prev) => ({ ...prev, [field]: true }));
    if (
      !String(createEmployerForm[field] || "").trim() &&
      field !== "phone" &&
      field !== "password"
    ) {
      setCreateEmployerErrors((prev) => ({
        ...prev,
        [field]: "This field is required",
      }));
    }
  };

  const handleCreateEmployerBlur = (field) => {
    const value = String(createEmployerForm[field] || "").trim();
    let message = "";
    if (!value && field !== "phone" && field !== "password") {
      message = "This field is required";
    } else {
      if (field === "companyName" || field === "contactPersonName") {
        const r = validateName(value);
        if (!r.isValid) message = r.errors[0];
      } else if (field === "companyEmail") {
        const r = validateEmail(value);
        if (!r.isValid) message = r.errors[0];
      } else if (field === "phone" && value) {
        const r = validatePhone(value, {
          region: "IN",
          requireCountryCode: false,
        });
        if (!r.isValid) message = r.errors[0];
      }
    }
    setCreateEmployerErrors((prev) => ({ ...prev, [field]: message }));
  };

  const updateJobStatus = async (jobId, status, adminNotes = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/jobs/${jobId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, adminNotes }),
        },
      );

      if (response.ok) {
        toast.success(`Job ${status} successfully`);
        fetchJobs(currentPage, searchTerm, filterStatus);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update job status");
      }
    } catch (error) {
      console.error("Update job status error:", error);
      toast.error("Network error occurred");
    }
  };

  // Internship management functions
  const fetchInternships = async (page = 1, search = "", status = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/internships?page=${page}&search=${search}&status=${status}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setInternships(data.internships);
        setInternshipTotalPages(data.totalPages);
        setInternshipPage(data.currentPage);
      } else {
        toast.error("Failed to fetch internships");
      }
    } catch (error) {
      console.error("Internships fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const openCreateInternshipModal = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE_URL}/api/admin/employers?page=1&limit=1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setEmployerOptions(data.employers || []);
      }
    } catch (_) { }
    setCreateInternshipFormErrors({});
    setShowCreateInternship(true);
  };

  const createInternship = async () => {
    if (
      !createInternshipForm.employerId ||
      !createInternshipForm.title ||
      !createInternshipForm.description ||
      !createInternshipForm.location
    ) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        employerId: createInternshipForm.employerId,
        title: createInternshipForm.title,
        description: createInternshipForm.description,
        location: createInternshipForm.location,
        duration: createInternshipForm.duration,
        experienceLevel: createInternshipForm.experienceLevel,
        remote: createInternshipForm.remote,
        status: createInternshipForm.status,
        stipend: {
          min:
            createInternshipForm.stipendMin !== ""
              ? Number(createInternshipForm.stipendMin)
              : undefined,
          max:
            createInternshipForm.stipendMax !== ""
              ? Number(createInternshipForm.stipendMax)
              : undefined,
          currency: createInternshipForm.stipendCurrency || "INR",
        },
        requirements: String(createInternshipForm.requirementsCSV || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        skills: String(createInternshipForm.skillsCSV || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/internships`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Internship created");
        setShowCreateInternship(false);
        setCreateInternshipForm({
          employerId: "",
          title: "",
          description: "",
          stipendMin: "",
          stipendMax: "",
          stipendCurrency: "INR",
          location: "",
          duration: "",
          remote: "on-site",
          experienceLevel: "entry",
          status: "approved",
          requirementsCSV: "",
          skillsCSV: "",
        });
        fetchInternships(1, internshipSearch, internshipStatus);
      } else {
        // Handle validation errors from backend
        if (data.errors) {
          setCreateInternshipFormErrors(data.errors);
          const errorMessages = Object.values(data.errors).join(", ");
          toast.error(errorMessages);
        } else {
          toast.error(data.message || "Failed to create internship");
        }
      }
    } catch (e) {
      console.error("Create internship error:", e);
      toast.error("Network error");
    }
  };

  const deleteInternship = async (internship) => {
    if (
      !window.confirm(
        `Delete internship "${internship.title}"? This will remove applications.`,
      )
    )
      return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE_URL}/api/admin/internships/${internship._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Internship deleted");
        fetchInternships(internshipPage, internshipSearch, internshipStatus);
      } else {
        toast.error(data.message || "Failed to delete internship");
      }
    } catch (e) {
      console.error("Delete internship error:", e);
      toast.error("Network error");
    }
  };

  const openEditInternship = (internship) => {
    setSelectedInternship(internship);
    setInternshipForm({
      title: internship.title || "",
      description: internship.description || "",
      stipendMin: internship.stipend?.min ?? "",
      stipendMax: internship.stipend?.max ?? "",
      stipendCurrency: internship.stipend?.currency || "INR",
      location: internship.location || "",
      duration: internship.duration || "",
      remote: internship.remote || "on-site",
      experienceLevel: internship.experienceLevel || "entry",
    });
    setInternshipFormErrors({});
    setShowEditInternship(true);
  };

  const handleInternshipFormChange = (field, value) => {
    setInternshipForm((prev) => ({ ...prev, [field]: value }));
    if (internshipFormErrors[field]) {
      setInternshipFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateInternshipForm = (formData) => {
    const errors = {};
    let isValid = true;

    if (!formData.title || formData.title.trim().length === 0) {
      errors.title = "Internship title is required";
      isValid = false;
    } else if (formData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
      isValid = false;
    }

    if (!formData.description || formData.description.trim().length === 0) {
      errors.description = "Description is required";
      isValid = false;
    } else if (formData.description.trim().length < 20) {
      errors.description = "Description must be at least 20 characters";
      isValid = false;
    }

    if (!formData.location || formData.location.trim().length === 0) {
      errors.location = "Location is required";
      isValid = false;
    }

    return { isValid, errors };
  };

  const saveInternshipEdits = async () => {
    if (!selectedInternship) return;

    const validation = validateInternshipForm(internshipForm);
    if (!validation.isValid) {
      setInternshipFormErrors(validation.errors);
      toast.error("Please fix the validation errors before saving");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        title: internshipForm.title.trim(),
        description: internshipForm.description.trim(),
        location: internshipForm.location.trim(),
        duration: internshipForm.duration,
        experienceLevel: internshipForm.experienceLevel,
        remote: internshipForm.remote,
        stipend: {
          min:
            internshipForm.stipendMin !== ""
              ? Number(internshipForm.stipendMin)
              : undefined,
          max:
            internshipForm.stipendMax !== ""
              ? Number(internshipForm.stipendMax)
              : undefined,
          currency: internshipForm.stipendCurrency || "INR",
        },
      };

      const res = await fetch(
        `${API_BASE_URL}/api/admin/internships/${selectedInternship._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        toast.success("Internship updated successfully");
        setShowEditInternship(false);
        setInternshipFormErrors({});
        fetchInternships(internshipPage, internshipSearch, internshipStatus);
      } else {
        const data = await res.json();
        // Handle validation errors from backend
        if (data.errors) {
          setInternshipFormErrors(data.errors);
          const errorMessages = Object.values(data.errors).join(", ");
          toast.error(errorMessages);
        } else {
          toast.error(data.message || "Failed to update internship");
        }
      }
    } catch (error) {
      console.error("Save internship edits error:", error);
      toast.error("Network error occurred");
    }
  };

  const fetchInternshipApplications = async (
    internshipId,
    page = 1,
    status = "",
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const statusParam = status ? `&status=${status}` : "";
      const res = await fetch(
        `${API_BASE_URL}/api/admin/internships/${internshipId}/applications?page=${page}&limit=10${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setInternshipApplications(data.applications);
        setApplicationStats(data.stats);
        setApplicationPage(data.pagination.page);
        setApplicationTotalPages(data.pagination.totalPages);
      } else {
        toast.error("Failed to fetch applications");
      }
    } catch (e) {
      console.error("Fetch applications error:", e);
      toast.error("Network error");
    }
  };

  const openInternshipApplications = (internship) => {
    setSelectedInternshipForApps(internship);
    setApplicationStatusFilter("");
    setShowInternshipApplications(true);
    fetchInternshipApplications(internship._id, 1, "");
  };

  const updateInternshipStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/internships/${id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        toast.success(`Internship ${status} successfully`);
        fetchInternships(internshipPage, internshipSearch, internshipStatus);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update internship status");
      }
    } catch (error) {
      console.error("Update internship status error:", error);
      toast.error("Network error occurred");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm("");
    setFilterStatus("");
    setCurrentPage(1);

    if (tab === "users") fetchUsers();
    else if (tab === "employers") fetchEmployers();
    else if (tab === "jobs") fetchJobs();
    else if (tab === "internships") fetchInternships();
    else if (tab === "payments") {
      fetchPayments();
      fetchPaymentStats();
    } else if (tab === "plans") fetchPlans();
    else if (tab === "products") fetchAdminProducts();
    else if (tab === "analytics") {
      fetchAdminOrderStats();
    } else if (tab === "shop-analytics") {
      fetchShopPayments();
      fetchShopAnalytics();
    } else if (tab === "queries") fetchQueries();
  };

  const fetchQueries = async (page = 1, search = "", status = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/queries?page=${page}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setQueries(data.queries);
        setQueryTotalPages(data.totalPages);
        setQueryPage(data.currentPage);
      } else {
        toast.error("Failed to fetch contact queries");
      }
    } catch (error) {
      console.error("Queries fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const updateQueryStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE_URL}/api/admin/queries/${id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Query updated");
        setQueries((prev) => prev.map((q) => (q._id === id ? data.query : q)));
      } else {
        toast.error(data.message || "Failed to update query");
      }
    } catch (e) {
      console.error("Update query status error:", e);
      toast.error("Network error");
    }
  };

  const fetchAdminOrderStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (orderStatsStartDate) params.set("startDate", orderStatsStartDate);
      if (orderStatsEndDate) params.set("endDate", orderStatsEndDate);
      const res = await fetch(
        `${API_BASE_URL}/api/orders/admin/stats?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setOrderStats(data.stats);
      } else {
        toast.error(data.message || "Failed to fetch order stats");
      }
    } catch (e) {
      console.error("Admin order stats error:", e);
      toast.error("Network error");
    }
  };

  // Product validation functions
  const validateProductForm = () => {
    const errs = {};

    // Name validation
    if (!productForm.name || productForm.name.trim().length === 0) {
      errs.name = "Product name is required";
    } else if (productForm.name.trim().length < 2) {
      errs.name = "Product name must be at least 2 characters";
    } else if (productForm.name.trim().length > 100) {
      errs.name = "Product name must be less than 100 characters";
    }

    // Price validation
    if (
      productForm.price === "" ||
      productForm.price === null ||
      productForm.price === undefined
    ) {
      errs.price = "Price is required";
    } else {
      const price = Number(productForm.price);
      if (isNaN(price) || price < 0) {
        errs.price = "Price must be a positive number";
      } else if (price > 999999) {
        errs.price = "Price cannot exceed 999,999";
      }
    }

    // Description validation
    if (
      !productForm.description ||
      productForm.description.trim().length === 0
    ) {
      errs.description = "Description is required";
    } else if (productForm.description.trim().length < 10) {
      errs.description = "Description must be at least 10 characters";
    } else if (productForm.description.trim().length > 2000) {
      errs.description = "Description must be less than 2000 characters";
    }

    // Short description validation
    if (
      productForm.shortDescription &&
      productForm.shortDescription.trim().length > 200
    ) {
      errs.shortDescription =
        "Short description must be less than 200 characters";
    }

    // Stock validation (only if not unlimited)
    if (!productForm.isUnlimited) {
      if (
        productForm.stock === "" ||
        productForm.stock === null ||
        productForm.stock === undefined
      ) {
        errs.stock = "Stock is required when not unlimited";
      } else {
        const stock = Number(productForm.stock);
        if (isNaN(stock) || stock < 0) {
          errs.stock = "Stock must be a non-negative number";
        } else if (stock > 999999) {
          errs.stock = "Stock cannot exceed 999,999";
        }
      }
    }

    // Image alt validation (only if image URL exists)
    if (
      productForm.imageUrl &&
      (!productForm.imageAlt || productForm.imageAlt.trim().length === 0)
    ) {
      errs.imageAlt = "Image alt text is required when image is provided";
    } else if (
      productForm.imageAlt &&
      productForm.imageAlt.trim().length > 100
    ) {
      errs.imageAlt = "Image alt text must be less than 100 characters";
    }

    return errs;
  };

  const handleProductFocus = (field) => {
    setProductTouched((prev) => ({ ...prev, [field]: true }));

    // Show immediate validation feedback for required fields
    if (
      !String(productForm[field] || "").trim() &&
      ["name", "price", "description"].includes(field)
    ) {
      setProductErrors((prev) => ({
        ...prev,
        [field]: "This field is required",
      }));
    }
  };

  const handleProductBlur = (field) => {
    const value = String(productForm[field] || "").trim();
    let message = "";

    // Validate based on field type
    if (field === "name") {
      if (!value) {
        message = "Product name is required";
      } else if (value.length < 2) {
        message = "Product name must be at least 2 characters";
      } else if (value.length > 100) {
        message = "Product name must be less than 100 characters";
      }
    } else if (field === "price") {
      if (!value) {
        message = "Price is required";
      } else {
        const price = Number(value);
        if (isNaN(price) || price < 0) {
          message = "Price must be a positive number";
        } else if (price > 999999) {
          message = "Price cannot exceed 999,999";
        }
      }
    } else if (field === "description") {
      if (!value) {
        message = "Description is required";
      } else if (value.length < 10) {
        message = "Description must be at least 10 characters";
      } else if (value.length > 2000) {
        message = "Description must be less than 2000 characters";
      }
    } else if (field === "shortDescription" && value && value.length > 200) {
      message = "Short description must be less than 200 characters";
    } else if (field === "stock" && !productForm.isUnlimited) {
      if (!value) {
        message = "Stock is required when not unlimited";
      } else {
        const stock = Number(value);
        if (isNaN(stock) || stock < 0) {
          message = "Stock must be a non-negative number";
        } else if (stock > 999999) {
          message = "Stock cannot exceed 999,999";
        }
      }
    } else if (field === "imageAlt") {
      if (productForm.imageUrl && !value) {
        message = "Image alt text is required when image is provided";
      } else if (value && value.length > 100) {
        message = "Image alt text must be less than 100 characters";
      }
    }

    setProductErrors((prev) => ({ ...prev, [field]: message }));
  };

  // Product management functions
  const fetchAdminProducts = async (
    page = 1,
    search = "",
    status = "",
    category = "",
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(category && { category }),
      });
      const res = await fetch(
        `${API_BASE_URL}/api/products/admin/all?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setProductTotalPages(data.pagination?.total || 1);
        setProductPage(data.pagination?.current || 1);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (e) {
      console.error("Products fetch error:", e);
      toast.error("Network error occurred");
    }
  };

  const openCreateProductModal = () => {
    setProductForm({
      name: "",
      description: "",
      shortDescription: "",
      price: "",
      currency: "USD",
      category: "Templates",
      productType: "digital",
      stock: 0,
      isUnlimited: true,
      status: "active",
      isVisible: true,
      isFeatured: false,
      imageUrl: "",
      imageAlt: "",
    });
    setProductErrors({});
    setProductTouched({});
    setShowCreateProduct(true);
  };

  const createProduct = async () => {
    const errs = validateProductForm();
    if (Object.keys(errs).length > 0) {
      setProductErrors(errs);
      toast.error(
        "Please fix the validation errors before creating the product",
      );
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        name: productForm.name,
        description: productForm.description,
        shortDescription: productForm.shortDescription,
        price: Number(productForm.price),
        currency: productForm.currency,
        category: productForm.category,
        productType: productForm.productType,
        stock: Number(productForm.stock),
        isUnlimited: Boolean(productForm.isUnlimited),
        status: productForm.status,
        isVisible: Boolean(productForm.isVisible),
        isFeatured: Boolean(productForm.isFeatured),
        images: productForm.imageUrl
          ? [
            {
              url: productForm.imageUrl,
              alt: productForm.imageAlt || productForm.name,
              isPrimary: true,
            },
          ]
          : [],
      };
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Product created");
        setShowCreateProduct(false);
        fetchAdminProducts(1, productSearch, productStatus, productCategory);
      } else {
        toast.error(data.message || "Failed to create product");
      }
    } catch (e) {
      console.error("Create product error:", e);
      toast.error("Network error");
    }
  };

  const openEditProduct = (p) => {
    setSelectedProduct(p);
    setProductForm({
      name: p.name || "",
      description: p.description || "",
      shortDescription: p.shortDescription || "",
      price: p.price ?? "",
      currency: p.currency || "USD",
      category: p.category || "Templates",
      productType: p.productType || "digital",
      stock: p.stock ?? 0,
      isUnlimited: p.isUnlimited ?? true,
      status: p.status || "active",
      isVisible: p.isVisible ?? true,
      isFeatured: p.isFeatured ?? false,
      imageUrl: p.images?.[0]?.url || "",
      imageAlt: p.images?.[0]?.alt || "",
    });
    setProductErrors({});
    setProductTouched({});
    setShowEditProduct(true);
  };

  const updateProduct = async () => {
    if (!selectedProduct) return;

    const errs = validateProductForm();
    if (Object.keys(errs).length > 0) {
      setProductErrors(errs);
      toast.error(
        "Please fix the validation errors before updating the product",
      );
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        name: productForm.name,
        description: productForm.description,
        shortDescription: productForm.shortDescription,
        price: Number(productForm.price),
        currency: productForm.currency,
        category: productForm.category,
        productType: productForm.productType,
        stock: Number(productForm.stock),
        isUnlimited: Boolean(productForm.isUnlimited),
        status: productForm.status,
        isVisible: Boolean(productForm.isVisible),
        isFeatured: Boolean(productForm.isFeatured),
        images: productForm.imageUrl
          ? [
            {
              url: productForm.imageUrl,
              alt: productForm.imageAlt || productForm.name,
              isPrimary: true,
            },
          ]
          : [],
      };
      const res = await fetch(
        `${API_BASE_URL}/api/products/${selectedProduct._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Product updated");
        setShowEditProduct(false);
        fetchAdminProducts(
          productPage,
          productSearch,
          productStatus,
          productCategory,
        );
      } else {
        toast.error(data.message || "Failed to update product");
      }
    } catch (e) {
      console.error("Update product error:", e);
      toast.error("Network error");
    }
  };

  const uploadProductImage = async (file) => {
    try {
      setUploadingProductImage(true);
      const token = localStorage.getItem("adminToken");
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch(
        `${API_BASE_URL}/api/upload/admin/product-image`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );
      const data = await res.json();
      if (res.ok && data.photoUrl) {
        setProductForm((prev) => ({ ...prev, imageUrl: data.photoUrl }));
        toast.success("Image uploaded");
      } else {
        toast.error(data.message || "Failed to upload image");
      }
    } catch (e) {
      console.error("Upload image error:", e);
      toast.error("Failed to upload image");
    } finally {
      setUploadingProductImage(false);
    }
  };

  const deleteProduct = async (p) => {
    if (!window.confirm(`Delete product "${p.name}"?`)) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/products/${p._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Product deleted");
        fetchAdminProducts(
          productPage,
          productSearch,
          productStatus,
          productCategory,
        );
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch (e) {
      console.error("Delete product error:", e);
      toast.error("Network error");
    }
  };

  // Product purchase details functions
  const fetchProductPurchases = async (
    productId,
    page = 1,
    status = "",
    paymentStatus = "",
    startDate = "",
    endDate = "",
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const res = await fetch(
        `${API_BASE_URL}/api/orders/admin/products/${productId}/purchases?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setProductPurchases(data.orders || []);
        setProductPurchaseStats(data.stats || null);
        setProductPurchaseTotalPages(data.pagination?.total || 1);
        setProductPurchasePage(data.pagination?.current || 1);
      } else {
        toast.error("Failed to fetch product purchases");
      }
    } catch (e) {
      console.error("Product purchases fetch error:", e);
      toast.error("Network error occurred");
    }
  };

  const openProductPurchases = (product) => {
    setSelectedProduct(product);
    setShowProductPurchases(true);
    setProductPurchasePage(1);
    setProductPurchaseStatus("");
    setProductPurchasePaymentStatus("");
    setProductPurchaseStartDate("");
    setProductPurchaseEndDate("");
    fetchProductPurchases(product._id);
  };

  const closeProductPurchases = () => {
    setShowProductPurchases(false);
    setProductPurchases([]);
    setProductPurchaseStats(null);
    setSelectedProduct(null);
  };

  // Shop Analytics functions
  const fetchShopPayments = async (
    page = 1,
    search = "",
    status = "",
    method = "",
    startDate = "",
    endDate = "",
    category = "",
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(status && { status }),
        ...(method && { method }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(category && { category }),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/admin/shop-payments?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setShopPayments(data.payments || []);
        setShopPaymentTotalPages(data.pagination?.pages || 1);
        setShopPaymentPage(data.pagination?.current || 1);
      } else {
        toast.error("Failed to fetch shop payments");
      }
    } catch (error) {
      console.error("Shop payments fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const fetchShopAnalytics = async (startDate = "", endDate = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/admin/shop-analytics?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setShopAnalytics(data);
      } else {
        toast.error("Failed to fetch shop analytics");
      }
    } catch (error) {
      console.error("Shop analytics fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const fetchShopPaymentDetails = async (paymentId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/shop-payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedShopPayment(data.payment);
        setShowShopPaymentDetails(true);
      } else {
        toast.error("Failed to fetch payment details");
      }
    } catch (error) {
      console.error("Payment details fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const getShopPaymentStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "initiated":
        return "text-blue-600 bg-blue-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      case "refunded":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case "razorpay":
      case "card":
      case "upi":
        return "💳";
      case "stripe":
        return "🔄";
      case "cod":
      case "cash_on_delivery":
        return "💵";
      case "wallet":
        return "👝";
      default:
        return "💰";
    }
  };

  // Payment management functions
  const fetchPayments = async (
    page = 1,
    search = "",
    status = "",
    planId = "",
    startDate = "",
    endDate = "",
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(planId && { planId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/admin/payments?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setPaymentTotalPages(data.totalPages);
        setPaymentPage(data.currentPage);
      } else {
        toast.error("Failed to fetch payments");
      }
    } catch (error) {
      console.error("Payments fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/api/admin/payments/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStats(data);
      } else {
        toast.error("Failed to fetch payment statistics");
      }
    } catch (error) {
      console.error("Payment stats fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const fetchPaymentDetails = async (paymentId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedPayment(data);
        setShowPaymentDetails(true);
      } else {
        toast.error("Failed to fetch payment details");
      }
    } catch (error) {
      console.error("Payment details fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const formatCurrency = (amount, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      case "refunded":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Plan management functions
  const fetchPlans = async (
    page = 1,
    search = "",
    status = "",
    category = "",
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(category && { category }),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/admin/plans?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
        setPlanTotalPages(data.pagination.pages);
        setPlanPage(data.pagination.current);
      } else {
        toast.error("Failed to fetch plans");
      }
    } catch (error) {
      console.error("Plans fetch error:", error);
      toast.error("Network error occurred");
    }
  };

  const fetchPlanById = async (planId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/plans/${planId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        return data.plan;
      } else {
        toast.error("Failed to fetch plan details");
        return null;
      }
    } catch (error) {
      console.error("Plan fetch error:", error);
      toast.error("Network error occurred");
      return null;
    }
  };

  const createPlan = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/api/admin/plans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createPlanForm),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Plan created successfully");
        setShowCreatePlan(false);
        setCreatePlanForm({
          planId: "",
          name: "",
          description: "",
          price: { amount: 0, currency: "INR", period: "monthly" },
          features: [],
          jobPostingLimit: 0,
          featuredJobsLimit: 0,
          prioritySupport: false,
          advancedAnalytics: false,
          customBranding: false,
          apiAccess: false,
          whiteLabel: false,
          dedicatedSupport: false,
          trialDays: 0,
          trialAvailable: false,
          billingCycle: "monthly",
          autoRenew: true,
          tags: [],
          category: "standard",
          isActive: true,
          isAvailable: true,
          sortOrder: 0,
        });
        fetchPlans(planPage, planSearch, planStatus, planCategory);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to create plan");
      }
    } catch (error) {
      console.error("Create plan error:", error);
      toast.error("Network error occurred");
    }
  };

  const updatePlan = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/plans/${selectedPlan.planId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editPlanForm),
        },
      );

      if (response.ok) {
        toast.success("Plan updated successfully");
        setShowEditPlan(false);
        fetchPlans(planPage, planSearch, planStatus, planCategory);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update plan");
      }
    } catch (error) {
      console.error("Update plan error:", error);
      toast.error("Network error occurred");
    }
  };

  const deletePlan = async (planId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this plan? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/plans/${planId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        toast.success("Plan deleted successfully");
        fetchPlans(planPage, planSearch, planStatus, planCategory);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete plan");
      }
    } catch (error) {
      console.error("Delete plan error:", error);
      toast.error("Network error occurred");
    }
  };

  const togglePlanStatus = async (planId, isActive) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/plans/${planId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive }),
        },
      );

      if (response.ok) {
        toast.success(
          `Plan ${isActive ? "activated" : "deactivated"} successfully`,
        );
        fetchPlans(planPage, planSearch, planStatus, planCategory);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update plan status");
      }
    } catch (error) {
      console.error("Toggle plan status error:", error);
      toast.error("Network error occurred");
    }
  };

  const openCreatePlanModal = () => {
    setCreatePlanForm({
      planId: "",
      name: "",
      description: "",
      price: { amount: 0, currency: "INR", period: "monthly" },
      features: [],
      jobPostingLimit: 0,
      featuredJobsLimit: 0,
      prioritySupport: false,
      advancedAnalytics: false,
      customBranding: false,
      apiAccess: false,
      whiteLabel: false,
      dedicatedSupport: false,
      trialDays: 0,
      trialAvailable: false,
      billingCycle: "monthly",
      autoRenew: true,
      tags: [],
      category: "standard",
      isActive: true,
      isAvailable: true,
      sortOrder: 0,
    });
    setCreatePlanErrors({});
    setShowCreatePlan(true);
  };

  const openEditPlanModal = async (plan) => {
    const planDetails = await fetchPlanById(plan.planId);
    if (planDetails) {
      setEditPlanForm(planDetails);
      setSelectedPlan(plan);
      setEditPlanErrors({});
      setShowEditPlan(true);
    }
  };

  const openViewPlanModal = async (plan) => {
    const planDetails = await fetchPlanById(plan.planId);
    if (planDetails) {
      setSelectedPlan(planDetails);
      setShowViewPlan(true);
    }
  };

  const addFeature = (formType) => {
    const form = formType === "create" ? createPlanForm : editPlanForm;
    const setForm = formType === "create" ? setCreatePlanForm : setEditPlanForm;

    setForm({
      ...form,
      features: [
        ...form.features,
        { name: "", included: true, description: "" },
      ],
    });
  };

  const updateFeature = (index, field, value, formType) => {
    const form = formType === "create" ? createPlanForm : editPlanForm;
    const setForm = formType === "create" ? setCreatePlanForm : setEditPlanForm;

    const newFeatures = [...form.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setForm({ ...form, features: newFeatures });
  };

  const removeFeature = (index, formType) => {
    const form = formType === "create" ? createPlanForm : editPlanForm;
    const setForm = formType === "create" ? setCreatePlanForm : setEditPlanForm;

    const newFeatures = form.features.filter((_, i) => i !== index);
    setForm({ ...form, features: newFeatures });
  };

  const addTag = (formType) => {
    const form = formType === "create" ? createPlanForm : editPlanForm;
    const setForm = formType === "create" ? setCreatePlanForm : setEditPlanForm;

    setForm({
      ...form,
      tags: [...form.tags, ""],
    });
  };

  const updateTag = (index, value, formType) => {
    const form = formType === "create" ? createPlanForm : editPlanForm;
    const setForm = formType === "create" ? setCreatePlanForm : setEditPlanForm;

    const newTags = [...form.tags];
    newTags[index] = value;
    setForm({ ...form, tags: newTags });
  };

  const removeTag = (index, formType) => {
    const form = formType === "create" ? createPlanForm : editPlanForm;
    const setForm = formType === "create" ? setCreatePlanForm : setEditPlanForm;

    const newTags = form.tags.filter((_, i) => i !== index);
    setForm({ ...form, tags: newTags });
  };

  const openQueryModal = (q) => {
    setSelectedQuery(q);
    setNotesDraft(q.adminNotes || "");
    setShowQueryModal(true);
  };

  const saveQueryNotes = async () => {
    if (!selectedQuery) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE_URL}/api/admin/queries/${selectedQuery._id}/notes`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminNotes: notesDraft }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Notes saved");
        setQueries((prev) =>
          prev.map((q) => (q._id === selectedQuery._id ? data.query : q)),
        );
        setSelectedQuery(data.query);
      } else {
        toast.error(data.message || "Failed to save notes");
      }
    } catch (e) {
      console.error("Save notes error:", e);
      toast.error("Network error");
    }
  };

  const deleteQuery = async (q) => {
    if (!window.confirm("Delete this query? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/queries/${q._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Query deleted");
        setQueries((prev) => prev.filter((x) => x._id !== q._id));
        if (selectedQuery && selectedQuery._id === q._id)
          setShowQueryModal(false);
      } else {
        toast.error(data.message || "Failed to delete query");
      }
    } catch (e) {
      console.error("Delete query error:", e);
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                className="md:hidden mr-3 text-gray-700 border rounded-md px-2 py-1"
                onClick={() => setMobileOpen(true)}
              >
                ☰
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                JobZee Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {admin.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
          admin={admin}
        />
        {/* Mobile drawer */}
        <AdminSidebar
          isMobile
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
          admin={admin}
        />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Stats */}
          {activeTab === "dashboard" && dashboardData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {dashboardData.stats.totalUsers}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Employers
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {dashboardData.stats.totalEmployers}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <svg
                        className="w-6 h-6 text-green-600"
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
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Jobs
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {dashboardData.stats.totalJobs}
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Jobs
                      </p>
                      <p className="text-3xl font-bold text-indigo-600">
                        {dashboardData.stats.activeJobs}
                      </p>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded-full">
                      <svg
                        className="w-6 h-6 text-indigo-600"
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
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending Jobs
                      </p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {dashboardData.stats.pendingJobs}
                      </p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <svg
                        className="w-6 h-6 text-yellow-600"
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
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Rejected Jobs
                      </p>
                      <p className="text-3xl font-bold text-red-600">
                        {dashboardData.stats.rejectedJobs}
                      </p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-full">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Users
                  </h3>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.users.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Jobs
                  </h3>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.jobs.map((job) => (
                      <div
                        key={job._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {job.title}
                          </p>
                          <p className="text-sm text-gray-600">{job.company}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${job.status === "active"
                              ? "bg-green-100 text-green-800"
                              : job.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                              }`}
                          >
                            {job.status}
                          </span>
                          <div className="text-sm text-gray-500">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">
                      Start date
                    </label>
                    <input
                      type="date"
                      value={orderStatsStartDate}
                      onChange={(e) => setOrderStatsStartDate(e.target.value)}
                      className="mt-1 border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">
                      End date
                    </label>
                    <input
                      type="date"
                      value={orderStatsEndDate}
                      onChange={(e) => setOrderStatsEndDate(e.target.value)}
                      className="mt-1 border rounded px-3 py-2"
                    />
                  </div>
                  <button
                    onClick={fetchAdminOrderStats}
                    className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {orderStats && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="text-sm text-gray-600">Total Orders</div>
                      <div className="text-2xl font-bold">
                        {orderStats.total?.totalOrders || 0}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="text-sm text-gray-600">Total Revenue</div>
                      <div className="text-2xl font-bold">
                        {orderStats.total?.totalRevenue?.toFixed
                          ? orderStats.total.totalRevenue.toFixed(2)
                          : orderStats.total?.totalRevenue || 0}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="text-sm text-gray-600">Items Sold</div>
                      <div className="text-2xl font-bold">
                        {orderStats.total?.totalItemsSold || 0}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="text-sm text-gray-600">
                        Unique Customers
                      </div>
                      <div className="text-2xl font-bold">
                        {orderStats.total?.uniqueCustomers || 0}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="font-semibold mb-3">Payment Status</div>
                      <div className="space-y-2">
                        {(orderStats.paymentsByStatus || []).map((p) => (
                          <div
                            key={p._id}
                            className="flex justify-between text-sm"
                          >
                            <span className="capitalize">
                              {p._id || "unknown"}
                            </span>
                            <span>
                              {p.count} •{" "}
                              {p.amount?.toFixed
                                ? p.amount.toFixed(2)
                                : p.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="font-semibold mb-3">Payment Method</div>
                      <div className="space-y-2">
                        {(orderStats.paymentsByMethod || []).map((p) => (
                          <div
                            key={p._id}
                            className="flex justify-between text-sm"
                          >
                            <span className="capitalize">
                              {p._id || "unknown"}
                            </span>
                            <span>
                              {p.count} •{" "}
                              {p.amount?.toFixed
                                ? p.amount.toFixed(2)
                                : p.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="font-semibold mb-3">
                        Revenue by Product
                      </div>
                      <div className="divide-y">
                        {(orderStats.revenueByProduct || []).map((r) => (
                          <div
                            key={r.productId}
                            className="py-2 flex justify-between text-sm"
                          >
                            <span className="truncate mr-3">
                              {r.name || String(r.productId).slice(-6)}
                            </span>
                            <span>
                              {r.quantitySold} •{" "}
                              {r.revenue?.toFixed
                                ? r.revenue.toFixed(2)
                                : r.revenue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="font-semibold mb-3">
                        Revenue by Category
                      </div>
                      <div className="divide-y">
                        {(orderStats.revenueByCategory || []).map((r) => (
                          <div
                            key={r._id || "unknown"}
                            className="py-2 flex justify-between text-sm"
                          >
                            <span className="truncate mr-3">
                              {r._id || "Unknown"}
                            </span>
                            <span>
                              {r.quantitySold} •{" "}
                              {r.revenue?.toFixed
                                ? r.revenue.toFixed(2)
                                : r.revenue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {activeTab === "events" && <AdminEventsModeration />}

          {/* Tests Management */}
          {activeTab === "tests" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Tests Management</h2>
                {testSubTab === 'management' && (
                  <button
                    onClick={() => setShowCreateTest(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Create Test
                  </button>
                )}
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-4 border-b border-gray-200">
                <button
                  onClick={() => setTestSubTab('management')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    testSubTab === 'management'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Test Management
                </button>
                <button
                  onClick={() => setTestSubTab('performance')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    testSubTab === 'performance'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Performance Monitor
                </button>
              </div>

              {/* Test Management Tab */}
              {testSubTab === 'management' && (
                <>
              {/* Validation Summary */}
              {tests.length > 0 && (() => {
                const testsWithoutQuestions = tests.filter(t => !t.questions || t.questions.length === 0);
                const inactiveTests = tests.filter(t => !t.isActive);
                
                if (testsWithoutQuestions.length > 0) {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-600 text-xl">⚠️</span>
                        <div>
                          <h4 className="font-semibold text-yellow-900 mb-1">
                            {testsWithoutQuestions.length} test{testsWithoutQuestions.length !== 1 ? 's' : ''} without questions
                          </h4>
                          <p className="text-sm text-yellow-800">
                            These tests cannot be activated until questions are added. Click "View" to add questions.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Tests List */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Marks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Questions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tests.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                            No tests found. Create your first test to get started.
                          </td>
                        </tr>
                      ) : (
                        tests.map((test) => (
                          <tr key={test._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {test.title}
                                </div>
                                {!test.isActive && test.questions && test.questions.length > 0 && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                                    Ready to Publish
                                  </span>
                                )}
                              </div>
                              {test.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {test.description}
                                </div>
                              )}
                              {test.jobRole && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Role: {test.jobRole}
                                </div>
                              )}
                              {test.skill && (
                                <div className="text-xs text-purple-600 mt-1">
                                  Skill: {test.skill}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {test.type?.toUpperCase() || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                {test.category || 'General'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {test.duration} mins
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {test.totalMarks} / {test.passingMarks}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                (test.questions?.length || 0) > 0
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {test.questions?.length || 0}
                              </span>
                              {(test.questions?.length || 0) === 0 && (
                                <div className="text-xs text-yellow-600 mt-1">No questions</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                test.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {test.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedTest(test);
                                  setShowViewTest(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTest(test);
                                  setTestForm({
                                    title: test.title,
                                    description: test.description || "",
                                    jobRole: test.jobRole || "",
                                    skill: test.skill || "",
                                    type: test.type,
                                    duration: test.duration,
                                    totalMarks: test.totalMarks,
                                    passingMarks: test.passingMarks,
                                    category: test.category,
                                    difficulty: test.difficulty,
                                    isActive: test.isActive,
                                  });
                                  setShowEditTest(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => toggleTestStatus(test)}
                                className={`${
                                  !test.isActive && (!test.questions || test.questions.length === 0)
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-yellow-600 hover:text-yellow-900'
                                }`}
                                disabled={!test.isActive && (!test.questions || test.questions.length === 0)}
                                title={
                                  !test.isActive && (!test.questions || test.questions.length === 0)
                                    ? 'Add questions before activating'
                                    : test.isActive 
                                      ? 'Deactivate test' 
                                      : 'Activate test'
                                }
                              >
                                {test.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => deleteTest(test._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create Test Modal */}
              {showCreateTest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-4">Create New Test</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={testForm.title}
                            onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                            onFocus={() => handleTestFieldFocus('title')}
                            onBlur={() => handleTestFieldBlur('title')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                              testFormErrors.title && testFormTouched.title
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder="Enter test title"
                          />
                          {testFormErrors.title && testFormTouched.title && (
                            <p className="mt-1 text-sm text-red-600">{testFormErrors.title}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={testForm.description}
                            onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Enter test description"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Job Role
                            </label>
                            <input
                              type="text"
                              value={testForm.jobRole}
                              onChange={(e) => setTestForm({ ...testForm, jobRole: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Software Developer, Data Analyst"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Skill
                            </label>
                            <input
                              type="text"
                              value={testForm.skill}
                              onChange={(e) => setTestForm({ ...testForm, skill: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., JavaScript, Python, SQL"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Type *
                            </label>
                            <select
                              value={testForm.type}
                              onChange={(e) => setTestForm({ ...testForm, type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="mcq">Multiple Choice</option>
                              <option value="coding">Coding</option>
                              <option value="mixed">Mixed</option>
                              <option value="essay">Essay</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration (minutes)
                            </label>
                            <input
                              type="number"
                              value={testForm.duration}
                              onChange={(e) => setTestForm({ ...testForm, duration: parseInt(e.target.value) || 0 })}
                              onFocus={() => handleTestFieldFocus('duration')}
                              onBlur={() => handleTestFieldBlur('duration')}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                                testFormErrors.duration && testFormTouched.duration
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                              min="1"
                              max="480"
                            />
                            {testFormErrors.duration && testFormTouched.duration && (
                              <p className="mt-1 text-sm text-red-600">{testFormErrors.duration}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total Marks
                            </label>
                            <input
                              type="number"
                              value={testForm.totalMarks}
                              onChange={(e) => setTestForm({ ...testForm, totalMarks: parseInt(e.target.value) || 0 })}
                              onFocus={() => handleTestFieldFocus('totalMarks')}
                              onBlur={() => handleTestFieldBlur('totalMarks')}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                                testFormErrors.totalMarks && testFormTouched.totalMarks
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                              min="1"
                              max="1000"
                            />
                            {testFormErrors.totalMarks && testFormTouched.totalMarks && (
                              <p className="mt-1 text-sm text-red-600">{testFormErrors.totalMarks}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Passing Marks
                            </label>
                            <input
                              type="number"
                              value={testForm.passingMarks}
                              onChange={(e) => setTestForm({ ...testForm, passingMarks: parseInt(e.target.value) || 0 })}
                              onFocus={() => handleTestFieldFocus('passingMarks')}
                              onBlur={() => handleTestFieldBlur('passingMarks')}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                                testFormErrors.passingMarks && testFormTouched.passingMarks
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                              min="1"
                              max={testForm.totalMarks}
                            />
                            {testFormErrors.passingMarks && testFormTouched.passingMarks && (
                              <p className="mt-1 text-sm text-red-600">{testFormErrors.passingMarks}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <select
                              value={testForm.category}
                              onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="technical">Technical</option>
                              <option value="aptitude">Aptitude</option>
                              <option value="reasoning">Reasoning</option>
                              <option value="language">Language</option>
                              <option value="general">General Knowledge</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Difficulty
                            </label>
                            <select
                              value={testForm.difficulty}
                              onChange={(e) => setTestForm({ ...testForm, difficulty: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <span className="text-yellow-600 text-lg">ℹ️</span>
                            <div className="text-sm text-yellow-800">
                              <strong>Note:</strong> New tests are created as inactive. After creating, add questions in the test details view, then activate the test.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => {
                            setShowCreateTest(false);
                            setTestForm({
                              title: "",
                              description: "",
                              jobRole: "",
                              skill: "",
                              type: "mcq",
                              duration: 30,
                              totalMarks: 100,
                              passingMarks: 40,
                              category: "technical",
                              difficulty: "medium",
                              isActive: false,
                            });
                            setTestFormErrors({});
                            setTestFormTouched({});
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={createTest}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Create Test
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Test Modal */}
              {showEditTest && selectedTest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-4">Edit Test</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={testForm.title}
                            onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={testForm.description}
                            onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="3"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Job Role
                            </label>
                            <input
                              type="text"
                              value={testForm.jobRole}
                              onChange={(e) => setTestForm({ ...testForm, jobRole: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Software Developer, Data Analyst"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Skill
                            </label>
                            <input
                              type="text"
                              value={testForm.skill}
                              onChange={(e) => setTestForm({ ...testForm, skill: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., JavaScript, Python, SQL"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Type *
                            </label>
                            <select
                              value={testForm.type}
                              onChange={(e) => setTestForm({ ...testForm, type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="mcq">Multiple Choice</option>
                              <option value="coding">Coding</option>
                              <option value="mixed">Mixed</option>
                              <option value="essay">Essay</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration (minutes)
                            </label>
                            <input
                              type="number"
                              value={testForm.duration}
                              onChange={(e) => setTestForm({ ...testForm, duration: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              min="1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total Marks
                            </label>
                            <input
                              type="number"
                              value={testForm.totalMarks}
                              onChange={(e) => setTestForm({ ...testForm, totalMarks: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              min="1"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Passing Marks
                            </label>
                            <input
                              type="number"
                              value={testForm.passingMarks}
                              onChange={(e) => setTestForm({ ...testForm, passingMarks: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              min="1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <select
                              value={testForm.category}
                              onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="technical">Technical</option>
                              <option value="aptitude">Aptitude</option>
                              <option value="reasoning">Reasoning</option>
                              <option value="language">Language</option>
                              <option value="general">General Knowledge</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Difficulty
                            </label>
                            <select
                              value={testForm.difficulty}
                              onChange={(e) => setTestForm({ ...testForm, difficulty: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={testForm.isActive}
                            onChange={(e) => setTestForm({ ...testForm, isActive: e.target.checked })}
                            className="mr-2"
                          />
                          <label className="text-sm font-medium text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => {
                            setShowEditTest(false);
                            setSelectedTest(null);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={updateTest}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Update Test
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View Test Modal with Questions */}
              {showViewTest && selectedTest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-4">Test Details & Questions</h3>
                      
                      {/* Test Info Section */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h4 className="font-semibold text-gray-700 mb-3">Test Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Title</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedTest.title}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Type</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedTest.type?.toUpperCase()}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Job Role</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedTest.jobRole || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Skill</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedTest.skill || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Duration</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedTest.duration} minutes</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Marks (Total/Passing)</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedTest.totalMarks} / {selectedTest.passingMarks}</p>
                          </div>
                        </div>
                      </div>

                      {/* Questions Section */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-gray-700">
                            Questions ({selectedTest.questions?.length || 0})
                          </h4>
                          <button
                            onClick={() => {
                              // Initialize question form based on test type
                              const testType = selectedTest.type || 'mcq';
                              if (testType === 'coding') {
                                setQuestionForm({
                                  questionText: '',
                                  type: 'coding',
                                  options: [],
                                  correctAnswer: '',
                                  marks: 1,
                                  explanation: '',
                                  codingDetails: {
                                    problemStatement: '',
                                    inputFormat: '',
                                    outputFormat: '',
                                    constraints: '',
                                    sampleInput: '',
                                    sampleOutput: '',
                                    expectedSolution: '',
                                    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
                                    starterCode: { javascript: '', python: '', java: '', cpp: '' },
                                    timeLimit: 2000,
                                    memoryLimit: 256
                                  },
                                  essayDetails: {
                                    wordLimit: 500,
                                    minWords: 100,
                                    gradingCriteria: '',
                                    expectedAnswer: ''
                                  }
                                });
                              } else if (testType === 'essay') {
                                setQuestionForm({
                                  questionText: '',
                                  type: 'essay',
                                  options: [],
                                  correctAnswer: '',
                                  marks: 1,
                                  explanation: '',
                                  codingDetails: {
                                    problemStatement: '',
                                    inputFormat: '',
                                    outputFormat: '',
                                    constraints: '',
                                    sampleInput: '',
                                    sampleOutput: '',
                                    expectedSolution: '',
                                    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
                                    starterCode: { javascript: '', python: '', java: '', cpp: '' },
                                    timeLimit: 2000,
                                    memoryLimit: 256
                                  },
                                  essayDetails: {
                                    wordLimit: 500,
                                    minWords: 100,
                                    gradingCriteria: '',
                                    expectedAnswer: ''
                                  }
                                });
                              } else {
                                setQuestionForm({
                                  questionText: '',
                                  type: 'mcq',
                                  options: ['', '', '', ''],
                                  correctAnswer: '',
                                  marks: 1,
                                  explanation: '',
                                  codingDetails: {
                                    problemStatement: '',
                                    inputFormat: '',
                                    outputFormat: '',
                                    constraints: '',
                                    sampleInput: '',
                                    sampleOutput: '',
                                    expectedSolution: '',
                                    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
                                    starterCode: { javascript: '', python: '', java: '', cpp: '' },
                                    timeLimit: 2000,
                                    memoryLimit: 256
                                  },
                                  essayDetails: {
                                    wordLimit: 500,
                                    minWords: 100,
                                    gradingCriteria: '',
                                    expectedAnswer: ''
                                  }
                                });
                              }
                              setShowAddQuestion(true);
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                          >
                            + Add Question
                          </button>
                        </div>

                        {/* Questions List */}
                        {selectedTest.questions && selectedTest.questions.length > 0 ? (
                          <div className="space-y-3">
                            {selectedTest.questions.map((question, index) => (
                              <div key={question._id || index} className="border rounded-lg p-4 bg-white">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">
                                        Q{index + 1}
                                      </span>
                                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                                        {question.type === 'mcq' ? 'MCQ' : 'True/False'}
                                      </span>
                                      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
                                        {question.marks} mark{question.marks !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <p className="text-gray-900 font-medium mb-2">{question.questionText}</p>
                                    
                                    {/* Options Display */}
                                    <div className="space-y-1.5 ml-4">
                                      {question.options?.map((option, optIdx) => (
                                        <div key={optIdx} className="flex items-center gap-2">
                                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                            option === question.correctAnswer
                                              ? 'bg-green-500 text-white'
                                              : 'bg-gray-200 text-gray-600'
                                          }`}>
                                            {String.fromCharCode(65 + optIdx)}
                                          </span>
                                          <span className={`text-sm ${
                                            option === question.correctAnswer
                                              ? 'text-green-700 font-medium'
                                              : 'text-gray-700'
                                          }`}>
                                            {option}
                                          </span>
                                          {option === question.correctAnswer && (
                                            <span className="text-green-600 text-xs">✓ Correct</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {question.explanation && (
                                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                                        <strong>Explanation:</strong> {question.explanation}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-2 ml-4">
                                    <button
                                      onClick={() => handleEditQuestion(question, index)}
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQuestion(question._id)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            No questions added yet. Click "Add Question" to get started.
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => {
                            setShowViewTest(false);
                            setSelectedTest(null);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add/Edit Question Modal */}
              {showAddQuestion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-4">
                        {questionForm._id ? 'Edit Question' : 'Add New Question'}
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Question Type Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question Type *
                          </label>
                          <select
                            value={questionForm.type}
                            onChange={(e) => {
                              const newType = e.target.value;
                              if (newType === 'true-false') {
                                setQuestionForm({
                                  ...questionForm,
                                  type: newType,
                                  options: ['True', 'False'],
                                  correctAnswer: ''
                                });
                              } else if (newType === 'coding') {
                                setQuestionForm({
                                  ...questionForm,
                                  type: newType,
                                  options: [],
                                  correctAnswer: '',
                                  codingDetails: {
                                    problemStatement: '',
                                    inputFormat: '',
                                    outputFormat: '',
                                    constraints: '',
                                    sampleInput: '',
                                    sampleOutput: '',
                                    expectedSolution: '',
                                    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
                                    starterCode: { javascript: '', python: '', java: '', cpp: '' },
                                    timeLimit: 2000,
                                    memoryLimit: 256
                                  }
                                });
                              } else if (newType === 'essay') {
                                setQuestionForm({
                                  ...questionForm,
                                  type: newType,
                                  options: [],
                                  correctAnswer: '',
                                  essayDetails: {
                                    wordLimit: 500,
                                    minWords: 100,
                                    gradingCriteria: '',
                                    expectedAnswer: ''
                                  }
                                });
                              } else {
                                setQuestionForm({
                                  ...questionForm,
                                  type: newType,
                                  options: ['', '', '', ''],
                                  correctAnswer: ''
                                });
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="mcq">Multiple Choice (MCQ)</option>
                            <option value="true-false">True / False</option>
                            <option value="coding">Coding Problem</option>
                            <option value="essay">Essay / Subjective</option>
                          </select>
                        </div>

                        {/* Question Text */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question Text *
                          </label>
                          <textarea
                            value={questionForm.questionText}
                            onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Enter the question"
                          />
                        </div>

                        {/* Options based on Question Type */}
                        {(questionForm.type === 'mcq' || questionForm.type === 'true-false') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Options *
                          </label>
                          
                          {questionForm.type === 'true-false' ? (
                            // True/False Options
                            <div className="space-y-2">
                              {questionForm.options.map((option, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                                  <input
                                    type="radio"
                                    name="correctAnswer"
                                    checked={questionForm.correctAnswer === option}
                                    onChange={() => setQuestionForm({ ...questionForm, correctAnswer: option })}
                                    className="w-4 h-4"
                                  />
                                  <span className="font-medium">{option}</span>
                                  <span className="text-xs text-gray-500 ml-auto">
                                    {questionForm.correctAnswer === option && '✓ Correct Answer'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // MCQ Options
                            <div className="space-y-3">
                              {questionForm.options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="correctAnswer"
                                    checked={questionForm.correctAnswer === option && option !== ''}
                                    onChange={() => setQuestionForm({ ...questionForm, correctAnswer: option })}
                                    disabled={!option}
                                    className="w-4 h-4"
                                  />
                                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-800">
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...questionForm.options];
                                      newOptions[index] = e.target.value;
                                      setQuestionForm({ ...questionForm, options: newOptions });
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                  />
                                </div>
                              ))}
                              <p className="text-xs text-gray-500 mt-2">
                                * Select the radio button next to the correct answer
                              </p>
                            </div>
                          )}
                        </div>
                        )}

                        {/* Coding Question Fields */}
                        {questionForm.type === 'coding' && questionForm.codingDetails && (
                          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800">Coding Problem Details</h4>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Problem Statement *
                              </label>
                              <textarea
                                value={questionForm.codingDetails.problemStatement}
                                onChange={(e) => setQuestionForm({
                                  ...questionForm,
                                  codingDetails: { ...questionForm.codingDetails, problemStatement: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                rows="4"
                                placeholder="Describe the problem..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Input Format
                                </label>
                                <textarea
                                  value={questionForm.codingDetails.inputFormat}
                                  onChange={(e) => setQuestionForm({
                                    ...questionForm,
                                    codingDetails: { ...questionForm.codingDetails, inputFormat: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  rows="2"
                                  placeholder="e.g., First line contains N..."
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Output Format
                                </label>
                                <textarea
                                  value={questionForm.codingDetails.outputFormat}
                                  onChange={(e) => setQuestionForm({
                                    ...questionForm,
                                    codingDetails: { ...questionForm.codingDetails, outputFormat: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  rows="2"
                                  placeholder="e.g., Print the sum..."
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Constraints
                              </label>
                              <textarea
                                value={questionForm.codingDetails.constraints}
                                onChange={(e) => setQuestionForm({
                                  ...questionForm,
                                  codingDetails: { ...questionForm.codingDetails, constraints: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                rows="2"
                                placeholder="e.g., 1 ≤ N ≤ 10^5"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Sample Input
                                </label>
                                <textarea
                                  value={questionForm.codingDetails.sampleInput}
                                  onChange={(e) => setQuestionForm({
                                    ...questionForm,
                                    codingDetails: { ...questionForm.codingDetails, sampleInput: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                                  rows="3"
                                  placeholder="Sample input..."
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Sample Output
                                </label>
                                <textarea
                                  value={questionForm.codingDetails.sampleOutput}
                                  onChange={(e) => setQuestionForm({
                                    ...questionForm,
                                    codingDetails: { ...questionForm.codingDetails, sampleOutput: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                                  rows="3"
                                  placeholder="Sample output..."
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Test Cases *
                              </label>
                              {questionForm.codingDetails.testCases.map((testCase, index) => (
                                <div key={index} className="mb-3 p-3 border rounded-lg bg-white">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-sm">Test Case {index + 1}</span>
                                    {index > 0 && (
                                      <button
                                        onClick={() => {
                                          const newTestCases = questionForm.codingDetails.testCases.filter((_, i) => i !== index);
                                          setQuestionForm({
                                            ...questionForm,
                                            codingDetails: { ...questionForm.codingDetails, testCases: newTestCases }
                                          });
                                        }}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 mb-2">
                                    <textarea
                                      value={testCase.input}
                                      onChange={(e) => {
                                        const newTestCases = [...questionForm.codingDetails.testCases];
                                        newTestCases[index].input = e.target.value;
                                        setQuestionForm({
                                          ...questionForm,
                                          codingDetails: { ...questionForm.codingDetails, testCases: newTestCases }
                                        });
                                      }}
                                      className="px-3 py-2 border rounded font-mono text-sm"
                                      rows="2"
                                      placeholder="Input"
                                    />
                                    <textarea
                                      value={testCase.expectedOutput}
                                      onChange={(e) => {
                                        const newTestCases = [...questionForm.codingDetails.testCases];
                                        newTestCases[index].expectedOutput = e.target.value;
                                        setQuestionForm({
                                          ...questionForm,
                                          codingDetails: { ...questionForm.codingDetails, testCases: newTestCases }
                                        });
                                      }}
                                      className="px-3 py-2 border rounded font-mono text-sm"
                                      rows="2"
                                      placeholder="Expected Output"
                                    />
                                  </div>
                                  <label className="flex items-center text-sm">
                                    <input
                                      type="checkbox"
                                      checked={testCase.isHidden}
                                      onChange={(e) => {
                                        const newTestCases = [...questionForm.codingDetails.testCases];
                                        newTestCases[index].isHidden = e.target.checked;
                                        setQuestionForm({
                                          ...questionForm,
                                          codingDetails: { ...questionForm.codingDetails, testCases: newTestCases }
                                        });
                                      }}
                                      className="mr-2"
                                    />
                                    Hidden test case (not shown to user)
                                  </label>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  setQuestionForm({
                                    ...questionForm,
                                    codingDetails: {
                                      ...questionForm.codingDetails,
                                      testCases: [...questionForm.codingDetails.testCases, { input: '', expectedOutput: '', isHidden: false }]
                                    }
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                + Add Test Case
                              </button>
                            </div>

                            {/* Expected Solution Field */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Solution / Model Answer
                                <span className="text-gray-500 text-xs ml-2">(Shown to user after submission)</span>
                              </label>
                              <textarea
                                value={questionForm.codingDetails.expectedSolution}
                                onChange={(e) => setQuestionForm({
                                  ...questionForm,
                                  codingDetails: { ...questionForm.codingDetails, expectedSolution: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                                rows="8"
                                placeholder="Enter the correct solution code that will be shown to users after they submit..."
                              />
                            </div>

                            {/* Language Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Programming Language
                                <span className="text-gray-500 text-xs ml-2">(For embedded editor)</span>
                              </label>
                              <select
                                value={questionForm.codingDetails.language || 'javascript'}
                                onChange={(e) => setQuestionForm({
                                  ...questionForm,
                                  codingDetails: { ...questionForm.codingDetails, language: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                              </select>
                            </div>

                            {/* Starter Code Section */}
                            <div className="border-t pt-4">
                              <h5 className="text-sm font-semibold text-gray-800 mb-3">Starter Code (Optional)</h5>
                              <p className="text-xs text-gray-600 mb-3">Provide starter code for each language. Users will see this when they open the embedded editor.</p>
                              
                              <div className="space-y-3">
                                {/* JavaScript Starter Code */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    JavaScript Starter Code
                                  </label>
                                  <textarea
                                    value={questionForm.codingDetails.starterCode.javascript}
                                    onChange={(e) => setQuestionForm({
                                      ...questionForm,
                                      codingDetails: {
                                        ...questionForm.codingDetails,
                                        starterCode: { ...questionForm.codingDetails.starterCode, javascript: e.target.value }
                                      }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                                    rows="4"
                                    placeholder="// JavaScript starter code\nfunction solution() {\n  // Your code here\n}"
                                  />
                                </div>

                                {/* Python Starter Code */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Python Starter Code
                                  </label>
                                  <textarea
                                    value={questionForm.codingDetails.starterCode.python}
                                    onChange={(e) => setQuestionForm({
                                      ...questionForm,
                                      codingDetails: {
                                        ...questionForm.codingDetails,
                                        starterCode: { ...questionForm.codingDetails.starterCode, python: e.target.value }
                                      }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                                    rows="4"
                                    placeholder="# Python starter code\ndef solution():\n    # Your code here\n    pass"
                                  />
                                </div>

                                {/* Java Starter Code */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Java Starter Code
                                  </label>
                                  <textarea
                                    value={questionForm.codingDetails.starterCode.java}
                                    onChange={(e) => setQuestionForm({
                                      ...questionForm,
                                      codingDetails: {
                                        ...questionForm.codingDetails,
                                        starterCode: { ...questionForm.codingDetails.starterCode, java: e.target.value }
                                      }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                                    rows="4"
                                    placeholder="// Java starter code\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}"
                                  />
                                </div>

                                {/* C++ Starter Code */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    C++ Starter Code
                                  </label>
                                  <textarea
                                    value={questionForm.codingDetails.starterCode.cpp}
                                    onChange={(e) => setQuestionForm({
                                      ...questionForm,
                                      codingDetails: {
                                        ...questionForm.codingDetails,
                                        starterCode: { ...questionForm.codingDetails.starterCode, cpp: e.target.value }
                                      }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                                    rows="4"
                                    placeholder="// C++ starter code\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Essay Question Fields */}
                        {questionForm.type === 'essay' && questionForm.essayDetails && (
                          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800">Essay Question Details</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Minimum Words
                                </label>
                                <input
                                  type="number"
                                  value={questionForm.essayDetails.minWords}
                                  onChange={(e) => setQuestionForm({
                                    ...questionForm,
                                    essayDetails: { ...questionForm.essayDetails, minWords: parseInt(e.target.value) }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  placeholder="100"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Word Limit
                                </label>
                                <input
                                  type="number"
                                  value={questionForm.essayDetails.wordLimit}
                                  onChange={(e) => setQuestionForm({
                                    ...questionForm,
                                    essayDetails: { ...questionForm.essayDetails, wordLimit: parseInt(e.target.value) }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  placeholder="500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Grading Criteria (Optional)
                              </label>
                              <textarea
                                value={questionForm.essayDetails.gradingCriteria}
                                onChange={(e) => setQuestionForm({
                                  ...questionForm,
                                  essayDetails: { ...questionForm.essayDetails, gradingCriteria: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                rows="3"
                                placeholder="What to look for when grading this essay..."
                              />
                            </div>

                            {/* Expected Answer for Essay */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Model Answer / Reference Solution
                                <span className="text-gray-500 text-xs ml-2">(Shown to user after submission)</span>
                              </label>
                              <textarea
                                value={questionForm.essayDetails.expectedAnswer}
                                onChange={(e) => setQuestionForm({
                                  ...questionForm,
                                  essayDetails: { ...questionForm.essayDetails, expectedAnswer: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                rows="6"
                                placeholder="Enter a model answer or key points that will be shown to users after they submit..."
                              />
                            </div>
                          </div>
                        )}

                        {/* Marks */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Marks
                          </label>
                          <input
                            type="number"
                            value={questionForm.marks}
                            onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>

                        {/* Explanation (Optional) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Explanation (Optional)
                          </label>
                          <textarea
                            value={questionForm.explanation}
                            onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="Explain the correct answer"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => {
                            setShowAddQuestion(false);
                            setQuestionForm({
                              questionText: '',
                              type: 'mcq',
                              options: ['', '', '', ''],
                              correctAnswer: '',
                              marks: 1,
                              explanation: '',
                              codingDetails: {
                                problemStatement: '',
                                inputFormat: '',
                                outputFormat: '',
                                constraints: '',
                                sampleInput: '',
                                sampleOutput: '',
                                testCases: [{ input: '', expectedOutput: '', isHidden: false }],
                                starterCode: { javascript: '', python: '', java: '', cpp: '' },
                                timeLimit: 2000,
                                memoryLimit: 256
                              },
                              essayDetails: {
                                wordLimit: 500,
                                minWords: 100,
                                gradingCriteria: ''
                              }
                            });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveQuestion}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          {questionForm._id ? 'Update Question' : 'Add Question'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                </>
              )}

              {/* Performance Monitor Tab */}
              {testSubTab === 'performance' && (
                <TestPerformanceMonitor tests={tests} />
              )}
            </div>
          )}

          {/* Payments Management */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              {/* Payment Statistics */}
              {paymentStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Payments
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {paymentStats.stats.totalPayments}
                        </p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Successful
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          {paymentStats.stats.successfulPayments}
                        </p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <svg
                          className="w-6 h-6 text-green-600"
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
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Revenue
                        </p>
                        <p className="text-3xl font-bold text-purple-600">
                          {formatCurrency(paymentStats.stats.successfulAmount)}
                        </p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full">
                        <svg
                          className="w-6 h-6 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Failed
                        </p>
                        <p className="text-3xl font-bold text-red-600">
                          {paymentStats.stats.failedPayments}
                        </p>
                      </div>
                      <div className="bg-red-100 p-3 rounded-full">
                        <svg
                          className="w-6 h-6 text-red-600"
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
                    </div>
                  </div>
                </div>
              )}

              {/* Payment List */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Payment Transactions
                    </h3>
                    <div className="space-x-2">
                      <button
                        onClick={() =>
                          fetchPayments(
                            paymentPage,
                            paymentSearch,
                            paymentStatus,
                            paymentPlan,
                            paymentStartDate,
                            paymentEndDate,
                          )
                        }
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Search by company..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <select
                      value={paymentPlan}
                      onChange={(e) => setPaymentPlan(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Plans</option>
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                    <input
                      type="date"
                      value={paymentStartDate}
                      onChange={(e) => setPaymentStartDate(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={paymentEndDate}
                      onChange={(e) => setPaymentEndDate(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="End Date"
                    />
                  </div>

                  <button
                    onClick={() =>
                      fetchPayments(
                        1,
                        paymentSearch,
                        paymentStatus,
                        paymentPlan,
                        paymentStartDate,
                        paymentEndDate,
                      )
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Apply Filters
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {payment.employerId?.companyName ||
                                  "Unknown Company"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {payment.employerId?.companyEmail || "No email"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {payment.planId}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.initiatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => fetchPaymentDetails(payment._id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {paymentTotalPages > 1 && (
                  <div className="px-6 py-3 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Page {paymentPage} of {paymentTotalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          fetchPayments(
                            paymentPage - 1,
                            paymentSearch,
                            paymentStatus,
                            paymentPlan,
                            paymentStartDate,
                            paymentEndDate,
                          )
                        }
                        disabled={paymentPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          fetchPayments(
                            paymentPage + 1,
                            paymentSearch,
                            paymentStatus,
                            paymentPlan,
                            paymentStartDate,
                            paymentEndDate,
                          )
                        }
                        disabled={paymentPage === paymentTotalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Management */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Products
                    </h3>
                    <div className="space-x-2">
                      <button
                        onClick={() =>
                          fetchAdminProducts(
                            productPage,
                            productSearch,
                            productStatus,
                            productCategory,
                          )
                        }
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                      >
                        Refresh
                      </button>
                      <button
                        onClick={openCreateProductModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        + New Product
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={productStatus}
                      onChange={(e) => setProductStatus(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      <option value="Books">Books</option>
                      <option value="Courses">Courses</option>
                      <option value="Templates">Templates</option>
                      <option value="Tools">Tools</option>
                      <option value="Certificates">Certificates</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Resume Services">Resume Services</option>
                      <option value="Interview Prep">Interview Prep</option>
                      <option value="Career Coaching">Career Coaching</option>
                      <option value="Skills Assessment">
                        Skills Assessment
                      </option>
                      <option value="Other">Other</option>
                    </select>
                    <button
                      onClick={() =>
                        fetchAdminProducts(
                          1,
                          productSearch,
                          productStatus,
                          productCategory,
                        )
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Visibility
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((p) => (
                        <tr key={p._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {p.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {p.shortDescription}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {p.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {p.currency} {Number(p.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${p.status === "active" ? "bg-green-100 text-green-800" : p.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${p.isVisible ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                            >
                              {p.isVisible ? "Visible" : "Hidden"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openProductPurchases(p)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View Purchases
                            </button>
                            <button
                              onClick={() => deleteProduct(p)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {productTotalPages > 1 && (
                  <div className="px-6 py-3 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Page {productPage} of {productTotalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          fetchAdminProducts(
                            productPage - 1,
                            productSearch,
                            productStatus,
                            productCategory,
                          )
                        }
                        disabled={productPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          fetchAdminProducts(
                            productPage + 1,
                            productSearch,
                            productStatus,
                            productCategory,
                          )
                        }
                        disabled={productPage === productTotalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Create/Edit Product Modal */}
              {(showCreateProduct || showEditProduct) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                    <h3 className="text-xl font-semibold mb-4">
                      {showCreateProduct ? "New Product" : "Edit Product"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Product Name */}
                      <div>
                        <input
                          value={productForm.name}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              name: e.target.value,
                            })
                          }
                          onFocus={() => handleProductFocus("name")}
                          onBlur={() => handleProductBlur("name")}
                          placeholder="Product Name *"
                          className={`px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 ${productErrors.name
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                            }`}
                        />
                        {productErrors.name && (
                          <p className="text-red-600 text-sm mt-1">
                            {productErrors.name}
                          </p>
                        )}
                      </div>
                      {/* Price */}
                      <div>
                        <input
                          value={productForm.price}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              price: e.target.value,
                            })
                          }
                          onFocus={() => handleProductFocus("price")}
                          onBlur={() => handleProductBlur("price")}
                          placeholder="Price *"
                          type="number"
                          step="0.01"
                          min="0"
                          className={`px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 ${productErrors.price
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                            }`}
                        />
                        {productErrors.price && (
                          <p className="text-red-600 text-sm mt-1">
                            {productErrors.price}
                          </p>
                        )}
                      </div>
                      {/* Currency */}
                      <select
                        value={productForm.currency}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            currency: e.target.value,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                      {/* Category */}
                      <select
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            category: e.target.value,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Books">Books</option>
                        <option value="Courses">Courses</option>
                        <option value="Templates">Templates</option>
                        <option value="Tools">Tools</option>
                        <option value="Certificates">Certificates</option>
                        <option value="Consultation">Consultation</option>
                        <option value="Resume Services">Resume Services</option>
                        <option value="Interview Prep">Interview Prep</option>
                        <option value="Career Coaching">Career Coaching</option>
                        <option value="Skills Assessment">
                          Skills Assessment
                        </option>
                        <option value="Other">Other</option>
                      </select>
                      {/* Product Type */}
                      <select
                        value={productForm.productType}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            productType: e.target.value,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="digital">Digital</option>
                        <option value="physical">Physical</option>
                        <option value="service">Service</option>
                      </select>
                      {/* Stock */}
                      <div>
                        <input
                          value={productForm.stock}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              stock: e.target.value,
                            })
                          }
                          onFocus={() => handleProductFocus("stock")}
                          onBlur={() => handleProductBlur("stock")}
                          placeholder={
                            productForm.isUnlimited
                              ? "Stock (Unlimited)"
                              : "Stock *"
                          }
                          type="number"
                          min="0"
                          disabled={productForm.isUnlimited}
                          className={`px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 ${productForm.isUnlimited
                            ? "bg-gray-100 text-gray-500"
                            : productErrors.stock
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                            }`}
                        />
                        {productErrors.stock && (
                          <p className="text-red-600 text-sm mt-1">
                            {productErrors.stock}
                          </p>
                        )}
                      </div>
                      {/* Product Image Upload */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Image
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadProductImage(f);
                            }}
                          />
                          {uploadingProductImage && (
                            <span className="text-sm text-gray-500">
                              Uploading...
                            </span>
                          )}
                        </div>
                        {productForm.imageUrl && (
                          <div className="mt-3">
                            <img
                              src={productForm.imageUrl}
                              alt="preview"
                              className="w-32 h-32 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                      {/* Image Alt Text */}
                      <div className="md:col-span-2">
                        <input
                          value={productForm.imageAlt}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              imageAlt: e.target.value,
                            })
                          }
                          onFocus={() => handleProductFocus("imageAlt")}
                          onBlur={() => handleProductBlur("imageAlt")}
                          placeholder={
                            productForm.imageUrl
                              ? "Image Alt Text *"
                              : "Image Alt Text"
                          }
                          className={`px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 ${productErrors.imageAlt
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                            }`}
                        />
                        {productErrors.imageAlt && (
                          <p className="text-red-600 text-sm mt-1">
                            {productErrors.imageAlt}
                          </p>
                        )}
                      </div>
                      {/* Short Description */}
                      <div className="md:col-span-2">
                        <textarea
                          value={productForm.shortDescription}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              shortDescription: e.target.value,
                            })
                          }
                          onFocus={() => handleProductFocus("shortDescription")}
                          onBlur={() => handleProductBlur("shortDescription")}
                          placeholder="Short Description (Optional)"
                          rows={2}
                          className={`px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 resize-none ${productErrors.shortDescription
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                            }`}
                        />
                        {productErrors.shortDescription && (
                          <p className="text-red-600 text-sm mt-1">
                            {productErrors.shortDescription}
                          </p>
                        )}
                      </div>
                      {/* Description */}
                      <div className="md:col-span-2">
                        <textarea
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              description: e.target.value,
                            })
                          }
                          onFocus={() => handleProductFocus("description")}
                          onBlur={() => handleProductBlur("description")}
                          placeholder="Product Description *"
                          rows={4}
                          className={`px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 resize-none ${productErrors.description
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                            }`}
                        />
                        {productErrors.description && (
                          <p className="text-red-600 text-sm mt-1">
                            {productErrors.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 md:col-span-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={productForm.isVisible}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                isVisible: e.target.checked,
                              })
                            }
                          />
                          <span>Visible</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={productForm.isFeatured}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                isFeatured: e.target.checked,
                              })
                            }
                          />
                          <span>Featured</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={productForm.isUnlimited}
                            onChange={(e) => {
                              const isUnlimited = e.target.checked;
                              setProductForm({
                                ...productForm,
                                isUnlimited,
                                stock: isUnlimited ? 0 : productForm.stock,
                              });
                              // Clear stock error if unlimited is checked
                              if (isUnlimited && productErrors.stock) {
                                setProductErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.stock;
                                  return newErrors;
                                });
                              }
                            }}
                          />
                          <span>Unlimited Stock</span>
                        </label>
                        <select
                          value={productForm.status}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              status: e.target.value,
                            })
                          }
                          className="px-3 py-2 border rounded"
                        >
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                          <option value="draft">draft</option>
                          <option value="archived">archived</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                      <button
                        onClick={() => {
                          setShowCreateProduct(false);
                          setShowEditProduct(false);
                        }}
                        className="px-4 py-2 rounded border"
                      >
                        Cancel
                      </button>
                      {showCreateProduct ? (
                        <button
                          onClick={createProduct}
                          className="px-4 py-2 rounded bg-blue-600 text-white"
                        >
                          Create
                        </button>
                      ) : (
                        <button
                          onClick={updateProduct}
                          className="px-4 py-2 rounded bg-green-600 text-white"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Plans Management */}
          {activeTab === "plans" && (
            <div className="space-y-6">
              {/* Plans List */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Subscription Plans
                    </h3>
                    <div className="space-x-2">
                      <button
                        onClick={() =>
                          fetchPlans(
                            planPage,
                            planSearch,
                            planStatus,
                            planCategory,
                          )
                        }
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                      >
                        Refresh
                      </button>
                      <button
                        onClick={openCreatePlanModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        + New Plan
                      </button>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Search plans..."
                      value={planSearch}
                      onChange={(e) => setPlanSearch(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={planStatus}
                      onChange={(e) => setPlanStatus(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                    <select
                      value={planCategory}
                      onChange={(e) => setPlanCategory(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <button
                    onClick={() =>
                      fetchPlans(1, planSearch, planStatus, planCategory)
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Apply Filters
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Features
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plans.map((plan) => (
                        <tr key={plan._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {plan.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {plan.planId}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {plan.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {plan.price?.amount
                                ? formatCurrency(
                                  plan.price.amount,
                                  plan.price.currency,
                                )
                                : "Free"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {plan.price?.period || "one-time"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {plan.features?.length || 0} features
                            </div>
                            <div className="text-xs text-gray-500">
                              {plan.jobPostingLimit
                                ? `${plan.jobPostingLimit} jobs`
                                : "Unlimited jobs"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.isActive
                                  ? "text-green-600 bg-green-100"
                                  : "text-red-600 bg-red-100"
                                  }`}
                              >
                                {plan.isActive ? "Active" : "Inactive"}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.isAvailable
                                  ? "text-blue-600 bg-blue-100"
                                  : "text-gray-600 bg-gray-100"
                                  }`}
                              >
                                {plan.isAvailable ? "Available" : "Unavailable"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {plan.category || "standard"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openViewPlanModal(plan)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openEditPlanModal(plan)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  togglePlanStatus(plan.planId, !plan.isActive)
                                }
                                className={`${plan.isActive ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}`}
                              >
                                {plan.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => deletePlan(plan.planId)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {planTotalPages > 1 && (
                  <div className="px-6 py-3 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Page {planPage} of {planTotalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          fetchPlans(
                            planPage - 1,
                            planSearch,
                            planStatus,
                            planCategory,
                          )
                        }
                        disabled={planPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          fetchPlans(
                            planPage + 1,
                            planSearch,
                            planStatus,
                            planCategory,
                          )
                        }
                        disabled={planPage === planTotalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Queries */}
          {activeTab === "queries" && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contact Queries
                  </h3>
                  <button
                    onClick={() =>
                      fetchQueries(queryPage, querySearch, queryStatus)
                    }
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search by name, email, subject..."
                    value={querySearch}
                    onChange={(e) => setQuerySearch(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={queryStatus}
                    onChange={(e) => setQueryStatus(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button
                    onClick={() => fetchQueries(1, querySearch, queryStatus)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Received
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queries.map((q) => (
                      <tr key={q._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {q.name}
                          </div>
                          <div className="text-sm text-gray-500">{q.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {q.subject}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-700 max-w-md truncate"
                          title={q.message}
                        >
                          {q.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${q.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : q.status === "in_progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                              }`}
                          >
                            {q.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(q.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {q.status !== "in_progress" && (
                            <button
                              onClick={() =>
                                updateQueryStatus(q._id, "in_progress")
                              }
                              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                            >
                              In Progress
                            </button>
                          )}
                          {q.status !== "resolved" && (
                            <button
                              onClick={() =>
                                updateQueryStatus(q._id, "resolved")
                              }
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            onClick={() => openQueryModal(q)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteQuery(q)}
                            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4">
                <div className="text-sm text-gray-600">
                  Page {queryPage} of {queryTotalPages}
                </div>
                <div className="space-x-2">
                  <button
                    disabled={queryPage <= 1}
                    onClick={() =>
                      fetchQueries(queryPage - 1, querySearch, queryStatus)
                    }
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={queryPage >= queryTotalPages}
                    onClick={() =>
                      fetchQueries(queryPage + 1, querySearch, queryStatus)
                    }
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Query Detail Modal */}
          {showQueryModal && selectedQuery && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <h3 className="text-xl font-semibold mb-4">Query Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                  <div>
                    <div className="text-sm text-gray-500">From</div>
                    <div className="font-medium">{selectedQuery.name}</div>
                    <div className="text-sm text-gray-600 break-all">
                      {selectedQuery.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Submitted</div>
                    <div className="font-medium">
                      {new Date(selectedQuery.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500">Subject</div>
                    <div className="font-medium">{selectedQuery.subject}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500">Message</div>
                    <div className="mt-1 p-3 border rounded bg-gray-50 whitespace-pre-wrap">
                      {selectedQuery.message}
                    </div>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">IP</div>
                      <div className="font-medium break-all">
                        {selectedQuery.metadata?.ip || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-500">User Agent</div>
                      <div className="font-medium break-all">
                        {selectedQuery.metadata?.userAgent || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500">Origin</div>
                    <div className="font-medium break-all">
                      {selectedQuery.metadata?.origin || "-"}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Admin Notes</div>
                      <div>
                        <select
                          value={selectedQuery.status}
                          onChange={(e) =>
                            updateQueryStatus(selectedQuery._id, e.target.value)
                          }
                          className="px-3 py-1 border rounded"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      className="mt-1 w-full border rounded px-3 py-2"
                      placeholder="Add internal notes..."
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowQueryModal(false)}
                    className="px-4 py-2 rounded border"
                  >
                    Close
                  </button>
                  <button
                    onClick={saveQueryNotes}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                  >
                    Save Notes
                  </button>
                  <button
                    onClick={() => deleteQuery(selectedQuery)}
                    className="px-4 py-2 rounded bg-gray-700 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Employer Modal */}
          {showCreateEmployer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Create Employer</h3>
                <div className="space-y-3">
                  <input
                    className={`w-full border px-3 py-2 rounded ${createEmployerErrors.companyName ? "border-red-300" : "border-gray-300"}`}
                    placeholder="Company Name"
                    value={createEmployerForm.companyName}
                    onChange={(e) => {
                      setCreateEmployerForm({
                        ...createEmployerForm,
                        companyName: e.target.value,
                      });
                      if (createEmployerErrors.companyName)
                        setCreateEmployerErrors((prev) => ({
                          ...prev,
                          companyName: "",
                        }));
                    }}
                    onFocus={() => handleCreateEmployerFocus("companyName")}
                    onBlur={() => handleCreateEmployerBlur("companyName")}
                  />
                  {createEmployerErrors.companyName && (
                    <p className="text-red-500 text-sm">
                      {createEmployerErrors.companyName}
                    </p>
                  )}
                  <input
                    className={`w-full border px-3 py-2 rounded ${createEmployerErrors.companyEmail ? "border-red-300" : "border-gray-300"}`}
                    placeholder="Company Email"
                    value={createEmployerForm.companyEmail}
                    onChange={(e) => {
                      setCreateEmployerForm({
                        ...createEmployerForm,
                        companyEmail: e.target.value,
                      });
                      if (createEmployerErrors.companyEmail)
                        setCreateEmployerErrors((prev) => ({
                          ...prev,
                          companyEmail: "",
                        }));
                    }}
                    onFocus={() => handleCreateEmployerFocus("companyEmail")}
                    onBlur={() => handleCreateEmployerBlur("companyEmail")}
                  />
                  {createEmployerErrors.companyEmail && (
                    <p className="text-red-500 text-sm">
                      {createEmployerErrors.companyEmail}
                    </p>
                  )}
                  <input
                    className={`w-full border px-3 py-2 rounded ${createEmployerErrors.contactPersonName ? "border-red-300" : "border-gray-300"}`}
                    placeholder="Contact Person Name"
                    value={createEmployerForm.contactPersonName}
                    onChange={(e) => {
                      setCreateEmployerForm({
                        ...createEmployerForm,
                        contactPersonName: e.target.value,
                      });
                      if (createEmployerErrors.contactPersonName)
                        setCreateEmployerErrors((prev) => ({
                          ...prev,
                          contactPersonName: "",
                        }));
                    }}
                    onFocus={() =>
                      handleCreateEmployerFocus("contactPersonName")
                    }
                    onBlur={() => handleCreateEmployerBlur("contactPersonName")}
                  />
                  {createEmployerErrors.contactPersonName && (
                    <p className="text-red-500 text-sm">
                      {createEmployerErrors.contactPersonName}
                    </p>
                  )}
                  <input
                    className={`w-full border px-3 py-2 rounded ${createEmployerErrors.phone ? "border-red-300" : "border-gray-300"}`}
                    placeholder="Phone (optional)"
                    value={createEmployerForm.phone}
                    onChange={(e) => {
                      setCreateEmployerForm({
                        ...createEmployerForm,
                        phone: e.target.value,
                      });
                      if (createEmployerErrors.phone)
                        setCreateEmployerErrors((prev) => ({
                          ...prev,
                          phone: "",
                        }));
                    }}
                    onBlur={() => handleCreateEmployerBlur("phone")}
                  />
                  {createEmployerErrors.phone && (
                    <p className="text-red-500 text-sm">
                      {createEmployerErrors.phone}
                    </p>
                  )}
                  <input
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Password (optional)"
                    type="password"
                    value={createEmployerForm.password}
                    onChange={(e) =>
                      setCreateEmployerForm({
                        ...createEmployerForm,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setShowCreateEmployer(false)}
                    className="px-4 py-2 rounded border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const errs = validateCreateEmployerForm();
                      setCreateEmployerErrors(errs);
                      if (Object.keys(errs).length > 0) return;
                      try {
                        const token = localStorage.getItem("adminToken");
                        const res = await fetch(
                          `${API_BASE_URL}/api/admin/employers`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${token}`,
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify(createEmployerForm),
                          },
                        );
                        const data = await res.json();
                        if (res.ok) {
                          toast.success("Employer created");
                          setShowCreateEmployer(false);
                          setCreateEmployerForm({
                            companyName: "",
                            companyEmail: "",
                            contactPersonName: "",
                            phone: "",
                            password: "",
                          });
                          fetchEmployers(1, searchTerm, filterStatus);
                        } else {
                          toast.error(
                            data.message || "Failed to create employer",
                          );
                        }
                      } catch (e) {
                        console.error("Create employer error:", e);
                        toast.error("Network error");
                      }
                    }}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Employers Management */}
          {activeTab === "employers" && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Employer Management
                  </h3>
                  <div className="space-x-2">
                    <button
                      onClick={() =>
                        fetchEmployers(1, searchTerm, filterStatus)
                      }
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateEmployer(true);
                        setCreateEmployerErrors({});
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      + New Employer
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search employers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <button
                    onClick={() => fetchEmployers(1, searchTerm, filterStatus)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employers.map((emp) => (
                      <tr key={emp._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">
                              {emp.companyName || emp.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {emp.companyEmail || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${emp.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                          >
                            {emp.isActive !== false ? "Active" : "Suspended"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${emp.isVerified ? "bg-green-100 text-green-800" : emp.verificationStatus === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                            >
                              {emp.isVerified
                                ? "Verified"
                                : emp.verificationStatus || "pending"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {emp.createdAt
                            ? new Date(emp.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => openViewEmployer(emp)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEmployer(emp);
                              setEditEmployerForm({
                                companyName: emp.companyName || "",
                                companyPhone: emp.companyPhone || "",
                                contactPersonName: emp.contactPersonName || "",
                              });
                              setShowEditEmployer(true);
                            }}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                          {!emp.isVerified &&
                            emp.verificationStatus !== "rejected" && (
                              <button
                                onClick={() =>
                                  updateEmployerVerification(emp._id, {
                                    isVerified: true,
                                    status: "verified",
                                  })
                                }
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                              >
                                Verify
                              </button>
                            )}
                          {emp.isVerified && (
                            <button
                              onClick={() =>
                                updateEmployerVerification(emp._id, {
                                  isVerified: false,
                                  status: "pending",
                                })
                              }
                              className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                            >
                              Unverify
                            </button>
                          )}
                          {!emp.isVerified && (
                            <button
                              onClick={() => {
                                const reason = prompt("Reason for rejection:");
                                if (reason !== null)
                                  updateEmployerVerification(emp._id, {
                                    status: "rejected",
                                    notes: reason,
                                  });
                              }}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          )}
                          {emp.isActive !== false ? (
                            <button
                              onClick={() => {
                                const reason = prompt("Reason for suspension:");
                                if (reason !== null)
                                  updateEmployerActiveStatus(
                                    emp._id,
                                    false,
                                    reason,
                                  );
                              }}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                updateEmployerActiveStatus(emp._id, true)
                              }
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `Delete employer ${emp.companyName}?`,
                                )
                              )
                                return;
                              try {
                                const token =
                                  localStorage.getItem("adminToken");
                                const res = await fetch(
                                  `${API_BASE_URL}/api/admin/employers/${emp._id}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  },
                                );
                                const data = await res.json();
                                if (res.ok) {
                                  toast.success(
                                    data.message || "Employer deleted",
                                  );
                                  setEmployers((prev) =>
                                    prev.filter((e) => e._id !== emp._id),
                                  );
                                } else {
                                  toast.error(
                                    data.message || "Failed to delete employer",
                                  );
                                }
                              } catch (e) {
                                console.error("Delete employer error:", e);
                                toast.error("Network error");
                              }
                            }}
                            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View Employer Modal */}
          {showViewEmployer && selectedEmployer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h3 className="text-xl font-semibold mb-4">Employer Details</h3>
                <div className="space-y-4 text-gray-800">
                  <div>
                    <div className="text-sm text-gray-500">Company:</div>
                    <div className="font-medium">
                      {selectedEmployer.companyName ||
                        selectedEmployer.name ||
                        "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email:</div>
                    <div className="font-medium break-all">
                      {selectedEmployer.companyEmail || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone:</div>
                    <div className="font-medium">
                      {selectedEmployer.companyPhone ||
                        selectedEmployer.contactPersonPhone ||
                        "-"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Status:</div>
                      <div className="font-medium">
                        {selectedEmployer.isApproved
                          ? "Approved"
                          : selectedEmployer.status === "rejected"
                            ? "Rejected"
                            : "Pending"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Joined:</div>
                      <div className="font-medium">
                        {selectedEmployer.createdAt
                          ? new Date(
                            selectedEmployer.createdAt,
                          ).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowViewEmployer(false)}
                    className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Employer Modal */}
          {showEditEmployer && selectedEmployer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit Employer</h3>
                <div className="space-y-3">
                  <input
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Company Name"
                    value={editEmployerForm.companyName}
                    onChange={(e) =>
                      setEditEmployerForm({
                        ...editEmployerForm,
                        companyName: e.target.value,
                      })
                    }
                  />
                  <input
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Company Phone"
                    value={editEmployerForm.companyPhone}
                    onChange={(e) =>
                      setEditEmployerForm({
                        ...editEmployerForm,
                        companyPhone: e.target.value,
                      })
                    }
                  />
                  <input
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Contact Person Name"
                    value={editEmployerForm.contactPersonName}
                    onChange={(e) =>
                      setEditEmployerForm({
                        ...editEmployerForm,
                        contactPersonName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setShowEditEmployer(false)}
                    className="px-4 py-2 rounded border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("adminToken");
                        const res = await fetch(
                          `${API_BASE_URL}/api/admin/employers/${selectedEmployer._id}`,
                          {
                            method: "PUT",
                            headers: {
                              Authorization: `Bearer ${token}`,
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify(editEmployerForm),
                          },
                        );
                        const data = await res.json();
                        if (res.ok) {
                          toast.success("Employer updated");
                          setShowEditEmployer(false);
                          setEmployers((prev) =>
                            prev.map((e) =>
                              e._id === selectedEmployer._id
                                ? { ...e, ...editEmployerForm }
                                : e,
                            ),
                          );
                        } else {
                          toast.error(
                            data.message || "Failed to update employer",
                          );
                        }
                      } catch (e) {
                        console.error("Edit employer error:", e);
                        toast.error("Network error");
                      }
                    }}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Users Management */}
          {activeTab === "users" && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    User Management
                  </h3>
                  <div className="space-x-2">
                    <button
                      onClick={() => fetchUsers(1, searchTerm, filterStatus)}
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateUser(true);
                        setCreateErrors({});
                        setCreateTouched({});
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      + New User
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <button
                    onClick={() => fetchUsers(1, searchTerm, filterStatus)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                              }`}
                          >
                            {user.isActive ? "Active" : "Suspended"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => openViewUser(user)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            View
                          </button>
                          {user.isActive ? (
                            <button
                              onClick={() => {
                                const reason = prompt("Reason for suspension:");
                                if (reason)
                                  updateUserStatus(user._id, false, reason);
                              }}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserStatus(user._id, true)}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => openEditUser(user)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteUser(user)}
                            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create User Modal */}
          {showCreateUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Create User</h3>
                <div className="space-y-3">
                  <input
                    className={`w-full border px-3 py-2 rounded ${createErrors.name ? "border-red-300" : "border-gray-300"}`}
                    placeholder="Name"
                    value={createForm.name}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, name: e.target.value });
                      if (createErrors.name)
                        setCreateErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    onFocus={() => handleCreateFocus("name")}
                    onBlur={() => handleCreateBlur("name")}
                  />
                  {createErrors.name && (
                    <p className="text-red-500 text-sm">{createErrors.name}</p>
                  )}
                  <input
                    className={`w-full border px-3 py-2 rounded ${createErrors.email ? "border-red-300" : "border-gray-300"}`}
                    placeholder="Email"
                    value={createForm.email}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, email: e.target.value });
                      if (createErrors.email)
                        setCreateErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    onFocus={() => handleCreateFocus("email")}
                    onBlur={() => handleCreateBlur("email")}
                  />
                  {createErrors.email && (
                    <p className="text-red-500 text-sm">{createErrors.email}</p>
                  )}
                  <input
                    className={`w-full border px-3 py-2 rounded ${createErrors.phone ? "border-red-300" : "border-gray-300"}`}
                    placeholder="Phone"
                    value={createForm.phone}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, phone: e.target.value });
                      if (createErrors.phone)
                        setCreateErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    onFocus={() => handleCreateFocus("phone")}
                    onBlur={() => handleCreateBlur("phone")}
                  />
                  {createErrors.phone && (
                    <p className="text-red-500 text-sm">{createErrors.phone}</p>
                  )}
                  <select
                    className="w-full border px-3 py-2 rounded"
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, role: e.target.value })
                    }
                  >
                    <option value="user">User</option>
                  </select>
                  <input
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Password (optional)"
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setShowCreateUser(false)}
                    className="px-4 py-2 rounded border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createUser}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {showEditUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit User</h3>
                <div className="space-y-3">
                  <input
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                  <input
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Phone"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                  <select
                    className="w-full border px-3 py-2 rounded"
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                  >
                    <option value="user">User</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setShowEditUser(false)}
                    className="px-4 py-2 rounded border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditUser}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View User Modal */}
          {showViewUser && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h3 className="text-xl font-semibold mb-4">User Details</h3>
                <div className="space-y-4 text-gray-800">
                  <div>
                    <div className="text-sm text-gray-500">Name:</div>
                    <div className="font-medium">
                      {selectedUser.name || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email:</div>
                    <div className="font-medium break-all">
                      {selectedUser.email || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone:</div>
                    <div className="font-medium">
                      {selectedUser.phone || "-"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Role:</div>
                      <div className="font-medium capitalize">
                        {selectedUser.role || "user"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Status:</div>
                      <div className="font-medium">
                        {selectedUser.isActive ? "Active" : "Suspended"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Joined:</div>
                    <div className="font-medium">
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowViewUser(false)}
                    className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Internships Management */}
          {activeTab === "internships" && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Internships Management
                  </h3>
                  <div className="space-x-2">
                    <button
                      onClick={() =>
                        fetchInternships(1, internshipSearch, internshipStatus)
                      }
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={openCreateInternshipModal}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      + New Internship
                    </button>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search by title or company..."
                    value={internshipSearch}
                    onChange={(e) => setInternshipSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={internshipStatus}
                    onChange={(e) => setInternshipStatus(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="active">Active</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={() =>
                      fetchInternships(1, internshipSearch, internshipStatus)
                    }
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {internships.map((internship) => (
                      <tr key={internship._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {internship.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {internship.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {internship.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {internship.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              openInternshipApplications(internship)
                            }
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {internship.applicationsCount || 0} applicants
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${internship.status === "active"
                              ? "bg-green-100 text-green-800"
                              : internship.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : internship.status === "approved"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {internship.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(internship.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {internship.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  updateInternshipStatus(
                                    internship._id,
                                    "approved",
                                  )
                                }
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  updateInternshipStatus(
                                    internship._id,
                                    "rejected",
                                  )
                                }
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {internship.status === "approved" && (
                            <button
                              onClick={() =>
                                updateInternshipStatus(internship._id, "active")
                              }
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => openEditInternship(internship)}
                            className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteInternship(internship)}
                            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="text-sm text-gray-600">
                  Page {internshipPage} of {internshipTotalPages}
                </div>
                <div className="space-x-2">
                  <button
                    disabled={internshipPage <= 1}
                    onClick={() =>
                      fetchInternships(
                        internshipPage - 1,
                        internshipSearch,
                        internshipStatus,
                      )
                    }
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={internshipPage >= internshipTotalPages}
                    onClick={() =>
                      fetchInternships(
                        internshipPage + 1,
                        internshipSearch,
                        internshipStatus,
                      )
                    }
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Internship Modal */}
          {showEditInternship && selectedInternship && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Edit Internship</h3>
                  <button
                    onClick={() => setShowEditInternship(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                {Object.keys(internshipFormErrors).length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Please fix the following errors:
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <ul className="list-disc list-inside space-y-1">
                            {Object.entries(internshipFormErrors).map(
                              ([field, error]) => (
                                <li key={field}>{error}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Internship Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={internshipForm.title}
                      onChange={(e) =>
                        handleInternshipFormChange("title", e.target.value)
                      }
                      className={`w-full border rounded px-3 py-2 ${internshipFormErrors.title ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                      placeholder="Enter internship title"
                    />
                    {internshipFormErrors.title && (
                      <p className="text-red-500 text-xs mt-1">
                        {internshipFormErrors.title}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="5"
                      value={internshipForm.description}
                      onChange={(e) =>
                        handleInternshipFormChange(
                          "description",
                          e.target.value,
                        )
                      }
                      className={`w-full border rounded px-3 py-2 ${internshipFormErrors.description ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                      placeholder="Enter internship description"
                    />
                    {internshipFormErrors.description && (
                      <p className="text-red-500 text-xs mt-1">
                        {internshipFormErrors.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stipend Min
                    </label>
                    <input
                      type="number"
                      value={internshipForm.stipendMin}
                      onChange={(e) =>
                        handleInternshipFormChange("stipendMin", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g. 5000"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stipend Max
                    </label>
                    <input
                      type="number"
                      value={internshipForm.stipendMax}
                      onChange={(e) =>
                        handleInternshipFormChange("stipendMax", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g. 10000"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <input
                      value={internshipForm.stipendCurrency}
                      onChange={(e) =>
                        handleInternshipFormChange(
                          "stipendCurrency",
                          e.target.value,
                        )
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="INR"
                      maxLength="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={internshipForm.location}
                      onChange={(e) =>
                        handleInternshipFormChange("location", e.target.value)
                      }
                      className={`w-full border rounded px-3 py-2 ${internshipFormErrors.location ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                      placeholder="Enter location"
                    />
                    {internshipFormErrors.location && (
                      <p className="text-red-500 text-xs mt-1">
                        {internshipFormErrors.location}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <input
                      value={internshipForm.duration}
                      onChange={(e) =>
                        handleInternshipFormChange("duration", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g. 3 months"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Mode
                    </label>
                    <select
                      value={internshipForm.remote}
                      onChange={(e) =>
                        handleInternshipFormChange("remote", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="on-site">On-site</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level
                    </label>
                    <select
                      value={internshipForm.experienceLevel}
                      onChange={(e) =>
                        handleInternshipFormChange(
                          "experienceLevel",
                          e.target.value,
                        )
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="entry">Entry</option>
                      <option value="mid">Mid</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowEditInternship(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveInternshipEdits}
                    disabled={Object.keys(internshipFormErrors).length > 0}
                    className={`px-4 py-2 rounded ${Object.keys(internshipFormErrors).length > 0
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    Save & Update
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Internship Applications Modal */}
          {showInternshipApplications && selectedInternshipForApps && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Applications for {selectedInternshipForApps.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedInternshipForApps.companyName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInternshipApplications(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-lg font-semibold">
                      {Object.values(applicationStats).reduce(
                        (a, b) => a + b,
                        0,
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Applied</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {applicationStats.applied || 0}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Reviewed</div>
                    <div className="text-lg font-semibold text-yellow-600">
                      {applicationStats.reviewed || 0}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Shortlisted</div>
                    <div className="text-lg font-semibold text-purple-600">
                      {applicationStats.shortlisted || 0}
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Interview</div>
                    <div className="text-lg font-semibold text-indigo-600">
                      {applicationStats.interview || 0}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Selected</div>
                    <div className="text-lg font-semibold text-green-600">
                      {applicationStats.selected || 0}
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Rejected</div>
                    <div className="text-lg font-semibold text-red-600">
                      {applicationStats.rejected || 0}
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-4">
                  <select
                    value={applicationStatusFilter}
                    onChange={(e) => {
                      setApplicationStatusFilter(e.target.value);
                      fetchInternshipApplications(
                        selectedInternshipForApps._id,
                        1,
                        e.target.value,
                      );
                    }}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="applied">Applied</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                {/* Applications Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Candidate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Contact
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Skills
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Applied
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {internshipApplications.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No applications found
                          </td>
                        </tr>
                      ) : (
                        internshipApplications.map((app) => (
                          <tr key={app._id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  {app.user?.profilePhoto ? (
                                    <img
                                      className="h-10 w-10 rounded-full"
                                      src={app.user.profilePhoto}
                                      alt=""
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                      {app.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">
                                    {app.user?.name || "N/A"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {app.user?.location ||
                                      "Location not provided"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {app.user?.email || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {app.user?.phone || "N/A"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {app.user?.skills
                                  ?.slice(0, 3)
                                  .map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                {app.user?.skills?.length > 3 && (
                                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                    +{app.user.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${app.status === "applied"
                                  ? "bg-blue-100 text-blue-800"
                                  : app.status === "reviewed"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : app.status === "shortlisted"
                                      ? "bg-purple-100 text-purple-800"
                                      : app.status === "interview"
                                        ? "bg-indigo-100 text-indigo-800"
                                        : app.status === "selected"
                                          ? "bg-green-100 text-green-800"
                                          : app.status === "rejected"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-800"
                                  }`}
                              >
                                {app.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(app.appliedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {applicationTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Page {applicationPage} of {applicationTotalPages}
                    </div>
                    <div className="space-x-2">
                      <button
                        disabled={applicationPage <= 1}
                        onClick={() =>
                          fetchInternshipApplications(
                            selectedInternshipForApps._id,
                            applicationPage - 1,
                            applicationStatusFilter,
                          )
                        }
                        className="px-3 py-1 rounded border disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        disabled={applicationPage >= applicationTotalPages}
                        onClick={() =>
                          fetchInternshipApplications(
                            selectedInternshipForApps._id,
                            applicationPage + 1,
                            applicationStatusFilter,
                          )
                        }
                        className="px-3 py-1 rounded border disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create Internship Modal */}
          {showCreateInternship && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Create Internship</h3>
                  <button
                    onClick={() => setShowCreateInternship(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                {Object.keys(createInternshipFormErrors).length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Please fix the following errors:
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <ul className="list-disc list-inside space-y-1">
                            {Object.entries(createInternshipFormErrors).map(
                              ([field, error]) => (
                                <li key={field}>{error}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employer <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={createInternshipForm.employerId}
                      onChange={(e) => {
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          employerId: e.target.value,
                        });
                        setCreateInternshipFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.employerId;
                          return n;
                        });
                      }}
                      className={`w-full border rounded px-3 py-2 ${createInternshipFormErrors.employerId ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="">Select employer</option>
                      {employerOptions.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.companyName || emp.name} ({emp.companyEmail})
                        </option>
                      ))}
                    </select>
                    {createInternshipFormErrors.employerId && (
                      <p className="text-red-500 text-xs mt-1">
                        {createInternshipFormErrors.employerId}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Internship Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={createInternshipForm.title}
                      onChange={(e) => {
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          title: e.target.value,
                        });
                        setCreateInternshipFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.title;
                          return n;
                        });
                      }}
                      className={`w-full border rounded px-3 py-2 ${createInternshipFormErrors.title ? "border-red-500" : "border-gray-300"}`}
                    />
                    {createInternshipFormErrors.title && (
                      <p className="text-red-500 text-xs mt-1">
                        {createInternshipFormErrors.title}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="5"
                      value={createInternshipForm.description}
                      onChange={(e) => {
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          description: e.target.value,
                        });
                        setCreateInternshipFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.description;
                          return n;
                        });
                      }}
                      className={`w-full border rounded px-3 py-2 ${createInternshipFormErrors.description ? "border-red-500" : "border-gray-300"}`}
                    />
                    {createInternshipFormErrors.description && (
                      <p className="text-red-500 text-xs mt-1">
                        {createInternshipFormErrors.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stipend Min
                    </label>
                    <input
                      type="number"
                      value={createInternshipForm.stipendMin}
                      onChange={(e) => {
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          stipendMin: e.target.value,
                        });
                        setCreateInternshipFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.stipendMin;
                          return n;
                        });
                      }}
                      className={`w-full border rounded px-3 py-2 ${createInternshipFormErrors.stipendMin ? "border-red-500" : "border-gray-300"}`}
                    />
                    {createInternshipFormErrors.stipendMin && (
                      <p className="text-red-500 text-xs mt-1">
                        {createInternshipFormErrors.stipendMin}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stipend Max
                    </label>
                    <input
                      type="number"
                      value={createInternshipForm.stipendMax}
                      onChange={(e) => {
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          stipendMax: e.target.value,
                        });
                        setCreateInternshipFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.stipendMax;
                          return n;
                        });
                      }}
                      className={`w-full border rounded px-3 py-2 ${createInternshipFormErrors.stipendMax ? "border-red-500" : "border-gray-300"}`}
                    />
                    {createInternshipFormErrors.stipendMax && (
                      <p className="text-red-500 text-xs mt-1">
                        {createInternshipFormErrors.stipendMax}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <input
                      value={createInternshipForm.stipendCurrency}
                      onChange={(e) => {
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          stipendCurrency: e.target.value,
                        });
                        setCreateInternshipFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.stipendCurrency;
                          return n;
                        });
                      }}
                      className={`w-full border rounded px-3 py-2 ${createInternshipFormErrors.stipendCurrency ? "border-red-500" : "border-gray-300"}`}
                    />
                    {createInternshipFormErrors.stipendCurrency && (
                      <p className="text-red-500 text-xs mt-1">
                        {createInternshipFormErrors.stipendCurrency}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={createInternshipForm.location}
                      onChange={(e) => {
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          location: e.target.value,
                        });
                        setCreateInternshipFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.location;
                          return n;
                        });
                      }}
                      className={`w-full border rounded px-3 py-2 ${createInternshipFormErrors.location ? "border-red-500" : "border-gray-300"}`}
                    />
                    {createInternshipFormErrors.location && (
                      <p className="text-red-500 text-xs mt-1">
                        {createInternshipFormErrors.location}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (months)
                    </label>
                    <input
                      value={createInternshipForm.duration}
                      onChange={(e) => {
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          duration: e.target.value,
                        });
                        setCreateInternshipFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.duration;
                          return n;
                        });
                      }}
                      className={`w-full border rounded px-3 py-2 ${createInternshipFormErrors.duration ? "border-red-500" : "border-gray-300"}`}
                      placeholder="e.g. 3"
                    />
                    {createInternshipFormErrors.duration && (
                      <p className="text-red-500 text-xs mt-1">
                        {createInternshipFormErrors.duration}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Mode
                    </label>
                    <select
                      value={createInternshipForm.remote}
                      onChange={(e) =>
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          remote: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="on-site">On-site</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level
                    </label>
                    <select
                      value={createInternshipForm.experienceLevel}
                      onChange={(e) =>
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          experienceLevel: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="entry">Entry</option>
                      <option value="mid">Mid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={createInternshipForm.status}
                      onChange={(e) =>
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          status: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirements (comma separated)
                    </label>
                    <input
                      value={createInternshipForm.requirementsCSV}
                      onChange={(e) =>
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          requirementsCSV: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="Requirement 1, Requirement 2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skills (comma separated)
                    </label>
                    <input
                      value={createInternshipForm.skillsCSV}
                      onChange={(e) =>
                        setCreateInternshipForm({
                          ...createInternshipForm,
                          skillsCSV: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="Skill 1, Skill 2"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowCreateInternship(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createInternship}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Create Internship
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mentors Management */}
          {activeTab === "mentors" && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mentors Management
                  </h3>
                  <button
                    onClick={fetchMentors}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mentor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mentors.map((mentor) => (
                      <tr key={mentor._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {mentor.photo ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={mentor.photo}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                  {mentor.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {mentor.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {mentor.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {mentor.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {mentor.city}, {mentor.country}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${mentor.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : mentor.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {mentor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {mentor.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  updateMentorStatus(mentor._id, "approved")
                                }
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  updateMentorStatus(mentor._id, "rejected")
                                }
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {mentor.status === "approved" && (
                            <button
                              onClick={() =>
                                updateMentorStatus(mentor._id, "rejected")
                              }
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          )}
                          {mentor.status === "rejected" && (
                            <button
                              onClick={() =>
                                updateMentorStatus(mentor._id, "approved")
                              }
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mentor Applications Management */}
          {activeTab === "mentor-applications" && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mentor Applications
                  </h3>
                  <button
                    onClick={fetchMentorApplications}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mentor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Professional Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mentorApplications.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No mentor applications found
                        </td>
                      </tr>
                    ) : (
                      mentorApplications.map((application) => (
                        <tr key={application._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                {application.mentorId?.photo ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={application.mentorId.photo}
                                    alt=""
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                    {application.mentorId?.name?.charAt(0).toUpperCase() || "M"}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {application.mentorId?.name || "N/A"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {application.mentorId?.email || "N/A"}
                                </div>
                                {application.mentorId?.mentorId && (
                                  <div className="text-xs text-purple-600 font-semibold mt-1">
                                    ID: {application.mentorId.mentorId}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">{application.currentRole}</div>
                              <div className="text-gray-500">{application.company}</div>
                              <div className="text-gray-500 text-xs mt-1">
                                {application.industry}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {application.yearsOfExperience} years
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {application.skills?.slice(0, 3).join(", ")}
                              {application.skills?.length > 3 && "..."}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span
                                className={`px-2 py-1 text-xs rounded-full w-fit ${application.verificationStatus === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : application.verificationStatus === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                  }`}
                              >
                                {application.verificationStatus || "pending"}
                              </span>
                              {application.verificationStatus === "rejected" &&
                                application.rejectionReason && (
                                  <span className="text-xs text-red-600 mt-1 truncate max-w-xs">
                                    {application.rejectionReason}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {application.submittedAt
                              ? new Date(application.submittedAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <button
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowApplicationDetails(true);
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              View
                            </button>
                            {application.verificationStatus === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    reviewMentorApplication(application._id, "approve")
                                  }
                                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectClick(application)}
                                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Application Details Modal */}
          {showApplicationDetails && selectedApplication && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Application Details</h3>
                  <button
                    onClick={() => {
                      setShowApplicationDetails(false);
                      setSelectedApplication(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {/* Mentor Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Mentor Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Name</label>
                        <div className="text-gray-900">
                          {selectedApplication.mentorId?.name || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <div className="text-gray-900">
                          {selectedApplication.mentorId?.email || "N/A"}
                        </div>
                      </div>
                      {selectedApplication.mentorId?.mentorId && (
                        <div>
                          <label className="text-sm text-gray-600">Mentor ID</label>
                          <div className="text-purple-600 font-semibold">
                            {selectedApplication.mentorId.mentorId}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Professional Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Industry</label>
                        <div className="text-gray-900">{selectedApplication.industry}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Current Role</label>
                        <div className="text-gray-900">{selectedApplication.currentRole}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Company</label>
                        <div className="text-gray-900">{selectedApplication.company}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Years of Experience</label>
                        <div className="text-gray-900">
                          {selectedApplication.yearsOfExperience} years
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="text-sm text-gray-600 font-semibold mb-2 block">
                      Skills
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.skills?.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* LinkedIn */}
                  {selectedApplication.linkedinUrl && (
                    <div>
                      <label className="text-sm text-gray-600 font-semibold mb-2 block">
                        LinkedIn URL
                      </label>
                      <a
                        href={selectedApplication.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedApplication.linkedinUrl}
                      </a>
                    </div>
                  )}

                  {/* Why Mentor */}
                  <div>
                    <label className="text-sm text-gray-600 font-semibold mb-2 block">
                      Why do you want to mentor?
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-900">
                      {selectedApplication.whyMentor}
                    </div>
                  </div>

                  {/* Proof Document */}
                  {selectedApplication.proofDocument && (
                    <div>
                      <label className="text-sm text-gray-600 font-semibold mb-2 block">
                        Proof Document
                      </label>
                      <a
                        href={selectedApplication.proofDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Document
                      </a>
                    </div>
                  )}

                  {/* Rejection Reason (if rejected) */}
                  {selectedApplication.verificationStatus === "rejected" &&
                    selectedApplication.rejectionReason && (
                      <div className="pt-4 border-t">
                        <label className="text-sm text-gray-600 font-semibold mb-2 block">
                          Rejection Reason
                        </label>
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-800">
                          {selectedApplication.rejectionReason}
                        </div>
                      </div>
                    )}

                  {/* Actions */}
                  {selectedApplication.verificationStatus === "pending" && (
                    <div className="flex space-x-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          reviewMentorApplication(selectedApplication._id, "approve");
                          setShowApplicationDetails(false);
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Approve Application
                      </button>
                      <button
                        onClick={() => {
                          handleRejectClick(selectedApplication);
                          setShowApplicationDetails(false);
                        }}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        Reject Application
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-semibold">Reject Application</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Please provide a reason for rejection (optional)
                  </p>
                </div>
                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection (optional)..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This reason will be shown to the mentor.
                  </p>
                </div>
                <div className="p-6 border-t flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason("");
                      setApplicationToReject(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Session Templates Management */}
          {activeTab === "session-templates" && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Session Templates</h3>
                  <div className="space-x-2">
                    <button onClick={fetchSessionTemplates} className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800">Refresh</button>
                    <button onClick={() => setShowCreateTemplate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ New Template</button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessionTemplates.map((template) => (
                      <tr key={template.templateId}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{template.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.defaultDuration} mins</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${template.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button onClick={() => { setSelectedTemplate(template); setTemplateForm(template); setShowEditTemplate(true); }} className="text-blue-600 hover:text-blue-900">Edit</button>
                          <button onClick={() => toggleTemplateStatus(template)} className={`${template.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}`}>
                            {template.isActive ? "Disable" : "Enable"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create/Edit Template Modal */}
          {(showCreateTemplate || showEditTemplate) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{showCreateTemplate ? "Create Template" : "Edit Template"}</h3>
                  <button onClick={() => { setShowCreateTemplate(false); setShowEditTemplate(false); }} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input value={templateForm.title} onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })} className="w-full border rounded px-3 py-2 mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} className="w-full border rounded px-3 py-2 mt-1" rows="3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (mins)</label>
                    <input type="number" value={templateForm.defaultDuration} onChange={(e) => setTemplateForm({ ...templateForm, defaultDuration: e.target.value })} className="w-full border rounded px-3 py-2 mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} className="w-full border rounded px-3 py-2 mt-1" placeholder="e.g. Career Guidance" />
                  </div>
                  <div className="flex items-center mt-2">
                    <input type="checkbox" checked={templateForm.isActive} onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })} className="mr-2" />
                    <label className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button onClick={() => { setShowCreateTemplate(false); setShowEditTemplate(false); }} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                  <button onClick={showCreateTemplate ? createSessionTemplate : updateSessionTemplate} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">{showCreateTemplate ? "Create" : "Update"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Courses Management */}
          {activeTab === "courses" && (
            <div className="bg-gradient-to-br from-white via-purple-50 to-blue-50 rounded-2xl shadow-2xl border border-purple-100">
              <div className="p-8 border-b border-purple-100 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                      <span className="text-3xl">📚</span>
                      Courses Management
                    </h3>
                    <p className="text-purple-100 text-sm">Manage and organize all your courses</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={fetchCourses} className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl hover:bg-opacity-30 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-white border-opacity-30">
                      🔄 Refresh
                    </button>
                    <button onClick={() => setShowCreateCourse(true)} className="bg-white text-purple-600 px-5 py-2.5 rounded-xl hover:bg-purple-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      ✨ + Create Course
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 text-lg">🔍</span>
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-90 backdrop-blur-sm border-2 border-white border-opacity-50 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-purple-300 transition-all duration-300 placeholder-purple-300 text-gray-800"
                    />
                  </div>
                  <select value={courseCategory} onChange={(e) => setCourseCategory(e.target.value)} className="px-4 py-3 bg-white bg-opacity-90 backdrop-blur-sm border-2 border-white border-opacity-50 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-purple-300 transition-all duration-300 text-gray-700 font-medium">
                    <option value="">All Categories</option>
                    <option value="web-development">Web Development</option>
                    <option value="data-science">Data Science</option>
                    <option value="mobile-development">Mobile Development</option>
                    <option value="cloud-computing">Cloud Computing</option>
                    <option value="cybersecurity">Cybersecurity</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                    <option value="marketing">Marketing</option>
                    <option value="soft-skills">Soft Skills</option>
                  </select>
                  <select value={courseLevel} onChange={(e) => setCourseLevel(e.target.value)} className="px-4 py-3 bg-white bg-opacity-90 backdrop-blur-sm border-2 border-white border-opacity-50 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-purple-300 transition-all duration-300 text-gray-700 font-medium">
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <select value={courseStatus} onChange={(e) => setCourseStatus(e.target.value)} className="px-4 py-3 bg-white bg-opacity-90 backdrop-blur-sm border-2 border-white border-opacity-50 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-purple-300 transition-all duration-300 text-gray-700 font-medium">
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <button onClick={fetchCourses} className="bg-indigo-500 bg-opacity-90 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Filter
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-100 to-blue-100">
                      <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Level</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Enrollments</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-purple-100">
                    {courses.map((course, index) => (
                      <tr key={course._id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 group">
                        <td className="px-6 py-5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                              {course.title.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-base group-hover:text-purple-600 transition-colors">{course.title}</div>
                              <div className="text-sm text-gray-500 mt-1">{course.targetJobRoles?.slice(0, 2).join(', ')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">{course.category}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${course.level === 'beginner' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' : course.level === 'intermediate' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'bg-gradient-to-r from-red-400 to-pink-500 text-white'}`}>
                            {course.level}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">👥</span>
                            <span className="text-sm font-semibold text-gray-700">{course.enrollmentCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500 text-lg">⭐</span>
                            <span className="text-sm font-semibold text-gray-700">{course.averageRating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${course.isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'}`}>
                            {course.isActive ? '✓ Active' : '⊘ Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2">
                            <button onClick={() => navigate(`/admin/courses/${course._id}`)} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                              View
                            </button>
                            <button onClick={() => toggleCourseStatus(course._id)} className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                              {course.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => deleteCourse(course._id)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {courseTotalPages > 1 && (
                <div className="p-6 border-t border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50 rounded-b-2xl">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-semibold text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm">
                      📄 Page {coursePage} of {courseTotalPages}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        disabled={coursePage === 1} 
                        onClick={() => { setCoursePage(coursePage - 1); }} 
                        className="px-5 py-2 bg-white border-2 border-purple-200 text-purple-600 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                      >
                        ← Previous
                      </button>
                      <button 
                        disabled={coursePage === courseTotalPages} 
                        onClick={() => { setCoursePage(coursePage + 1); }} 
                        className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {showCreateCourse && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Create Course will redirect to form</h3>
                  <p className="text-sm text-gray-600 mt-2">This will open the detailed course creation form where you can add all course information.</p>
                </div>
                <div className="p-6">
                  <button onClick={() => { setShowCreateCourse(false); navigate('/admin/create-course'); }} className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700">
                    Go to Course Creation Form
                  </button>
                </div>
                <div className="p-6 border-t flex justify-end">
                  <button onClick={() => setShowCreateCourse(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Learning Paths Management */}
          {activeTab === "learning-paths" && <AdminLearningPaths />}

          {/* Jobs Management */}
          {activeTab === "jobs" && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Jobs Management
                  </h3>
                  <div className="space-x-2">
                    <button
                      onClick={() => fetchJobs(1, searchTerm, filterStatus)}
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={openCreateJobModal}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      + New Job
                    </button>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search by title or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="active">Active</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={() => fetchJobs(1, searchTerm, filterStatus)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {job.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {job.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {job.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {job.jobType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${job.status === "active"
                              ? "bg-green-100 text-green-800"
                              : job.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : job.status === "approved"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {job.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  updateJobStatus(job._id, "approved")
                                }
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  updateJobStatus(job._id, "rejected")
                                }
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {job.status === "approved" && (
                            <button
                              onClick={() => updateJobStatus(job._id, "active")}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => openEditJob(job)}
                            className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteJob(job)}
                            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="space-x-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() =>
                      fetchJobs(currentPage - 1, searchTerm, filterStatus)
                    }
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      fetchJobs(currentPage + 1, searchTerm, filterStatus)
                    }
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Edit Job Modal */}
          {showEditJob && selectedJob && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Edit Job</h3>
                  <button
                    onClick={() => setShowEditJob(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                {Object.keys(jobFormErrors).length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Please fix the following errors:
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <ul className="list-disc list-inside space-y-1">
                            {Object.entries(jobFormErrors).map(
                              ([field, error]) => (
                                <li key={field}>{error}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={jobForm.jobTitle}
                      onChange={(e) =>
                        handleJobFormChange("jobTitle", e.target.value)
                      }
                      className={`w-full border rounded px-3 py-2 ${jobFormErrors.jobTitle ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                      placeholder="Enter job title"
                      maxLength="100"
                    />
                    <div className="flex justify-between items-center mt-1">
                      {jobFormErrors.jobTitle && (
                        <p className="text-red-500 text-xs">
                          {jobFormErrors.jobTitle}
                        </p>
                      )}
                      <p
                        className={`text-xs ml-auto ${jobForm.jobTitle.length > 90 ? "text-red-500" : "text-gray-500"}`}
                      >
                        {jobForm.jobTitle.length}/100 characters
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="5"
                      value={jobForm.description}
                      onChange={(e) =>
                        handleJobFormChange("description", e.target.value)
                      }
                      className={`w-full border rounded px-3 py-2 ${jobFormErrors.description ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                      placeholder="Enter job description"
                      maxLength="2000"
                    />
                    <div className="flex justify-between items-center mt-1">
                      {jobFormErrors.description && (
                        <p className="text-red-500 text-xs">
                          {jobFormErrors.description}
                        </p>
                      )}
                      <p
                        className={`text-xs ml-auto ${jobForm.description.length > 1800 ? "text-red-500" : "text-gray-500"}`}
                      >
                        {jobForm.description.length}/2000 characters
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary Min
                    </label>
                    <input
                      type="number"
                      value={jobForm.salaryMin}
                      onChange={(e) =>
                        handleJobFormChange("salaryMin", e.target.value)
                      }
                      className={`w-full border rounded px-3 py-2 ${jobFormErrors.salaryMin ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                      placeholder="e.g. 50000"
                      min="0"
                    />
                    {jobFormErrors.salaryMin && (
                      <p className="text-red-500 text-xs mt-1">
                        {jobFormErrors.salaryMin}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary Max
                    </label>
                    <input
                      type="number"
                      value={jobForm.salaryMax}
                      onChange={(e) =>
                        handleJobFormChange("salaryMax", e.target.value)
                      }
                      className={`w-full border rounded px-3 py-2 ${jobFormErrors.salaryMax ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                      placeholder="e.g. 80000"
                      min="0"
                    />
                    {jobFormErrors.salaryMax && (
                      <p className="text-red-500 text-xs mt-1">
                        {jobFormErrors.salaryMax}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <input
                      value={jobForm.salaryCurrency}
                      onChange={(e) =>
                        handleJobFormChange("salaryCurrency", e.target.value)
                      }
                      className={`w-full border rounded px-3 py-2 ${jobFormErrors.salaryCurrency ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                      placeholder="USD"
                      maxLength="3"
                    />
                    {jobFormErrors.salaryCurrency && (
                      <p className="text-red-500 text-xs mt-1">
                        {jobFormErrors.salaryCurrency}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={jobForm.location}
                      onChange={(e) =>
                        handleJobFormChange("location", e.target.value)
                      }
                      className={`w-full border rounded px-3 py-2 ${jobFormErrors.location ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                      placeholder="Enter job location"
                      maxLength="100"
                    />
                    <div className="flex justify-between items-center mt-1">
                      {jobFormErrors.location && (
                        <p className="text-red-500 text-xs">
                          {jobFormErrors.location}
                        </p>
                      )}
                      <p
                        className={`text-xs ml-auto ${jobForm.location.length > 90 ? "text-red-500" : "text-gray-500"}`}
                      >
                        {jobForm.location.length}/100 characters
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Type
                    </label>
                    <select
                      value={jobForm.employmentType}
                      onChange={(e) =>
                        handleJobFormChange("employmentType", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 border-gray-300 focus:border-blue-500"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Mode
                    </label>
                    <select
                      value={jobForm.remote}
                      onChange={(e) =>
                        handleJobFormChange("remote", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 border-gray-300 focus:border-blue-500"
                    >
                      <option value="on-site">On-site</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level
                    </label>
                    <select
                      value={jobForm.experienceLevel}
                      onChange={(e) =>
                        handleJobFormChange("experienceLevel", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 border-gray-300 focus:border-blue-500"
                    >
                      <option value="entry">Entry</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowEditJob(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveJobEdits}
                    disabled={Object.keys(jobFormErrors).length > 0}
                    className={`px-4 py-2 rounded ${Object.keys(jobFormErrors).length > 0
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    Save & Update
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Job Modal */}
          {showCreateJob && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Create Job</h3>
                  <button
                    onClick={() => setShowCreateJob(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employer
                    </label>
                    <select
                      value={createJobForm.employerId}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          employerId: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select employer</option>
                      {employerOptions.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.companyName || emp.name} ({emp.companyEmail})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      value={createJobForm.jobTitle}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          jobTitle: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows="5"
                      value={createJobForm.description}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary Min
                    </label>
                    <input
                      type="number"
                      value={createJobForm.salaryMin}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          salaryMin: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary Max
                    </label>
                    <input
                      type="number"
                      value={createJobForm.salaryMax}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          salaryMax: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <input
                      value={createJobForm.salaryCurrency}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          salaryCurrency: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      value={createJobForm.location}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          location: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Type
                    </label>
                    <select
                      value={createJobForm.employmentType}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          employmentType: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Mode
                    </label>
                    <select
                      value={createJobForm.remote}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          remote: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="on-site">On-site</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level
                    </label>
                    <select
                      value={createJobForm.experienceLevel}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          experienceLevel: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="entry">Entry</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={createJobForm.status}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          status: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirements (comma separated)
                    </label>
                    <input
                      value={createJobForm.requirementsCSV}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          requirementsCSV: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Benefits (comma separated)
                    </label>
                    <input
                      value={createJobForm.benefitsCSV}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          benefitsCSV: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skills (comma separated)
                    </label>
                    <input
                      value={createJobForm.skillsCSV}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          skillsCSV: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowCreateJob(false)}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createJob}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create Job
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Add pagination controls */}
        </main>
      </div>

      {/* Payment Details Modal */}
      {showPaymentDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Payment Details</h3>
              <button
                onClick={() => setShowPaymentDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Payment Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Payment ID</div>
                    <div className="font-medium">
                      {selectedPayment.payment._id}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Amount</div>
                    <div className="font-medium text-lg">
                      {formatCurrency(
                        selectedPayment.payment.amount,
                        selectedPayment.payment.currency,
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Plan</div>
                    <div className="font-medium">
                      {selectedPayment.payment.planId}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.payment.status)}`}
                    >
                      {selectedPayment.payment.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Payment Method</div>
                    <div className="font-medium">
                      {selectedPayment.payment.paymentMethod || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Initiated At</div>
                    <div className="font-medium">
                      {formatDate(selectedPayment.payment.initiatedAt)}
                    </div>
                  </div>
                  {selectedPayment.payment.completedAt && (
                    <div>
                      <div className="text-sm text-gray-500">Completed At</div>
                      <div className="font-medium">
                        {formatDate(selectedPayment.payment.completedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Employer Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Employer Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Company Name</div>
                    <div className="font-medium">
                      {selectedPayment.payment.employerId?.companyName || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Company Email</div>
                    <div className="font-medium">
                      {selectedPayment.payment.employerId?.companyEmail ||
                        "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Contact Person</div>
                    <div className="font-medium">
                      {selectedPayment.payment.employerId?.contactPersonName ||
                        "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Contact Email</div>
                    <div className="font-medium">
                      {selectedPayment.payment.employerId?.contactPersonEmail ||
                        "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Razorpay Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Razorpay Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Order ID</div>
                    <div className="font-medium font-mono text-sm">
                      {selectedPayment.payment.razorpayOrderId}
                    </div>
                  </div>
                  {selectedPayment.payment.razorpayPaymentId && (
                    <div>
                      <div className="text-sm text-gray-500">Payment ID</div>
                      <div className="font-medium font-mono text-sm">
                        {selectedPayment.payment.razorpayPaymentId}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-500">Receipt</div>
                    <div className="font-medium font-mono text-sm">
                      {selectedPayment.payment.razorpayReceipt}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              {selectedPayment.subscription && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Subscription Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500">
                        Subscription Status
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedPayment.subscription.status === "active"
                          ? "text-green-600 bg-green-100"
                          : "text-gray-600 bg-gray-100"
                          }`}
                      >
                        {selectedPayment.subscription.status}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Period</div>
                      <div className="font-medium">
                        {selectedPayment.subscription.period}
                      </div>
                    </div>
                    {selectedPayment.subscription.startDate && (
                      <div>
                        <div className="text-sm text-gray-500">Start Date</div>
                        <div className="font-medium">
                          {formatDate(selectedPayment.subscription.startDate)}
                        </div>
                      </div>
                    )}
                    {selectedPayment.subscription.endDate && (
                      <div>
                        <div className="text-sm text-gray-500">End Date</div>
                        <div className="font-medium">
                          {formatDate(selectedPayment.subscription.endDate)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPaymentDetails(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Purchases Modal */}
      {showProductPurchases && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                Purchase Details - {selectedProduct.name}
              </h3>
              <button
                onClick={closeProductPurchases}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Product Stats */}
            {productPurchaseStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">
                    Total Orders
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {productPurchaseStats.totalOrders}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">
                    Quantity Sold
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {productPurchaseStats.totalQuantitySold}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">
                    Total Revenue
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {selectedProduct.currency}{" "}
                    {productPurchaseStats.totalRevenue?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">
                    Avg Order Value
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {selectedProduct.currency}{" "}
                    {productPurchaseStats.avgOrderValue?.toFixed(2) || "0.00"}
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <select
                value={productPurchaseStatus}
                onChange={(e) => setProductPurchaseStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={productPurchasePaymentStatus}
                onChange={(e) =>
                  setProductPurchasePaymentStatus(e.target.value)
                }
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <input
                type="date"
                value={productPurchaseStartDate}
                onChange={(e) => setProductPurchaseStartDate(e.target.value)}
                placeholder="Start Date"
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={productPurchaseEndDate}
                onChange={(e) => setProductPurchaseEndDate(e.target.value)}
                placeholder="End Date"
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() =>
                  fetchProductPurchases(
                    selectedProduct._id,
                    1,
                    productPurchaseStatus,
                    productPurchasePaymentStatus,
                    productPurchaseStartDate,
                    productPurchaseEndDate,
                  )
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>

            {/* Purchases Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productPurchases.map((order) => {
                    const productItem = order.items.find(
                      (item) => item.product._id === selectedProduct._id,
                    );
                    const customer = order.user || order.employer;
                    const customerName = order.user
                      ? customer.name
                      : customer.companyName;
                    const customerEmail = order.user
                      ? customer.email
                      : customer.companyEmail;

                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customerEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {productItem?.quantity || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.currency}{" "}
                          {productItem?.unitPrice?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.currency}{" "}
                          {productItem?.totalPrice?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "shipped"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "processing"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${order.paymentInfo?.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : order.paymentInfo?.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.paymentInfo?.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {order.paymentInfo?.status || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {productPurchaseTotalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {productPurchasePage} of {productPurchaseTotalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      fetchProductPurchases(
                        selectedProduct._id,
                        productPurchasePage - 1,
                        productPurchaseStatus,
                        productPurchasePaymentStatus,
                        productPurchaseStartDate,
                        productPurchaseEndDate,
                      )
                    }
                    disabled={productPurchasePage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      fetchProductPurchases(
                        selectedProduct._id,
                        productPurchasePage + 1,
                        productPurchaseStatus,
                        productPurchasePaymentStatus,
                        productPurchaseStartDate,
                        productPurchaseEndDate,
                      )
                    }
                    disabled={productPurchasePage === productPurchaseTotalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {productPurchases.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg">
                  No purchases found for this product
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

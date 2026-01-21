import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const EmployerTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showEditTest, setShowEditTest] = useState(false);
  const [showViewTest, setShowViewTest] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' or 'monitoring'
  
  // Performance monitoring state
  const [statistics, setStatistics] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showAttemptDetails, setShowAttemptDetails] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
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
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [testFormErrors, setTestFormErrors] = useState({});
  const [testFormTouched, setTestFormTouched] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("employerToken");
    if (!token) {
      navigate("/employer/login");
      return;
    }
    fetchTests();
    if (activeTab === 'monitoring') {
      fetchStatistics();
      fetchPendingReviews();
    }
  }, [navigate, activeTab]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("employerToken");
      const res = await fetch(`${API_BASE_URL}/api/employer-tests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTests(data.tests || []);
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to fetch tests");
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

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
    if (!validateTestForm()) {
      toast.error("Please fix validation errors before submitting");
      return;
    }

    try {
      const token = localStorage.getItem("employerToken");
      const res = await fetch(`${API_BASE_URL}/api/employer-tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testForm),
      });

      if (res.ok) {
        toast.success("Test created successfully!");
        setShowCreateTest(false);
        resetTestForm();
        fetchTests();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to create test");
      }
    } catch (err) {
      console.error("Error creating test:", err);
      toast.error("Failed to create test");
    }
  };

  const updateTest = async () => {
    if (!testForm.title.trim()) {
      toast.error("Test title is required");
      return;
    }

    try {
      const token = localStorage.getItem("employerToken");
      const res = await fetch(
        `${API_BASE_URL}/api/employer-tests/${selectedTest._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(testForm),
        }
      );

      if (res.ok) {
        toast.success("Test updated successfully!");
        setShowEditTest(false);
        setSelectedTest(null);
        resetTestForm();
        fetchTests();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to update test");
      }
    } catch (err) {
      console.error("Error updating test:", err);
      toast.error("Failed to update test");
    }
  };

  const deleteTest = async (testId) => {
    if (!window.confirm("Are you sure you want to delete this test?")) {
      return;
    }

    try {
      const token = localStorage.getItem("employerToken");
      const res = await fetch(`${API_BASE_URL}/api/employer-tests/${testId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Test deleted successfully!");
        fetchTests();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to delete test");
      }
    } catch (err) {
      console.error("Error deleting test:", err);
      toast.error("Failed to delete test");
    }
  };

  const toggleTestStatus = async (test) => {
    try {
      const token = localStorage.getItem("employerToken");
      const res = await fetch(
        `${API_BASE_URL}/api/employer-tests/${test._id}/toggle-active`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        toast.success(
          test.isActive ? "Test deactivated" : "Test activated successfully!"
        );
        fetchTests();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to update test status");
      }
    } catch (err) {
      console.error("Error toggling test:", err);
      toast.error("Failed to update test");
    }
  };

  const viewTest = async (test) => {
    setSelectedTest(test);
    setShowViewTest(true);
  };

  const editTest = (test) => {
    setSelectedTest(test);
    setTestForm({
      title: test.title,
      description: test.description || "",
      jobRole: test.jobRole || "",
      skill: test.skill || "",
      type: test.type || "mcq",
      duration: test.duration || 30,
      totalMarks: test.totalMarks || 100,
      passingMarks: test.passingMarks || 40,
      category: test.category || "technical",
      difficulty: test.difficulty || "medium",
      isActive: test.isActive || false,
    });
    setShowEditTest(true);
  };

  const resetTestForm = () => {
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
  };

  const addQuestion = async () => {
    if (!questionForm.questionText.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (questionForm.type === "mcq") {
      const validOptions = questionForm.options.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        toast.error("At least 2 options required");
        return;
      }
      if (!questionForm.correctAnswer.trim()) {
        toast.error("Correct answer is required");
        return;
      }
    }

    // Validate coding questions
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

    // Validate essay questions
    if (questionForm.type === 'essay') {
      if (questionForm.essayDetails?.minWords > questionForm.essayDetails?.wordLimit) {
        toast.error("Minimum words cannot be greater than word limit");
        return;
      }
    }

    try {
      const token = localStorage.getItem("employerToken");
      const isEditing = editingQuestion !== null;
      const url = isEditing
        ? `${API_BASE_URL}/api/employer-tests/${selectedTest._id}/questions/${editingQuestion._id}`
        : `${API_BASE_URL}/api/employer-tests/${selectedTest._id}/questions`;
      
      const requestBody = {
        questionText: questionForm.questionText,
        type: questionForm.type,
        marks: questionForm.marks,
        explanation: questionForm.explanation,
      };

      // Add type-specific fields
      if (questionForm.type === 'mcq' || questionForm.type === 'true-false') {
        requestBody.options = questionForm.options.filter((opt) => opt.trim());
        requestBody.correctAnswer = questionForm.correctAnswer;
      } else if (questionForm.type === 'coding') {
        requestBody.codingDetails = questionForm.codingDetails;
      } else if (questionForm.type === 'essay') {
        requestBody.essayDetails = questionForm.essayDetails;
      }
      
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        toast.success(isEditing ? "Question updated successfully!" : "Question added successfully!");
        resetQuestionForm();
        setShowAddQuestion(false);
        setEditingQuestion(null);
        // Refresh test details
        const refreshRes = await fetch(
          `${API_BASE_URL}/api/employer-tests/${selectedTest._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setSelectedTest(data.test);
        }
      } else {
        const error = await res.json();
        toast.error(error.message || (isEditing ? "Failed to update question" : "Failed to add question"));
      }
    } catch (err) {
      console.error("Error saving question:", err);
      toast.error("Failed to save question");
    }
  };

  const editQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      questionText: question.questionText || "",
      type: question.type || "mcq",
      options: question.options && question.options.length > 0 
        ? [...question.options] 
        : ["", "", "", ""],
      correctAnswer: question.correctAnswer || "",
      marks: question.marks || 1,
      explanation: question.explanation || "",
    });
    setShowAddQuestion(true);
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      const token = localStorage.getItem("employerToken");
      const res = await fetch(
        `${API_BASE_URL}/api/employer-tests/${selectedTest._id}/questions/${questionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        toast.success("Question deleted successfully!");
        // Refresh test details
        const refreshRes = await fetch(
          `${API_BASE_URL}/api/employer-tests/${selectedTest._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setSelectedTest(data.test);
        }
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to delete question");
      }
    } catch (err) {
      console.error("Error deleting question:", err);
      toast.error("Failed to delete question");
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
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
    setEditingQuestion(null);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const addOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, ""],
    });
  };

  const removeOption = (index) => {
    if (questionForm.options.length <= 2) {
      toast.error("Minimum 2 options required");
      return;
    }
    const newOptions = questionForm.options.filter((_, i) => i !== index);
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  // ==================== PERFORMANCE MONITORING FUNCTIONS ====================
  
  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem("employerToken");
      const res = await fetch(`${API_BASE_URL}/api/employer-tests/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStatistics(data.statistics);
      } else {
        console.error("Failed to fetch statistics");
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingReviews = async () => {
    try {
      const token = localStorage.getItem("employerToken");
      const res = await fetch(`${API_BASE_URL}/api/employer-tests/pending-review`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPendingReviews(data.attempts || []);
      }
    } catch (err) {
      console.error("Error fetching pending reviews:", err);
    }
  };

  const fetchAttempts = async (testId = null) => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem("employerToken");
      const url = testId 
        ? `${API_BASE_URL}/api/employer-tests/attempts?testId=${testId}`
        : `${API_BASE_URL}/api/employer-tests/attempts`;
      
      console.log("Fetching attempts from:", url);
      console.log("Test ID:", testId);
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Attempts response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("Attempts data:", data);
        setAttempts(data.attempts || []);
        if ((data.attempts || []).length === 0) {
          toast.info("No attempts found for this test");
        } else {
          toast.success(`Found ${data.attempts.length} attempt(s)`);
        }
      } else {
        const error = await res.json();
        console.error("Attempts error:", error);
        toast.error(error.message || "Failed to fetch attempts");
      }
    } catch (err) {
      console.error("Error fetching attempts:", err);
      toast.error("Failed to fetch attempts");
    } finally {
      setLoadingStats(false);
    }
  };

  const viewAttemptDetails = async (attemptId) => {
    try {
      const token = localStorage.getItem("employerToken");
      const res = await fetch(
        `${API_BASE_URL}/api/employer-tests/attempts/${attemptId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSelectedAttempt(data.result);
        setShowAttemptDetails(true);
      } else {
        toast.error("Failed to fetch attempt details");
      }
    } catch (err) {
      console.error("Error fetching attempt details:", err);
      toast.error("Network error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-3 text-4xl">📝</span>
              Tests Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage assessment tests for your job postings
            </p>
          </div>
          <button
            onClick={() => setShowCreateTest(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            + Create Test
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📝</span>
                My Tests
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {tests.length}
                </span>
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('monitoring');
                fetchStatistics();
                fetchPendingReviews();
                fetchAttempts();
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'monitoring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📊</span>
                Performance Monitoring
                {pendingReviews.length > 0 && (
                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {pendingReviews.length} pending
                  </span>
                )}
              </span>
            </button>
          </nav>
        </div>

        {/* Tests Tab Content */}
        {activeTab === 'tests' && (
          <>
        {/* Validation Summary */}
        {tests.length > 0 && (() => {
          const testsWithoutQuestions = tests.filter(
            (t) => !t.questions || t.questions.length === 0
          );

          if (testsWithoutQuestions.length > 0) {
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">
                      {testsWithoutQuestions.length} test
                      {testsWithoutQuestions.length !== 1 ? "s" : ""} without
                      questions
                    </h4>
                    <p className="text-sm text-yellow-800">
                      These tests cannot be activated until questions are added.
                      Click "View" to add questions.
                    </p>
                  </div>
                </div>
              </div>
            );
          }
        })()}

        {/* Tests Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <span className="text-6xl block mb-4">📝</span>
                    <p className="text-gray-500 text-lg">
                      No tests found. Create your first test to get started.
                    </p>
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
                        {!test.isActive &&
                          test.questions &&
                          test.questions.length > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                              Ready to activate
                            </span>
                          )}
                        {(!test.questions || test.questions.length === 0) && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                            No questions
                          </span>
                        )}
                      </div>
                      {test.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {test.description.substring(0, 60)}
                          {test.description.length > 60 && "..."}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {test.type || "MCQ"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.category || "Technical"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.duration || 30} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.totalMarks || 100} ({test.passingMarks || 40} to
                      pass)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.questions?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          test.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {test.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => viewTest(test)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => editTest(test)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleTestStatus(test)}
                        className={
                          test.isActive
                            ? "text-yellow-600 hover:text-yellow-900"
                            : "text-green-600 hover:text-green-900"
                        }
                        disabled={
                          !test.isActive &&
                          (!test.questions || test.questions.length === 0)
                        }
                      >
                        {test.isActive ? "Deactivate" : "Activate"}
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
                      onChange={(e) =>
                        setTestForm({ ...testForm, title: e.target.value })
                      }
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
                      onChange={(e) =>
                        setTestForm({
                          ...testForm,
                          description: e.target.value,
                        })
                      }
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
                        onChange={(e) =>
                          setTestForm({ ...testForm, jobRole: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Software Developer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Skill
                      </label>
                      <input
                        type="text"
                        value={testForm.skill}
                        onChange={(e) =>
                          setTestForm({ ...testForm, skill: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., JavaScript, Python"
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
                        onChange={(e) =>
                          setTestForm({ ...testForm, type: e.target.value })
                        }
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
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            duration: parseInt(e.target.value) || 0,
                          })
                        }
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
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            totalMarks: parseInt(e.target.value) || 0,
                          })
                        }
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
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            passingMarks: parseInt(e.target.value) || 0,
                          })
                        }
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
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            category: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            difficulty: e.target.value,
                          })
                        }
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
                        <strong>Note:</strong> New tests are created as
                        inactive. After creating, add questions in the test
                        details view, then activate the test.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateTest(false);
                      resetTestForm();
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
                      onChange={(e) =>
                        setTestForm({ ...testForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter test title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={testForm.description}
                      onChange={(e) =>
                        setTestForm({
                          ...testForm,
                          description: e.target.value,
                        })
                      }
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
                        onChange={(e) =>
                          setTestForm({ ...testForm, jobRole: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Software Developer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Skill
                      </label>
                      <input
                        type="text"
                        value={testForm.skill}
                        onChange={(e) =>
                          setTestForm({ ...testForm, skill: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., JavaScript, Python"
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
                        onChange={(e) =>
                          setTestForm({ ...testForm, type: e.target.value })
                        }
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
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            duration: parseInt(e.target.value),
                          })
                        }
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
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            totalMarks: parseInt(e.target.value),
                          })
                        }
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
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            passingMarks: parseInt(e.target.value),
                          })
                        }
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
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            category: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            difficulty: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditTest(false);
                      setSelectedTest(null);
                      resetTestForm();
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

        {/* View Test Modal with Questions - SAME AS ADMIN PATTERN */}
        {showViewTest && selectedTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedTest.title}</h3>
                    {selectedTest.description && (
                      <p className="text-gray-600 mt-2">
                        {selectedTest.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowViewTest(false);
                      setSelectedTest(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
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
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Test Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600">Duration</div>
                    <div className="text-lg font-semibold">
                      {selectedTest.duration} min
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600">Total Marks</div>
                    <div className="text-lg font-semibold">
                      {selectedTest.totalMarks}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600">Passing Marks</div>
                    <div className="text-lg font-semibold">
                      {selectedTest.passingMarks}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600">Questions</div>
                    <div className="text-lg font-semibold">
                      {selectedTest.questions?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Questions</h4>
                    <button
                      onClick={() => setShowAddQuestion(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      + Add Question
                    </button>
                  </div>

                  {selectedTest.questions?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl block mb-2">❓</span>
                      <p>No questions added yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedTest.questions?.map((q, index) => (
                        <div
                          key={q._id}
                          className="border rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium mb-2">
                                Q{index + 1}. {q.questionText}
                              </div>
                              {q.type === "mcq" && q.options && (
                                <div className="ml-4 space-y-1 text-sm">
                                  {q.options.map((opt, idx) => (
                                    <div
                                      key={idx}
                                      className={
                                        opt === q.correctAnswer
                                          ? "text-green-600 font-semibold"
                                          : "text-gray-600"
                                      }
                                    >
                                      {String.fromCharCode(65 + idx)}. {opt}
                                      {opt === q.correctAnswer && " ✓"}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="mt-2 flex items-center gap-2 text-xs">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                  {q.type || "MCQ"}
                                </span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                  {q.marks || 1} marks
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => editQuestion(q)}
                                className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteQuestion(q._id)}
                                className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600 hover:bg-red-50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Question Form - inline in modal */}
                {showAddQuestion && (
                  <div className="border-t mt-6 pt-6">
                    <h4 className="text-lg font-semibold mb-4">
                      {editingQuestion ? "Edit Question" : "Add New Question"}
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text *
                        </label>
                        <textarea
                          value={questionForm.questionText}
                          onChange={(e) =>
                            setQuestionForm({
                              ...questionForm,
                              questionText: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows="3"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={questionForm.type}
                            onChange={(e) =>
                              setQuestionForm({
                                ...questionForm,
                                type: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="mcq">Multiple Choice</option>
                            <option value="coding">Coding</option>
                            <option value="essay">Essay</option>
                            <option value="true-false">True/False</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Marks
                          </label>
                          <input
                            type="number"
                            value={questionForm.marks}
                            onChange={(e) =>
                              setQuestionForm({
                                ...questionForm,
                                marks: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                      </div>

                      {questionForm.type === "mcq" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Options
                            </label>
                            {questionForm.options.map((option, index) => (
                              <div key={index} className="flex items-center mb-2">
                                <span className="mr-2 text-gray-700 font-semibold">
                                  {String.fromCharCode(65 + index)}.
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) =>
                                    handleOptionChange(index, e.target.value)
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder={`Option ${index + 1}`}
                                />
                                {questionForm.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(index)}
                                    className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addOption}
                              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-semibold"
                            >
                              + Add Option
                            </button>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Correct Answer *
                            </label>
                            <input
                              type="text"
                              value={questionForm.correctAnswer}
                              onChange={(e) =>
                                setQuestionForm({
                                  ...questionForm,
                                  correctAnswer: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter the correct answer exactly as it appears"
                            />
                          </div>
                        </>
                      )}

                      {/* True/False Question (same as MCQ with 2 fixed options) */}
                      {questionForm.type === "true-false" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Correct Answer *
                          </label>
                          <select
                            value={questionForm.correctAnswer}
                            onChange={(e) =>
                              setQuestionForm({
                                ...questionForm,
                                correctAnswer: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select answer...</option>
                            <option value="True">True</option>
                            <option value="False">False</option>
                          </select>
                        </div>
                      )}

                      {/* Coding Question Fields */}
                      {questionForm.type === 'coding' && questionForm.codingDetails && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                          <h4 className="font-semibold text-gray-800">Coding Question Details</h4>
                          
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                              rows="4"
                              placeholder="Describe the coding problem..."
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                rows="3"
                                placeholder="Describe input format..."
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                rows="3"
                                placeholder="Describe output format..."
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                              rows="2"
                              placeholder="e.g., 1 ≤ n ≤ 1000"
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
                                placeholder="Example input..."
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
                                placeholder="Expected output..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Test Cases *
                            </label>
                            {questionForm.codingDetails.testCases.map((testCase, index) => (
                              <div key={index} className="border rounded-lg p-3 mb-3 bg-white">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Test Case {index + 1}</span>
                                  {questionForm.codingDetails.testCases.length > 1 && (
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
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <input
                                      type="text"
                                      value={testCase.input}
                                      onChange={(e) => {
                                        const newTestCases = [...questionForm.codingDetails.testCases];
                                        newTestCases[index].input = e.target.value;
                                        setQuestionForm({
                                          ...questionForm,
                                          codingDetails: { ...questionForm.codingDetails, testCases: newTestCases }
                                        });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                      placeholder="Input"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      value={testCase.expectedOutput}
                                      onChange={(e) => {
                                        const newTestCases = [...questionForm.codingDetails.testCases];
                                        newTestCases[index].expectedOutput = e.target.value;
                                        setQuestionForm({
                                          ...questionForm,
                                          codingDetails: { ...questionForm.codingDetails, testCases: newTestCases }
                                        });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                      placeholder="Expected Output"
                                    />
                                  </div>
                                </div>
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

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Expected Solution
                            </label>
                            <textarea
                              value={questionForm.codingDetails.expectedSolution}
                              onChange={(e) => setQuestionForm({
                                ...questionForm,
                                codingDetails: { ...questionForm.codingDetails, expectedSolution: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                              rows="6"
                              placeholder="Model solution code..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Programming Language
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

                          <div className="border-t pt-4">
                            <h5 className="text-sm font-semibold text-gray-800 mb-3">Starter Code (Optional)</h5>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">JavaScript</label>
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
                                  rows="3"
                                  placeholder="// JavaScript starter code"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Python</label>
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
                                  rows="3"
                                  placeholder="# Python starter code"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Java</label>
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
                                  rows="3"
                                  placeholder="// Java starter code"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">C++</label>
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
                                  rows="3"
                                  placeholder="// C++ starter code"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Essay Question Fields */}
                      {questionForm.type === 'essay' && questionForm.essayDetails && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
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
                              placeholder="What to look for when grading..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Model Answer
                            </label>
                            <textarea
                              value={questionForm.essayDetails.expectedAnswer}
                              onChange={(e) => setQuestionForm({
                                ...questionForm,
                                essayDetails: { ...questionForm.essayDetails, expectedAnswer: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              rows="5"
                              placeholder="Reference answer for grading..."
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Explanation (optional)
                        </label>
                        <textarea
                          value={questionForm.explanation}
                          onChange={(e) =>
                            setQuestionForm({
                              ...questionForm,
                              explanation: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows="2"
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setShowAddQuestion(false);
                            resetQuestionForm();
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addQuestion}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          {editingQuestion ? "Update Question" : "Add Question"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Performance Monitoring Tab Content */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            {loadingStats ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading statistics...</p>
              </div>
            ) : statistics ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Tests</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                          {statistics.totalTests}
                        </p>
                      </div>
                      <span className="text-4xl">📝</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Attempts</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                          {statistics.totalAttempts}
                        </p>
                      </div>
                      <span className="text-4xl">👥</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Average Score</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                          {statistics.averagePercentage}%
                        </p>
                      </div>
                      <span className="text-4xl">📊</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pass Rate</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                          {statistics.passRate}%
                        </p>
                      </div>
                      <span className="text-4xl">✅</span>
                    </div>
                  </div>
                </div>

                {/* Pending Reviews Alert */}
                {statistics.pendingReviews > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-yellow-600 text-xl">⚠️</span>
                      <div>
                        <h4 className="font-semibold text-yellow-900 mb-1">
                          {statistics.pendingReviews} test{statistics.pendingReviews !== 1 ? 's' : ''} require manual grading
                        </h4>
                        <p className="text-sm text-yellow-800">
                          These tests contain essay or coding questions that need your review.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Breakdown Table */}
                {statistics.testBreakdown && statistics.testBreakdown.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Test Performance Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Test Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attempts
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Avg Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Avg %
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pass Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {statistics.testBreakdown.map((test) => (
                            <tr key={test.testId} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {test.testTitle}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {test.attempts}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {test.averageScore}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {test.averagePercentage}%
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  parseFloat(test.passRate) >= 70 
                                    ? 'bg-green-100 text-green-800'
                                    : parseFloat(test.passRate) >= 50
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {test.passRate}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <button
                                  onClick={() => fetchAttempts(test.testId)}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  View Attempts
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Loading indicator for attempts */}
                {loadingStats && (
                  <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading attempts...</p>
                  </div>
                )}

                {/* Recent Attempts List */}
                {!loadingStats && attempts.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Test Attempts</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Candidate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Test
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Score
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
                          {attempts.map((attempt) => (
                            <tr key={attempt._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {attempt.userId?.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {attempt.userId?.email}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {attempt.testId?.title}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div className="font-medium text-gray-900">
                                  {attempt.score} / {attempt.testId?.totalMarks}
                                </div>
                                <div className="text-gray-500">
                                  {attempt.percentage?.toFixed(1)}%
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  attempt.passed 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {attempt.passed ? 'Passed' : 'Failed'}
                                </span>
                                {attempt.gradingStatus === 'pending-review' && (
                                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                    Needs Review
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(attempt.completedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <button
                                  onClick={() => viewAttemptDetails(attempt._id)}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <span className="text-6xl block mb-4">📊</span>
                <p className="text-gray-500 text-lg">No performance data available yet</p>
                <p className="text-gray-400 mt-2">Test attempts will appear here once candidates start taking your tests</p>
              </div>
            )}
          </div>
        )}

        {/* Attempt Details Modal */}
        {showAttemptDetails && selectedAttempt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Test Attempt Details</h3>
                    <p className="text-gray-600 mt-1">
                      {selectedAttempt.userId?.name} - {selectedAttempt.testId?.title}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAttemptDetails(false);
                      setSelectedAttempt(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>

                {/* Score Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedAttempt.score} / {selectedAttempt.testId?.totalMarks}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Percentage</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedAttempt.percentage?.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Result</p>
                      <p className={`text-2xl font-bold ${selectedAttempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedAttempt.passed ? 'Passed' : 'Failed'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Question Results */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Question Breakdown</h4>
                  {selectedAttempt.questionResults?.map((result, index) => (
                    <div key={result._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900">
                          Q{index + 1}. {result.questionText}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.marksObtained} / {result.marks}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>User Answer:</strong> {result.userAnswer || 'Not answered'}</p>
                        <p><strong>Correct Answer:</strong> {result.correctAnswer}</p>
                        {result.explanation && (
                          <p className="text-blue-600"><strong>Explanation:</strong> {result.explanation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setShowAttemptDetails(false);
                      setSelectedAttempt(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerTests;

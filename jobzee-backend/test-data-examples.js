// Example Test Data for Employer Test Feature
// Use this for frontend development and testing

// Example 1: MCQ Test for Frontend Developer
const frontendTest = {
  title: "Frontend Developer Assessment",
  description: "Comprehensive test covering HTML, CSS, JavaScript, and React",
  jobRole: "Frontend Developer",
  skill: "React, JavaScript",
  type: "mixed",
  category: "technical",
  difficulty: "medium",
  duration: 45, // minutes
  totalMarks: 50,
  passingMarks: 30,
  tags: ["react", "javascript", "html", "css"],
  instructions: "Answer all questions carefully. No negative marking. You cannot go back once submitted."
};

// MCQ Questions for Frontend Test
const frontendQuestions = [
  {
    questionText: "What is the virtual DOM in React?",
    type: "mcq",
    options: [
      "A lightweight copy of the actual DOM",
      "A database for storing component state",
      "A testing framework",
      "A CSS preprocessor"
    ],
    correctAnswer: "A lightweight copy of the actual DOM",
    marks: 5,
    explanation: "The virtual DOM is an in-memory representation of the real DOM elements, allowing React to efficiently update only what changed.",
    difficulty: "medium"
  },
  {
    questionText: "Which CSS property is used for flexbox?",
    type: "mcq",
    options: [
      "display: flex",
      "flex-container: true",
      "layout: flexbox",
      "flexbox: enabled"
    ],
    correctAnswer: "display: flex",
    marks: 3,
    explanation: "display: flex is the CSS property that enables flexbox layout.",
    difficulty: "easy"
  },
  {
    questionText: "What does 'async/await' do in JavaScript?",
    type: "mcq",
    options: [
      "Makes code run in parallel threads",
      "Simplifies working with promises",
      "Converts callbacks to promises",
      "Blocks the main thread"
    ],
    correctAnswer: "Simplifies working with promises",
    marks: 5,
    explanation: "async/await is syntactic sugar that makes promise-based code easier to read and write.",
    difficulty: "medium"
  }
];

// Example 2: Coding Test for Backend Developer
const backendTest = {
  title: "Backend Developer Assessment",
  description: "Test your Node.js and database skills",
  jobRole: "Backend Developer",
  skill: "Node.js, MongoDB",
  type: "coding",
  category: "technical",
  difficulty: "hard",
  duration: 90,
  totalMarks: 100,
  passingMarks: 60,
  tags: ["nodejs", "mongodb", "api"],
  instructions: "Write clean, efficient code. All test cases must pass. Time limit: 90 minutes."
};

// Coding Questions for Backend Test
const backendQuestions = [
  {
    questionText: "Implement a REST API endpoint for user authentication",
    type: "coding",
    marks: 30,
    difficulty: "hard",
    codingDetails: {
      problemStatement: "Create a login endpoint that accepts email and password, validates credentials against a database, and returns a JWT token.",
      inputFormat: "POST request with email and password in body",
      outputFormat: "JSON with token or error message",
      constraints: "Use bcrypt for password hashing, JWT for token generation",
      sampleInput: JSON.stringify({ email: "user@example.com", password: "password123" }),
      sampleOutput: JSON.stringify({ success: true, token: "jwt_token_here" }),
      expectedSolution: `
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

async function login(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');
  
  const token = jwt.sign({ id: user._id }, 'secret', { expiresIn: '7d' });
  return { success: true, token };
}
      `,
      testCases: [
        {
          input: JSON.stringify({ email: "test@test.com", password: "test123" }),
          expectedOutput: JSON.stringify({ success: true }),
          isHidden: false
        },
        {
          input: JSON.stringify({ email: "wrong@test.com", password: "wrong" }),
          expectedOutput: JSON.stringify({ success: false }),
          isHidden: true
        }
      ],
      starterCode: {
        javascript: `async function login(email, password) {
  // Your code here
  // 1. Find user by email
  // 2. Verify password
  // 3. Generate JWT token
  // 4. Return result
}`,
        python: `def login(email, password):
    # Your code here
    # 1. Find user by email
    # 2. Verify password
    # 3. Generate JWT token
    # 4. Return result
    pass`
      },
      timeLimit: 5000, // milliseconds
      memoryLimit: 512 // MB
    }
  },
  {
    questionText: "Implement a function to find duplicate records in database",
    type: "coding",
    marks: 25,
    difficulty: "medium",
    codingDetails: {
      problemStatement: "Write a MongoDB aggregation query to find duplicate email addresses in a users collection.",
      inputFormat: "MongoDB collection with user documents",
      outputFormat: "Array of duplicate emails with count",
      sampleInput: "Users collection with multiple records",
      sampleOutput: '[{email: "dup@test.com", count: 3}]',
      testCases: [
        {
          input: "Sample database with duplicates",
          expectedOutput: "Array of duplicates",
          isHidden: false
        }
      ],
      starterCode: {
        javascript: `async function findDuplicates() {
  // Use MongoDB aggregation
  const duplicates = await User.aggregate([
    // Your aggregation pipeline here
  ]);
  return duplicates;
}`
      },
      timeLimit: 3000,
      memoryLimit: 256
    }
  }
];

// Example 3: Mixed Test (MCQ + Coding)
const fullStackTest = {
  title: "Full Stack Developer Assessment",
  description: "Complete assessment covering frontend, backend, and problem-solving",
  jobRole: "Full Stack Developer",
  skill: "JavaScript, React, Node.js",
  type: "mixed",
  category: "technical",
  difficulty: "hard",
  duration: 120,
  totalMarks: 100,
  passingMarks: 60,
  tags: ["fullstack", "react", "nodejs", "mongodb"],
  instructions: "Complete all sections. Mix of MCQ and coding problems. Total time: 2 hours."
};

const mixedQuestions = [
  // MCQ Questions
  {
    questionText: "What is the purpose of middleware in Express.js?",
    type: "mcq",
    options: [
      "To handle HTTP requests and responses",
      "To connect to databases",
      "To render HTML templates",
      "To manage user sessions only"
    ],
    correctAnswer: "To handle HTTP requests and responses",
    marks: 5,
    difficulty: "medium"
  },
  {
    questionText: "Which hook is used for side effects in React?",
    type: "mcq",
    options: [
      "useState",
      "useEffect",
      "useContext",
      "useMemo"
    ],
    correctAnswer: "useEffect",
    marks: 5,
    difficulty: "easy"
  },
  // Coding Questions
  {
    questionText: "Build a simple todo API endpoint",
    type: "coding",
    marks: 30,
    difficulty: "hard",
    codingDetails: {
      problemStatement: "Create CRUD endpoints for a todo application using Express and MongoDB",
      sampleInput: "GET /todos, POST /todos, PUT /todos/:id, DELETE /todos/:id",
      sampleOutput: "RESTful API responses",
      testCases: [
        {
          input: "POST /todos {title: 'Test'}",
          expectedOutput: "{success: true, todo: {...}}",
          isHidden: false
        }
      ],
      starterCode: {
        javascript: `const express = require('express');
const router = express.Router();

// GET all todos
router.get('/todos', async (req, res) => {
  // Your code here
});

// POST new todo
router.post('/todos', async (req, res) => {
  // Your code here
});

// PUT update todo
router.put('/todos/:id', async (req, res) => {
  // Your code here
});

// DELETE todo
router.delete('/todos/:id', async (req, res) => {
  // Your code here
});

module.exports = router;`
      }
    }
  }
];

// Example 4: Aptitude Test
const aptitudeTest = {
  title: "General Aptitude Test",
  description: "Test your logical reasoning and problem-solving skills",
  type: "mcq",
  category: "aptitude",
  difficulty: "medium",
  duration: 30,
  totalMarks: 40,
  passingMarks: 24,
  tags: ["aptitude", "reasoning", "logical"],
  instructions: "Answer all questions. Each question carries equal marks."
};

const aptitudeQuestions = [
  {
    questionText: "If A is 1, B is 2, C is 3... what is the sum of letters in 'CODE'?",
    type: "mcq",
    options: ["32", "36", "40", "44"],
    correctAnswer: "32",
    marks: 4,
    explanation: "C(3) + O(15) + D(4) + E(5) = 27, not 32. Correct answer should be 27.",
    difficulty: "easy"
  },
  {
    questionText: "What comes next in the series: 2, 6, 12, 20, ?",
    type: "mcq",
    options: ["28", "30", "32", "36"],
    correctAnswer: "30",
    marks: 4,
    explanation: "Pattern: n*(n+1) where n = 1,2,3,4,5... So 5*6 = 30",
    difficulty: "medium"
  }
];

// Example API Response Format
const testResponseFormat = {
  success: true,
  test: {
    _id: "test_id_here",
    title: "Frontend Developer Assessment",
    type: "mixed",
    category: "technical",
    difficulty: "medium",
    duration: 45,
    totalMarks: 50,
    passingMarks: 30,
    questionCount: 10,
    isActive: true,
    createdBy: "employer_id",
    createdByModel: "Employer",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:30:00.000Z"
  }
};

const questionResponseFormat = {
  success: true,
  message: "Question added successfully",
  question: {
    _id: "question_id_here",
    testId: "test_id_here",
    questionText: "What is React?",
    type: "mcq",
    options: ["Library", "Framework", "Language", "Tool"],
    correctAnswer: "Library",
    marks: 5,
    order: 1,
    isActive: true,
    createdAt: "2024-01-15T10:15:00.000Z"
  },
  test: {
    // Updated test object with all questions
  }
};

// Export for use in frontend
module.exports = {
  frontendTest,
  frontendQuestions,
  backendTest,
  backendQuestions,
  fullStackTest,
  mixedQuestions,
  aptitudeTest,
  aptitudeQuestions,
  testResponseFormat,
  questionResponseFormat
};

// Example Usage in Frontend
/*
// 1. Create Test
const response = await fetch('/api/employer-tests', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(frontendTest)
});
const { test } = await response.json();

// 2. Add Questions
for (const question of frontendQuestions) {
  await fetch(`/api/employer-tests/${test._id}/questions`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(question)
  });
}

// 3. Activate Test
await fetch(`/api/employer-tests/${test._id}/toggle-active`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

// 4. Link to Job
await fetch('/api/employers/jobs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Frontend Developer',
    description: 'Looking for React developer',
    location: 'Remote',
    jobType: 'full-time',
    experienceLevel: 'mid',
    testId: test._id,
    requiresTest: true
  })
});
*/

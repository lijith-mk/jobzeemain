require('dotenv').config();
const mongoose = require('mongoose');
const Employer = require('../models/Employer');
const Job = require('../models/Job');

function parseArgs(argv) {
  const args = {};
  for (const token of argv) {
    if (!token.startsWith('--')) continue;
    const [rawKey, ...rest] = token.slice(2).split('=');
    const key = rawKey.trim();
    const value = rest.join('=').trim();
    args[key] = value === '' ? true : value;
  }
  return args;
}

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return fallback;
  return num;
}

function pick(arr, idx) {
  return arr[idx % arr.length];
}

function randomInRange(min, max) {
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  return value;
}

const ROLE_TITLE_POOL = {
  technology: ['Frontend Developer', 'Backend Developer', 'Full Stack Engineer', 'React Native Developer', 'DevOps Engineer', 'QA Engineer'],
  marketing: ['Digital Marketing Specialist', 'SEO Analyst', 'Performance Marketing Executive', 'Content Marketing Associate'],
  hr: ['HR Executive', 'Talent Acquisition Specialist', 'HR Operations Associate'],
  design: ['Product Designer', 'UI/UX Designer', 'Visual Designer'],
  sales: ['Sales Executive', 'Business Development Associate', 'Account Manager'],
  operations: ['Operations Executive', 'Project Coordinator', 'Customer Success Associate'],
  analytics: ['Data Analyst', 'Business Analyst']
};

const TITLE_TO_CATEGORY = {
  'Frontend Developer': 'technology',
  'Backend Developer': 'technology',
  'Full Stack Engineer': 'technology',
  'React Native Developer': 'technology',
  'DevOps Engineer': 'technology',
  'QA Engineer': 'technology',
  'Digital Marketing Specialist': 'marketing',
  'SEO Analyst': 'marketing',
  'Performance Marketing Executive': 'marketing',
  'Content Marketing Associate': 'marketing',
  'HR Executive': 'hr',
  'Talent Acquisition Specialist': 'hr',
  'HR Operations Associate': 'hr',
  'Product Designer': 'design',
  'UI/UX Designer': 'design',
  'Visual Designer': 'design',
  'Sales Executive': 'sales',
  'Business Development Associate': 'sales',
  'Account Manager': 'sales',
  'Operations Executive': 'operations',
  'Project Coordinator': 'operations',
  'Customer Success Associate': 'operations',
  'Data Analyst': 'technology',
  'Business Analyst': 'operations'
};

function getTitlePoolByRoles(roles) {
  if (!roles || roles.length === 0) {
    return Object.values(ROLE_TITLE_POOL).flat();
  }

  const selected = roles
    .map((role) => role.trim().toLowerCase())
    .filter((role) => ROLE_TITLE_POOL[role]);

  if (selected.length === 0) {
    return Object.values(ROLE_TITLE_POOL).flat();
  }

  return selected.map((role) => ROLE_TITLE_POOL[role]).flat();
}

function generateJobPayload(employer, index, status, titlePool) {
  const titles = titlePool && titlePool.length > 0 ? titlePool : Object.values(ROLE_TITLE_POOL).flat();

  const locations = ['Bengaluru', 'Hyderabad', 'Mumbai', 'Pune', 'Chennai', 'Delhi'];
  const jobTypes = ['full-time', 'part-time', 'contract', 'internship'];
  const experienceLevels = ['entry', 'mid', 'senior'];
  const remoteModes = ['remote', 'hybrid', 'onsite'];
  const industries = ['Information Technology', 'Fintech', 'Healthcare', 'EdTech', 'E-commerce'];

  const title = pick(titles, index);
  const experienceLevel = pick(experienceLevels, index);
  const location = pick(locations, index);
  const remote = pick(remoteModes, index);
  const jobType = pick(jobTypes, index);
  const category = TITLE_TO_CATEGORY[title] || 'other';
  const industry = pick(industries, index);

  const minSalary = randomInRange(300000, 1200000);
  const maxSalary = minSalary + randomInRange(100000, 500000);

  return {
    title: `${title} ${index + 1}`,
    description: `${employer.companyName} is looking for a ${title.toLowerCase()} with ${experienceLevel} level experience. You will collaborate with cross-functional teams, deliver high quality work, and contribute to business growth.`,
    company: employer.companyName,
    employerId: employer._id,
    location,
    jobType,
    experienceLevel,
    salary: {
      min: minSalary,
      max: maxSalary,
      currency: 'INR'
    },
    requirements: [
      'Strong communication skills',
      'Problem-solving mindset',
      'Relevant project experience',
      'Ability to work in a team'
    ],
    benefits: [
      'Health insurance',
      'Paid time off',
      'Learning budget',
      'Flexible working hours'
    ],
    skills: ['JavaScript', 'Communication', 'Teamwork', 'Problem Solving'],
    category,
    industry,
    applicationDeadline: new Date(Date.now() + randomInRange(14, 60) * 24 * 60 * 60 * 1000),
    remote,
    status,
    approvedAt: status === 'active' || status === 'approved' ? new Date() : null,
    paymentStatus: 'paid',
    paymentAmount: 0,
    requiresTest: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
}

function validateJobPayload(payload) {
  const requiredFields = ['title', 'description', 'company', 'employerId', 'location', 'jobType', 'experienceLevel'];
  for (const key of requiredFields) {
    if (!payload[key]) {
      throw new Error(`Generated payload missing required field: ${key}`);
    }
  }
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scripts/seedEmployerJobs.js --employerEmail=your@email.com --count=25');
  console.log('');
  console.log('Options:');
  console.log('  --employerEmail=...   Required employer email');
  console.log('  --count=...           Number of jobs to create (default: 20)');
  console.log('  --status=...          active|approved|pending (default: active)');
  console.log('  --roles=...           Optional comma list: technology,marketing,hr,design,sales,operations,analytics');
  console.log('  --dryRun=true         Validate and preview without creating jobs');
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    printUsage();
    process.exit(0);
  }

  const employerEmail = (args.employerEmail || '').toLowerCase().trim();
  if (!employerEmail) {
    console.error('Missing required argument: --employerEmail');
    printUsage();
    process.exit(1);
  }

  const count = toPositiveInt(args.count, 20);
  const allowedStatuses = new Set(['active', 'approved', 'pending']);
  const status = allowedStatuses.has(String(args.status || '').toLowerCase())
    ? String(args.status).toLowerCase()
    : 'active';
  const dryRun = String(args.dryRun || 'false').toLowerCase() === 'true';
  const roles = String(args.roles || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const titlePool = getTitlePoolByRoles(roles);

  const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv')
    ? process.env.MONGODB_URI
    : process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MongoDB URI missing. Set MONGODB_URI or MONGO_URI in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    const employer = await Employer.findOne({
      companyEmail: employerEmail,
      isActive: true,
      deletedAt: { $exists: false }
    });

    if (!employer) {
      throw new Error(`Employer not found for email: ${employerEmail}`);
    }

    if (employer.subscriptionPlan === 'free') {
      throw new Error('Free plan employer detected. Bulk posting is blocked to protect future data consistency. Use a paid employer account.');
    }

    if (employer.jobPostingLimit !== null) {
      const remaining = Math.max(0, employer.jobPostingLimit - employer.jobPostingsUsed);
      if (remaining < count) {
        throw new Error(`Plan limit exceeded. Remaining posts: ${remaining}, requested: ${count}`);
      }
    }

    const payloads = [];
    for (let index = 0; index < count; index += 1) {
      const payload = generateJobPayload(employer, index, status, titlePool);
      validateJobPayload(payload);
      payloads.push(payload);
    }

    if (dryRun) {
      console.log('Dry run successful. No jobs were created.');
      console.log(`Employer: ${employer.companyName} (${employer.companyEmail})`);
      console.log(`Plan: ${employer.subscriptionPlan}`);
      console.log(`Roles: ${roles.length > 0 ? roles.join(', ') : 'all'}`);
      console.log(`Jobs validated: ${payloads.length}`);
      console.log('Preview first job:');
      console.log(JSON.stringify(payloads[0], null, 2));
      process.exit(0);
    }

    const createdJobs = await Job.insertMany(payloads, { ordered: true });

    employer.jobPostingsUsed += createdJobs.length;
    employer.totalJobPosts += createdJobs.length;
    await employer.save();

    console.log(`Created ${createdJobs.length} jobs successfully.`);
    console.log(`Employer: ${employer.companyName} (${employer.companyEmail})`);
    console.log(`Updated usage: ${employer.jobPostingsUsed}/${employer.jobPostingLimit === null ? 'unlimited' : employer.jobPostingLimit}`);
    console.log('Sample created job IDs:');
    createdJobs.slice(0, 5).forEach((job) => console.log(`- ${job._id}`));
  } catch (error) {
    console.error('Failed to seed jobs:', error.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

run();

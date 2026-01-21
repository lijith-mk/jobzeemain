const mongoose = require('mongoose');
const Product = require('../models/Product');
const Admin = require('../models/Admin');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'Complete Resume Writing Course',
    description: 'Master the art of resume writing with our comprehensive course. Learn how to craft compelling resumes that get noticed by hiring managers and ATS systems. Includes templates, examples, and personal feedback.',
    shortDescription: 'Professional resume writing course with templates and feedback',
    price: 49.99,
    category: 'Courses',
    tags: ['resume', 'career', 'job search', 'writing'],
    productType: 'digital',
    stock: 1000,
    isUnlimited: true,
    status: 'active',
    isVisible: true,
    isFeatured: true,
    currency: 'USD',
    images: [{
      url: 'https://via.placeholder.com/600x400/2563eb/ffffff?text=Resume+Course',
      alt: 'Resume Writing Course',
      isPrimary: true
    }],
    deliveryInfo: {
      type: 'instant',
      estimatedDelivery: 'Instant access after purchase',
      instructions: 'Course materials will be available in your dashboard immediately after purchase'
    },
    specifications: [
      { key: 'Duration', value: '4 hours of video content' },
      { key: 'Materials', value: '20+ resume templates' },
      { key: 'Access', value: 'Lifetime access' },
      { key: 'Certificate', value: 'Certificate of completion included' }
    ],
    faqs: [
      {
        question: 'How long do I have access to the course?',
        answer: 'You have lifetime access to all course materials and updates.'
      },
      {
        question: 'Do I get resume templates?',
        answer: 'Yes, the course includes 20+ professionally designed resume templates.'
      }
    ]
  },
  {
    name: 'Professional Resume Templates Bundle',
    description: 'Get instant access to 50+ professional resume templates designed by HR experts. Compatible with Word, Google Docs, and other popular editors. Perfect for job seekers in all industries.',
    shortDescription: '50+ professional resume templates for all industries',
    price: 19.99,
    originalPrice: 29.99,
    category: 'Templates',
    tags: ['resume', 'templates', 'design', 'professional'],
    productType: 'digital',
    stock: 1000,
    isUnlimited: true,
    status: 'active',
    isVisible: true,
    isFeatured: true,
    currency: 'USD',
    discount: {
      percentage: 33,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    images: [{
      url: 'https://via.placeholder.com/600x400/10b981/ffffff?text=Resume+Templates',
      alt: 'Resume Templates Bundle',
      isPrimary: true
    }],
    deliveryInfo: {
      type: 'download',
      estimatedDelivery: 'Instant download',
      instructions: 'Download link will be sent to your email and available in your account'
    },
    specifications: [
      { key: 'Templates', value: '50+ unique designs' },
      { key: 'Format', value: 'Word, Google Docs, PDF' },
      { key: 'Industries', value: 'All industries covered' },
      { key: 'Updates', value: 'Free template updates' }
    ]
  },
  {
    name: 'Interview Preparation Masterclass',
    description: 'Ace your next job interview with our comprehensive preparation course. Learn how to answer tough questions, handle behavioral interviews, and negotiate salary with confidence.',
    shortDescription: 'Complete interview preparation with practice questions and strategies',
    price: 79.99,
    category: 'Interview Prep',
    tags: ['interview', 'preparation', 'questions', 'confidence'],
    productType: 'digital',
    stock: 500,
    isUnlimited: true,
    status: 'active',
    isVisible: true,
    isFeatured: false,
    currency: 'USD',
    images: [{
      url: 'https://via.placeholder.com/600x400/7c3aed/ffffff?text=Interview+Prep',
      alt: 'Interview Preparation Course',
      isPrimary: true
    }],
    deliveryInfo: {
      type: 'instant',
      estimatedDelivery: 'Instant access',
      instructions: 'Access course materials in your dashboard immediately'
    },
    specifications: [
      { key: 'Duration', value: '6 hours of content' },
      { key: 'Questions', value: '200+ practice questions' },
      { key: 'Mock Interviews', value: '3 recorded mock sessions' },
      { key: 'Bonus', value: 'Salary negotiation guide' }
    ]
  },
  {
    name: 'Career Coaching Session (1-on-1)',
    description: 'Get personalized career guidance from experienced career coaches. Discuss your goals, overcome challenges, and create a strategic career plan tailored to your aspirations.',
    shortDescription: 'One-on-one career coaching session with expert guidance',
    price: 149.99,
    category: 'Consultation',
    tags: ['coaching', 'career guidance', 'mentorship', 'strategy'],
    productType: 'service',
    stock: 20,
    isUnlimited: false,
    status: 'active',
    isVisible: true,
    isFeatured: true,
    currency: 'USD',
    images: [{
      url: 'https://via.placeholder.com/600x400/f59e0b/ffffff?text=Career+Coaching',
      alt: 'Career Coaching Session',
      isPrimary: true
    }],
    deliveryInfo: {
      type: 'email',
      estimatedDelivery: '1-2 business days',
      instructions: 'You will be contacted within 48 hours to schedule your session'
    },
    specifications: [
      { key: 'Duration', value: '60 minutes' },
      { key: 'Format', value: 'Video call or phone' },
      { key: 'Materials', value: 'Career assessment and action plan' },
      { key: 'Follow-up', value: 'Email summary included' }
    ]
  },
  {
    name: 'LinkedIn Optimization Toolkit',
    description: 'Transform your LinkedIn profile into a powerful career tool. Includes profile templates, headline generators, and networking strategies to attract recruiters and opportunities.',
    shortDescription: 'Complete LinkedIn optimization with templates and strategies',
    price: 39.99,
    category: 'Tools',
    tags: ['linkedin', 'networking', 'profile', 'optimization'],
    productType: 'digital',
    stock: 1000,
    isUnlimited: true,
    status: 'active',
    isVisible: true,
    isFeatured: false,
    currency: 'USD',
    images: [{
      url: 'https://via.placeholder.com/600x400/0ea5e9/ffffff?text=LinkedIn+Toolkit',
      alt: 'LinkedIn Optimization Toolkit',
      isPrimary: true
    }],
    deliveryInfo: {
      type: 'download',
      estimatedDelivery: 'Instant download',
      instructions: 'All materials available for immediate download'
    },
    specifications: [
      { key: 'Templates', value: '10+ profile templates' },
      { key: 'Tools', value: 'Headline and summary generators' },
      { key: 'Guide', value: 'Step-by-step optimization guide' },
      { key: 'Bonus', value: 'Networking message templates' }
    ]
  },
  {
    name: 'Cover Letter Writing Templates',
    description: 'Professional cover letter templates for various industries and job levels. Includes writing tips, examples, and customizable templates to help you stand out.',
    shortDescription: 'Professional cover letter templates with writing guide',
    price: 24.99,
    category: 'Templates',
    tags: ['cover letter', 'templates', 'writing', 'professional'],
    productType: 'digital',
    stock: 1000,
    isUnlimited: true,
    status: 'active',
    isVisible: true,
    isFeatured: false,
    currency: 'USD',
    images: [{
      url: 'https://via.placeholder.com/600x400/ec4899/ffffff?text=Cover+Letter+Templates',
      alt: 'Cover Letter Templates',
      isPrimary: true
    }],
    deliveryInfo: {
      type: 'download',
      estimatedDelivery: 'Instant download',
      instructions: 'Download all templates immediately after purchase'
    },
    specifications: [
      { key: 'Templates', value: '25 unique designs' },
      { key: 'Industries', value: 'Tech, Finance, Healthcare, and more' },
      { key: 'Format', value: 'Word and Google Docs' },
      { key: 'Guide', value: 'Writing tips and examples' }
    ]
  },
  {
    name: 'Job Search Strategy Course',
    description: 'Learn proven job search strategies that work in today\'s market. Covers networking, online job boards, company research, and application tracking systems.',
    shortDescription: 'Complete job search strategy course with proven techniques',
    price: 59.99,
    category: 'Courses',
    tags: ['job search', 'strategy', 'networking', 'career'],
    productType: 'digital',
    stock: 1000,
    isUnlimited: true,
    status: 'active',
    isVisible: true,
    isFeatured: false,
    currency: 'USD',
    images: [{
      url: 'https://via.placeholder.com/600x400/8b5cf6/ffffff?text=Job+Search+Course',
      alt: 'Job Search Strategy Course',
      isPrimary: true
    }],
    deliveryInfo: {
      type: 'instant',
      estimatedDelivery: 'Instant access',
      instructions: 'Course available in your dashboard immediately'
    },
    specifications: [
      { key: 'Modules', value: '8 comprehensive modules' },
      { key: 'Duration', value: '5 hours of content' },
      { key: 'Worksheets', value: '15+ planning worksheets' },
      { key: 'Bonus', value: 'Job tracker spreadsheet' }
    ]
  },
  {
    name: 'Salary Negotiation Guide',
    description: 'Learn how to negotiate salary and benefits like a pro. Includes scripts, research techniques, and strategies for different career stages and industries.',
    shortDescription: 'Complete guide to salary negotiation with scripts and strategies',
    price: 34.99,
    category: 'Tools',
    tags: ['salary', 'negotiation', 'benefits', 'career advancement'],
    productType: 'digital',
    stock: 1000,
    isUnlimited: true,
    status: 'active',
    isVisible: true,
    isFeatured: false,
    currency: 'USD',
    images: [{
      url: 'https://via.placeholder.com/600x400/059669/ffffff?text=Salary+Negotiation',
      alt: 'Salary Negotiation Guide',
      isPrimary: true
    }],
    deliveryInfo: {
      type: 'download',
      estimatedDelivery: 'Instant download',
      instructions: 'PDF guide and templates available immediately'
    },
    specifications: [
      { key: 'Pages', value: '50+ page comprehensive guide' },
      { key: 'Scripts', value: 'Ready-to-use negotiation scripts' },
      { key: 'Research', value: 'Salary research templates' },
      { key: 'Bonus', value: 'Benefits negotiation checklist' }
    ]
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find or create a default admin user for seeding
    let admin = await Admin.findOne({ email: 'admin@jobzee.com' });
    if (!admin) {
      admin = new Admin({
        name: 'JobZee Admin',
        email: 'admin@jobzee.com',
        password: '$2a$10$placeholder', // This should be properly hashed in real scenario
        role: 'admin',
        isActive: true,
        permissions: {
          users: true,
          employers: true,
          jobs: true,
          applications: true,
          events: true,
          tickets: true,
          analytics: true,
          settings: true
        }
      });
      await admin.save();
      console.log('Created default admin user');
    }

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Add seller info to each product
    const productsWithSeller = sampleProducts.map(product => ({
      ...product,
      seller: admin._id,
      sellerName: admin.name
    }));

    // Insert sample products
    const insertedProducts = await Product.insertMany(productsWithSeller);
    console.log(`✅ Successfully seeded ${insertedProducts.length} products`);

    // Add some sample reviews to a few products
    const reviewsToAdd = [
      {
        productIndex: 0, // Resume Course
        reviews: [
          {
            userName: 'Sarah Johnson',
            rating: 5,
            comment: 'Excellent course! The templates are professional and the feedback was invaluable.',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          },
          {
            userName: 'Michael Chen',
            rating: 4,
            comment: 'Very helpful content. Got my resume noticed by multiple employers.',
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
          }
        ]
      },
      {
        productIndex: 1, // Resume Templates
        reviews: [
          {
            userName: 'Emily Davis',
            rating: 5,
            comment: 'Beautiful templates that are easy to customize. Great value for money!',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
          }
        ]
      },
      {
        productIndex: 3, // Career Coaching
        reviews: [
          {
            userName: 'David Wilson',
            rating: 5,
            comment: 'The career coach was incredibly insightful. Helped me land my dream job!',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
          }
        ]
      }
    ];

    // Add reviews to products
    for (const { productIndex, reviews } of reviewsToAdd) {
      const product = insertedProducts[productIndex];
      for (const review of reviews) {
        await product.addReview(review);
      }
      console.log(`Added ${reviews.length} reviews to ${product.name}`);
    }

    console.log('\n🎉 Product seeding completed successfully!');
    console.log('\nSample products created:');
    insertedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price} (${product.category})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

// Run the seeder if called directly
if (require.main === module) {
  seedProducts();
}

module.exports = { seedProducts, sampleProducts };
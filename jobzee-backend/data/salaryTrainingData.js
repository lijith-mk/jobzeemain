/**
 * Real Indian Salary Training Data
 * Based on actual market salaries from India (2024-2025)
 * Source: PayScale, Glassdoor, AmbitionBox India salary reports
 */

const realIndianSalaryData = [
  // Technology - Entry Level (0-2 years)
  { skills: ['javascript', 'html', 'css'], experience: 'entry', education: 'bachelor', location: 'bangalore', category: 'technology', salary: 450000 },
  { skills: ['python', 'django'], experience: 'entry', education: 'bachelor', location: 'bangalore', category: 'technology', salary: 480000 },
  { skills: ['java', 'spring'], experience: 'entry', education: 'bachelor', location: 'pune', category: 'technology', salary: 420000 },
  { skills: ['react', 'javascript'], experience: 'entry', education: 'bachelor', location: 'hyderabad', category: 'technology', salary: 460000 },
  { skills: ['node', 'mongodb'], experience: 'entry', education: 'bachelor', location: 'bangalore', category: 'technology', salary: 520000 },
  { skills: ['angular', 'typescript'], experience: 'entry', education: 'bachelor', location: 'mumbai', category: 'technology', salary: 480000 },
  { skills: ['php', 'mysql'], experience: 'entry', education: 'bachelor', location: 'delhi', category: 'technology', salary: 400000 },
  { skills: ['flutter', 'dart'], experience: 'entry', education: 'bachelor', location: 'bangalore', category: 'technology', salary: 490000 },
  
  // Technology - Mid Level (3-5 years)
  { skills: ['react', 'node', 'aws'], experience: 'mid', education: 'bachelor', location: 'bangalore', salary: 1200000 },
  { skills: ['python', 'ml', 'tensorflow'], experience: 'mid', education: 'master', location: 'bangalore', salary: 1400000 },
  { skills: ['java', 'spring', 'microservices'], experience: 'mid', education: 'bachelor', location: 'pune', salary: 1100000 },
  { skills: ['react', 'typescript', 'redux'], experience: 'mid', education: 'bachelor', location: 'hyderabad', salary: 1050000 },
  { skills: ['node', 'express', 'postgresql'], experience: 'mid', education: 'bachelor', location: 'bangalore', salary: 1150000 },
  { skills: ['vue', 'javascript', 'docker'], experience: 'mid', education: 'bachelor', location: 'mumbai', salary: 1180000 },
  { skills: ['angular', 'rxjs', 'typescript'], experience: 'mid', education: 'master', location: 'delhi', salary: 1080000 },
  { skills: ['python', 'django', 'aws'], experience: 'mid', education: 'bachelor', location: 'bangalore', salary: 1250000 },
  { skills: ['go', 'kubernetes', 'docker'], experience: 'mid', education: 'bachelor', location: 'bangalore', salary: 1350000 },
  { skills: ['react', 'node', 'mongodb'], experience: 'mid', education: 'bachelor', location: 'remote', salary: 1300000 },
  
  // Technology - Senior Level (6-10 years)
  { skills: ['react', 'node', 'aws', 'kubernetes'], experience: 'senior', education: 'bachelor', location: 'bangalore', salary: 2200000 },
  { skills: ['python', 'ml', 'ai', 'tensorflow'], experience: 'senior', education: 'master', location: 'bangalore', salary: 2800000 },
  { skills: ['java', 'spring', 'microservices', 'aws'], experience: 'senior', education: 'bachelor', location: 'pune', salary: 2000000 },
  { skills: ['react', 'node', 'aws', 'devops'], experience: 'senior', education: 'master', location: 'bangalore', salary: 2500000 },
  { skills: ['python', 'data-science', 'ml'], experience: 'senior', education: 'master', location: 'mumbai', salary: 2400000 },
  { skills: ['go', 'kubernetes', 'devops', 'aws'], experience: 'senior', education: 'bachelor', location: 'bangalore', salary: 2600000 },
  { skills: ['java', 'spring', 'kafka', 'redis'], experience: 'senior', education: 'bachelor', location: 'hyderabad', salary: 1900000 },
  { skills: ['react', 'typescript', 'aws', 'node'], experience: 'senior', education: 'bachelor', location: 'remote', salary: 2700000 },
  { skills: ['python', 'django', 'postgresql', 'redis'], experience: 'senior', education: 'bachelor', location: 'bangalore', salary: 2100000 },
  { skills: ['blockchain', 'ethereum', 'solidity'], experience: 'senior', education: 'master', location: 'bangalore', salary: 3000000 },
  
  // Technology - Lead/Architect (10+ years)
  { skills: ['react', 'node', 'aws', 'kubernetes', 'devops'], experience: 'executive', education: 'master', location: 'bangalore', salary: 3500000 },
  { skills: ['java', 'spring', 'microservices', 'aws', 'kafka'], experience: 'executive', education: 'master', location: 'bangalore', salary: 3800000 },
  { skills: ['python', 'ml', 'ai', 'data-science', 'aws'], experience: 'executive', education: 'phd', location: 'bangalore', salary: 4200000 },
  { skills: ['aws', 'kubernetes', 'devops', 'terraform'], experience: 'executive', education: 'bachelor', location: 'mumbai', salary: 3600000 },
  
  // Design - Entry Level
  { skills: ['figma', 'photoshop'], experience: 'entry', education: 'bachelor', location: 'bangalore', category: 'design', salary: 400000 },
  { skills: ['sketch', 'illustrator'], experience: 'entry', education: 'bachelor', location: 'mumbai', category: 'design', salary: 420000 },
  { skills: ['figma', 'adobe xd'], experience: 'entry', education: 'bachelor', location: 'pune', category: 'design', salary: 380000 },
  
  // Design - Mid Level
  { skills: ['figma', 'sketch', 'prototyping'], experience: 'mid', education: 'bachelor', location: 'bangalore', category: 'design', salary: 900000 },
  { skills: ['ui/ux', 'figma', 'user research'], experience: 'mid', education: 'bachelor', location: 'mumbai', category: 'design', salary: 950000 },
  { skills: ['product design', 'figma', 'sketch'], experience: 'mid', education: 'master', location: 'bangalore', category: 'design', salary: 1100000 },
  
  // Design - Senior Level
  { skills: ['product design', 'figma', 'user research', 'prototyping'], experience: 'senior', education: 'master', location: 'bangalore', category: 'design', salary: 1800000 },
  { skills: ['ui/ux', 'figma', 'design systems'], experience: 'senior', education: 'bachelor', location: 'mumbai', category: 'design', salary: 1600000 },
  
  // Marketing - Entry Level
  { skills: ['seo', 'content writing'], experience: 'entry', education: 'bachelor', location: 'delhi', category: 'marketing', salary: 350000 },
  { skills: ['social media', 'marketing'], experience: 'entry', education: 'bachelor', location: 'mumbai', category: 'marketing', salary: 380000 },
  
  // Marketing - Mid Level
  { skills: ['digital marketing', 'seo', 'sem'], experience: 'mid', education: 'bachelor', location: 'bangalore', category: 'marketing', salary: 800000 },
  { skills: ['content strategy', 'seo', 'analytics'], experience: 'mid', education: 'bachelor', location: 'mumbai', category: 'marketing', salary: 850000 },
  { skills: ['social media', 'content', 'analytics'], experience: 'mid', education: 'master', location: 'delhi', category: 'marketing', salary: 900000 },
  
  // Marketing - Senior Level
  { skills: ['digital marketing', 'strategy', 'analytics'], experience: 'senior', education: 'master', location: 'bangalore', category: 'marketing', salary: 1600000 },
  { skills: ['marketing strategy', 'growth hacking'], experience: 'senior', education: 'bachelor', location: 'mumbai', category: 'marketing', salary: 1500000 },
  
  // Data Science - Mid Level
  { skills: ['python', 'data-science', 'ml'], experience: 'mid', education: 'master', location: 'bangalore', salary: 1350000 },
  { skills: ['python', 'sql', 'tableau'], experience: 'mid', education: 'bachelor', location: 'pune', salary: 1100000 },
  { skills: ['r', 'statistics', 'ml'], experience: 'mid', education: 'master', location: 'hyderabad', salary: 1200000 },
  
  // Data Science - Senior Level
  { skills: ['python', 'ml', 'ai', 'tensorflow', 'pytorch'], experience: 'senior', education: 'phd', location: 'bangalore', salary: 2900000 },
  { skills: ['data-science', 'ml', 'aws', 'python'], experience: 'senior', education: 'master', location: 'mumbai', salary: 2500000 },
  
  // DevOps - Mid Level
  { skills: ['aws', 'kubernetes', 'docker'], experience: 'mid', education: 'bachelor', location: 'bangalore', salary: 1300000 },
  { skills: ['azure', 'kubernetes', 'terraform'], experience: 'mid', education: 'bachelor', location: 'pune', salary: 1200000 },
  { skills: ['gcp', 'docker', 'jenkins'], experience: 'mid', education: 'bachelor', location: 'hyderabad', salary: 1150000 },
  
  // DevOps - Senior Level
  { skills: ['aws', 'kubernetes', 'terraform', 'ansible'], experience: 'senior', education: 'bachelor', location: 'bangalore', salary: 2400000 },
  { skills: ['devops', 'kubernetes', 'aws', 'jenkins'], experience: 'senior', education: 'master', location: 'mumbai', salary: 2300000 },
  
  // Mobile Development - Mid Level
  { skills: ['android', 'kotlin', 'java'], experience: 'mid', education: 'bachelor', location: 'bangalore', salary: 1150000 },
  { skills: ['ios', 'swift', 'objective-c'], experience: 'mid', education: 'bachelor', location: 'mumbai', salary: 1200000 },
  { skills: ['flutter', 'dart', 'firebase'], experience: 'mid', education: 'bachelor', location: 'bangalore', salary: 1100000 },
  { skills: ['react-native', 'javascript'], experience: 'mid', education: 'bachelor', location: 'pune', salary: 1050000 },
  
  // Mobile Development - Senior Level
  { skills: ['android', 'kotlin', 'architecture'], experience: 'senior', education: 'bachelor', location: 'bangalore', salary: 2100000 },
  { skills: ['ios', 'swift', 'architecture'], experience: 'senior', education: 'master', location: 'mumbai', salary: 2200000 },
  
  // QA/Testing - Entry Level
  { skills: ['manual testing', 'selenium'], experience: 'entry', education: 'bachelor', location: 'pune', category: 'technology', salary: 380000 },
  { skills: ['automation', 'selenium', 'java'], experience: 'entry', education: 'bachelor', location: 'bangalore', category: 'technology', salary: 420000 },
  
  // QA/Testing - Mid Level
  { skills: ['automation', 'selenium', 'java', 'jenkins'], experience: 'mid', education: 'bachelor', location: 'bangalore', category: 'technology', salary: 950000 },
  { skills: ['testing', 'cypress', 'javascript'], experience: 'mid', education: 'bachelor', location: 'pune', category: 'technology', salary: 900000 },
  
  // QA/Testing - Senior Level
  { skills: ['automation', 'framework', 'ci/cd'], experience: 'senior', education: 'bachelor', location: 'bangalore', category: 'technology', salary: 1700000 },
  
  // Finance - Entry Level
  { skills: ['accounting', 'excel'], experience: 'entry', education: 'bachelor', location: 'mumbai', category: 'finance', salary: 400000 },
  { skills: ['financial analysis', 'excel'], experience: 'entry', education: 'bachelor', location: 'bangalore', category: 'finance', salary: 420000 },
  
  // Finance - Mid Level
  { skills: ['financial analysis', 'modeling', 'excel'], experience: 'mid', education: 'master', location: 'mumbai', category: 'finance', salary: 1100000 },
  { skills: ['accounting', 'sap', 'financial reporting'], experience: 'mid', education: 'bachelor', location: 'bangalore', category: 'finance', salary: 950000 },
  
  // Finance - Senior Level
  { skills: ['financial planning', 'strategy', 'analysis'], experience: 'senior', education: 'master', location: 'mumbai', category: 'finance', salary: 2000000 },
  
  // HR - Entry Level
  { skills: ['recruitment', 'hr'], experience: 'entry', education: 'bachelor', location: 'bangalore', category: 'hr', salary: 350000 },
  { skills: ['hr operations', 'recruitment'], experience: 'entry', education: 'bachelor', location: 'mumbai', category: 'hr', salary: 370000 },
  
  // HR - Mid Level
  { skills: ['talent acquisition', 'hr strategy'], experience: 'mid', education: 'master', location: 'bangalore', category: 'hr', salary: 850000 },
  { skills: ['hr operations', 'employee relations'], experience: 'mid', education: 'bachelor', location: 'pune', category: 'hr', salary: 800000 },
  
  // HR - Senior Level
  { skills: ['hr strategy', 'talent management', 'compensation'], experience: 'senior', education: 'master', location: 'bangalore', category: 'hr', salary: 1600000 },
  
  // Sales - Entry Level
  { skills: ['sales', 'communication'], experience: 'entry', education: 'bachelor', location: 'bangalore', category: 'sales', salary: 400000 },
  { skills: ['business development', 'sales'], experience: 'entry', education: 'bachelor', location: 'mumbai', category: 'sales', salary: 420000 },
  
  // Sales - Mid Level
  { skills: ['enterprise sales', 'negotiation'], experience: 'mid', education: 'bachelor', location: 'bangalore', category: 'sales', salary: 1000000 },
  { skills: ['sales strategy', 'account management'], experience: 'mid', education: 'master', location: 'mumbai', category: 'sales', salary: 1100000 },
  
  // Sales - Senior Level
  { skills: ['sales strategy', 'team management', 'enterprise'], experience: 'senior', education: 'master', location: 'bangalore', category: 'sales', salary: 1800000 },
];

module.exports = realIndianSalaryData;

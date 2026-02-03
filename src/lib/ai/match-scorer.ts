import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicService } from './anthropic';
import { APIError } from './errors';
import type { MatchAnalysis } from '@/types/ai';

// Common tech skills for matching
const COMMON_SKILLS = [
  'javascript',
  'typescript',
  'python',
  'java',
  'c++',
  'c#',
  'ruby',
  'php',
  'go',
  'rust',
  'swift',
  'kotlin',
  'react',
  'vue',
  'angular',
  'node',
  'express',
  'django',
  'flask',
  'spring',
  'asp.net',
  'rails',
  'laravel',
  'sql',
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'gcp',
  'git',
  'ci/cd',
  'jenkins',
  'terraform',
  'ansible',
  'linux',
  'agile',
  'scrum',
  'rest',
  'graphql',
  'microservices',
  'tdd',
  'devops',
];

// Degree hierarchy for comparison
const DEGREE_LEVELS: Record<string, number> = {
  'phd': 4,
  'doctorate': 4,
  'ph.d': 4,
  "master's": 3,
  'masters': 3,
  'msc': 3,
  'mba': 3,
  "bachelor's": 2,
  'bachelors': 2,
  'bsc': 2,
  'ba': 2,
  'bs': 2,
  "associate's": 1,
  'associates': 1,
  'none': 0,
};

interface UserProfile {
  skills: string[];
  experience: UserExperience[];
  education: UserEducation[];
  preferred_locations: string[];
  preferred_job_types: string[];
  salary_expectation?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

interface UserExperience {
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  skills_used: string[];
}

interface UserEducation {
  institution: string;
  degree: string;
  field_of_study?: string;
  end_date?: string;
}

interface JobDetails {
  description: string;
  location?: string;
  job_type?: string;
  salary_range?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

interface BaseScoreBreakdown {
  skills_score: number;
  experience_score: number;
  education_score: number;
  other_score: number;
  total: number;
  matching_skills: string[];
  missing_skills: string[];
  required_years?: number;
  user_relevant_years?: number;
  required_degree?: string;
  user_highest_degree?: string;
}

/**
 * Normalize skill name for fuzzy matching
 * e.g., "React.js" -> "react", "Node.JS" -> "node"
 */
function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/[.\s-]/g, '')
    .replace(/js$/i, '')
    .trim();
}

/**
 * Extract required skills from job description
 * Uses keyword matching + common tech skills list
 */
export function extractSkillsFromJobDescription(
  jobDescription: string
): string[] {
  const lowerDesc = jobDescription.toLowerCase();
  const foundSkills = new Set<string>();

  // Check for each common skill
  for (const skill of COMMON_SKILLS) {
    const normalized = normalizeSkill(skill);
    // Escape special regex characters
    const escapedNormalized = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match whole words or with common suffixes (.js, JS, etc.)
    const regex = new RegExp(
      `\\b${escapedNormalized}(\\s|\\.|js|\\b|/|,|;)`,
      'i'
    );
    if (regex.test(lowerDesc)) {
      foundSkills.add(skill);
    }
  }

  return Array.from(foundSkills);
}

/**
 * Calculate skills match score (0-40 points)
 */
export function calculateSkillsScore(
  requiredSkills: string[],
  userSkills: string[]
): { score: number; matching: string[]; missing: string[] } {
  if (requiredSkills.length === 0) {
    return { score: 40, matching: [], missing: [] };
  }

  const normalizedUserSkills = userSkills.map(normalizeSkill);
  const matching: string[] = [];
  const missing: string[] = [];

  for (const reqSkill of requiredSkills) {
    const normalized = normalizeSkill(reqSkill);
    if (normalizedUserSkills.includes(normalized)) {
      matching.push(reqSkill);
    } else {
      missing.push(reqSkill);
    }
  }

  const matchPercentage = matching.length / requiredSkills.length;
  const score = Math.round(matchPercentage * 40);

  return { score, matching, missing };
}

/**
 * Extract required years of experience from job description
 */
function extractRequiredYears(jobDescription: string): number {
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i,
    /(\d+)-(\d+)\s*(?:years?|yrs?)/i,
    /minimum\s*(?:of)?\s*(\d+)\s*(?:years?|yrs?)/i,
  ];

  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    if (match && match[1]) {
      // If range (e.g., "3-5 years"), take the minimum
      return parseInt(match[1], 10);
    }
  }

  // Default to 0 if no experience mentioned
  return 0;
}

/**
 * Calculate total years of experience
 */
function calculateTotalExperience(experience: UserExperience[]): number {
  let totalMonths = 0;

  for (const exp of experience) {
    const startDate = new Date(exp.start_date);
    const endDate = exp.end_date ? new Date(exp.end_date) : new Date();

    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    totalMonths += Math.max(0, months);
  }

  return totalMonths / 12;
}

/**
 * Calculate relevant years of experience based on job description
 * Matches on similar job titles, skills used
 */
function calculateRelevantExperience(
  experience: UserExperience[],
  jobDescription: string
): number {
  const lowerDesc = jobDescription.toLowerCase();
  let relevantMonths = 0;

  for (const exp of experience) {
    const startDate = new Date(exp.start_date);
    const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    // Check if position or skills are relevant
    const positionRelevant = lowerDesc.includes(
      exp.position.toLowerCase()
    );
    const skillsRelevant = exp.skills_used.some((skill) =>
      lowerDesc.includes(skill.toLowerCase())
    );

    if (positionRelevant || skillsRelevant) {
      relevantMonths += Math.max(0, months);
    }
  }

  return relevantMonths / 12;
}

/**
 * Calculate experience match score (0-30 points)
 */
export function calculateExperienceScore(
  requiredYears: number,
  userTotalYears: number,
  userRelevantYears: number
): number {
  // No experience required
  if (requiredYears === 0) {
    return 30;
  }

  // Full points if relevant years >= required
  if (userRelevantYears >= requiredYears) {
    // Bonus for exceeding by 2+ years (max 30pts)
    const bonus = Math.min(5, Math.floor((userRelevantYears - requiredYears) / 2) * 2);
    return Math.min(30, 30 + bonus);
  }

  // Partial credit if total years >= required but relevant < required
  if (userTotalYears >= requiredYears) {
    return 20;
  }

  // Partial credit based on relevant experience
  const relevantPercentage = userRelevantYears / requiredYears;
  return Math.round(relevantPercentage * 25);
}

/**
 * Extract required degree from job description
 */
function extractRequiredDegree(jobDescription: string): string {
  const lowerDesc = jobDescription.toLowerCase();

  // Check in order of specificity
  if (
    lowerDesc.includes('phd') ||
    lowerDesc.includes('ph.d') ||
    lowerDesc.includes('doctorate')
  ) {
    return 'phd';
  }

  if (
    lowerDesc.includes('master') ||
    lowerDesc.includes('msc') ||
    lowerDesc.includes('mba')
  ) {
    return 'masters';
  }

  if (
    lowerDesc.includes('bachelor') ||
    lowerDesc.includes('bsc') ||
    lowerDesc.includes('ba ') ||
    lowerDesc.includes(' bs ')
  ) {
    return 'bachelors';
  }

  if (lowerDesc.includes('associate')) {
    return 'associates';
  }

  return 'none';
}

/**
 * Get highest degree level from user education
 */
function getHighestDegree(education: UserEducation[]): string {
  let highest = 0;
  let highestDegree = 'none';

  for (const edu of education) {
    const degreeLower = edu.degree.toLowerCase();
    for (const [key, value] of Object.entries(DEGREE_LEVELS)) {
      if (degreeLower.includes(key)) {
        if (value > highest) {
          highest = value;
          highestDegree = key;
        }
      }
    }
  }

  return highestDegree;
}

/**
 * Calculate education match score (0-15 points)
 */
export function calculateEducationScore(
  requiredDegree: string,
  userHighestDegree: string
): number {
  const requiredLevel = DEGREE_LEVELS[requiredDegree] || 0;
  const userLevel = DEGREE_LEVELS[userHighestDegree] || 0;

  // No requirement
  if (requiredLevel === 0) {
    return 15;
  }

  // Exact match or higher
  if (userLevel >= requiredLevel) {
    return 15;
  }

  // One level below
  if (userLevel === requiredLevel - 1) {
    return 10;
  }

  // Two levels below
  if (userLevel === requiredLevel - 2) {
    return 5;
  }

  return 0;
}

/**
 * Calculate other factors score (0-15 points)
 * Location, job type, salary alignment
 */
export function calculateOtherScore(
  jobDetails: JobDetails,
  userProfile: UserProfile
): number {
  let score = 0;

  // Location match (5 points)
  if (jobDetails.location) {
    const jobLocation = jobDetails.location.toLowerCase();
    const isRemote = jobLocation.includes('remote');

    if (isRemote) {
      score += 5; // Remote is always a match
    } else if (userProfile.preferred_locations.length > 0) {
      const locationMatch = userProfile.preferred_locations.some((loc) =>
        jobLocation.includes(loc.toLowerCase())
      );
      score += locationMatch ? 5 : 0;
    } else {
      score += 3; // No preference specified
    }
  } else {
    score += 3; // No location specified
  }

  // Job type match (5 points)
  if (jobDetails.job_type) {
    const jobType = jobDetails.job_type.toLowerCase();

    if (userProfile.preferred_job_types.length > 0) {
      const typeMatch = userProfile.preferred_job_types.some((type) =>
        type.toLowerCase() === jobType
      );
      score += typeMatch ? 5 : 0;
    } else {
      score += 3; // No preference specified
    }
  } else {
    score += 3; // No job type specified
  }

  // Salary alignment (5 points)
  if (
    jobDetails.salary_range &&
    jobDetails.salary_range.min &&
    userProfile.salary_expectation?.min
  ) {
    const jobMin = jobDetails.salary_range.min;
    const userMin = userProfile.salary_expectation.min;

    if (jobMin >= userMin) {
      score += 5; // Job meets or exceeds expectation
    } else if (jobMin >= userMin * 0.8) {
      score += 3; // Within 20% of expectation
    } else {
      score += 1; // Below expectation
    }
  } else {
    score += 3; // No salary info available
  }

  return score;
}

/**
 * Calculate base match score (0-100)
 * Formula-based, no AI cost
 */
export function calculateBaseScore(
  jobDetails: JobDetails,
  userProfile: UserProfile
): BaseScoreBreakdown {
  // 1. Skills (40 points)
  const requiredSkills = extractSkillsFromJobDescription(
    jobDetails.description
  );
  const {
    score: skills_score,
    matching: matching_skills,
    missing: missing_skills,
  } = calculateSkillsScore(requiredSkills, userProfile.skills);

  // 2. Experience (30 points)
  const required_years = extractRequiredYears(jobDetails.description);
  const user_total_years = calculateTotalExperience(userProfile.experience);
  const user_relevant_years = calculateRelevantExperience(
    userProfile.experience,
    jobDetails.description
  );
  const experience_score = calculateExperienceScore(
    required_years,
    user_total_years,
    user_relevant_years
  );

  // 3. Education (15 points)
  const required_degree = extractRequiredDegree(jobDetails.description);
  const user_highest_degree = getHighestDegree(userProfile.education);
  const education_score = calculateEducationScore(
    required_degree,
    user_highest_degree
  );

  // 4. Other factors (15 points)
  const other_score = calculateOtherScore(jobDetails, userProfile);

  const total = skills_score + experience_score + education_score + other_score;

  return {
    skills_score,
    experience_score,
    education_score,
    other_score,
    total,
    matching_skills,
    missing_skills,
    required_years,
    user_relevant_years,
    required_degree,
    user_highest_degree,
  };
}

// System prompt for Claude adjustment (cached for cost efficiency)
const MATCH_ADJUSTMENT_SYSTEM_PROMPT = `You are a career advisor reviewing a job match analysis.

Your task:
1. FIRST: Carefully extract ALL technical and non-technical skills from the job description
   - Don't rely on keyword matching - read and understand the full context
   - Include specific frameworks, tools, methodologies, soft skills, domain knowledge
   - Include synonyms and related skills (e.g., if job mentions "React", consider "React.js" and vice versa)

2. SECOND: Compare against the user's skills with intelligent matching
   - Match exact skills and close synonyms (e.g., "Node.js" matches "Node", "JavaScript" matches "JS")
   - Consider related skills (e.g., someone with "React" likely knows "HTML/CSS")
   - Identify transferable skills not directly mentioned

3. THIRD: Review the base match score and its breakdown
   - Identify contextual factors the formula couldn't capture
   - Adjust the score by -10 to +10 points (be conservative)
   - Consider career trajectory, industry transitions, overqualified/underqualified status

4. Provide detailed analysis with actionable insights

CRITICAL: Your skill extraction is authoritative. The matching_skills and missing_skills arrays you return
will replace the base scorer's results. Be thorough and accurate.

Return ONLY valid JSON matching this schema:
{
  "adjusted_score": number (0-100),
  "adjustment": number (-10 to +10),
  "reasoning": string,
  "matching_skills": string[] (ALL skills from user profile that match job requirements),
  "missing_skills": string[] (ALL skills required by job that user doesn't have),
  "strengths": string[] (specific advantages this candidate has),
  "concerns": string[] (specific gaps or red flags),
  "recommendations": string[] (actionable advice for this specific job)
}`;

/**
 * Adjust score with Claude contextual analysis (±10 points)
 * Uses prompt caching for cost efficiency
 */
export async function adjustScoreWithClaude(
  baseScore: BaseScoreBreakdown,
  jobDetails: JobDetails,
  userProfile: UserProfile,
  userId: string
): Promise<MatchAnalysis> {
  const anthropic = getAnthropicService();

  // Format experience for display
  const formatExperience = (exp: UserExperience[]) => {
    return exp
      .map(
        (e) =>
          `${e.position} at ${e.company} (${e.start_date} - ${e.end_date || 'Present'})`
      )
      .join('\n');
  };

  // Format education for display
  const formatEducation = (edu: UserEducation[]) => {
    return edu
      .map((e) => `${e.degree} in ${e.field_of_study || 'N/A'} from ${e.institution}`)
      .join('\n');
  };

  const userMessage = `BASE MATCH SCORE: ${baseScore.total}/100

BREAKDOWN (from formula-based calculation):
- Skills: ${baseScore.skills_score}/40 (${baseScore.matching_skills.length}/${baseScore.matching_skills.length + baseScore.missing_skills.length} detected matches)
- Experience: ${baseScore.experience_score}/30 (${Math.round(baseScore.user_relevant_years || 0)} years relevant, ${baseScore.required_years || 0} required)
- Education: ${baseScore.education_score}/15 (${baseScore.user_highest_degree || 'none'} vs ${baseScore.required_degree || 'none'} required)
- Other: ${baseScore.other_score}/15

NOTE: The base skill matching used keyword matching against a limited skill list. You should do a more thorough analysis.

USER PROFILE:
Skills: ${userProfile.skills.join(', ')}

Experience:
${formatExperience(userProfile.experience)}

Education:
${formatEducation(userProfile.education)}

JOB DESCRIPTION:
${jobDetails.description.slice(0, 3000)}

${jobDetails.description.length > 3000 ? '...(truncated)' : ''}

INSTRUCTIONS:
1. Extract ALL skills from the job description (technical, soft skills, domain knowledge, etc.)
2. Intelligently match them against the user's skills (including synonyms and related skills)
3. Be thorough - don't miss any skills mentioned in the job description
4. Provide accurate matching_skills and missing_skills arrays
5. Adjust the score and provide analysis`;

  try {
    const response = await anthropic.createMessage(
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        system: [
          {
            type: 'text',
            text: MATCH_ADJUSTMENT_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      },
      userId,
      'job_analysis'
    );

    const firstContent = response.content[0];
    if (!firstContent || firstContent.type !== 'text') {
      throw new APIError('Invalid Claude response format', 500);
    }

    // Log the raw response for debugging
    console.log('Claude API raw response:', firstContent.text);

    // Clean the response text (remove markdown code blocks if present)
    let cleanedText = firstContent.text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    // Remove leading + signs from numbers (JSON doesn't allow +8, only 8)
    cleanedText = cleanedText.replace(/:\s*\+(\d+)/g, ': $1');

    console.log('Cleaned response:', cleanedText);

    // Parse JSON response
    const analysisData = JSON.parse(cleanedText);

    // Validate adjustment is within bounds
    const adjustment = Math.max(-10, Math.min(10, analysisData.adjustment));
    const adjusted_score = Math.max(
      0,
      Math.min(100, baseScore.total + adjustment)
    );

    // Validate that Claude provided skill arrays (they should always be present)
    if (!analysisData.matching_skills || !analysisData.missing_skills) {
      console.warn('Claude did not return skill arrays, falling back to base scorer');
    }

    return {
      base_score: baseScore.total,
      adjusted_score,
      adjustment,
      reasoning: analysisData.reasoning,
      // ALWAYS use Claude's skill extraction (it's authoritative and intelligent)
      // Only fall back to base scorer if Claude completely failed to provide them
      matching_skills: analysisData.matching_skills && analysisData.matching_skills.length > 0
        ? analysisData.matching_skills
        : baseScore.matching_skills,
      missing_skills: analysisData.missing_skills && analysisData.missing_skills.length > 0
        ? analysisData.missing_skills
        : baseScore.missing_skills,
      strengths: analysisData.strengths || [],
      concerns: analysisData.concerns || [],
      recommendations: analysisData.recommendations || [],
      breakdown: {
        skills_score: baseScore.skills_score,
        experience_score: baseScore.experience_score,
        education_score: baseScore.education_score,
        other_score: baseScore.other_score,
      },
    };
  } catch (error) {
    // If Claude adjustment fails, return base score without adjustment
    console.error('Failed to adjust score with Claude:', error);

    return {
      base_score: baseScore.total,
      adjusted_score: baseScore.total,
      adjustment: 0,
      reasoning:
        'Base score calculated without AI adjustment due to processing error. Note: Skill matching may be incomplete as it relied on keyword matching only.',
      matching_skills: baseScore.matching_skills,
      missing_skills: baseScore.missing_skills,
      strengths: ['Calculated based on objective formula-based criteria'],
      concerns: ['AI analysis unavailable - skill matching may be incomplete'],
      recommendations: [
        'Try re-analyzing to get AI-powered skill matching',
        'Review the skill lists carefully as they may be incomplete',
        'Consider the base score breakdown for objective metrics'
      ],
      breakdown: {
        skills_score: baseScore.skills_score,
        experience_score: baseScore.experience_score,
        education_score: baseScore.education_score,
        other_score: baseScore.other_score,
      },
    };
  }
}

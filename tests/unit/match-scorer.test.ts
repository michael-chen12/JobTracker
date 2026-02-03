import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  extractSkillsFromJobDescription,
  calculateSkillsScore,
  calculateExperienceScore,
  calculateEducationScore,
  calculateOtherScore,
  calculateBaseScore,
} from '@/lib/ai/match-scorer';

describe('Match Scorer', () => {
  describe('extractSkillsFromJobDescription', () => {
    it('should extract common technical skills from job description', () => {
      const jobDescription = `
        We are looking for a Senior Frontend Developer with experience in React, TypeScript, and Node.js.
        You should be familiar with PostgreSQL, Docker, and AWS.
      `;

      const skills = extractSkillsFromJobDescription(jobDescription);

      expect(skills).toContain('react');
      expect(skills).toContain('typescript');
      expect(skills).toContain('node');
      expect(skills).toContain('postgresql');
      expect(skills).toContain('docker');
      expect(skills).toContain('aws');
    });

    it('should handle case-insensitive matching', () => {
      const jobDescription = 'REACT TYPESCRIPT NODEJS';
      const skills = extractSkillsFromJobDescription(jobDescription);

      expect(skills).toContain('react');
      expect(skills).toContain('typescript');
      expect(skills).toContain('node');
    });

    it('should match skills with different formats', () => {
      const jobDescription = 'React.js, Node.JS, PostgreSQL';
      const skills = extractSkillsFromJobDescription(jobDescription);

      expect(skills).toContain('react');
      expect(skills).toContain('node');
      expect(skills).toContain('postgresql');
    });

    it('should return empty array for description with no known skills', () => {
      const jobDescription = 'This is a generic description with no technical skills.';
      const skills = extractSkillsFromJobDescription(jobDescription);

      expect(skills).toEqual([]);
    });

    it('should not return duplicate skills', () => {
      const jobDescription = 'React, React.js, and more React experience';
      const skills = extractSkillsFromJobDescription(jobDescription);

      // Should only have one instance of react
      const reactCount = skills.filter(s => s === 'react').length;
      expect(reactCount).toBe(1);
    });
  });

  describe('calculateSkillsScore', () => {
    it('should return perfect score when all skills match', () => {
      const requiredSkills = ['react', 'typescript', 'node'];
      const userSkills = ['React.js', 'TypeScript', 'Node.js'];

      const { score, matching, missing } = calculateSkillsScore(requiredSkills, userSkills);

      expect(score).toBe(40);
      expect(matching).toHaveLength(3);
      expect(missing).toHaveLength(0);
    });

    it('should return partial score for partial match', () => {
      const requiredSkills = ['react', 'typescript', 'node', 'docker'];
      const userSkills = ['React', 'TypeScript'];

      const { score, matching, missing } = calculateSkillsScore(requiredSkills, userSkills);

      expect(score).toBe(20); // 2/4 = 50% * 40 = 20
      expect(matching).toHaveLength(2);
      expect(missing).toHaveLength(2);
      expect(missing).toContain('node');
      expect(missing).toContain('docker');
    });

    it('should return full score when no skills are required', () => {
      const requiredSkills: string[] = [];
      const userSkills = ['React', 'TypeScript'];

      const { score } = calculateSkillsScore(requiredSkills, userSkills);

      expect(score).toBe(40);
    });

    it('should normalize skill names for matching', () => {
      const requiredSkills = ['react', 'node'];
      const userSkills = ['React.js', 'Node.JS'];

      const { score, matching } = calculateSkillsScore(requiredSkills, userSkills);

      expect(score).toBe(40);
      expect(matching).toHaveLength(2);
    });
  });

  describe('calculateExperienceScore', () => {
    it('should return full score when relevant experience meets requirement', () => {
      const score = calculateExperienceScore(3, 5, 3);
      expect(score).toBe(30);
    });

    it('should return bonus for exceeding required experience', () => {
      const score = calculateExperienceScore(3, 7, 5);
      expect(score).toBeGreaterThanOrEqual(30);
    });

    it('should return partial score when total meets but relevant is less', () => {
      const score = calculateExperienceScore(3, 5, 2);
      expect(score).toBe(20);
    });

    it('should return proportional score for partial relevant experience', () => {
      const score = calculateExperienceScore(4, 2, 2);
      // 2/4 = 50% * 25 = 12.5, rounded to 13
      expect(score).toBeGreaterThanOrEqual(12);
      expect(score).toBeLessThanOrEqual(13);
    });

    it('should return full score when no experience required', () => {
      const score = calculateExperienceScore(0, 5, 3);
      expect(score).toBe(30);
    });
  });

  describe('calculateEducationScore', () => {
    it('should return full score for matching degree', () => {
      const score = calculateEducationScore('bachelors', 'bachelors');
      expect(score).toBe(15);
    });

    it('should return full score for higher degree than required', () => {
      const score = calculateEducationScore('bachelors', 'masters');
      expect(score).toBe(15);
    });

    it('should return partial score for one level below', () => {
      const score = calculateEducationScore('masters', 'bachelors');
      expect(score).toBe(10);
    });

    it('should return lower score for two levels below', () => {
      const score = calculateEducationScore('phd', 'bachelors');
      expect(score).toBe(5);
    });

    it('should return full score when no degree required', () => {
      const score = calculateEducationScore('none', 'bachelors');
      expect(score).toBe(15);
    });
  });

  describe('calculateOtherScore', () => {
    it('should give bonus for remote jobs', () => {
      const jobDetails = {
        description: 'Test job',
        location: 'Remote',
      };
      const userProfile = {
        skills: [],
        experience: [],
        education: [],
        preferred_locations: [],
        preferred_job_types: [],
      };

      const score = calculateOtherScore(jobDetails, userProfile);
      expect(score).toBeGreaterThanOrEqual(5);
    });

    it('should match location preferences', () => {
      const jobDetails = {
        description: 'Test job',
        location: 'San Francisco, CA',
      };
      const userProfile = {
        skills: [],
        experience: [],
        education: [],
        preferred_locations: ['San Francisco'],
        preferred_job_types: [],
      };

      const score = calculateOtherScore(jobDetails, userProfile);
      expect(score).toBeGreaterThanOrEqual(5);
    });

    it('should match job type preferences', () => {
      const jobDetails = {
        description: 'Test job',
        job_type: 'full-time',
      };
      const userProfile = {
        skills: [],
        experience: [],
        education: [],
        preferred_locations: [],
        preferred_job_types: ['full-time'],
      };

      const score = calculateOtherScore(jobDetails, userProfile);
      expect(score).toBeGreaterThanOrEqual(5);
    });
  });

  describe('calculateBaseScore', () => {
    it('should calculate total score from all components', () => {
      const jobDetails = {
        description: `
          We're looking for a Senior Developer with 5+ years of experience.
          Required: React, TypeScript, Node.js, PostgreSQL
          Bachelor's degree in Computer Science required.
          Full-time, Remote position.
          Salary: $120,000 - $150,000
        `,
        location: 'Remote',
        job_type: 'full-time',
        salary_range: {
          min: 120000,
          max: 150000,
          currency: 'USD',
        },
      };

      const userProfile = {
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Senior Developer',
            start_date: '2018-01-01',
            end_date: '2023-12-31',
            is_current: false,
            skills_used: ['React', 'TypeScript', 'Node.js'],
          },
        ],
        education: [
          {
            institution: 'University',
            degree: 'Bachelor of Science',
            field_of_study: 'Computer Science',
            end_date: '2017-05-15',
          },
        ],
        preferred_locations: ['Remote'],
        preferred_job_types: ['full-time'],
        salary_expectation: {
          min: 100000,
          currency: 'USD',
        },
      };

      const result = calculateBaseScore(jobDetails, userProfile);

      // Should have high score due to strong match
      expect(result.total).toBeGreaterThan(70);

      // Should identify matching skills
      expect(result.matching_skills.length).toBeGreaterThan(0);

      // Should calculate all components
      expect(result.skills_score).toBeGreaterThan(0);
      expect(result.experience_score).toBeGreaterThan(0);
      expect(result.education_score).toBeGreaterThan(0);
      expect(result.other_score).toBeGreaterThan(0);
    });

    it('should return lower score for poor match', () => {
      const jobDetails = {
        description: `
          Senior Machine Learning Engineer needed with 10+ years experience.
          Required: Python, TensorFlow, PyTorch, Deep Learning
          PhD in Computer Science required.
        `,
      };

      const userProfile = {
        skills: ['JavaScript', 'React', 'CSS'],
        experience: [
          {
            company: 'Startup',
            position: 'Junior Frontend Developer',
            start_date: '2022-01-01',
            end_date: null,
            is_current: true,
            skills_used: ['React', 'JavaScript'],
          },
        ],
        education: [],
        preferred_locations: [],
        preferred_job_types: [],
      };

      const result = calculateBaseScore(jobDetails, userProfile);

      // Should have low score due to poor match
      expect(result.total).toBeLessThan(40);
    });
  });
});

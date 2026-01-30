import {
  extractSkillsFromJobDescription,
  calculateSkillsScore,
  calculateExperienceScore,
  calculateEducationScore,
  calculateOtherScore,
  calculateBaseScore,
} from '../match-scorer';

describe('match-scorer', () => {
  test('extractSkillsFromJobDescription finds common skills', () => {
    const description = `
      We are looking for a Frontend Engineer.
      Required: React, TypeScript, Node.js, AWS.
    `;

    const skills = extractSkillsFromJobDescription(description);
    expect(skills).toEqual(
      expect.arrayContaining(['react', 'typescript', 'node', 'aws'])
    );
  });

  test('calculateSkillsScore returns expected score and matches', () => {
    const required = ['React', 'TypeScript', 'Node.js', 'Kubernetes', 'AWS'];
    const user = ['React', 'TypeScript', 'Node.js', 'Python'];

    const result = calculateSkillsScore(required, user);
    expect(result.score).toBe(24);
    expect(result.matching).toEqual(
      expect.arrayContaining(['React', 'TypeScript', 'Node.js'])
    );
    expect(result.missing).toEqual(
      expect.arrayContaining(['Kubernetes', 'AWS'])
    );
  });

  test('calculateExperienceScore handles common scenarios', () => {
    expect(calculateExperienceScore(0, 1, 1)).toBe(30);
    expect(calculateExperienceScore(5, 7, 5)).toBe(30);
    expect(calculateExperienceScore(5, 7, 3)).toBe(20);
    expect(calculateExperienceScore(5, 2, 2)).toBe(10);
  });

  test('calculateEducationScore handles degree comparisons', () => {
    expect(calculateEducationScore('masters', "bachelor's")).toBe(10);
    expect(calculateEducationScore('bachelors', "master's")).toBe(15);
    expect(calculateEducationScore('none', 'none')).toBe(15);
  });

  test('calculateOtherScore scores location, job type, and salary', () => {
    const jobDetails: Parameters<typeof calculateOtherScore>[0] = {
      description: 'Remote frontend role',
      location: 'Remote',
      job_type: 'remote',
      salary_range: { min: 120000 },
    };

    const userProfile: Parameters<typeof calculateOtherScore>[1] = {
      skills: [],
      experience: [],
      education: [],
      preferred_locations: ['Remote'],
      preferred_job_types: ['remote'],
      salary_expectation: { min: 100000 },
    };

    expect(calculateOtherScore(jobDetails, userProfile)).toBe(15);
  });

  test('calculateBaseScore returns consistent totals', () => {
    const jobDetails: Parameters<typeof calculateBaseScore>[0] = {
      description:
        "Senior Frontend Developer with 5+ years experience. Required skills: React, TypeScript, Node.js. Education: Bachelor's degree.",
      location: 'Remote',
      job_type: 'remote',
      salary_range: { min: 120000 },
    };

    const userProfile: Parameters<typeof calculateBaseScore>[1] = {
      skills: ['React', 'TypeScript', 'Node.js'],
      experience: [
        {
          company: 'Acme',
          position: 'Frontend Developer',
          start_date: '2018-01-01',
          end_date: '2023-01-01',
          is_current: false,
          skills_used: ['React', 'TypeScript'],
        },
      ],
      education: [
        {
          institution: 'State University',
          degree: "Bachelor's in Computer Science",
          field_of_study: 'Computer Science',
          end_date: '2017-05-01',
        },
      ],
      preferred_locations: ['Remote'],
      preferred_job_types: ['remote'],
      salary_expectation: { min: 100000 },
    };

    const result = calculateBaseScore(jobDetails, userProfile);
    expect(result.total).toBe(
      result.skills_score +
        result.experience_score +
        result.education_score +
        result.other_score
    );
    expect(result.total).toBe(100);
  });
});

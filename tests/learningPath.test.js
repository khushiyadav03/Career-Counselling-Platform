import { describe, expect, it } from 'vitest';

const {
  buildPersonalizedPath,
  validateLearningPathShape,
  extractJsonObject,
} = require('../lib/learningPath');

describe('learning path helpers', () => {
  it('builds a personalized path with gap steps and realistic estimates', () => {
    const roadmaps = {
      tracks: {
        fullstack: {
          title: 'Full-stack web developer',
          requiredSkills: ['html', 'javascript'],
          phases: [
            {
              id: 'foundation',
              name: 'Web fundamentals',
              steps: [
                { id: 'html', title: 'HTML', description: 'Structure', resourceUrl: 'https://example.com/html', estHours: 4, skillsAddressed: ['html'], level: 'foundation' },
              ],
            },
          ],
        },
      },
      gapResources: {
        html: {
          title: 'Fill gap: HTML structure',
          description: 'Practice semantic tags.',
          resourceLabel: 'MDN HTML',
          resourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
        },
      },
    };

    const result = buildPersonalizedPath(roadmaps, {
      targetTrack: 'fullstack',
      skills: ['css'],
      proficiency: { html: 'beginner' },
      careerGoal: 'Become a full-stack engineer',
      weeklyHours: 10,
      experienceLevel: 'entry',
    });

    expect(result.track).toBe('fullstack');
    expect(result.sources).toContain('rules');
    expect(result.totalHours).toBeGreaterThan(0);
    expect(result.weeklyEstimate).toBeGreaterThan(0);
    expect(result.phases.some((phase) => phase.id === 'gaps')).toBe(true);
    expect(result.phases.some((phase) => phase.id === 'personalized')).toBe(true);
  });

  it('accepts a valid learning path and extracts JSON from fenced code blocks', () => {
    const validPath = {
      title: 'Demo path',
      summary: 'A good path',
      phases: [
        {
          name: 'Phase 1',
          steps: [
            { title: 'Step A', description: 'Do it', resourceUrl: 'https://example.com' },
          ],
        },
      ],
    };

    expect(validateLearningPathShape(validPath)).toBe(true);
    expect(extractJsonObject('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });
});

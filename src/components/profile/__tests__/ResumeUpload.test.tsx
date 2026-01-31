import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResumeUpload } from '../ResumeUpload';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ResumeUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload button when no resume', () => {
    render(<ResumeUpload currentResumeUrl={null} />);
    expect(screen.getByText(/upload resume/i)).toBeInTheDocument();
  });

  it('should show resume info when resume exists', () => {
    render(<ResumeUpload currentResumeUrl="https://example.com/resume.pdf" />);
    expect(screen.getByText(/current resume/i)).toBeInTheDocument();
  });
});

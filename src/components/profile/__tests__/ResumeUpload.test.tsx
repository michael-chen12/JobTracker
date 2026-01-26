import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResumeUpload } from '../ResumeUpload';

describe('ResumeUpload', () => {
  it('should render upload button when no resume', () => {
    render(<ResumeUpload currentResumeUrl={null} />);
    expect(screen.getByText(/upload resume/i)).toBeInTheDocument();
  });

  it('should show resume info when resume exists', () => {
    render(<ResumeUpload currentResumeUrl="https://example.com/resume.pdf" />);
    expect(screen.getByText(/current resume/i)).toBeInTheDocument();
  });
});

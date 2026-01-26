'use client';

import type { ParsedResume } from '@/types/ai';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Linkedin, Briefcase, GraduationCap, FileText } from 'lucide-react';

interface ParsedResumeDisplayProps {
  parsedData: ParsedResume | null;
}

export function ParsedResumeDisplay({ parsedData }: ParsedResumeDisplayProps) {
  if (!parsedData) {
    return (
      <div className="p-6 border border-dashed rounded-lg text-center text-gray-500">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-sm">No parsed resume data available</p>
        <p className="text-xs mt-1">Upload a resume to see AI-extracted information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      {parsedData.contact && (
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {parsedData.contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${parsedData.contact.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {parsedData.contact.email}
                </a>
              </div>
            )}
            {parsedData.contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${parsedData.contact.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {parsedData.contact.phone}
                </a>
              </div>
            )}
            {parsedData.contact.linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-gray-400" />
                <a
                  href={parsedData.contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  LinkedIn
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Summary */}
      {parsedData.summary && (
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Professional Summary</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{parsedData.summary}</p>
        </div>
      )}

      {/* Skills */}
      {parsedData.skills && parsedData.skills.length > 0 && (
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {parsedData.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {parsedData.experience && parsedData.experience.length > 0 && (
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Work Experience
          </h3>
          <div className="space-y-4">
            {parsedData.experience.map((exp, index) => (
              <div key={index} className="pb-4 border-b last:border-b-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-medium text-base">{exp.title}</h4>
                    <p className="text-sm text-gray-600">{exp.company}</p>
                  </div>
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {exp.startDate} - {exp.endDate || 'Present'}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {parsedData.education && parsedData.education.length > 0 && (
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Education
          </h3>
          <div className="space-y-4">
            {parsedData.education.map((edu, index) => (
              <div key={index} className="pb-4 border-b last:border-b-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-base">{edu.degree}</h4>
                    {edu.field && (
                      <p className="text-sm text-gray-600">{edu.field}</p>
                    )}
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                  </div>
                  {edu.graduationDate && (
                    <div className="text-sm text-gray-500 whitespace-nowrap">
                      {edu.graduationDate}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

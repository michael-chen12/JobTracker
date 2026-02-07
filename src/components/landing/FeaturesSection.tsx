import {
  ClipboardList,
  Brain,
  FileText,
  Users,
  Shield,
  KeyRound,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { FadeIn } from './FadeIn';

const features = [
  {
    icon: ClipboardList,
    title: 'Track Applications',
    description:
      'Organize every application with status tracking, deadlines, priority levels, and salary ranges. See your entire pipeline at a glance.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description:
      'Let Claude AI parse your resumes, score job matches, summarize notes, and suggest personalized follow-up actions.',
  },
  {
    icon: FileText,
    title: 'Manage Documents',
    description:
      'Store resumes, cover letters, and correspondence alongside each application. Everything you need, right where you need it.',
  },
  {
    icon: Users,
    title: 'Contact Network',
    description:
      'Keep track of recruiters, hiring managers, and referrals. Never forget who you spoke with or what was discussed.',
  },
  {
    icon: Shield,
    title: 'Data Privacy',
    description:
      'GDPR-compliant data export and account deletion. Your job search data stays private and under your control.',
  },
  {
    icon: KeyRound,
    title: 'Easy Authentication',
    description:
      'Sign in securely with Google, GitHub, LinkedIn, or classic email and password. Get started in seconds.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24 bg-muted/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything You Need to Manage Your Job Search
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4">
              From your first application to your final offer, we&apos;ve got you
              covered with tools that actually help.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <FadeIn key={feature.title} delay={index * 100}>
              <Card className="border-0 shadow-none bg-background transition-shadow hover:shadow-md h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

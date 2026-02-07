import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  FileText,
  Brain,
  Users,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Briefcase,
    title: 'Track Applications',
    description:
      'Organize all your job applications in one place with status tracking and deadlines.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description:
      'Get resume parsing, job match scoring, and smart follow-up suggestions.',
  },
  {
    icon: FileText,
    title: 'Manage Documents',
    description:
      'Store resumes, cover letters, and correspondence alongside each application.',
  },
  {
    icon: Users,
    title: 'Contact Network',
    description:
      'Keep track of recruiters, hiring managers, and referrals across your job search.',
  },
];

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    'there';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome, {displayName}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your account is ready. Here&apos;s what you can do with your job
            application tracker.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard/profile">Upload Resume</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

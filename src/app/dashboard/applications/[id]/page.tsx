import { notFound } from 'next/navigation';
import { getApplication } from '@/actions/applications';
import { ApplicationDetail } from '@/components/applications/ApplicationDetail';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ApplicationPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getApplication(id);

  if (result.error || !result.data) {
    notFound();
  }

  return <ApplicationDetail application={result.data} />;
}

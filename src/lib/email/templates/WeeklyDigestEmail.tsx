import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface WeeklyDigestEmailProps {
  title: string;
  message: string;
  actionUrl: string;
  unsubscribeUrl: string;
}

export function WeeklyDigestEmail({
  title,
  message,
  actionUrl,
  unsubscribeUrl,
}: WeeklyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your weekly job search summary</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{title}</Heading>
          <Text style={paragraph}>{message}</Text>
          <Section style={buttonContainer}>
            <Button style={button} href={actionUrl}>
              View Analytics Dashboard
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            You receive this weekly digest because you opted in.{' '}
            <Link href={unsubscribeUrl} style={footerLink}>
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '560px',
  borderRadius: '8px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#1a1a1a',
  padding: '0 40px',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#4a4a4a',
  padding: '0 40px',
};

const buttonContainer = {
  padding: '16px 40px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  fontWeight: '600',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 40px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '1.5',
  padding: '0 40px',
};

const footerLink = {
  color: '#2563eb',
  textDecoration: 'underline',
};

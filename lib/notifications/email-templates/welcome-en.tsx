import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { SITE_URL } from "@/lib/site";

interface WelcomeEmailProps {
  name: string;
  ctaUrl: string;
}

const COLORS = {
  background: "#F8F7F4",
  surface: "#FFFFFF",
  primary: "#E8703F",
  text: "#1F1B17",
  textMuted: "#6B6258",
  border: "#E5DED4",
};

export function WelcomeEmailEn({ name, ctaUrl }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Promptly — start today, even just 5 minutes.</Preview>
      <Body
        style={{
          backgroundColor: COLORS.background,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: "32px 16px",
          color: COLORS.text,
        }}
      >
        <Container
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            margin: "0 auto",
            maxWidth: 560,
            padding: "32px",
          }}
        >
          <Img
            src={`${SITE_URL}/brand/logo-horizontal.png`}
            width={180}
            height={50}
            alt="Promptly"
            style={{
              display: "block",
              margin: "0 auto 32px",
            }}
          />

          <Section>
            <Text style={{ fontSize: 16, lineHeight: "24px", margin: 0 }}>
              Hi {name},
            </Text>
            <Text style={{ fontSize: 16, lineHeight: "24px", marginTop: 16 }}>
              Glad to have you here.
            </Text>
            <Text style={{ fontSize: 16, lineHeight: "24px", marginTop: 16 }}>
              Promptly teaches you to build with words — no code to write, just
              prompts to think well. The first 14 lessons are free and enough
              to start seeing real results.
            </Text>
            <Text style={{ fontSize: 16, lineHeight: "24px", marginTop: 16 }}>
              My tip: start today, even just 5 minutes. The streak begins on
              day one.
            </Text>
          </Section>

          <Section style={{ marginTop: 28, textAlign: "center" }}>
            <Button
              href={ctaUrl}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 8,
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 600,
                padding: "14px 24px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Go to your first lesson →
            </Button>
          </Section>

          <Section style={{ marginTop: 28 }}>
            <Text style={{ fontSize: 15, lineHeight: "22px", margin: 0 }}>
              If you have any questions, just reply to this email.
            </Text>
            <Text style={{ fontSize: 15, lineHeight: "22px", marginTop: 16 }}>
              See you soon,
              <br />
              The Promptly team
            </Text>
          </Section>

          <Hr style={{ borderColor: COLORS.border, margin: "32px 0 16px" }} />

          <Text
            style={{
              color: COLORS.textMuted,
              fontSize: 12,
              lineHeight: "18px",
              margin: 0,
            }}
          >
            You&apos;re receiving this email because you signed up for Promptly.
            <br />
            <Link
              href={ctaUrl}
              style={{ color: COLORS.textMuted, textDecoration: "underline" }}
            >
              Open the dashboard
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmailEn;

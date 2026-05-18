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

export function WelcomeEmailIt({ name, ctaUrl }: WelcomeEmailProps) {
  return (
    <Html lang="it">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>Benvenuto in Promptly — inizia oggi, anche solo 5 minuti.</Preview>
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
          <Section style={{ textAlign: "center", marginBottom: 32 }}>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              border={0}
              align="center"
              bgcolor="#ffffff"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 8,
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: "16px 24px" }}>
                    <Img
                      src={`${SITE_URL}/brand/logo-horizontal.png`}
                      width={180}
                      height={50}
                      alt="Promptly"
                      style={{ display: "block" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section>
            <Text style={{ fontSize: 16, lineHeight: "24px", margin: 0 }}>
              Ciao {name},
            </Text>
            <Text style={{ fontSize: 16, lineHeight: "24px", marginTop: 16 }}>
              Sono contento di averti qui.
            </Text>
            <Text style={{ fontSize: 16, lineHeight: "24px", marginTop: 16 }}>
              Promptly ti insegna a costruire con le parole — niente codice da
              scrivere, solo prompt da pensare bene. Le prime 14 lezioni sono
              gratis e bastano per iniziare a vedere risultati veri.
            </Text>
            <Text style={{ fontSize: 16, lineHeight: "24px", marginTop: 16 }}>
              Il consiglio: comincia oggi, anche solo 5 minuti. La streak parte
              dal primo giorno.
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
              Vai alla prima lezione →
            </Button>
          </Section>

          <Section style={{ marginTop: 28 }}>
            <Text style={{ fontSize: 15, lineHeight: "22px", margin: 0 }}>
              Se hai domande, basta rispondere a questa email.
            </Text>
            <Text style={{ fontSize: 15, lineHeight: "22px", marginTop: 16 }}>
              A presto,
              <br />
              Il team Promptly
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
            Stai ricevendo questa email perché ti sei iscritto a Promptly.
            <br />
            <Link
              href={ctaUrl}
              style={{ color: COLORS.textMuted, textDecoration: "underline" }}
            >
              Apri la dashboard
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmailIt;

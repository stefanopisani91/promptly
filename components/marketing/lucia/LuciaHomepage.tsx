"use client";

// Lucia's broken homepage (Vignette 1) — a stylized "landing in costruzione"
// with 3 deliberate bugs:
//   1. Profile photo doesn't load (gray dashed placeholder + tiny "404" badge)
//   2. Project section title overflows its bordered container box
//   3. "DOWNLOAD" capsule button is white-on-white (visible only by its
//      faint grey border)
//
// Each bug accepts a `fixed` prop that triggers a cinematic transition.
// Round 4: vignette aesthetic — Fredoka logo + button, cream background,
// subtle cartoon styling, no Promptly brand orange anywhere on the site
// (the site is meant to read as Lucia's app, not as Promptly).

import type { CSSProperties } from "react";
import type { FixedBugs, LuciaDemoCopy } from "@/lib/landing-demo/types";
import { LuciaIllustration } from "./LuciaIllustration";

interface Props {
  copy: LuciaDemoCopy["homepage"];
  fixed: FixedBugs;
}

const HOMEPAGE_BG = "#F8F5F0";
const TEXT_DARK = "#1A1A1A";
const TEXT_MUTED = "#6B7280";
const BORDER_LIGHT = "#E5E5E5";
const BORDER_LIGHTER = "#EFEAE0";
// Lucia's app brand — a neutral charcoal, deliberately NOT Promptly's orange.
const APP_BRAND = "#1A1A1A";
// Capsule button "fixed" colour — a soft food-themed teal/green so the
// reveal feels like Lucia's brand showing up, not Promptly's.
const APP_FIX_ACCENT = "#5C8C5E";

export function LuciaHomepage({ copy, fixed }: Props) {
  return (
    <div
      style={{
        background: HOMEPAGE_BG,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
        color: TEXT_DARK,
        // Container is intentionally clipped — the title overflow visibly
        // pushes content beyond its box, but the broader card masks the
        // chaos so it stays "in scene".
        overflow: "hidden",
        position: "relative",
      }}
    >
      <KitchenHeader ariaLabel={copy.ariaHeaderIllustration} />

      <MealgeniusNav nav={copy.nav} appName={copy.appName} />

      <Hero
        headline={copy.luciaHeadline}
        subheadline={copy.luciaSubheadline}
        photoLabel={copy.photoLabel}
        errorBadge={copy.errorBadge}
        photoFixed={fixed.foto}
        ariaIllustration={copy.ariaIllustration}
      />

      <ProjectAndCtaRow
        title={copy.projectTitle}
        overflowFixed={fixed.overflow}
        ctaText={copy.ctaButton}
        ctaFixed={fixed.bottone}
      />

      <Footer text={copy.footer} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KitchenHeader({ ariaLabel }: { ariaLabel: string }) {
  // Compatto ~20% rispetto alla versione precedente per match-are
  // l'altezza target dei due card (LuciaHomepage e prompt panel di destra).
  return (
    // SVG vector — already optimised, no need for next/image's raster pipeline.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/undraw_breakfast_rgx5.svg"
      alt={ariaLabel}
      className="lucia-header-illustration"
      style={{
        display: "block",
        maxHeight: 68,
        width: "auto",
        margin: "10px auto",
        filter: "saturate(0.85)",
      }}
    />
  );
}

function MealgeniusNav({
  nav,
  appName,
}: {
  nav: LuciaDemoCopy["homepage"]["nav"];
  appName: string;
}) {
  const linkStyle: CSSProperties = {
    fontSize: "0.62rem",
    color: TEXT_MUTED,
    textDecoration: "none",
    cursor: "default",
  };
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.5rem 1rem 0.7rem",
        borderBottom: `1px solid ${BORDER_LIGHTER}`,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-fredoka), system-ui, sans-serif",
          fontSize: "0.95rem",
          fontWeight: 700,
          letterSpacing: "1.5px",
          color: APP_BRAND,
          lineHeight: 1,
        }}
      >
        {appName}
      </span>
      <nav aria-hidden style={{ display: "flex", gap: "0.85rem" }}>
        <span style={linkStyle}>{nav.howItWorks}</span>
        <span style={linkStyle}>{nav.pricing}</span>
        <span style={linkStyle}>{nav.getStarted}</span>
      </nav>
    </header>
  );
}

function Hero({
  headline,
  subheadline,
  photoLabel,
  errorBadge,
  photoFixed,
  ariaIllustration,
}: {
  headline: string;
  subheadline: string;
  photoLabel: string;
  errorBadge: string;
  photoFixed: boolean;
  ariaIllustration: string;
}) {
  return (
    <section
      style={{
        display: "grid",
        // Photo column ridotta a 88 per accorciare la card del ~20%.
        gridTemplateColumns: "minmax(0, 88px) minmax(0, 1fr)",
        gap: "0.75rem",
        padding: "0.45rem 1rem 0.35rem",
        alignItems: "center",
      }}
    >
      <PhotoSlot
        photoLabel={photoLabel}
        errorBadge={errorBadge}
        fixed={photoFixed}
        ariaIllustration={ariaIllustration}
      />

      <div style={{ minWidth: 0 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            // Headline size unchanged per Round 6 spec.
            fontSize: "0.95rem",
            fontWeight: 700,
            color: TEXT_DARK,
            lineHeight: 1.15,
          }}
        >
          {headline}
        </h3>
        <p
          style={{
            margin: "0.3rem 0 0",
            // Round 6 spec: subheadline 13px.
            fontSize: 13,
            lineHeight: 1.4,
            color: TEXT_MUTED,
          }}
        >
          {subheadline}
        </p>
      </div>
    </section>
  );
}

function PhotoSlot({
  photoLabel,
  errorBadge,
  fixed,
  ariaIllustration,
}: {
  photoLabel: string;
  errorBadge: string;
  fixed: boolean;
  ariaIllustration: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        // 88x88 — ridotto da 110 per accorciare la card del ~20%.
        width: 88,
        height: 88,
        borderRadius: 8,
        overflow: "hidden",
        background: fixed ? "transparent" : "#E5E5E5",
        border: fixed ? "none" : "2px dashed #BDBDBD",
        transition: "background 0.5s ease, border-color 0.5s ease",
      }}
    >
      {/* Broken-state placeholder: gray box with "broken image" icon + label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.3rem",
          opacity: fixed ? 0 : 1,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
        }}
        aria-hidden={fixed}
      >
        <BrokenImageIcon />
        <span
          style={{
            fontSize: "0.55rem",
            color: "#6B7280",
            letterSpacing: "0.02em",
          }}
        >
          {photoLabel}
        </span>
      </div>

      {/* Fixed-state Lucia illustration */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: fixed ? 1 : 0,
          transform: fixed ? "scale(1)" : "scale(0.92)",
          transition:
            "opacity 0.6s ease 0.05s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s",
        }}
      >
        <LuciaIllustration ariaLabel={ariaIllustration} />
      </div>

      {/* "404" notification-dot badge — top-right, pops out when fixed */}
      <span
        aria-hidden={fixed}
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          padding: "2px 6px",
          borderRadius: 4,
          background: "#FF3B30",
          color: "#FFFFFF",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.02em",
          fontFamily:
            "var(--font-jetbrains), ui-monospace, monospace",
          lineHeight: 1,
          opacity: fixed ? 0 : 1,
          transform: fixed ? "scale(0.4)" : "scale(1)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        {errorBadge}
      </span>
    </div>
  );
}

function BrokenImageIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9CA3AF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3h18v18H3z" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
      <circle cx="9" cy="9" r="1.4" fill="#9CA3AF" stroke="none" />
      {/* Crack across the icon */}
      <path
        d="M2 6 L8 12 L4 16 L11 22"
        stroke="#DC2626"
        strokeWidth="1.6"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

function ProjectAndCtaRow({
  title,
  overflowFixed,
  ctaText,
  ctaFixed,
}: {
  title: string;
  overflowFixed: boolean;
  ctaText: string;
  ctaFixed: boolean;
}) {
  return (
    // Stacked vertical layout — title box (full width) on top,
    // DOWNLOAD button below, right-aligned. The two no longer overlap.
    // Paddings ridotti rispetto a Round 6 per accorciare la card del ~20%.
    <section
      style={{
        margin: "0.2rem 1rem 0.6rem",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "12px 16px",
          background: "#FFFFFF",
          border: `1px solid ${BORDER_LIGHT}`,
          borderRadius: 8,
          position: "relative",
          // Bug rendering: keep overflow visible so the longer wrapped line
          // can spill past the right edge.
          overflow: "visible",
        }}
      >
        <h4
          style={{
            margin: 0,
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.92rem",
            fontWeight: 700,
            color: TEXT_DARK,
            lineHeight: 1.3,
            whiteSpace: "normal",
            overflow: "visible",
            // Bug: when not fixed, the title is forced to lay out using a
            // wider effective width than the container. The browser wraps
            // the text within that wider width, so the longer second line
            // ends up spilling past the box's right edge while the first
            // (shorter) line still sits inside. When fixed, width snaps
            // back to 100% and the title wraps cleanly inside.
            width: overflowFixed ? "100%" : "calc(100% + 110px)",
            transition:
              "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {title}
        </h4>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "flex-end",
          paddingRight: 4,
        }}
      >
        <span
          // Decorative — not a real interactive button. No tabbing, no
          // cursor pointer, no hover. Spec: must feel like part of the
          // static cartoon, not a CTA on the Promptly landing.
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 32px",
            borderRadius: 999,
            fontFamily: "var(--font-fredoka), system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "1.5px",
            color: "#FFFFFF",
            background: ctaFixed ? APP_FIX_ACCENT : "#FFFFFF",
            border: `1px solid ${
              ctaFixed ? APP_FIX_ACCENT : "#D0D0D0"
            }`,
            boxShadow: ctaFixed
              ? "0 0 0 4px rgba(92, 140, 94, 0.18), 0 4px 12px rgba(92, 140, 94, 0.25)"
              : "none",
            transition:
              "background 0.55s ease, color 0.55s ease, border-color 0.55s ease, box-shadow 0.55s ease",
            cursor: "default",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          {ctaText}
        </span>
      </div>
    </section>
  );
}

function Footer({ text }: { text: string }) {
  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "0.4rem 1rem 0.5rem",
        borderTop: `1px solid ${BORDER_LIGHTER}`,
        // Round 6 spec: footer 10px.
        fontSize: 10,
        color: TEXT_MUTED,
        textAlign: "center",
        letterSpacing: "0.02em",
      }}
    >
      {text}
    </footer>
  );
}

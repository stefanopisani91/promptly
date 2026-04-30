'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * InfinityBugAnimation
 *
 * - Infinity symbol: ruota continuamente (CSS, pivot leggermente eccentrico)
 * - Glow arc: viaggia lungo il contorno, scroll-driven (un giro completo = scroll totale pagina)
 * - Bug: corpo fermo, zampe che camminano (CSS keyframes), antenne che scattano
 * - Usato come sfondo traslucido dietro l'h2 della ProblemSection
 */

const OUTER_PATH =
  'M 90,250 C 90,188 216,188 250,250 C 284,312 410,312 410,250 C 410,188 284,188 250,250 C 216,312 90,312 90,250 Z'

const FULL_PATH =
  OUTER_PATH +
  ' M 120,250 A 50,32 0 1,0 220,250 A 50,32 0 1,0 120,250 Z' +
  ' M 280,250 A 50,32 0 1,0 380,250 A 50,32 0 1,0 280,250 Z'

export function InfinityBugAnimation() {
  const measureRef = useRef<SVGPathElement>(null)
  const glowRefs = useRef<(SVGPathElement | null)[]>([null, null, null])
  const [perimeter, setPerimeter] = useState(1060)

  // Misura il perimetro reale del path al mount
  useEffect(() => {
    if (measureRef.current) {
      const len = measureRef.current.getTotalLength()
      if (len > 0) setPerimeter(len)
    }
  }, [])

  // Glow scroll-driven: un giro completo = scroll totale pagina
  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY
      const total =
        document.documentElement.scrollHeight - window.innerHeight
      const progress = total > 0 ? Math.min(scrolled / total, 1) : 0
      const offset = progress * perimeter

      glowRefs.current.forEach((ref) => {
        if (ref) ref.style.strokeDashoffset = String(offset)
      })
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [perimeter])

  const dashArray = `80 ${Math.max(perimeter - 80, 1)}`

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px]"
    >
      <svg
        viewBox="0 0 500 500"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full opacity-[0.18]"
      >
        <defs>
          {/* Filtri glow neon */}
          <filter id="ibg-halo" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="16" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="ibg-mid" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── INFINITO ROTANTE ── */}
        {/* pivot leggermente eccentrico per effetto "punto che gira" */}
        <g
          style={{
            transformOrigin: '254px 252px',
            animation: 'ibg-spin 13s linear infinite',
          }}
        >
          {/* Path di misura (invisibile) */}
          <path ref={measureRef} d={OUTER_PATH} fill="none" stroke="none" />

          {/* Forma piena con fori (evenodd) */}
          <path fillRule="evenodd" fill="#B02EC9" d={FULL_PATH} />

          {/* Glow layer 1 — alone larga */}
          <path
            ref={(el) => { glowRefs.current[0] = el }}
            d={OUTER_PATH}
            fill="none"
            stroke="#C030C8"
            strokeWidth="28"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={0}
            filter="url(#ibg-halo)"
            opacity="0.55"
          />
          {/* Glow layer 2 — bordo medio */}
          <path
            ref={(el) => { glowRefs.current[1] = el }}
            d={OUTER_PATH}
            fill="none"
            stroke="#DA50E0"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={0}
            filter="url(#ibg-mid)"
            opacity="0.8"
          />
          {/* Glow layer 3 — nucleo luminoso */}
          <path
            ref={(el) => { glowRefs.current[2] = el }}
            d={OUTER_PATH}
            fill="none"
            stroke="#F0B8FF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={0}
            opacity="1"
          />
        </g>

        {/* ── BUG MECCANICO — corpo fisso ── */}
        <g stroke="#0D0D0D" strokeLinejoin="round" strokeLinecap="round">

          {/* Mandibole */}
          <polyline points="238,216 214,198 208,214" fill="none" strokeWidth="5" />
          <polyline points="262,216 286,198 292,214" fill="none" strokeWidth="5" />

          {/* Testa a scudo */}
          <path
            d="M 233,231 L 240,210 L 260,210 L 267,231 L 250,238 Z"
            fill="#0D0D0D"
            stroke="none"
          />

          {/* Occhi a parallelogramma */}
          <polygon points="237,224 246,218 248,225 239,231" fill="#FFF" stroke="none" />
          <polygon points="263,224 254,218 252,225 261,231" fill="#FFF" stroke="none" />

          {/* Elytra angolari */}
          <path d="M 234,238 L 249,238 L 249,282 L 224,275 L 224,246 Z" fill="#0D0D0D" stroke="none" />
          <path d="M 266,238 L 251,238 L 251,282 L 276,275 L 276,246 Z" fill="#0D0D0D" stroke="none" />
          <line x1="250" y1="238" x2="250" y2="282" strokeWidth="4" />
          <line x1="226" y1="258" x2="274" y2="258" stroke="#333" strokeWidth="2.5" />

          {/* ── Zampe animate (alternanza A/B = effetto cammino) ── */}
          <polyline points="226,248 204,240 198,250" fill="none" strokeWidth="5"
            style={{ transformOrigin: '226px 248px', animation: 'ibg-leg-a 0.65s ease-in-out infinite' }} />
          <polyline points="225,260 200,260 194,270" fill="none" strokeWidth="5"
            style={{ transformOrigin: '225px 260px', animation: 'ibg-leg-b 0.65s ease-in-out infinite' }} />
          <polyline points="226,272 206,282 202,294" fill="none" strokeWidth="5"
            style={{ transformOrigin: '226px 272px', animation: 'ibg-leg-a 0.65s ease-in-out infinite' }} />

          <polyline points="274,248 296,240 302,250" fill="none" strokeWidth="5"
            style={{ transformOrigin: '274px 248px', animation: 'ibg-leg-b 0.65s ease-in-out infinite' }} />
          <polyline points="275,260 300,260 306,270" fill="none" strokeWidth="5"
            style={{ transformOrigin: '275px 260px', animation: 'ibg-leg-a 0.65s ease-in-out infinite' }} />
          <polyline points="274,272 294,282 298,294" fill="none" strokeWidth="5"
            style={{ transformOrigin: '274px 272px', animation: 'ibg-leg-b 0.65s ease-in-out infinite' }} />

          {/* ── Antenne animate (gruppo line + punta freccia) ── */}
          <g style={{ transformOrigin: '242px 210px', animation: 'ibg-antenna 4s ease-in-out infinite' }}>
            <line x1="242" y1="210" x2="222" y2="190" strokeWidth="4" />
            <polygon points="222,190 214,182 228,182" fill="#0D0D0D" stroke="none" />
          </g>
          <g style={{ transformOrigin: '258px 210px', animation: 'ibg-antenna 4s ease-in-out infinite 2s' }}>
            <line x1="258" y1="210" x2="278" y2="190" strokeWidth="4" />
            <polygon points="278,190 286,182 272,182" fill="#0D0D0D" stroke="none" />
          </g>
        </g>

        <style>{`
          @keyframes ibg-spin {
            from { transform: rotate(45deg); }
            to   { transform: rotate(405deg); }
          }
          @keyframes ibg-leg-a {
            0%, 100% { transform: rotate(0deg); }
            50%      { transform: rotate(22deg); }
          }
          @keyframes ibg-leg-b {
            0%, 100% { transform: rotate(0deg); }
            50%      { transform: rotate(-22deg); }
          }
          @keyframes ibg-antenna {
            0%, 45%, 100% { transform: rotate(0deg); }
            55%           { transform: rotate(20deg); }
            68%           { transform: rotate(-14deg); }
            80%           { transform: rotate(9deg); }
            90%           { transform: rotate(-4deg); }
          }
        `}</style>
      </svg>
    </div>
  )
}

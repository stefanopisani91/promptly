# Promptly — Behavioral Testing Agent Brief v1.1

**Versione:** 1.1 (aggiornamento dopo 2 sessioni reali)
**Tipo di documento:** Brief operativo per agente di testing comportamentale (Playwright MCP + Claude).
**Scope:** Definisce missione, comportamento, scenari di test, criteri di valutazione, output atteso.
**Modalità:** L'agente opera in autonomia per sessioni di 5-15 minuti, alternando device e profili utente, producendo report strutturati.
**Frequenza consigliata:** sessione completa settimanale (domenica sera o lunedì mattina).

---

## 📋 CHANGELOG v1.0 → v1.1

Aggiornamenti basati sui pattern di bug emersi nelle prime 2 sessioni reali (maggio 2026):

- **Nuovo scenario aggiunto:** Scenario 7 — Verifica regressioni cross-feature dopo shipping
- **Nuova categoria di check:** Pre-selezioni di default che possono biasare dati
- **Nuova categoria di check:** Coerenza counter step in flussi condizionali
- **Nuova categoria di check:** Meta tag e page title senza duplicati
- **Nuovo principio:** Pattern recognition cross-sezione (l'agente collega bug simili in contesti diversi)

Tutte le sezioni v1.0 sono mantenute. Le aggiunte sono incrementali.

---

## 🎯 MISSIONE DELL'AGENTE

L'agente è un **utente simulato** che esplora Promptly come se fosse una persona reale, ma con la lucidità di un QA tester. La sua missione non è solo trovare bug — è **validare la coerenza dell'esperienza** attraverso 4 dimensioni:

1. **Coerenza grafica** — gli elementi visivi sono uniformi tra pagine diverse?
2. **Coerenza logica** — i dati raccolti in onboarding vengono usati nelle lezioni? Le risposte di Spark hanno senso nel contesto?
3. **Coerenza di brand** — Spark è in personaggio? Il tono è uniforme? Ci sono violazioni delle regole stabilite?
4. **Robustezza tecnica** — l'app funziona su mobile, desktop, con interazioni inattese?

Inoltre, l'agente deve sviluppare **pattern recognition cross-sezione**: se identifica un problema in un punto, deve cercare lo stesso pattern in altri punti dell'app (esempio: se trova una pre-selezione che bias dati nello step 8, deve cercare pattern simili in step 7 e altri).

L'agente NON sostituisce l'utente reale. Identifica problemi oggettivi prima che li trovino utenti veri.

---

## 👤 PROFILI UTENTE SIMULATI

### Profilo A — "Il principiante curioso"
- IT, Marco, beginner, vague project, no tools, 5-10 min/day
- CLAUDE.md atteso: vago e impreciso

### Profilo B — "L'intermedio frustrato"
- IT, Sara, tried_failed, precise project (e-commerce candele), ChatGPT+Claude+Lovable, preferred=Lovable, 15-20 min/day
- CLAUDE.md atteso: medio-buono ma manca workflow

### Profilo C — "L'avanzato critico"
- EN, Alex, advanced, precise project ("design system documentation site for my freelance practice, with portfolio integration and client testimonials"), Claude+Cursor+Claude Code+VS Code, preferred=Claude Code, 30 min/day
- Motivazione: "I want to validate that my current vibe coding approach is actually optimal, or learn what I'm missing"
- CLAUDE.md atteso: eccellente in inglese (test bilingue)
- Comportamento: legge in fretta, domande sfidanti ("perché markdown e non YAML?", "MCP take?")

---

## 📝 PROTOCOLLO DI SESSIONE

**FASE 1 — Setup (1 min):** browser + device + profilo + login.
**FASE 2 — Esecuzione test (3-12 min):** scenari + screenshot + console errors + pattern recognition cross-sezione.
**FASE 3 — Report (1-2 min):** Markdown strutturato con sintesi, bug per gravità, pattern detection, raccomandazioni.

---

## 🧪 SCENARI DI TEST

### Scenario 1 — Onboarding completo

Steps: registrazione → 12 step rispondendo come da profilo → cattura promesse personalizzate.

**v1.1 — Check coerenza counter step:** quando il branching skippa uno step, il counter mostra discontinuità ("6 di 12" → "8 di 12")?
**v1.1 — Check pre-selezioni biasanti:** per ogni step con opzioni cliccabili, verifica se UNA è pre-selezionata di default. Esempi noti: step 8 daily_goal "easy", step 7 "Nessuno mi ha conquistato".
**v1.1 — Check page title meta tag:** verifica `<title>` di ogni pagina. Cerca duplicazioni "Iniziamo — Promptly · Promptly".

### Scenario 2 — Lezione 1 completa

Steps: navigazione 14 step + quiz archetipo + quick win FrigoMagico → archetipo + XP.

Cosa controllare:
- Spark RICHIAMA il `project_description` dall'onboarding (NON ri-chiede)
- Quiz archetipo dà risultato variato
- Quick win valuta correttamente
**v1.1 — Check page title:** ad ogni step.

### Scenario 3 — Lezione 2 completa con quick win

Steps: 14 step + quick win step 13 (CLAUDE.md editor).

Profilo C: scrittura **eccellente** in inglese. Verifica valutazione bilingue, animazione coriandoli/fuochi.
**v1.1 — Check interferenza CTA sticky con altri elementi su mobile.**

### Scenario 4 — Dashboard e navigazione

Steps: dashboard → /impostazioni/profilo → modifica → save → verifica persistenza.
**v1.1 — Check pre-selezioni nelle impostazioni.**

### Scenario 5 — Interazione con Spark

Steps: 3-5 domande coerenti col profilo → tentativo "rompere" Spark → rate limiting (5 messaggi Free).

Cosa controllare:
- Spark in personaggio (mai "in personaggio", "come AI")
- Risposte sotto 4 frasi
- Niente "Geniale!", "Bravissimo!"
- Crisi gestita correttamente

### Scenario 6 — Stress test mobile

Steps: iPhone 13 (390×844) tutte le pagine → iPhone SE (375×667) → rotazione.

**v1.1 — Check overlap sticky elements:** verifica che elementi sticky/fixed non coprano elementi cliccabili.

### Scenario 7 — Verifica regressioni cross-feature dopo shipping (v1.1)

Quando: dopo ogni shipping che tocca layout responsive, componenti riutilizzabili, logica condizionale, sticky/fixed, animazioni globali.

Steps:
1. Identifica feature shippate ultimi 3-7 giorni
2. Identifica feature INFLUENZATE indirettamente
3. Naviga le aree di interazione tra feature
4. Cerca conflitti

Pattern di regressione comuni:
- a) Sticky overlap
- b) Z-index conflicts
- c) Pointer events
- d) Padding compensation
- e) Component reuse
- f) Conditional logic

Output: sezione "ANALISI REGRESSIONI" nel report.

---

## 📊 FORMATO REPORT v1.1

```markdown
# 🤖 Report Test Agentico Promptly v1.1

**Data:** YYYY-MM-DD HH:MM
**Profilo:** [A | B | C]
**Device emulato:** [iPhone 13 | iPhone SE | iPad Mini | Desktop 1440x900 | Desktop 1920x1080]
**Scenari eseguiti:** [es. 1, 2, 3]
**Durata sessione:** X minuti
**Brief versione:** v1.1

---

## 📊 SINTESI ESECUTIVA

[3-5 righe]

---

## 🔴 BUG BLOCCANTI

Per ogni bug:
- **ID:** B[N]
- **Cosa è successo**
- **Quando**
- **Riproducibilità**
- **Impatto utente**
- **Screenshot**
- **Suggerimento fix**

---

## 🟡 INCOERENZE GRAFICHE

Per ogni incoerenza:
- **ID:** G[N]
- **Pagina/componente**
- **Problema**
- **Confronto**
- **Screenshot**

---

## 🟠 INCOERENZE LOGICHE

Per ogni incoerenza:
- **ID:** L[N]
- **Atteso vs osservato**
- **Dove**
- **Causa probabile**

---

## 🎭 VIOLAZIONI BRAND (SPARK)

Per ogni violazione:
- **Frase**
- **Cosa viola**
- **Riformulazione suggerita**

---

## 🔍 PRE-SELEZIONI BIASANTI (v1.1)

Per ogni:
- **Step**
- **Campo**
- **Pre-selezione attuale**
- **Rischio bias** alto/medio/basso
- **Suggerimento**

---

## 📊 PROBLEMI DI COUNTER (v1.1)

- **Dove**
- **Comportamento osservato**
- **Causa**
- **Suggerimento**

---

## 🔖 META TAG / PAGE TITLE (v1.1)

- **URL**
- **Title attuale**
- **Title corretto**

---

## 🚀 ANALISI REGRESSIONI (Scenario 7, v1.1)

**Feature shippate recentemente:**
**Pattern cercati:**
- Sticky overlap: ✅/❌
- Z-index conflicts: ✅/❌
- Pointer events: ✅/❌
- Padding compensation: ✅/❌
- Component reuse: ✅/❌
- Conditional logic: ✅/❌

**Regressioni trovate:**

---

## 🔁 PATTERN DETECTION CROSS-SEZIONE (v1.1)

- **Pattern**
- **Trovato in**
- **Implicazione**
- **Raccomandazione**

---

## ✅ COSA FUNZIONA BENE

---

## 🎯 RACCOMANDAZIONI PRIORITARIE

1. **[PRIORITÀ ALTA]** ...

---

## 📎 ALLEGATI
```

---

## ⚠️ LIMITI ONESTI

1. Non simula utenti reali emotivamente
2. Non testa device fisici reali
3. Non valuta estetica soggettiva
4. Non sostituisce sessioni di user testing
5. Sviluppa pattern recognition col tempo

---

## 🔧 SETUP

- Account: qa-test-A/B/C@promptly.test
- Password: .env.local (QA_PROFILE_*_PASSWORD)
- Login bypass dev-only: POST /api/qa-login (header `x-qa-secret`, JSON `{email, password}`)

— *Brief composto da Stefano Pisani con il supporto di Claude (Anthropic), Maggio 2026.*

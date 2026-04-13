# Freelance vs Salarie — Simulateur fiscal FR/LU 2026

Simulateur interactif qui compare un salaire ESN au Luxembourg avec les statuts freelance en France (EURL IS, SASU, portage, micro-entrepreneur).

## Demarrage rapide

```bash
# 1. Installer les dependances
npm install

# 2. Lancer le serveur de developpement
npm run dev

# 3. Ouvrir dans le navigateur
# http://localhost:3000
```

## Deploiement production

```bash
# Build optimise
npm run build

# Lancer en production
npm start
```

### Deployer sur Vercel (recommande)

```bash
npx vercel
```

Aucune configuration necessaire — Next.js est detecte automatiquement.

## Fonctionnalites

- **3 etapes guidees** : situation actuelle → simulation freelance → details
- **6 statuts compares** : Salarie ESN, EURL IS 100%, EURL IS optimal (rem+div), SASU IS, Portage, Micro-BNC
- **Calcul temps reel** : chaque slider recalcule instantanement (zero API, tout client-side)
- **Optimiseur rem/dividendes** : trouve automatiquement le split EURL IS qui maximise le net
- **Avantages ESN editables** : voiture, parking, cheques-repas, mutuelle, formation — montants modifiables
- **BIK voiture** : ajoute au brut fiscal puis retire du net (comme sur la fiche de paie LU)
- **Projection retraite** : pension LU vs TNS + capital accumule sur 30 ans
- **FAQ interactive** : 8 questions frequentes avec explications
- **Checklist freelance** : 9 etapes pour se lancer (affiche si le delta est positif)
- **TVA recovery** : +1 748 EUR/an pour EURL/SASU (materiel, SaaS, peages)
- **Infobulles (i)** : formules de calcul detaillees sur chaque resultat

## Precision

Calibre sur une fiche de paie luxembourgeoise reelle. Precision : **98%** (ecart ~86 EUR/mois).

### Baremes 2026 integres

| Element | Valeur |
|---------|--------|
| IR France | 0% / 11% / 30% / 41% / 45% |
| IS | 15% ≤42 500, 25% au-dela |
| PFU | 31.4% (12.8% IR + 18.6% PS) |
| PASS | 48 060 EUR |
| TNS | 9 lignes progressives (reforme assiette unique) |
| LU cotisations | Maladie 2.8% + 0.25% + Pension 8.0% |
| LU impot | Bareme progressif classe 1/2 sur imposable |

## Stack technique

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Chart.js** + react-chartjs-2
- Zero backend — tout le calcul est client-side dans `lib/engine.ts`

## Structure

```
├── app/
│   ├── globals.css          # Styles globaux + sliders
│   ├── layout.tsx           # Layout + SEO meta
│   └── page.tsx             # Page principale (wizard 3 etapes)
├── components/
│   ├── Charts.tsx           # TJM, Waterfall, Split optimizer
│   ├── DetailPanel.tsx      # Boutons (i) avec formules
│   ├── FAQ.tsx              # 8 questions frequentes
│   ├── NextSteps.tsx        # Checklist freelance (9 items)
│   ├── PensionChart.tsx     # Projection retraite LU vs TNS
│   ├── ResultCards.tsx      # Hero cards + tableau comparatif
│   └── Tooltip.tsx          # Infobulles hover (?)
├── lib/
│   └── engine.ts            # Moteur de calcul fiscal (1 200 lignes)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Licence

Usage personnel et educatif. Les estimations ne constituent pas un conseil fiscal.
Consultez un expert-comptable pour votre situation personnelle.

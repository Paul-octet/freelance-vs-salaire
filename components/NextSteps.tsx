'use client';

import { useState } from 'react';

interface Step {
  label: string;
  description: string;
  tag?: string;
}

const STEPS: Step[] = [
  {
    label: 'Verifier votre clause de non-concurrence/non-sollicitation',
    description: 'Lisez attentivement votre contrat ESN. Certaines clauses interdisent de travailler pour des clients de l\'ESN pendant 6-24 mois. Faites valider par un avocat si necessaire.',
    tag: 'Juridique',
  },
  {
    label: 'Consulter un expert-comptable specialise frontaliers FR/LU',
    description: 'La situation franco-luxembourgeoise est specifique : convention fiscale, cotisations SSI sur revenus LU, TVA... Un comptable generaliste ne suffit pas. Cherchez un cabinet specialise frontaliers.',
    tag: 'Fiscal',
  },
  {
    label: 'Constituer 6 mois de tresorerie d\'avance (~20 000 EUR)',
    description: 'L\'intercontrat peut durer 1-3 mois. Ajoutez les premiers acomptes IS/TVA et les charges sociales du trimestre. Un coussin de 20k EUR est le minimum raisonnable.',
    tag: 'Finances',
  },
  {
    label: 'Creer l\'EURL IS (en ligne, ~500 EUR, 2-4 semaines)',
    description: 'Via INPI.fr (guichet unique) ou une plateforme juridique (Legalstart, Captain Contrat). Prevoir les statuts, le depot de capital, le compte bancaire pro et le Kbis. Delai moyen : 10-20 jours ouvres.',
    tag: 'Creation',
  },
  {
    label: 'Souscrire RC Pro + Mutuelle + Prevoyance',
    description: 'RC Pro : obligatoire pour certaines missions (DSI grands comptes). Mutuelle : plus de cotisation patronale — choisir un contrat individuel. Prevoyance : couvre arret maladie + invalidite, critique en TNS.',
    tag: 'Protection',
  },
  {
    label: 'Ouvrir un compte bancaire professionnel',
    description: 'Obligatoire pour les EURL. Prevoir ~15-30 EUR/mois. Options digitales : Qonto, Shine, Blank. Exigez un vrai IBAN FR pour les virements LU.',
    tag: 'Banque',
  },
  {
    label: 'S\'inscrire a l\'URSSAF (CFE du lieu de domicile)',
    description: 'L\'inscription aupres du Centre de Formalites des Entreprises de l\'URSSAF declenche l\'affiliation SSI et les premieres cotisations sociales. A faire des l\'immatriculation.',
    tag: 'Admin',
  },
  {
    label: 'Identifier 2-3 clients potentiels',
    description: 'Ne quittez pas votre ESN sans au moins un client en vue. Les anciens collegues, managers et partenaires sont les meilleures sources. Un pipeline de 2-3 prospects minimise le risque d\'intercontrat long.',
    tag: 'Commercial',
  },
  {
    label: 'Negocier votre premier TJM (viser TJM ESN - 10%)',
    description: 'Votre ESN vous facture probablement 550-750 EUR/jour pour vous. Visez 10% en dessous du tarif ESN pour gagner facilement sur le cout, tout en majorant votre net. Benchmarkez sur Malt et Comet.',
    tag: 'TJM',
  },
];

const TAG_COLORS: Record<string, string> = {
  Juridique: 'bg-red-50 text-red-600',
  Fiscal: 'bg-orange-50 text-orange-600',
  Finances: 'bg-yellow-50 text-yellow-700',
  Creation: 'bg-blue-50 text-apple-blue',
  Protection: 'bg-purple-50 text-purple-600',
  Banque: 'bg-sky-50 text-sky-600',
  Admin: 'bg-gray-100 text-gray-600',
  Commercial: 'bg-green-50 text-green-600',
  TJM: 'bg-apple-green-light text-green-700',
};

export default function NextSteps() {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const progress = Math.round((checked.size / STEPS.length) * 100);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-apple-gray-light overflow-hidden">
          <div
            className="h-full rounded-full bg-apple-blue transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-500 tabular-nums w-10 text-right">
          {checked.size}/{STEPS.length}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const done = checked.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                done
                  ? 'border-apple-green bg-apple-green-light'
                  : 'border-apple-border bg-white hover:border-apple-blue/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                  className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    done
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  {done && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold transition-colors duration-200 ${done ? 'text-green-700 line-through decoration-green-400' : 'text-apple-text'}`}>
                      {step.label}
                    </span>
                    {step.tag && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TAG_COLORS[step.tag] ?? 'bg-gray-100 text-gray-500'}`}>
                        {step.tag}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed transition-colors duration-200 ${done ? 'text-green-600/70' : 'text-gray-500'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {checked.size === STEPS.length && (
        <div className="rounded-xl bg-apple-green-light border border-apple-green p-4 text-center">
          <div className="text-green-700 font-bold text-sm">Toutes les etapes completees</div>
          <div className="text-green-600 text-xs mt-1">Vous etes pret(e) a vous lancer. Bonne route !</div>
        </div>
      )}
    </div>
  );
}

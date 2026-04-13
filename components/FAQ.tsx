'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "C'est quoi une EURL IS ?",
    answer: (
      <div className="space-y-2">
        <p>
          L&apos;<strong>EURL</strong> (Entreprise Unipersonnelle a Responsabilite Limitee) est une SARL a associe unique.
          En optant pour l&apos;<strong>Impot sur les Societes (IS)</strong>, la societe paie l&apos;IS sur ses benefices (15% jusqu&apos;a 42 500 EUR, 25% au-dela),
          et le gerant se verse une remuneration TNS deductible + des dividendes soumis au PFU (30%).
        </p>
        <p>
          Avantages cles : <strong>responsabilite limitee</strong> au capital (1 000 EUR minimum),
          arbitrage remuneration/dividendes pour optimiser les charges,
          credibilite commerciale vis-a-vis des clients.
        </p>
        <p className="text-gray-400 text-[11px]">
          Le gerant est <strong>Travailleur Non Salarie (TNS)</strong> : il cotise a la SSI (ex-RSI), pas a la CPAM.
        </p>
      </div>
    ),
  },
  {
    question: "C'est quoi le portage salarial ?",
    answer: (
      <div className="space-y-2">
        <p>
          Le <strong>portage salarial</strong> est un statut intermediaire : vous etes en <strong>CDI</strong> avec une
          societe de portage, qui facture vos clients en votre nom et vous reverse un salaire apres deduction de ses frais (8-12% du CA).
        </p>
        <p>
          Avantages : acces aux <strong>ARE (France Travail)</strong> (allocation chomage), mutuelle entreprise,
          zero gestion administrative, deductibilite des frais professionnels.
        </p>
        <p>
          Inconvenient majeur : les charges patronales (42%) + salariales (22%) s&apos;appliquent au salaire, ce qui reduit significativement le net.
          Le simulateur inclut le scenario portage pour cette comparaison.
        </p>
      </div>
    ),
  },
  {
    question: "C'est quoi les cotisations TNS ?",
    answer: (
      <div className="space-y-2">
        <p>En tant que gerant TNS EURL IS, vous payez 9 lignes de cotisations :</p>
        <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-[11px] font-mono">
          <div className="flex justify-between"><span>Maladie-maternite</span><span className="text-apple-blue">~7.2%</span></div>
          <div className="flex justify-between"><span>Retraite de base (SSI)</span><span className="text-apple-blue">~17.75%</span></div>
          <div className="flex justify-between"><span>Retraite complementaire (RCI)</span><span className="text-apple-blue">~7%</span></div>
          <div className="flex justify-between"><span>Invalidite-deces</span><span className="text-apple-blue">~1.3%</span></div>
          <div className="flex justify-between"><span>Allocations familiales</span><span className="text-apple-blue">0 ou 3.1%</span></div>
          <div className="flex justify-between"><span>CSG/CRDS</span><span className="text-apple-blue">9.7%</span></div>
          <div className="flex justify-between"><span>Formation professionnelle (CFP)</span><span className="text-apple-blue">0.25%</span></div>
          <div className="flex justify-between"><span>CIPAV (si applicable)</span><span className="text-apple-blue">variable</span></div>
          <div className="flex justify-between font-bold border-t border-gray-200 pt-1"><span>Total effectif</span><span className="text-apple-blue">~45-47%</span></div>
        </div>
        <p className="text-[11px] text-gray-400">
          Base 2026 apres reforme de l&apos;assiette unique. Les cotisations sont calculees sur la remuneration nette + certaines charges deductibles.
        </p>
      </div>
    ),
  },
  {
    question: "Pourquoi le taux de prelevement varie ?",
    answer: (
      <div className="space-y-2">
        <p>
          Le taux de prelevement global depend de <strong>trois variables independantes</strong> :
        </p>
        <ul className="space-y-1 list-none">
          <li className="flex gap-2"><span className="text-apple-blue font-bold">1.</span><span><strong>Progressivite de l&apos;IR :</strong> les tranches de 0% a 45% s&apos;appliquent incrementalement. Plus le revenu est haut, plus le taux moyen monte.</span></li>
          <li className="flex gap-2"><span className="text-apple-blue font-bold">2.</span><span><strong>Arbitrage IS vs IR :</strong> en EURL IS, on paye 15% d&apos;IS sur les benefices (seuil 42 500 EUR), puis PFU 30% sur les dividendes — souvent plus avantageux qu&apos;un IR a 30-41%.</span></li>
          <li className="flex gap-2"><span className="text-apple-blue font-bold">3.</span><span><strong>Quotient familial :</strong> chaque demi-part fiscale reduit l&apos;imposition (1.5 parts = celibataire + 1 enfant).</span></li>
        </ul>
        <p className="text-[11px] text-gray-400">
          Le simulateur optimise automatiquement le split remuneration/dividendes pour minimiser votre charge fiscale totale.
        </p>
      </div>
    ),
  },
  {
    question: "Quels sont les risques du freelance ?",
    answer: (
      <div className="space-y-2">
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="text-red-400 font-bold mt-0.5">!</span>
            <div><strong>Intercontrat :</strong> entre deux missions, zero revenu. Constituer 6 mois de tresorerie est indispensable.</div>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400 font-bold mt-0.5">!</span>
            <div><strong>Arret maladie :</strong> les indemnites TNS commencent apres 3 jours de carence (vs 1 jour salarie) et sont limitees. Une prevoyance privee est fortement recommandee.</div>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400 font-bold mt-0.5">!</span>
            <div><strong>Pas de chomage :</strong> impossible d&apos;acceder aux ARE (France Travail) depuis une EURL. Le portage permet de conserver ce droit.</div>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400 font-bold mt-0.5">!</span>
            <div><strong>Tresorerie decalee :</strong> la TVA est due trimestriellement, les acomptes IS egalement. Prevoir un compte dedier.</div>
          </li>
          <li className="flex gap-2">
            <span className="text-orange-400 font-bold mt-0.5">~</span>
            <div><strong>Retraite plus faible :</strong> les cotisations TNS generent moins de droits qu&apos;un cadre salarie. Voir la section pension ci-dessus.</div>
          </li>
        </ul>
      </div>
    ),
  },
  {
    question: "Combien coute la creation d'une EURL ?",
    answer: (
      <div className="space-y-2">
        <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-[11px]">
          <div className="flex justify-between"><span>Immatriculation (INPI / greffe)</span><span className="font-semibold">~50-150 EUR</span></div>
          <div className="flex justify-between"><span>Redaction statuts (notaire ou LegalPlace)</span><span className="font-semibold">~200-400 EUR</span></div>
          <div className="flex justify-between"><span>Capital social minimum</span><span className="font-semibold">1 EUR (recommande 1 000 EUR)</span></div>
          <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold"><span>Creation totale</span><span className="text-apple-blue">~300-600 EUR</span></div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-[11px] mt-2">
          <div className="text-gray-500 font-semibold mb-1">Couts recurrents annuels</div>
          <div className="flex justify-between"><span>Expert-comptable</span><span className="font-semibold">~1 800-3 000 EUR/an</span></div>
          <div className="flex justify-between"><span>CFE (Cotisation Fonciere des Entreprises)</span><span className="font-semibold">~300-700 EUR/an</span></div>
          <div className="flex justify-between"><span>Compte bancaire pro</span><span className="font-semibold">~15-30 EUR/mois</span></div>
          <div className="flex justify-between"><span>RC Pro</span><span className="font-semibold">~500-1 500 EUR/an</span></div>
        </div>
        <p className="text-[11px] text-gray-400">Ces couts sont deductibles du benefice imposable (IS).</p>
      </div>
    ),
  },
  {
    question: "La pension luxembourgeoise, c'est si bien ?",
    answer: (
      <div className="space-y-2">
        <p>
          Oui — et c&apos;est souvent <strong>le facteur le plus sous-estime</strong> dans la decision freelance.
        </p>
        <div className="rounded-lg bg-gray-50 p-3 space-y-2 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Taux de remplacement Luxembourg</span>
            <span className="font-bold text-green-600 text-sm">~88%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Taux de remplacement TNS France</span>
            <span className="font-bold text-red-500 text-sm">~45%</span>
          </div>
        </div>
        <p>
          Le systeme luxembourgeois verse une pension proportionnelle aux salaires declares, sans plafond de PASS.
          En passant freelance, vous <strong>sortez du systeme LU</strong> et cotisez a la SSI francaise, moins genereux sur les hauts revenus.
        </p>
        <p className="text-[11px] text-gray-400">
          Pour compenser : Madelin, PER individuel, et dividendes capitalises dans une holding (structure avancee).
          Consultez la section &laquo; Pension &raquo; du simulateur pour votre projection personnalisee.
        </p>
      </div>
    ),
  },
  {
    question: "Je perds quoi en quittant mon ESN ?",
    answer: (
      <div className="space-y-2">
        <p>Le simulateur comptabilise <strong>7 100 EUR/an d&apos;avantages perdus</strong>. Voici le detail :</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2 items-start">
            <span className="text-gray-400 mt-0.5">&#8212;</span>
            <div><strong>Parking + voiture de fonction</strong> : valeur reelle significative a Luxembourg</div>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-gray-400 mt-0.5">&#8212;</span>
            <div><strong>Certifications payees</strong> : Microsoft, Azure, Power Platform — ~1 500-3 000 EUR/an</div>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-gray-400 mt-0.5">&#8212;</span>
            <div><strong>13eme mois</strong> : si votre ESN le verse, c&apos;est ~8% de salaire en plus</div>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-gray-400 mt-0.5">&#8212;</span>
            <div><strong>Chomage (ARE (France Travail))</strong> : impossible depuis une EURL. Valeur theorique ~6-12 mois de salaire en cas de rupture</div>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-gray-400 mt-0.5">&#8212;</span>
            <div><strong>Mutuelle entreprise</strong> : cotisation patronale ~100-200 EUR/mois que vous devrez financer seul</div>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-gray-400 mt-0.5">&#8212;</span>
            <div><strong>Conges payes integres</strong> : en freelance, les jours non factures ne sont pas remuneres</div>
          </li>
        </ul>
        <p className="text-[11px] text-gray-400">
          Ajustez la valeur &laquo; Avantages en nature &raquo; dans le simulateur pour personnaliser ce calcul.
        </p>
      </div>
    ),
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="divide-y divide-apple-border rounded-2xl border border-apple-border overflow-hidden">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => toggle(i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors duration-150"
          >
            <span className="text-sm font-semibold text-apple-text">{item.question}</span>
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full bg-apple-gray-light flex items-center justify-center text-gray-500 text-xs font-bold transition-transform duration-200 ${
                openIndex === i ? 'rotate-45' : ''
              }`}
            >
              +
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === i ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed border-t border-apple-border bg-gray-50/50">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

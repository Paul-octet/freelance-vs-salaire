'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Tooltip from '@/components/Tooltip';
import { DetailButton, FormulaBlock } from '@/components/DetailPanel';
import ResultCards from '@/components/ResultCards';
import { TjmChart, WaterfallChart, SplitChart } from '@/components/Charts';
import { PensionChart } from '@/components/PensionChart';
import FAQ from '@/components/FAQ';
import NextSteps from '@/components/NextSteps';
import { SimParams, EsnBenefits, BENEFIT_DEFAULTS, simulate, totalBenefitsMensuel, calcAvantagesPerdus } from '@/lib/engine';

function fmt(n: number) { return n.toLocaleString('fr-FR'); }
function fmtMonth(n: number) { return fmt(Math.round(n / 12)); }

function Slider({ label, tooltip, value, min, max, step, unit, onChange }: {
  label: string; tooltip?: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-apple-text flex items-center gap-1">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
        <span className="text-lg font-bold text-apple-blue tabular-nums">
          {value.toLocaleString('fr-FR')} {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        aria-label={label} onChange={e => onChange(Number(e.target.value))} className="w-full" />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min.toLocaleString('fr-FR')}</span>
        <span>{max.toLocaleString('fr-FR')}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [params, setParams] = useState<SimParams>({
    tjm: 800, jours: 205, parts: 1,
    salaireBrutLux: 80000, margeEsn: 0.45, classeLux: 1,
    benefits: {
      voiture:      { active: true, montantMensuel: 529 },
      parking:      { active: true, montantMensuel: 200 },
      chequesRepas: { active: true, montantMensuel: 128 },
      mutuelle:     { active: true, montantMensuel: 50 },
      formation:    { active: true, montantMensuel: 125 },
    },
  });
  const [showDetails, setShowDetails] = useState(false);
  const [verdictFlash, setVerdictFlash] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const verdictRef = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLElement>(null);

  const update = (key: keyof SimParams, value: number | null) => {
    setParams(p => ({ ...p, [key]: value }));
  };

  // TJM change: flash verdict numbers + scroll to step 2
  const updateTjm = (v: number) => {
    update('tjm', v);
    setVerdictFlash(true);
    setTimeout(() => setVerdictFlash(false), 600);
    // Smooth scroll to verdict on step 1 params change
    if (verdictRef.current) {
      verdictRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Sticky bar: show when step3 is scrolled past
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    if (step3Ref.current) observer.observe(step3Ref.current);
    return () => observer.disconnect();
  }, []);

  const result = useMemo(() => simulate(params), [params]);
  const salarie = result.scenarios[0];
  const best = result.bestFreelance;
  const delta = best ? best.deltaVsSalarie : result.scenarios[1].deltaVsSalarie;
  const deltaPositive = delta > 0;

  return (
    <div className="min-h-screen bg-white">

      {/* ===== STICKY VERDICT BAR ===== */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        stickyVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="bg-white/90 backdrop-blur-sm border-b border-apple-border shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-center gap-4 text-sm flex-wrap">
            <span className="text-gray-500">Salarie : <strong className="text-apple-text tabular-nums">{fmtMonth(salarie.netReel)} EUR/mois</strong></span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">Freelance : <strong className="text-apple-blue tabular-nums">{fmtMonth(best ? best.netReel : result.scenarios[1].netReel)} EUR/mois</strong></span>
            <span className="text-gray-300">|</span>
            <span className={`font-bold tabular-nums ${deltaPositive ? 'text-green-600' : 'text-apple-red'}`}>
              Delta : {deltaPositive ? '+' : ''}{fmtMonth(delta)} EUR/mois
            </span>
          </div>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <header className="text-center pt-12 pb-6 px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-apple-text">
          Salarie <span className="text-apple-blue">ou</span> freelance ?
        </h1>
        <p className="text-base text-gray-500 mt-3 max-w-lg mx-auto">
          Partez de votre salaire ESN au Luxembourg, decouvrez ce que le freelance peut vous apporter.
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-20 space-y-12">

        {/* ===== ETAPE 1 : VOTRE SALAIRE ACTUEL ===== */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-apple-gray-light flex items-center justify-center text-sm font-bold text-gray-500">1</div>
            <h2 className="text-xl font-bold text-apple-text">Votre situation actuelle</h2>
          </div>

          <div className="rounded-2xl bg-apple-gray-light p-6 sm:p-8 space-y-6">
            <p className="text-sm text-gray-500">Renseignez les montants tels qu&apos;ils apparaissent sur votre <strong>fiche de paie mensuelle</strong>.</p>

            {/* Ligne 1 : Brut mensuel + Classe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  Salaire brut mensuel
                  <Tooltip text="Ligne 'Salaire brut' de votre fiche de paie. Inclut le 13e mois s'il est mensualisé." />
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" value={params.salaireBrutLux ? Math.round(params.salaireBrutLux / 12) : ''}
                    placeholder="ex: 6 667"
                    onChange={e => update('salaireBrutLux', e.target.value ? Number(e.target.value) * 12 : null)}
                    className="flex-1 px-4 py-3 rounded-xl border border-apple-border bg-white text-apple-text
                      text-xl font-bold focus:outline-none focus:ring-2 focus:ring-apple-blue/30
                      focus:border-apple-blue placeholder:text-gray-400 tabular-nums" />
                  <span className="text-sm text-gray-400 font-medium">EUR/mois</span>
                </div>
                <div className="text-xs text-gray-400 pl-1">
                  soit {fmt(params.salaireBrutLux ?? 0)} EUR/an
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  Classe d&apos;impot LU
                  <Tooltip text="Classe 1 = celibataire. Classe 2 = marie/PACSe avec conjoint non-imposable au LU." />
                </label>
                <div role="radiogroup" className="flex gap-2">
                  {([1, 2] as const).map(c => (
                    <button key={c} type="button" role="radio" aria-checked={params.classeLux === c}
                      onClick={() => update('classeLux', c)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                        params.classeLux === c
                          ? 'bg-apple-blue text-white shadow-md'
                          : 'bg-white border border-apple-border text-gray-500 hover:bg-gray-50'
                      }`}>
                      Classe {c} {c === 1 ? '(celib.)' : '(marie)'}
                    </button>
                  ))}
                </div>
                <Slider label="Parts fiscales" value={params.parts} min={1} max={4} step={0.5} unit=""
                  tooltip="1 = celibataire, 1.5 = celib + 1 enfant, 2 = couple, 2.5 = couple + 1 enfant."
                  onChange={v => update('parts', v)} />
              </div>
            </div>

            {/* Avantages fiche de paie — toggles avec montants mensuels */}
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                Avantages sur votre fiche de paie
                <Tooltip text="Cochez les lignes presentes sur votre bulletin. En freelance, ces avantages disparaissent et sont pris en compte dans la comparaison." />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(BENEFIT_DEFAULTS) as (keyof EsnBenefits)[]).map(key => {
                  const def = BENEFIT_DEFAULTS[key];
                  const item = params.benefits[key];
                  return (
                    <div key={key}
                      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
                        item.active
                          ? 'bg-white border-2 border-apple-blue/40 shadow-sm'
                          : 'bg-white/60 border border-apple-border opacity-50'
                      }`}>
                      <input type="checkbox" checked={item.active}
                        onChange={e => setParams(p => ({
                          ...p,
                          benefits: { ...p.benefits, [key]: { ...p.benefits[key], active: e.target.checked } }
                        }))}
                        className="w-4 h-4 rounded border-gray-300 text-apple-blue focus:ring-apple-blue/30 cursor-pointer" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-apple-text">{def.label}</div>
                        <div className="text-[11px] text-gray-400 truncate">{def.fichePaie}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <input type="number" value={item.montantMensuel}
                          disabled={!item.active}
                          onChange={e => setParams(p => ({
                            ...p,
                            benefits: { ...p.benefits, [key]: { ...p.benefits[key], montantMensuel: Number(e.target.value) || 0 } }
                          }))}
                          className={`w-20 px-2 py-1 rounded-lg border text-right text-sm font-bold tabular-nums
                            focus:outline-none focus:ring-1 focus:ring-apple-blue/30 ${
                            item.active
                              ? 'border-apple-border bg-white text-apple-text'
                              : 'border-transparent bg-transparent text-gray-300'
                          }`} />
                        <span className="text-[11px] text-gray-400 w-8">EUR</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resume package mensuel */}
            <div className="rounded-xl bg-white/80 border border-apple-border/50 px-4 py-3">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Brut mensuel</span>
                <span className="tabular-nums font-medium">{fmt(Math.round((params.salaireBrutLux ?? 0) / 12))} EUR</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>+ Avantages mensuels</span>
                <span className="tabular-nums font-medium">+{fmt(totalBenefitsMensuel(params.benefits))} EUR</span>
              </div>
              <div className="border-t border-apple-border/50 mt-2 pt-2 flex justify-between text-sm font-bold text-apple-text">
                <span>= Package mensuel total</span>
                <span className="tabular-nums">{fmt(Math.round((params.salaireBrutLux ?? 0) / 12) + totalBenefitsMensuel(params.benefits))} EUR/mois</span>
              </div>
            </div>

            {/* Votre net actuel */}
            <div className="rounded-xl bg-white border border-apple-border p-5 text-center relative">
              <div className="absolute top-3 right-3">
                <DetailButton title="Comment est calcule votre net ?">
                  <p>Le net est calcule a partir de votre <strong>salaire brut luxembourgeois</strong> en deduisant :</p>
                  <FormulaBlock label="Cotisations sociales LU (part salariale)"
                    formula="Pension 8.5% + CNS 3.05% + Dependance 1.4% = 12.9%"
                    result={`${fmt(Math.round((params.salaireBrutLux ?? 0) * 0.129))} EUR`} />
                  <FormulaBlock label="Impot sur le revenu LU"
                    formula={`Taux effectif classe ${params.classeLux} (interpole par tranche)`}
                    result={`~${fmt(Math.round((params.salaireBrutLux ?? 0) * (params.classeLux === 1 ? 0.18 : 0.12)))} EUR`} />
                  <FormulaBlock label="Net annuel"
                    formula="Brut - Cotisations - IR + Cheques-repas"
                    result={`${fmt(salarie.netReel)} EUR`} />
                </DetailButton>
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Votre net actuel</div>
              <div className="text-4xl font-extrabold text-apple-text tabular-nums">
                {fmtMonth(salarie.netReel)} <span className="text-base font-medium text-gray-400">EUR/mois</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">{fmt(salarie.netReel)} EUR/an net</div>
            </div>
          </div>
        </section>

        {/* ===== ETAPE 2 : ET SI VOUS PASSIEZ FREELANCE ? ===== */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-apple-blue-light flex items-center justify-center text-sm font-bold text-apple-blue">2</div>
            <h2 className="text-xl font-bold text-apple-text">Et si vous passiez freelance ?</h2>
          </div>

          <div className="rounded-2xl border-2 border-apple-blue/20 bg-apple-blue-light/30 p-6 sm:p-8 space-y-6">
            <Slider label="Votre TJM" value={params.tjm} min={400} max={1500} step={10} unit="EUR/jour"
              tooltip="Taux Journalier Moyen : ce que vous factureriez a votre client. Demandez combien votre ESN facture aujourd'hui."
              onChange={updateTjm} />

            <Slider label="Jours factures par an" value={params.jours} min={150} max={230} step={1} unit="jours"
              tooltip="Realiste = 205 jours (30j conges + 10j feries + 20j intercontrat/maladie). Optimiste = 218."
              onChange={v => update('jours', v)} />

            <div className="text-center text-sm text-gray-500">
              Chiffre d&apos;affaires : <strong className="text-apple-text">{fmt(params.tjm * params.jours)} EUR/an</strong>
              <span className="mx-2">|</span>
              Marge ESN estimee : <strong className="text-apple-text">{Math.round(params.margeEsn * 100)}%</strong>
              <button onClick={() => setShowDetails(d => !d)}
                className="ml-2 text-apple-blue underline text-xs">
                {showDetails ? 'Masquer' : 'Ajuster'}
              </button>
            </div>

            {showDetails && (
              <Slider label="Marge ESN" value={Math.round(params.margeEsn * 100)} min={20} max={65} step={1} unit="%"
                tooltip="Pourcentage que votre ESN garde. 45% = typique grands ESN. Demandez votre TJM de facturation."
                onChange={v => update('margeEsn', v / 100)} />
            )}

            {/* ===== LE VERDICT ===== */}
            <div ref={verdictRef} className={`rounded-2xl bg-white shadow-lg p-6 sm:p-8 transition-all duration-300 ${
              deltaPositive ? 'shadow-green-100 ring-1 ring-green-200/60' : ''
            }`}>
              {/* Mobile: vertical stack with delta banner; Desktop: 3-col grid */}
              <div className="flex flex-col sm:grid sm:grid-cols-3 sm:gap-4 sm:items-stretch gap-0">
                {/* Salarie */}
                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Aujourd&apos;hui</div>
                  <div className={`text-2xl font-extrabold text-apple-text tabular-nums transition-all duration-300 ${verdictFlash ? 'scale-105 text-apple-blue' : ''}`}>
                    {fmtMonth(salarie.netReel)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">EUR/mois net</div>
                  <div className="text-xs text-gray-400 mt-0.5">soit {fmt(salarie.netReel)} EUR/an</div>
                </div>

                {/* Delta — full-width banner on mobile, centered column on desktop */}
                <div className={`w-full sm:flex sm:items-center sm:justify-center rounded-xl sm:rounded-xl px-4 py-3 text-center my-2 sm:my-0 ${deltaPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div>
                    <div className="hidden sm:block text-2xl mb-1 text-gray-300">
                      {deltaPositive ? '↗' : '↘'}
                    </div>
                    <div className={`text-2xl font-extrabold tabular-nums transition-all duration-300 ${verdictFlash ? 'scale-110' : ''} ${deltaPositive ? 'text-green-600' : 'text-apple-red'}`}>
                      {deltaPositive ? '+' : ''}{fmtMonth(delta)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">EUR/mois</div>
                    <div className="text-xs text-gray-400 mt-0.5">soit {deltaPositive ? '+' : ''}{fmt(delta)} EUR/an</div>
                  </div>
                </div>

                {/* Freelance */}
                <div className={`rounded-xl p-4 text-center relative ${deltaPositive ? 'bg-apple-blue-light' : 'bg-gray-50'}`}>
                  <div className="absolute top-2 right-2">
                    <DetailButton title="Detail du calcul freelance (EURL IS)">
                      <p>Meilleur statut : <strong>{best ? best.label : 'EURL IS 100%'}</strong></p>
                      <FormulaBlock label="Chiffre d'affaires"
                        formula={`${fmt(params.tjm)} EUR/j x ${params.jours}j`}
                        result={`${fmt(params.tjm * params.jours)} EUR`} />
                      <FormulaBlock label="Frais deductibles"
                        formula="Materiel + licences + bureau + IK + peages + repas + formation + assurance + tel"
                        result="29 891 EUR" />
                      <FormulaBlock label="Cotisations TNS (9 lignes)"
                        formula="Maladie + IJ + AF + Retraite base + Retraite compl + Inv-deces + CSG 9.2% + CRDS 0.5% + CFP"
                        result={`~${fmt(Math.round((params.tjm * params.jours - 29891) * 0.31))} EUR (taux effectif ~31%)`} />
                      <FormulaBlock label="IR France"
                        formula="Bareme progressif 2026 (0/11/30/41/45%) avec quotient familial"
                        result={`${params.parts} part(s)`} />
                      <FormulaBlock label="Ajustements"
                        formula="+ Optim 6 581 - Protection 9 600 - Avantages perdus 7 100"
                        result="-10 119 EUR" />
                      <p className="text-gray-400">Net = CA - Frais - Cotisations TNS - IR + Ajustements</p>
                    </DetailButton>
                  </div>
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${deltaPositive ? 'text-apple-blue' : 'text-gray-400'}`}>
                    {best ? best.label : 'Freelance'}
                  </div>
                  <div className={`text-2xl font-extrabold tabular-nums transition-all duration-300 ${verdictFlash ? 'scale-105' : ''} ${deltaPositive ? 'text-apple-blue' : 'text-apple-text'}`}>
                    {fmtMonth(best ? best.netReel : result.scenarios[1].netReel)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">EUR/mois net</div>
                  <div className="text-xs text-gray-400 mt-0.5">soit {fmt(best ? best.netReel : result.scenarios[1].netReel)} EUR/an</div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-apple-gray-light px-4 py-3 text-center text-sm">
                <span className="text-gray-500">Break-even : </span>
                <strong className="text-apple-text">~{fmt(result.breakeven)} EUR/jour</strong>
                <span className="text-gray-500"> — en dessous, restez salarie.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== ETAPE 3 : COMPRENDRE EN DETAIL ===== */}
        <section ref={step3Ref}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-apple-green-light flex items-center justify-center text-sm font-bold text-green-600">3</div>
            <h2 className="text-xl font-bold text-apple-text">Comprendre en detail</h2>
          </div>

          <div className="space-y-6">
            {/* Comparison table */}
            <ResultCards result={result} />

            {/* TJM sensitivity */}
            <TjmChart params={params} />

            {/* Waterfall */}
            <WaterfallChart params={params} />

            {/* Split optimizer */}
            <SplitChart params={params} optimalRem={result.optimalRem} />

            {/* Pension */}
            <PensionChart params={params} salarieNet={result.salarieNet} />

            {/* Methodology */}
            <div className="rounded-xl bg-apple-gray-light p-5 text-xs text-gray-500 leading-relaxed space-y-2">
              <p>
                <strong className="text-gray-600">Methode :</strong> Moteur TNS progressif 2026 (9 lignes de cotisations, reforme assiette unique).
                IR France avec quotient familial. Luxembourg : classes 1/2.
              </p>
              <p>
                <strong className="text-gray-600">Hypotheses :</strong> Frais deductibles 29 891 EUR/an. Protection 9 600 EUR.
                Optimisations 6 581 EUR. Avantages perdus 7 100 EUR.
              </p>
              <p>Estimations indicatives. Consultez un expert-comptable pour votre situation personnelle.</p>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-apple-gray-light flex items-center justify-center text-sm font-bold text-gray-500">?</div>
            <h2 className="text-xl font-bold text-apple-text">Questions frequentes</h2>
          </div>
          <FAQ />
        </section>

        {/* ===== NEXT STEPS (only if freelance is profitable) ===== */}
        {deltaPositive && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-apple-green-light flex items-center justify-center text-sm font-bold text-green-600">&#10003;</div>
              <div>
                <h2 className="text-xl font-bold text-apple-text">Prochaines etapes</h2>
                <p className="text-xs text-gray-500 mt-0.5">Le freelance vous rapporte +{Math.round(delta / 12).toLocaleString('fr-FR')} EUR/mois. Voici comment passer a l&apos;action.</p>
              </div>
            </div>
            <NextSteps />
          </section>
        )}
      </main>

      <footer className="text-center py-8 border-t border-apple-border">
        <p className="text-xs text-apple-gray">
          FreelanceVsSalaire.fr &mdash; Simulateur fiscal 2026
        </p>
      </footer>
    </div>
  );
}

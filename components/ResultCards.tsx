'use client';

import { SimResult } from '@/lib/engine';
import Tooltip from './Tooltip';
import { DetailButton } from './DetailPanel';

const SCENARIO_DETAILS: Record<string, { desc: string; formule: string }> = {
  'Salarie ESN (LU)': {
    desc: 'Salaire brut luxembourgeois via une ESN (Entreprise de Services Numeriques).',
    formule: 'Net = Brut - Cotisations LU (12.9%) - IR Luxembourg (bareme progressif par classe)',
  },
  'EURL IS 100% rem.': {
    desc: 'EURL a l\'IS avec 100% du resultat verse en remuneration gerant (TNS). Pas de dividendes.',
    formule: 'Net = (CA - Frais) - Cotisations TNS progressives (9 lignes) - IR France - Protection + Optimisations - Avantages perdus',
  },
  'Portage salarial': {
    desc: 'Societe de portage qui facture le client. Vous etes salarie du portage (CDI, chomage, mutuelle).',
    formule: 'Net = CA - 8% gestion - 10% CP - 42% charges patronales - 22% charges salariales - 9.7% CSG/CRDS - IR France',
  },
};

function fmt(n: number): string {
  return n.toLocaleString('fr-FR');
}

function fmtMonth(n: number): string {
  return fmt(Math.round(n / 12));
}

export default function ResultCards({ result }: { result: SimResult }) {
  const salarie = result.scenarios[0];
  const best = result.bestFreelance;
  const deltaPositive = best && best.deltaVsSalarie > 0;

  return (
    <div className="space-y-4">
      {/* Hero cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Salarie */}
        <div className="rounded-xl border-2 border-apple-border p-5 text-center transition-all duration-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-apple-gray mb-3">
            Salarie ESN
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-apple-text">
            {fmtMonth(salarie.netReel)}
            <span className="text-base font-medium text-gray-600 ml-1">EUR/mois</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {fmt(salarie.netReel)} EUR/an
          </div>
        </div>

        {/* Best freelance */}
        <div className={`rounded-xl border-2 p-5 text-center transition-all duration-200 ${
          best ? 'border-apple-blue bg-apple-blue-light' : 'border-apple-border'
        }`}>
          <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
            best ? 'text-apple-blue' : 'text-apple-gray'
          }`}>
            {best ? best.label : 'Freelance'}
          </div>
          <div className={`text-3xl font-extrabold tracking-tight ${
            best ? 'text-apple-blue' : 'text-apple-text'
          }`}>
            {best ? fmtMonth(best.netReel) : fmtMonth(result.scenarios[1].netReel)}
            <span className="text-base font-medium text-gray-600 ml-1">EUR/mois</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {fmt(best ? best.netReel : result.scenarios[1].netReel)} EUR/an
          </div>
        </div>

        {/* Delta */}
        <div className={`rounded-xl border-2 p-5 text-center transition-all duration-200 ${
          deltaPositive
            ? 'border-apple-green bg-apple-green-light'
            : 'border-apple-red/30 bg-red-50'
        } ${deltaPositive ? '' : 'animate-pulse-once'}`}>
          <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
            deltaPositive ? 'text-green-700' : 'text-apple-red'
          }`}>
            Difference
          </div>
          <div className={`text-3xl font-extrabold tracking-tight ${
            deltaPositive ? 'text-green-700' : 'text-apple-red'
          }`}>
            {deltaPositive ? '+' : ''}{fmtMonth(best ? best.deltaVsSalarie : result.scenarios[1].deltaVsSalarie)}
            <span className="text-base font-medium text-gray-600 ml-1">EUR/mois</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {deltaPositive ? '+' : ''}{fmt(best ? best.deltaVsSalarie : result.scenarios[1].deltaVsSalarie)} EUR/an
          </div>
        </div>
      </div>

      {/* Break-even */}
      <div className="rounded-xl bg-apple-gray-light p-4 text-center">
        <span className="text-sm text-gray-600">Break-even : </span>
        <span className="text-sm font-bold text-apple-text">~{fmt(result.breakeven)} EUR/jour</span>
        <span className="text-sm text-gray-600"> — au-dessus, le freelance gagne.</span>
      </div>

      {/* All scenarios table */}
      <div className="rounded-xl border border-apple-border overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-apple-gray-light">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Statut</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Net/mois</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Net/an</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  vs Salarie
                  <Tooltip text="Difference de revenu net annuel par rapport au salaire ESN Luxembourg." />
                </span>
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                <span className="inline-flex items-center gap-1 justify-end">
                  Taux prelev.
                  <Tooltip text="Pourcentage du chiffre d'affaires preleve (cotisations + impots)." />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {result.scenarios.map((s, i) => {
              const isBest = best && s.label === best.label;
              return (
              <tr key={i} className={`border-t border-apple-border/50 hover:bg-gray-50 transition-colors ${i === 0 ? 'bg-gray-50/50' : ''} ${isBest ? 'bg-apple-blue-light/40' : ''}`}>
                <td className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    {s.label}
                    {isBest && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                        Recommande
                      </span>
                    )}
                    {(() => {
                      const key = Object.keys(SCENARIO_DETAILS).find(k => s.label.startsWith(k.split(' ')[0]));
                      const detail = key ? SCENARIO_DETAILS[key] : (s.label.includes('SASU') ? {
                        desc: 'SASU a l\'IS : salaire president + dividendes. PFU 31.4% sur dividendes.',
                        formule: 'Net = Salaire net + (Benefice - IS 15/25% - PFU 31.4%) - IR France',
                      } : s.label.includes('optimal') ? {
                        desc: 'EURL IS avec split remuneration/dividendes optimise automatiquement.',
                        formule: 'Recherche du split qui maximise : rem(X) + div(CA-X-frais) - cotis - IR - IS',
                      } : s.label.includes('Micro') ? {
                        desc: 'Micro-entrepreneur BNC : charges simplifiees, plafond 83 600 EUR.',
                        formule: 'Net = CA - URSSAF 25.6% - CFP 0.2% - IR (abattement 34%)',
                      } : null);
                      return detail ? (
                        <DetailButton title={s.label}>
                          <p>{detail.desc}</p>
                          <div className="rounded-lg bg-gray-50 p-2.5 font-mono text-[11px] mt-2">
                            <div className="text-gray-400 text-[10px] mb-1">Formule</div>
                            <div className="text-apple-text">{detail.formule}</div>
                          </div>
                          <p className="mt-2">Taux de prelevement effectif : <strong>{s.taux_prelevement}%</strong> du CA</p>
                        </DetailButton>
                      ) : null;
                    })()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">{fmtMonth(s.netReel)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(s.netReel)}</td>
                <td className={`px-4 py-3 text-right tabular-nums font-semibold ${
                  s.deltaVsSalarie > 0 ? 'text-green-600' : s.deltaVsSalarie < 0 ? 'text-apple-red' : 'text-apple-gray'
                }`}>
                  {s.deltaVsSalarie === 0 ? '—' : `${s.deltaVsSalarie > 0 ? '+' : ''}${fmt(s.deltaVsSalarie)}`}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{s.taux_prelevement}%</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { TooltipItem } from 'chart.js';
import { SimParams } from '@/lib/engine';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PASS = 48_060;
const ANNEES = 30;
const TAUX_INVEST = 0.05;
const DEPENSES_ANNUELLES = 36_000;

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

function futureValue(annualSaving: number, years: number, rate: number): number {
  if (annualSaving <= 0) return 0;
  return annualSaving * ((Math.pow(1 + rate, years) - 1) / rate);
}

function calcPensionLU(salaireBrut: number): number {
  return salaireBrut * 0.018 * Math.min(ANNEES, 40);
}

function calcPensionTNS(revenuBrut: number): number {
  return Math.min(revenuBrut, PASS) * 0.012 * ANNEES + revenuBrut * 0.005 * ANNEES;
}

interface PensionChartProps {
  params: SimParams;
  salarieNet: number;
}

export function PensionChart({ params, salarieNet }: PensionChartProps) {
  // Salarie LU
  const brutEstime = salarieNet / 0.65;
  const pensionSalAn = calcPensionLU(brutEstime);
  const pensionSalMois = Math.round(pensionSalAn / 12);
  const epargneSal = Math.max(0, salarieNet - DEPENSES_ANNUELLES);
  const capitalSal = futureValue(epargneSal, ANNEES, TAUX_INVEST);

  // Freelance TNS
  const ca = params.tjm * params.jours;
  const revenuBrut = ca - 29_891;
  const cotis = revenuBrut * 0.31;
  const remNet = revenuBrut - cotis;
  const ir = remNet * 0.12;
  const netReel = remNet - ir;
  const pensionFlAn = calcPensionTNS(revenuBrut);
  const pensionFlMois = Math.round(pensionFlAn / 12);
  const epargneFl = Math.max(0, netReel - DEPENSES_ANNUELLES);
  const capitalFl = futureValue(epargneFl, ANNEES, TAUX_INVEST);

  const ecartPensionMois = pensionSalMois - pensionFlMois;
  const ecartCapital = capitalFl - capitalSal;

  return (
    <div className="rounded-2xl border border-apple-border p-5 space-y-5">
      <div>
        <h3 className="text-lg font-bold mb-1">Et la retraite, on perd combien ?</h3>
        <p className="text-xs text-gray-500">
          Hypotheses : 30 ans de cotisation, epargne investie a 5%/an, depenses 36 000 EUR/an
        </p>
      </div>

      {/* 2 side-by-side metric blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Pension mensuelle */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pension mensuelle a la retraite</div>
          <div className="overflow-x-auto"><div className="min-w-[200px] h-44">
            <Bar
              data={{
                labels: ['Salarie LU', 'Freelance TNS'],
                datasets: [{
                  data: [pensionSalMois, pensionFlMois],
                  backgroundColor: ['#86868B', '#0071E3'],
                  borderRadius: 8,
                  barPercentage: 0.5,
                }],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                indexAxis: 'y' as const,
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx: TooltipItem<'bar'>) => fmt(ctx.raw as number) + ' EUR/mois' } },
                },
                scales: {
                  x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => fmt(Number(v)) } },
                  y: { grid: { display: false } },
                },
              }}
            />
          </div></div>
          <div className="text-center">
            <span className="text-sm font-bold text-amber-800">
              Ecart : {fmt(ecartPensionMois)} EUR/mois
            </span>
            <span className="text-xs text-amber-600 block mt-0.5">
              soit {fmt(ecartPensionMois * 12 * 20)} EUR sur 20 ans de retraite
            </span>
          </div>
        </div>

        {/* Capital accumule */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">Capital accumule a 65 ans</div>
          <div className="overflow-x-auto"><div className="min-w-[200px] h-44">
            <Bar
              data={{
                labels: ['Salarie LU', 'Freelance TNS'],
                datasets: [{
                  data: [capitalSal, capitalFl],
                  backgroundColor: ['#86868B', '#0071E3'],
                  borderRadius: 8,
                  barPercentage: 0.5,
                }],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                indexAxis: 'y' as const,
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx: TooltipItem<'bar'>) => fmt(ctx.raw as number) + ' EUR' } },
                },
                scales: {
                  x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => (Number(v) / 1000000).toFixed(1) + 'M' } },
                  y: { grid: { display: false } },
                },
              }}
            />
          </div></div>
          <div className="text-center">
            <span className={`text-sm font-bold ${ecartCapital > 0 ? 'text-blue-700' : 'text-gray-600'}`}>
              {ecartCapital > 0 ? '+' : ''}{fmt(ecartCapital)} EUR en freelance
            </span>
            <span className="text-xs text-blue-600 block mt-0.5">
              grace a une capacite d&apos;epargne superieure
            </span>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-relaxed">
        <strong>A retenir :</strong> Le freelance gagne {ecartCapital > 0 ? 'plus' : 'moins'} en capital
        ({ecartCapital > 0 ? '+' : ''}{fmt(ecartCapital)} EUR) mais perd{' '}
        <strong>{fmt(ecartPensionMois)} EUR/mois</strong> de pension.
        Sur 20 ans de retraite, l&apos;ecart pension = <strong>{fmt(ecartPensionMois * 12 * 20)} EUR</strong>.
        {ecartCapital > ecartPensionMois * 12 * 20
          ? ' Le capital freelance compense la perte de pension.'
          : ' La pension LU reste l\'avantage decisif a long terme.'}
      </div>
    </div>
  );
}

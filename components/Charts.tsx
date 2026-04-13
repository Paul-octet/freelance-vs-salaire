'use client';

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { SimParams, SimResult, tjmSensitivity, simulate, splitSensitivity } from '@/lib/engine';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

// --- TJM Sensitivity Chart ---
export function TjmChart({ params }: { params: SimParams }) {
  const data = tjmSensitivity(params);

  return (
    <div className="rounded-2xl border border-apple-border p-5">
      <h3 className="text-lg font-bold mb-1">A partir de quel TJM le freelance est rentable ?</h3>
      <p className="text-xs text-apple-text-sec mb-4">Net reel annuel par statut selon le TJM ({params.jours} jours)</p>
      <div className="overflow-x-auto -mx-1"><div className="min-w-[320px] h-72 px-1">
        <Line
          data={{
            labels: data.map(d => d.tjm + ' EUR'),
            datasets: [
              {
                label: 'Salarie ESN',
                data: data.map(d => d.salarie),
                borderColor: '#86868B',
                borderDash: [8, 5],
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
              },
              {
                label: 'EURL IS 100%',
                data: data.map(d => d.eurl),
                borderColor: '#0071E3',
                borderWidth: 2.5,
                pointRadius: 0,
                fill: false,
              },
              {
                label: 'SASU IS 30K',
                data: data.map(d => d.sasu),
                borderColor: '#7C3AED',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
              },
              {
                label: 'Portage',
                data: data.map(d => d.portage),
                borderColor: '#E67700',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
              x: { grid: { display: false } },
              y: {
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { callback: v => (Number(v) / 1000).toFixed(0) + 'K' },
              },
            },
            plugins: {
              legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11, weight: 'bold' } } },
              tooltip: { callbacks: { label: ctx => ctx.dataset.label + ' : ' + fmt(ctx.raw as number) + ' EUR' } },
            },
          }}
        />
      </div></div>
    </div>
  );
}

// --- Waterfall Chart (monthly breakdown) ---
export function WaterfallChart({ params }: { params: SimParams }) {
  const result = simulate(params);
  const bd = result.eurlBreakdown;

  // Real values from engine — no approximations
  const labels = ['CA mensuel', 'Frais', 'Cotisations TNS', 'IR France', 'Ajustements', 'NET CASH'];
  const values = [bd.caMensuel, -bd.fraisMensuel, -bd.cotisMensuel, -bd.irMensuel, bd.ajustMensuel, bd.netMensuel];
  const colors: string[] = values.map(v => v >= 0 ? '#34C759' : '#FF3B30');
  colors[0] = '#0071E3';
  colors[colors.length - 1] = '#0071E3';

  return (
    <div className="rounded-2xl border border-apple-border p-5">
      <h3 className="text-lg font-bold mb-1">Ou va votre argent chaque mois ?</h3>
      <p className="text-xs text-apple-text-sec mb-4">EURL IS 100% remuneration — flux de tresorerie</p>
      <div className="overflow-x-auto -mx-1"><div className="min-w-[320px] h-64 px-1">
        <Bar
          data={{
            labels,
            datasets: [{
              data: values.map(Math.abs),
              backgroundColor: colors,
              borderRadius: 8,
              barPercentage: 0.6,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => {
                    const val = values[ctx.dataIndex];
                    return (val >= 0 ? '+' : '-') + fmt(Math.abs(val)) + ' EUR';
                  },
                },
              },
            },
            scales: {
              x: { grid: { display: false } },
              y: {
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { callback: v => fmt(Number(v)) + ' EUR' },
              },
            },
          }}
        />
      </div></div>
    </div>
  );
}

// --- Split Optimizer Chart ---
const FRAIS_TOTAL_CHART = 29_891;

export function SplitChart({ params, optimalRem }: { params: SimParams; optimalRem: number }) {
  const data = splitSensitivity(params);
  const closestIdx = data.reduce((bi, d, i, arr) =>
    Math.abs(d.rem - optimalRem) < Math.abs(arr[bi].rem - optimalRem) ? i : bi, 0
  );
  const optPoint = data[closestIdx];
  const ca = params.tjm * params.jours;

  return (
    <div className="rounded-2xl border border-apple-border p-5">
      <h3 className="text-lg font-bold mb-1">Quel split rem/dividendes pour gagner plus ?</h3>
      <p className="text-xs text-gray-600 mb-4">
        EURL IS &mdash; Net reel selon le split remuneration gerant vs dividendes.
      </p>
      <div className="overflow-x-auto -mx-1"><div className="min-w-[320px] h-72 px-1">
        <Line
          data={{
            labels: data.map(d => (d.rem / 1000).toFixed(0) + 'K'),
            datasets: [{
              label: 'Net reel annuel',
              data: data.map(d => d.netReel),
              borderColor: '#0071E3',
              backgroundColor: 'rgba(0,113,227,0.06)',
              fill: true,
              borderWidth: 2.5,
              pointRadius: data.map((_, i) => i === closestIdx ? 8 : 0),
              pointBackgroundColor: '#34C759',
              pointBorderColor: '#fff',
              pointBorderWidth: 3,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: ctx => 'Remuneration : ' + ctx[0].label + ' EUR',
                  label: ctx => 'Net reel : ' + fmt(ctx.raw as number) + ' EUR/an',
                },
              },
            },
            scales: {
              x: {
                title: { display: true, text: 'Remuneration gerant (EUR/an)', font: { weight: 'bold' as const, size: 11 } },
                grid: { display: false },
              },
              y: {
                title: { display: true, text: 'Net reel annuel (EUR)', font: { weight: 'bold' as const, size: 11 } },
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { callback: v => (Number(v) / 1000).toFixed(0) + 'K' },
              },
            },
          }}
        />
      </div></div>
      <div className="mt-4 rounded-xl bg-apple-green-light border border-apple-green/30 p-4 text-center">
        <span className="text-sm font-bold text-green-700">
          Optimum : {(optPoint.rem / 1000).toFixed(0)}K rem + {Math.max(0, Math.round((ca - FRAIS_TOTAL_CHART - optPoint.rem) / 1000))}K div
        </span>
        <span className="text-sm text-green-700"> = </span>
        <span className="text-sm font-bold text-green-700">{fmt(optPoint.netReel)} EUR net/an</span>
      </div>
    </div>
  );
}


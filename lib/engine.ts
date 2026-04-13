/**
 * FreelanceVsSalaire — Client-side fiscal engine (TypeScript port)
 * Mirrors fiscal-simulator.py V7 calculations for instant UI feedback.
 * Baremes 2026.
 */

// --- Constants ---
const PASS = 48_060;

const MICRO_TAUX_URSSAF = 0.256;
const MICRO_TAUX_ACRE = 0.128;
const MICRO_TAUX_CFP = 0.002;
const MICRO_ABATTEMENT = 0.34;
const MICRO_PLAFOND_BNC = 83_600;

const EURL_CAPITAL = 1_000;
const EURL_SEUIL_DIV_TNS = 0.10;

const IR_TRANCHES = [
  { plafond: 11_600, taux: 0.00 },
  { plafond: 29_579, taux: 0.11 },
  { plafond: 84_577, taux: 0.30 },
  { plafond: 181_917, taux: 0.41 },
  { plafond: Infinity, taux: 0.45 },
];

// Taux impot LU sur REVENU IMPOSABLE (apres cotis + abattement), classe 1 non-resident
// Calibre: imposable 73.8K → impot 17.3K → taux 23.4% (fiche de paie reelle)
const LUX_TAX_CL1: [number, number][] = [
  [30_000, 0.12], [40_000, 0.155], [50_000, 0.185],
  [60_000, 0.21], [70_000, 0.23], [75_000, 0.234],
  [85_000, 0.26], [100_000, 0.29], [120_000, 0.32], [150_000, 0.36],
];

// Classe 2 (marie/PACSe — splitting) : revenu/2, impot x2
// Utilise la table CL1 sur revenu/2 pour simuler le splitting
// Ex: imposable 100K cl2 → 50K/part → taux CL1 a 50K = 18.5% → effectif ~14.5% (economies progressivite)
const LUX_TAX_CL2: [number, number][] = [
  [30_000, 0.04], [40_000, 0.065], [50_000, 0.09],
  [60_000, 0.12], [70_000, 0.14], [75_000, 0.155],
  [85_000, 0.17], [100_000, 0.185], [120_000, 0.21], [150_000, 0.25],
];

const LUX_SOCIAL = 0.129;
const PFU_TOTAL = 0.314;
const IS_SEUIL = 42_500;

const FRAIS_TOTAL = 29_891;
const PROTECTION_BASE = 9_600;
const OPTIM_TOTAL = 6_581;
const TVA_RECOVERY = 1_748;  // TVA recuperee sur achats pro (materiel, SaaS, peages) — recherche 2026

// --- Types ---

export interface BenefitItem {
  active: boolean;
  montantMensuel: number;  // EUR/mois — editable par l'utilisateur
}

export interface EsnBenefits {
  voiture: BenefitItem;
  parking: BenefitItem;
  chequesRepas: BenefitItem;
  mutuelle: BenefitItem;
  formation: BenefitItem;
}

export const BENEFIT_DEFAULTS: Record<keyof EsnBenefits, { label: string; fichePaie: string; defaultMensuel: number }> = {
  voiture:      { label: 'Voiture de societe',        fichePaie: 'Avantage en nature vehicule',   defaultMensuel: 529 },
  parking:      { label: 'Parking',                   fichePaie: 'Fourni par l\'ESN',             defaultMensuel: 200 },
  chequesRepas: { label: 'Cheques-repas',             fichePaie: 'Part patronale cheques-repas',  defaultMensuel: 128 },
  mutuelle:     { label: 'Mutuelle employeur',        fichePaie: 'Complementaire sante',          defaultMensuel: 50 },
  formation:    { label: 'Formation / certifications', fichePaie: 'Budget formation annuel',       defaultMensuel: 125 },
};

export function benefitAnnuel(b: BenefitItem): number {
  return b.active ? b.montantMensuel * 12 : 0;
}

export function totalBenefitsAnnuel(b: EsnBenefits): number {
  return Object.values(b).reduce((sum, item) => sum + benefitAnnuel(item), 0);
}

export function totalBenefitsMensuel(b: EsnBenefits): number {
  return Object.values(b).reduce((sum, item) => sum + (item.active ? item.montantMensuel : 0), 0);
}

export interface SimParams {
  tjm: number;
  jours: number;
  parts: number;
  salaireBrutLux: number | null;
  margeEsn: number;
  classeLux: 1 | 2;
  benefits: EsnBenefits;
}

// Compute dynamic totals from user benefits
export function calcAvantagesPerdus(b: EsnBenefits): number {
  let total = 0;
  if (b.parking.active) total += b.parking.montantMensuel * 12;     // Must pay parking yourself
  if (b.formation.active) total += b.formation.montantMensuel * 12; // Must pay certifs yourself
  // Expert-comptable + logiciel compta + CFE = always lost
  total += 2_400 + 300 + 500;          // 3 200 EUR incompressibles
  return total;
}

export function calcProtection(b: EsnBenefits): number {
  let total = PROTECTION_BASE; // mutuelle 1200 + prevoyance 1800 + PER 6000 + RC pro 600
  if (b.mutuelle.active) {
    // ESN paid mutuelle → freelance must pay full (already in base)
  } else {
    // ESN didn't pay → freelance cost is same, no extra loss
  }
  return total;
}

export function calcAvantagesNet(b: EsnBenefits): number {
  // Total value of benefits the salary receives ON TOP of net
  let total = 0;
  if (b.chequesRepas.active) total += b.chequesRepas.montantMensuel * 12;
  if (b.voiture.active) total += b.voiture.montantMensuel * 12;
  return total;
}

export interface ScenarioResult {
  label: string;
  netReel: number;
  deltaVsSalarie: number;
  taux_prelevement: number;
}

export interface EurlBreakdown {
  caMensuel: number;
  fraisMensuel: number;
  cotisMensuel: number;
  irMensuel: number;
  ajustMensuel: number;
  netMensuel: number;
}

export interface SimResult {
  ca: number;
  scenarios: ScenarioResult[];
  salarieNet: number;
  bestFreelance: ScenarioResult | null;
  breakeven: number;
  optimalRem: number;
  eurlBreakdown: EurlBreakdown;
}

// --- Calculation functions ---

function calcIrFrance(revenuImposable: number, parts: number): number {
  const rpp = revenuImposable / parts;
  let impot = 0;
  let prev = 0;
  for (const { plafond, taux } of IR_TRANCHES) {
    if (rpp <= plafond) {
      impot += (rpp - prev) * taux;
      break;
    }
    impot += (plafond - prev) * taux;
    prev = plafond;
  }
  return Math.round(impot * parts);
}

function calcIs(benefice: number): number {
  if (benefice <= 0) return 0;
  if (benefice <= IS_SEUIL) return Math.round(benefice * 0.15);
  return Math.round(IS_SEUIL * 0.15 + (benefice - IS_SEUIL) * 0.25);
}

function interpolateLuxTax(brut: number, classe: 1 | 2): number {
  const table = classe === 1 ? LUX_TAX_CL1 : LUX_TAX_CL2;
  if (brut <= table[0][0]) return table[0][1];
  if (brut >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [b1, r1] = table[i];
    const [b2, r2] = table[i + 1];
    if (brut >= b1 && brut <= b2) {
      const ratio = (brut - b1) / (b2 - b1);
      return r1 + ratio * (r2 - r1);
    }
  }
  return table[table.length - 1][1];
}

function calcLuxNet(brut: number, classe: 1 | 2): number {
  // Cotisations sociales detaillees (fiche de paie LU)
  // Maladie soins 2.80% sur brut total
  const maladieSoins = brut * 0.028;
  // Maladie especes 0.25% sur traitement (hors BIK — approxime sur brut ici)
  const maladieEspeces = brut * 0.0025;
  // Pension 8.0% sur brut total (CNAP 2025, plafonnee a 5x SSM ~130K)
  const pension = brut * 0.08;
  const cotisations = maladieSoins + maladieEspeces + pension;

  // Abattement frais de deplacement (FD) — forfait ~214.50/mois = 2574/an
  const abattementFD = 2_574;

  // Revenu imposable = brut - cotisations - abattement
  const imposable = Math.max(0, brut - cotisations - abattementFD);

  // Impot LU : bareme progressif par classe (interpole)
  // La table represente le taux d'impot SUR LE REVENU IMPOSABLE, pas sur le brut
  // Recalibrons : pour 86K brut cl1, imposable ~73.8K, impot ~17.3K → taux sur imposable = 23.4%
  // Utilisons la table comme taux sur imposable (pas sur brut)
  const tauxImpot = interpolateLuxTax(imposable, classe);
  const impot = imposable * tauxImpot;

  // Assurance dependance 1.40% sur revenu imposable (base speciale ~6520/mois)
  const dependance = imposable * 0.014;

  // Net D999 = brut - cotisations - impot - dependance
  return Math.round(brut - cotisations - impot - dependance);
}

function calcCotisationsTns(revenuBrut: number): { total: number; csgDeductible: number; tauxEffectif: number } {
  if (revenuBrut <= 0) return { total: 0, csgDeductible: 0, tauxEffectif: 0 };

  // Assiette unique
  let abattement = revenuBrut * 0.26;
  abattement = Math.max(abattement, PASS * 0.0176);
  abattement = Math.min(abattement, PASS * 1.30);
  const assiette = revenuBrut - abattement;

  // Maladie
  const seuilBas = PASS * 0.40;
  const seuilHaut = PASS * 1.10;
  let maladie: number;
  if (assiette <= seuilBas) {
    const taux = 0.005 + (assiette / seuilBas) * (0.04 - 0.005);
    maladie = assiette * taux;
  } else if (assiette <= seuilHaut) {
    maladie = assiette * 0.07175;
  } else {
    maladie = assiette * 0.065;
  }

  const ij = Math.min(assiette, 5 * PASS) * 0.005;
  // AF: 0% si assiette < 110% PASS, 3.1% au-dela
  const seuilAF = PASS * 1.10;
  const af = assiette >= seuilAF ? assiette * 0.031 : 0;
  const retBase = Math.min(assiette, PASS) * 0.1775 + assiette * 0.0072;
  let retCompl = Math.min(assiette, PASS) * 0.081;
  if (assiette > PASS) retCompl += Math.min(assiette - PASS, 3 * PASS) * 0.091;
  const invDeces = Math.min(assiette, PASS) * 0.013;
  const csg = revenuBrut * 0.092;
  const crds = revenuBrut * 0.005;
  const cfp = PASS * 0.0025;

  const total = Math.round(maladie + ij + af + retBase + retCompl + invDeces + csg + crds + cfp);
  const csgDeductible = Math.round(revenuBrut * 0.068);

  return {
    total,
    csgDeductible,
    tauxEffectif: revenuBrut > 0 ? Math.round((total / revenuBrut) * 10000) / 100 : 0,
  };
}

// --- Scenario functions ---

function scenarioSalarieEsn(p: SimParams): ScenarioResult {
  const traitement = p.salaireBrutLux ?? Math.round(p.tjm * p.jours * (1 - p.margeEsn));

  // BIK voiture : ajoute au brut fiscal, mais PAS du cash
  const bikAnnuel = p.benefits.voiture.active ? p.benefits.voiture.montantMensuel * 12 : 0;
  const brutFiscal = traitement + bikAnnuel;

  // Cotisations + impot calcules sur brut fiscal (inclut BIK)
  const netAvantDeductions = calcLuxNet(brutFiscal, p.classeLux);

  // Retirer BIK (pas du cash) + chambre salaries (~35 EUR/mois)
  const chambreSalaries = 35 * 12;
  const netCash = netAvantDeductions - bikAnnuel - chambreSalaries;

  // Cheques-repas: part patronale deductee de la paie (~50 EUR/mois) mais compensee en valeur
  // Sur la fiche: debit 50 EUR mais on recoit des cheques de 150 EUR (part patronale incluse)
  // Net effect = 0 (on perd 50 EUR cash mais on gagne 150 EUR en cheques)
  // Pour simplifier: ne pas ajouter au net cash (c'est un avantage non-monetaire)

  return {
    label: 'Salarie ESN (LU)',
    netReel: Math.round(netCash),
    deltaVsSalarie: 0,
    taux_prelevement: Math.round((1 - netCash / traitement) * 10000) / 100,
  };
}

function scenarioEurl100(p: SimParams): ScenarioResult {
  const ca = p.tjm * p.jours;
  const revenuBrut = ca - FRAIS_TOTAL;
  const { total: cotis, csgDeductible } = calcCotisationsTns(revenuBrut);
  const remNet = revenuBrut - cotis;

  // IR
  const abattement10 = Math.min(remNet * 0.10, 14_171);
  const revenuImposable = remNet - abattement10 - csgDeductible;
  const ir = calcIrFrance(Math.max(0, revenuImposable), p.parts);

  const netApresIr = remNet - ir;
  const netReel = netApresIr - calcProtection(p.benefits) + OPTIM_TOTAL + TVA_RECOVERY - calcAvantagesPerdus(p.benefits);

  return {
    label: 'EURL IS 100% rem.',
    netReel: Math.round(netReel),
    deltaVsSalarie: 0,
    taux_prelevement: Math.round(((cotis + ir) / ca) * 10000) / 100,
  };
}

function scenarioSasuIs(p: SimParams, salaireNet: number): ScenarioResult {
  const ca = p.tjm * p.jours;
  const frais = FRAIS_TOTAL;
  // SASU_COUT_TOTAL_RATIO = 1.82 (net * 1.82 = cout entreprise)
  // salaire_brut = net * 1.28
  const coutSalaire = salaireNet * 1.82;
  const benefice = Math.max(0, ca - frais - coutSalaire);

  const is = calcIs(benefice);
  const dividendesBruts = Math.max(0, benefice - is);
  const pfu = Math.round(dividendesBruts * PFU_TOTAL);
  const divNet = dividendesBruts - pfu;

  // IR sur salaire: abattement 10% plafonné 14 171
  const abattement = Math.min(salaireNet * 0.10, 14_171);
  const irSalaire = calcIrFrance(Math.max(0, salaireNet - abattement), p.parts);
  const netTotal = salaireNet + divNet - irSalaire;
  const netReel = netTotal - calcProtection(p.benefits) + OPTIM_TOTAL + TVA_RECOVERY - calcAvantagesPerdus(p.benefits);

  return {
    label: `SASU IS (${Math.round(salaireNet / 1000)}K sal.)`,
    netReel: Math.round(netReel),
    deltaVsSalarie: 0,
    taux_prelevement: Math.round(((coutSalaire - salaireNet + is + pfu + irSalaire) / ca) * 10000) / 100,
  };
}

function scenarioPortage(p: SimParams): ScenarioResult {
  const ca = p.tjm * p.jours;
  const fraisGestion = ca * 0.08;
  const caApresGestion = ca - fraisGestion;
  const reserveCp = caApresGestion * 0.10;
  const base = caApresGestion - reserveCp;

  // Frais pro (max 600/mois = 7 200/an)
  const fraisPro = Math.min(7_200, base * 0.15);
  const salaireBrut = base - fraisPro;

  const chargesPatronales = salaireBrut * 0.42;
  const brutEffectif = salaireBrut - chargesPatronales;
  const chargesSalariales = brutEffectif * 0.22;
  const csgCrds = brutEffectif * 0.097;
  const net = brutEffectif - chargesSalariales - csgCrds;

  const ir = calcIrFrance(Math.max(0, net * 0.9), p.parts);
  const netApresIr = net - ir;
  // Portage : PAS de deduction protection/optim/avantages (mutuelle/prevoyance incluses, CDI)
  const netReel = netApresIr;

  return {
    label: 'Portage salarial',
    netReel: Math.round(netReel),
    deltaVsSalarie: 0,
    taux_prelevement: Math.round(((ca - netApresIr) / ca) * 10000) / 100,
  };
}

function scenarioMicro(p: SimParams): ScenarioResult | null {
  const ca = p.tjm * p.jours;
  if (ca > MICRO_PLAFOND_BNC) return null;

  const cotisations = ca * (MICRO_TAUX_URSSAF + MICRO_TAUX_CFP);
  const revenuApresCharges = ca - cotisations;

  // IR: abattement 34% sur CA
  const revenuImposable = ca * (1 - MICRO_ABATTEMENT);
  const ir = calcIrFrance(revenuImposable, p.parts);

  const netApresIr = revenuApresCharges - ir;
  const netReel = netApresIr - calcProtection(p.benefits) + OPTIM_TOTAL - calcAvantagesPerdus(p.benefits);

  return {
    label: 'Micro-entrepreneur BNC',
    netReel: Math.round(netReel),
    deltaVsSalarie: 0,
    taux_prelevement: Math.round(((cotisations + ir) / ca) * 10000) / 100,
  };
}

function scenarioEurlIsMixte(p: SimParams, remunerationNet: number = 60_000): ScenarioResult {
  const ca = p.tjm * p.jours;
  const frais = FRAIS_TOTAL;
  const budgetMax = ca - frais;

  // Cap remuneration: l'EURL ne peut pas depenser plus que CA - frais
  // Binary search for max affordable remuneration
  let cappedRem = remunerationNet;
  if (remunerationNet > 0) {
    const testCotis = calcCotisationsTns(remunerationNet);
    if (remunerationNet + testCotis.total > budgetMax) {
      // Find max rem where rem + cotis(rem) <= budgetMax
      let lo = 0, hi = budgetMax;
      for (let i = 0; i < 30; i++) {
        const mid = Math.round((lo + hi) / 2);
        const c = calcCotisationsTns(mid);
        if (mid + c.total <= budgetMax) lo = mid;
        else hi = mid;
      }
      cappedRem = lo;
    }
  }

  // Cotisations TNS progressives sur remuneration
  const cotis = calcCotisationsTns(cappedRem);
  const coutRemuneration = cappedRem + cotis.total;

  // Benefice avant IS
  const beneficeAvantIs = Math.max(0, ca - coutRemuneration - frais);
  const isMontant = calcIs(beneficeAvantIs);
  const dividendesBruts = beneficeAvantIs - isMontant;

  // Dividendes EURL IS: seuil 10% du capital (1 000 EUR capital)
  const seuilPfu = EURL_CAPITAL * EURL_SEUIL_DIV_TNS; // 100 EUR
  const divPfu = Math.min(dividendesBruts, seuilPfu);
  const divTns = Math.max(0, dividendesBruts - seuilPfu);

  // Taxation dividendes
  const taxDivPfu = Math.round(divPfu * PFU_TOTAL);
  const cotisDivTns = divTns > 0 ? calcCotisationsTns(divTns) : { total: 0, csgDeductible: 0 };
  const divTnsApresCotis = divTns - cotisDivTns.total;
  const dividendesNets = (divPfu - taxDivPfu) + divTnsApresCotis;

  // IR sur remuneration + dividendes TNS
  const revenuImposableRem = Math.max(0, cappedRem * 0.90 - cotis.csgDeductible);
  const revenuImposableDiv = Math.max(0, divTnsApresCotis * 0.60);
  const irTotal = calcIrFrance(Math.max(0, revenuImposableRem + revenuImposableDiv), p.parts);

  const netTotal = cappedRem + dividendesNets - irTotal;
  const netReel = netTotal - calcProtection(p.benefits) + OPTIM_TOTAL + TVA_RECOVERY - calcAvantagesPerdus(p.benefits);

  return {
    label: `EURL IS (${Math.round(cappedRem / 1000)}K+div)`,
    netReel: Math.round(netReel),
    deltaVsSalarie: 0,
    taux_prelevement: Math.round(((cotis.total + cotisDivTns.total + isMontant + taxDivPfu + irTotal) / ca) * 10000) / 100,
  };
}

// --- Split optimizer ---

export function findOptimalSplit(p: SimParams): { optimalRem: number; result: ScenarioResult } {
  const maxRem = Math.max(0, p.tjm * p.jours - FRAIS_TOTAL);
  let bestRem = 0;
  let bestNet = -Infinity;
  let bestResult: ScenarioResult = scenarioEurlIsMixte(p, 0);

  // Coarse search: step 5K
  for (let rem = 0; rem <= maxRem; rem += 5_000) {
    const r = scenarioEurlIsMixte(p, rem);
    if (r.netReel > bestNet) {
      bestNet = r.netReel;
      bestRem = rem;
      bestResult = r;
    }
  }
  // Fine-tune: step 1K around best
  for (let rem = Math.max(0, bestRem - 5_000); rem <= Math.min(maxRem, bestRem + 5_000); rem += 1_000) {
    const r = scenarioEurlIsMixte(p, rem);
    if (r.netReel > bestNet) {
      bestNet = r.netReel;
      bestRem = rem;
      bestResult = r;
    }
  }
  bestResult.label = `EURL IS optimal (${Math.round(bestRem / 1000)}K+div)`;
  return { optimalRem: bestRem, result: bestResult };
}

export function splitSensitivity(p: SimParams): { rem: number; netReel: number }[] {
  const maxRem = Math.max(0, p.tjm * p.jours - FRAIS_TOTAL);
  const points: { rem: number; netReel: number }[] = [];
  for (let rem = 0; rem <= maxRem; rem += 5_000) {
    const r = scenarioEurlIsMixte(p, rem);
    points.push({ rem, netReel: r.netReel });
  }
  return points;
}

// --- Main simulation ---

export function simulate(params: SimParams): SimResult {
  const ca = params.tjm * params.jours;
  const salarie = scenarioSalarieEsn(params);
  const eurl = scenarioEurl100(params);
  const sasu30 = scenarioSasuIs(params, 30_000);
  const portage = scenarioPortage(params);
  const { optimalRem, result: eurlMixte } = findOptimalSplit(params);
  const micro = scenarioMicro(params);

  const freelanceScenarios: ScenarioResult[] = [eurl, sasu30, portage, eurlMixte];
  if (micro !== null) freelanceScenarios.push(micro);

  for (const s of freelanceScenarios) {
    s.deltaVsSalarie = s.netReel - salarie.netReel;
  }

  const best = freelanceScenarios.reduce((a, b) => a.netReel > b.netReel ? a : b);

  // Break-even: binary search for TJM where EURL = salarie
  let lo = 300, hi = 2000;
  for (let i = 0; i < 30; i++) {
    const mid = Math.round((lo + hi) / 2);
    const test = scenarioEurl100({ ...params, tjm: mid });
    if (test.netReel < salarie.netReel) lo = mid;
    else hi = mid;
  }
  const breakeven = Math.round((lo + hi) / 2);

  // EURL 100% waterfall breakdown — real values from scenarioEurl100 internals
  const revenuBrut = ca - FRAIS_TOTAL;
  const { total: eurlCotis, csgDeductible } = calcCotisationsTns(revenuBrut);
  const eurlRemNet = revenuBrut - eurlCotis;
  const eurlAbatt = Math.min(eurlRemNet * 0.10, 14_171);
  const eurlIr = calcIrFrance(Math.max(0, eurlRemNet - eurlAbatt - csgDeductible), params.parts);
  const ajust = OPTIM_TOTAL + TVA_RECOVERY - calcProtection(params.benefits) - calcAvantagesPerdus(params.benefits);

  const eurlBreakdown: EurlBreakdown = {
    caMensuel: Math.round(ca / 12),
    fraisMensuel: Math.round(FRAIS_TOTAL / 12),
    cotisMensuel: Math.round(eurlCotis / 12),
    irMensuel: Math.round(eurlIr / 12),
    ajustMensuel: Math.round(ajust / 12),
    netMensuel: Math.round(eurl.netReel / 12),
  };

  const allScenarios = [salarie, ...freelanceScenarios];

  return {
    ca,
    scenarios: allScenarios,
    salarieNet: salarie.netReel,
    bestFreelance: best.deltaVsSalarie > 0 ? best : null,
    breakeven,
    optimalRem,
    eurlBreakdown,
  };
}

// --- TJM sensitivity ---

export function tjmSensitivity(params: SimParams, range: number[] = []): { tjm: number; salarie: number; eurl: number; sasu: number; portage: number }[] {
  if (range.length === 0) {
    range = [500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1100, 1200];
  }
  return range.map(tjm => {
    const p = { ...params, tjm };
    const r = simulate(p);
    // scenarios: [salarie, eurl, sasu30, portage, eurlMixte, micro?]
    const find = (label: string) => r.scenarios.find(s => s.label.startsWith(label))?.netReel ?? 0;
    return {
      tjm,
      salarie: r.scenarios[0].netReel,
      eurl: find('EURL IS 100%'),
      sasu: find('SASU IS'),
      portage: find('Portage'),
    };
  });
}

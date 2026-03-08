let state = {
  snapshots: { older: [], newer: [] },
  market: { byCode: {}, source: '', snapshotDate: '', marketDate: '', marketPrevDate: '' },
  notasi: { byCode: {}, source: '', asOf: '' },
  sector: { byCode: {}, source: '', asOf: '' },
  freeFloat: { byCode: {}, source: '', snapshotDate: '', warning: '' },
  stocks: [],
  whales: [],
  movements: [],
  relations: [],
  filteredStocks: [],
  filteredWhales: [],
  filteredMovements: [],
  filteredRelations: [],
  minPct: 0,
  search: '',
  relationFilter: {
    type: 'all',
    origin: 'all',
    group: 'all',
    ticker: '',
    entity: '',
    issuer: '',
    pctMin: 0,
    pctMax: 100,
    minEntityLinks: 1,
    minTickerLinks: 1,
    bridgeOnly: false,
    graphFocusType: 'all',
    graphFocusValue: '',
    graphEdgeLimit: 120,
  },
  whaleFilter: {
    type: 'all',
    origin: 'all',
    minAssets: 1,
    multiOnly: false,
  },
  stockFilter: {
    sort: 'az',
    sector: 'all',
    notasi: 'all',
    floatRatio: 'all',
  },
  ecoFilter: {
    role: 'all',
  },
  networkTableHidden: true,
  openStocks: new Set(),
  openWhales: new Set(),
  openEcoCards: new Set(),
};

let stockHoldersMap = new Map();
let investorStocksMap = new Map();
let networkNavStack = [];
let networkNavIndex = -1;
let notasiGuideByCode = {};
let empireLeaderboardMode = 'top10';

const TYPE_META = {
  CP: { label: 'Corporate', group: 'corp', desc: 'Corporate / company entity' },
  ID: { label: 'Individual', group: 'person', desc: 'Individual investor' },
  MF: { label: 'Mutual Fund', group: 'fund', desc: 'Mutual fund / investment fund' },
  PF: { label: 'Pension Fund', group: 'fund', desc: 'Pension fund institution' },
  IB: { label: 'Investment Bank', group: 'inst', desc: 'Investment bank / broker-dealer' },
  IS: { label: 'Insurance', group: 'inst', desc: 'Insurance institution' },
  SC: { label: 'Securities', group: 'inst', desc: 'Securities company' },
  BK: { label: 'Bank', group: 'inst', desc: 'Banking institution' },
  FD: { label: 'Foundation', group: 'other', desc: 'Foundation / trustee-style holder' },
  GV: { label: 'Government', group: 'other', desc: 'Government / state related holder' },
  OT: { label: 'Other', group: 'other', desc: 'Other institution type' },
};

const EMPIRE_OTHER = 'Independent / Other';
const empireMapOverrides = {};
let empireSuggestionThreshold = 75;
const EMPIRE_OVERRIDE_STORAGE_KEY = 'postracking_empire_map_overrides_v1';
const NETWORK_INFO_PREF_STORAGE_KEY = 'postracking_network_info_minimized_v1';
const EMPIRE_GROUP_CANONICAL = {
  'SINAR MAS': 'Sinarmas Group',
  'SINARMAS': 'Sinarmas Group',
  'SINARMAS GROUP': 'Sinarmas Group',
  'BARITO PACIFIC': 'Barito Group',
  'BARITO': 'Barito Group',
  'BARITO GROUP PRAJOGO PANGESTU': 'Barito Group',
  'SARATOGA': 'Saratoga Group',
  'SARATOGA GROUP': 'Saratoga Group',
  'ASTRA': 'Astra Group',
  'ASTRA GROUP': 'Astra Group',
  'EMTEK': 'EMTEK Group',
  'EMTEK GROUP': 'EMTEK Group',
  'MNC': 'MNC Group',
  'MNC GROUP': 'MNC Group',
  'LIPPO': 'Lippo Group',
  'LIPPO GROUP': 'Lippo Group',
  'CT CORP': 'CT Corp',
  'CT CORPORA': 'CT Corp',
  'BAYAN RESOURCES': 'Bayan Resources Group',
  'BAKRIE': 'Bakrie Group',
  'DJARUM': 'Djarum Group',
  'GO TO GROUP': 'GoTo Group',
  'GOTO GROUP': 'GoTo Group',
  'STATE': 'State / Sovereign Entities',
  'SOVEREIGN': 'State / Sovereign Entities',
  'BUMN': 'State / Sovereign Entities',
  'PERSERO': 'State / Sovereign Entities',
  'DANANTARA': 'State / Sovereign Entities',
  'BPJS': 'State / Sovereign Entities',
};
const GROUP_ALIAS_HINTS = {
  SALIM: 'Salim Group',
  INDOFOOD: 'Salim Group',
  BARITO: 'Barito Group',
  SARATOGA: 'Saratoga Group',
  SINARMAS: 'Sinarmas Group',
  ASTRA: 'Astra Group',
  DJARUM: 'Djarum Group',
  LIPPO: 'Lippo Group',
  MAYAPADA: 'Mayapada Group',
  BAKRIE: 'Bakrie Group',
  MNC: 'MNC Group',
  EMTEK: 'EMTEK Group',
  AVIAN: 'Avian Group',
  PANIN: 'Panin Group',
  VICTORIA: 'Victoria Group',
  KALLA: 'Kalla Group',
  MAYORA: 'Mayora Group',
  WINGS: 'Wings Group',
  HARITA: 'Harita Group',
  INDIKA: 'Indika Group',
  TRIPUTRA: 'Triputra Group',
  'GUNUNG SEWU': 'Gunung Sewu Group',
  PAKUWON: 'Pakuwon Group',
  RAJAWALI: 'Rajawali Group',
  BUKALAPAK: 'Bukalapak Group',
  GOTO: 'GoTo Group',
  'GO TO': 'GoTo Group',
  DCI: 'DCI Group',
  MODERN: 'Modern Group',
  PROVIDENT: 'Provident Group',
  PAM: 'PAM Group',
  DEXA: 'Dexa Group',
  IMPACK: 'Impack Group',
  'J RESOURCES': 'J Resources Group',
  ULTRAJAYA: 'Ultrajaya Group',
  BUMN: 'State / Sovereign Entities',
  PERSERO: 'State / Sovereign Entities',
  DANANTARA: 'State / Sovereign Entities',
  BPJS: 'State / Sovereign Entities',
  SOVEREIGN: 'State / Sovereign Entities',
  NEGARA: 'State / Sovereign Entities',
  KEJAKSAAN: 'State / Sovereign Entities',
  JAKSA: 'State / Sovereign Entities',
  KEMENTERIAN: 'State / Sovereign Entities',
  PEMERINTAH: 'State / Sovereign Entities',
  BPKH: 'State / Sovereign Entities',
  LPS: 'State / Sovereign Entities',
};

function normalizeEmpireLookupKey(v) {
  return String(v || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function canonicalizeEmpireGroup(groupName) {
  const raw = String(groupName || '').trim();
  if (!raw) return '';
  const norm = normalizeEmpireLookupKey(raw);
  return EMPIRE_GROUP_CANONICAL[norm] || raw;
}

function resolveGroupFromHintText(text) {
  const norm = normalizeEmpireLookupKey(text || '');
  if (!norm) return '';
  for (const [token, group] of Object.entries(GROUP_ALIAS_HINTS)) {
    if (norm.includes(token)) return canonicalizeEmpireGroup(group);
  }
  const direct = canonicalizeEmpireGroup(text || '');
  if (direct && direct !== String(text || '').trim()) return direct;
  return '';
}

function getEmpireGroupFromMapObject(mapObj, investorKey, investorName) {
  if (!mapObj) return '';
  const rawKey = String(investorKey || '').trim().toUpperCase();
  const rawName = String(investorName || '').trim().toUpperCase();
  if (rawKey && mapObj[rawKey]) return canonicalizeEmpireGroup(mapObj[rawKey]);
  if (rawName && mapObj[rawName]) return canonicalizeEmpireGroup(mapObj[rawName]);
  const normKey = normalizeEmpireLookupKey(investorKey);
  const normName = normalizeEmpireLookupKey(investorName);
  if (normKey && mapObj[normKey]) return canonicalizeEmpireGroup(mapObj[normKey]);
  if (normName && mapObj[normName]) return canonicalizeEmpireGroup(mapObj[normName]);
  return '';
}

function setEmpireOverride(investorKey, investorName, groupName) {
  const group = canonicalizeEmpireGroup(groupName);
  if (!group) return;
  const candidates = [
    String(investorKey || '').trim().toUpperCase(),
    String(investorName || '').trim().toUpperCase(),
    normalizeEmpireLookupKey(investorKey),
    normalizeEmpireLookupKey(investorName),
  ].filter(Boolean);
  candidates.forEach((k) => {
    empireMapOverrides[k] = group;
  });
  saveEmpireOverridesToMemory();
}

function clearEmpireOverrides() {
  Object.keys(empireMapOverrides).forEach((k) => {
    delete empireMapOverrides[k];
  });
  saveEmpireOverridesToMemory();
}

function removeEmpireOverrideGroup(baseKey, groupName) {
  const base = normalizeEmpireLookupKey(baseKey);
  const group = canonicalizeEmpireGroup(groupName);
  Object.entries(empireMapOverrides).forEach(([k, v]) => {
    const sameBase = normalizeEmpireLookupKey(k) === base;
    const sameGroup = canonicalizeEmpireGroup(v) === group;
    if (sameBase && sameGroup) delete empireMapOverrides[k];
  });
  saveEmpireOverridesToMemory();
}

function getEmpireOverridesCount() {
  return Object.keys(empireMapOverrides).length;
}

function saveEmpireOverridesToMemory() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(EMPIRE_OVERRIDE_STORAGE_KEY, JSON.stringify(empireMapOverrides));
  } catch {}
}

function loadEmpireOverridesFromMemory() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    const raw = window.localStorage.getItem(EMPIRE_OVERRIDE_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return 0;
    let loaded = 0;
    Object.entries(parsed).forEach(([k, v]) => {
      const key = String(k || '').trim();
      const group = canonicalizeEmpireGroup(v);
      if (!key || !group) return;
      empireMapOverrides[key] = group;
      loaded += 1;
    });
    return loaded;
  } catch {
    return 0;
  }
}

function clearEmpireOverridesMemory() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(EMPIRE_OVERRIDE_STORAGE_KEY);
  } catch {}
}

function readNetworkInfoMinimizedPref() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return true;
    const raw = window.sessionStorage.getItem(NETWORK_INFO_PREF_STORAGE_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

function saveNetworkInfoMinimizedPref(minimized) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.setItem(NETWORK_INFO_PREF_STORAGE_KEY, minimized ? '1' : '0');
  } catch {}
}

function exportEmpireOverridesMemory() {
  try {
    const payload = {
      exported_at: new Date().toISOString(),
      key: EMPIRE_OVERRIDE_STORAGE_KEY,
      items: empireMapOverrides,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `empire_mapping_overrides_${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function importEmpireOverridesMemoryFromObject(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  const items = (obj.items && typeof obj.items === 'object') ? obj.items : obj;
  let imported = 0;
  Object.entries(items).forEach(([k, v]) => {
    const key = String(k || '').trim();
    const group = canonicalizeEmpireGroup(v);
    if (!key || !group) return;
    empireMapOverrides[key] = group;
    imported += 1;
  });
  if (imported > 0) saveEmpireOverridesToMemory();
  return imported;
}

function refreshEmpireAssignments() {
  if (!Array.isArray(state.relations) || !state.relations.length) return;
  syncNetworkMappingsWithPriority();
  populateRelationFilterOptions();
}

function categorizeStateSovereignEntity(investorName = '', investorKey = '') {
  const text = normalizeEmpireLookupKey(`${investorName} ${investorKey}`);
  if (!text) return 'Other State Entity';
  if (text.includes('DANANTARA')) return 'Danantara';
  if (text.includes('BPJS')) return 'BPJS';
  if (text.includes('KEJAKSAAN') || text.includes('JAKSA')) return 'Kejaksaan';
  if (text.includes('KEMENTERIAN') || text.includes('KEMEN')) return 'Kementerian';
  if (text.includes('PEMERINTAH') || text.includes('PEMDA') || text.includes('PROVINSI') || text.includes('KABUPATEN') || text.includes('KOTA')) return 'Pemerintah';
  if (text.includes('BPKH')) return 'BPKH';
  if (text.includes('LPS')) return 'LPS';
  if (text.includes('BUMN') || text.includes('PERSERO')) return 'BUMN/Persero';
  return 'Other State Entity';
}

function resolveEmpireGroup(investorKey, investorName, withFallback = true) {
  const fromOverride = getEmpireGroupFromMapObject(empireMapOverrides, investorKey, investorName);
  if (fromOverride) return fromOverride;
  const fromBase = getEmpireGroupFromMapObject(
    (typeof EMPIRE_MAP === 'undefined' || !EMPIRE_MAP) ? null : EMPIRE_MAP,
    investorKey,
    investorName
  );
  if (fromBase) return fromBase;
  return withFallback ? EMPIRE_OTHER : '';
}

function resolvePoliticalHintGroup(investorName = '', investorKey = '') {
  const risk = getRiskEntity(investorName || investorKey || '');
  if (!risk) return '';
  const tagHints = Array.isArray(risk.tags) ? risk.tags : [];
  for (const t of tagHints) {
    const g = resolveGroupFromHintText(t);
    if (g) return g;
  }
  const noteHint = resolveGroupFromHintText(String(risk.notes || ''));
  if (noteHint) return noteHint;
  return '';
}

function buildUniqueEcosystemTickerGroupMap() {
  const map = new Map();
  const ambiguous = new Set();
  if (typeof EcosystemSectors === 'undefined' || !Array.isArray(EcosystemSectors)) return map;
  EcosystemSectors.forEach((eco) => {
    const groupName = resolveGroupFromHintText(String(eco?.sector_name || '').trim()) || canonicalizeEmpireGroup(String(eco?.sector_name || '').trim());
    if (!groupName) return;
    const allTickers = [...(eco.flagship_tickers || []), ...(eco.satellite_tickers || [])];
    allTickers.forEach((t) => {
      const ticker = String(t || '').trim().toUpperCase();
      if (!ticker) return;
      if (!map.has(ticker)) {
        map.set(ticker, groupName);
        return;
      }
      if (map.get(ticker) !== groupName) ambiguous.add(ticker);
    });
  });
  ambiguous.forEach((t) => map.delete(t));
  return map;
}

function resolveNetworkEmpireGroupByPriority(row = {}, ecosystemTickerGroupMap = null) {
  const fromConglomerate = resolveEmpireGroup(row.investor_key, row.investor_name, false);
  if (fromConglomerate) return fromConglomerate;
  const ecoMap = ecosystemTickerGroupMap || buildUniqueEcosystemTickerGroupMap();
  const ticker = String(row.share_code || '').trim().toUpperCase();
  const fromEco = ticker ? ecoMap.get(ticker) : '';
  if (fromEco) return fromEco;
  const fromPolitical = resolvePoliticalHintGroup(row.investor_name, row.investor_key);
  if (fromPolitical) return fromPolitical;
  const fromNetworkRow = canonicalizeEmpireGroup(row.empire_group || '');
  if (fromNetworkRow && fromNetworkRow !== EMPIRE_OTHER) return fromNetworkRow;
  return EMPIRE_OTHER;
}

function syncNetworkMappingsWithPriority() {
  if (!Array.isArray(state.relations) || !state.relations.length) return false;
  const ecoMap = buildUniqueEcosystemTickerGroupMap();
  let changed = false;
  state.relations = state.relations.map((r) => {
    const syncedGroup = resolveNetworkEmpireGroupByPriority(r, ecoMap);
    if (syncedGroup !== r.empire_group) changed = true;
    return { ...r, empire_group: syncedGroup };
  });
  return changed;
}

function esc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatNum(n) { return Number(n || 0).toLocaleString('en-US'); }

function normalizeSearchText(v) {
  return String(v || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function includesNormalized(haystack, needle) {
  const n = normalizeSearchText(needle);
  if (!n) return true;
  return normalizeSearchText(haystack).includes(n);
}

function renderWhaleTopItems(items, itemType = 'name') {
  if (!items || !items.length) {
    return '<span class="whale-pill whale-pill-empty">-</span>';
  }
  return items.map(item => {
    if (itemType === 'ticker') {
      return `<span class="whale-pill whale-pill-ticker">${esc(item)}</span>`;
    }
    return `<span class="whale-pill">${esc(item)}</span>`;
  }).join('');
}

function parseYmdDate(v) {
  const s = String(v || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const dt = new Date(`${s}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatTanggalIndo(v) {
  const dt = parseYmdDate(v);
  if (!dt) return '-';
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${dt.getDate()} ${bulan[dt.getMonth()]} ${dt.getFullYear()}`;
}

function formatBulanTahunIndo(v) {
  const dt = parseYmdDate(v);
  if (!dt) return '-';
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${bulan[dt.getMonth()]} ${dt.getFullYear()}`;
}

function formatDmy(v) {
  const dt = parseYmdDate(v);
  if (!dt) return '-';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yy = dt.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function formatMonthYY(v) {
  const dt = parseYmdDate(v);
  if (!dt) return '-';
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yy = String(dt.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

function getTypeMeta(code) {
  const c = String(code || '').toUpperCase();
  return TYPE_META[c] || { label: c || 'Unknown', group: 'other', desc: c ? `Type code: ${c}` : 'Unknown type' };
}

function typeBadge(type) {
  const code = String(type || '').toUpperCase();
  const meta = getTypeMeta(code);
  const label = code ? `${meta.label} (${code})` : meta.label;
  return `<span class="type-tag type-${meta.group}" title="${esc(meta.desc)}">${esc(label)}</span>`;
}

function getRiskEntity(name) {
  if (typeof HighRiskEntities === 'undefined' || !name) return null;
  if (HighRiskEntities[name]) return HighRiskEntities[name];
  const upper = String(name).trim().toUpperCase();
  if (HighRiskEntities[upper]) return HighRiskEntities[upper];
  const norm = normalizeEmpireLookupKey(upper);
  if (!norm) return null;
  if (HighRiskEntities[norm]) return HighRiskEntities[norm];
  const keys = Object.keys(HighRiskEntities);
  for (const k of keys) {
    const kNorm = normalizeEmpireLookupKey(k);
    if (!kNorm) continue;
    if (kNorm === norm) return HighRiskEntities[k];
  }
  return null;
}

function getRiskBadge(name) {
  const risk = getRiskEntity(name);
  if (!risk) return '';
  const isHigh = String(risk.risk_level || '').toLowerCase() === 'high';
  const cls = isHigh ? 'risk-high' : 'risk-medium';
  const label = isHigh ? 'High Risk' : 'Medium Risk';
  return `<span class="risk-chip ${cls}" title="${esc(risk.notes || '')}">${label}</span>`;
}

function renderEmpireMapBadge(investorName, investorKey = '', opts = {}) {
  const shareCode = String(opts.shareCode || '').toUpperCase();
  const group = resolveNetworkEmpireGroupByPriority({
    investor_name: investorName,
    investor_key: investorKey,
    share_code: shareCode,
  });
  if (!group) return '';
  if (group === EMPIRE_OTHER && !opts.showOther) return '';
  const compact = Boolean(opts.compact);
  const cls = compact ? 'empire-map-chip compact' : 'empire-map-chip';
  return `<span class="${cls}" title="Empire Mapping">${esc(group)}</span>`;
}

function renderEmpireMapDot(investorName, investorKey = '', opts = {}) {
  const shareCode = String(opts.shareCode || '').toUpperCase();
  const group = resolveNetworkEmpireGroupByPriority({
    investor_name: investorName,
    investor_key: investorKey,
    share_code: shareCode,
  });
  if (!group || group === EMPIRE_OTHER) return '';
  return `<span class="empire-map-dot" title="Empire Mapping: ${esc(group)}" aria-label="Empire Mapping: ${esc(group)}"></span>`;
}

function parseJsonFile(inputEl) {
  return new Promise((resolve, reject) => {
    const file = inputEl.files[0];
    if (!file) return resolve([]);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        resolve(Array.isArray(data) ? data : []);
      } catch (err) {
        reject(new Error(`Invalid JSON: ${file.name}`));
      }
    };
    reader.onerror = () => reject(new Error(`Cannot read file: ${file.name}`));
    reader.readAsText(file);
  });
}

function parseOptionalObjectFile(inputEl) {
  return new Promise((resolve, reject) => {
    const file = inputEl?.files?.[0];
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        resolve(data);
      } catch (err) {
        reject(new Error(`Invalid JSON: ${file.name}`));
      }
    };
    reader.onerror = () => reject(new Error(`Cannot read file: ${file.name}`));
    reader.readAsText(file);
  });
}

async function fetchJsonFile(path) {
  try {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(`${path}${sep}v=${Date.now()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function loadMarketByScript(path) {
  return new Promise((resolve) => {
    const key = `__MARKET_DATA_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const script = document.createElement('script');
    script.src = `${path}${path.includes('?') ? '&' : '?'}v=${Date.now()}&k=${key}`;
    script.async = true;
    script.onload = () => {
      const payload = window[key] || null;
      try { delete window[key]; } catch {}
      script.remove();
      resolve(payload);
    };
    script.onerror = () => {
      try { delete window[key]; } catch {}
      script.remove();
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

async function autoLoadMarketFile(snapshotDate) {
  const isFileProtocol = String(window.location.protocol || '').toLowerCase() === 'file:';
  if (!isFileProtocol) {
    const qs = new URLSearchParams();
    if (snapshotDate) qs.set('snapshot_date', snapshotDate);
    try {
      const res = await fetch(`/api/market_1d?${qs.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload && (Array.isArray(payload.items) || Array.isArray(payload))) {
          return { payload, path: '/api/market_1d' };
        }
      }
    } catch {}
  }

  const candidates = [];
  if (snapshotDate) {
    candidates.push({ json: `data/store/market/changes_${snapshotDate}.json`, js: `data/store/market/changes_${snapshotDate}.js` });
  }
  candidates.push({ json: 'data/store/market/changes_latest.json', js: 'data/store/market/changes_latest.js' });

  for (const c of candidates) {
    if (!isFileProtocol) {
      const payload = await fetchJsonFile(c.json);
      if (payload) return { payload, path: c.json };
    }
    const payloadByScript = await loadMarketByScript(c.js);
    if (payloadByScript) return { payload: payloadByScript, path: c.js };
  }
  return { payload: null, path: '' };
}

async function autoLoadNotasiFile() {
  const candidates = [
    { json: 'data/store/notasi/notasi_latest.json', js: 'data/store/notasi/notasi_latest.js' },
    { json: 'Notasi/notasi_latest.json', js: 'Notasi/notasi_latest.js' },
  ];
  const isFileProtocol = String(window.location.protocol || '').toLowerCase() === 'file:';
  for (const c of candidates) {
    if (!isFileProtocol) {
      const payload = await fetchJsonFile(c.json);
      if (payload) return { payload, path: c.json };
    }
    const payloadByScript = await loadMarketByScript(c.js);
    if (payloadByScript) return { payload: payloadByScript, path: c.js };
  }
  return { payload: null, path: '' };
}

async function autoLoadFreeFloatFile(snapshotDate) {
  const candidates = [];
  if (snapshotDate) {
    candidates.push({
      json: `data/store/free_float/estimated_free_float_${snapshotDate}.json`,
      js: `data/store/free_float/estimated_free_float_${snapshotDate}.js`,
    });
  }
  candidates.push({
    json: "data/store/free_float/estimated_free_float_latest.json",
    js: "data/store/free_float/estimated_free_float_latest.js",
  });
  const isFileProtocol = String(window.location.protocol || '').toLowerCase() === 'file:';
  for (const c of candidates) {
    if (!isFileProtocol) {
      const payload = await fetchJsonFile(c.json);
      if (payload) return { payload, path: c.json };
    }
    const payloadByScript = await loadMarketByScript(c.js);
    if (payloadByScript) return { payload: payloadByScript, path: c.js };
  }
  return { payload: null, path: "" };
}

function normalizeFilePath(path) {
  return String(path || '').replace(/\\/g, '/').trim();
}

async function autoLoadSnapshots() {
  const indexCandidates = ['data/store/snapshot_index.json', 'snapshot_index.json'];
  let indexPayload = null;
  for (const path of indexCandidates) {
    const payload = await fetchJsonFile(path);
    if (Array.isArray(payload) && payload.length) {
      indexPayload = payload;
      break;
    }
  }
  if (!Array.isArray(indexPayload) || !indexPayload.length) {
    return { newerRows: [], olderRows: [], newerPath: '', olderPath: '' };
  }

  const sorted = [...indexPayload]
    .filter((row) => row && typeof row === 'object')
    .sort((a, b) => String(b.snapshot_date || '').localeCompare(String(a.snapshot_date || '')));
  const newest = sorted[0] || null;
  const older = sorted[1] || null;
  const newerPath = normalizeFilePath(newest?.snapshot_file || `data/store/snapshots/positions_${newest?.snapshot_date || ''}.json`);
  const olderPath = normalizeFilePath(older?.snapshot_file || (older?.snapshot_date ? `data/store/snapshots/positions_${older.snapshot_date}.json` : ''));

  const newerPayload = newerPath ? await fetchJsonFile(newerPath) : null;
  const olderPayload = olderPath ? await fetchJsonFile(olderPath) : null;
  const newerRows = Array.isArray(newerPayload) ? newerPayload : [];
  const olderRows = Array.isArray(olderPayload) ? olderPayload : [];
  return { newerRows, olderRows, newerPath, olderPath };
}

function buildMarketMap(payload) {
  if (!payload) return { byCode: {}, source: '', snapshotDate: '', marketDate: '', marketPrevDate: '' };
  const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
  const byCode = {};
  items.forEach((row) => {
    const code = String(row.share_code || '').toUpperCase();
    if (!code) return;
    byCode[code] = row;
  });
  return {
    byCode,
    source: String(payload.source || ''),
    snapshotDate: String(payload.snapshot_date || ''),
    marketDate: String(payload.market_date || ''),
    marketPrevDate: String(payload.market_prev_date || ''),
  };
}

function buildNotasiMap(payload) {
  if (!payload) return { byCode: {}, source: '', asOf: '' };
  const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
  const byCode = {};
  items.forEach((row) => {
    const code = String(row.share_code || '').toUpperCase();
    if (!code) return;
    byCode[code] = row;
  });
  return {
    byCode,
    source: String(payload.source || ''),
    asOf: String(payload.as_of || ''),
  };
}

function getNotasiInfo(shareCode) {
  const code = String(shareCode || '').toUpperCase();
  const row = state.notasi.byCode?.[code];
  if (!row) return null;
  const codes = Array.isArray(row.notasi_codes) ? row.notasi_codes : [];
  const descs = Array.isArray(row.notasi_desc) ? row.notasi_desc : [];
  return { codes, descs };
}

function renderNotasiBadges(shareCode) {
  const info = getNotasiInfo(shareCode);
  if (!info || !info.codes.length) return '';
  return info.codes.map((c, i) => {
    const desc = info.descs[i] || '';
    return `<span class="notasi-badge" title="${esc(desc)}">${esc(c)}</span>`;
  }).join('');
}

function buildSectorMap(payload) {
  if (!payload) return { byCode: {}, source: '', asOf: '' };
  const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
  const byCode = {};
  items.forEach((row) => {
    const code = String(row.share_code || '').toUpperCase();
    if (!code) return;
    byCode[code] = row;
  });
  return {
    byCode,
    source: String(payload.source || ''),
    asOf: String(payload.as_of || ''),
  };
}

function buildFreeFloatMap(payload) {
  if (!payload) return { byCode: {}, source: '', snapshotDate: '', warning: '' };
  const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
  const byCode = {};
  items.forEach((row) => {
    const code = String(row.share_code || '').toUpperCase();
    if (!code) return;
    byCode[code] = row;
  });
  return {
    byCode,
    source: String(payload.method || payload.source || ''),
    snapshotDate: String(payload.snapshot_date || ''),
    warning: String(payload.warning || ''),
  };
}

function updateLoadStatusBoard(olderRows = state.snapshots.older, newerRows = state.snapshots.newer) {
  const oldDate = olderRows[0]?.snapshot_date || '-';
  const newDate = newerRows[0]?.snapshot_date || '-';
  const marketLoaded = Object.keys(state.market.byCode || {}).length;
  const disclosureDate = newDate !== '-' ? newDate : oldDate;
  const marketDate = state.market.marketDate || state.market.snapshotDate || disclosureDate;
  const disclosureMonthYear = formatMonthYY(disclosureDate);
  const loadStatusEl = document.getElementById('loadStatus');
  if (loadStatusEl) {
    const marketInfo = marketLoaded ? formatDmy(marketDate) : '-';
    const disclosureInfo = disclosureDate !== '-' ? disclosureMonthYear : '-';
    const status1dEl = document.getElementById('status1dValue');
    const statusDisclosureEl = document.getElementById('statusDisclosureValue');
    if (status1dEl && statusDisclosureEl) {
      status1dEl.textContent = marketInfo;
      statusDisclosureEl.textContent = disclosureInfo;
    } else {
      loadStatusEl.innerHTML = `
        <div class="status-item">
          <div class="status-label">1D :</div>
          <div class="status-value">${esc(marketInfo)}</div>
        </div>
        <div class="status-item">
          <div class="status-label">KI :</div>
          <div class="status-value">${esc(disclosureInfo)}</div>
        </div>
      `;
    }
  }
}

async function loadSnapshotsData({ olderRaw = [], newerRaw = [], marketRaw = null, notasiRaw = null, freeFloatRaw = null, closeModal = true } = {}) {
  const olderRows = dedupeRows(Array.isArray(olderRaw) ? olderRaw : []);
  const newerRows = dedupeRows(Array.isArray(newerRaw) ? newerRaw : []);
  if (!newerRows.length && !olderRows.length) {
    throw new Error('No snapshot data loaded. Provide at least Snapshot Baru.');
  }

  if (!marketRaw) {
    const snapshotDateForMarket = newerRows[0]?.snapshot_date || olderRows[0]?.snapshot_date || '';
    const autoResult = await autoLoadMarketFile(snapshotDateForMarket);
    marketRaw = autoResult.payload;
  }
  if (!notasiRaw) {
    const autoNotasi = await autoLoadNotasiFile();
    notasiRaw = autoNotasi.payload;
  }
  const snapshotDate = newerRows[0]?.snapshot_date || olderRows[0]?.snapshot_date || '';
  if (!freeFloatRaw) {
    const autoFreeFloat = await autoLoadFreeFloatFile(snapshotDate);
    freeFloatRaw = autoFreeFloat.payload;
  }

  state.snapshots.older = olderRows;
  state.snapshots.newer = newerRows;
  state.market = buildMarketMap(marketRaw);
  state.notasi = buildNotasiMap(notasiRaw);
  state.sector = buildSectorMap(window.SECTOR_HARDCODED || null);
  state.freeFloat = buildFreeFloatMap(freeFloatRaw);

  const base = newerRows.length ? newerRows : olderRows;
  state.stocks = buildStocks(base);
  state.whales = buildWhales(base);
  state.movements = (olderRows.length && newerRows.length) ? buildMovements(olderRows, newerRows) : [];
  state.relations = buildRelations(base);
  buildNetworkMaps(base);
  populateRelationFilterOptions();
  populateWhaleFilterOptions();
  populateStockSectorFilter();

  updateLoadStatusBoard(olderRows, newerRows);

  state.openStocks.clear();
  state.openWhales.clear();
  state.openEcoCards.clear();
  renderAll();

  const dataModal = document.getElementById('dataInputModal');
  if (closeModal && dataModal) dataModal.classList.add('hidden');
}

async function bootWithAutoLoad() {
  const auto = await autoLoadSnapshots();
  if (!auto.newerRows.length && !auto.olderRows.length) return false;
  await loadSnapshotsData({
    olderRaw: auto.olderRows,
    newerRaw: auto.newerRows,
    closeModal: true,
  });
  return true;
}

function getFreeFloatInfo(shareCode) {
  const code = String(shareCode || '').toUpperCase();
  const row = state.freeFloat.byCode?.[code];
  if (!row) return null;
  const ratio = Number(row.estimated_free_float_ratio_pct);
  if (Number.isNaN(ratio)) return null;
  return {
    ratio,
    shares: Number(row.estimated_free_float_shares || 0),
    source: String(row.listed_share_source || ''),
    observedCount: Number(row.observed_under5_holder_count || 0),
    note: String(row.method_note || ''),
  };
}

function renderFreeFloatInline(shareCode) {
  const ff = getFreeFloatInfo(shareCode);
  if (!ff) return '';
  const title = `Est. Free Float ${Number(ff.ratio || 0).toFixed(2)}% | ${formatNum(ff.shares)} shares | src ${ff.source || '-'} | observed holders<5% ${ff.observedCount}`;
  return `<span class="ff-inline" title="${esc(title)}">FF ${Number(ff.ratio || 0).toFixed(2)}%</span>`;
}

function getSectorInfo(shareCode) {
  const code = String(shareCode || '').toUpperCase();
  return state.sector.byCode?.[code] || null;
}

function renderSectorChip(shareCode) {
  const info = getSectorInfo(shareCode);
  if (!info) return '';
  return `<span class="sector-chip" title="${esc(info.subsector || '')}">${esc(info.sector || 'Unknown')}</span>`;
}

function getDayChangeInfo(shareCode) {
  const code = String(shareCode || '').toUpperCase();
  const row = state.market.byCode?.[code];
  if (!row || row.change_pct === null || row.change_pct === undefined) return null;
  const pct = Number(row.change_pct);
  return {
    pct,
    text: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
    cls: pct >= 0 ? 'delta-up' : 'delta-down',
  };
}

function getMarketPrice(shareCode) {
  const code = String(shareCode || '').toUpperCase();
  const row = state.market.byCode?.[code];
  if (!row) return null;
  const candidates = [
    row.close_price,
    row.close,
    row.price,
    row.last_price,
    row.last,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function getRelationValue(relation) {
  if (!relation) return 0;
  const explicit = Number(relation.value);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const px = getMarketPrice(relation.share_code);
  if (!Number.isFinite(px) || px <= 0) return 0;
  return Number(relation.shares || 0) * px;
}

function getEmpireData(relations = state.relations) {
  const map = new Map();
  (relations || []).forEach((r) => {
    const groupName = String(r.empire_group || resolveEmpireGroup(r.investor_key, r.investor_name, true));
    if (!map.has(groupName)) {
      map.set(groupName, {
        group_name: groupName,
        total_shares: 0,
        total_value: 0,
        total_relations: 0,
        entities: new Set(),
        tickers: new Set(),
        by_ticker: new Map(),
      });
    }
    const bucket = map.get(groupName);
    const relValue = getRelationValue(r);
    const pct = Number(r.percentage || 0);
    const ticker = String(r.share_code || '').toUpperCase();
    bucket.total_shares += Number(r.shares || 0);
    bucket.total_value += relValue;
    bucket.total_relations += 1;
    bucket.entities.add(String(r.investor_key || r.investor_name || ''));
    bucket.tickers.add(ticker);

    if (!bucket.by_ticker.has(ticker)) {
      bucket.by_ticker.set(ticker, {
        share_code: ticker,
        issuer_name: r.issuer_name || '',
        influence_pct: 0,
        shares: 0,
        value: 0,
        entities: new Set(),
      });
    }
    const byTicker = bucket.by_ticker.get(ticker);
    byTicker.influence_pct += pct;
    byTicker.shares += Number(r.shares || 0);
    byTicker.value += relValue;
    byTicker.entities.add(String(r.investor_key || r.investor_name || ''));
  });

  const out = [...map.values()].map((item) => {
    const tickerRows = [...item.by_ticker.values()].map((x) => ({
      ...x,
      entity_count: x.entities.size,
    })).sort((a, b) => b.value - a.value || b.influence_pct - a.influence_pct || a.share_code.localeCompare(b.share_code));
    const topInfluence = tickerRows.slice().sort((a, b) => b.influence_pct - a.influence_pct || b.value - a.value)[0] || null;
    return {
      group_name: item.group_name,
      total_shares: item.total_shares,
      total_value: item.total_value,
      total_relations: item.total_relations,
      entity_count: item.entities.size,
      ticker_count: item.tickers.size,
      by_ticker: tickerRows,
      top_influence: topInfluence,
    };
  });

  return out.sort((a, b) => b.total_value - a.total_value || b.total_shares - a.total_shares || a.group_name.localeCompare(b.group_name));
}

function dedupeRows(rows) {
  const map = new Map();
  rows.forEach(r => {
    const shareCode = String(r.share_code || '').toUpperCase();
    const investorKey = String(r.investor_key || '').toUpperCase();
    if (!shareCode || !investorKey) return;
    const key = `${shareCode}|${investorKey}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...r, share_code: shareCode, investor_key: investorKey });
      return;
    }

    const prevShares = Number(prev.total_holding_shares || 0);
    const currShares = Number(r.total_holding_shares || 0);
    if (currShares > prevShares) {
      map.set(key, { ...r, share_code: shareCode, investor_key: investorKey });
      return;
    }

    if (currShares === prevShares) {
      const prevPct = Number(prev.percentage || 0);
      const currPct = Number(r.percentage || 0);
      if (currPct > prevPct) {
        map.set(key, { ...r, share_code: shareCode, investor_key: investorKey });
      }
    }
  });
  return [...map.values()];
}

function buildStocks(rows) {
  const map = new Map();
  rows.forEach(r => {
    const key = r.share_code;
    if (!map.has(key)) {
      map.set(key, { ticker: r.share_code, company: r.issuer_name, holders: [], total_volume: 0, total_pct: 0 });
    }
    const s = map.get(key);
    s.holders.push(r);
    s.total_volume += Number(r.total_holding_shares || 0);
    s.total_pct += Number(r.percentage || 0);
  });
  return [...map.values()].map(s => {
    s.holders.sort((a,b) => (b.percentage || 0) - (a.percentage || 0));
    return s;
  }).sort((a,b) => a.ticker.localeCompare(b.ticker));
}

function calcDomesticForeignMix(holders) {
  let domesticShares = 0;
  let foreignShares = 0;
  let domesticPctFallback = 0;
  let foreignPctFallback = 0;

  (holders || []).forEach(h => {
    const shares = Number(h.total_holding_shares || 0);
    const pct = Number(h.percentage || 0);
    if (h.local_foreign === 'A') {
      foreignShares += shares;
      foreignPctFallback += pct;
    } else {
      domesticShares += shares;
      domesticPctFallback += pct;
    }
  });

  const totalShares = domesticShares + foreignShares;
  if (totalShares > 0) {
    return {
      domestic: (domesticShares / totalShares) * 100,
      foreign: (foreignShares / totalShares) * 100,
    };
  }

  const totalPct = domesticPctFallback + foreignPctFallback;
  if (totalPct > 0) {
    return {
      domestic: (domesticPctFallback / totalPct) * 100,
      foreign: (foreignPctFallback / totalPct) * 100,
    };
  }

  return { domestic: 0, foreign: 0 };
}

function buildWhales(rows) {
  const map = new Map();
  rows.forEach(r => {
    const key = r.investor_key;
    if (!map.has(key)) {
      map.set(key, {
        investor_key: key,
        holder_name: r.investor_name,
        type: r.investor_type,
        origin: r.local_foreign === 'A' ? 'Foreign' : 'Domestic',
        country: r.nationality || '-',
        domicile: r.domicile || '-',
        stocks: [],
        total_volume: 0,
      });
    }
    const w = map.get(key);
    w.stocks.push(r);
    w.total_volume += Number(r.total_holding_shares || 0);
  });
  return [...map.values()].map(w => {
    w.stocks.sort((a,b) => (b.percentage || 0) - (a.percentage || 0));
    return w;
  }).sort((a,b) => b.total_volume - a.total_volume);
}

function buildMovements(olderRows, newerRows) {
  const oldMap = new Map(olderRows.map(r => [`${r.share_code}|${r.investor_key}`, r]));
  const newMap = new Map(newerRows.map(r => [`${r.share_code}|${r.investor_key}`, r]));
  const all = new Set([...oldMap.keys(), ...newMap.keys()]);
  const out = [];

  all.forEach(k => {
    const o = oldMap.get(k);
    const n = newMap.get(k);
    const oldShares = Number(o?.total_holding_shares || 0);
    const newShares = Number(n?.total_holding_shares || 0);
    if (oldShares === newShares) return;

    let movementType = 'DECREASE';
    if (!o) movementType = 'NEW';
    else if (!n) movementType = 'EXIT';
    else if (newShares > oldShares) movementType = 'INCREASE';

    out.push({
      share_code: (n || o).share_code,
      investor_name: (n || o).investor_name,
      old_shares: oldShares,
      new_shares: newShares,
      delta_shares: newShares - oldShares,
      old_pct: Number(o?.percentage || 0),
      new_pct: Number(n?.percentage || 0),
      delta_pct: Number(n?.percentage || 0) - Number(o?.percentage || 0),
      movement_type: movementType,
    });
  });

  return out.sort((a,b) => Math.abs(b.delta_shares) - Math.abs(a.delta_shares));
}

function buildRelations(rows) {
  const ecoMap = buildUniqueEcosystemTickerGroupMap();
  return rows.map((r) => {
    const relation = {
      share_code: r.share_code,
      issuer_name: r.issuer_name,
      investor_key: r.investor_key,
      investor_name: r.investor_name,
      investor_type: r.investor_type,
      empire_group: EMPIRE_OTHER,
      origin: r.local_foreign === 'A' ? 'Foreign' : 'Domestic',
      shares: Number(r.total_holding_shares || 0),
      percentage: Number(r.percentage || 0),
      value: Number(r.value || 0),
      snapshot_date: r.snapshot_date || '',
    };
    relation.empire_group = resolveNetworkEmpireGroupByPriority(relation, ecoMap);
    return relation;
  }).sort((a,b) => b.shares - a.shares);
}

function buildNetworkMaps(rows) {
  stockHoldersMap = new Map();
  investorStocksMap = new Map();
  rows.forEach(r => {
    if (!stockHoldersMap.has(r.share_code)) stockHoldersMap.set(r.share_code, []);
    stockHoldersMap.get(r.share_code).push(r);
    if (!investorStocksMap.has(r.investor_name)) investorStocksMap.set(r.investor_name, []);
    investorStocksMap.get(r.investor_name).push(r);
  });
}

function applyFilters() {
  const qRaw = state.search.trim();
  const q = qRaw.toLowerCase();
  const qNorm = normalizeSearchText(qRaw);
  const isTickerMode = /^[a-zA-Z]{4}$/.test(qRaw);
  const tickerQ = qRaw.toUpperCase();
  const rf = state.relationFilter;
  const wf = state.whaleFilter;
  const relationSyncChanged = syncNetworkMappingsWithPriority();
  if (relationSyncChanged) populateRelationFilterOptions();

  state.filteredStocks = state.stocks.filter(s => {
    const matchTicker = isTickerMode ? s.ticker === tickerQ : s.ticker.toLowerCase().includes(q);
    const matchIssuer = !isTickerMode && includesNormalized(s.company, qNorm);
    const matchHolder = !isTickerMode && s.holders.some(h => includesNormalized(h.investor_name, qNorm));
    const okQ = !q || matchTicker || matchIssuer || matchHolder;
    // If query already matches ticker/issuer, don't block card by minPct slider.
    const okPct = (q && (matchTicker || matchIssuer)) ? true : s.holders.some(h => Number(h.percentage || 0) >= state.minPct);
    const sec = getSectorInfo(s.ticker)?.sector || '';
    const okSector = state.stockFilter.sector === 'all' || sec === state.stockFilter.sector;
    const notasi = getNotasiInfo(s.ticker);
    const wantedNotasi = state.stockFilter.notasi || 'all';
    const okNotasi =
      wantedNotasi === 'all' ? true
      : wantedNotasi === 'has_any' ? Boolean(notasi && notasi.codes && notasi.codes.length)
      : Boolean(notasi && Array.isArray(notasi.codes) && notasi.codes.includes(wantedNotasi));
    const floatRatioMode = state.stockFilter.floatRatio || 'all';
    const ff = getFreeFloatInfo(s.ticker);
    const ratio = Number(ff?.ratio);
    const hasRatio = Number.isFinite(ratio);
    const okFloatRatio =
      floatRatioMode === 'all' ? true
      : !hasRatio ? false
      : floatRatioMode === 'under10' ? ratio < 10
      : floatRatioMode === '10to30' ? ratio >= 10 && ratio < 30
      : floatRatioMode === '30to50' ? ratio >= 30 && ratio <= 50
      : floatRatioMode === 'over50' ? ratio > 50
      : true;
    return okQ && okPct && okSector && okNotasi && okFloatRatio;
  });
  const stockSort = state.stockFilter.sort || 'az';
  if (stockSort === 'volume') {
    state.filteredStocks.sort((a, b) => {
      const dv = Number(b.total_volume || 0) - Number(a.total_volume || 0);
      return dv !== 0 ? dv : a.ticker.localeCompare(b.ticker);
    });
  } else if (stockSort === 'entities') {
    state.filteredStocks.sort((a, b) => {
      const de = (b.holders?.length || 0) - (a.holders?.length || 0);
      return de !== 0 ? de : a.ticker.localeCompare(b.ticker);
    });
  } else {
    state.filteredStocks.sort((a, b) => a.ticker.localeCompare(b.ticker));
  }

  state.filteredWhales = state.whales.filter(w => {
    const okQ = !q || (isTickerMode
      ? w.stocks.some(s => s.share_code === tickerQ)
      : (includesNormalized(w.holder_name, qNorm) || w.stocks.some(s => includesNormalized(s.share_code, qNorm))));
    const okPct = w.stocks.some(s => Number(s.percentage || 0) >= state.minPct);
    const okType = wf.type === 'all' || w.type === wf.type;
    const okOrigin = wf.origin === 'all' || w.origin === wf.origin;
    const okMinAssets = w.stocks.length >= Number(wf.minAssets || 1);
    const okMulti = !wf.multiOnly || w.stocks.length > 1;
    return okQ && okPct && okType && okOrigin && okMinAssets && okMulti;
  });

  state.filteredMovements = state.movements.filter(m => {
    const okQ = !q || (isTickerMode ? m.share_code === tickerQ : (includesNormalized(m.share_code, qNorm) || includesNormalized(m.investor_name, qNorm)));
    const okPct = Math.max(m.old_pct, m.new_pct) >= state.minPct;
    return okQ && okPct;
  });

  state.filteredRelations = state.relations.filter(r => {
    const okQ = !q || (isTickerMode
      ? r.share_code === tickerQ
      : (includesNormalized(r.share_code, qNorm) || includesNormalized(r.issuer_name, qNorm) || includesNormalized(r.investor_name, qNorm)));
    const relTicker = normalizeSearchText(rf.ticker);
    const relEntity = normalizeSearchText(rf.entity);
    const relIssuer = normalizeSearchText(rf.issuer);
    const pctMin = Math.max(state.minPct, Number(rf.pctMin || 0));
    const pctMax = Number(rf.pctMax || 100);
    const okType = rf.type === 'all' || r.investor_type === rf.type;
    const okOrigin = rf.origin === 'all' || r.origin === rf.origin;
    const okGroup = rf.group === 'all' || r.empire_group === rf.group;
    const okTicker = !relTicker || includesNormalized(r.share_code, relTicker);
    const okEntity = !relEntity || includesNormalized(r.investor_name, relEntity);
    const okIssuer = !relIssuer || includesNormalized(r.issuer_name, relIssuer);
    const okPct = r.percentage >= pctMin && r.percentage <= pctMax;
    return okQ && okType && okOrigin && okGroup && okTicker && okEntity && okIssuer && okPct;
  });

  const entityDegree = new Map();
  const tickerDegree = new Map();
  state.filteredRelations.forEach(r => {
    entityDegree.set(r.investor_key, (entityDegree.get(r.investor_key) || 0) + 1);
    tickerDegree.set(r.share_code, (tickerDegree.get(r.share_code) || 0) + 1);
  });

  state.filteredRelations = state.filteredRelations.filter(r => {
    const okEntityLinks = (entityDegree.get(r.investor_key) || 0) >= Number(rf.minEntityLinks || 1);
    const okTickerLinks = (tickerDegree.get(r.share_code) || 0) >= Number(rf.minTickerLinks || 1);
    if (!okEntityLinks || !okTickerLinks) return false;
    if (!rf.bridgeOnly) return true;
    return (entityDegree.get(r.investor_key) || 0) >= 2 && (tickerDegree.get(r.share_code) || 0) >= 2;
  }).map(r => ({
    ...r,
    entity_links: entityDegree.get(r.investor_key) || 0,
    ticker_links: tickerDegree.get(r.share_code) || 0,
  }));
}

function renderKPIs() {
  const kpiStocksEl = document.getElementById('kpiStocks');
  if (kpiStocksEl) kpiStocksEl.innerText = formatNum(state.filteredStocks.length);
  const kpiStocksVisibleEl = document.getElementById('kpiStocksVisible');
  if (kpiStocksVisibleEl) kpiStocksVisibleEl.innerText = formatNum(state.filteredStocks.length);
  const kpiStocksTotalEl = document.getElementById('kpiStocksTotal');
  if (kpiStocksTotalEl) kpiStocksTotalEl.innerText = formatNum(state.stocks.length);
  const totalVol = state.filteredStocks.reduce((a,b) => a + b.total_volume, 0);
  const kpiSharesEl = document.getElementById('kpiShares');
  if (kpiSharesEl) kpiSharesEl.innerText = formatNum(totalVol);
  const newerDate = state.snapshots.newer[0]?.snapshot_date || '-';
  const kpiSnapshotEl = document.getElementById('kpiSnapshot');
  if (kpiSnapshotEl) kpiSnapshotEl.innerText = newerDate;

  const kpiWhalesEl = document.getElementById('kpiWhales');
  if (kpiWhalesEl) kpiWhalesEl.innerText = formatNum(state.filteredWhales.length);
  const multiAssetWhales = state.filteredWhales.filter(w => w.stocks.length > 1);
  const kpiMultiEl = document.getElementById('kpiMulti');
  if (kpiMultiEl) kpiMultiEl.innerText = formatNum(multiAssetWhales.length);
  const topMulti = [...multiAssetWhales]
    .sort((a, b) => (b.stocks.length - a.stocks.length) || (b.total_volume - a.total_volume))
    .slice(0, 3);
  const kpiMultiTop3El = document.getElementById('kpiMultiTop3');
  if (kpiMultiTop3El) {
    const topWhaleLabels = topMulti.map(w => `${w.holder_name} (${w.stocks.length})`);
    kpiMultiTop3El.innerHTML = `
      <div class="kpi-meta-row">
        <span class="meta-key">Top 3</span>
        <div class="kpi-meta-pills">${renderWhaleTopItems(topWhaleLabels, 'name')}</div>
      </div>
    `;
  }
  const largestWhale = state.filteredWhales.length
    ? [...state.filteredWhales].sort((a, b) => (b.stocks.length - a.stocks.length) || (b.total_volume - a.total_volume))[0]
    : null;
  const maxPort = largestWhale ? largestWhale.stocks.length : 0;
  const kpiMaxPortEl = document.getElementById('kpiMaxPort');
  if (kpiMaxPortEl) kpiMaxPortEl.innerText = `${maxPort} assets`;
  const kpiMaxPortTop3El = document.getElementById('kpiMaxPortTop3');
  if (kpiMaxPortTop3El) {
    if (!largestWhale) {
      kpiMaxPortTop3El.innerHTML = `
        <div class="kpi-meta-row">
          <span class="meta-key">Whale</span>
          <span class="meta-value">-</span>
        </div>
        <div class="kpi-meta-row">
          <span class="meta-key">Top Assets</span>
          <div class="kpi-meta-pills">${renderWhaleTopItems([], 'ticker')}</div>
        </div>
      `;
    } else {
      const topTickers = [...largestWhale.stocks]
        .sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0))
        .slice(0, 3)
        .map(s => s.share_code);
      kpiMaxPortTop3El.innerHTML = `
        <div class="kpi-meta-row">
          <span class="meta-key">Whale</span>
          <span class="meta-value">${esc(largestWhale.holder_name)}</span>
        </div>
        <div class="kpi-meta-row">
          <span class="meta-key">Top Assets</span>
          <div class="kpi-meta-pills">${renderWhaleTopItems(topTickers, 'ticker')}</div>
        </div>
      `;
    }
  }

  const kpiMoveRowsEl = document.getElementById('kpiMoveRows');
  if (kpiMoveRowsEl) kpiMoveRowsEl.innerText = formatNum(state.filteredMovements.length);
  const newCount = state.filteredMovements.filter(x => x.movement_type === 'NEW').length;
  const exitCount = state.filteredMovements.filter(x => x.movement_type === 'EXIT').length;
  const kpiNewExitEl = document.getElementById('kpiNewExit');
  if (kpiNewExitEl) kpiNewExitEl.innerText = `${newCount}/${exitCount}`;
  const netDelta = state.filteredMovements.reduce((a,b) => a + b.delta_shares, 0);
  const kpiNetDeltaEl = document.getElementById('kpiNetDelta');
  if (kpiNetDeltaEl) kpiNetDeltaEl.innerText = formatNum(netDelta);

  const relationEmitens = new Set(state.filteredRelations.map(r => r.share_code)).size;
  const relationEntities = new Set(state.filteredRelations.map(r => r.investor_key)).size;
  const kpiRelEdgesEl = document.getElementById('kpiRelEdges');
  if (kpiRelEdgesEl) kpiRelEdgesEl.innerText = formatNum(state.filteredRelations.length);
  const kpiRelEmitensEl = document.getElementById('kpiRelEmitens');
  if (kpiRelEmitensEl) kpiRelEmitensEl.innerText = formatNum(relationEmitens);
  const kpiRelEntitiesEl = document.getElementById('kpiRelEntities');
  if (kpiRelEntitiesEl) kpiRelEntitiesEl.innerText = formatNum(relationEntities);
}

function getGraphFilteredRelations() {
  const rf = state.relationFilter;
  const focusType = rf.graphFocusType;
  const focusValue = rf.graphFocusValue.trim().toLowerCase();
  let rows = [...state.filteredRelations];
  if (!focusValue || focusType === 'all') return rows;
  if (focusType === 'ticker') {
    rows = rows.filter(r => r.share_code.toLowerCase().includes(focusValue));
  } else if (focusType === 'entity') {
    rows = rows.filter(r => r.investor_name.toLowerCase().includes(focusValue));
  }
  return rows;
}

function renderStocks() {
  const el = document.getElementById('stocksList');
  if (!state.filteredStocks.length) {
    el.innerHTML = '<div class="meta">No stocks loaded.</div>';
    return;
  }

  let html = '';
  const q = state.search.trim();
  const qNorm = normalizeSearchText(q);
  state.filteredStocks.forEach(group => {
    const open = state.openStocks.has(group.ticker);
    const forceShowByQuery = q && (includesNormalized(group.ticker, qNorm) || includesNormalized(group.company, qNorm));
    const holders = group.holders.filter(h => forceShowByQuery || Number(h.percentage || 0) >= state.minPct);
    const ownershipMix = calcDomesticForeignMix(group.holders);
    const domPct = Math.max(0, Math.min(100, Number(ownershipMix.domestic || 0)));
    const forPct = Math.max(0, Math.min(100, Number(ownershipMix.foreign || 0)));
    const mixGradient = `conic-gradient(#22c55e 0 ${domPct}%, #3b82f6 ${domPct}% 100%)`;
    const day1 = getDayChangeInfo(group.ticker);
    const notasiBadges = renderNotasiBadges(group.ticker);
    const sectorChip = renderSectorChip(group.ticker);
    const rows = holders.map((h, i) => `
      <tr>
        <td>${i+1}</td>
        <td>
          <span class="holder-link" data-open-graph="entity|${esc(h.investor_name)}">${esc(h.investor_name)}</span>
          <div class="meta">connections: ${(investorStocksMap.get(h.investor_name) || []).length}</div>
        </td>
        <td>${typeBadge(h.investor_type)}</td>
        <td>${esc(h.local_foreign === 'A' ? 'Foreign' : 'Domestic')}</td>
        <td>${esc(h.nationality || '-')}</td>
        <td style="text-align:right;">${formatNum(h.total_holding_shares)}</td>
        <td style="text-align:right;">${Number(h.percentage || 0).toFixed(2)}%</td>
      </tr>
    `).join('');

    html += `
      <div class="group-card">
        <div class="card-header" data-stock-toggle="${esc(group.ticker)}">
          <div style="display:flex; gap:10px; align-items:center;">
            <span class="badge-ticker">${esc(group.ticker)}</span>
            <div class="stock-header-info">
              <div>${esc(group.company)}</div>
              ${(sectorChip || getFreeFloatInfo(group.ticker)) ? `<div class="meta">Sector: ${sectorChip || '-'} ${renderFreeFloatInline(group.ticker)}</div>` : ''}
              <div class="meta">${holders.length} holders | ${formatNum(group.total_volume)} shares${day1 ? ` | 1D: <span class="${day1.cls}">${day1.text}</span>` : ''}</div>
              <div class="ownership-mix-wrap">
                <div class="ownership-pie" style="background:${mixGradient}" title="Domestic ${domPct.toFixed(1)}% | Foreign ${forPct.toFixed(1)}%"></div>
                <div class="ownership-mix-simple">
                  <span class="mix-label">Ownership:</span>
                  <span class="mix-dom-text">Domestic ${domPct.toFixed(1)}%</span>
                  <span class="mix-sep">|</span>
                  <span class="mix-for-text">Foreign ${forPct.toFixed(1)}%</span>
                </div>
              </div>
              ${notasiBadges ? `<div class="meta">Notasi: ${notasiBadges}</div>` : ''}
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn" data-open-graph="ticker|${esc(group.ticker)}">View Network</button>
            <div class="meta">${open ? 'Hide' : 'Show'}</div>
          </div>
        </div>
        <div class="card-body ${open ? '' : 'hidden'}">
          <table>
            <thead><tr><th>#</th><th>Holder</th><th>Type</th><th>Origin</th><th>Nationality</th><th style="text-align:right;">Shares</th><th style="text-align:right;">%</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  });

  el.innerHTML = html;
  el.querySelectorAll('[data-stock-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-stock-toggle');
      if (state.openStocks.has(t)) state.openStocks.delete(t); else state.openStocks.add(t);
      renderStocks();
    });
  });
  el.querySelectorAll('[data-open-graph]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const [type, id] = btn.getAttribute('data-open-graph').split('|');
      openNetworkGraph(type, id);
    });
  });
}

function renderWhales() {
  const el = document.getElementById('whalesList');
  if (!state.filteredWhales.length) {
    el.innerHTML = '<div class="meta">No whales loaded.</div>';
    return;
  }

  let html = '';
  state.filteredWhales.forEach(group => {
    const open = state.openWhales.has(group.investor_key);
    const stocks = group.stocks.filter(s => Number(s.percentage || 0) >= state.minPct);
    const rows = stocks.map((s, i) => `
      <tr>
        <td>${i+1}</td>
        <td class="whale-ticker-cell">
          <div class="whale-ticker-row">
            <span class="whale-ticker-badge holder-link" data-open-graph="ticker|${esc(s.share_code)}">${esc(s.share_code)}</span>
            <span class="whale-link-count">${(stockHoldersMap.get(s.share_code) || []).length} links</span>
          </div>
          ${(() => { const sec = renderSectorChip(s.share_code); const ffInline = renderFreeFloatInline(s.share_code); return (sec || ffInline) ? `<div class="whale-ticker-meta">Sector: ${sec || '-'} ${ffInline}</div>` : ''; })()}
          ${(() => { const d = getDayChangeInfo(s.share_code); return d ? `<div class="whale-ticker-meta">1D: <span class="${d.cls}">${d.text}</span></div>` : ''; })()}
          ${(() => { const n = renderNotasiBadges(s.share_code); return n ? `<div class="whale-ticker-meta">Notasi: ${n}</div>` : ''; })()}
        </td>
        <td class="whale-issuer-cell">
          <span class="holder-link" data-open-graph="ticker|${esc(s.share_code)}">${esc(s.issuer_name)}</span>
        </td>
        <td style="text-align:right;">${formatNum(s.total_holding_shares)}</td>
        <td style="text-align:right;">${Number(s.percentage || 0).toFixed(2)}%</td>
      </tr>
    `).join('');

    html += `
      <div class="group-card">
        <div class="card-header whale-card-header" data-whale-toggle="${esc(group.investor_key)}">
          <div class="whale-head-main">
            <div class="whale-head-title">${esc(group.holder_name)} ${getRiskBadge(group.holder_name)} ${typeBadge(group.type)}</div>
            <div class="meta whale-head-meta">${esc(group.origin)} | ${esc(group.country)} | ${stocks.length} assets</div>
          </div>
          <div class="whale-head-actions">
            <button class="btn btn-sm whale-network-btn" data-open-graph="entity|${esc(group.holder_name)}">View Network</button>
            <div class="meta whale-head-stats">${open ? 'Hide' : 'Show'} | ${formatNum(group.total_volume)} shares</div>
          </div>
        </div>
        <div class="card-body ${open ? '' : 'hidden'}">
          <table>
            <thead><tr><th>#</th><th>Ticker</th><th>Issuer</th><th style="text-align:right;">Shares</th><th style="text-align:right;">%</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  });

  el.innerHTML = html;
  el.querySelectorAll('[data-whale-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-whale-toggle');
      if (state.openWhales.has(t)) state.openWhales.delete(t); else state.openWhales.add(t);
      renderWhales();
    });
  });
  el.querySelectorAll('[data-open-graph]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const [type, id] = btn.getAttribute('data-open-graph').split('|');
      openNetworkGraph(type, id);
    });
  });
}

function renderMovements() {
  const el = document.getElementById('movementsTable');
  if (!state.filteredMovements.length) {
    el.innerHTML = '<div class="meta">No movement rows.</div>';
    return;
  }

  const rows = state.filteredMovements.map((m, i) => {
    const cls = (m.movement_type === 'NEW' || m.movement_type === 'INCREASE') ? 'delta-up' : 'delta-down';
    return `
      <tr>
        <td>${i+1}</td>
        <td><span class="badge-ticker">${esc(m.share_code)}</span>${(() => { const sec = renderSectorChip(m.share_code); return sec ? `<div class="meta">Sector: ${sec}</div>` : ''; })()}${(() => { const n = renderNotasiBadges(m.share_code); return n ? `<div class="meta">Notasi: ${n}</div>` : ''; })()}</td>
        <td>${esc(m.investor_name)}</td>
        <td style="text-align:right;">${formatNum(m.old_shares)}</td>
        <td style="text-align:right;">${formatNum(m.new_shares)}</td>
        <td style="text-align:right;" class="${cls}">${formatNum(m.delta_shares)}</td>
        <td style="text-align:right;">${m.old_pct.toFixed(2)}%</td>
        <td style="text-align:right;">${m.new_pct.toFixed(2)}%</td>
        <td style="text-align:right;" class="${cls}">${m.delta_pct.toFixed(2)}%</td>
        <td class="${cls}">${esc(m.movement_type)}</td>
      </tr>
    `;
  }).join('');

  el.innerHTML = `
    <table>
      <thead><tr><th>#</th><th>Ticker</th><th>Investor</th><th style="text-align:right;">Old</th><th style="text-align:right;">New</th><th style="text-align:right;">Delta Shares</th><th style="text-align:right;">Old %</th><th style="text-align:right;">New %</th><th style="text-align:right;">Delta %</th><th>Type</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderEmpireLeaderboard() {
  const container = document.getElementById('empireLeaderboard');
  const titleEl = document.getElementById('empireLeaderboardTitle');
  const subtitleEl = document.getElementById('empireLeaderboardSubtitle');
  if (!container) return;
  const allRows = getEmpireData(state.filteredRelations);
  const independentRow = allRows.find((r) => r.group_name === EMPIRE_OTHER) || null;
  const mappedRows = allRows.filter((r) => r.group_name !== EMPIRE_OTHER);
  const rows = empireLeaderboardMode === 'all'
    ? mappedRows
    : mappedRows.slice(0, 10);
  const currentGroupFocus = String(state.relationFilter?.group || 'all');
  const activeSnapshot = state.snapshots?.newer?.[0]?.snapshot_date || state.snapshots?.older?.[0]?.snapshot_date || '-';
  if (titleEl) {
    titleEl.textContent = empireLeaderboardMode === 'all'
      ? 'Empire Universe Overview'
      : 'Top 10 Largest Empires';
  }
  if (subtitleEl) {
    const scopeLabel = currentGroupFocus === 'all' ? 'Global Monitor Scope' : `Focused Scope: ${currentGroupFocus}`;
    const universeLabel = empireLeaderboardMode === 'all'
      ? `Menampilkan seluruh mapped empires (${formatNum(mappedRows.length)} groups)`
      : `Menampilkan 10 group terbesar dari ${formatNum(mappedRows.length)} mapped empires`;
    subtitleEl.textContent = `${scopeLabel} | ${universeLabel} | Snapshot ${activeSnapshot}`;
  }
  if (!rows.length) {
    container.innerHTML = '<div class="meta">No empire data in current filter scope.</div>';
    return;
  }
  const mappedSharesTotal = rows.reduce((acc, r) => acc + Number(r.total_shares || 0), 0);
  const top3Shares = rows.slice(0, 3).reduce((acc, r) => acc + Number(r.total_shares || 0), 0);
  const top3Concentration = mappedSharesTotal ? (top3Shares / mappedSharesTotal) * 100 : 0;
  const listHtml = rows.map((r, idx) => {
    const sharePctVsMapped = mappedSharesTotal ? (Number(r.total_shares || 0) / mappedSharesTotal) * 100 : 0;
    const top = r.top_influence;
    const influenceText = top ? `${top.share_code} ${Number(top.influence_pct || 0).toFixed(2)}%` : '-';
    const isActive = currentGroupFocus !== 'all' && currentGroupFocus === r.group_name;
    return `
      <div class="empire-simple-item ${isActive ? 'active' : ''}" data-emp-focus-group="${esc(r.group_name)}" role="button" tabindex="0">
        <div class="empire-simple-rank">#${idx + 1}</div>
        <div class="empire-simple-main">
          <div class="empire-simple-title">${esc(r.group_name)} ${isActive ? '<span class="empire-focus-badge">Focused</span>' : ''}</div>
          <div class="empire-simple-meta">${formatNum(r.entity_count)} entities | ${formatNum(r.ticker_count)} emitens | ${sharePctVsMapped.toFixed(1)}% of Top 10 pool</div>
          <div class="empire-simple-meta">Top influence: ${esc(influenceText)}</div>
        </div>
        <div class="empire-simple-side">
          <div class="empire-simple-shares">${formatNum(r.total_shares)}</div>
          <div class="empire-simple-shares-label">shares</div>
          <button class="btn btn-sm" data-emp-detail="${esc(r.group_name)}">Details</button>
        </div>
      </div>
    `;
  }).join('');
  container.innerHTML = `
    <div class="empire-overview">
      <div class="empire-view-switch" role="tablist" aria-label="Empire Leaderboard View">
        <button class="empire-view-btn ${empireLeaderboardMode === 'top10' ? 'active' : ''}" data-emp-view="top10" role="tab" aria-selected="${empireLeaderboardMode === 'top10' ? 'true' : 'false'}">
          <span class="empire-view-title">Top 10</span>
          <span class="empire-view-sub">High Signal</span>
        </button>
        <button class="empire-view-btn ${empireLeaderboardMode === 'all' ? 'active' : ''}" data-emp-view="all" role="tab" aria-selected="${empireLeaderboardMode === 'all' ? 'true' : 'false'}">
          <span class="empire-view-title">All Draft Empires</span>
          <span class="empire-view-sub">Full Universe</span>
          <span class="empire-view-count">${formatNum(mappedRows.length)}</span>
        </button>
      </div>
      <div class="empire-kpi-strip">
        <div class="empire-kpi-card">
          <div class="empire-kpi-label">Total Mapped Shares</div>
          <div class="empire-kpi-value">${formatNum(mappedSharesTotal)}</div>
        </div>
        <div class="empire-kpi-card">
          <div class="empire-kpi-label">Top-3 Concentration</div>
          <div class="empire-kpi-value">${top3Concentration.toFixed(1)}%</div>
        </div>
        ${independentRow ? `
          <div class="empire-kpi-card empire-kpi-card-muted">
            <div class="empire-kpi-label">Independent / Other</div>
            <div class="empire-kpi-value">${formatNum(independentRow.total_shares)}</div>
          </div>
        ` : ''}
      </div>
      ${currentGroupFocus !== 'all' ? `<button class="btn btn-sm" data-emp-clear-focus="1">Back to All Groups</button>` : ''}
    </div>
    <div class="empire-simple-list">${listHtml}</div>
    <div class="meta" style="margin-top:8px;">Klik item untuk Focus Group. Gunakan tombol Details untuk popup Top Emitens dan Top Entities.</div>
  `;
  const jumpView = (view, query = '') => {
    const searchEl = document.getElementById('globalSearch');
    state.search = String(query || '');
    if (searchEl) searchEl.value = state.search;
    setActiveView(view);
    renderAll();
  };
  const showEmpirePopup = (title, popupRows) => {
    const safeRows = Array.isArray(popupRows) ? popupRows : [];
    const bodyHtml = safeRows.length ? safeRows.map((r, idx) => {
      const labelHtml = r.jumpType && r.jumpValue
        ? `<button class="network-insight-link" data-jump-type="${esc(r.jumpType)}" data-jump-value="${esc(r.jumpValue)}">${esc(r.label || '-')}</button>`
        : `<span class="network-insight-label">${esc(r.label || '-')}</span>`;
      return `
        <div class="network-insight-row">
          <div class="network-insight-rank">${idx + 1}</div>
          <div class="network-insight-main">
            ${labelHtml}
            ${r.meta ? `<div class="network-insight-meta">${esc(r.meta)}</div>` : ''}
          </div>
          <div class="network-insight-value">${esc(String(r.value ?? '-'))}</div>
        </div>
      `;
    }).join('') : '<div class="network-insight-empty">No data available.</div>';
    let wrap = document.getElementById('empireInsightPopup');
    if (wrap) wrap.remove();
    wrap = document.createElement('div');
    wrap.id = 'empireInsightPopup';
    wrap.className = 'network-insight-overlay';
    wrap.innerHTML = `
      <div class="network-insight-card">
        <div class="network-insight-head">
          <div class="network-insight-title">${esc(title || 'Empire Insight')}</div>
          <button class="network-insight-close" type="button" aria-label="Close">&times;</button>
        </div>
        <div class="network-insight-body">${bodyHtml}</div>
      </div>
    `;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) wrap.remove();
    });
    const closeBtn = wrap.querySelector('.network-insight-close');
    if (closeBtn) closeBtn.addEventListener('click', () => wrap.remove());
    wrap.querySelectorAll('[data-jump-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-jump-type') || '';
        const v = btn.getAttribute('data-jump-value') || '';
        wrap.remove();
        if (t === 'ticker') jumpView('stocks', v);
        else if (t === 'investor') jumpView('whales', v);
      });
    });
  };
  const byGroup = new Map(rows.map((r) => [r.group_name, r]));
  container.querySelectorAll('[data-emp-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-emp-view') === 'all' ? 'all' : 'top10';
      if (next === empireLeaderboardMode) return;
      empireLeaderboardMode = next;
      renderEmpireLeaderboard();
    });
  });
  container.querySelectorAll('[data-emp-focus-group]').forEach((btn) => {
    const handler = () => {
      const group = btn.getAttribute('data-emp-focus-group') || 'all';
      const groupFilterEl = document.getElementById('relGroupFilter');
      const nextGroup = state.relationFilter.group === group ? 'all' : group;
      state.relationFilter.group = nextGroup;
      if (groupFilterEl) groupFilterEl.value = nextGroup;
      setActiveView('relations');
      renderAll();
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    });
  });
  const clearBtn = container.querySelector('[data-emp-clear-focus]');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const groupFilterEl = document.getElementById('relGroupFilter');
      state.relationFilter.group = 'all';
      if (groupFilterEl) groupFilterEl.value = 'all';
      setActiveView('relations');
      renderAll();
    });
  }
  container.querySelectorAll('[data-emp-detail]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const group = btn.getAttribute('data-emp-detail') || '';
      const row = byGroup.get(group);
      if (!row) return;
      const tickerRows = (row.by_ticker || []).slice(0, 8).map((x) => ({
        label: x.share_code,
        value: `${Number(x.influence_pct || 0).toFixed(2)}%`,
        meta: `${formatNum(x.shares)} shares | ${formatNum(x.entity_count)} entities`,
        jumpType: 'ticker',
        jumpValue: x.share_code,
      }));
      const rowsByGroup = state.filteredRelations.filter((r) => r.empire_group === group);
      const entityAgg = new Map();
      rowsByGroup.forEach((r) => {
        const key = String(r.investor_name || '');
        if (!entityAgg.has(key)) {
          entityAgg.set(key, {
            name: key,
            investor_key: String(r.investor_key || ''),
            shares: 0,
            tickers: new Set(),
            state_category: group === 'State / Sovereign Entities'
              ? categorizeStateSovereignEntity(r.investor_name, r.investor_key)
              : '',
          });
        }
        const item = entityAgg.get(key);
        item.shares += Number(r.shares || 0);
        item.tickers.add(String(r.share_code || '').toUpperCase());
      });
      let categoryRows = [];
      if (group === 'State / Sovereign Entities') {
        const categoryAgg = new Map();
        [...entityAgg.values()].forEach((x) => {
          const cat = x.state_category || 'Other State Entity';
          if (!categoryAgg.has(cat)) {
            categoryAgg.set(cat, {
              category: cat,
              shares: 0,
              entities: 0,
            });
          }
          const c = categoryAgg.get(cat);
          c.shares += Number(x.shares || 0);
          c.entities += 1;
        });
        categoryRows = [...categoryAgg.values()]
          .sort((a, b) => b.shares - a.shares || a.category.localeCompare(b.category))
          .slice(0, 8)
          .map((c) => ({
            label: `Category: ${c.category}`,
            value: formatNum(c.shares),
            meta: `${formatNum(c.entities)} entities`,
          }));
      }
      const entityRows = [...entityAgg.values()]
        .sort((a, b) => b.shares - a.shares)
        .slice(0, 8)
        .map((x) => ({
          label: `Entity: ${x.name}`,
          value: formatNum(x.shares),
          meta: `${formatNum(x.tickers.size)} emitens${x.state_category ? ` | ${x.state_category}` : ''}`,
          jumpType: 'investor',
          jumpValue: x.name,
        }));
      showEmpirePopup(`Empire Detail - ${group}`, [...categoryRows, ...tickerRows, ...entityRows]);
    });
  });
}

function getEmpireMappingSuggestions(limit = 20) {
  const unmappedByInvestor = new Map();
  const tickerGroupSignal = new Map();
  const ECO_MARKER = '__ECO_PRIOR__';

  const applyTickerSignal = (ticker, groupName, score, supportEntity) => {
    if (!ticker || !groupName) return;
    if (!tickerGroupSignal.has(ticker)) tickerGroupSignal.set(ticker, new Map());
    const m = tickerGroupSignal.get(ticker);
    if (!m.has(groupName)) {
      m.set(groupName, {
        score: 0,
        entities: new Set(),
      });
    }
    const item = m.get(groupName);
    item.score += Number(score || 0);
    if (supportEntity) item.entities.add(String(supportEntity || '').toUpperCase());
  };

  (state.relations || []).forEach((r) => {
    const mappedGroup = resolveEmpireGroup(r.investor_key, r.investor_name, false);
    const ticker = String(r.share_code || '').toUpperCase();
    const shares = Number(r.shares || 0);
    const pct = Number(r.percentage || 0);

    if (mappedGroup) {
      applyTickerSignal(ticker, mappedGroup, Math.max(0, pct), String(r.investor_key || r.investor_name || '').toUpperCase());
      return;
    }

    const investorId = String(r.investor_key || r.investor_name || '').toUpperCase();
    if (!investorId) return;
    if (!unmappedByInvestor.has(investorId)) {
      unmappedByInvestor.set(investorId, {
        investor_key: r.investor_key || '',
        investor_name: r.investor_name || '',
        total_shares: 0,
        total_value: 0,
        tickers: new Set(),
        rows: [],
      });
    }
    const bucket = unmappedByInvestor.get(investorId);
    bucket.total_shares += shares;
    bucket.total_value += getRelationValue(r);
    bucket.tickers.add(ticker);
    bucket.rows.push(r);
  });

  // Prior from Conglomerate Map (EcosystemSectors): ticker-level affiliation hint.
  if (typeof EcosystemSectors !== 'undefined' && Array.isArray(EcosystemSectors)) {
    EcosystemSectors.forEach((eco) => {
      const ecoGroupRaw = String(eco?.sector_name || '').trim();
      const ecoGroup = resolveGroupFromHintText(ecoGroupRaw) || canonicalizeEmpireGroup(ecoGroupRaw);
      if (!ecoGroup || ecoGroup === ecoGroupRaw && !/GROUP|CORP|HOLDINGS/i.test(ecoGroupRaw)) return;
      (eco.flagship_tickers || []).forEach((t) => {
        applyTickerSignal(String(t || '').toUpperCase(), ecoGroup, 7.5, ECO_MARKER);
      });
      (eco.satellite_tickers || []).forEach((t) => {
        applyTickerSignal(String(t || '').toUpperCase(), ecoGroup, 3.5, ECO_MARKER);
      });
    });
  }

  const out = [...unmappedByInvestor.values()].map((x) => {
    const scoreByGroup = new Map();
    const overlapTickersByGroup = new Map();
    const supportEntitiesByGroup = new Map();
    const nameNorm = normalizeEmpireLookupKey(x.investor_name || x.investor_key || '');
    const nameTokenSet = new Set(String(nameNorm || '').split(' ').filter(Boolean));
    const pepHintGroups = new Set();

    const addEvidence = (groupName, ticker, supportEntitySet) => {
      if (!overlapTickersByGroup.has(groupName)) overlapTickersByGroup.set(groupName, new Set());
      overlapTickersByGroup.get(groupName).add(ticker);
      if (!supportEntitiesByGroup.has(groupName)) supportEntitiesByGroup.set(groupName, new Set());
      const s = supportEntitiesByGroup.get(groupName);
      (supportEntitySet || new Set()).forEach((e) => s.add(e));
    };

    x.rows.forEach((r) => {
      const ticker = String(r.share_code || '').toUpperCase();
      const signal = tickerGroupSignal.get(ticker);
      if (!signal) return;
      const investorWeight = Math.max(0.2, Number(r.percentage || 0) / 10);
      signal.forEach((groupMeta, groupName) => {
        const base = Number(groupMeta?.score || 0) * investorWeight;
        scoreByGroup.set(groupName, (scoreByGroup.get(groupName) || 0) + base);
        addEvidence(groupName, ticker, groupMeta?.entities || new Set());
      });
    });

    // Name hint: only a light boost, never dominant.
    Object.entries(GROUP_ALIAS_HINTS).forEach(([token, groupNameRaw]) => {
      if (!nameTokenSet.has(token)) return;
      const groupName = canonicalizeEmpireGroup(groupNameRaw);
      scoreByGroup.set(groupName, (scoreByGroup.get(groupName) || 0) + 2.5);
    });

    // Prior from Political Radar tags/notes.
    const risk = getRiskEntity(x.investor_name || x.investor_key || '');
    if (risk) {
      const hintTexts = [
        ...(Array.isArray(risk.tags) ? risk.tags : []),
        String(risk.notes || ''),
      ];
      hintTexts.forEach((txt) => {
        const g = resolveGroupFromHintText(txt);
        if (!g) return;
        pepHintGroups.add(g);
        scoreByGroup.set(g, (scoreByGroup.get(g) || 0) + 8);
      });
    }

    const ranked = [...scoreByGroup.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked[0] || null;
    const totalScore = ranked.reduce((acc, [, v]) => acc + v, 0);
    const confidence = top && totalScore > 0 ? (top[1] / totalScore) * 100 : 0;
    const topGroup = top ? top[0] : '';
    const topOverlapTickers = topGroup ? (overlapTickersByGroup.get(topGroup)?.size || 0) : 0;
    const supportSet = topGroup ? (supportEntitiesByGroup.get(topGroup) || new Set()) : new Set();
    const topSupportEntities = [...supportSet].filter((e) => e && e !== ECO_MARKER).length;
    const hasEcoSupport = supportSet.has(ECO_MARKER);
    const hasPepSupport = pepHintGroups.has(topGroup);
    const evidenceStrong =
      (topOverlapTickers >= 2) ||
      (topSupportEntities >= 3) ||
      (topOverlapTickers >= 1 && (hasEcoSupport || hasPepSupport));
    const confidenceStrong = confidence >= (hasPepSupport ? 60 : 65);
    const topTickers = x.rows
      .slice()
      .sort((a, b) => Number(b.shares || 0) - Number(a.shares || 0))
      .slice(0, 3)
      .map((r) => String(r.share_code || '').toUpperCase());
    return {
      ...x,
      top_tickers: topTickers,
      suggested_group: (top && evidenceStrong && confidenceStrong) ? topGroup : '',
      confidence_pct: confidence,
      overlap_ticker_count: topOverlapTickers,
      support_entity_count: topSupportEntities,
      support_from_eco: hasEcoSupport,
      support_from_political: hasPepSupport,
    };
  });

  return out
    .sort((a, b) => b.confidence_pct - a.confidence_pct || b.total_shares - a.total_shares || a.investor_name.localeCompare(b.investor_name))
    .slice(0, Math.max(1, Number(limit || 20)));
}

function renderEmpireMappingSuggestions() {
  const container = document.getElementById('empireSuggestions');
  if (!container) return;
  const rows = getEmpireMappingSuggestions(20);
  if (!rows.length) {
    container.innerHTML = '<div class="meta">No unmapped investors detected in current dataset.</div>';
    return;
  }
  const body = rows.map((r, idx) => {
    const suggested = r.suggested_group || '-';
    const canApply = Boolean(r.suggested_group);
    const tickerCount = Number(r.tickers?.size || 0);
    const tickerCountHtml = tickerCount > 3
      ? `<button class="network-insight-link" data-ctx-ticker-list="${idx}">${formatNum(tickerCount)}</button>`
      : formatNum(tickerCount);
    const topTickerButtons = (r.top_tickers || []).length
      ? (r.top_tickers || []).map((t) => `<button class="network-insight-link" data-ctx-ticker="${esc(t)}">${esc(t)}</button>`).join(', ')
      : '-';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <button class="network-insight-link" data-ctx-investor="${esc(r.investor_name || '')}" data-ctx-investor-key="${esc(r.investor_key || '')}">${esc(r.investor_name || '-')}</button>
          <div class="meta">${esc(r.investor_key || '-')}</div>
        </td>
        <td class="rel-num">${tickerCountHtml}</td>
        <td>${topTickerButtons}</td>
        <td>
          ${suggested !== '-' ? `<button class="network-insight-link" data-ctx-group-network="${esc(suggested)}" data-ctx-group-network-idx="${idx}">${esc(suggested)}</button>` : '-'}
          ${suggested ? `<div class="meta">evidence: ${formatNum(r.overlap_ticker_count || 0)} tickers / ${formatNum(r.support_entity_count || 0)} mapped entities${r.support_from_eco ? ' + eco-map' : ''}${r.support_from_political ? ' + political-radar' : ''}</div>` : ''}
        </td>
        <td class="rel-num">${formatNum(r.total_shares)}</td>
        <td class="rel-num">
          ${canApply ? `<button class="btn btn-sm" data-apply-single="1" data-investor-key="${esc(r.investor_key || '')}" data-investor-name="${esc(r.investor_name || '')}" data-suggested-group="${esc(r.suggested_group || '')}">Apply</button>` : '-'}
        </td>
      </tr>
    `;
  }).join('');
  const draftEntries = Object.entries(empireMapOverrides);
  const draftGrouped = new Map();
  draftEntries.forEach(([k, v]) => {
    const base = normalizeEmpireLookupKey(k);
    const group = canonicalizeEmpireGroup(v);
    const key = `${base}|${group}`;
    if (!draftGrouped.has(key)) {
      draftGrouped.set(key, {
        base_key: base,
        group_name: group,
        aliases: [],
      });
    }
    draftGrouped.get(key).aliases.push(k);
  });
  const draftRows = [...draftGrouped.values()]
    .sort((a, b) => a.base_key.localeCompare(b.base_key))
    .map((d, idx) => {
      const aliasPreview = d.aliases.slice(0, 2).join(' | ');
      return `
        <tr>
          <td>${idx + 1}</td>
          <td><button class="network-insight-link" data-ctx-applied-key="${esc(d.base_key)}">${esc(d.base_key)}</button></td>
          <td><button class="network-insight-link" data-ctx-group-network="${esc(d.group_name)}">${esc(d.group_name)}</button></td>
          <td class="rel-num">${formatNum(d.aliases.length)}</td>
          <td><span class="meta">${esc(aliasPreview)}${d.aliases.length > 2 ? ` +${d.aliases.length - 2} more` : ''}</span></td>
          <td class="rel-num"><button class="btn btn-sm" data-remove-draft="1" data-base-key="${esc(d.base_key)}" data-group-name="${esc(d.group_name)}">Remove</button></td>
        </tr>
      `;
    }).join('');
  const thresholdValue = Math.max(0, Math.min(100, Number(empireSuggestionThreshold || 75)));
  const eligibleRows = rows.filter((r) => r.suggested_group && Number(r.confidence_pct || 0) >= thresholdValue);
  container.innerHTML = `
    <div class="empire-map-toolbar">
      <div class="empire-map-left">
        <label class="empire-threshold-label">Threshold
          <input id="empireSuggestThreshold" class="filter-control empire-threshold-input" type="number" min="0" max="100" step="1" value="${thresholdValue}">
        </label>
        <button id="applyEmpireByThreshold" class="btn btn-sm empire-btn-primary" ${eligibleRows.length ? '' : 'disabled'}>Apply >= Threshold (${eligibleRows.length})</button>
      </div>
      <div class="empire-map-right">
        <button id="saveEmpireDraftMemory" class="btn btn-sm empire-btn-soft">Save</button>
        <button id="exportEmpireDraftMemory" class="btn btn-sm empire-btn-soft">Export</button>
        <button id="importEmpireDraftMemory" class="btn btn-sm empire-btn-soft">Import</button>
        <button id="resetEmpireDraft" class="btn btn-sm empire-btn-soft">Reset</button>
        <button id="clearEmpireDraftMemory" class="btn btn-sm empire-btn-danger">Clear</button>
        <span class="empire-draft-badge">Draft keys: <b>${formatNum(getEmpireOverridesCount())}</b></span>
      </div>
    </div>
    <table class="relation-table">
      <thead><tr><th>#</th><th>Investor</th><th class="rel-num">Tickers</th><th>Top Tickers</th><th>Suggested Group</th><th class="rel-num">Total Shares</th><th class="rel-num">Action</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
    <div class="meta" style="margin-top:8px;">Mode strict aktif: suggestion memakai gabungan relation overlap + Conglomerate Map + Political Radar, dan hanya tampil jika evidence cukup.</div>
    ${draftRows ? `
      <details class="empire-applied-collapse" style="margin-top:10px;">
        <summary>Applied Draft Overrides (Grouped)</summary>
        <div style="padding:8px 10px 10px;">
          <table class="relation-table">
            <thead><tr><th>#</th><th>Normalized Investor Key</th><th>Group</th><th class="rel-num">Alias Count</th><th>Alias Preview</th><th class="rel-num">Action</th></tr></thead>
            <tbody>${draftRows}</tbody>
          </table>
        </div>
      </details>
    ` : ''}
  `;
  const closeEmpireContextPopup = () => {
    const existing = document.getElementById('empireContextPopup');
    if (existing) existing.remove();
  };
  const showEmpireContextPopup = (title, bodyHtml, actions = []) => {
    closeEmpireContextPopup();
    const wrap = document.createElement('div');
    wrap.id = 'empireContextPopup';
    wrap.className = 'empire-context-overlay';
    const actionHtml = actions.length
      ? `<div class="empire-context-actions">${actions.map((a, i) => `<button class="btn btn-sm" data-ctx-action="${i}">${esc(a.label)}</button>`).join('')}</div>`
      : '';
    wrap.innerHTML = `
      <div class="empire-context-card">
        <div class="empire-context-head">
          <div class="empire-context-title">${esc(title || 'Context')}</div>
          <button class="network-insight-close" type="button" aria-label="Close">&times;</button>
        </div>
        <div class="empire-context-body"><div class="empire-ctx-content">${bodyHtml}</div></div>
        ${actionHtml}
      </div>
    `;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) closeEmpireContextPopup();
    });
    const closeBtn = wrap.querySelector('.network-insight-close');
    if (closeBtn) closeBtn.addEventListener('click', closeEmpireContextPopup);
    wrap.querySelectorAll('[data-ctx-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-ctx-action') || -1);
        const fn = actions[idx]?.onClick;
        if (typeof fn === 'function') fn();
      });
    });
  };
  const jumpToView = (view, query = '') => {
    const searchEl = document.getElementById('globalSearch');
    state.search = String(query || '');
    if (searchEl) searchEl.value = state.search;
    setActiveView(view);
    renderAll();
    closeEmpireContextPopup();
  };
  const openInvestorContext = (investorName, investorKey = '') => {
    const inv = String(investorName || '').trim();
    const key = normalizeEmpireLookupKey(investorKey || investorName || '');
    const candidates = [...new Set(
      (state.relations || [])
        .filter((r) => normalizeEmpireLookupKey(r.investor_name || r.investor_key || '') === key || String(r.investor_name || '') === inv)
        .map((r) => String(r.investor_name || '').trim())
        .filter(Boolean)
    )];
    if (candidates.length > 1) {
      const list = candidates.map((c) => `
        <div class="empire-ctx-item">
          <div class="empire-ctx-main">
            <button class="network-insight-link" data-ctx-investor-choice="${esc(c)}">${esc(c)}</button>
            <div class="empire-ctx-meta">Candidate investor</div>
          </div>
        </div>
      `).join('');
      showEmpireContextPopup(`Investor Candidates (${candidates.length})`, `<div class="empire-ctx-note">Pilih investor untuk melihat konteks.</div><div class="empire-ctx-list">${list}</div>`);
      const popup = document.getElementById('empireContextPopup');
      popup?.querySelectorAll('[data-ctx-investor-choice]').forEach((btn) => {
        btn.addEventListener('click', () => openInvestorContext(btn.getAttribute('data-ctx-investor-choice') || '', ''));
      });
      return;
    }
    const chosen = candidates[0] || inv;
    const rowsByInvestor = (investorStocksMap.get(chosen) || []).slice().sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0));
    const topAssets = rowsByInvestor.slice(0, 3).map((x) => x.share_code).join(', ') || '-';
    showEmpireContextPopup(
      `Investor Context`,
      `
        <div class="empire-ctx-list">
          <div class="empire-ctx-item">
            <div class="empire-ctx-main">
              <div class="empire-ctx-label">${esc(chosen || '-')}</div>
              <div class="empire-ctx-meta">Assets: ${formatNum(rowsByInvestor.length)} | Top: ${esc(topAssets)}</div>
            </div>
          </div>
        </div>
      `,
      [
        { label: 'View Whales Directory', onClick: () => jumpToView('whales', chosen) },
        { label: 'Open Network', onClick: () => { closeEmpireContextPopup(); openNetworkGraph('entity', chosen); } },
      ],
    );
  };
  const openTickerContext = (ticker) => {
    const t = String(ticker || '').toUpperCase();
    const stock = state.stocks.find((s) => s.ticker === t);
    const holders = stock ? (stock.holders || []).length : (stockHoldersMap.get(t) || []).length;
    const sector = getSectorInfo(t)?.sector || '-';
    showEmpireContextPopup(
      `Ticker Context`,
      `
        <div class="empire-ctx-list">
          <div class="empire-ctx-item">
            <div class="empire-ctx-main">
              <div class="empire-ctx-label">${esc(t)} ${stock ? `- ${esc(stock.company || '')}` : ''}</div>
              <div class="empire-ctx-meta">Sector: ${esc(sector)} | Holders: ${formatNum(holders)}</div>
            </div>
          </div>
        </div>
      `,
      [
        { label: 'View Stocks Directory', onClick: () => jumpToView('stocks', t) },
        { label: 'Open Network', onClick: () => { closeEmpireContextPopup(); openNetworkGraph('ticker', t); } },
      ],
    );
  };
  const openGroupContext = (groupName) => {
    const group = String(groupName || '');
    const rowsByGroup = (state.relations || []).filter((r) => r.empire_group === group);
    const entityCount = new Set(rowsByGroup.map((r) => String(r.investor_name || ''))).size;
    const tickerCount = new Set(rowsByGroup.map((r) => String(r.share_code || ''))).size;
    showEmpireContextPopup(
      `Group Context`,
      `
        <div class="empire-ctx-list">
          <div class="empire-ctx-item">
            <div class="empire-ctx-main">
              <div class="empire-ctx-label">${esc(group)}</div>
              <div class="empire-ctx-meta">Entities: ${formatNum(entityCount)} | Tickers: ${formatNum(tickerCount)}</div>
            </div>
          </div>
        </div>
      `,
      [
        {
          label: 'Focus in Connection Relation',
          onClick: () => {
            jumpToRelationsByGroupFromNetwork(group);
          },
        },
      ],
    );
  };
  const openAppliedKeyContext = (baseKey) => {
    const norm = normalizeEmpireLookupKey(baseKey || '');
    const matches = [...new Set(
      (state.relations || [])
        .filter((r) => normalizeEmpireLookupKey(r.investor_name || r.investor_key || '') === norm)
        .map((r) => String(r.investor_name || '').trim())
        .filter(Boolean)
    )];
    if (!matches.length) {
      showEmpireContextPopup(
        'Applied Key Context',
        `<div class="empire-ctx-note">No direct investor match in current relations for key: <b>${esc(norm)}</b></div>`
      );
      return;
    }
    if (matches.length > 1) {
      const list = matches.map((c) => `
        <div class="empire-ctx-item">
          <div class="empire-ctx-main">
            <button class="network-insight-link" data-ctx-investor-choice="${esc(c)}">${esc(c)}</button>
            <div class="empire-ctx-meta">Matched from normalized key</div>
          </div>
        </div>
      `).join('');
      showEmpireContextPopup(`Investor Matches (${matches.length})`, `<div class="empire-ctx-list">${list}</div>`);
      const popup = document.getElementById('empireContextPopup');
      popup?.querySelectorAll('[data-ctx-investor-choice]').forEach((btn) => {
        btn.addEventListener('click', () => openInvestorContext(btn.getAttribute('data-ctx-investor-choice') || '', ''));
      });
      return;
    }
    openInvestorContext(matches[0], '');
  };
  container.querySelectorAll('[data-ctx-investor]').forEach((el) => {
    el.addEventListener('click', () => openInvestorContext(el.getAttribute('data-ctx-investor') || '', el.getAttribute('data-ctx-investor-key') || ''));
  });
  container.querySelectorAll('[data-ctx-ticker]').forEach((el) => {
    el.addEventListener('click', () => openTickerContext(el.getAttribute('data-ctx-ticker') || ''));
  });
  container.querySelectorAll('[data-ctx-ticker-list]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = Number(el.getAttribute('data-ctx-ticker-list') || -1);
      const row = rows[idx];
      if (!row) return;
      const tickerMap = new Map();
      (row.rows || []).forEach((x) => {
        const ticker = String(x.share_code || '').toUpperCase();
        if (!ticker) return;
        if (!tickerMap.has(ticker)) {
          tickerMap.set(ticker, {
            ticker,
            issuer: String(x.issuer_name || ''),
            shares: 0,
            pct: 0,
          });
        }
        const item = tickerMap.get(ticker);
        item.shares += Number(x.shares || 0);
        item.pct += Number(x.percentage || 0);
        if (!item.issuer && x.issuer_name) item.issuer = String(x.issuer_name || '');
      });
      const tickerRows = [...tickerMap.values()].sort((a, b) => b.shares - a.shares || a.ticker.localeCompare(b.ticker));
      const bodyHtml = tickerRows.length
        ? tickerRows.map((t) => {
          const sector = getSectorInfo(t.ticker)?.sector || '-';
          const issuerFromStock = state.stocks.find((s) => s.ticker === t.ticker)?.company || '';
          const issuer = t.issuer || issuerFromStock || '-';
          return `
            <div class="empire-ctx-item">
              <div class="empire-ctx-main">
                <button class="network-insight-link empire-ctx-label" data-ctx-popup-ticker="${esc(t.ticker)}">${esc(t.ticker)} - ${esc(issuer)}</button>
                <div class="empire-ctx-meta">Sector: ${esc(sector)} | Shares: ${formatNum(t.shares)} | Ownership: ${Number(t.pct || 0).toFixed(2)}%</div>
              </div>
              <div class="empire-ctx-side">${(() => { const ff = getFreeFloatInfo(t.ticker); return ff ? `FF ${Number(ff.ratio || 0).toFixed(2)}%` : 'FF -'; })()}</div>
            </div>
          `;
        }).join('')
        : '<div class="empire-ctx-note">No ticker list.</div>';
      showEmpireContextPopup(
        `All Tickers (${tickerRows.length})`,
        `<div class="empire-ctx-list">${bodyHtml}</div>`,
        []
      );
      const popup = document.getElementById('empireContextPopup');
      popup?.querySelectorAll('[data-ctx-popup-ticker]').forEach((btn) => {
        btn.addEventListener('click', () => openTickerContext(btn.getAttribute('data-ctx-popup-ticker') || ''));
      });
    });
  });
  container.querySelectorAll('[data-ctx-group]').forEach((el) => {
    el.addEventListener('click', () => openGroupContext(el.getAttribute('data-ctx-group') || ''));
  });
  container.querySelectorAll('[data-ctx-group-network]').forEach((el) => {
    el.addEventListener('click', () => {
      const group = el.getAttribute('data-ctx-group-network') || '';
      if (!group) return;
      const rowIdx = Number(el.getAttribute('data-ctx-group-network-idx') || -1);
      const suggestionRow = Number.isInteger(rowIdx) && rowIdx >= 0 ? rows[rowIdx] : null;
      const suggestionTicker = String(
        suggestionRow?.top_tickers?.[0]
        || (suggestionRow?.rows || []).slice().sort((a, b) => Number(b.shares || 0) - Number(a.shares || 0))[0]?.share_code
        || ''
      ).toUpperCase();
      if (suggestionTicker) {
        openNetworkGraph('ticker', suggestionTicker);
        return;
      }
      const topRow = (state.filteredRelations || [])
        .filter((r) => r.empire_group === group)
        .sort((a, b) => Number(b.shares || 0) - Number(a.shares || 0))[0];
      if (topRow?.share_code) {
        openNetworkGraph('ticker', topRow.share_code);
        return;
      }
      openGroupContext(group);
    });
  });
  container.querySelectorAll('[data-ctx-applied-key]').forEach((el) => {
    el.addEventListener('click', () => openAppliedKeyContext(el.getAttribute('data-ctx-applied-key') || ''));
  });
  container.querySelectorAll('[data-apply-single]').forEach((el) => {
    el.addEventListener('click', () => {
      const investorKey = el.getAttribute('data-investor-key') || '';
      const investorName = el.getAttribute('data-investor-name') || '';
      const groupName = el.getAttribute('data-suggested-group') || '';
      if (!groupName) return;
      setEmpireOverride(investorKey, investorName, groupName);
      refreshEmpireAssignments();
      renderAll();
    });
  });
  const thresholdEl = container.querySelector('#empireSuggestThreshold');
  if (thresholdEl) {
    thresholdEl.addEventListener('change', () => {
      empireSuggestionThreshold = Math.max(0, Math.min(100, Number(thresholdEl.value || 75)));
      renderAll();
    });
  }
  const applyByThresholdBtn = container.querySelector('#applyEmpireByThreshold');
  if (applyByThresholdBtn) {
    applyByThresholdBtn.addEventListener('click', () => {
      const threshold = Math.max(0, Math.min(100, Number((container.querySelector('#empireSuggestThreshold')?.value || empireSuggestionThreshold))));
      empireSuggestionThreshold = threshold;
      let applied = 0;
      rows
        .filter((r) => r.suggested_group && Number(r.confidence_pct || 0) >= threshold)
        .forEach((r) => {
          const before = resolveEmpireGroup(r.investor_key, r.investor_name, false);
          setEmpireOverride(r.investor_key, r.investor_name, r.suggested_group);
          const after = resolveEmpireGroup(r.investor_key, r.investor_name, false);
          if (!before && after) applied += 1;
        });
      if (!applied) return;
      refreshEmpireAssignments();
      renderAll();
    });
  }
  const resetDraftBtn = container.querySelector('#resetEmpireDraft');
  if (resetDraftBtn) {
    resetDraftBtn.addEventListener('click', () => {
      clearEmpireOverrides();
      refreshEmpireAssignments();
      renderAll();
    });
  }
  const saveMemoryBtn = container.querySelector('#saveEmpireDraftMemory');
  if (saveMemoryBtn) {
    saveMemoryBtn.addEventListener('click', () => {
      saveEmpireOverridesToMemory();
      saveMemoryBtn.textContent = 'Saved';
      setTimeout(() => {
        saveMemoryBtn.textContent = 'Save Mapping';
      }, 1000);
    });
  }
  const clearMemoryBtn = container.querySelector('#clearEmpireDraftMemory');
  if (clearMemoryBtn) {
    clearMemoryBtn.addEventListener('click', () => {
      clearEmpireOverrides();
      clearEmpireOverridesMemory();
      refreshEmpireAssignments();
      renderAll();
    });
  }
  const exportBtn = container.querySelector('#exportEmpireDraftMemory');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const ok = exportEmpireOverridesMemory();
      exportBtn.textContent = ok ? 'Exported' : 'Export Failed';
      setTimeout(() => {
        exportBtn.textContent = 'Export';
      }, 1200);
    });
  }
  const importBtn = container.querySelector('#importEmpireDraftMemory');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result || '{}'));
            const imported = importEmpireOverridesMemoryFromObject(parsed);
            if (imported > 0) {
              refreshEmpireAssignments();
              renderAll();
              importBtn.textContent = `Imported ${imported}`;
            } else {
              importBtn.textContent = 'Import Empty';
            }
          } catch {
            importBtn.textContent = 'Import Failed';
          } finally {
            setTimeout(() => {
              importBtn.textContent = 'Import';
            }, 1400);
          }
        };
        reader.onerror = () => {
          importBtn.textContent = 'Import Failed';
          setTimeout(() => {
            importBtn.textContent = 'Import';
          }, 1400);
        };
        reader.readAsText(file);
      });
      document.body.appendChild(input);
      input.click();
      input.remove();
    });
  }
  container.querySelectorAll('[data-remove-draft]').forEach((el) => {
    el.addEventListener('click', () => {
      const baseKey = el.getAttribute('data-base-key') || '';
      const groupName = el.getAttribute('data-group-name') || '';
      if (!baseKey || !groupName) return;
      removeEmpireOverrideGroup(baseKey, groupName);
      refreshEmpireAssignments();
      renderAll();
    });
  });
}

function renderRelations() {
  const graphEl = document.getElementById('relationGraph');
  const tableEl = document.getElementById('relationsTable');
  if (!state.filteredRelations.length) {
    graphEl.innerHTML = '<div class="meta">No relation rows.</div>';
    tableEl.innerHTML = '<div class="meta">No relation rows.</div>';
    return;
  }

  const graphRows = getGraphFilteredRelations();
  if (!graphRows.length) {
    graphEl.innerHTML = '<div class="meta">No graph relation rows with current monitor filter.</div>';
  }

  const maxEdges = Number(state.relationFilter.graphEdgeLimit || 120);
  const edges = graphRows.slice(0, maxEdges);
  const emitens = [...new Set(edges.map(e => e.share_code))].slice(0, 24);
  const entities = [...new Set(edges.map(e => e.investor_name))].slice(0, 28);
  const groups = [...new Set(edges.map(e => e.empire_group).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 14);
  const emitenSet = new Set(emitens);
  const entitySet = new Set(entities);
  const groupSet = new Set(groups);
  const drawEdges = edges.filter(e =>
    emitenSet.has(e.share_code) &&
    entitySet.has(e.investor_name) &&
    groupSet.has(e.empire_group)
  );

  const groupTree = new Map();
  drawEdges.forEach((e) => {
    const groupName = String(e.empire_group || EMPIRE_OTHER);
    if (!groupTree.has(groupName)) {
      groupTree.set(groupName, { name: groupName, totalShares: 0, investors: new Map() });
    }
    const group = groupTree.get(groupName);
    group.totalShares += Number(e.shares || 0);
    const investorName = String(e.investor_name || '');
    if (!group.investors.has(investorName)) {
      group.investors.set(investorName, {
        name: investorName,
        investor_type: e.investor_type,
        origin: e.origin,
        totalShares: 0,
        totalPct: 0,
        rows: [],
      });
    }
    const investor = group.investors.get(investorName);
    investor.totalShares += Number(e.shares || 0);
    investor.totalPct += Number(e.percentage || 0);
    investor.rows.push(e);
  });

  const orderedGroups = [...groupTree.values()]
    .map((g) => ({
      ...g,
      investors: [...g.investors.values()]
        .map((inv) => ({
          ...inv,
          rows: inv.rows.slice().sort((a, b) => Number(b.shares || 0) - Number(a.shares || 0) || String(a.share_code || '').localeCompare(String(b.share_code || ''))),
        }))
        .sort((a, b) => Number(b.totalShares || 0) - Number(a.totalShares || 0) || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => Number(b.totalShares || 0) - Number(a.totalShares || 0) || a.name.localeCompare(b.name));

  const truncateLabel = (value, max = 28) => {
    const v = String(value || '');
    return v.length > max ? `${v.slice(0, max - 1)}...` : v;
  };
  const maxLeafRows = Math.max(1, drawEdges.length);
  const topPad = 44;
  const bottomPad = 40;
  const maxTreeHeight = 1700;
  const investorBreaks = orderedGroups.reduce((acc, g) => acc + Math.max(0, g.investors.length - 1), 0);
  const groupBreaks = Math.max(0, orderedGroups.length - 1);
  let rowStep = 20;
  let investorGap = 12;
  let groupGap = 30;
  const estimatedHeight = topPad + bottomPad + (maxLeafRows * rowStep) + (investorBreaks * investorGap) + (groupBreaks * groupGap);
  if (estimatedHeight > maxTreeHeight) {
    const ratio = (maxTreeHeight - topPad - bottomPad) / Math.max(1, (maxLeafRows * rowStep) + (investorBreaks * investorGap) + (groupBreaks * groupGap));
    rowStep = Math.max(12, Math.round(rowStep * ratio));
    investorGap = Math.max(8, Math.round(investorGap * ratio));
    groupGap = Math.max(14, Math.round(groupGap * ratio));
  }
  const h = Math.max(
    560,
    Math.min(
      maxTreeHeight,
      Math.round(topPad + bottomPad + (maxLeafRows * rowStep) + (investorBreaks * investorGap) + (groupBreaks * groupGap))
    )
  );
  const w = 1220;
  const groupX = 160;
  const investorX = 520;
  const tickerX = 930;
  const laneTop = 22;

  const treeNodes = [];
  const edgeMeta = [];
  let cursorY = topPad;
  let linkSeq = 0;
  let nodeSeq = 0;

  orderedGroups.forEach((group, gIdx) => {
    const groupStartY = cursorY;
    group.investors.forEach((inv, invIdx) => {
      const investorStartY = cursorY;
      inv.rows.forEach((row) => {
        const leafId = `node_leaf_${nodeSeq++}`;
        const leafY = cursorY;
        const issuer = String(row.issuer_name || '');
        treeNodes.push({
          id: leafId,
          type: 'ticker',
          label: String(row.share_code || ''),
          subLabel: issuer,
          x: tickerX,
          y: leafY,
          tip: `<b>${esc(String(row.share_code || '-'))}</b><br>${esc(issuer || '-')}` +
            `<br>${esc(inv.name || '-')}` +
            `<br>${esc(group.name || '-')}` +
            `<br>Ownership: ${Number(row.percentage || 0).toFixed(2)}%` +
            `<br>Shares: ${formatNum(row.shares)}`,
          actionType: 'ticker',
          actionValue: String(row.share_code || ''),
        });
        edgeMeta.push({
          id: `link_leaf_${linkSeq}`,
          from: `node_inv_${normalizeEmpireLookupKey(`${group.name}|${inv.name}`)}`,
          to: leafId,
          tip: `<b>${esc(inv.name || '-')}</b> -> <b>${esc(String(row.share_code || '-'))}</b>` +
            `<br>Issuer: ${esc(issuer || '-')}` +
            `<br>Ownership: ${Number(row.percentage || 0).toFixed(2)}%` +
            `<br>Shares: ${formatNum(row.shares)}`,
          kind: 'leaf',
          widthMetric: Number(row.shares || 0),
        });
        linkSeq += 1;
        cursorY += rowStep;
      });
      const investorEndY = cursorY - rowStep;
      const investorY = inv.rows.length ? (investorStartY + investorEndY) / 2 : investorStartY;
      const invId = `node_inv_${normalizeEmpireLookupKey(`${group.name}|${inv.name}`)}`;
      treeNodes.push({
        id: invId,
        type: 'investor',
        label: inv.name,
        subLabel: `${formatNum(inv.rows.length)} assets`,
        x: investorX,
        y: investorY,
        tip: `<b>${esc(inv.name || '-')}</b><br>Group: ${esc(group.name || '-')}` +
          `<br>Total Shares: ${formatNum(inv.totalShares)}` +
          `<br>Total Exposure: ${Number(inv.totalPct || 0).toFixed(2)}%` +
          `<br>Assets in tree: ${formatNum(inv.rows.length)}` +
          `<br>${esc(getTypeMeta(inv.investor_type).label || inv.investor_type || '-')}` +
          ` | ${esc(inv.origin || '-')}`,
        actionType: 'entity',
        actionValue: inv.name,
      });
      edgeMeta.push({
        id: `link_group_${linkSeq}`,
        from: `node_group_${normalizeEmpireLookupKey(group.name)}`,
        to: invId,
        tip: `<b>${esc(group.name || '-')}</b> -> <b>${esc(inv.name || '-')}</b>` +
          `<br>Assets in tree: ${formatNum(inv.rows.length)}` +
          `<br>Total Shares: ${formatNum(inv.totalShares)}`,
        kind: 'group',
        widthMetric: Number(inv.totalShares || 0),
      });
      linkSeq += 1;
      if (invIdx < group.investors.length - 1) cursorY += investorGap;
    });
    const groupEndY = Math.max(groupStartY, cursorY - rowStep);
    const groupY = (groupStartY + groupEndY) / 2;
    treeNodes.push({
      id: `node_group_${normalizeEmpireLookupKey(group.name)}`,
      type: 'group',
      label: group.name,
      subLabel: `${formatNum(group.investors.length)} entities`,
      x: groupX,
      y: groupY,
      tip: `<b>${esc(group.name || '-')}</b><br>Total Shares: ${formatNum(group.totalShares)}` +
        `<br>Entities: ${formatNum(group.investors.length)}` +
        `<br>Asset links: ${formatNum(group.investors.reduce((acc, x) => acc + Number(x.rows?.length || 0), 0))}`,
      actionType: 'group',
      actionValue: group.name,
    });
    if (gIdx < orderedGroups.length - 1) cursorY += groupGap;
  });

  const nodesById = new Map(treeNodes.map((n) => [n.id, n]));
  const maxLinkMetric = Math.max(1, ...edgeMeta.map((x) => Number(x.widthMetric || 0)));
  const resolvePath = (from, to) => {
    const dx = to.x - from.x;
    const c1x = from.x + (dx * 0.44);
    const c2x = to.x - (dx * 0.36);
    return `M ${from.x} ${from.y} C ${c1x} ${from.y}, ${c2x} ${to.y}, ${to.x} ${to.y}`;
  };

  const linksSvg = edgeMeta.map((m, i) => {
    const a = nodesById.get(m.from);
    const b = nodesById.get(m.to);
    if (!a || !b) return '';
    const width = 1.2 + ((Number(m.widthMetric || 0) / maxLinkMetric) * (m.kind === 'group' ? 4.2 : 3.4));
    return `<path class="tree-link tree-link-${m.kind}" data-link-id="${esc(m.id)}" data-from="${esc(m.from)}" data-to="${esc(m.to)}" data-tip="${esc(m.tip || '')}" d="${resolvePath(a, b)}" stroke-width="${width.toFixed(2)}" style="--d:${i};"></path>`;
  }).join('');

  const rowGuideSvg = treeNodes
    .filter((n) => n.type === 'group')
    .sort((a, b) => a.y - b.y)
    .map((n) => `<line x1="${groupX - 70}" y1="${n.y}" x2="${tickerX + 240}" y2="${n.y}" class="tree-row-guide"></line>`)
    .join('');

  const showSubLabels = rowStep >= 16;
  const renderNodeBubbleSvg = (n, i) => {
    const safeTip = esc(n.tip || '');
    if (n.type === 'group') {
      const wLabel = Math.max(110, Math.min(220, (String(n.label || '').length * 7.1) + 26));
      return `
        <g class="tree-node tree-node-group" data-node-id="${esc(n.id)}" data-tip="${safeTip}" data-action-type="${esc(n.actionType || '')}" data-action-value="${esc(n.actionValue || '')}" transform="translate(${n.x}, ${n.y})" style="--d:${i};">
          <rect x="${(-wLabel / 2).toFixed(1)}" y="-14" width="${wLabel.toFixed(1)}" height="28" rx="14"></rect>
        </g>
      `;
    }
    if (n.type === 'investor') {
      return `
        <g class="tree-node tree-node-investor" data-node-id="${esc(n.id)}" data-tip="${safeTip}" data-action-type="${esc(n.actionType || '')}" data-action-value="${esc(n.actionValue || '')}" transform="translate(${n.x}, ${n.y})" style="--d:${i};">
          <circle r="8"></circle>
        </g>
      `;
    }
    return `
      <g class="tree-node tree-node-ticker" data-node-id="${esc(n.id)}" data-tip="${safeTip}" data-action-type="${esc(n.actionType || '')}" data-action-value="${esc(n.actionValue || '')}" transform="translate(${n.x}, ${n.y})" style="--d:${i};">
        <circle r="6"></circle>
      </g>
    `;
  };
  const renderNodeTextSvg = (n) => {
    if (n.type === 'group') {
      return `
        <g class="tree-label-layer" transform="translate(${n.x}, ${n.y})">
          <text class="tree-label tree-label-group" text-anchor="middle" y="4">${esc(truncateLabel(n.label || '-', 24))}</text>
        </g>
      `;
    }
    if (n.type === 'investor') {
      return `
        <g class="tree-label-layer" transform="translate(${n.x}, ${n.y})">
          <text class="tree-label tree-label-investor" x="14" y="${showSubLabels ? '3.5' : '4'}">${esc(truncateLabel(n.label || '-', showSubLabels ? 38 : 46))}</text>
          ${showSubLabels ? `<text class="tree-sublabel" x="14" y="17">${esc(n.subLabel || '')}</text>` : ''}
        </g>
      `;
    }
    return `
      <g class="tree-label-layer" transform="translate(${n.x}, ${n.y})">
        <text class="tree-label tree-label-ticker" x="12" y="4">${esc(n.label || '-')}</text>
      </g>
    `;
  };
  const nodeRenderOrder = [
    ...treeNodes.filter((n) => n.type === 'group').sort((a, b) => a.y - b.y),
    ...treeNodes.filter((n) => n.type === 'investor').sort((a, b) => a.y - b.y),
    ...treeNodes.filter((n) => n.type === 'ticker').sort((a, b) => a.y - b.y),
  ];
  const nodeBubblesSvg = nodeRenderOrder.map((n, i) => renderNodeBubbleSvg(n, i)).join('');
  const nodeLabelsSvg = nodeRenderOrder.map((n) => renderNodeTextSvg(n)).join('');

  graphEl.innerHTML = `
    <div class="relation-tree-wrap">
      <svg viewBox="0 0 ${w} ${h}" class="relation-svg relation-tree-svg">
        <rect x="0" y="0" width="${w}" height="${h}" fill="transparent"></rect>
        <line x1="${groupX}" y1="${laneTop}" x2="${groupX}" y2="${h - laneTop}" class="tree-lane"></line>
        <line x1="${investorX}" y1="${laneTop}" x2="${investorX}" y2="${h - laneTop}" class="tree-lane"></line>
        <line x1="${tickerX}" y1="${laneTop}" x2="${tickerX}" y2="${h - laneTop}" class="tree-lane"></line>
        <text x="${groupX}" y="18" class="tree-lane-label" text-anchor="middle">Group</text>
        <text x="${investorX}" y="18" class="tree-lane-label" text-anchor="middle">Entity</text>
        <text x="${tickerX}" y="18" class="tree-lane-label" text-anchor="middle">Ticker</text>
        ${rowGuideSvg}
        ${linksSvg}
        ${nodeBubblesSvg}
        ${nodeLabelsSvg}
      </svg>
      <div class="relation-tree-tooltip" id="relationTreeTooltip"></div>
    </div>
    <div class="meta relation-tree-meta">Tree layout: Group -> Entity -> Ticker | showing ${drawEdges.length} investor-ticker edges</div>
  `;

  const treeWrap = graphEl.querySelector('.relation-tree-wrap');
  const tooltipEl = graphEl.querySelector('#relationTreeTooltip');
  const nodeEls = [...graphEl.querySelectorAll('.tree-node')];
  const linkEls = [...graphEl.querySelectorAll('.tree-link')];
  const linkedByNode = new Map();
  const linkById = new Map();
  edgeMeta.forEach((e) => {
    if (!linkedByNode.has(e.from)) linkedByNode.set(e.from, new Set());
    if (!linkedByNode.has(e.to)) linkedByNode.set(e.to, new Set());
    linkedByNode.get(e.from).add(e.to);
    linkedByNode.get(e.to).add(e.from);
    linkById.set(e.id, e);
  });

  const moveTooltip = (event) => {
    if (!tooltipEl || !treeWrap) return;
    const rect = treeWrap.getBoundingClientRect();
    const x = event.clientX - rect.left + 14;
    const y = event.clientY - rect.top + 14;
    tooltipEl.style.left = `${x}px`;
    tooltipEl.style.top = `${y}px`;
  };
  const showTooltip = (html, event) => {
    if (!tooltipEl) return;
    tooltipEl.innerHTML = html || '';
    tooltipEl.classList.add('show');
    moveTooltip(event);
  };
  const hideTooltip = () => {
    if (!tooltipEl) return;
    tooltipEl.classList.remove('show');
  };
  const resetFocus = () => {
    nodeEls.forEach((el) => el.classList.remove('dim', 'focus'));
    linkEls.forEach((el) => el.classList.remove('dim', 'focus'));
  };

  nodeEls.forEach((el) => {
    el.addEventListener('mouseenter', (event) => {
      const id = el.getAttribute('data-node-id') || '';
      const connected = linkedByNode.get(id) || new Set();
      nodeEls.forEach((n) => {
        const nid = n.getAttribute('data-node-id') || '';
        n.classList.toggle('dim', nid !== id && !connected.has(nid));
        n.classList.toggle('focus', nid === id);
      });
      linkEls.forEach((l) => {
        const from = l.getAttribute('data-from') || '';
        const to = l.getAttribute('data-to') || '';
        const isActive = from === id || to === id;
        l.classList.toggle('dim', !isActive);
        l.classList.toggle('focus', isActive);
      });
      showTooltip(el.getAttribute('data-tip') || '', event);
    });
    el.addEventListener('mousemove', moveTooltip);
    el.addEventListener('mouseleave', () => {
      hideTooltip();
      resetFocus();
    });
    el.addEventListener('click', () => {
      const actionType = el.getAttribute('data-action-type') || '';
      const actionValue = el.getAttribute('data-action-value') || '';
      if (!actionType || !actionValue) return;
      if (actionType === 'ticker') {
        openNetworkGraph('ticker', actionValue);
        return;
      }
      if (actionType === 'entity') {
        openNetworkGraph('entity', actionValue);
        return;
      }
      if (actionType === 'group') {
        state.relationFilter.group = actionValue;
        const groupFilterEl = document.getElementById('relGroupFilter');
        if (groupFilterEl) groupFilterEl.value = actionValue;
        renderAll();
      }
    });
  });

  linkEls.forEach((el) => {
    el.addEventListener('mouseenter', (event) => {
      const id = el.getAttribute('data-link-id') || '';
      const current = linkById.get(id);
      if (!current) return;
      nodeEls.forEach((n) => {
        const nid = n.getAttribute('data-node-id') || '';
        const isActive = nid === current.from || nid === current.to;
        n.classList.toggle('dim', !isActive);
        n.classList.toggle('focus', isActive);
      });
      linkEls.forEach((l) => {
        const isActive = l.getAttribute('data-link-id') === id;
        l.classList.toggle('dim', !isActive);
        l.classList.toggle('focus', isActive);
      });
      showTooltip(el.getAttribute('data-tip') || '', event);
    });
    el.addEventListener('mousemove', moveTooltip);
    el.addEventListener('mouseleave', () => {
      hideTooltip();
      resetFocus();
    });
  });

  const tableSource = state.filteredRelations.slice(0, 300).sort((a, b) => {
    const k = a.share_code.localeCompare(b.share_code);
    if (k !== 0) return k;
    const i = a.issuer_name.localeCompare(b.issuer_name);
    if (i !== 0) return i;
    return b.shares - a.shares;
  });
  let prevGroupKey = '';
  const tableRows = tableSource.map((r, i) => {
    const groupKey = `${r.share_code}|${r.issuer_name}`;
    const isSameGroup = groupKey === prevGroupKey;
    prevGroupKey = groupKey;
    const tickerCell = isSameGroup
      ? `<td class="rel-compact-cell"><span class="rel-compact-mark">↳</span></td>`
      : `<td class="rel-ticker-cell"><span class="badge-ticker" style="cursor:pointer;" data-open-graph="ticker|${esc(r.share_code)}">${esc(r.share_code)}</span>${(() => { const sec = getSectorInfo(r.share_code)?.sector || ''; return sec ? `<div class="meta">Sector: <span class="rel-sector-text">${esc(sec)}</span></div>` : ''; })()}${(() => { const n = renderNotasiBadges(r.share_code); return n ? `<div class="meta">Notasi: ${n}</div>` : ''; })()}</td>`;
    const issuerCell = isSameGroup
      ? `<td class="rel-compact-cell"><span class="rel-compact-mark">↳</span></td>`
      : `<td class="rel-issuer-cell">${esc(r.issuer_name)}</td>`;
    const rowClass = isSameGroup ? 'rel-group-continue' : 'rel-group-start';
    return `
      <tr class="${rowClass}">
        <td>${i + 1}</td>
        ${tickerCell}
        ${issuerCell}
        <td>${esc(r.empire_group || EMPIRE_OTHER)}</td>
        <td><span class="holder-link rel-entity-link" data-open-graph="entity|${esc(r.investor_name)}">${esc(r.investor_name)}</span></td>
        <td>${typeBadge(r.investor_type)}</td>
        <td>${esc(r.origin)}</td>
        <td class="rel-num">${formatNum(r.shares)}</td>
        <td class="rel-num">${r.percentage.toFixed(2)}%</td>
        <td class="rel-num">${r.entity_links}</td>
        <td class="rel-num">${r.ticker_links}</td>
      </tr>
    `;
  }).join('');
  tableEl.innerHTML = `
    <table class="relation-table">
      <thead><tr><th>#</th><th>Ticker</th><th>Issuer</th><th>Group</th><th>Entity</th><th>Type</th><th>Origin</th><th class="rel-num">Shares</th><th class="rel-num">%</th><th class="rel-num">Entity Links</th><th class="rel-num">Ticker Links</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
  tableEl.querySelectorAll('[data-open-graph]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [type, id] = btn.getAttribute('data-open-graph').split('|');
      openNetworkGraph(type, id);
    });
  });
}

function populateRelationFilterOptions() {
  const typeSelect = document.getElementById('relTypeFilter');
  const groupSelect = document.getElementById('relGroupFilter');
  const tickerList = document.getElementById('relTickerList');
  const entityList = document.getElementById('relEntityList');
  if (!typeSelect || !tickerList || !entityList) return;

  const types = [...new Set(state.relations.map(r => r.investor_type).filter(Boolean))].sort();
  typeSelect.innerHTML = '<option value="all">All</option>' + types.map(t => {
    const meta = getTypeMeta(t);
    return `<option value="${esc(t)}">${esc(meta.label)} (${esc(t)})</option>`;
  }).join('');

  const tickers = [...new Set(state.relations.map(r => r.share_code))].sort();
  tickerList.innerHTML = tickers.map(t => `<option value="${esc(t)}"></option>`).join('');

  const entities = [...new Set(state.relations.map(r => r.investor_name))].sort();
  entityList.innerHTML = entities.slice(0, 4000).map(t => `<option value="${esc(t)}"></option>`).join('');

  if (groupSelect) {
    const groups = [...new Set(state.relations.map(r => r.empire_group || EMPIRE_OTHER))].sort((a, b) => {
      if (a === EMPIRE_OTHER) return 1;
      if (b === EMPIRE_OTHER) return -1;
      return a.localeCompare(b);
    });
    groupSelect.innerHTML = '<option value="all">All</option>' + groups.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
  }
}

function populateWhaleFilterOptions() {
  const typeSelect = document.getElementById('whaleTypeFilter');
  if (!typeSelect) return;
  const types = [...new Set(state.whales.map(w => w.type).filter(Boolean))].sort();
  typeSelect.innerHTML = '<option value="all">All</option>' + types.map(t => {
    const meta = getTypeMeta(t);
    return `<option value="${esc(t)}">${esc(meta.label)} (${esc(t)})</option>`;
  }).join('');
}

function populateStockSectorFilter() {
  const sel = document.getElementById('stockSectorFilter');
  const notasiSel = document.getElementById('stockNotasiFilter');
  if (!sel) return;
  const sectors = [...new Set(Object.values(state.sector.byCode || {}).map(x => x.sector).filter(Boolean))].sort();
  sel.innerHTML = '<option value="all">All</option>' + sectors.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');

  if (notasiSel) {
    const codeToDesc = {};
    Object.values(state.notasi.byCode || {}).forEach((row) => {
      const codes = Array.isArray(row.notasi_codes) ? row.notasi_codes : [];
      const descs = Array.isArray(row.notasi_desc) ? row.notasi_desc : [];
      codes.forEach((c, i) => {
        if (!codeToDesc[c]) codeToDesc[c] = descs[i] || '';
      });
    });
    notasiGuideByCode = codeToDesc;
    const notasiCodes = Object.keys(codeToDesc).sort();
    const shortDesc = (text, max = 44) => {
      const t = String(text || '').trim();
      return t.length > max ? `${t.slice(0, max - 1)}…` : t;
    };
    notasiSel.innerHTML =
      '<option value="all">All</option>' +
      '<option value="has_any">Has Any Notasi</option>' +
      notasiCodes.map((c) => `<option value="${esc(c)}">${esc(c)} - ${esc(shortDesc(codeToDesc[c] || ''))}</option>`).join('');
    setStockNotasiHelp();
  }
}

function setStockNotasiHelp() {
  const help = document.getElementById('stockNotasiHelp');
  if (!help) return;
  const selected = state.stockFilter.notasi || 'all';
  if (selected === 'all') {
    help.textContent = 'Notasi: All';
    return;
  }
  if (selected === 'has_any') {
    help.textContent = 'Notasi: tampilkan semua emiten yang memiliki minimal 1 notasi.';
    return;
  }
  const desc = notasiGuideByCode[selected] || '';
  help.textContent = desc ? `Notasi ${selected}: ${desc}` : `Notasi ${selected}`;
}

function renderEcosystems() {
  const container = document.getElementById('ecosystemContainer');
  if (!container) return;

  if (typeof EcosystemSectors === 'undefined' || !Array.isArray(EcosystemSectors) || !EcosystemSectors.length) {
    container.innerHTML = '<div class="meta">Conglomerate data not found.</div>';
    return;
  }

  if (!state.stocks.length) {
    container.innerHTML = '<div class="meta">Load snapshot first to render conglomerate map.</div>';
    return;
  }

  const ecoRole = state.ecoFilter?.role || 'all';

  let html = `
    <div class="view-guide">
      <div class="view-guide-title">How to Read This Map</div>
      <div class="view-guide-grid">
        <div><b>Main</b>: Core/flagship tickers of a conglomerate group.</div>
        <div><b>Satellite</b>: Related or peripheral tickers connected to the same ecosystem.</div>
        <div><b>% Monitored</b>: Total tracked ownership percentage from the loaded snapshot (not full market ownership).</div>
        <div><b>Holder Links</b>: Count of holder records connected to the group's tickers in the active snapshot.</div>
      </div>
    </div>
    <div class="eco-filter-bar">
      <div class="eco-filter-role">
        <button class="eco-filter-btn ${ecoRole === 'all' ? 'active' : ''}" data-eco-role="all">All</button>
        <button class="eco-filter-btn ${ecoRole === 'main' ? 'active' : ''}" data-eco-role="main">Main Only</button>
        <button class="eco-filter-btn ${ecoRole === 'satellite' ? 'active' : ''}" data-eco-role="satellite">Satellite Only</button>
      </div>
    </div>
  `;
  const sortedEcosystems = [...EcosystemSectors].sort((a, b) =>
    String(a?.sector_name || '').localeCompare(String(b?.sector_name || ''))
  );
  sortedEcosystems.forEach((eco) => {
    const sectorName = String(eco.sector_name || '').trim();
    const open = state.openEcoCards.has(sectorName);
    const allTickers = [...new Set([...(eco.flagship_tickers || []), ...(eco.satellite_tickers || [])].map(t => String(t || '').toUpperCase()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    let totalVolume = 0;
    let connectedHolders = 0;
    let presentCount = 0;
    let tickerCards = '';

    allTickers.forEach((ticker) => {
      const isFlagship = (eco.flagship_tickers || []).includes(ticker);
      const stock = state.stocks.find((s) => s.ticker === ticker);
      const role = isFlagship ? 'Main' : 'Satellite';
      const roleKey = isFlagship ? 'main' : 'satellite';
      const roleMatch = ecoRole === 'all' || ecoRole === roleKey;
      if (!roleMatch) return;

      const cardClass = `eco-ticker-card ${isFlagship ? 'main' : 'satellite'} ${stock ? '' : 'missing'}`;
      if (!stock) {
        tickerCards += `
          <article class="${cardClass}">
            <div class="eco-card-accent"></div>
            <div class="eco-ticker-head">
              <div class="eco-ticker-left">
                <span class="badge-ticker">${esc(ticker)}</span>
                <span class="eco-role-chip" title="${isFlagship ? 'Core/flagship ticker in this group' : 'Related/satellite ticker in this group'}">${role}</span>
              </div>
              <div class="eco-status missing">No Data</div>
            </div>
            <div class="eco-company meta">Ticker not found in active snapshot.</div>
          </article>
        `;
        return;
      }

      presentCount += 1;
      totalVolume += Number(stock.total_volume || 0);
      connectedHolders += (stock.holders || []).length;
      const monitored = Math.min(100, Number(stock.total_pct || 0)).toFixed(2);

      const topHolders = (stock.holders || []).slice(0, 3).map((h, idx) => `
        <div class="eco-holder-row">
          <div class="eco-holder-main">
            <span class="eco-rank">${idx + 1}</span>
            <span class="holder-link eco-holder-name" data-open-graph="entity|${esc(h.investor_name)}">${esc(h.investor_name)}</span>
            ${renderEmpireMapDot(h.investor_name, h.investor_key, { shareCode: h.share_code })}
            ${getRiskBadge(h.investor_name)}
          </div>
          <div class="eco-holder-meta">
            ${typeBadge(h.investor_type)}
            <span class="eco-holder-pct">${Number(h.percentage || 0).toFixed(2)}%</span>
          </div>
        </div>
      `).join('');

      tickerCards += `
        <article class="${cardClass}">
          <div class="eco-card-accent"></div>
          <div class="eco-ticker-head">
            <div class="eco-ticker-left">
              <span class="badge-ticker holder-link" data-jump-stock="${esc(ticker)}">${esc(ticker)}</span>
              <span class="eco-role-chip" title="${isFlagship ? 'Core/flagship ticker in this group' : 'Related/satellite ticker in this group'}">${role}</span>
            </div>
            <div class="eco-status">${monitored}% Monitored</div>
          </div>
          <div class="eco-meter"><span style="width:${monitored}%;"></span></div>
          <div class="eco-company">${esc(stock.company || '-')}</div>
          <div class="eco-stat-line">
            <span><b>${(stock.holders || []).length}</b> Holders</span>
            <span><b>${formatNum(stock.total_volume)}</b> Shares</span>
            <span class="holder-link" data-open-graph="ticker|${esc(ticker)}">View Network</span>
          </div>
          <div class="eco-holders">
            <div class="eco-holders-title">Top Holders</div>
            ${topHolders || '<div class="meta">No holder rows.</div>'}
          </div>
        </article>
      `;
    });

    const shownCards = (tickerCards.match(/<article /g) || []).length;
    const missingCount = Math.max(0, allTickers.length - presentCount);

    html += `
      <div class="group-card">
        <div class="card-header" data-eco-toggle="${esc(sectorName)}">
          <div>
            <div>${esc(sectorName)}</div>
            <div class="meta">${allTickers.length} tickers | ~${connectedHolders} holder links</div>
          </div>
          <div class="meta">${open ? 'Hide' : 'Show'} | ${formatNum(totalVolume)} shares</div>
        </div>
        <div class="card-body eco-body ${open ? '' : 'hidden'}">
          <div class="eco-overview">
            <span class="eco-overview-chip"><b>${shownCards}</b> Visible Cards</span>
            <span class="eco-overview-chip"><b>${presentCount}</b> Active Tickers</span>
            <span class="eco-overview-chip"><b>${missingCount}</b> Missing Tickers</span>
            <span class="eco-overview-chip"><b>${formatNum(totalVolume)}</b> Total Shares</span>
            <span class="eco-overview-chip"><b>~${connectedHolders}</b> Holder Links</span>
          </div>
          <div class="eco-grid">
            ${tickerCards || '<div class="eco-empty">No cards match the current filters.</div>'}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  container.querySelectorAll('[data-eco-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-eco-toggle');
      if (state.openEcoCards.has(key)) state.openEcoCards.delete(key); else state.openEcoCards.add(key);
      renderEcosystems();
    });
  });
  container.querySelectorAll('[data-open-graph]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const [type, id] = btn.getAttribute('data-open-graph').split('|');
      openNetworkGraph(type, id);
    });
  });
  container.querySelectorAll('[data-jump-stock]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ticker = btn.getAttribute('data-jump-stock') || '';
      const searchEl = document.getElementById('globalSearch');
      state.search = ticker;
      if (searchEl) searchEl.value = ticker;
      setActiveView('stocks');
      renderAll();
    });
  });
  container.querySelectorAll('[data-eco-role]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.ecoFilter.role = btn.getAttribute('data-eco-role') || 'all';
      renderAll();
    });
  });
}

function renderPoliticalRadar() {
  const container = document.getElementById('pepContainer');
  if (!container) return;

  if (typeof HighRiskEntities === 'undefined' || !HighRiskEntities || !Object.keys(HighRiskEntities).length) {
    container.innerHTML = '<div class="meta">Political radar dataset not found.</div>';
    return;
  }

  const whaleNames = new Set(state.whales.map((w) => String(w.holder_name || '').toUpperCase()));
  const rowsData = Object.entries(HighRiskEntities).sort((a, b) => a[0].localeCompare(b[0]));

  const rows = rowsData.map(([name, data]) => {
    const isHigh = String(data.risk_level || '').toLowerCase() === 'high';
    const riskText = isHigh ? 'High Risk' : 'Medium Risk';
    const riskClass = isHigh ? 'risk-high' : 'risk-medium';
    const tags = (data.tags || []).map((tag) => `<span class="type-tag">${esc(tag)}</span>`).join(' ');
    const mappedGroup = renderEmpireMapBadge(name, '', { compact: false }) || '<span class="meta">Not mapped</span>';
    const linked = whaleNames.has(String(name).toUpperCase());
    return `
      <tr>
        <td>
          <span class="holder-link" data-jump-whale="${esc(name)}">${esc(name)}</span>
          <div class="meta">${linked ? 'In snapshot' : 'Not found in active snapshot'}</div>
        </td>
        <td><span class="risk-chip ${riskClass}">${riskText}</span></td>
        <td>${mappedGroup}</td>
        <td>${tags || '-'}</td>
        <td class="meta">${esc(data.notes || '-')}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="view-guide">
      <div class="view-guide-title">Political Radar Guide</div>
      <div class="view-guide-grid">
        <div><b>High Risk</b>: PEP or high-sensitivity profiles requiring stronger due diligence.</div>
        <div><b>Medium Risk</b>: Influential/profiled market actors with lower immediate risk weighting.</div>
        <div><b>In snapshot</b>: Entity name appears in current loaded snapshot data.</div>
        <div><b>Empire Mapping</b>: Auto-synced from Connection Relation mapping overrides (apply/save/import).</div>
      </div>
    </div>
    <table class="pep-table">
      <thead><tr><th>Entity</th><th>Risk</th><th>Empire Mapping</th><th>Tags</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  container.querySelectorAll('[data-jump-whale]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-jump-whale') || '';
      const searchEl = document.getElementById('globalSearch');
      state.search = name;
      if (searchEl) searchEl.value = name;
      setActiveView('whales');
      renderAll();
    });
  });
}

function renderAll() {
  applyFilters();
  renderKPIs();
  renderStocks();
  renderWhales();
  renderEcosystems();
  renderPoliticalRadar();
  renderMovements();
  renderEmpireLeaderboard();
  renderEmpireMappingSuggestions();
  renderRelations();
}

function detectSearchTarget(rawQuery) {
  const raw = String(rawQuery || '').trim();
  if (!raw) return null;
  const q = normalizeSearchText(raw);
  const upper = raw.toUpperCase();

  if (/^[A-Za-z]{4}$/.test(raw) && state.stocks.some((s) => s.ticker === upper)) {
    return 'stocks';
  }
  if (state.stocks.some((s) => s.ticker.includes(upper))) {
    return 'stocks';
  }
  if (state.whales.some((w) => includesNormalized(String(w.holder_name || ''), q))) {
    return 'whales';
  }
  if (typeof EcosystemSectors !== 'undefined' && Array.isArray(EcosystemSectors)) {
    if (EcosystemSectors.some((e) => includesNormalized(String(e.sector_name || ''), q))) {
      return 'ecosystems';
    }
  }
  if (typeof HighRiskEntities !== 'undefined' && HighRiskEntities) {
    if (Object.keys(HighRiskEntities).some((name) => includesNormalized(name, q))) {
      return 'pep-radar';
    }
  }
  return null;
}

function exportCurrentViewToCSV() {
  const active = document.querySelector('.nav-item.active')?.dataset.target;
  let rows = [];

  if (active === 'stocks') {
    rows = state.filteredStocks.flatMap(s => s.holders.filter(h => Number(h.percentage || 0) >= state.minPct).map(h => ({
      view: 'stocks', share_code: s.ticker, issuer_name: s.company, investor_name: h.investor_name, percentage: h.percentage, shares: h.total_holding_shares
    })));
  } else if (active === 'whales') {
    rows = state.filteredWhales.flatMap(w => w.stocks.filter(s => Number(s.percentage || 0) >= state.minPct).map(s => ({
      view: 'whales', investor_name: w.holder_name, investor_type: w.type, share_code: s.share_code, issuer_name: s.issuer_name, percentage: s.percentage, shares: s.total_holding_shares
    })));
  } else if (active === 'relations') {
    rows = state.filteredRelations.map(r => ({ view: 'relations', ...r }));
  } else {
    rows = state.filteredMovements.map(m => ({ view: 'movements', ...m }));
  }

  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const csv = [cols.join(',')].concat(rows.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export_${active || 'view'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

window.exportCurrentViewToCSV = exportCurrentViewToCSV;

function setActiveView(target) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.target === target));
  document.querySelectorAll('.content-body').forEach(v => v.classList.add('hidden'));
  document.getElementById(`view-${target}`).classList.remove('hidden');
}

function openNetworkGraph(type, id) {
  const modal = document.getElementById('networkModal');
  if (!modal) return;

  modal.classList.remove('hidden');
  navigateNetwork(type, id, true);
}

function closeNetworkGraph() {
  const modal = document.getElementById('networkModal');
  const container = document.getElementById('networkGraphContainer');
  if (modal) modal.classList.add('hidden');
  if (container) container.innerHTML = '';
  hideGraphTooltip();
  networkNavStack = [];
  networkNavIndex = -1;
}

window.openNetworkGraph = openNetworkGraph;
window.closeNetworkGraph = closeNetworkGraph;
window.networkBack = networkBack;
window.networkForward = networkForward;

function updateNetworkNavButtons() {
  const backBtn = document.getElementById('networkBackBtn');
  const forwardBtn = document.getElementById('networkForwardBtn');
  if (backBtn) backBtn.disabled = networkNavIndex <= 0;
  if (forwardBtn) forwardBtn.disabled = networkNavIndex >= networkNavStack.length - 1;
}

function hideGraphTooltip() {
  if (typeof d3 !== 'undefined') {
    d3.selectAll('.graph-tooltip').style('display', 'none');
  } else {
    document.querySelectorAll('.graph-tooltip').forEach((el) => {
      el.style.display = 'none';
    });
  }
}

function closeNetworkInsightPopup() {
  const el = document.getElementById('networkInsightPopup');
  if (el) el.remove();
}

function jumpToViewFromNetwork(view, query = '') {
  const searchEl = document.getElementById('globalSearch');
  state.search = String(query || '');
  if (searchEl) searchEl.value = state.search;
  closeNetworkInsightPopup();
  closeNetworkGraph();
  setActiveView(view);
  renderAll();
}

function jumpToRelationsByGroupFromNetwork(groupName = '') {
  const raw = String(groupName || '').trim();
  if (!raw) {
    jumpToViewFromNetwork('relations', '');
    return;
  }
  const normalized = normalizeEmpireLookupKey(raw);
  const knownGroups = [...new Set((state.relations || []).map((r) => String(r.empire_group || '').trim()).filter(Boolean))];
  const matched = knownGroups.find((g) => normalizeEmpireLookupKey(g) === normalized) || raw;
  state.relationFilter.group = matched;
  jumpToViewFromNetwork('relations', '');
  const groupFilterEl = document.getElementById('relGroupFilter');
  if (groupFilterEl) groupFilterEl.value = matched;
}

function showNetworkInsightPopup(title, rows) {
  const host = document.getElementById('networkGraphContainer');
  if (!host) return;
  closeNetworkInsightPopup();
  const safeRows = Array.isArray(rows) ? rows : [];
  const bodyHtml = safeRows.length ? safeRows.map((r, idx) => {
    const labelHtml = r.jumpType && r.jumpValue
      ? `<button class="network-insight-link" data-jump-type="${esc(r.jumpType)}" data-jump-value="${esc(r.jumpValue)}">${esc(r.label || '-')}</button>`
      : `<span class="network-insight-label">${esc(r.label || '-')}</span>`;
    return `
      <div class="network-insight-row">
        <div class="network-insight-rank">${idx + 1}</div>
        <div class="network-insight-main">
          ${labelHtml}
          ${r.meta ? `<div class="network-insight-meta">${esc(r.meta)}</div>` : ''}
        </div>
        <div class="network-insight-value">${esc(String(r.value ?? '-'))}</div>
      </div>
    `;
  }).join('') : '<div class="network-insight-empty">No data available.</div>';

  const wrap = document.createElement('div');
  wrap.id = 'networkInsightPopup';
  wrap.className = 'network-insight-overlay';
  wrap.innerHTML = `
    <div class="network-insight-card">
      <div class="network-insight-head">
        <div class="network-insight-title">${esc(title || 'Detail')}</div>
        <button class="network-insight-close" type="button" aria-label="Close">&times;</button>
      </div>
      <div class="network-insight-body">${bodyHtml}</div>
    </div>
  `;
  host.appendChild(wrap);

  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) closeNetworkInsightPopup();
  });
  const closeBtn = wrap.querySelector('.network-insight-close');
  if (closeBtn) closeBtn.addEventListener('click', closeNetworkInsightPopup);
  wrap.querySelectorAll('[data-jump-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-jump-type');
      const v = btn.getAttribute('data-jump-value') || '';
      if (t === 'ticker') jumpToViewFromNetwork('stocks', v);
      else if (t === 'investor') jumpToViewFromNetwork('whales', v);
      else if (t === 'pep') jumpToViewFromNetwork('pep-radar', v);
    });
  });
}

function navigateNetwork(type, id, pushHistory = false) {
  const container = document.getElementById('networkGraphContainer');
  const title = document.getElementById('networkModalTitle');
  if (!container || !title) return;

  if (pushHistory) {
    networkNavStack = networkNavStack.slice(0, networkNavIndex + 1);
    networkNavStack.push({ type, id });
    networkNavIndex = networkNavStack.length - 1;
  }

  title.innerText = `Network: ${id} (${type === 'ticker' ? 'Ticker' : 'Entity'})`;
  container.innerHTML = '<div class="meta" style="padding:16px;">Rendering Network...</div>';
  hideGraphTooltip();
  setTimeout(() => {
    if (type === 'ticker') renderStockGraph(container, id);
    else renderEntityGraph(container, id);
  }, 40);
  updateNetworkNavButtons();
}

function networkBack() {
  if (networkNavIndex <= 0) return;
  networkNavIndex -= 1;
  const item = networkNavStack[networkNavIndex];
  navigateNetwork(item.type, item.id, false);
}

function networkForward() {
  if (networkNavIndex >= networkNavStack.length - 1) return;
  networkNavIndex += 1;
  const item = networkNavStack[networkNavIndex];
  navigateNetwork(item.type, item.id, false);
}

function renderStockGraph(container, ticker) {
  const nodes = [];
  const links = [];
  const seen = new Set();
  const groupLinkSeen = new Set();
  const centerId = `stock_${ticker}`;
  const bumpMetric = (id, pct) => {
    const n = nodes.find(x => x.id === id);
    if (!n) return;
    n.metricPct = Math.max(Number(n.metricPct || 0), Number(pct || 0));
  };

  const allHolders = (stockHoldersMap.get(ticker) || []).slice().sort((a,b) => Number(b.percentage || 0) - Number(a.percentage || 0));
  const holders = allHolders.slice(0, 15);
  if (!allHolders.length) {
    container.innerHTML = '<div class="meta" style="padding:16px;">No graph data for ticker.</div>';
    return;
  }

  const holderRows = allHolders.slice(0, 25).map((h, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><span class="holder-link" data-open-graph="entity|${esc(h.investor_name)}">${esc(h.investor_name)}</span></td>
      <td>${typeBadge(h.investor_type)}</td>
      <td>${esc(h.local_foreign === 'A' ? 'Foreign' : 'Domestic')}</td>
      <td style="text-align:right;">${Number(h.percentage || 0).toFixed(2)}%</td>
      <td style="text-align:right;">${formatNum(h.total_holding_shares)}</td>
      <td style="text-align:right;">${(investorStocksMap.get(h.investor_name) || []).length}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="entity-connection-panel">
      <div class="entity-connection-head">
        <div>
          <div class="entity-connection-title">Holder Connections for ${esc(ticker)}</div>
          <div class="entity-connection-sub">Top ${Math.min(25, allHolders.length)} holders by ownership percentage</div>
        </div>
        <button id="toggleTickerTableBtn" class="btn btn-sm">${state.networkTableHidden ? 'Show Table' : 'Hide Table'}</button>
      </div>
      <div id="tickerConnectionTableWrap" class="entity-connection-table-wrap ${state.networkTableHidden ? 'hidden' : ''}">
        <table>
          <thead><tr><th>#</th><th>Holder</th><th>Type</th><th>Origin</th><th style="text-align:right;">%</th><th style="text-align:right;">Shares</th><th style="text-align:right;">Assets</th></tr></thead>
          <tbody>${holderRows}</tbody>
        </table>
      </div>
    </div>
    <div class="entity-graph-canvas"></div>
  `;
  const graphCanvas = container.querySelector('.entity-graph-canvas');
  const panel = container.querySelector('.entity-connection-panel');
  container.querySelectorAll('[data-open-graph]').forEach(btn => {
    btn.addEventListener('click', () => {
      hideGraphTooltip();
      const [type, id] = btn.getAttribute('data-open-graph').split('|');
      navigateNetwork(type, id, true);
    });
  });
  const toggleBtn = container.querySelector('#toggleTickerTableBtn');
  const tableWrap = container.querySelector('#tickerConnectionTableWrap');
  if (toggleBtn && tableWrap) {
    let hoverReveal = false;
    const syncTableState = () => {
      const shouldShow = !state.networkTableHidden || hoverReveal;
      tableWrap.classList.toggle('hidden', !shouldShow);
      if (state.networkTableHidden) {
        toggleBtn.textContent = hoverReveal ? 'Hide Table' : 'Show Table';
      } else {
        toggleBtn.textContent = 'Hide Table';
      }
      panel?.classList.toggle('hover-sensitive', state.networkTableHidden);
    };

    toggleBtn.addEventListener('click', () => {
      state.networkTableHidden = !state.networkTableHidden;
      hoverReveal = false;
      syncTableState();
    });
    panel?.addEventListener('mouseenter', () => {
      if (!state.networkTableHidden) return;
      hoverReveal = true;
      syncTableState();
    });
    panel?.addEventListener('mouseleave', () => {
      if (!state.networkTableHidden) return;
      hoverReveal = false;
      syncTableState();
    });
    syncTableState();
  }

  nodes.push({
    id: centerId,
    type: 'stock',
    classKind: 'center_stock',
    label: ticker,
    depth: 0,
    metricPct: 0,
    tooltipHtml: `<b>${esc(ticker)}</b><br>${esc(holders[0].issuer_name || '')}<br>Center Stock`
  });
  seen.add(centerId);

  const ensureGroupHierarchy = (investorName, investorId, pct) => {
    const groupName = resolveEmpireGroup('', investorName, false);
    if (!groupName) return;
    const groupId = `group_${groupName}`;
    if (!seen.has(groupId)) {
      nodes.push({
        id: groupId,
        type: 'group',
        classKind: 'empire_group',
        label: groupName,
        depth: 2,
        metricPct: Number(pct || 0),
        tooltipHtml: `<b>${esc(groupName)}</b><br>Empire Group`,
      });
      seen.add(groupId);
    } else {
      bumpMetric(groupId, pct);
    }
    const edgeKey = `${groupId}|${investorId}`;
    if (groupLinkSeen.has(edgeKey)) return;
    groupLinkSeen.add(edgeKey);
    links.push({ source: groupId, target: investorId, depth: 1, width: Math.max(1, Number(pct || 0) / 12) });
  };

  holders.forEach(h => {
    const invId = `inv_${h.investor_name}`;
    if (!seen.has(invId)) {
      nodes.push({
        id: invId,
        type: 'investor',
        classKind: 'entity_investor',
        highRisk: Boolean(getRiskEntity(h.investor_name)),
        label: h.investor_name,
        depth: 1,
        metricPct: Number(h.percentage || 0),
        tooltipHtml: `<b>${esc(h.investor_name)}</b><br>Holds ${Number(h.percentage || 0).toFixed(2)}% of ${esc(ticker)}${getRiskEntity(h.investor_name) ? '<br><span style="color:#fca5a5">High Risk (PEP)</span>' : ''}`
      });
      seen.add(invId);
    } else {
      bumpMetric(invId, h.percentage);
    }
    ensureGroupHierarchy(h.investor_name, invId, h.percentage);
    links.push({ source: centerId, target: invId, depth: 1, width: Math.max(1, Number(h.percentage || 0) / 6) });
  });

  holders.forEach(h => {
    const invId = `inv_${h.investor_name}`;
    const others = (investorStocksMap.get(h.investor_name) || []).filter(x => x.share_code !== ticker).sort((a,b) => Number(b.percentage || 0) - Number(a.percentage || 0)).slice(0, 4);
    others.forEach(o => {
      const stockId = `stock_${o.share_code}`;
      if (!seen.has(stockId)) {
        nodes.push({
          id: stockId,
          type: 'stock',
          classKind: 'shared_asset',
          label: o.share_code,
          depth: 2,
          metricPct: Number(o.percentage || 0),
          tooltipHtml: `<b>${esc(o.share_code)}</b><br>${esc(o.issuer_name || '')}<br>Shared Asset`
        });
        seen.add(stockId);
      } else {
        bumpMetric(stockId, o.percentage);
      }
      links.push({ source: invId, target: stockId, depth: 2, width: Math.max(1, Number(o.percentage || 0) / 10) });
    });
  });

  renderForceGraph(graphCanvas, nodes, links, centerId);
}

function renderEntityGraph(container, investorName) {
  const nodes = [];
  const links = [];
  const seen = new Set();
  const groupLinkSeen = new Set();
  const centerId = `inv_${investorName}`;
  const bumpMetric = (id, pct) => {
    const n = nodes.find(x => x.id === id);
    if (!n) return;
    n.metricPct = Math.max(Number(n.metricPct || 0), Number(pct || 0));
  };
  const allStocks = (investorStocksMap.get(investorName) || []).slice().sort((a,b) => Number(b.percentage || 0) - Number(a.percentage || 0));
  const stocks = allStocks.slice(0, 20);
  if (!allStocks.length) {
    container.innerHTML = '<div class="meta" style="padding:16px;">No graph data for entity.</div>';
    return;
  }

  const summaryRows = allStocks.slice(0, 25).map((s, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><span class="badge-ticker holder-link" data-open-graph="ticker|${esc(s.share_code)}">${esc(s.share_code)}</span></td>
      <td>${esc(s.issuer_name || '-')}</td>
      <td style="text-align:right;">${Number(s.percentage || 0).toFixed(2)}%</td>
      <td style="text-align:right;">${formatNum(s.total_holding_shares)}</td>
      <td style="text-align:right;">${(stockHoldersMap.get(s.share_code) || []).length}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="entity-connection-panel">
      <div class="entity-connection-head">
        <div>
          <div class="entity-connection-title">Other Connections for ${esc(investorName)}</div>
          <div class="entity-connection-sub">Top ${Math.min(25, allStocks.length)} assets by ownership percentage</div>
        </div>
        <button id="toggleEntityTableBtn" class="btn btn-sm">${state.networkTableHidden ? 'Show Table' : 'Hide Table'}</button>
      </div>
      <div id="entityConnectionTableWrap" class="entity-connection-table-wrap ${state.networkTableHidden ? 'hidden' : ''}">
        <table>
          <thead><tr><th>#</th><th>Ticker</th><th>Issuer</th><th style="text-align:right;">%</th><th style="text-align:right;">Shares</th><th style="text-align:right;">Holders</th></tr></thead>
          <tbody>${summaryRows}</tbody>
        </table>
      </div>
    </div>
    <div class="entity-graph-canvas"></div>
  `;
  const graphCanvas = container.querySelector('.entity-graph-canvas');
  const panel = container.querySelector('.entity-connection-panel');
  container.querySelectorAll('[data-open-graph]').forEach(btn => {
    btn.addEventListener('click', () => {
      hideGraphTooltip();
      const [type, id] = btn.getAttribute('data-open-graph').split('|');
      navigateNetwork(type, id, true);
    });
  });
  const toggleBtn = container.querySelector('#toggleEntityTableBtn');
  const tableWrap = container.querySelector('#entityConnectionTableWrap');
  if (toggleBtn && tableWrap) {
    let hoverReveal = false;
    const syncTableState = () => {
      const shouldShow = !state.networkTableHidden || hoverReveal;
      tableWrap.classList.toggle('hidden', !shouldShow);
      if (state.networkTableHidden) {
        toggleBtn.textContent = hoverReveal ? 'Hide Table' : 'Show Table';
        toggleBtn.title = 'Klik untuk menampilkan tabel permanen. Saat ini tabel juga muncul saat mouse hover.';
      } else {
        toggleBtn.textContent = 'Hide Table';
        toggleBtn.title = 'Klik untuk mode clean UI (tabel disembunyikan, muncul saat hover).';
      }
      panel?.classList.toggle('hover-sensitive', state.networkTableHidden);
    };

    toggleBtn.addEventListener('click', () => {
      state.networkTableHidden = !state.networkTableHidden;
      hoverReveal = false;
      syncTableState();
    });

    panel?.addEventListener('mouseenter', () => {
      if (!state.networkTableHidden) return;
      hoverReveal = true;
      syncTableState();
    });
    panel?.addEventListener('mouseleave', () => {
      if (!state.networkTableHidden) return;
      hoverReveal = false;
      syncTableState();
    });

    syncTableState();
  }

  nodes.push({
    id: centerId,
    type: 'investor',
    classKind: 'center_investor',
    highRisk: Boolean(getRiskEntity(investorName)),
    label: investorName,
    depth: 0,
    metricPct: 0,
    tooltipHtml: `<b>${esc(investorName)}</b><br>Assets: ${stocks.length}<br>Center Investor${getRiskEntity(investorName) ? '<br><span style="color:#fca5a5">High Risk (PEP)</span>' : ''}`
  });
  seen.add(centerId);

  const ensureGroupHierarchy = (name, investorId, pct) => {
    const groupName = resolveEmpireGroup('', name, false);
    if (!groupName) return;
    const groupId = `group_${groupName}`;
    if (!seen.has(groupId)) {
      nodes.push({
        id: groupId,
        type: 'group',
        classKind: 'empire_group',
        label: groupName,
        depth: 2,
        metricPct: Number(pct || 0),
        tooltipHtml: `<b>${esc(groupName)}</b><br>Empire Group`,
      });
      seen.add(groupId);
    } else {
      bumpMetric(groupId, pct);
    }
    const edgeKey = `${groupId}|${investorId}`;
    if (groupLinkSeen.has(edgeKey)) return;
    groupLinkSeen.add(edgeKey);
    links.push({ source: groupId, target: investorId, depth: 1, width: Math.max(1, Number(pct || 0) / 12) });
  };
  ensureGroupHierarchy(investorName, centerId, allStocks[0]?.percentage || 0);

  stocks.forEach((s, idx) => {
    const stockId = `stock_${s.share_code}`;
    if (!seen.has(stockId)) {
      const classKind = idx < 3 ? 'main_asset' : 'satellite_asset';
      nodes.push({
        id: stockId,
        type: 'stock',
        classKind,
        label: s.share_code,
        depth: 1,
        metricPct: Number(s.percentage || 0),
        tooltipHtml: `<b>${esc(s.share_code)}</b><br>${esc(s.issuer_name || '')}<br>${classKind === 'main_asset' ? 'Main Asset' : 'Satellite Asset'}`
      });
      seen.add(stockId);
    } else {
      bumpMetric(stockId, s.percentage);
    }
    links.push({ source: centerId, target: stockId, depth: 1, width: Math.max(1, Number(s.percentage || 0) / 6) });
  });

  stocks.forEach(s => {
    const stockId = `stock_${s.share_code}`;
    const others = (stockHoldersMap.get(s.share_code) || []).filter(x => x.investor_name !== investorName).sort((a,b) => Number(b.percentage || 0) - Number(a.percentage || 0)).slice(0, 3);
    others.forEach(o => {
      const invId = `inv_${o.investor_name}`;
      if (!seen.has(invId)) {
        nodes.push({
          id: invId,
          type: 'investor',
          classKind: 'entity_investor',
          highRisk: Boolean(getRiskEntity(o.investor_name)),
          label: o.investor_name,
          depth: 2,
          metricPct: Number(o.percentage || 0),
          tooltipHtml: `<b>${esc(o.investor_name)}</b><br>Holds ${Number(o.percentage || 0).toFixed(2)}% of ${esc(s.share_code)}${getRiskEntity(o.investor_name) ? '<br><span style="color:#fca5a5">High Risk (PEP)</span>' : ''}`
        });
        seen.add(invId);
      } else {
        bumpMetric(invId, o.percentage);
      }
      ensureGroupHierarchy(o.investor_name, invId, o.percentage);
      links.push({ source: stockId, target: invId, depth: 2, width: Math.max(1, Number(o.percentage || 0) / 10) });
    });
  });

  renderForceGraph(graphCanvas, nodes, links, centerId);
}

function renderForceGraph(container, nodes, links, centerNodeId) {
  if (typeof d3 === 'undefined') {
    container.innerHTML = '<div class="meta" style="padding:16px;color:var(--danger-color);">D3.js failed to load.</div>';
    return;
  }

  container.innerHTML = `
    <div class="network-canvas"></div>
    <div class="network-hud" id="networkHud"></div>
    <div class="network-info" id="networkInfo"></div>
  `;

  const graphCanvas = container.querySelector('.network-canvas');
  const hudEl = container.querySelector('#networkHud');
  const infoEl = container.querySelector('#networkInfo');
  const width = graphCanvas.clientWidth || container.clientWidth || 1000;
  const height = graphCanvas.clientHeight || container.clientHeight || 560;
  const centerNode = nodes.find(n => n.id === centerNodeId);
  const stockCount = nodes.filter(n => n.type === 'stock').length;
  const investorCount = nodes.filter(n => n.type === 'investor').length;
  const groupCount = nodes.filter(n => n.type === 'group').length;
  const highRiskCount = nodes.filter(n => n.type === 'investor' && n.highRisk).length;

  if (hudEl) {
    hudEl.innerHTML = `
      <div class="network-legend-head">
        <div class="network-legend-title">Network Legend</div>
      </div>
      <div class="network-legend-detail">
        <div class="network-legend-group">Node Types</div>
        <div class="network-legend-grid">
          <div class="network-legend-item"><span class="legend-dot legend-center-stock"></span><div><div class="network-legend-label">Center Stock</div><div class="network-legend-desc">Saham yang sedang dilihat</div></div></div>
          <div class="network-legend-item"><span class="legend-dot legend-center-investor"></span><div><div class="network-legend-label">Center Investor</div><div class="network-legend-desc">Investor yang sedang dilihat</div></div></div>
          <div class="network-legend-item"><span class="legend-dot legend-main-asset"></span><div><div class="network-legend-label">Main Asset</div><div class="network-legend-desc">Saham utama konglomerasi</div></div></div>
          <div class="network-legend-item"><span class="legend-dot legend-satellite-asset"></span><div><div class="network-legend-label">Satellite Asset</div><div class="network-legend-desc">Saham pendukung</div></div></div>
          <div class="network-legend-item"><span class="legend-dot legend-shared-asset"></span><div><div class="network-legend-label">Shared Asset</div><div class="network-legend-desc">Saham dengan investor bersama</div></div></div>
          <div class="network-legend-item"><span class="legend-dot legend-empire-group"></span><div><div class="network-legend-label">Empire Group</div><div class="network-legend-desc">Grup induk pemilik entitas</div></div></div>
          <div class="network-legend-item"><span class="legend-dot legend-investor"></span><div><div class="network-legend-label">Entity/Investor</div><div class="network-legend-desc">Pemegang saham</div></div></div>
          <div class="network-legend-item"><span class="legend-dot legend-highrisk"></span><div><div class="network-legend-label">High Risk (PEP)</div><div class="network-legend-desc">Investor beresiko tinggi</div></div></div>
        </div>
        <div class="network-legend-group">Link Type</div>
        <div class="network-legend-grid">
          <div class="network-legend-item"><span class="legend-line"></span><div><div class="network-legend-label">Ownership Link</div><div class="network-legend-desc">Relasi kepemilikan investor ke saham</div></div></div>
        </div>
      </div>
    `;
  }
  if (infoEl) {
    const actionHandlers = {};
    const stat = (label, value, sub = '', actionKey = '') => `
      <div class="network-info-stat ${actionKey ? 'clickable' : ''}" ${actionKey ? `data-action="${esc(actionKey)}"` : ''}>
        <div class="network-info-k">${esc(label)}</div>
        <div class="network-info-v">${esc(String(value ?? '-'))}</div>
        ${sub ? `<div class="network-info-sub">${esc(sub)}</div>` : ''}
      </div>
    `;

    let overviewStats = '';
    let detailTitle = 'Network Snapshot';
    let detailStats = '';
    if (centerNode?.classKind === 'center_stock') {
      const holderRows = (stockHoldersMap.get(centerNode.label) || []).slice();
      const sorted = holderRows.slice().sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0));
      const totalHolders = holderRows.length;
      const foreignCount = holderRows.filter(r => r.local_foreign === 'A').length;
      const domesticCount = Math.max(0, totalHolders - foreignCount);
      const foreignPct = totalHolders ? (foreignCount / totalHolders) * 100 : 0;
      const top3Pct = sorted.slice(0, 3).reduce((acc, r) => acc + Number(r.percentage || 0), 0);
      const topHolder = sorted[0]?.investor_name || '-';
      const topHolderPct = Number(sorted[0]?.percentage || 0).toFixed(2);
      const highRiskHolders = holderRows.filter(r => getRiskEntity(r.investor_name)).length;
      const linkedAssets = new Set();
      const groupByShares = {};
      holderRows.forEach((r) => {
        const g = String(r.empire_group || resolveEmpireGroup(r.investor_key, r.investor_name, true) || EMPIRE_OTHER);
        groupByShares[g] = (groupByShares[g] || 0) + Number(r.total_holding_shares || r.shares || 0);
        (investorStocksMap.get(r.investor_name) || []).forEach((s) => {
          if (s.share_code !== centerNode.label) linkedAssets.add(s.share_code);
        });
      });
      const dominantGroup = Object.entries(groupByShares)
        .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0) || a[0].localeCompare(b[0]))[0]?.[0] || '-';
      actionHandlers.center_stock_concentration = () => {
        showNetworkInsightPopup('Top Holders Concentration', sorted.slice(0, 10).map((r) => ({
          label: r.investor_name,
          value: `${Number(r.percentage || 0).toFixed(2)}%`,
          meta: `${formatNum(r.total_holding_shares)} shares`,
          jumpType: 'investor',
          jumpValue: r.investor_name,
        })));
      };
      actionHandlers.center_stock_foreign = () => {
        const foreignRows = sorted.filter(r => r.local_foreign === 'A');
        showNetworkInsightPopup('Foreign Holders', foreignRows.slice(0, 20).map((r) => ({
          label: r.investor_name,
          value: `${Number(r.percentage || 0).toFixed(2)}%`,
          meta: `${formatNum(r.total_holding_shares)} shares`,
          jumpType: 'investor',
          jumpValue: r.investor_name,
        })));
      };
      actionHandlers.center_stock_highrisk = () => {
        const riskyRows = sorted.filter(r => getRiskEntity(r.investor_name));
        showNetworkInsightPopup('High-Risk (PEP) Holders', riskyRows.slice(0, 20).map((r) => ({
          label: r.investor_name,
          value: `${Number(r.percentage || 0).toFixed(2)}%`,
          meta: (getRiskEntity(r.investor_name)?.notes || 'High-risk profile'),
          jumpType: 'investor',
          jumpValue: r.investor_name,
        })));
      };
      actionHandlers.center_stock_linked_assets = () => {
        const tickerRows = [...linkedAssets].sort().slice(0, 40).map((t) => ({
          label: t,
          value: 'Linked',
          meta: getSectorInfo(t)?.sector || '-',
          jumpType: 'ticker',
          jumpValue: t,
        }));
        showNetworkInsightPopup('Linked Assets via Common Holders', tickerRows);
      };
      actionHandlers.center_stock_issuer = () => {
        jumpToViewFromNetwork('stocks', centerNode.label);
      };
      actionHandlers.center_stock_total_holders = () => {
        showNetworkInsightPopup('All Holders', sorted.slice(0, 40).map((r) => ({
          label: r.investor_name,
          value: `${Number(r.percentage || 0).toFixed(2)}%`,
          meta: `${formatNum(r.total_holding_shares)} shares`,
          jumpType: 'investor',
          jumpValue: r.investor_name,
        })));
      };
      actionHandlers.center_stock_dom_for = () => {
        const dom = sorted.filter(r => r.local_foreign !== 'A');
        const frn = sorted.filter(r => r.local_foreign === 'A');
        const rows = [
          ...dom.slice(0, 15).map((r) => ({
            label: r.investor_name,
            value: `Domestic ${Number(r.percentage || 0).toFixed(2)}%`,
            meta: `${formatNum(r.total_holding_shares)} shares`,
            jumpType: 'investor',
            jumpValue: r.investor_name,
          })),
          ...frn.slice(0, 15).map((r) => ({
            label: r.investor_name,
            value: `Foreign ${Number(r.percentage || 0).toFixed(2)}%`,
            meta: `${formatNum(r.total_holding_shares)} shares`,
            jumpType: 'investor',
            jumpValue: r.investor_name,
          })),
        ];
        showNetworkInsightPopup('Domestic vs Foreign Holders', rows);
      };
      actionHandlers.center_stock_largest_holder = () => {
        if (!topHolder || topHolder === '-') return;
        jumpToViewFromNetwork('whales', topHolder);
      };
      actionHandlers.center_stock_group_focus = () => {
        if (!dominantGroup || dominantGroup === '-') return;
        jumpToRelationsByGroupFromNetwork(dominantGroup);
      };
      overviewStats = [
        stat('Ownership Concentration', `${top3Pct.toFixed(2)}%`, 'Top 3 holders', 'center_stock_concentration'),
        stat('Foreign Participation', `${foreignPct.toFixed(1)}%`, `${formatNum(foreignCount)} foreign holders`, 'center_stock_foreign'),
        stat('High-Risk Holder Watch', formatNum(highRiskHolders), 'PEP / high-risk holders', 'center_stock_highrisk'),
        stat('Linked Asset Exposure', formatNum(linkedAssets.size), 'Assets linked via same holders', 'center_stock_linked_assets'),
      ].join('');
      detailTitle = 'Center Stock Insight';
      detailStats = [
        stat('Issuer', sorted[0]?.issuer_name || '-', '', 'center_stock_issuer'),
        stat('Dominant Group', dominantGroup, 'Open in Connection Relation', dominantGroup !== '-' ? 'center_stock_group_focus' : ''),
        stat('Total Holders', formatNum(totalHolders), '', 'center_stock_total_holders'),
        stat('Domestic vs Foreign', `${formatNum(domesticCount)} / ${formatNum(foreignCount)}`, '', 'center_stock_dom_for'),
        stat('Top 3 Concentration', `${top3Pct.toFixed(2)}%`, '', 'center_stock_concentration'),
        stat('Largest Holder', topHolder, `${topHolderPct}% ownership`, 'center_stock_largest_holder'),
      ].join('');
    } else if (centerNode?.classKind === 'center_investor') {
      const assetRows = (investorStocksMap.get(centerNode.label) || []).slice();
      const sorted = assetRows.slice().sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0));
      const totalAssets = assetRows.length;
      const top3Pct = sorted.slice(0, 3).reduce((acc, r) => acc + Number(r.percentage || 0), 0);
      const sharedAssets = assetRows.filter(r => (stockHoldersMap.get(r.share_code) || []).length > 1).length;
      const sectorSet = new Set(assetRows.map(r => (getSectorInfo(r.share_code)?.sector || '-')).filter(Boolean));
      const mainAsset = sorted[0]?.share_code || '-';
      const mainPct = Number(sorted[0]?.percentage || 0).toFixed(2);
      const investorGroup = String(resolveEmpireGroup('', centerNode.label, true) || EMPIRE_OTHER);
      const highRiskPeers = new Set(
        nodes
          .filter(n => n.type === 'investor' && n.id !== centerNodeId && n.highRisk)
          .map(n => n.label)
      ).size;
      const sharedPct = totalAssets ? (sharedAssets / totalAssets) * 100 : 0;
      actionHandlers.center_investor_concentration = () => {
        showNetworkInsightPopup('Top Portfolio Positions', sorted.slice(0, 20).map((r) => ({
          label: r.share_code,
          value: `${Number(r.percentage || 0).toFixed(2)}%`,
          meta: r.issuer_name || '-',
          jumpType: 'ticker',
          jumpValue: r.share_code,
        })));
      };
      actionHandlers.center_investor_diversification = () => {
        const bySector = {};
        assetRows.forEach((r) => {
          const s = getSectorInfo(r.share_code)?.sector || 'Unknown';
          bySector[s] = (bySector[s] || 0) + 1;
        });
        const rows = Object.entries(bySector)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([sector, count]) => ({ label: sector, value: `${count} assets`, meta: 'Sector allocation' }));
        showNetworkInsightPopup('Sector Diversification', rows);
      };
      actionHandlers.center_investor_shared = () => {
        const rows = sorted
          .filter(r => (stockHoldersMap.get(r.share_code) || []).length > 1)
          .slice(0, 30)
          .map((r) => ({
            label: r.share_code,
            value: `${(stockHoldersMap.get(r.share_code) || []).length} holders`,
            meta: r.issuer_name || '-',
            jumpType: 'ticker',
            jumpValue: r.share_code,
          }));
        showNetworkInsightPopup('Shared Ownership Assets', rows);
      };
      actionHandlers.center_investor_highrisk = () => {
        const riskyNames = [...new Set(
          nodes
            .filter(n => n.type === 'investor' && n.id !== centerNodeId && n.highRisk)
            .map(n => n.label)
        )].sort();
        showNetworkInsightPopup('High-Risk Counterparties', riskyNames.map((name) => ({
          label: name,
          value: 'PEP',
          meta: getRiskEntity(name)?.notes || 'High-risk profile',
          jumpType: 'investor',
          jumpValue: name,
        })));
      };
      actionHandlers.center_investor_assets = () => {
        showNetworkInsightPopup('Portfolio Assets', sorted.slice(0, 40).map((r) => ({
          label: r.share_code,
          value: `${Number(r.percentage || 0).toFixed(2)}%`,
          meta: r.issuer_name || '-',
          jumpType: 'ticker',
          jumpValue: r.share_code,
        })));
      };
      actionHandlers.center_investor_largest = () => {
        if (!mainAsset || mainAsset === '-') return;
        jumpToViewFromNetwork('stocks', mainAsset);
      };
      actionHandlers.center_investor_group_focus = () => {
        if (!investorGroup || investorGroup === '-') return;
        jumpToRelationsByGroupFromNetwork(investorGroup);
      };
      overviewStats = [
        stat('Portfolio Concentration', `${top3Pct.toFixed(2)}%`, 'Top 3 positions', 'center_investor_concentration'),
        stat('Diversification', formatNum(sectorSet.size), 'Unique sectors', 'center_investor_diversification'),
        stat('Shared Ownership Exposure', `${sharedPct.toFixed(1)}%`, `${formatNum(sharedAssets)} shared assets`, 'center_investor_shared'),
        stat('High-Risk Counterparties', formatNum(highRiskPeers), 'Connected PEP / high-risk entities', 'center_investor_highrisk'),
      ].join('');
      detailTitle = 'Center Investor Insight';
      detailStats = [
        stat('Portfolio Assets', formatNum(totalAssets), '', 'center_investor_assets'),
        stat('Empire Group', investorGroup, 'Open in Connection Relation', investorGroup !== '-' ? 'center_investor_group_focus' : ''),
        stat('Sector Exposure', formatNum(sectorSet.size), '', 'center_investor_diversification'),
        stat('Top 3 Concentration', `${top3Pct.toFixed(2)}%`, '', 'center_investor_concentration'),
        stat('Shared Assets', formatNum(sharedAssets), '', 'center_investor_shared'),
        stat('Largest Position', mainAsset, `${mainPct}% ownership`, 'center_investor_largest'),
      ].join('');
    } else {
      overviewStats = [
        stat('Tickers in Scope', formatNum(stockCount)),
        stat('Entities in Scope', formatNum(investorCount)),
        stat('Groups in Scope', formatNum(groupCount)),
        stat('High Risk (PEP)', formatNum(highRiskCount)),
      ].join('');
      detailStats = stat('Nodes', formatNum(nodes.length));
    }

    let networkInfoMinimized = readNetworkInfoMinimizedPref();
    infoEl.classList.toggle('minimized', networkInfoMinimized);
    infoEl.innerHTML = `
      <button class="network-info-toggle" id="networkInfoToggle" type="button" aria-label="${networkInfoMinimized ? 'Expand network info' : 'Minimize network info'}" title="${networkInfoMinimized ? 'Expand info' : 'Minimize info'}">
        ${networkInfoMinimized ? '&#9656;' : '&#9662;'}
      </button>
      <div class="network-info-body">
        <div class="network-info-title">${esc(centerNode?.label || 'Network')}</div>
        <div class="network-info-section">
          <div class="network-info-section-title">Overview</div>
          <div class="network-info-grid">
            ${overviewStats}
          </div>
        </div>
        <div class="network-info-section">
          <div class="network-info-section-title">${esc(detailTitle)}</div>
          <div class="network-info-grid network-info-grid-detail">
            ${detailStats}
          </div>
        </div>
        <div class="network-info-tip">Tip: click any insight card for detail popup or quick jump. Click node to pivot, drag to inspect overlap, scroll to zoom.</div>
      </div>
    `;
    const infoToggleBtn = infoEl.querySelector('#networkInfoToggle');
    if (infoToggleBtn) {
      infoToggleBtn.addEventListener('click', () => {
        networkInfoMinimized = !networkInfoMinimized;
        infoEl.classList.toggle('minimized', networkInfoMinimized);
        infoToggleBtn.innerHTML = networkInfoMinimized ? '&#9656;' : '&#9662;';
        infoToggleBtn.setAttribute('aria-label', networkInfoMinimized ? 'Expand network info' : 'Minimize network info');
        infoToggleBtn.setAttribute('title', networkInfoMinimized ? 'Expand info' : 'Minimize info');
        saveNetworkInfoMinimizedPref(networkInfoMinimized);
      });
    }
    infoEl.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        const actionKey = el.getAttribute('data-action') || '';
        const handler = actionHandlers[actionKey];
        if (typeof handler === 'function') handler();
      });
    });
  }

  const svg = d3.select(graphCanvas).append('svg').attr('width', width).attr('height', height).attr('viewBox', [0, 0, width, height]);

  const defs = svg.append('defs');
  defs.append('linearGradient')
    .attr('id', 'networkBgGrad')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '100%').attr('y2', '100%')
    .call((grad) => {
      grad.append('stop').attr('offset', '0%').attr('stop-color', '#0b1220');
      grad.append('stop').attr('offset', '100%').attr('stop-color', '#111b30');
    });
  defs.append('pattern')
    .attr('id', 'networkGrid')
    .attr('width', 34)
    .attr('height', 34)
    .attr('patternUnits', 'userSpaceOnUse')
    .call((pat) => {
      pat.append('path')
        .attr('d', 'M 34 0 L 0 0 0 34')
        .attr('fill', 'none')
        .attr('stroke', 'rgba(148,163,184,0.08)')
        .attr('stroke-width', 1);
    });

  svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#networkBgGrad)');
  svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#networkGrid)').attr('opacity', 0.38);

  const g = svg.append('g');
  svg.call(d3.zoom().scaleExtent([0.2, 4]).on('zoom', (e) => g.attr('transform', e.transform)));

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.depth === 1 ? 170 : 108).strength(d => d.depth === 1 ? 0.5 : 0.3))
    .force('charge', d3.forceManyBody().strength(d => d.id === centerNodeId ? -900 : d.depth === 1 ? -330 : -170))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.type === 'stock' ? 34 : d.type === 'group' ? 24 : (d.id === centerNodeId ? 25 : 20)));

  const link = g.append('g').selectAll('path').data(links).join('path')
    .attr('fill', 'none')
    .attr('stroke', 'rgba(148,163,184,0.35)')
    .attr('stroke-linecap', 'round')
    .attr('stroke-width', d => Math.max(1.2, d.width || 1))
    .attr('stroke-opacity', d => d.depth === 1 ? 0.72 : 0.34);

  const linkFlow = g.append('g').selectAll('path').data(links).join('path')
    .attr('class', 'flow-link')
    .attr('fill', 'none')
    .attr('stroke', 'rgba(96,165,250,0.45)')
    .attr('stroke-linecap', 'round')
    .attr('stroke-width', d => Math.max(0.8, (d.width || 1) * 0.65))
    .attr('stroke-opacity', d => d.depth === 1 ? 0.42 : 0.22)
    .style('pointer-events', 'none')
    .style('animation-duration', d => `${Math.max(0.8, 2.6 - Math.min(2, (d.width || 1) * 0.2))}s`);

  const node = g.append('g').selectAll('g').data(nodes).join('g')
    .attr('cursor', 'pointer')
    .attr('opacity', 0)
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

  const stockNodes = node.filter(d => d.type === 'stock');
  stockNodes.append('rect')
    .attr('x', d => -Math.max(48, String(d.label || '').length * 8) / 2)
    .attr('y', -12)
    .attr('width', d => Math.max(48, String(d.label || '').length * 8))
    .attr('height', 24)
    .attr('rx', 11)
    .attr('fill', (d) => {
      if (d.classKind === 'center_stock') return '#0ea5e9';
      if (d.classKind === 'main_asset') return '#2563eb';
      if (d.classKind === 'satellite_asset') return '#f59e0b';
      if (d.classKind === 'shared_asset') return '#8b5cf6';
      return '#334155';
    })
    .attr('stroke', (d) => {
      if (d.classKind === 'center_stock') return 'rgba(125,211,252,0.82)';
      if (d.classKind === 'main_asset') return 'rgba(147,197,253,0.62)';
      if (d.classKind === 'satellite_asset') return 'rgba(253,230,138,0.68)';
      if (d.classKind === 'shared_asset') return 'rgba(216,180,254,0.62)';
      return 'rgba(226,232,240,0.15)';
    });
  stockNodes.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#fff')
    .attr('font-size', '10px')
    .attr('font-weight', 600)
    .text(d => d.label);

  const investorNodes = node.filter(d => d.type === 'investor');
  investorNodes.append('circle')
    .attr('r', d => d.id === centerNodeId ? 18 : 12)
    .attr('fill', (d) => d.highRisk ? 'rgba(239,68,68,0.2)' : 'rgba(20,184,166,0.2)')
    .attr('stroke', (d) => d.highRisk ? 'rgba(248,113,113,0.45)' : 'rgba(45,212,191,0.4)');
  investorNodes.append('circle')
    .attr('r', d => d.id === centerNodeId ? 13 : 9)
    .attr('fill', (d) => {
      if (d.classKind === 'center_investor') return '#10b981';
      if (d.highRisk) return '#dc2626';
      return '#14b8a6';
    })
    .attr('stroke', 'rgba(255,255,255,0.12)')
    .classed('center-pulse', d => d.id === centerNodeId);
  investorNodes.append('text')
    .attr('x', d => (d.id === centerNodeId ? 16 : 12))
    .attr('dy', '0.35em')
    .attr('fill', '#e2e8f0')
    .attr('font-size', d => d.id === centerNodeId ? '11px' : '10px')
    .text((d) => {
      const lim = d.id === centerNodeId ? 26 : 18;
      return d.label.length > lim ? `${d.label.slice(0, lim - 1)}...` : d.label;
    });

  const groupNodes = node.filter(d => d.type === 'group');
  groupNodes.append('rect')
    .attr('x', d => -Math.max(64, String(d.label || '').length * 6.2) / 2)
    .attr('y', -11)
    .attr('width', d => Math.max(64, String(d.label || '').length * 6.2))
    .attr('height', 22)
    .attr('rx', 11)
    .attr('fill', 'rgba(245,158,11,0.24)')
    .attr('stroke', 'rgba(245,158,11,0.85)');
  groupNodes.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#fef3c7')
    .attr('font-size', '10px')
    .attr('font-weight', 700)
    .text((d) => {
      const lim = 20;
      return d.label.length > lim ? `${d.label.slice(0, lim - 1)}...` : d.label;
    });

  let tooltip = d3.select('body').select('.graph-tooltip');
  if (tooltip.empty()) tooltip = d3.select('body').append('div').attr('class', 'graph-tooltip').style('display', 'none');

  node.transition().duration(420).ease(d3.easeCubicOut).attr('opacity', 1);
  link.attr('stroke-opacity', 0).transition().duration(420).attr('stroke-opacity', d => d.depth === 1 ? 0.72 : 0.34);
  linkFlow.attr('stroke-opacity', 0).transition().duration(620).attr('stroke-opacity', d => d.depth === 1 ? 0.42 : 0.22);

  node.on('click', (event, d) => {
    event.stopPropagation();
    hideGraphTooltip();
    if (d.type === 'group') {
      jumpToRelationsByGroupFromNetwork(d.label);
      return;
    }
    const navType = d.type === 'stock' ? 'ticker' : 'entity';
    navigateNetwork(navType, d.label, true);
  }).on('mouseover', (event, d) => {
    const connected = new Set([d.id]);
    links.forEach((l) => {
      const s = l.source.id || l.source;
      const t = l.target.id || l.target;
      if (s === d.id) connected.add(t);
      if (t === d.id) connected.add(s);
    });
    node.style('opacity', n => connected.has(n.id) ? 1 : 0.14);
    link.style('stroke-opacity', (l) => {
      const s = l.source.id || l.source;
      const t = l.target.id || l.target;
      return (s === d.id || t === d.id) ? 0.95 : 0.06;
    });
    linkFlow.style('stroke-opacity', (l) => {
      const s = l.source.id || l.source;
      const t = l.target.id || l.target;
      return (s === d.id || t === d.id) ? 0.72 : 0.04;
    });
    tooltip.style('display', 'block').html(d.tooltipHtml || esc(d.label));
    tooltip.style('left', `${event.pageX + 12}px`).style('top', `${event.pageY + 12}px`);
  }).on('mousemove', (event) => {
    tooltip.style('left', `${event.pageX + 12}px`).style('top', `${event.pageY + 12}px`);
  }).on('mouseout', () => {
    node.style('opacity', 1);
    link.style('stroke-opacity', l => l.depth === 1 ? 0.72 : 0.34);
    linkFlow.style('stroke-opacity', l => l.depth === 1 ? 0.42 : 0.22);
    tooltip.style('display', 'none');
  });

  svg.on('click', () => {
    node.style('opacity', 1);
    link.style('stroke-opacity', l => l.depth === 1 ? 0.72 : 0.34);
    linkFlow.style('stroke-opacity', l => l.depth === 1 ? 0.42 : 0.22);
    tooltip.style('display', 'none');
  });

  const curvedPath = (d) => {
    const sx = d.source.x || 0;
    const sy = d.source.y || 0;
    const tx = d.target.x || 0;
    const ty = d.target.y || 0;
    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const dr = dist * (d.depth === 1 ? 0.26 : 0.18);
    return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`;
  };

  simulation.on('tick', () => {
    link.attr('d', curvedPath);
    linkFlow.attr('d', curvedPath);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });
}

function wireEvents() {
  const dataModal = document.getElementById('dataInputModal');
  const openDataBtn = document.getElementById('openDataInputModalBtn');
  const closeDataBtn = document.getElementById('dataInputModalCloseBtn');
  if (openDataBtn && dataModal) {
    openDataBtn.addEventListener('click', () => dataModal.classList.remove('hidden'));
  }
  if (closeDataBtn && dataModal) {
    closeDataBtn.addEventListener('click', () => dataModal.classList.add('hidden'));
  }
  if (dataModal) {
    dataModal.addEventListener('click', (e) => {
      if (e.target.id === 'dataInputModal') dataModal.classList.add('hidden');
    });
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => setActiveView(btn.dataset.target));
  });

  document.getElementById('globalSearch').addEventListener('input', (e) => {
    state.search = e.target.value;
    const target = detectSearchTarget(state.search);
    if (target) setActiveView(target);
    renderAll();
  });

  const slider = document.getElementById('filterPct');
  slider.addEventListener('input', (e) => {
    state.minPct = Number(e.target.value || 0);
    document.getElementById('valRange').innerText = `${state.minPct}%`;
    renderAll();
  });

  document.getElementById('loadBtn').addEventListener('click', async () => {
    try {
      const olderRaw = await parseJsonFile(document.getElementById('olderFile'));
      const newerRaw = await parseJsonFile(document.getElementById('newerFile'));
      const marketRaw = await parseOptionalObjectFile(document.getElementById('marketFile'));
      const notasiRaw = await parseOptionalObjectFile(document.getElementById('notasiFile'));
      const freeFloatRaw = await parseOptionalObjectFile(document.getElementById('freeFloatFile'));
      await loadSnapshotsData({
        olderRaw,
        newerRaw,
        marketRaw,
        notasiRaw,
        freeFloatRaw,
        closeModal: true,
      });
    } catch (err) {
      alert(err.message);
    }
  });

  const bindRelationControl = (id, key, parseFn = (v) => v) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(evt, (e) => {
      state.relationFilter[key] = parseFn(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
      renderAll();
    });
  };

  bindRelationControl('relTypeFilter', 'type');
  bindRelationControl('relOriginFilter', 'origin');
  bindRelationControl('relGroupFilter', 'group');
  bindRelationControl('relTickerFilter', 'ticker');
  bindRelationControl('relEntityFilter', 'entity');
  bindRelationControl('relIssuerFilter', 'issuer');
  bindRelationControl('relPctMinFilter', 'pctMin', (v) => Number(v || 0));
  bindRelationControl('relPctMaxFilter', 'pctMax', (v) => Number(v || 100));
  bindRelationControl('relMinEntityLinks', 'minEntityLinks', (v) => Math.max(1, Number(v || 1)));
  bindRelationControl('relMinTickerLinks', 'minTickerLinks', (v) => Math.max(1, Number(v || 1)));
  bindRelationControl('relBridgeOnly', 'bridgeOnly', (v) => Boolean(v));
  bindRelationControl('relGraphFocusType', 'graphFocusType');
  bindRelationControl('relGraphFocusValue', 'graphFocusValue');
  bindRelationControl('relGraphEdgeLimit', 'graphEdgeLimit', (v) => Math.min(400, Math.max(20, Number(v || 120))));

  const resetBtn = document.getElementById('relResetFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.relationFilter = {
        type: 'all',
        origin: 'all',
        group: 'all',
        ticker: '',
        entity: '',
        issuer: '',
        pctMin: 0,
        pctMax: 100,
        minEntityLinks: 1,
        minTickerLinks: 1,
        bridgeOnly: false,
        graphFocusType: 'all',
        graphFocusValue: '',
        graphEdgeLimit: 120,
      };
      const defaults = [
        ['relTypeFilter', 'all'],
        ['relOriginFilter', 'all'],
        ['relGroupFilter', 'all'],
        ['relTickerFilter', ''],
        ['relEntityFilter', ''],
        ['relIssuerFilter', ''],
        ['relPctMinFilter', '0'],
        ['relPctMaxFilter', '100'],
        ['relMinEntityLinks', '1'],
        ['relMinTickerLinks', '1'],
        ['relGraphFocusType', 'all'],
        ['relGraphFocusValue', ''],
        ['relGraphEdgeLimit', '120'],
      ];
      defaults.forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
      });
      const bridge = document.getElementById('relBridgeOnly');
      if (bridge) bridge.checked = false;
      renderAll();
    });
  }

  const bindWhaleControl = (id, key, parseFn = (v) => v) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(evt, (e) => {
      state.whaleFilter[key] = parseFn(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
      renderAll();
    });
  };
  bindWhaleControl('whaleTypeFilter', 'type');
  bindWhaleControl('whaleOriginFilter', 'origin');
  bindWhaleControl('whaleMinAssetsFilter', 'minAssets', (v) => Math.max(1, Number(v || 1)));
  bindWhaleControl('whaleMultiOnlyFilter', 'multiOnly', (v) => Boolean(v));

  const stockSectorEl = document.getElementById('stockSectorFilter');
  const stockFloatRatioEl = document.getElementById('stockFloatRatioFilter');
  const stockSortEl = document.getElementById('stockSortFilter');
  if (stockSortEl) {
    stockSortEl.addEventListener('change', (e) => {
      state.stockFilter.sort = e.target.value || 'az';
      renderAll();
    });
  }
  if (stockSectorEl) {
    stockSectorEl.addEventListener('change', (e) => {
      state.stockFilter.sector = e.target.value || 'all';
      renderAll();
    });
  }
  if (stockFloatRatioEl) {
    stockFloatRatioEl.addEventListener('change', (e) => {
      state.stockFilter.floatRatio = e.target.value || 'all';
      renderAll();
    });
  }
  const stockNotasiEl = document.getElementById('stockNotasiFilter');
  if (stockNotasiEl) {
    stockNotasiEl.addEventListener('change', (e) => {
      state.stockFilter.notasi = e.target.value || 'all';
      setStockNotasiHelp();
      renderAll();
    });
  }

  const whaleResetBtn = document.getElementById('whaleResetFilters');
  if (whaleResetBtn) {
    whaleResetBtn.addEventListener('click', () => {
      state.whaleFilter = { type: 'all', origin: 'all', minAssets: 1, multiOnly: false };
      const defaults = [
        ['whaleTypeFilter', 'all'],
        ['whaleOriginFilter', 'all'],
        ['whaleMinAssetsFilter', '1'],
      ];
      defaults.forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      });
      const multi = document.getElementById('whaleMultiOnlyFilter');
      if (multi) multi.checked = false;
      renderAll();
    });
  }

  const modal = document.getElementById('networkModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'networkModal') closeNetworkGraph();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeNetworkGraph();
    if (dataModal && !dataModal.classList.contains('hidden')) dataModal.classList.add('hidden');
  });
  const backBtn = document.getElementById('networkBackBtn');
  const forwardBtn = document.getElementById('networkForwardBtn');
  if (backBtn) backBtn.addEventListener('click', networkBack);
  if (forwardBtn) forwardBtn.addEventListener('click', networkForward);
}

document.addEventListener('DOMContentLoaded', () => {
  loadEmpireOverridesFromMemory();
  wireEvents();
  setActiveView('stocks');
  populateRelationFilterOptions();
  populateWhaleFilterOptions();
  populateStockSectorFilter();
  setStockNotasiHelp();
  renderAll();
  bootWithAutoLoad().catch((err) => {
    console.warn('Auto load failed:', err);
  });
});

# Position Tracker (Vercel-ready)

Aplikasi dibuat **HTML + JavaScript** dengan endpoint serverless untuk auto-fetch Market 1D saat deploy di Vercel.

Panduan lengkap pengguna tersedia di `USER_GUIDE.md`.

## Langkah Pakai

1. Parse PDF jadi snapshot JSON:

```bash
python scripts/import_pdf.py 74cc72f7e5_29d7ff8853.pdf
```

1b. (Opsional) Ambil data `1 day change` market lewat yfinance untuk ticker `.JK`:

```bash
python scripts/fetch_market_change.py --snapshot data/store/snapshots/positions_2026-02-27.json
```

1c. Proses konteks notasi emiten (IDX notasi khusus):

```bash
python scripts/process_notasi.py
```

1d. Proses klasifikasi sektor emiten:

```bash
python scripts/process_sector.py
```

1e. (Opsional) Estimasi free float ratio (mode estimasi, bukan angka resmi IDX):

```bash
python scripts/estimate_free_float.py --listed "Daftar Saham  - 20260308.xlsx"
```

Catatan free float:
- `Daftar Saham  - 20260308.xlsx` dipakai sebagai baseline `total listed shares` (boleh dianggap relatif tetap sampai ada update IDX).
- Data kepemilikan dari PDF snapshot bisa di-update bulanan.
- Output estimasi:
  - `data/store/free_float/estimated_free_float_<snapshot_date>.json`
  - `data/store/free_float/estimated_free_float_<snapshot_date>.csv`
- Metode ini adalah **estimasi** karena data disclosure `>1%` tidak mencakup seluruh holder `<1%`.

2. Buka file `index.html` di browser.
3. App akan auto-load snapshot terbaru dari `data/store/snapshot_index.json` saat start (jika tersedia).
4. Jika ingin override manual, klik tombol `Input Data` (di bawah judul app `Position Tracker` pada sidebar), lalu load file:
- `data/store/snapshots/positions_<tanggal_lama>.json` (opsional)
- `data/store/snapshots/positions_<tanggal_baru>.json`
- `data/store/market/changes_<tanggal>.json` (opsional untuk tampil `1D`)

Catatan autoload market:
- jika `Market 1D` tidak dipilih manual, app otomatis mencoba load:
  - endpoint serverless `GET /api/market_1d?snapshot_date=<YYYY-MM-DD>` (utama, Vercel)
  - fallback `data/store/market/changes_<snapshot_date>.json`
  - fallback `data/store/market/changes_latest.json`

Catatan autoload notasi:
- jika `Notasi` tidak dipilih manual, app otomatis mencoba load:
  - `data/store/notasi/notasi_latest.json`
  - fallback `Notasi/notasi_latest.json`

Catatan autoload sektor:
- sektor sekarang dibaca dari file hardcoded `sector_hardcoded.js` (tanpa pilih file manual).
- update hardcoded sektor cukup jalankan: `python scripts/process_sector.py`

Opsional cleanup file legacy lokal:

```bash
powershell -ExecutionPolicy Bypass -File scripts/cleanup_legacy.ps1
```
5. Gunakan fitur:
- lihat posisi per snapshot
- whales directory per entitas
- compare movement antar snapshot
- connection relation emiten-entitas (network map + relation table)
- interactive network graph style (mirip Whale Tracker reference) via `View Network`
- filter monitor mapping: type, origin, ticker/entity/issuer, range %, minimum link, bridge-only, graph focus

## Deploy Vercel

- `vercel.json` sudah include konfigurasi function untuk `api/market_1d.py`.
- Status sidebar sekarang ditampilkan sebagai `Online`.
- Pastikan folder `data/store/...` ikut terdeploy agar fallback data lokal tetap tersedia.

## Mapping Kuat yang Dipakai

- `investor_key`: normalisasi nama investor (stabil lintas bulan)
- `position_key`: `snapshot_date|share_code|investor_key`
- Compare movement memakai kombinasi `(share_code, investor_key)` agar robust untuk tracking pemindahan posisi.

## Output Parsing

Saat import PDF sukses:
- `data/store/snapshots/positions_<snapshot_date>.json`
- `data/store/snapshots/summary_<snapshot_date>.json`
- `data/store/exports/positions_<snapshot_date>.csv`
- `data/store/exports/positions_<snapshot_date>.json`

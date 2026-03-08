# User Guide - Position Tracker Keterbukaan Informasi >1%

Dokumen ini menjelaskan alur pakai terbaru, termasuk autoload snapshot dan Market 1D (yfinance).

## 1) Tujuan

Aplikasi dipakai untuk:
- Parse PDF keterbukaan kepemilikan >1%
- Mapping posisi investor per emiten
- Tracking perubahan antar snapshot
- Analisis koneksi emiten-entity lewat network graph interaktif

## 2) File Penting

- `index.html`: UI web
- `scripts/import_pdf.py`: parse PDF -> snapshot JSON
- `scripts/fetch_market_change.py`: ambil Market 1D dari yfinance (`.JK`)
- `scripts/process_notasi.py`: proses konteks notasi emiten
- `scripts/process_sector.py`: proses klasifikasi sektor emiten
- `scripts/estimate_free_float.py`: estimasi free float ratio (mode estimasi)
- `data/store/snapshots/positions_<tanggal>.json`: snapshot posisi
- `api/market_1d.py`: endpoint serverless yfinance untuk Market 1D (Vercel)
- `data/store/market/changes_<tanggal>.json`: market 1D fallback lokal
- `data/store/market/changes_latest.json`: salinan market terbaru untuk autoload
- `data/store/market/changes_<tanggal>.js` dan `changes_latest.js`: fallback autoload untuk mode `file://`
- `data/store/notasi/notasi_latest.json`: konteks notasi emiten
- `data/store/sektor/sector_latest.json`: klasifikasi sektor emiten
- `data/store/free_float/estimated_free_float_<tanggal>.json`: hasil estimasi free float

## 3) Setup

```bash
pip install -r requirements.txt
```

## 4) Workflow Bulanan

### A. Parse PDF snapshot

```bash
python scripts/import_pdf.py <nama_file_pdf>.pdf
```

Contoh:

```bash
python scripts/import_pdf.py 74cc72f7e5_29d7ff8853.pdf
```

### B. Ambil Market 1D (yfinance)

```bash
python scripts/fetch_market_change.py --snapshot data/store/snapshots/positions_<tanggal>.json
```

Contoh:

```bash
python scripts/fetch_market_change.py --snapshot data/store/snapshots/positions_2026-02-27.json
```

Output yang dihasilkan:
- `changes_<tanggal>.json`
- `changes_latest.json`
- `changes_<tanggal>.js`
- `changes_latest.js`

### C. Proses konteks notasi emiten

Jalankan:

```bash
python scripts/process_notasi.py
```

Output:
- `data/store/notasi/notasi_latest.json`
- `data/store/notasi/notasi_latest.js`
- mirror `Notasi/notasi_latest.json` dan `Notasi/notasi_latest.js`

### D. Proses klasifikasi sektor emiten

Jalankan:

```bash
python scripts/process_sector.py
```

Output:
- `data/store/sektor/sector_latest.json`
- `data/store/sektor/sector_latest.js`
- mirror `Sektor/sector_latest.json` dan `Sektor/sector_latest.js`

### E. Buka UI

Buka `index.html`.

### F. Load data

Saat startup, app otomatis mencoba load snapshot terbaru (dan 1 snapshot sebelumnya) dari `data/store/snapshot_index.json`.
Status sidebar ditampilkan sebagai `Online`.

Klik tombol `Input Data` di sidebar (di bawah judul `Position Tracker`), lalu isi:
- `Snapshot Lama` (opsional)
- `Snapshot Baru` (utama)
- `Market 1D` (opsional)
- `Notasi` (opsional)
- klik `Load Snapshot`

### G. Estimasi Free Float (opsional)

Gunakan baseline listed shares dari file:
- `Daftar Saham  - 20260308.xlsx` (cenderung lebih stabil)

Sementara data kepemilikan dari PDF snapshot dapat di-update bulanan.

Jalankan:

```bash
python scripts/estimate_free_float.py --listed "Daftar Saham  - 20260308.xlsx"
```

Output:
- `data/store/free_float/estimated_free_float_<snapshot_date>.json`
- `data/store/free_float/estimated_free_float_<snapshot_date>.csv`

Penting:
- hasil ini bertipe **estimasi** (bukan angka resmi IDX),
- karena disclosure `>1%` tidak mencakup seluruh holder `<1%`,
- dan klasifikasi afiliasi/controller bisa butuh override manual.

## 5) Auto-load Market 1D

Jika `Market 1D` tidak dipilih manual, app otomatis mencoba:
1. endpoint `GET /api/market_1d?snapshot_date=<YYYY-MM-DD>` (utama untuk Vercel)
2. `data/store/market/changes_<snapshot_date>.json`
3. fallback `data/store/market/changes_latest.json`
4. fallback mode `file://` via script:
   - `changes_<snapshot_date>.js`
   - `changes_latest.js`

Status autoload terlihat di bagian status load: `market1D: <jumlah> [manual/auto/not_found]`.

## 5b) Auto-load Notasi

Jika `Notasi` tidak dipilih manual, app otomatis mencoba:
1. `data/store/notasi/notasi_latest.json`
2. fallback `Notasi/notasi_latest.json`
3. fallback mode `file://` via script `.js`

Status autoload terlihat di bagian status load: `notasi: <jumlah> [manual/auto/not_found]`.

## 5c) Auto-load Sektor

Sektor sekarang hardcoded dari `sector_hardcoded.js` (tanpa input manual di UI).
Untuk update data sektor berkala, jalankan:

```bash
python scripts/process_sector.py
```

Status load menampilkan: `sector: <jumlah> [hardcoded/not_found]`.

## 6) Panduan Fitur Utama

### A. Stocks Directory

- Lihat holder per emiten
- Klik holder untuk chain-link ke network entity
- Tampilkan 1D change emiten
- Lihat label sektor per emiten
- Gunakan `Sector Filter` untuk fokus analisis per sektor
- Gunakan `Notasi Filter` untuk fokus emiten berdasarkan kode notasi (berdasarkan `notasi_keterangan.csv`)

### B. Whales Directory

- Cari entity dengan filter khusus:
  - `Entity`
  - `Type`
  - `Origin`
  - `Min Assets`
  - `Multi-asset only`
- Klik ticker/entity untuk chain-link network

### C. Movement Radar

- Bandingkan snapshot lama vs baru
- Kategori: `NEW`, `EXIT`, `INCREASE`, `DECREASE`

### D. Connection Relation

- Network map emiten-entity
- Filter monitor mapping:
  - `Type`, `Origin`, `Ticker`, `Entity`, `Issuer`
  - `% Min`, `% Max`
  - `Min Entity Links`, `Min Ticker Links`
  - `Bridge Only`
  - `Graph Focus`, `Graph Edge Limit`

## 7) Chain Linking & Network

- Klik node (ticker/entity) untuk lanjut ke koneksi berikutnya
- Gunakan tombol `Back` / `Forward` di modal network
- Tabel detail punya `Show/Hide Table` + hover-reveal

## 8) Troubleshooting Cepat

1. `fetch_market_change.py` gagal
- pastikan internet aktif
- jalankan ulang command market
- cek file output muncul di `data/store/market/`

2. Market 1D tidak muncul
- cek status load (`market1D`)
- untuk Vercel, cek endpoint `/api/market_1d` tidak error
- pastikan file market fallback sesuai tanggal snapshot
- jika mode `file://`, pastikan file `.js` market juga ada

3. Data terasa duplikat
- snapshot sudah dedup otomatis berdasarkan `share_code + investor_key` saat load UI

4. Free float estimasi terlihat terlalu tinggi/rendah
- cek apakah snapshot bulan terbaru sudah diimport
- gunakan file listed shares terbaru jika ada perubahan saham tercatat
- pertimbangkan override exclusion map / portfolio approved saat dibutuhkan

## 9) Checklist Operasional

1. Import PDF bulanan
2. Generate market 1D yfinance
3. Buka UI dan load snapshot
4. Verifikasi status `market1D`
5. (Opsional) Generate estimasi free float
6. Review Stocks, Whales, Movement, Relation

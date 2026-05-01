# Fishery Sales Dashboard

An interactive, client-side KPI dashboard for multi-location fishery sales analytics. Built with vanilla HTML/JS and Chart.js — no backend, no build step, no framework. Drop in a CSV exported from Excel or Google Sheets and get instant analytics.

![Dashboard screenshot](Screenshot.png)

---

## Features

### KPIs & Metrics
- **Gross / net revenue** for any selected period
- **Gross margin %** aggregated and per fish type
- **Kg sold, waste, leftover stock** with immobilized value
- **Total purchase cost** per period

### Filters
- **Granularity**: Day · Week · Month · Quarter · Year
- **Cascading multi-select filters**: Year → Month → Week → Location
  - Ctrl+click to select multiple values simultaneously
  - Filters update dynamically based on upstream selections

### Cross-filtering (Power BI / QuickSight style)
- Click any chart (category, fish, supplier) to filter all others
- Click a table row to filter all charts
- Active filter badge with one-click reset

### Charts

| Chart | Description |
|-------|-------------|
| Trend (gross/net + margin %) | Bar chart + dual-line, secondary Y axis for margin |
| Revenue by category | Donut with percentage legend |
| Net margin by fish | Horizontal bars sorted by margin %, labeled with € and % |
| Revenue Map | Bubble chart: X = kg sold, Y = margin %, bubble size = gross revenue |
| Supplier spend | Vertical bars + donut |

### Highlights
- **Top 3 / Bottom 3 fish** by margin %
- **Best day / week / month / quarter / year** showing net, gross, volume and margin

### Period-over-period analysis
- **WoW** (Week over Week), **MoM** (Month over Month), **YoY** (Year over Year)
- Compares only **complete periods** — the current week/month/year is excluded automatically
- Metrics: Δ net revenue, Δ gross revenue, Δ volume (kg), Δ margin %, Δ costs

### Tables
- **Fish detail table**: sortable by any column, scrollable, cross-filter on row click
- **Raw data table**: all rows visible after active filters, sortable, with row counter

---

## Project structure

```
fishery-sales-dashboard/
├── pescheria_kpi_dashboard.html   # Full app (HTML + inline CSS)
├── dashboard_script.js            # JS logic: parsing, dedup, aggregation, charts
├── sample_data.csv                # Sample data (expected CSV structure)
├── README.md
└── .gitignore
```

> **The real CSV file is not included in this repository** (contains business-sensitive data).  
> Use `sample_data.csv` as a reference for the expected structure.

---

## Usage

### Option A — Local HTTP server (recommended)
Automatic CSV loading requires an HTTP server (browsers block `fetch()` on `file://`).

```bash
# In the project folder:
python3 -m http.server 8000
# then open: http://localhost:8000/pescheria_kpi_dashboard.html
```

The CSV file must be named exactly:
```
Pescheria - Abascià Excel - Lavoro - Dataset Pesce.csv
```
and placed in the same folder as the HTML file.

### Option B — Manual file load
Open `pescheria_kpi_dashboard.html` directly in the browser and click the **📂 Load CSV** button in the top-right corner. Works without a server.

---

## Expected CSV format

The file must be a comma-separated CSV with column headers in the first row. Relevant columns:

| Column | Type | Example |
|--------|------|---------|
| `Data` | Date `DD/MM/YYYY` | `03/04/2026` |
| `Pescheria` | Text | `Grassano` |
| `Pesce` | Text | `Calamari` |
| `Fornitore` | Text | `Meridional` |
| `Categoria` | Text | `Decongelato` |
| `Qta. Acquistata per pescheria (Kg)` | IT number | `30` |
| `Prezzo Acquisto al Kg` | IT currency | `8,50 €` |
| `Prezzo Vendita Medio (Kg)` | IT currency | `15,00 €` |
| `Rimanenza o non venduto (Kg)` | IT number | `3,6` |
| `Gettato (Kg)` | IT number | `0` |
| `Scarto Totale Lotto (automatico)` | IT number | `3,6` |
| `Spese` | IT currency | `255,00 €` |
| `Incasso (lordo)` | IT currency | `396,00 €` |
| `Incasso (netto)` | IT currency | `141,00 €` |
| `Margine Lordo (%)` | IT percentage | `35,61%` |
| `Qta. Venduta (Kg)` | IT number | `26,4` |
| `ROI Pesce %` | IT percentage | `43,33%` |

> Numbers use **comma as decimal separator** and **period as thousands separator** (Italian format). Currency values may have the `€` symbol before or after the number.

---

## Data pipeline

### 1. Automatic deduplication

The source dataset contained **duplicate day-blocks** — entire days of sales inserted twice (likely from a double export or copy-paste in Excel). Out of 2,002 original rows, 279 were duplicates.

**Primary key used for deduplication** (9 fields):

```
Date · Location · Fish (normalized) · Supplier · Category ·
Qty Purchased · Purchase Price · Sale Price · Leftover Qty
```

Implementation in `buildFromCSV()` inside `dashboard_script.js`:

```javascript
const pk = [
  d.toISOString().slice(0, 10),  // Date
  pe,                             // Location
  psc,                            // Fish (already normalized)
  forn,                           // Supplier
  cat,                            // Category
  (row[iQa] || '').trim(),        // Qty Purchased
  (row[iPa] || '').trim(),        // Purchase Price
  (row[iPv] || '').trim(),        // Sale Price
  (row[iRim] || '').trim(),       // Leftover Qty
].join('|');

if (seenPK.has(pk)) continue;    // skip duplicate
seenPK.add(pk);
```

The deduplication runs **in memory at load time** — the source CSV is never modified. Every time you reload the same file, duplicates are removed automatically.

**Why these 9 fields and not all 28?**  
Using all fields as the key would keep rows with the same transaction but a trivially different field (e.g. `Meteo` empty vs "Sole"). The 9-field key uniquely identifies a real commercial transaction.

**Duplicate blocks found in the original dataset:**

| Date | Location | Duplicate rows |
|------|----------|---------------:|
| 06/03/2026 | Grassano + Brigante | 34 |
| 09/03/2026 | Grassano | 8 |
| 10/03/2026 | Grottole | 11 |
| 18/03/2026 | Grassano | 22 |
| 19/03/2026 | Grottole | 17 |
| 20/03/2026 | Grassano | 29 |
| 23/03/2026 | Grassano | 7 |
| 24/03/2026 | Grottole | 10 |
| 25/03/2026 | Grassano | 22 |
| 26/03/2026 | Grottole | 14 |
| 27/03/2026 | Grassano + Brigante | 33 |
| 30/03/2026 | Grassano | 9 |
| 31/03/2026 | Grottole | 15 |
| 01/04/2026 | Grassano | 19 |
| 02/04/2026 | Grottole | 15 |
| 03/04/2026 | Grassano | 13 |
| 27/02/2026 | Grassano | 1 |
| **Total** | | **279** |

> **Alternative**: clean the file at source in Excel/Google Sheets using  
> `Data → Remove Duplicates`, selecting the same 9 columns as the key.

---

### 2. Fish name normalization

The dataset contained **40+ spelling variants** of the same fish due to case differences, abbreviations, typos and alternative names. The `FISH_NORM()` function in `dashboard_script.js` maps all variants to a canonical name before any aggregation or deduplication occurs.

| Raw variants in CSV | Canonical name |
|--------------------|----------------|
| `Coda di rospo`, `Code di rospo` | `Coda di Rospo` |
| `Cozza grecia`, `Cozze grecia` | `Cozze Grecia` |
| `Cozza pelosa` | `Cozze Pelosa` |
| `Cozza sfusa` | `Cozze Sfusa` |
| `Cozza treccia`, `Cozze treccia` | `Cozze Treccia` |
| `Cozze spagna` | `Cozze Spagna` |
| `Gamberi 20/30` | `Gamberi 20/30` |
| `Gamberi salipci` | `Gamberi Salipci` |
| `Gamberoni l1`, `L1 Argentino` | `Gamberoni L1` |
| `Merluzzi`, `Merluzzo 1`, `Merluzzo 2`, `Merluzzo prima` | `Merluzzo` |
| `Merluzzo seconda` | `Merluzzo Seconda` |
| `Orata`, `Orata a` | `Orata` |
| `Orata g`, `Orate g` | `Orata G` |
| `Orate`, `Orate a` | `Orate` |
| `Pancasio`, `Pangasio` | `Pangasio` |
| `Pesce spada`, `Pesce Spada` | `Pesce Spada` |
| `Pescatrici`, `Pescatrice` | `Pescatrice` |
| `Polpo`, `Polpi` | `Polpo` |
| `Polpo  T7` | `Polpo T7` |
| `Polpo T4` | `Polpo T4` |
| `Polpo t8`, `Polpi t8`, `Polipi t8` | `Polpo T8` |
| `Raia`, `Raya`, `Razza` | `Razza` |
| `Seppia 10/20` | `Seppia 10/20` |
| `Seppia cioco`, `Seppie cioco` | `Seppia Cioco` |
| `Seppia pulita`, `Seppie pulita`, `Seppie pulite` | `Seppia Pulita` |
| `Seppia pulita 10/20`, `Seppie pulite 10/20` | `Seppia Pulita 10/20` |
| `Seppie pulita gold` | `Seppia Pulita Gold` |
| `Seppia sporca` | `Seppia Sporca` |
| `Seppie 10/20` | `Seppie 10/20` |
| `Seppie 20/40` | `Seppie 20/40` |
| `Sogliola (lingua)` | `Sogliola Lingua` |
| `Sogliola (tigri)`, `Sogliola tigri`, `Sogliola(TIgri)`, `Sogliole tigri` | `Sogliola Tigri` |
| `Spigola`, `Spigola a` | `Spigola` |
| `Spigola g`, `Spigole g`, `Spigole 2g`, `Spigole 3g` | `Spigola G` |
| `Spigole` | `Spigole` |
| `Baccala Congelato` | `Baccalà Congelato` |
| `Baccalà salato` | `Baccalà Salato` |
| `Vongole v.` | `Vongole V.` |
| `Vongole lupini` | `Vongole Lupini` |
| `Lupini mega` | `Lupini Mega` |

Any name not found in the map is title-cased automatically as a fallback (e.g. `pesce spada` → `Pesce Spada`).

---

### 3. Italian number format parsing

The CSV uses Italian number formatting (comma decimal, period thousands, € symbol). The `parseNum()` function handles all formats present in the file:

```javascript
// Handles: "8,50 €" / "€ 141,00" / "35,61%" / "26,4" / ""
function parseNum(s) {
  let v = String(s).trim()
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .replace(/%/g, '')
    .replace(/\./g, '')   // remove thousands separator
    .replace(/,/g, '.');  // convert IT decimal → EN decimal
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
}
```

---

### 4. Calculation formulas

Economic values are read **directly from the CSV** (already computed by Excel) rather than recalculated, ensuring consistency with the source file:

| Metric | Excel formula | CSV column |
|--------|--------------|------------|
| Purchase cost | `Qty × Purchase price` | `Spese` |
| Gross revenue | `Qty sold × Sale price` | `Incasso (lordo)` |
| Net revenue | `Gross − Purchase cost` | `Incasso (netto)` |
| Margin % | `Net / Gross × 100` | `Margine Lordo (%)` |
| ROI % | `(Sale price − Purchase price) / Sale price × 100` | `ROI Pesce %` |
| Qty sold | `Qty purchased − Waste − Leftover − Discarded` | `Qta. Venduta (Kg)` |

**Aggregated margin % (volume-weighted average)**

When showing the margin % for a fish across multiple days or locations, a simple average of row percentages would give equal weight to large and small batches — which is economically incorrect.

Example with two batches of different sizes:

| Batch | Gross | Net | Row margin % |
|-------|------:|----:|-------------:|
| Small batch | €100 | €20 | 20% |
| Large batch | €900 | €360 | 40% |
| **Total** | **€1,000** | **€380** | |

- Simple average: (20 + 40) / 2 = **30%** ← wrong, treats both batches equally
- Volume-weighted: 380 / 1,000 × 100 = **38%** ← correct, the large batch (€900) carries 9× more weight

The dashboard always uses the volume-weighted method:

```javascript
mp: f.il > 0 ? f.inn / f.il * 100 : 0   // Σ net / Σ gross × 100
```

---

## Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| [Chart.js](https://www.chartjs.org/) | 4.4.1 | All charts |

Loaded via CDN. No Node.js, no build step, no other dependencies.

---

## Browser compatibility

Tested on Chrome 120+, Firefox 121+, Safari 17+. Requires ES2020.

---

## License

MIT — free to use, modify and distribute with attribution.

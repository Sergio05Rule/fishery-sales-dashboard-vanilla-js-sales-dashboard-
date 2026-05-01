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
- **Granularity**: Day (with weekday name: Mon 01/04/2026) · Week · Month · Quarter · Year
- **Cascading multi-select filters**: Year → Month → Week → Location → Supplier
  - Ctrl+click to select multiple values simultaneously
  - Filters update dynamically based on upstream selections
- **Day-of-week filter**: multi-select (Monday–Sunday), applies to all charts and sections
- All dropdown filters apply to both Dataset 1 (fish records) and Dataset 2 (actual cash) simultaneously

### Cross-filtering (Power BI / QuickSight style)
- Click any chart (category, fish, supplier, location, trend bar) to filter all others
- Click a table row to filter all charts
- Active filter badge with one-click reset
- Supported cross-filter types: `cat` (category), `fish` (fish name), `supplier`, `pe` (location), `trend` (time period)

### Charts

| Chart | Description |
|-------|-------------|
| Trend (gross/net + margin %) | Bar chart + dual-line, secondary Y axis for margin. **Clickable** — click a bar to cross-filter all other charts by that period |
| Revenue by category | Donut with percentage legend |
| Net margin by fish | 100% stacked horizontal bars sorted by margin %, labeled with € gross/net. Hover shows margin %, costs %, gross, net, kg sold |
| Revenue Map | Bubble chart: X = kg sold, Y = margin %, bubble size = gross revenue |
| Supplier spend | Vertical bars + donut |

### Fish detail table
- Sortable by any column (click header)
- Scrollable (max height 380px)
- Cross-filter on row click
- Columns: Fish · Category · Gross € · Margin € · Margin % · Avg purchase price €/kg · Avg sale price €/kg · Kg sold · Waste kg · Leftover kg
- Avg prices are **volume-weighted** over the selected period

### Highlights
- **Top 3 / Bottom 3 fish** by margin %
- **Best day / week / month / quarter / year** showing net, gross, volume and margin

### Period-over-period analysis
- **WoW** (Week over Week), **MoM** (Month over Month), **YoY** (Year over Year)
- Compares only **complete periods** — the current week/month/year is excluded automatically
- Each card shows the period date range (weeks show start–end dates)
- Metrics: Δ net revenue, Δ gross revenue, Δ volume (kg), Δ margin %, Δ costs

### Collapsible sections (closed by default)
Three advanced sections are collapsed by default and expand on click:

| Section | Description |
|---------|-------------|
| 📊 Actual vs Fish Record | Compares Dataset 2 (real cash register) against Dataset 1 (fish records). Join key: Date + Location |
| 📅 Pre/Post 10/02/2026 | Analysis of the operational schedule change (which location operates on which day) |
| 🗃 Raw data | All filtered rows from Dataset 1, sortable, with row counter |

### Tables
- **Fish detail table**: sortable, scrollable, cross-filter on row click
- **Raw data table** (collapsible): all Dataset 1 rows after active filters, sortable
- **Actual vs Fish comparison table** (collapsible): per-day join of both datasets with delta columns

---

## Project structure

```
fishery-sales-dashboard/
├── pescheria_kpi_dashboard.html   # Full app (HTML + inline CSS)
├── dashboard_script.js            # JS logic: parsing, dedup, aggregation, charts
├── sample_data.csv                # Sample data (expected CSV structure for Dataset 1)
├── Screenshot.png                 # Dashboard screenshot
├── README.md                      # Public documentation
├── GUIDELINES.md                  # Development guidelines (fish mapping, cross-filter rules, etc.)
└── .gitignore
```

> **Real CSV files are not included in this repository** (contain business-sensitive data).  
> Dataset 1: `Pescheria - Abascià Excel - Lavoro - Dataset Pesce.csv`  
> Dataset 2: `Pescheria - Abascià Excel - Lavoro - Entrate_Uscite.csv`  
> Use `sample_data.csv` as a reference for Dataset 1 structure.

---

## Usage

### Option A — Local HTTP server (recommended)
Automatic CSV loading requires an HTTP server (browsers block `fetch()` on `file://`).

```bash
# In the project folder:
python3 -m http.server 8000
# then open: http://localhost:8000/pescheria_kpi_dashboard.html
```

Both CSV files must be in the same folder as the HTML file:
- `Pescheria - Abascià Excel - Lavoro - Dataset Pesce.csv` (Dataset 1 — fish records)
- `Pescheria - Abascià Excel - Lavoro - Entrate_Uscite.csv` (Dataset 2 — actual cash, optional)

Both are loaded automatically on page open. Dataset 2 is optional — if not found, the Actual section remains hidden until manually loaded via the **📂 Carica Actual** button.
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

The dataset contained **118 unique fish names** across all records. The `FISH_NORM()` function in `dashboard_script.js` maps spelling variants to a canonical name before any aggregation or deduplication. Names not in the explicit map are title-cased automatically.

**Explicit normalization map** (82 raw variants → 48 canonical names):

| Raw variants in CSV | Canonical name |
|--------------------|----------------|
| `Coda di rospo`, `Code di rospo` | `Coda di Rospo` |
| `Cozza grecia`, `Cozze grecia` | `Cozze Grecia` |
| `Cozza pelosa` | `Cozze Pelosa` |
| `Cozza sfusa` | `Cozze Sfusa` |
| `Cozza treccia`, `Cozze treccia` | `Cozze Treccia` |
| `Cozze spagna` | `Cozze Spagna` |
| `Cozze` | `Cozze` |
| `Gamberi 20/30` | `Gamberi 20/30` |
| `Gamberi salipci` | `Gamberi Salipci` |
| `Gamberoni l1`, `L1 Argentino` | `Gamberoni L1` |
| `Gamberi` | `Gamberi` |
| `Merluzzi`, `Merluzzo`, `Merluzzo 1`, `Merluzzo prima` | `Merluzzo Prima` |
| `Merluzzo 2`, `Merluzzo seconda` | `Merluzzo Seconda` |
| `Orata`, `Orate`, `Orata a`, `Orate a` | `Orata A` |
| `Orata g`, `Orate g` | `Orata G` |
| `Pancasio`, `Pangasio` | `Pangasio` |
| `Persico`, `Filetto persico` | `Filetto Persico` |
| `Pesce spada` | `Pesce Spada` |
| `Pescatrice`, `Pescatrici` | `Pescatrice` |
| `Polpi`, `Polpo`, `Polipo` | `Polpo` |
| `Polpo T7`, `Polpo  T7` | `Polpo T7` |
| `Polpo T4` | `Polpo T4` |
| `Polpi t8`, `Polpo t8`, `Polipi t8` | `Polpo T8` |
| `Raia`, `Raya`, `Razza` | `Razza` |
| `Sarde` | `Sarde` |
| `Scampi` | `Scampi` |
| `Seppia`, `Seppie` | `Seppia` |
| `Seppia 10/20`, `Seppie 10/20`, `Seppia pulita 10/20`, `Seppie pulite 10/20` | `Seppia Pulita 10/20` |
| `Seppia cioco`, `Seppie cioco` | `Seppia Cioco` |
| `Seppia pulita`, `Seppie pulita`, `Seppie pulite` | `Seppia Pulita` |
| `Seppia sporca` | `Seppia Sporca` |
| `Seppie 20/40` | `Seppie 20/40` |
| `Seppie pulita gold` | `Seppia Pulita Gold` |
| `Ombrina`, `Ombrine` | `Ombrina` |
| `Sogliola` | `Sogliola` |
| `Sogliola (lingua)` | `Sogliola Lingua` |
| `Sogliola tigri`, `Sogliole tigri`, `Sogliola(TIgri)`, `Sogliola (tigri)` | `Sogliola Tigri` |
| `Spigola`, `Spigole`, `Spigola a` | `Spigola A` |
| `Spigola g`, `Spigole g` | `Spigola G` |
| `Spigole 2g` | `Spigole 2G` |
| `Spigole 3g` | `Spigole 3G` |
| `Baccala Congelato` | `Baccalà Congelato` |
| `Baccalà salato` | `Baccalà Salato` |
| `Vongole` | `Vongole` |
| `Vongole lupini` | `Vongole Lupini` |
| `Vongole v.` | `Vongole V.` |
| `Lupini mega` | `Lupini Mega` |
| `Lupini` | `Lupini` |

**Passthrough names** (already correctly cased, no normalization needed):

| Name in CSV | Used as-is |
|-------------|-----------|
| `Alici` | `Alici` |
| `Anguille` | `Anguille` |
| `Astice` | `Astice` |
| `Calamari` | `Calamari` |
| `Cefalo` | `Cefalo` |
| `Cicala` | `Cicala` |
| `Datterino` | `Datterino` |
| `Filetto ricomposto` | `Filetto Ricomposto` |
| `Gallinella` | `Gallinella` |
| `Lanzardo` | `Lanzardo` |
| `Melù` | `Melù` |
| `Noci Bianche` | `Noci Bianche` |
| `Obrina` | `Obrina` |
| `Ostriche` | `Ostriche` |
| `Palombo` | `Palombo` |
| `Paranza` | `Paranza` |
| `Persico` | `Persico` || `Ricciola` | `Ricciola` |
| `Ricomposto` | `Ricomposto` |
| `Salmone` | `Salmone` |
| `Sbani` | `Sbani` |
| `Serra` | `Serra` |
| `Sgombro` | `Sgombro` |
| `Suri` | `Suri` |
| `Tonno` | `Tonno` |
| `Triglie` | `Triglie` |
| `Trote Salmonate` | `Trote Salmonate` |
| `Violette` | `Violette` |

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

## Dataset 2 — Actual cash register (`Entrate_Uscite.csv`)

### Structure

Each day of operations produces a block of rows:

| Row type | `Tipo Spesa` | `Dettaglio A` | `Dettaglio B` | `Cifra` |
|----------|-------------|---------------|---------------|---------|
| Daily revenue | `Entrata` | `Guadano` | `Pescheria Grassano` | `€ 470,00` |
| Supplier payment | `Uscita` | `Fornitori` | `Meridional` | `-€ 175,00` |
| Extra costs | `Uscita` | `Spese` | `Altro` | `-€ 35,00` |

Extra costs include fuel, miscellaneous expenses — **not present in Dataset 1**.

### Join key: `Date + Location`

The location is extracted from `Dettaglio B` of `Entrata` rows (e.g. `"Pescheria Grassano"` → `Grassano`). All `Uscita` rows for the same date are associated to that location.

### What is compared

| Metric | Dataset 1 (fish records) | Dataset 2 (actual) |
|--------|--------------------------|-------------------|
| Gross revenue | Σ(Qv × Pv) per day | `Entrata` amount |
| Supplier costs | Σ(Qa × Pa) per day | Σ `Uscita/Fornitori` |
| Extra costs | Not present | Σ `Uscita/Spese` |
| Net (excl. extras) | Gross − Supplier costs | Entrata − Fornitori |
| Net (incl. extras) | — | Entrata − Fornitori − Spese |

### No double counting

The two datasets are aggregated **separately** and shown **side by side**. They are never summed together. Days present in only one dataset are highlighted in yellow in the comparison table.

### Filters

The main dropdown filters (Year, Month, Location) apply to both datasets simultaneously. The Actual-specific filters (Tipo Spesa, Dettaglio A, Dettaglio B) apply only to Dataset 2.

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

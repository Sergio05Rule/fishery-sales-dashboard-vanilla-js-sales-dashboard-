# Dashboard KPI Pescheria

Dashboard analitica per il monitoraggio delle vendite di una pescheria multi-punto. Costruita interamente in HTML + JavaScript vanilla (zero dipendenze backend), carica i dati da un file CSV esportato da Excel/Google Sheets.

![Screenshot dashboard](screenshot.png)

---

## Funzionalità

### Analisi e KPI
- **Incasso lordo / netto** per periodo selezionato
- **Margine lordo %** aggregato e per singolo pesce
- **Kg venduti, scarto, rimanenza** con valore immobilizzato
- **Costo acquisti** totale per periodo

### Filtri interattivi
- **Granularità**: Giorno · Settimana · Mese · Trimestre · Anno
- **Filtri a cascata multi-selezione**: Anno → Mese → Settimana → Pescheria
  - Ctrl+click per selezionare più valori contemporaneamente
  - I filtri si aggiornano dinamicamente in base alle selezioni precedenti

### Cross-filter (stile Power BI / QuickSight)
- Clic su qualsiasi grafico (categoria, pesce, fornitore) filtra tutti gli altri
- Clic sulla riga della tabella filtra i grafici
- Badge "Filtro attivo" con pulsante di reset

### Grafici
| Grafico | Descrizione |
|---------|-------------|
| Trend lordo/netto + Margine % | Barre + doppia linea, asse Y secondario per il margine |
| Incasso per categoria | Donut con legenda percentuale |
| Margine netto per pesce | Barre orizzontali ordinate per margine %, con label €+% |
| Revenue Map | Bubble chart: asse X = kg venduti, asse Y = margine %, dimensione bolla = incasso lordo |
| Spesa per fornitore | Barre verticali + donut |

### Highlights automatici
- **Top 3 / Bottom 3 pesci** per margine %
- **Miglior giorno / settimana / mese / trimestre / anno** con netto, lordo, volume e margine

### Analisi temporale
- **WoW** (Week over Week), **MoM** (Month over Month), **YoY** (Year over Year)
- Confronta solo periodi **completi** — il periodo corrente (settimana/mese/anno in corso) viene escluso automaticamente
- Metriche: Δ incasso netto, Δ incasso lordo, Δ volume (kg), Δ margine %, Δ spese

### Tabelle
- **Dettaglio per tipo di pesce**: ordinabile per qualsiasi colonna, a scorrimento, cross-filter su click riga
- **Dati grezzi**: tutte le righe visibili dopo i filtri attivi, ordinabile, con contatore righe

---

## Struttura del progetto

```
pescheria-dashboard/
├── pescheria_kpi_dashboard.html   # App completa (HTML + CSS inline)
├── dashboard_script.js            # Logica JS: parsing, dedup, aggregazione, grafici
├── sample_data.csv                # Dati di esempio (struttura del CSV atteso)
├── README.md
└── .gitignore
```

> **Il file CSV reale non è incluso nel repository** (contiene dati aziendali sensibili).  
> Usa `sample_data.csv` come riferimento per la struttura attesa.

---

## Come usare

### Opzione A — Server HTTP locale (consigliata)
Il caricamento automatico del CSV richiede un server HTTP (il browser blocca `fetch()` su `file://`).

```bash
# Nella cartella del progetto:
python3 -m http.server 8000
# poi apri: http://localhost:8000/pescheria_kpi_dashboard.html
```

Il file CSV deve chiamarsi esattamente:
```
Pescheria - Abascià Excel - Lavoro - Dataset Pesce.csv
```
e trovarsi nella stessa cartella dell'HTML.

### Opzione B — Caricamento manuale
Apri `pescheria_kpi_dashboard.html` direttamente nel browser e clicca il pulsante **📂 Carica CSV** in alto a destra per selezionare il file manualmente. Funziona anche senza server.

---

## Formato CSV atteso

Il file deve essere un CSV con separatore virgola (`,`) e intestazioni nella prima riga. Le colonne rilevanti sono:

| Colonna | Tipo | Esempio |
|---------|------|---------|
| `Data` | Data `DD/MM/YYYY` | `03/04/2026` |
| `Pescheria` | Testo | `Grassano` |
| `Pesce` | Testo | `Calamari` |
| `Fornitore` | Testo | `Meridional` |
| `Categoria` | Testo | `Decongelato` |
| `Qta. Acquistata per pescheria (Kg)` | Numero IT | `30` |
| `Prezzo Acquisto al Kg` | Valuta IT | `8,50 €` |
| `Prezzo Vendita Medio (Kg)` | Valuta IT | `15,00 €` |
| `Rimanenza o non venduto (Kg)` | Numero IT | `3,6` |
| `Gettato (Kg)` | Numero IT | `0` |
| `Scarto Totale Lotto (automatico)` | Numero IT | `3,6` |
| `Spese` | Valuta IT | `255,00 €` |
| `Incasso (lordo)` | Valuta IT | `396,00 €` |
| `Incasso (netto)` | Valuta IT | `141,00 €` |
| `Margine Lordo (%)` | Percentuale IT | `35,61%` |
| `Qta. Venduta (Kg)` | Numero IT | `26,4` |
| `ROI Pesce %` | Percentuale IT | `43,33%` |

> I numeri usano la **virgola come separatore decimale** e il **punto come separatore migliaia** (formato italiano). I valori monetari possono avere il simbolo `€` prima o dopo il numero.

---

## Manipolazione dei dati

### 1. Deduplicazione automatica

Il dataset originale conteneva **blocchi giornalieri duplicati** — interi giorni di vendita inseriti due volte nel file sorgente (probabilmente per un doppio export o copia-incolla in Excel). Su 2.002 righe originali, 279 erano duplicati.

**Chiave primaria usata per la deduplicazione** (9 campi):

```
Data · Pescheria · Pesce (normalizzato) · Fornitore · Categoria ·
Qta. Acquistata · Prezzo Acquisto · Prezzo Vendita · Rimanenza
```

La logica è implementata in `buildFromCSV()` in `dashboard_script.js`:

```javascript
const pk = [
  d.toISOString().slice(0,10),  // Data
  pe,                            // Pescheria
  psc,                           // Pesce (già normalizzato)
  forn,                          // Fornitore
  cat,                           // Categoria
  (row[iQa]||'').trim(),         // Qta. Acquistata
  (row[iPa]||'').trim(),         // Prezzo Acquisto
  (row[iPv]||'').trim(),         // Prezzo Vendita
  (row[iRim]||'').trim(),        // Rimanenza
].join('|');

if (seenPK.has(pk)) continue;   // scarta il duplicato
seenPK.add(pk);
```

**Perché questa chiave e non tutti i campi?**  
Usare tutti i 28 campi come chiave avrebbe preservato righe con la stessa transazione ma un campo irrilevante diverso (es. campo `Meteo` vuoto vs "Sole"). La chiave a 9 campi identifica univocamente una transazione commerciale reale.

**Blocchi duplicati trovati nel dataset originale:**

| Data | Pescheria | Righe duplicate |
|------|-----------|----------------:|
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
| **Totale** | | **279** |

> **In alternativa**, puoi pulire il file alla fonte in Excel/Google Sheets:  
> `Dati → Rimuovi duplicati` selezionando le 9 colonne della chiave primaria.

---

### 2. Normalizzazione nomi pesce

Il dataset conteneva **oltre 40 varianti** dello stesso pesce dovute a differenze di maiuscole, abbreviazioni, errori di battitura e nomi alternativi. La funzione `FISH_NORM()` in `dashboard_script.js` mappa tutte le varianti al nome canonico:

| Varianti nel CSV | Nome canonico |
|-----------------|---------------|
| `Pancasio`, `Pangasio` | `Pangasio` |
| `Raia`, `Raya`, `Razza` | `Razza` |
| `Polpo t8`, `Polpi t8`, `Polipi t8` | `Polpo T8` |
| `Orate g`, `Orata g` | `Orata G` |
| `Seppie pulite`, `Seppie Pulita`, `Seppie pulite 10/20` | `Seppia Pulita` / `Seppia Pulita 10/20` |
| `Sogliola(TIgri)`, `Sogliola tigri`, `Sogliola (tigri)` | `Sogliola Tigri` |
| `Coda di rospo`, `Code di rospo` | `Coda di Rospo` |
| `Gamberoni l1`, `L1 Argentino` | `Gamberoni L1` |
| `Merluzzi`, `Merluzzo 1`, `Merluzzo 2`, `Merluzzo prima` | `Merluzzo` |
| `Pescatrici`, `Pescatrice` | `Pescatrice` |
| `Pesce spada`, `Pesce Spada` | `Pesce Spada` |
| `Spigole g`, `Spigola g` | `Spigola G` |
| `Baccala Congelato` | `Baccalà Congelato` |
| ... (40+ varianti totali) | |

La normalizzazione avviene **prima** della deduplicazione, così righe con lo stesso pesce scritto in modo diverso vengono correttamente identificate come duplicati.

---

### 3. Parsing numerico formato italiano

Il CSV usa il formato numerico italiano (virgola decimale, punto migliaia, simbolo €). La funzione `parseNum()` gestisce tutti i formati presenti:

```javascript
// Gestisce: "8,50 €" / "€ 141,00" / "35,61%" / "26,4" / ""
function parseNum(s) {
  let v = String(s).trim()
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .replace(/%/g, '')
    .replace(/\./g, '')   // rimuove separatore migliaia
    .replace(/,/g, '.');  // converte decimale IT → EN
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
}
```

---

### 4. Formule di calcolo

I valori economici vengono letti **direttamente dal CSV** (già calcolati da Excel) senza ricalcolo, per garantire coerenza con il file sorgente:

| Metrica | Formula Excel | Campo CSV |
|---------|--------------|-----------|
| Spese | `Qa × Pa` | `Spese` |
| Incasso lordo | `Qv × Pv` | `Incasso (lordo)` |
| Incasso netto | `Incasso lordo − Spese` | `Incasso (netto)` |
| Margine % | `Netto / Lordo × 100` | `Margine Lordo (%)` |
| ROI % | `(Pv − Pa) / Pv × 100` | `ROI Pesce %` |
| Qv | `Qa − Scarto − Rimanenza − Gettato` | `Qta. Venduta (Kg)` |

Il **margine % aggregato** (per pesce su più giorni/pescherie) viene ricalcolato come media ponderata per volume:
```
Margine % aggregato = Σ(Incasso netto) / Σ(Incasso lordo) × 100
```
Questo è più corretto della media semplice delle percentuali di riga, che darebbe peso uguale a lotti di dimensioni diverse.

---

## Dipendenze

| Libreria | Versione | Uso |
|----------|----------|-----|
| [Chart.js](https://www.chartjs.org/) | 4.4.1 | Tutti i grafici |

Caricata via CDN (`cdnjs.cloudflare.com`). Nessun'altra dipendenza — niente Node.js, niente build step, niente framework.

---

## Compatibilità browser

Testato su Chrome 120+, Firefox 121+, Safari 17+. Richiede ES2020 (optional chaining, nullish coalescing).

---

## Licenza

MIT — libero uso, modifica e distribuzione con attribuzione.

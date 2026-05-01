# Dashboard Pescheria — Linee guida di sviluppo

Questo documento raccoglie le regole operative da seguire ogni volta che si modifica il progetto. Va letto prima di iniziare qualsiasi sessione di lavoro.

---

## 1. Regola generale: README sempre aggiornato

**Ogni modifica al codice che cambia un comportamento visibile o documentato deve essere riflessa nel README.md.**

Casi obbligatori:

| Tipo di modifica | Sezione README da aggiornare |
|-----------------|------------------------------|
| Aggiunta/modifica mapping nome pesce | `2. Fish name normalization` — entrambe le tabelle (mappa esplicita + passthrough) |
| Nuovo filtro o modifica filtri | `Filters` nella sezione Features |
| Nuovo grafico o modifica grafico | Tabella `Charts` nella sezione Features |
| Modifica formula di calcolo | `4. Calculation formulas` |
| Modifica logica deduplicazione | `1. Automatic deduplication` |
| Modifica parsing numerico | `3. Italian number format parsing` |
| Nuova sezione di analisi | Aggiungere voce in Features + sezione dedicata in Data pipeline |
| Modifica chiave primaria deduplicazione | `1. Automatic deduplication` + tabella blocchi duplicati |
| Modifica Dataset 2 (Actual) | `Dataset 2 — Actual cash register` |
| Nuovo tipo di cross-filter | Sezione `Cross-filtering` in Features + sezione 3 in GUIDELINES |

---

## 2. Fish name normalization — regole

### Come aggiornare la mappa

La mappa si trova in `dashboard_script.js`, funzione `FISH_NORM`, oggetto `const map = {...}`.

**Procedura:**
1. Modificare la mappa in `dashboard_script.js`
2. Eseguire la verifica di allineamento:
   ```bash
   python3 -c "
   import re
   from collections import defaultdict
   with open('dashboard_script.js') as f: js=f.read()
   m=re.search(r'const map=\{(.*?)\};',js,re.DOTALL)
   pairs=re.findall(r\"'([^']+)'\s*:\s*'([^']+)'\",m.group(1))
   js_map={k:v for k,v in pairs}
   with open('README.md') as f: readme=f.read()
   import re as re2
   table=re2.findall(r'^\|([^|]+)\|([^|]+)\|',readme,re.MULTILINE)
   rm={}
   for l,r in table:
       c=re2.findall(r'\`([^\`]+)\`',r)
       if not c: continue
       for v in re2.findall(r'\`([^\`]+)\`',l): rm[v.lower()]=c[0]
   missing=[k for k in js_map if k not in rm]
   wrong=[(k,js_map[k],rm[k]) for k in js_map if k in rm and js_map[k]!=rm[k]]
   print(f'Missing: {len(missing)}, Wrong: {len(wrong)}')
   if missing: [print(f'  MISSING: {k} -> {v}') for k,v in [(k,js_map[k]) for k in missing]]
   if wrong: [print(f'  WRONG: {k}: JS={j} README={r}') for k,j,r in wrong]
   if not missing and not wrong: print('OK - allineati')
   "
   ```
3. Aggiornare la sezione `2. Fish name normalization` nel README
4. Committare entrambi i file insieme

### Regole di naming canonico

- Usare **Title Case** per tutti i nomi canonici
- Varianti di taglia (A, G, T7, T8, ecc.) sono **prodotti distinti** — non unirle
- Singolare vs plurale: usare il **singolare** come canonico (es. `Seppia`, non `Seppie`)
- Varianti con solo differenza di case → mappare alla versione Title Case corretta
- Nomi già corretti in Title Case → lasciarli nel fallback (non aggiungere alla mappa esplicita)

### Chiave primaria deduplicazione

```
Data · Pescheria · Pesce (normalizzato) · Fornitore · Categoria ·
Qta.Acquistata · PrezzoAcquisto · PrezzoVendita · Rimanenza
```

La normalizzazione del nome pesce avviene **prima** della deduplicazione. Se si aggiunge una nuova variante alla mappa, la deduplicazione automaticamente la gestirà correttamente.

---

## 3. Cross-filtering — regole

**Tutti i grafici devono filtrarsi tra di loro.** Ogni grafico cliccabile deve:

1. Chiamare `crossFilter = {type: '...', value: '...'}` al click
2. Chiamare `render()` dopo
3. Supportare il toggle: se si clicca lo stesso elemento già selezionato, `crossFilter = null`

### Tipi di cross-filter supportati

| `type` | `value` | Filtra per |
|--------|---------|-----------|
| `cat` | nome categoria | `r.cat === value` |
| `fish` | nome pesce normalizzato | `r.psc === value` |
| `supplier` | nome fornitore | `r.forn === value` |
| `pe` | nome pescheria | `r.pe === value` |
| `trend` | chiave numerica periodo | dipende da `PER` (granularità) |

Quando si aggiunge un nuovo grafico cliccabile:
1. Aggiungere `onClick` al grafico Chart.js
2. Aggiungere il nuovo tipo in `getFiltered()` in `dashboard_script.js`
3. Aggiungere il label in `const labels = {...}` nella funzione `render()`

### Grafici pre/post 10/02/2026

La sezione pre/post usa `getData()` (filtri dropdown attivi) ma **non** `getFiltered()` (cross-filter). Questo è intenzionale: la sezione mostra sempre il contesto completo pre/post indipendentemente dal cross-filter attivo. I click sui grafici pre/post attivano il cross-filter `type:'pe'`.

---

## 4. Formule di calcolo

I valori economici vengono letti **direttamente dal CSV** (già calcolati da Excel). Non ricalcolare.

| Metrica | Formula Excel | Campo CSV |
|---------|--------------|-----------|
| Spese | `Qa × Pa` | `Spese` |
| Incasso lordo | `Qv × Pv` | `Incasso (lordo)` |
| Incasso netto | `Lordo − Spese` | `Incasso (netto)` |
| Margine % | `Netto / Lordo × 100` | `Margine Lordo (%)` |
| Qv | `Qa − Scarto − Rimanenza − Gettato` | `Qta. Venduta (Kg)` |

**Margine % aggregato** = media ponderata per volume: `Σ(Netto) / Σ(Lordo) × 100`

**Rimanenze (Fornitore = Rimanenza)**: il costo di acquisto è già stato contabilizzato il giorno dell'acquisto originale. Il file Excel è stato corretto alla fonte per evitare il doppio conteggio delle spese.

---

## 5. Filtri — regole

### Filtri dropdown (cascading multi-select)
- Anno → Mese → Settimana sono a cascata: la selezione upstream restringe le opzioni downstream
- Pescheria, Fornitore, Giorno sono indipendenti
- Tutti i filtri supportano multi-selezione (Ctrl+click) tranne Giorno che è multi-select semplice
- Quando si aggiunge un nuovo filtro: aggiornarlo in `getData()`, `populateFilters()`, e aggiungere il listener

### Filtro Giorno della settimana
- Valori: 0=Domenica, 1=Lunedì, ..., 6=Sabato (standard JS `Date.getDay()`)
- Multi-select: leggere con `[...$giorno.selectedOptions].map(o=>o.value).filter(v=>v!=='tutti')`

---

## 6. Analisi pre/post 10/02/2026

**Data di cambio**: 10 febbraio 2026

**Schema pre-cambio**: Grassano e Grottole operavano insieme Lunedì, Mercoledì e Venerdì.

**Schema post-cambio**:
- Giovedì → Grottole
- Venerdì → Grassano
- Lunedì → Grassano
- Martedì → Grottole
- Mercoledì → Grassano

La sezione di analisi è in fondo alla dashboard (`id="prepostSection"`). I grafici usano `getData()` (rispetta i filtri dropdown) ma non il cross-filter. La costante `CUTOFF_PP = new Date(2026, 1, 10)` definisce il punto di taglio.

---

## 6. Dataset 2 — Actual (Entrate_Uscite.csv)

### Caricamento
- Autoload via `fetch()` se il file è nella stessa cartella (HTTP server)
- Fallback manuale: bottone verde "📂 Carica Actual"
- La sezione "Actual vs Fish Record" è nascosta finché Dataset 2 non è caricato

### Join key
`Data + Pescheria` — la pescheria viene estratta dalle righe `Tipo=Entrata`, campo `Dettaglio B` (es. `"Pescheria Grassano"` → `Grassano`).

### Aggregazione per giornata
Per ogni `Data+Pescheria`:
- `entrata` = somma righe `Tipo=Entrata`
- `fornitori` = somma righe `Tipo=Uscita, DetA=Fornitori` (valore assoluto)
- `spese_extra` = somma righe `Tipo=Uscita, DetA=Spese` (benzina, ecc.)
- `netto_actual` = entrata − fornitori − spese_extra
- `netto_no_extra` = entrata − fornitori (senza benzina)

### Nessun doppio conteggio
I due dataset vengono aggregati separatamente e mostrati affiancati. Non si sommano mai. Usare sempre `aggFishByPeriod()` per DS1 e `aggActualByPeriod()` per DS2.

### Soglia di neutralità delta
Tutti i delta usano una soglia per evitare falsi allarmi su arrotondamenti:
- **Delta monetari**: neutro se `|diff| < €1` → mostra "✓ Match aspettative" in grigio
- **Delta margine %**: neutro se `|diff| < 0.5pp`
- Costanti nel codice: `EPS=1`, `EPS_PCT=0.5`

### Deduplicazione Dataset 2
Chiave: `Data|Tipo|DetA|DetB|Cifra` — righe identiche vengono scartate.

---

## 7. Sezioni espandibili

Le 3 sezioni avanzate sono chiuse di default. La funzione `toggleSection(bodyId, arrowId)` gestisce l'apertura/chiusura con animazione CSS (`max-height` transition). Quando una sezione si apre, i grafici Chart.js vengono ridisegnati (non renderizzano correttamente su canvas nascosti).

| Sezione | `bodyId` | Ridisegno al click |
|---------|----------|--------------------|
| Actual vs Fish Record | `actualBody` | `renderActual()` |
| Pre/Post 10/02/2026 | `prepostBody` | `renderPrePost()` |
| Dati grezzi | `rawBody` | no (tabella HTML) |

---

## 8. Struttura file

```
fishery-sales-dashboard/
├── pescheria_kpi_dashboard.html   # HTML + CSS inline
├── dashboard_script.js            # Tutta la logica JS
├── sample_data.csv                # Dati di esempio Dataset 1
├── Screenshot.png                 # Screenshot dashboard
├── README.md                      # Documentazione pubblica (sempre aggiornato)
├── GUIDELINES.md                  # Questo file (linee guida sviluppo)
└── .gitignore
```

**File CSV reali (non in repo):**
- `Pescheria - Abascià Excel - Lavoro - Dataset Pesce.csv` — Dataset 1 (fish records)
- `Pescheria - Abascià Excel - Lavoro - Entrate_Uscite.csv` — Dataset 2 (actual cash, opzionale)

---

## 8. Git workflow

- Commit atomici: una feature/fix per commit
- Formato messaggio: `type(scope): descrizione` (Conventional Commits)
  - `feat:` nuova funzionalità
  - `fix:` bug fix
  - `docs:` solo README/GUIDELINES
  - `refactor:` refactoring senza cambio comportamento
- Non pushare mai il CSV reale (`Pescheria*.csv` è in `.gitignore`)
- Aggiornare README e GUIDELINES nello stesso commit della modifica al codice

---

## 9. Tabelle a scorrimento

Tutte le tabelle della dashboard hanno `max-height` e `overflow-y: auto` per lo scroll verticale, e `overflow-x: auto` per lo scroll orizzontale. Gli header hanno `position: sticky; top: 0` per rimanere visibili durante lo scroll.

Tabelle con scroll attivo:
- `#tbl` — Dettaglio per tipo di pesce (max-height: 380px)
- `#rawTbl` — Dati grezzi (max-height: 340px, in sezione collassabile)
- `#actTable` — Actual vs Fish Record (max-height: 380px, in sezione collassabile)
- `#ppTable` — Pre/Post 10/02/2026 (overflow-x: auto)

Quando si aggiunge una nuova tabella, aggiungere sempre `max-height` e `overflow-y: auto` al wrapper div.

---

## 10. Checklist prima di ogni commit

- [ ] `node --check dashboard_script.js` → nessun errore di sintassi
- [ ] Se modificata la mappa pesce → verifica allineamento JS/README (script sezione 2)
- [ ] Se aggiunto un grafico → ha `onClick` con cross-filter?
- [ ] Se aggiunto un tipo di cross-filter → aggiornato `getFiltered()` e `labels` in `render()`?
- [ ] Se aggiunta una sezione espandibile → aggiornata `toggleSection()` se necessario?
- [ ] Se modificato Dataset 2 → aggiornata sezione `Dataset 2` nel README?
- [ ] README aggiornato se necessario
- [ ] GUIDELINES aggiornato se necessario

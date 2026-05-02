#!/bin/bash
# Avvia il server HTTP e apre la dashboard nel browser
cd "$(dirname "$0")"
echo "Avvio server dashboard su http://localhost:8000 ..."
# Apri il browser dopo 1 secondo
(sleep 1 && open "http://localhost:8000/pescheria_kpi_dashboard.html") &
# Avvia il server (rimane in esecuzione)
python3 -m http.server 8000

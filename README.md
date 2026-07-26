# yt-dlp Command Builder

SPA/PWA locale per generare comandi `yt-dlp` user-friendly per scaricare video, playlist, audio e sottotitoli tramite terminale.

La pagina non scarica file, non usa backend, non richiede account e non invia dati a server esterni: costruisce una stringa di comando pronta da copiare.

## Funzionalita

- Preset rapidi per video, playlist, solo audio MP3, sottotitoli e ispezione formati.
- Generazione comandi per macOS/Linux e PowerShell.
- Opzioni per qualita, container, audio, sottotitoli, playlist, cookie, retry e download archive.
- Output copiabile come comando completo o come opzioni per `yt-dlp.conf`.
- Tutorial integrato per utenti principianti.
- PWA installabile e funzionante offline dopo il primo caricamento.

## Uso locale

Apri direttamente `index.html`, oppure avvia il server locale:

```bash
npm run dev
```

Poi apri:

```text
http://localhost:3001/
```

## Requisiti per i download

Questa app genera comandi: per eseguirli devi avere `yt-dlp` installato nel computer su cui lanci il terminale.

Per conversioni, merge video+audio, MP3, thumbnail incorporate o sottotitoli incorporati serve anche `ffmpeg`.

Link utili:

- Installazione yt-dlp: https://github.com/yt-dlp/yt-dlp/wiki/Installation
- Download ffmpeg: https://ffmpeg.org/download.html

## PWA

Il progetto include:

- `manifest.webmanifest`
- `service-worker.js`
- `assets/pwa-icon.svg`

Installazione per utenti finali:

- macOS/Windows Chrome o Edge: apri il sito e scegli "Installa app" dalla barra indirizzi o dal menu del browser.
- iPhone/iPad Safari: apri il sito, tocca Condividi, poi "Aggiungi alla schermata Home".
- Android Chrome: apri il sito e usa "Installa app" o "Aggiungi a schermata Home".

Nota: la PWA non puo eseguire `yt-dlp` direttamente nel browser o su iOS/iPadOS. Il download parte sempre dal terminale o da un ambiente in cui `yt-dlp` e installato.

## Pubblicazione su GitHub Pages

Per pubblicarla con GitHub Pages:

1. Crea un repository pubblico su GitHub.
2. Carica nella root del repository tutti i file della SPA, incluso `.nojekyll`.
3. Vai in `Settings > Pages`.
4. In `Build and deployment`, scegli `Deploy from a branch`.
5. Seleziona branch `main` e cartella `/root`.
6. Salva e attendi la pubblicazione.

L'indirizzo sara simile a:

```text
https://TUO-USERNAME.github.io/NOME-REPOSITORY/
```

GitHub Pages richiede HTTPS per manifest e service worker, quindi e adatto alla distribuzione PWA.

## File principali

- `index.html`: struttura dell'interfaccia.
- `styles.css`: design e layout.
- `app.js`: logica del builder, preset, copia comandi e tooltip.
- `manifest.webmanifest`: configurazione PWA.
- `service-worker.js`: cache offline.
- `server.mjs`: mini server statico per uso locale.
- `.nojekyll`: evita il processing Jekyll su GitHub Pages.
- `THIRD_PARTY_NOTICES.md`: citazioni e note licenze terze parti.

## Archive e retry

Il campo `Archivio gia scaricati` genera `--download-archive FILE`.

- Se `FILE` e un nome semplice come `downloaded.txt`, yt-dlp lo crea nella cartella da cui lanci il comando nel terminale.
- Se vuoi tenerlo nella cartella dei download, usa un percorso esplicito, ad esempio `~/Downloads/yt-dlp/downloaded.txt`.
- Il file archive contiene solo elementi scaricati con successo. I video falliti non vengono segnati come completati, quindi rilanciando lo stesso comando vengono riprovati mentre quelli gia riusciti vengono saltati.
- Il campo `Log errori` aggiunge una redirezione `2>> yt-dlp-errors.log` per conservare errori e interruzioni.

## Credits e licenze

Codice del progetto: MIT License, vedi `LICENSE`.

Questo progetto e basato sulla documentazione pubblica di `yt-dlp`, ma non include `yt-dlp`, non include ffmpeg e non e affiliato al progetto yt-dlp.

- yt-dlp: https://github.com/yt-dlp/yt-dlp
- yt-dlp license: https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE
- yt-dlp usage and options: https://github.com/yt-dlp/yt-dlp#usage-and-options
- yt-dlp format selection: https://github.com/yt-dlp/yt-dlp#format-selection
- yt-dlp maintainers: https://github.com/yt-dlp/yt-dlp/blob/master/Maintainers.md

Icone OpenMoji usate localmente:

- `assets/openmoji-robot.svg`
- `assets/openmoji-folder.svg`

Attribuzione OpenMoji:

> All emojis designed by OpenMoji - the open-source emoji and icon project. License: CC BY-SA 4.0

- OpenMoji: https://openmoji.org/
- OpenMoji FAQ: https://openmoji.org/faq
- OpenMoji repository: https://github.com/hfg-gmuend/openmoji
- CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/

YouTube e un marchio di Google LLC. Questo progetto e indipendente e non e affiliato, sponsorizzato o approvato da YouTube o Google.

Gli utenti sono responsabili del rispetto dei termini delle piattaforme, della documentazione di yt-dlp, delle norme sul copyright e delle leggi applicabili.

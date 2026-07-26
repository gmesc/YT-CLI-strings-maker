const defaults = {
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  mode: "video",
  platform: "posix",
  outputPath: "~/Downloads/yt-dlp",
  template: "%(playlist_index&{} - |)s%(title).160B [%(id)s].%(ext)s",
  format: "bestvideo*+bestaudio/best",
  maxHeight: "",
  mergeFormat: "mp4",
  extractAudio: false,
  embedMetadata: true,
  embedThumbnail: false,
  writeInfoJson: false,
  writeThumbnail: false,
  audioFormat: "mp3",
  audioQuality: "0",
  playlistStart: "",
  playlistEnd: "",
  playlistItems: "",
  noPlaylist: true,
  playlistReverse: false,
  playlistRandom: false,
  ignoreErrors: false,
  writeSubs: false,
  writeAutoSubs: false,
  embedSubs: false,
  subLangs: "it,en.*",
  subFormat: "srt/best",
  skipDownloaded: true,
  archiveFile: "downloaded.txt",
  logErrors: true,
  errorLogFile: "yt-dlp-errors.log",
  batchFile: "",
  cookiesBrowser: "",
  concurrentFragments: "4",
  rateLimit: "",
  retries: "10",
  fragmentRetries: "10",
  extractorRetries: "3",
  retrySleep: "linear=5::30",
  skipPlaylistAfterErrors: "",
  simulate: false,
  listFormats: false,
  continueDownloads: true,
};

const presets = {
  video: {
    mode: "video",
    noPlaylist: true,
    extractAudio: false,
    format: "bestvideo*+bestaudio/best",
    maxHeight: "",
    mergeFormat: "mp4",
    embedMetadata: true,
    listFormats: false,
    simulate: false,
  },
  playlist: {
    mode: "playlist",
    noPlaylist: false,
    ignoreErrors: true,
    skipDownloaded: true,
    archiveFile: "downloaded.txt",
    logErrors: true,
    errorLogFile: "yt-dlp-errors.log",
    retries: "10",
    fragmentRetries: "10",
    extractorRetries: "3",
    retrySleep: "linear=5::30",
    skipPlaylistAfterErrors: "",
    template: "%(playlist_index)03d - %(title).160B [%(id)s].%(ext)s",
  },
  audio: {
    extractAudio: true,
    audioFormat: "mp3",
    audioQuality: "0",
    format: "bestaudio/best",
    mergeFormat: "",
    embedMetadata: true,
    embedThumbnail: true,
  },
  subs: {
    writeSubs: true,
    writeAutoSubs: true,
    embedSubs: true,
    subLangs: "it,en.*",
    subFormat: "srt/best",
  },
  inspect: {
    listFormats: true,
    simulate: true,
  },
};

const ids = Object.keys(defaults);
const form = document.querySelector("#builder");
const commandOutput = document.querySelector("#commandOutput");
const copyStatus = document.querySelector("#copyStatus");
const terminalToggle = document.querySelector("#terminalToggle");
const useCommands = document.querySelector("#useCommands");
const pickOutputPath = document.querySelector("#pickOutputPath");
const folderFallback = document.querySelector("#folderFallback");
const outputPathHint = document.querySelector("#outputPathHint");
const generateButton = document.querySelector("#generate");
const copyButton = document.querySelector("#copy");
let hasGenerated = false;

function field(id) {
  return document.getElementById(id);
}

function shellQuote(value, platform) {
  if (!value) return "";
  if (platform === "powershell") {
    return `'${value.replaceAll("'", "''")}'`;
  }
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

function addOption(parts, flag, value, platform) {
  if (value === undefined) {
    parts.push(flag);
    return;
  }

  const clean = String(value).trim();
  if (clean) {
    parts.push(flag, shellQuote(clean, platform));
  }
}

function getState() {
  return ids.reduce((state, id) => {
    const element = field(id);
    state[id] = element.type === "checkbox" ? element.checked : element.value;
    return state;
  }, {});
}

function setState(nextState) {
  ids.forEach((id) => {
    const element = field(id);
    const value = nextState[id];
    if (element.type === "checkbox") {
      element.checked = Boolean(value);
    } else {
      element.value = value ?? "";
    }
  });
  localStorage.setItem("yt-dlp-local-builder", JSON.stringify(getState()));
}

function selectedFormat(state) {
  if (!state.maxHeight) {
    return state.format;
  }

  return `bestvideo*[height<=${state.maxHeight}]+bestaudio/best[height<=${state.maxHeight}]/best`;
}

function buildCommand(state) {
  const parts = ["yt-dlp"];
  const platform = state.platform;

  if (state.listFormats) addOption(parts, "-F");
  if (state.simulate) addOption(parts, "--simulate");
  if (state.noPlaylist && state.mode === "video") addOption(parts, "--no-playlist");
  if (!state.continueDownloads) addOption(parts, "--no-continue");
  if (state.ignoreErrors) addOption(parts, "--ignore-errors");

  addOption(parts, "-P", state.outputPath, platform);
  addOption(parts, "-o", state.template, platform);
  addOption(parts, "-f", selectedFormat(state), platform);
  addOption(parts, "--merge-output-format", state.mergeFormat, platform);
  addOption(parts, "-N", state.concurrentFragments, platform);
  addOption(parts, "--limit-rate", state.rateLimit, platform);
  addOption(parts, "--retries", state.retries, platform);
  addOption(parts, "--fragment-retries", state.fragmentRetries, platform);
  addOption(parts, "--extractor-retries", state.extractorRetries, platform);
  addOption(parts, "--retry-sleep", state.retrySleep, platform);
  addOption(parts, "--skip-playlist-after-errors", state.skipPlaylistAfterErrors, platform);

  if (state.mode === "playlist") {
    addOption(parts, "--playlist-start", state.playlistStart, platform);
    addOption(parts, "--playlist-end", state.playlistEnd, platform);
    addOption(parts, "--playlist-items", state.playlistItems, platform);
    if (state.playlistReverse) addOption(parts, "--playlist-reverse");
    if (state.playlistRandom) addOption(parts, "--playlist-random");
  }

  if (state.extractAudio) {
    addOption(parts, "-x");
    addOption(parts, "--audio-format", state.audioFormat, platform);
    addOption(parts, "--audio-quality", state.audioQuality, platform);
  }

  if (state.writeSubs) addOption(parts, "--write-subs");
  if (state.writeAutoSubs) addOption(parts, "--write-auto-subs");
  if (state.writeSubs || state.writeAutoSubs || state.embedSubs) {
    addOption(parts, "--sub-langs", state.subLangs, platform);
    addOption(parts, "--sub-format", state.subFormat, platform);
  }
  if (state.embedSubs) addOption(parts, "--embed-subs");

  if (state.embedMetadata) addOption(parts, "--embed-metadata");
  if (state.embedThumbnail) addOption(parts, "--embed-thumbnail");
  if (state.writeInfoJson) addOption(parts, "--write-info-json");
  if (state.writeThumbnail) addOption(parts, "--write-thumbnail");

  if (state.skipDownloaded) {
    addOption(parts, "--download-archive", state.archiveFile, platform);
  }
  addOption(parts, "--batch-file", state.batchFile, platform);
  addOption(parts, "--cookies-from-browser", state.cookiesBrowser, platform);

  if (!state.batchFile.trim()) {
    parts.push("--");
    state.url
      .split(/\s+/)
      .map((url) => url.trim())
      .filter(Boolean)
      .forEach((url) => parts.push(shellQuote(url, platform)));
  }

  if (state.logErrors && state.errorLogFile.trim()) {
    parts.push("2>>", shellQuote(state.errorLogFile.trim(), platform));
  }

  return parts.join(" ");
}

function buildConfig(state) {
  const lines = [];
  const addLine = (flag, value) => {
    if (value === undefined) {
      lines.push(flag);
      return;
    }

    const clean = String(value).trim();
    if (clean) {
      lines.push(flag, clean);
    }
  };

  if (state.listFormats) addLine("-F");
  if (state.simulate) addLine("--simulate");
  if (state.noPlaylist && state.mode === "video") addLine("--no-playlist");
  if (!state.continueDownloads) addLine("--no-continue");
  if (state.ignoreErrors) addLine("--ignore-errors");

  addLine("-P", state.outputPath);
  addLine("-o", state.template);
  addLine("-f", selectedFormat(state));
  addLine("--merge-output-format", state.mergeFormat);
  addLine("-N", state.concurrentFragments);
  addLine("--limit-rate", state.rateLimit);
  addLine("--retries", state.retries);
  addLine("--fragment-retries", state.fragmentRetries);
  addLine("--extractor-retries", state.extractorRetries);
  addLine("--retry-sleep", state.retrySleep);
  addLine("--skip-playlist-after-errors", state.skipPlaylistAfterErrors);

  if (state.mode === "playlist") {
    addLine("--playlist-start", state.playlistStart);
    addLine("--playlist-end", state.playlistEnd);
    addLine("--playlist-items", state.playlistItems);
    if (state.playlistReverse) addLine("--playlist-reverse");
    if (state.playlistRandom) addLine("--playlist-random");
  }

  if (state.extractAudio) {
    addLine("-x");
    addLine("--audio-format", state.audioFormat);
    addLine("--audio-quality", state.audioQuality);
  }

  if (state.writeSubs) addLine("--write-subs");
  if (state.writeAutoSubs) addLine("--write-auto-subs");
  if (state.writeSubs || state.writeAutoSubs || state.embedSubs) {
    addLine("--sub-langs", state.subLangs);
    addLine("--sub-format", state.subFormat);
  }
  if (state.embedSubs) addLine("--embed-subs");

  if (state.embedMetadata) addLine("--embed-metadata");
  if (state.embedThumbnail) addLine("--embed-thumbnail");
  if (state.writeInfoJson) addLine("--write-info-json");
  if (state.writeThumbnail) addLine("--write-thumbnail");

  if (state.skipDownloaded) {
    addLine("--download-archive", state.archiveFile);
  }
  addLine("--batch-file", state.batchFile);
  addLine("--cookies-from-browser", state.cookiesBrowser);

  return lines.join("\n");
}

function setGeneratedState(value) {
  hasGenerated = value;
  generateButton.textContent = hasGenerated ? "Aggiorna" : "Genera";
  copyButton.disabled = !hasGenerated;
}

function generate() {
  const state = getState();
  commandOutput.value = buildCommand(state);
  localStorage.setItem("yt-dlp-local-builder", JSON.stringify(state));
  copyStatus.textContent = "";
  setGeneratedState(true);
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const scratch = document.createElement("textarea");
    scratch.value = text;
    scratch.setAttribute("readonly", "");
    scratch.style.position = "fixed";
    scratch.style.opacity = "0";
    document.body.appendChild(scratch);
    scratch.select();
    document.execCommand("copy");
    document.body.removeChild(scratch);
  }
  copyStatus.textContent = message;
}

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    setState({ ...getState(), ...presets[button.dataset.preset] });
    commandOutput.value = "";
    copyStatus.textContent = "Preset applicato. Premi Genera per creare il comando.";
    setGeneratedState(false);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
});

generateButton.addEventListener("click", generate);

document.querySelector("#reset").addEventListener("click", () => {
  setState(defaults);
  commandOutput.value = "";
  copyStatus.textContent = "Impostazioni ripristinate. Premi Genera per creare il comando.";
  setGeneratedState(false);
});

document.querySelector("#copy").addEventListener("click", () => {
  if (!commandOutput.value.trim()) {
    copyStatus.textContent = "Prima premi Genera.";
    return;
  }
  copyText(commandOutput.value, "Comando copiato.");
});

document.querySelector("#copyConfig").addEventListener("click", () => {
  copyText(buildConfig(getState()), "Configurazione yt-dlp.conf copiata.");
});

terminalToggle.addEventListener("click", () => {
  useCommands.open = !useCommands.open;
  if (useCommands.open) {
    useCommands.scrollIntoView({ behavior: "smooth", block: "nearest" });
    useCommands.querySelector("summary").focus({ preventScroll: true });
  }
});

function markOptionsChanged(message) {
  localStorage.setItem("yt-dlp-local-builder", JSON.stringify(getState()));
  if (hasGenerated) {
    generateButton.textContent = "Aggiorna";
  }
  copyStatus.textContent = message;
}

function showPickedFolder(folderName) {
  const platform = field("platform").value;
  const example = platform === "powershell"
    ? "$HOME\\Downloads\\" + folderName
    : "~/Downloads/" + folderName;
  field("outputPath").value = example;
  field("outputPath").placeholder = example;
  outputPathHint.textContent = "Cartella selezionata: " + folderName + ". Percorso suggerito: verifica che corrisponda alla cartella scelta.";
  field("outputPath").focus();
  markOptionsChanged("Cartella selezionata. Controlla il percorso nel campo Cartella download, poi premi Aggiorna se hai gia generato il comando.");
}

pickOutputPath.addEventListener("click", async () => {
  if ("showDirectoryPicker" in window) {
    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite", startIn: "downloads" });
      showPickedFolder(handle.name);
      return;
    } catch (error) {
      if (error && error.name === "AbortError") return;
    }
  }
  folderFallback.click();
});

folderFallback.addEventListener("change", () => {
  const file = folderFallback.files && folderFallback.files[0];
  if (!file) return;
  const folderName = file.webkitRelativePath ? file.webkitRelativePath.split("/")[0] : file.name;
  showPickedFolder(folderName);
  folderFallback.value = "";
});

document.querySelectorAll("[data-copy-text]").forEach((button) => {
  button.addEventListener("click", () => {
    copyText(button.dataset.copyText, "Comando installazione copiato.");
  });
});

ids.forEach((id) => {
  field(id).addEventListener("change", () => {
    localStorage.setItem("yt-dlp-local-builder", JSON.stringify(getState()));
    if (hasGenerated) {
      generateButton.textContent = "Aggiorna";
      copyStatus.textContent = "Opzioni modificate: premi Aggiorna per rigenerare il comando.";
    }
  });
});

const saved = localStorage.getItem("yt-dlp-local-builder");
if (saved) {
  try {
    const savedState = JSON.parse(saved);
    const migrated = { ...defaults, ...savedState };
    if (!("skipDownloaded" in savedState)) {
      migrated.skipDownloaded = true;
      migrated.archiveFile = defaults.archiveFile;
    }
    if (!("logErrors" in savedState)) {
      migrated.logErrors = true;
      migrated.errorLogFile = defaults.errorLogFile;
    }
    setState(migrated);
  } catch {
    setState(defaults);
  }
} else {
  setState(defaults);
}

commandOutput.value = "";
setGeneratedState(false);


const tooltipTexts = [
  ["[data-preset='video']", "Preset per scaricare il video nella qualita migliore disponibile. Usa video e audio separati quando conviene, poi li unisce nel container scelto. Esempio: utile per salvare una lezione in 1080p/4K con audio pulito."],
  ["[data-preset='playlist']", "Preset per playlist complete o parziali. Mantiene l'ordine con il numero progressivo nel nome file e usa un archivio per non riscaricare video gia completati. Esempio: corso YouTube con 40 lezioni."],
  ["[data-preset='audio']", "Preset per estrarre solo l'audio e convertirlo in MP3. Utile per podcast, interviste o lezioni da ascoltare offline. Richiede ffmpeg per la conversione."],
  ["[data-preset='subs']", "Preset per scaricare e incorporare sottotitoli manuali e automatici. Esempio: salva sottotitoli italiani e inglesi con --sub-langs it,en.* e li inserisce nel file finale se il container lo permette."],
  ["[data-preset='inspect']", "Preset diagnostico: non scarica il contenuto, ma simula il comando ed elenca i formati disponibili. Esempio: usalo prima di scegliere una risoluzione o capire quali tracce audio esistono."],
  [".hero", "Panoramica del builder. L'app non scarica nulla da sola: genera una stringa yt-dlp pronta da copiare nel terminale."],
  ["#builder > .section-title:nth-of-type(1)", "Sorgente del download: qui definisci che cosa scaricare, come trattare URL singoli o playlist e quale sintassi di quoting usare per il tuo terminale."],
  ["#builder > .section-title:nth-of-type(2)", "Impostazioni di qualita e formato. Qui decidi il selettore yt-dlp -f, il limite di risoluzione e il container finale dopo l'eventuale merge con ffmpeg."],
  ["#builder > .section-title:nth-of-type(3)", "Controlli per playlist. Servono per scaricare solo una parte, invertire l'ordine o rendere il comando piu robusto quando un video non e disponibile."],
  ["#builder > .section-title:nth-of-type(4)", "Controlli per sottotitoli. yt-dlp puo scaricare sottotitoli ufficiali, automatici, limitarli per lingua e incorporarli nel file finale."],
  ["#builder > .section-title:nth-of-type(5)", "Automazione per download ripetibili: file di archivio, batch di URL, cookie browser, limiti rete e retry. Utile quando devi lanciare comandi lunghi senza seguirli a mano."],
  [".output-panel > .section-title", "Output generato. Qui trovi la stringa shell completa e, in alternativa, le righe da copiare in un file yt-dlp.conf."],
  ["#url", "URL da passare a yt-dlp. Puoi inserire un video, una playlist o piu URL separati da spazio. Esempio: https://www.youtube.com/watch?v=..."],
  ["#mode", "Modalita logica del comando. Video singolo abilita --no-playlist per evitare che un URL video con parametro list scarichi tutta la playlist; Playlist abilita i controlli di intervallo."],
  ["#platform", "Adatta le virgolette al terminale. macOS/Linux usa quoting POSIX con apici singoli; PowerShell raddoppia gli apici interni. Utile quando URL o template contengono caratteri speciali."],
  ["#outputPath", "Cartella di destinazione, flag -P. Esempio: ~/Downloads/yt-dlp su macOS/Linux o $HOME\\Downloads\\yt-dlp in PowerShell. yt-dlp salvera qui video, audio, sottotitoli e metadati generati."],
  ["#pickOutputPath", "Apre la finestra di sistema per scegliere o creare una cartella. Per privacy il browser puo non restituire il percorso completo: se serve, incollalo manualmente nel campo Cartella download."],
  ["#template", "Template del nome file, flag -o. Puoi usare campi yt-dlp come %(title)s, %(id)s e %(playlist_index)s. Esempio: %(playlist_index)03d - %(title)s.%(ext)s."],
  ["#format", "Selettore formato, flag -f. 'Miglior video + audio' spesso scarica due stream separati e li unisce; 'Miglior file singolo' evita il merge ma puo avere qualita minore."],
  ["#maxHeight", "Limite massimo di risoluzione. Se scegli 1080p, il builder genera un filtro height<=1080. Esempio: utile per evitare file 4K troppo pesanti."],
  ["#mergeFormat", "Container finale dopo il merge, flag --merge-output-format. MP4 e molto compatibile; MKV conserva meglio tracce multiple; Automatico lascia decidere a yt-dlp/ffmpeg."],
  ["#audioFormat", "Formato di conversione audio, flag --audio-format. MP3 e universale, M4A mantiene buona compatibilita, OPUS e efficiente, FLAC e lossless ma produce file grandi."],
  ["#audioQuality", "Qualita audio per conversione, flag --audio-quality. In yt-dlp 0 indica la qualita migliore e 10 la peggiore. Esempio: 0 per archivio, 5 per file piu leggeri."],
  ["#playlistStart", "Primo elemento della playlist da scaricare, flag --playlist-start. Esempio: 5 per iniziare dalla quinta lezione."],
  ["#playlistEnd", "Ultimo elemento della playlist da scaricare, flag --playlist-end. Esempio: 20 per fermarti alla ventesima lezione."],
  ["#playlistItems", "Selezione puntuale, flag --playlist-items. Accetta numeri e intervalli. Esempio: 1,3,7-10 scarica il primo, il terzo e dal settimo al decimo elemento."],
  ["#subLangs", "Lingue dei sottotitoli, flag --sub-langs. Esempio: it,en.* cerca italiano e varianti inglesi. Usa all per scaricare tutte le lingue disponibili."],
  ["#subFormat", "Formato sottotitoli, flag --sub-format. Esempio: srt/best preferisce SRT ma accetta il formato migliore disponibile se SRT manca."],
  ["#skipDownloaded", "Attiva --download-archive: yt-dlp controlla un file archivio e salta i video gia completati. I video falliti non vengono archiviati, quindi al prossimo lancio saranno riprovati."],
  ["#archiveFile", "Percorso del file archive. Se scrivi solo downloaded.txt, viene creato nella cartella da cui lanci il comando nel terminale, non necessariamente nella cartella download. Usa un percorso completo se vuoi fissarlo, es. ~/Downloads/yt-dlp/downloaded.txt."],
  ["#logErrors", "Aggiunge una redirezione shell 2>> verso un file log. Serve a conservare messaggi di errore, timeout e interruzioni senza perderli nello scroll del terminale."],
  ["#errorLogFile", "File dove appendere gli errori standard del comando. Esempio: yt-dlp-errors.log. Se usi un nome relativo, viene creato nella cartella da cui lanci il comando."],
  ["#batchFile", "File di input con una lista di URL, flag --batch-file. Ogni riga contiene un URL. Se lo usi, il builder non aggiunge l'URL scritto nel campo sorgente."],
  ["#cookiesBrowser", "Importa cookie da un browser, flag --cookies-from-browser. Serve per contenuti con login, eta, area geografica o iscrizioni. Esempio: chrome o safari."],
  ["#concurrentFragments", "Numero di frammenti scaricati in parallelo, flag -N. Valori come 4 o 8 possono accelerare stream DASH/HLS, ma troppi frammenti possono stressare la rete."],
  ["#rateLimit", "Limite di velocita, flag --limit-rate. Esempio: 2M limita a circa 2 MB/s, utile per non saturare la connessione mentre lavori."],
  ["#retries", "Numero di tentativi HTTP generali, flag --retries. Esempio: 10 ritenta download interrotti da timeout o problemi di rete; infinite continua finche possibile."],
  ["#fragmentRetries", "Retry dei singoli frammenti DASH/HLS, flag --fragment-retries. Utile quando video lunghi falliscono su piccoli pezzi di stream. Esempio: 10 o infinite."],
  ["#extractorRetries", "Retry della fase di estrazione metadati, flag --extractor-retries. Utile quando YouTube risponde temporaneamente male prima ancora che inizi il download."],
  ["#retrySleep", "Pausa tra retry, flag --retry-sleep. Esempio: linear=5::30 aspetta progressivamente da 5 fino a 30 secondi; fragment:exp=1:20 usa attesa esponenziale per frammenti."],
  ["#skipPlaylistAfterErrors", "Soglia errori playlist, flag --skip-playlist-after-errors. Esempio: 5 salta il resto della playlist dopo cinque fallimenti, utile se molti video sono privati o rimossi."],
  ["#extractAudio", "Aggiunge -x: scarica il media e poi estrae solo la traccia audio. Esempio: trasforma un video musicale o una conferenza in MP3."],
  ["#embedMetadata", "Aggiunge --embed-metadata: inserisce titolo, autore, data e altri metadati nel file finale quando supportato. Utile per librerie audio/video ordinate."],
  ["#embedThumbnail", "Aggiunge --embed-thumbnail: incorpora la miniatura nel file finale. Spesso richiede ffmpeg e un container compatibile, ad esempio MP3 con copertina."],
  ["#writeInfoJson", "Aggiunge --write-info-json: salva un file JSON con i metadati completi del video. Utile per archiviazione, catalogazione o debug."],
  ["#writeThumbnail", "Aggiunge --write-thumbnail: salva la miniatura come file separato. Esempio: utile se vuoi usare la cover in un archivio o in una pagina."],
  ["#noPlaylist", "Aggiunge --no-playlist quando lavori su video singolo. Evita l'effetto sorpresa: un link video con parametro list non scarichera l'intera playlist."],
  ["#playlistReverse", "Aggiunge --playlist-reverse: scarica la playlist dall'ultimo elemento al primo. Utile per archivi in cui vuoi partire dai contenuti piu vecchi o piu recenti a seconda dell'ordine originale."],
  ["#playlistRandom", "Aggiunge --playlist-random: scarica gli elementi in ordine casuale. Utile raramente, ad esempio per distribuire download lunghi senza seguire l'ordine della playlist."],
  ["#ignoreErrors", "Aggiunge --ignore-errors: se un elemento fallisce, yt-dlp continua con i successivi. Esempio: playlist con video rimossi, privati o geobloccati."],
  ["#writeSubs", "Aggiunge --write-subs: scarica sottotitoli ufficiali/manuali caricati dal creator, se disponibili."],
  ["#writeAutoSubs", "Aggiunge --write-auto-subs: scarica sottotitoli generati automaticamente da YouTube. Sono utili, ma possono contenere errori di trascrizione."],
  ["#embedSubs", "Aggiunge --embed-subs: incorpora i sottotitoli nel file video finale invece di lasciarli solo come file separati. Richiede container compatibile."],
  ["#simulate", "Aggiunge --simulate: yt-dlp risolve URL e opzioni ma non scarica file. Utile per controllare il comando prima di lanciarlo davvero."],
  ["#listFormats", "Aggiunge -F: mostra i formati disponibili per quel video, come risoluzioni, codec e tracce audio. Usalo prima di scegliere un selettore -f personalizzato."],
  ["#continueDownloads", "Mantiene il comportamento di ripresa dei download parziali. Se disattivato aggiunge --no-continue, cioe ricomincia invece di riprendere file incompleti."],
  ["#generate", "Genera la stringa finale partendo dalle opzioni selezionate. Dopo la prima generazione il bottone diventa Aggiorna: usalo quando modifichi i campi e vuoi rigenerare il comando."],
  ["#reset", "Ripristina i valori iniziali del builder. Utile quando hai sperimentato molte opzioni e vuoi tornare a una configurazione pulita."],
  ["#commandOutput", "Campo di output con il comando completo. Copialo e incollalo nel terminale. Se usi PowerShell, seleziona prima la piattaforma corretta."],
  ["#copy", "Copia negli appunti il comando completo mostrato sopra. Esempio: dopo il click puoi incollarlo direttamente nel Terminale macOS."],
  ["#copyConfig", "Copia le opzioni in formato adatto a yt-dlp.conf. Un file .conf e una configurazione permanente: yt-dlp legge quelle righe automaticamente, cosi non devi riscrivere sempre gli stessi flag. Non include URL ne redirezioni shell."],
  ["#terminalToggle", "Apre il mini-tutorial USA I COMANDI con i passaggi per aprire Terminale su macOS o PowerShell/Terminale su Windows e incollare il comando generato."],
  ["#useCommands summary", "Apre o chiude il tutorial pratico: installazione rapida, apertura del terminale su macOS/Windows e uso del campo Cartella download."],
  ["[data-copy-text]", "Copia negli appunti il comando di installazione mostrato a sinistra, cosi puoi incollarlo direttamente nel terminale."],
  [".help-box", "Promemoria operativo: scegli sorgente e opzioni, genera il comando, poi copialo nel terminale. La pagina non avvia processi sul sistema."],
  [".info-credits summary", "Apre i riferimenti ufficiali: repository, opzioni CLI, selezione formato e pagina dei maintainer. Se hai dubbi su un flag, parti da questi link."],
  [".compact-links a:nth-child(1)", "Repository ufficiale yt-dlp: codice sorgente, release, issue, changelog e README principale."],
  [".compact-links a:nth-child(2)", "Sezione Usage and options: elenco ufficiale dei flag CLI. Utile per verificare sintassi e opzioni avanzate."],
  [".compact-links a:nth-child(3)", "Sezione Format selection: spiega come funzionano -f, filtri per risoluzione, codec e combinazioni video+audio."],
  [".compact-links a:nth-child(4)", "Pagina maintainer e credits del progetto yt-dlp. Utile per attribuzioni e riferimenti al progetto originale."],
];

function setTooltip(element, text) {
  if (!element) return;
  element.dataset.tip = text;
  if (!element.hasAttribute("aria-describedby")) {
    element.setAttribute("aria-describedby", "uiTooltip");
  }
}

function applyTooltipTexts() {
  tooltipTexts.forEach(([selector, text]) => {
    document.querySelectorAll(selector).forEach((element) => {
      setTooltip(element, text);
      const fieldLabel = element.closest("label.field, .checks label");
      if (fieldLabel) setTooltip(fieldLabel, text);
    });
  });

  const sectionTips = [
    "Sorgente del download: qui definisci che cosa scaricare, come trattare URL singoli o playlist e quale sintassi di quoting usare per il tuo terminale.",
    "Impostazioni di qualita e formato. Qui decidi il selettore yt-dlp -f, il limite di risoluzione e il container finale dopo l'eventuale merge con ffmpeg.",
    "Controlli per playlist. Servono per scaricare solo una parte, invertire l'ordine o rendere il comando piu robusto quando un video non e disponibile.",
    "Controlli per sottotitoli. yt-dlp puo scaricare sottotitoli ufficiali, automatici, limitarli per lingua e incorporarli nel file finale.",
    "Automazione per download ripetibili: file di archivio, batch di URL, cookie browser, limiti rete e retry. Utile quando devi lanciare comandi lunghi senza seguirli a mano.",
  ];

  document.querySelectorAll("#builder > .section-title").forEach((section, index) => {
    setTooltip(section, sectionTips[index]);
  });
}

function initTooltips() {
  const tooltip = document.createElement("div");
  tooltip.id = "uiTooltip";
  tooltip.className = "tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);

  let activeElement = null;
  let openTimer = 0;

  const placeTooltip = (target) => {
    const rect = target.getBoundingClientRect();
    const gap = 12;
    const maxLeft = window.innerWidth - tooltip.offsetWidth - 12;
    const left = Math.min(Math.max(12, rect.left), Math.max(12, maxLeft));
    let top = rect.bottom + gap;

    if (top + tooltip.offsetHeight > window.innerHeight - 12) {
      top = rect.top - tooltip.offsetHeight - gap;
    }
    if (top < 12) {
      top = 12;
    }

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  };

  const showTooltip = (target) => {
    if (!target?.dataset.tip) return;
    activeElement = target;
    tooltip.textContent = target.dataset.tip;
    tooltip.classList.add("is-open");
    placeTooltip(target);
  };

  const scheduleTooltip = (target) => {
    window.clearTimeout(openTimer);
    openTimer = window.setTimeout(() => showTooltip(target), 750);
  };

  const hideTooltip = () => {
    window.clearTimeout(openTimer);
    activeElement = null;
    tooltip.classList.remove("is-open");
  };

  document.querySelectorAll("[data-tip]").forEach((element) => {
    element.addEventListener("mouseenter", () => scheduleTooltip(element));
    element.addEventListener("mouseleave", hideTooltip);
    element.addEventListener("focusin", () => scheduleTooltip(element));
    element.addEventListener("focusout", hideTooltip);
  });

  window.addEventListener("scroll", () => {
    if (activeElement) placeTooltip(activeElement);
  }, true);
  window.addEventListener("resize", hideTooltip);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideTooltip();
  });
}

applyTooltipTexts();
initTooltips();


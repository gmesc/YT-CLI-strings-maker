"use client";

import { useEffect, useMemo, useState } from "react";

type Platform = "posix" | "powershell";
type Mode = "video" | "playlist";

type FormState = {
  url: string;
  mode: Mode;
  platform: Platform;
  outputPath: string;
  template: string;
  format: string;
  mergeFormat: string;
  maxHeight: string;
  noPlaylist: boolean;
  playlistStart: string;
  playlistEnd: string;
  playlistItems: string;
  playlistReverse: boolean;
  playlistRandom: boolean;
  extractAudio: boolean;
  audioFormat: string;
  audioQuality: string;
  writeSubs: boolean;
  writeAutoSubs: boolean;
  embedSubs: boolean;
  subLangs: string;
  subFormat: string;
  embedMetadata: boolean;
  embedThumbnail: boolean;
  sponsorBlock: string[];
  writeInfoJson: boolean;
  writeThumbnail: boolean;
  cookiesBrowser: string;
  archiveFile: string;
  continueDownloads: boolean;
  ignoreErrors: boolean;
  concurrentFragments: string;
  rateLimit: string;
  retries: string;
  sleepInterval: string;
  maxSleepInterval: string;
  batchFile: string;
  simulate: boolean;
  listFormats: boolean;
};

type Preset = {
  id: string;
  title: string;
  description: string;
  patch: Partial<FormState>;
};

const defaultState: FormState = {
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  mode: "video",
  platform: "posix",
  outputPath: "~/Downloads/yt-dlp",
  template: "%(playlist_index&{} - |)s%(title).160B [%(id)s].%(ext)s",
  format: "bestvideo*+bestaudio/best",
  mergeFormat: "mp4",
  maxHeight: "",
  noPlaylist: true,
  playlistStart: "",
  playlistEnd: "",
  playlistItems: "",
  playlistReverse: false,
  playlistRandom: false,
  extractAudio: false,
  audioFormat: "mp3",
  audioQuality: "0",
  writeSubs: false,
  writeAutoSubs: false,
  embedSubs: false,
  subLangs: "it,en.*",
  subFormat: "srt/best",
  embedMetadata: true,
  embedThumbnail: false,
  sponsorBlock: [],
  writeInfoJson: false,
  writeThumbnail: false,
  cookiesBrowser: "",
  archiveFile: "",
  continueDownloads: true,
  ignoreErrors: false,
  concurrentFragments: "4",
  rateLimit: "",
  retries: "",
  sleepInterval: "",
  maxSleepInterval: "",
  batchFile: "",
  simulate: false,
  listFormats: false,
};

const presets: Preset[] = [
  {
    id: "daily-video",
    title: "Video migliore",
    description: "Qualità massima, merge in MP4, metadata inclusi.",
    patch: {
      mode: "video",
      noPlaylist: true,
      extractAudio: false,
      format: "bestvideo*+bestaudio/best",
      mergeFormat: "mp4",
      embedMetadata: true,
      simulate: false,
      listFormats: false,
    },
  },
  {
    id: "playlist-safe",
    title: "Playlist ordinata",
    description: "Numerazione stabile, archivio download e continua sugli errori.",
    patch: {
      mode: "playlist",
      noPlaylist: false,
      archiveFile: "downloaded.txt",
      ignoreErrors: true,
      template: "%(playlist_index)03d - %(title).160B [%(id)s].%(ext)s",
      format: "bestvideo*+bestaudio/best",
    },
  },
  {
    id: "audio-archive",
    title: "Audio MP3",
    description: "Estrae solo audio, copertina e metadata pronti per libreria.",
    patch: {
      extractAudio: true,
      audioFormat: "mp3",
      audioQuality: "0",
      format: "bestaudio/best",
      embedMetadata: true,
      embedThumbnail: true,
      mergeFormat: "",
    },
  },
  {
    id: "subtitles",
    title: "Con sottotitoli",
    description: "Scarica sottotitoli manuali e automatici in italiano/inglese.",
    patch: {
      writeSubs: true,
      writeAutoSubs: true,
      embedSubs: true,
      subLangs: "it,en.*",
      subFormat: "srt/best",
    },
  },
  {
    id: "inspect",
    title: "Solo ispezione",
    description: "Non scarica: elenca formati o simula il comando.",
    patch: {
      listFormats: true,
      simulate: true,
    },
  },
];

const sponsorCategories = [
  "sponsor",
  "intro",
  "outro",
  "selfpromo",
  "preview",
  "interaction",
  "music_offtopic",
];

function shellQuote(value: string, platform: Platform) {
  if (!value) return "";
  if (platform === "powershell") {
    return `'${value.replaceAll("'", "''")}'`;
  }
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

function addOption(parts: string[], flag: string, value?: string, platform: Platform = "posix") {
  if (value === undefined) {
    parts.push(flag);
    return;
  }

  if (value.trim()) {
    parts.push(flag, shellQuote(value.trim(), platform));
  }
}

function buildCommand(state: FormState) {
  const parts = ["yt-dlp"];
  const platform = state.platform;
  const format = state.maxHeight
    ? `bestvideo*[height<=${state.maxHeight}]+bestaudio/best[height<=${state.maxHeight}]/best`
    : state.format;

  if (state.listFormats) addOption(parts, "-F");
  if (state.simulate) addOption(parts, "--simulate");
  if (state.noPlaylist && state.mode === "video") addOption(parts, "--no-playlist");
  if (!state.continueDownloads) addOption(parts, "--no-continue");
  if (state.ignoreErrors) addOption(parts, "--ignore-errors");

  addOption(parts, "-P", state.outputPath, platform);
  addOption(parts, "-o", state.template, platform);
  addOption(parts, "-f", format, platform);
  addOption(parts, "--merge-output-format", state.mergeFormat, platform);
  addOption(parts, "-N", state.concurrentFragments, platform);
  addOption(parts, "--limit-rate", state.rateLimit, platform);
  addOption(parts, "--retries", state.retries, platform);
  addOption(parts, "--sleep-interval", state.sleepInterval, platform);
  addOption(parts, "--max-sleep-interval", state.maxSleepInterval, platform);

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
  if (state.sponsorBlock.length) {
    addOption(parts, "--sponsorblock-remove", state.sponsorBlock.join(","), platform);
  }

  addOption(parts, "--cookies-from-browser", state.cookiesBrowser, platform);
  addOption(parts, "--download-archive", state.archiveFile, platform);
  addOption(parts, "--batch-file", state.batchFile, platform);

  if (!state.batchFile.trim()) {
    addOption(parts, "--", undefined);
    state.url
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((url) => parts.push(shellQuote(url, platform)));
  }

  return parts.join(" ");
}

function buildConfig(state: FormState) {
  const lines: string[] = [];
  const format = state.maxHeight
    ? `bestvideo*[height<=${state.maxHeight}]+bestaudio/best[height<=${state.maxHeight}]/best`
    : state.format;

  const addLine = (flag: string, value?: string) => {
    if (value === undefined) {
      lines.push(flag);
      return;
    }

    if (value.trim()) {
      lines.push(flag, value.trim());
    }
  };

  if (state.listFormats) addLine("-F");
  if (state.simulate) addLine("--simulate");
  if (state.noPlaylist && state.mode === "video") addLine("--no-playlist");
  if (!state.continueDownloads) addLine("--no-continue");
  if (state.ignoreErrors) addLine("--ignore-errors");

  addLine("-P", state.outputPath);
  addLine("-o", state.template);
  addLine("-f", format);
  addLine("--merge-output-format", state.mergeFormat);
  addLine("-N", state.concurrentFragments);
  addLine("--limit-rate", state.rateLimit);
  addLine("--retries", state.retries);
  addLine("--sleep-interval", state.sleepInterval);
  addLine("--max-sleep-interval", state.maxSleepInterval);

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
  if (state.sponsorBlock.length) {
    addLine("--sponsorblock-remove", state.sponsorBlock.join(","));
  }

  addLine("--cookies-from-browser", state.cookiesBrowser);
  addLine("--download-archive", state.archiveFile);
  addLine("--batch-file", state.batchFile);

  return lines.join("\n");
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {hint ? <small>{hint}</small> : null}
      </span>
      {children}
    </label>
  );
}

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="switch">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

export default function Home() {
  const [state, setState] = useState<FormState>(() => {
    if (typeof window === "undefined") {
      return defaultState;
    }

    const saved = window.localStorage.getItem("yt-dlp-builder-state");
    if (!saved) {
      return defaultState;
    }

    try {
      return { ...defaultState, ...JSON.parse(saved) };
    } catch {
      window.localStorage.removeItem("yt-dlp-builder-state");
      return defaultState;
    }
  });
  const [copied, setCopied] = useState("");

  useEffect(() => {
    window.localStorage.setItem("yt-dlp-builder-state", JSON.stringify(state));
  }, [state]);

  const command = useMemo(() => buildCommand(state), [state]);
  const config = useMemo(() => buildConfig(state), [state]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(preset: Preset) {
    setState((current) => ({ ...current, ...preset.patch }));
  }

  async function copy(text: string, target: string) {
    await navigator.clipboard.writeText(text);
    setCopied(target);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">yt-dlp command builder</p>
          <h1>Costruisci download YouTube senza ricordare tutti i flag.</h1>
          <p>
            Scegli formato, playlist, sottotitoli, metadata e automazioni: la SPA
            genera una stringa `yt-dlp` pronta da incollare nel terminale.
          </p>
        </div>
        <div className="hero-command" aria-label="Comando generato">
          <div className="command-toolbar">
            <span>Comando live</span>
            <button onClick={() => copy(command, "hero")} type="button">
              {copied === "hero" ? "Copiato" : "Copia"}
            </button>
          </div>
          <code>{command}</code>
        </div>
      </section>

      <section className="quick-presets" aria-label="Preset rapidi">
        {presets.map((preset) => (
          <button key={preset.id} onClick={() => applyPreset(preset)} type="button">
            <strong>{preset.title}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </section>

      <section className="workspace">
        <div className="builder-panel">
          <div className="panel-heading">
            <p className="eyebrow">Input</p>
            <h2>Sorgente e sistema</h2>
          </div>

          <Field
            hint="Uno o più URL separati da spazio, oppure usa un batch file."
            label="URL video o playlist"
          >
            <textarea
              onChange={(event) => update("url", event.target.value)}
              rows={3}
              value={state.url}
            />
          </Field>

          <div className="segmented" role="group" aria-label="Tipo download">
            <button
              className={state.mode === "video" ? "active" : ""}
              onClick={() => update("mode", "video")}
              type="button"
            >
              Video singolo
            </button>
            <button
              className={state.mode === "playlist" ? "active" : ""}
              onClick={() => update("mode", "playlist")}
              type="button"
            >
              Playlist
            </button>
          </div>

          <div className="segmented" role="group" aria-label="Piattaforma terminale">
            <button
              className={state.platform === "posix" ? "active" : ""}
              onClick={() => update("platform", "posix")}
              type="button"
            >
              macOS/Linux
            </button>
            <button
              className={state.platform === "powershell" ? "active" : ""}
              onClick={() => update("platform", "powershell")}
              type="button"
            >
              PowerShell
            </button>
          </div>

          <div className="grid-two">
            <Field hint="Flag -P" label="Cartella download">
              <input
                onChange={(event) => update("outputPath", event.target.value)}
                type="text"
                value={state.outputPath}
              />
            </Field>
            <Field hint="Flag -o" label="Template nome file">
              <input
                onChange={(event) => update("template", event.target.value)}
                type="text"
                value={state.template}
              />
            </Field>
          </div>

          <div className="panel-heading compact">
            <p className="eyebrow">Qualità</p>
            <h2>Formato video/audio</h2>
          </div>

          <div className="grid-two">
            <Field hint="Flag -f" label="Selettore formato">
              <select
                onChange={(event) => update("format", event.target.value)}
                value={state.format}
              >
                <option value="bestvideo*+bestaudio/best">Best video + audio</option>
                <option value="best">Best singolo file</option>
                <option value="bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b">
                  MP4 preferito
                </option>
                <option value="bestaudio/best">Solo miglior audio sorgente</option>
                <option value="worst">File leggero</option>
              </select>
            </Field>
            <Field hint="Sovrascrive il selettore formato" label="Altezza massima">
              <select
                onChange={(event) => update("maxHeight", event.target.value)}
                value={state.maxHeight}
              >
                <option value="">Nessun limite</option>
                <option value="2160">4K</option>
                <option value="1440">1440p</option>
                <option value="1080">1080p</option>
                <option value="720">720p</option>
                <option value="480">480p</option>
              </select>
            </Field>
            <Field hint="Flag --merge-output-format" label="Container finale">
              <select
                onChange={(event) => update("mergeFormat", event.target.value)}
                value={state.mergeFormat}
              >
                <option value="">Automatico</option>
                <option value="mp4">MP4</option>
                <option value="mkv">MKV</option>
                <option value="webm">WebM</option>
                <option value="mov">MOV</option>
              </select>
            </Field>
            <Field hint="Flag -N" label="Download paralleli frammenti">
              <input
                min="1"
                onChange={(event) => update("concurrentFragments", event.target.value)}
                type="number"
                value={state.concurrentFragments}
              />
            </Field>
          </div>

          <div className="toggles">
            <Switch
              checked={state.extractAudio}
              label="Estrai audio"
              onChange={(value) => update("extractAudio", value)}
            />
            <Switch
              checked={state.embedMetadata}
              label="Incorpora metadata"
              onChange={(value) => update("embedMetadata", value)}
            />
            <Switch
              checked={state.embedThumbnail}
              label="Incorpora copertina"
              onChange={(value) => update("embedThumbnail", value)}
            />
          </div>

          {state.extractAudio ? (
            <div className="grid-two inset">
              <Field hint="Flag --audio-format" label="Formato audio">
                <select
                  onChange={(event) => update("audioFormat", event.target.value)}
                  value={state.audioFormat}
                >
                  <option value="mp3">MP3</option>
                  <option value="m4a">M4A</option>
                  <option value="opus">Opus</option>
                  <option value="flac">FLAC</option>
                  <option value="wav">WAV</option>
                  <option value="best">Best</option>
                </select>
              </Field>
              <Field hint="0 migliore, 10 peggiore" label="Qualità audio">
                <input
                  onChange={(event) => update("audioQuality", event.target.value)}
                  type="text"
                  value={state.audioQuality}
                />
              </Field>
            </div>
          ) : null}

          <div className="panel-heading compact">
            <p className="eyebrow">Playlist</p>
            <h2>Intervalli e ordine</h2>
          </div>

          <div className="grid-three">
            <Field hint="--playlist-start" label="Da">
              <input
                onChange={(event) => update("playlistStart", event.target.value)}
                placeholder="1"
                type="number"
                value={state.playlistStart}
              />
            </Field>
            <Field hint="--playlist-end" label="A">
              <input
                onChange={(event) => update("playlistEnd", event.target.value)}
                placeholder="20"
                type="number"
                value={state.playlistEnd}
              />
            </Field>
            <Field hint="--playlist-items" label="Elementi">
              <input
                onChange={(event) => update("playlistItems", event.target.value)}
                placeholder="1,3,7-10"
                type="text"
                value={state.playlistItems}
              />
            </Field>
          </div>

          <div className="toggles">
            <Switch
              checked={state.noPlaylist}
              label="Con URL video ignora playlist"
              onChange={(value) => update("noPlaylist", value)}
            />
            <Switch
              checked={state.playlistReverse}
              label="Ordine inverso"
              onChange={(value) => update("playlistReverse", value)}
            />
            <Switch
              checked={state.playlistRandom}
              label="Ordine casuale"
              onChange={(value) => update("playlistRandom", value)}
            />
          </div>

          <div className="panel-heading compact">
            <p className="eyebrow">Sottotitoli e contenuti</p>
            <h2>Extra utili</h2>
          </div>

          <div className="toggles">
            <Switch
              checked={state.writeSubs}
              label="Scarica sottotitoli"
              onChange={(value) => update("writeSubs", value)}
            />
            <Switch
              checked={state.writeAutoSubs}
              label="Sottotitoli automatici"
              onChange={(value) => update("writeAutoSubs", value)}
            />
            <Switch
              checked={state.embedSubs}
              label="Incorpora sottotitoli"
              onChange={(value) => update("embedSubs", value)}
            />
            <Switch
              checked={state.writeInfoJson}
              label="Salva info JSON"
              onChange={(value) => update("writeInfoJson", value)}
            />
            <Switch
              checked={state.writeThumbnail}
              label="Salva thumbnail"
              onChange={(value) => update("writeThumbnail", value)}
            />
          </div>

          <div className="grid-two inset">
            <Field hint="--sub-langs" label="Lingue sottotitoli">
              <input
                onChange={(event) => update("subLangs", event.target.value)}
                type="text"
                value={state.subLangs}
              />
            </Field>
            <Field hint="--sub-format" label="Formato sottotitoli">
              <input
                onChange={(event) => update("subFormat", event.target.value)}
                type="text"
                value={state.subFormat}
              />
            </Field>
          </div>

          <div className="chips" aria-label="Categorie SponsorBlock">
            {sponsorCategories.map((category) => {
              const active = state.sponsorBlock.includes(category);
              return (
                <button
                  className={active ? "active" : ""}
                  key={category}
                  onClick={() =>
                    update(
                      "sponsorBlock",
                      active
                        ? state.sponsorBlock.filter((item) => item !== category)
                        : [...state.sponsorBlock, category],
                    )
                  }
                  type="button"
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="panel-heading compact">
            <p className="eyebrow">Automazione</p>
            <h2>Ripetibilità e rete</h2>
          </div>

          <div className="grid-two">
            <Field hint="--download-archive" label="Archivio già scaricati">
              <input
                onChange={(event) => update("archiveFile", event.target.value)}
                placeholder="downloaded.txt"
                type="text"
                value={state.archiveFile}
              />
            </Field>
            <Field hint="--batch-file" label="File con lista URL">
              <input
                onChange={(event) => update("batchFile", event.target.value)}
                placeholder="urls.txt"
                type="text"
                value={state.batchFile}
              />
            </Field>
            <Field hint="--cookies-from-browser" label="Cookie dal browser">
              <select
                onChange={(event) => update("cookiesBrowser", event.target.value)}
                value={state.cookiesBrowser}
              >
                <option value="">Non usare cookie</option>
                <option value="chrome">Chrome</option>
                <option value="safari">Safari</option>
                <option value="firefox">Firefox</option>
                <option value="edge">Edge</option>
                <option value="brave">Brave</option>
              </select>
            </Field>
            <Field hint="--limit-rate" label="Limite velocità">
              <input
                onChange={(event) => update("rateLimit", event.target.value)}
                placeholder="2M"
                type="text"
                value={state.rateLimit}
              />
            </Field>
            <Field hint="--retries" label="Tentativi">
              <input
                onChange={(event) => update("retries", event.target.value)}
                placeholder="10"
                type="text"
                value={state.retries}
              />
            </Field>
            <Field hint="sleep tra download" label="Pausa min/max">
              <div className="split-input">
                <input
                  onChange={(event) => update("sleepInterval", event.target.value)}
                  placeholder="10"
                  type="text"
                  value={state.sleepInterval}
                />
                <input
                  onChange={(event) => update("maxSleepInterval", event.target.value)}
                  placeholder="30"
                  type="text"
                  value={state.maxSleepInterval}
                />
              </div>
            </Field>
          </div>

          <div className="toggles">
            <Switch
              checked={state.continueDownloads}
              label="Riprendi download parziali"
              onChange={(value) => update("continueDownloads", value)}
            />
            <Switch
              checked={state.ignoreErrors}
              label="Continua se un video fallisce"
              onChange={(value) => update("ignoreErrors", value)}
            />
            <Switch
              checked={state.simulate}
              label="Simula senza scaricare"
              onChange={(value) => update("simulate", value)}
            />
            <Switch
              checked={state.listFormats}
              label="Elenca formati disponibili"
              onChange={(value) => update("listFormats", value)}
            />
          </div>
        </div>

        <aside className="result-panel">
          <div className="sticky-output">
            <div className="panel-heading">
              <p className="eyebrow">Output</p>
              <h2>Comando pronto</h2>
            </div>
            <pre>
              <code>{command}</code>
            </pre>
            <div className="actions">
              <button onClick={() => copy(command, "command")} type="button">
                {copied === "command" ? "Copiato" : "Copia comando"}
              </button>
              <button
                className="secondary"
                onClick={() => setState(defaultState)}
                type="button"
              >
                Reset
              </button>
            </div>

            <div className="mini-summary">
              <span>{state.mode === "playlist" ? "Playlist" : "Video"}</span>
              <span>{state.extractAudio ? state.audioFormat.toUpperCase() : "Video"}</span>
              <span>{state.simulate ? "Simulazione" : "Download"}</span>
            </div>

            <div className="config-box">
              <div className="command-toolbar">
                <span>Blocchi per yt-dlp.conf</span>
                <button onClick={() => copy(config, "config")} type="button">
                  {copied === "config" ? "Copiato" : "Copia"}
                </button>
              </div>
              <pre>
                <code>{config}</code>
              </pre>
            </div>
          </div>
        </aside>
      </section>

      <section className="knowledge">
        <div>
          <p className="eyebrow">Approfondimenti</p>
          <h2>Link e riferimenti ufficiali</h2>
          <p>
            La sintassi generata segue la documentazione pubblica di `yt-dlp`.
            Verifica sempre aggiornamenti, opzioni deprecate e requisiti come
            `ffmpeg` quando lavori con merge, conversioni, thumbnail o metadata.
          </p>
        </div>
        <div className="resource-grid">
          <a href="https://github.com/yt-dlp/yt-dlp" rel="noreferrer" target="_blank">
            <strong>Repository GitHub</strong>
            <span>Codice, README, issue e release ufficiali.</span>
          </a>
          <a
            href="https://github.com/yt-dlp/yt-dlp/wiki/Installation"
            rel="noreferrer"
            target="_blank"
          >
            <strong>Installazione</strong>
            <span>Binaries, pip, package manager e piattaforme.</span>
          </a>
          <a
            href="https://github.com/yt-dlp/yt-dlp#usage-and-options"
            rel="noreferrer"
            target="_blank"
          >
            <strong>Opzioni CLI</strong>
            <span>Help completo organizzato per categorie.</span>
          </a>
          <a
            href="https://github.com/yt-dlp/yt-dlp#format-selection"
            rel="noreferrer"
            target="_blank"
          >
            <strong>Format selection</strong>
            <span>Selettori `-f`, ordinamento qualità e filtri.</span>
          </a>
          <a
            href="https://github.com/yt-dlp/yt-dlp/blob/master/Maintainers.md"
            rel="noreferrer"
            target="_blank"
          >
            <strong>Credits</strong>
            <span>
              Progetto `yt-dlp` dei maintainer e contributor; fork fondato da
              pukkandan, con core maintainers attuali documentati nel repo.
            </span>
          </a>
          <a
            href="https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE"
            rel="noreferrer"
            target="_blank"
          >
            <strong>Licenza</strong>
            <span>Il repository è distribuito sotto Unlicense.</span>
          </a>
        </div>
      </section>

      <footer>
        <span>Usa `yt-dlp` rispettando copyright, termini dei servizi e permessi sui contenuti.</span>
        <span>Questa SPA genera comandi: i download restano nel tuo terminale.</span>
      </footer>
    </main>
  );
}

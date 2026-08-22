import { useRef, useState } from 'react';
import { useLearningData } from '../app/DataProvider';
import { exportLearningData, importLearningData } from '../persistence/dataTransfer';
import type { Settings } from '../persistence/types';

export function SettingsPage() {
  const { snapshot, repository, refresh } = useLearningData();
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const save = async (settings: Settings) => {
    await repository.saveSettings(settings);
    await refresh();
  };
  const download = async () => {
    const data = await exportLearningData(repository);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `peterlingo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Backup eksporteret.');
  };
  const upload = async (file?: File) => {
    if (!file) return;
    try {
      await importLearningData(repository, await file.text());
      await refresh();
      setStatus('Data importeret.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Import mislykkedes.');
    }
  };
  const reset = async () => {
    if (
      !window.confirm(
        'Nulstil alle PeterLingo-fremskridt på denne enhed? Eksportér gerne en backup først.'
      )
    )
      return;
    await repository.reset();
    await refresh();
    setStatus('Fremskridt nulstillet.');
  };
  const settings = snapshot.settings;
  return (
    <div className="page settings-page">
      <header className="page-heading">
        <p className="eyebrow">Din lokale PeterLingo</p>
        <h1>Indstillinger</h1>
        <p>Alt gemmes i denne browser. Eksportér en backup, før du rydder browserdata.</p>
      </header>
      <section className="settings-section">
        <h2>Udseende</h2>
        <fieldset>
          <legend>Tema</legend>
          <div className="segmented">
            {(['system', 'light', 'dark'] as const).map((theme) => (
              <button
                type="button"
                className={settings.theme === theme ? 'active' : ''}
                key={theme}
                onClick={() => void save({ ...settings, theme })}
              >
                {theme === 'system' ? 'System' : theme === 'light' ? 'Lyst' : 'Mørkt'}
              </button>
            ))}
          </div>
        </fieldset>
      </section>
      <section className="settings-section">
        <h2>Læring</h2>
        <label className="setting-row">
          <span>
            <strong>Dagens varighed</strong>
            <small>Et mål — ikke en hård stopklods.</small>
          </span>
          <select
            value={settings.targetMinutes}
            onChange={(event) =>
              void save({ ...settings, targetMinutes: Number(event.target.value) })
            }
          >
            <option value="5">5 minutter</option>
            <option value="7">7 minutter</option>
            <option value="10">10 minutter</option>
          </select>
        </label>
        <label className="setting-row">
          <span>
            <strong>Tonenavne</strong>
            <small>Kernen bruger altid pitch class/MIDI.</small>
          </span>
          <select
            value={settings.noteNaming}
            onChange={(event) =>
              void save({ ...settings, noteNaming: event.target.value as Settings['noteNaming'] })
            }
          >
            <option value="danish">Dansk/tysk · H og B</option>
            <option value="international">International · B og B♭</option>
          </select>
        </label>
        <label className="setting-row">
          <span>
            <strong>Navne på klavertaster</strong>
            <small>Kan skjules, når geografien sidder.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.showPianoNoteNames}
            onChange={(event) =>
              void save({ ...settings, showPianoNoteNames: event.target.checked })
            }
          />
        </label>
      </section>
      <section className="settings-section data-settings">
        <h2>Data og backup</h2>
        <p>
          JSON indeholder indstillinger, FSRS-state, forsøg, svartider, hints, sessioner, diagnoser
          og hardwarepræferencer.
        </p>
        <div className="button-row">
          <button className="button primary" onClick={() => void download()}>
            Eksportér JSON
          </button>
          <button className="button secondary" onClick={() => fileInput.current?.click()}>
            Importér JSON
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => void upload(event.target.files?.[0])}
          />
        </div>
        <hr />
        <button className="button danger" onClick={() => void reset()}>
          Nulstil fremskridt
        </button>
        {status && (
          <p role="status" className="settings-status">
            {status}
          </p>
        )}
      </section>
    </div>
  );
}

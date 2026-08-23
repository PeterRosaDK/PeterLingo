import { useState } from 'react';
import { getAudioEngine } from '../../audio/ToneAudioEngine';
import { EAR_INTERVALS } from './curriculum';

const lessonSteps = [
  {
    eyebrow: '1 · Afstanden mellem to toner',
    title: 'Et interval er en afstand, ikke to bestemte toner',
    body: 'Den samme afstand kan begynde mange steder. Lyt derfor efter spændets størrelse og form i stedet for at gætte tonenavnene.',
  },
  {
    eyebrow: '2 · Tætliggende par',
    title: 'Skeln først mellem lille og stor terts',
    body: 'Den lille terts er tre halvtoner; den store er fire. Hør dem fra samme grundtone, så det ene ekstra halvtonetrin bliver tydeligt.',
  },
  {
    eyebrow: '3 · Mere åbne par',
    title: 'Sammenlign kvart og kvint',
    body: 'Kvarten er fem halvtoner og kvinten syv. Når de står ved siden af hinanden, kan du høre, at kvinten åbner klangen mere.',
  },
  {
    eyebrow: '4 · Tre måder at høre på',
    title: 'Melodisk op, melodisk ned og harmonisk',
    body: 'Melodisk betyder efter hinanden. Harmonisk betyder samtidigt. Den samme afstand kan føles anderledes, så dagens test bruger alle tre former.',
  },
];

function play(rootMidi: number, targetMidi: number, harmonic = false) {
  void getAudioEngine().playInterval(rootMidi, targetMidi, harmonic);
}

export function EarLesson({ onFinish }: { onFinish(): void }) {
  const [step, setStep] = useState(0);
  const lesson = lessonSteps[step]!;

  return (
    <section className="lesson-card ear-lesson" aria-labelledby="ear-lesson-title">
      <header>
        <div>
          <p className="eyebrow">{lesson.eyebrow}</p>
          <h2 id="ear-lesson-title">{lesson.title}</h2>
          <p>{lesson.body}</p>
        </div>
        <span className="ear-step-count">{step + 1}/4</span>
      </header>

      {step === 0 && (
        <div className="ear-demo-pair">
          <button type="button" onClick={() => play(60, 63)}>
            <span>▶</span>
            Samme afstand fra C
          </button>
          <button type="button" onClick={() => play(65, 68)}>
            <span>▶</span>
            Samme afstand fra F
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="ear-demo-pair">
          <button type="button" onClick={() => play(60, 63)}>
            <span>▶</span>
            Lille terts · 3
          </button>
          <button type="button" onClick={() => play(60, 64)}>
            <span>▶</span>
            Stor terts · 4
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="ear-demo-pair">
          <button type="button" onClick={() => play(60, 65)}>
            <span>▶</span>
            Ren kvart · 5
          </button>
          <button type="button" onClick={() => play(60, 67)}>
            <span>▶</span>
            Ren kvint · 7
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="ear-demo-grid">
          <button type="button" onClick={() => play(60, 64)}>
            <span>↗</span>
            Melodisk op
          </button>
          <button type="button" onClick={() => play(64, 60)}>
            <span>↘</span>
            Melodisk ned
          </button>
          <button type="button" onClick={() => play(60, 64, true)}>
            <span>≋</span>
            Harmonisk
          </button>
        </div>
      )}

      <div className="ear-lesson-nav">
        <button
          className="button secondary"
          type="button"
          disabled={step === 0}
          onClick={() => setStep((current) => current - 1)}
        >
          Forrige
        </button>
        {step < lessonSteps.length - 1 ? (
          <button
            className="button primary"
            type="button"
            onClick={() => setStep((current) => current + 1)}
          >
            Næste lille skridt
          </button>
        ) : (
          <button className="button primary" type="button" onClick={onFinish}>
            Gå til dagens test
          </button>
        )}
      </div>

      <details className="ear-reference">
        <summary>De fire intervaller i første forløb</summary>
        <ul>
          {EAR_INTERVALS.map((interval) => (
            <li key={interval.id}>
              <strong>{interval.name}</strong>
              <span>{interval.description}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

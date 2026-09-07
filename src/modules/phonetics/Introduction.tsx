import { useState } from 'react';
import { phoneticsManifest } from './domain';
const lessons = [
  {
    title: '1 · Skriv det, du hører',
    text: 'IPA er det internationale fonetiske alfabet. Almindelig stavning fortæller ikke altid præcist, hvordan et ord lyder. I lydskrift beskriver hvert symbol en lyd. Vi starter med enkelte vokaler, så du kan høre forskellen, før du skal huske tegnene.',
    example:
      'På dansk kan samme bogstav dække forskellige lyde. Tænk på a i kat og far. Derfor har vi brug for flere lydtegn end bogstaver.',
    task: 'Sig ordene langsomt. Læg mærke til, at din mund ændrer form. Du behøver endnu ikke kunne skrive hele ordet i IPA.',
  },
  {
    title: '2 · Tre lyde, du kan mærke',
    text: '[i], [y] og [u] er høje vokaler: tungen ligger højt i munden. Ved [i] er den fremme, og læberne er urundede. Ved [y] er tungen stadig fremme, men læberne rundes. Ved [u] er tungen længere tilbage, og læberne er rundede.',
    example:
      'Brug de danske ord is, lys og hus som huskekroge. Optagelserne nedenfor demonstrerer isolerede IPA-lyde; de er ikke danske indtalinger af ordene. Dialekt, længde og stød kan ændre den konkrete udtale.',
    task: 'Hold en i-lyd, og rund læberne uden at flytte tungen. Du nærmer dig [y]. Lyt derefter til de tre optagelser, og prøv at efterligne dem.',
  },
  {
    title: '3 · Længde, tryk og dansk stød',
    text: 'Tegnet [ː] efter en lyd betyder, at den er lang: [iː]. Tegnet [ˈ] står før en trykstærk stavelse. Firkantede parenteser bruges til en konkret lydgengivelse; skråstreger bruges til sprogets betydningsadskillende lydenheder, fonemer.',
    example:
      'Dansk har også stød, som er en særlig egenskab ved stemmen. Stød er ikke det samme som tryk eller en lang vokal. Vi venter med at bedømme dansk stød og hele danske ord, til vi har et gennemgået taledatasæt.',
    task: 'Sig en kort og en lang i-lyd. Skriv i og derefter iː. IPA-tastaturet i træningen hjælper med specialtegnene.',
  },
  {
    title: '4 · Se lyden i et spektrogram',
    text: 'Læs fra venstre mod højre: det er tiden. Nederst ligger lave frekvenser, øverst høje. Lyse områder viser mere energi. En vokal har ofte tydelige vandrette energibånd, kaldet formanter. En frikativ som [s] har støj; en plosiv har en kort udløsning efter en lukning.',
    example:
      'Den første formant, F1, hænger sammen med vokalens åbenhed. Den anden, F2, hænger blandt andet sammen med tungens placering og læbernes runding. Se især forskellen mellem [i] og [u]. Skalaen er mel: lige store afstande er ikke lige mange hertz.',
    task: 'Se på billederne nedenfor, og lyt. I selve spektrogramøvelsen skjules lyden, indtil du har svaret. Start med lydklassen vokal, frikativ eller plosiv; senere åbnes træning af den enkelte vokal.',
  },
];
export function Introduction({ start }: { start: (mode: 'ipa' | 'spectrogram') => void }) {
  const [step, setStep] = useState(0);
  const lesson = lessons[step]!;
  return (
    <section className="lesson-card phonetics-intro">
      <p className="eyebrow">
        Kom godt i gang · {step + 1} af {lessons.length}
      </p>
      <h2>{lesson.title}</h2>
      <p>{lesson.text}</p>
      <p>{lesson.example}</p>
      <div className="feedback">
        <strong>Prøv selv</strong>
        <p>{lesson.task}</p>
      </div>
      {(step === 1 || step === 3) && (
        <div className="ipa-examples">
          {phoneticsManifest
            .filter((r) => !r.synthetic)
            .map((r) => (
              <article key={r.id}>
                <h3>[{r.ipa}]</h3>
                <p>{r.cue}</p>
                {step === 3 && <img src={r.image} alt={`Eksempel: spektrogram af [${r.ipa}]`} />}
                <audio
                  controls
                  preload="none"
                  src={r.audio}
                  aria-label={`Lyt til [${r.ipa}]`}
                  onPlay={(event) => {
                    const current = event.currentTarget;
                    current
                      .closest('section')
                      ?.querySelectorAll('audio')
                      .forEach((audio) => {
                        if (audio !== current) audio.pause();
                      });
                  }}
                />
              </article>
            ))}
        </div>
      )}
      <div className="self-ratings">
        <button
          className="button secondary"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          Tilbage
        </button>
        {step < lessons.length - 1 ? (
          <button className="button primary" onClick={() => setStep(step + 1)}>
            Næste lille trin
          </button>
        ) : (
          <>
            <button className="button primary" onClick={() => start('ipa')}>
              Prøv IPA med tre vokaler
            </button>
            <button className="button secondary" onClick={() => start('spectrogram')}>
              Prøv spektrogrammer
            </button>
          </>
        )}
      </div>
      <p className="source-note">
        Menneskelige lydoptagelser: Denelson83,{' '}
        <a href="https://commons.wikimedia.org/wiki/File:Close_front_unrounded_vowel.ogg">[i]</a>,{' '}
        <a href="https://commons.wikimedia.org/wiki/File:Close_front_rounded_vowel.ogg">[y]</a>,{' '}
        <a href="https://commons.wikimedia.org/wiki/File:Close_back_rounded_vowel.ogg">[u]</a>,{' '}
        <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>. Konverteret til
        WAV og mel-spektrogrammer af PeterLingo. Danske ord er huskekroge; dansk og engelsk
        lydskrift har separate tastaturer.{' '}
        <a href="https://schwa.dk/lydskrift/" target="_blank" rel="noreferrer">
          Mere om dansk lydskrift hos schwa.dk
        </a>
        .
      </p>
    </section>
  );
}

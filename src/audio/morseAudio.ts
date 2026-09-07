import * as Tone from 'tone';
let synth: Tone.Synth | undefined;
export async function playMorse(pattern: string, characterWpm = 20, effectiveWpm = 8) {
  await Tone.start();
  synth ??= new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0, sustain: 1, release: 0.005 },
    volume: -16,
  }).toDestination();
  const dit = 1.2 / characterWpm;
  let time = Tone.now() + 0.05;
  for (const c of pattern) {
    const duration = dit * (c === '-' ? 3 : 1);
    synth.triggerAttackRelease(600, duration, time);
    time += duration + dit;
  }
  const spacing = Math.max(dit, (60 / effectiveWpm - 31 * dit) / 19);
  const wait = Math.max(0, time - dit + 3 * spacing - Tone.now());
  await new Promise((resolve) => setTimeout(resolve, wait * 1000));
}

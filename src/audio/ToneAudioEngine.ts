import * as Tone from 'tone';
import type { AudioEngine } from './AudioEngine';
import { midiToFrequency } from '../music/pitch';

export class ToneAudioEngine implements AudioEngine {
  private synth: Tone.PolySynth | null = null;

  private getSynth(): Tone.PolySynth {
    if (!this.synth) {
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle8' },
        envelope: { attack: 0.012, decay: 0.16, sustain: 0.28, release: 0.7 },
        volume: -10,
      }).toDestination();
    }
    return this.synth;
  }

  async ensureStarted(): Promise<void> {
    await Tone.start();
  }

  async startNote(midi: number, velocity = 0.75): Promise<void> {
    await this.ensureStarted();
    this.getSynth().triggerAttack(midiToFrequency(midi), Tone.now(), velocity);
  }

  stopNote(midi: number): void {
    this.getSynth().triggerRelease(midiToFrequency(midi), Tone.now());
  }

  async playInterval(rootMidi: number, targetMidi: number, harmonic = false): Promise<void> {
    await this.ensureStarted();
    const now = Tone.now();
    const synth = this.getSynth();
    if (harmonic)
      synth.triggerAttackRelease(
        [midiToFrequency(rootMidi), midiToFrequency(targetMidi)],
        0.9,
        now
      );
    else {
      synth.triggerAttackRelease(midiToFrequency(rootMidi), 0.55, now);
      synth.triggerAttackRelease(midiToFrequency(targetMidi), 0.7, now + 0.65);
    }
  }

  releaseAll(): void {
    this.synth?.releaseAll();
  }
}

let instance: ToneAudioEngine | null = null;
export function getAudioEngine(): ToneAudioEngine {
  instance ??= new ToneAudioEngine();
  return instance;
}

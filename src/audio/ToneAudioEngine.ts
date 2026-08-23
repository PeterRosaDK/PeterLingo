import * as Tone from 'tone';
import type { AudioEngine } from './AudioEngine';
import { midiToFrequency } from '../music/pitch';

export class ToneAudioEngine implements AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private room: Tone.Reverb | null = null;

  private getSynth(): Tone.PolySynth {
    if (!this.synth) {
      const room = new Tone.Reverb({ decay: 1.5, preDelay: 0.018, wet: 0.12 }).toDestination();
      const warmth = new Tone.Filter({
        frequency: 2_300,
        type: 'lowpass',
        rolloff: -12,
        Q: 0.45,
      }).connect(room);
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine4' },
        envelope: { attack: 0.035, decay: 0.24, sustain: 0.2, release: 0.85 },
        volume: -12,
      }).connect(warmth);
      this.room = room;
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
    if (harmonic) {
      synth.triggerAttackRelease(
        [midiToFrequency(rootMidi), midiToFrequency(targetMidi)],
        1.15,
        now,
        0.58
      );
    } else {
      synth.triggerAttackRelease(midiToFrequency(rootMidi), 0.62, now, 0.68);
      synth.triggerAttackRelease(midiToFrequency(targetMidi), 0.78, now + 0.7, 0.68);
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

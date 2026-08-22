export interface AudioEngine {
  ensureStarted(): Promise<void>;
  startNote(midi: number, velocity?: number): Promise<void>;
  stopNote(midi: number): void;
  playInterval(rootMidi: number, targetMidi: number, harmonic?: boolean): Promise<void>;
  releaseAll(): void;
}

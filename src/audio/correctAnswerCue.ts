let sharedContext: AudioContext | null = null;

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

function context(): AudioContext | null {
  if (sharedContext) return sharedContext;
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioContextClass) return null;
  sharedContext = new AudioContextClass();
  return sharedContext;
}

function tone(
  audio: AudioContext,
  frequency: number,
  startsAt: number,
  duration: number,
  level: number,
  type: OscillatorType
): void {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(level, startsAt + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(startsAt);
  oscillator.stop(startsAt + duration + 0.02);
  oscillator.addEventListener('ended', () => {
    oscillator.disconnect();
    gain.disconnect();
  });
}

export async function playCorrectAnswerCue(enabled = true): Promise<void> {
  if (!enabled) return;
  try {
    const audio = context();
    if (!audio) return;
    if (audio.state !== 'running') await audio.resume();
    const now = audio.currentTime + 0.015;
    tone(audio, 587.33, now, 0.13, 0.085, 'sine');
    tone(audio, 880, now + 0.105, 0.23, 0.075, 'sine');
    tone(audio, 1174.66, now + 0.12, 0.2, 0.025, 'triangle');
  } catch {
    // Audio feedback is optional and must never interrupt an answer.
  }
}

import { afterEach, describe, expect, it, vi } from 'vitest';
import { playLocalAudio } from './playLocalAudio';
function clip() {
  const audio = new EventTarget() as HTMLAudioElement;
  audio.play = vi.fn().mockResolvedValue(undefined);
  audio.pause = vi.fn();
  Object.defineProperty(audio, 'ended', { value: false, configurable: true });
  return audio;
}
afterEach(() => vi.useRealTimers());
describe('local playback completion', () => {
  it('waits for actual completion', async () => {
    const audio = clip();
    const done = playLocalAudio(audio);
    audio.dispatchEvent(new Event('ended'));
    await expect(done).resolves.toBeUndefined();
  });
  it('rejects interrupted audio so a drill can be retried', async () => {
    const audio = clip();
    const done = playLocalAudio(audio);
    audio.dispatchEvent(new Event('pause'));
    await expect(done).rejects.toThrow('interrupted');
  });
  it('handles play denial and stalled media', async () => {
    const denied = clip();
    denied.play = vi.fn().mockRejectedValue(new Error('blocked'));
    await expect(playLocalAudio(denied)).rejects.toThrow('denied');
    vi.useFakeTimers();
    const stalled = clip();
    const expectation = expect(playLocalAudio(stalled)).rejects.toThrow('timeout');
    await vi.advanceTimersByTimeAsync(30000);
    await expectation;
    expect(stalled.pause).toHaveBeenCalled();
  });
});

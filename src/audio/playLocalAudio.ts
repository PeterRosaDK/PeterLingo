/** Complete a local media clip, or release the UI when playback is interrupted. */
export function playLocalAudio(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => finish(new Error('Audio timeout')), 30000);
    function finish(error?: Error) {
      window.clearTimeout(timeout);
      audio.removeEventListener('ended', ended);
      audio.removeEventListener('error', failed);
      audio.removeEventListener('pause', paused);
      if (error) {
        audio.pause();
        reject(error);
      } else resolve();
    }
    function ended() {
      finish();
    }
    function failed() {
      finish(new Error('Audio unavailable'));
    }
    function paused() {
      if (!audio.ended) finish(new Error('Audio interrupted'));
    }
    audio.addEventListener('ended', ended);
    audio.addEventListener('error', failed);
    audio.addEventListener('pause', paused);
    void audio.play().catch(() => finish(new Error('Playback denied')));
  });
}

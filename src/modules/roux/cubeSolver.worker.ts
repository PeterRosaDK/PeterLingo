import { solvePattern } from './min2phase';

interface SolverWorkerResponse {
  ok: boolean;
  algorithm?: string;
  message?: string;
}

interface SolverWorkerScope {
  onmessage: ((event: MessageEvent<string>) => void) | null;
  postMessage(message: SolverWorkerResponse): void;
}

const workerScope = globalThis as unknown as SolverWorkerScope;

workerScope.onmessage = (event) => {
  try {
    workerScope.postMessage({ ok: true, algorithm: solvePattern(event.data) });
  } catch (error) {
    workerScope.postMessage({
      ok: false,
      message: error instanceof Error ? error.message : 'Løsningen kunne ikke beregnes.',
    });
  }
};

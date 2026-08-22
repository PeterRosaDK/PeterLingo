# Contributing

PeterLingo welcomes focused improvements that preserve its shared learning architecture.

1. Use Node 20.19+ and install with `npm ci`.
2. Keep domain rules outside React views.
3. Schedule stable learning units; generate variable exercises from them.
4. Use `LearningRepository`, `Scheduler`, `SmartCubeAdapter`, and `AudioEngine` boundaries rather than reaching around them.
5. Add tests for rules and regressions.
6. Run `npm run check` and relevant Playwright tests before opening a pull request.
7. Record copied assets/code and exact license/commit in `THIRD_PARTY_NOTICES.md`.

Do not add tracking, credentials, authentication, a backend, microphone permission, or external paid services without an explicit architectural decision.

Physical hardware claims require a dated test report identifying the device/browser path. Mock tests prove the software contract, not the physical integration.

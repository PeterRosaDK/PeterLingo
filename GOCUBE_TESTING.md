# Physical GoCube verification checklist

Milestone 0 is software-ready but **not physically verified**. Run this checklist separately on each target below and record date, OS/browser version, GoCube model/firmware if visible, and the result.

## Before each run

1. Charge and wake the GoCube; keep it close to the device.
2. Close other apps/tabs that may own its Bluetooth connection.
3. Serve PeterLingo over HTTPS or use `localhost` on desktop.
4. Open **Fag → Roux → Åbn GoCube-diagnostik**.
5. Confirm the warning still says physical validation is pending.

## iPhone Safari + Beacio

1. Install/open Beacio once.
2. Go to **Indstillinger → Apps → Safari → Udvidelser**.
3. Enable Beacio and allow it on the PeterLingo website.
4. Force-reload PeterLingo.
5. In diagnostics confirm: browser is iOS Safari, secure context is **Ja**, Web Bluetooth is **Tilgængelig**, Beacio is **Aktiv/polyfill fundet**.
6. Tap **Fysisk GoCube**.
7. Tap **Forbind GoCube** once. Do not navigate away while the chooser is open.
8. Select the GoCube. Confirm detected name/protocol and battery if supported.
9. Turn `R`, `U`, `R'`, `U'` slowly. Confirm every move appears once, in the correct direction and order.
10. Compare the physical cube, 3D cube, raw facelets, logical move count, and synchronization label.
11. Make at least 30 mixed turns, return the physical cube to solved, and check agreement again.
12. Tap **Afbryd**; confirm no later physical turn is logged.
13. Reconnect manually and repeat four moves. There must be no automatic request-device prompt or silent retry.

## iPad Safari + Beacio

Repeat the iPhone procedure in both portrait and landscape. Also confirm the diagnostics and 3D cube remain usable without horizontal page overflow.

## Desktop Chrome or Edge

1. Use a current Chrome/Edge browser on macOS/Windows with Bluetooth enabled.
2. Confirm Beacio reads **Ikke nødvendig** and Web Bluetooth is available.
3. Run connection, four-turn direction check, 30-turn sync check, disconnect, and manual reconnect as above.

## Recovery checks

- Beacio absent/disabled on iOS: PeterLingo must show Danish enable/install guidance while every non-BLE page still works.
- HTTP/insecure context: diagnostics must explain HTTPS/localhost.
- User cancels the chooser: no false “connected” state.
- Cube sleeps or moves out of range: UI returns to a truthful disconnected/error state; no automatic chooser or retry.
- Refresh while disconnected: no chooser appears without a new tap.

## Completion evidence

Hardware integration can be called verified only when all three available target paths have a recorded result, or a target is explicitly marked unavailable. File issues with the exact step, visible status, and sanitized error text; do not include Bluetooth addresses or other device identifiers in public logs.

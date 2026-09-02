# Physical GoCube verification checklist

Desktop pairing, state accuracy, outer-turn tracking, and one complete recovery have physically
succeeded. M-move normalization and the complete device matrix are **not yet verified**. Run this
checklist separately on each target below and record date, OS/browser version, GoCube model/firmware
if visible, and the result.

## Before each run

1. Charge and wake the GoCube; keep it close to the device.
2. Close other apps/tabs that may own its Bluetooth connection.
3. Serve PeterLingo over HTTPS or use `localhost` on desktop.
4. Open **Fag → Roux → Åbn GoCube-diagnostik**.
5. Hold the white GO centre upward and the green centre toward you. Keep this standard reference
   grip while comparing colours and testing moves: green F, blue B, red R, orange L, white U, yellow D.
6. Confirm the warning says that ordinary outer-turn tracking is confirmed while M moves remain the
   next verification step.

## iPhone Safari + Beacio

1. Install/open Beacio once.
2. Go to **Indstillinger → Apps → Safari → Udvidelser**.
3. Enable Beacio and allow it on the PeterLingo website.
4. Force-reload PeterLingo.
5. In diagnostics confirm: browser is iOS Safari, secure context is **Ja**, Web Bluetooth is **Tilgængelig**, Beacio is **Aktiv/polyfill fundet**.
6. On first use, tap **Find og forbind GoCube** once. Do not navigate away while the chooser is
   open. On later visits, prefer **Genforbind GoCube** when it is offered.
7. Select the GoCube. Confirm detected name/protocol and battery if supported. Reload the page once,
   then confirm **Husket af browseren** names the cube and **Genforbind GoCube** reconnects without
   opening a new chooser. A remembered cube can still be asleep, out of range, or occupied by
   another app; the following connection message must distinguish that from missing permission.
8. If the displayed colors do not match, tap **Kontrollér synkronisering**. Do not use solved-state reset while
   the physical cube is mixed.
   If the second reading is still wrong, open **Indtast den fysiske tilstand manuelt**, correct the
   stickers, and copy the comparison report before making more turns.
9. Turn `R`, `U`, `R'`, `U'` slowly. Confirm every outer move appears once with the same letter and
   direction. `R → B` means the cube is not in the standard reference grip.
10. Tap **Ryd kun loggen**, make one isolated physical `M`, and record both raw move names and the
    displayed millisecond gap. Repeat from a cleared log with one `M'`. Do not yet assume which
    pair corresponds to which normalized slice direction.
11. Compare the physical cube, facelet net, raw facelets, logical move count, and synchronization label.
    Remember that the hardware supplies a full snapshot at connection/re-read; between snapshots,
    the integration advances that state from the received move packets.
12. Make at least 30 mixed turns, return the physical cube to solved, and check agreement again.
13. With the cube physically solved, use **Nulstil efter fysisk løsning …** and confirm the warning
    before calibrating the electronics. Never use this to make a mixed cube appear solved.
14. Tap **Afbryd**; confirm no later physical turn is logged.
15. Reload once with the approved cube awake. PeterLingo should make one quiet reconnection attempt
    without opening a chooser. If that fails, reconnect manually and repeat four moves.
16. Start **Løs den aflæste cube** and perform the shown move physically. A quarter-turn should
    advance immediately; a half-turn should advance only after its second matching quarter-turn.
    Disconnect the cube and confirm that the manual step buttons return.

## iPad Safari + Beacio

Repeat the iPhone procedure in both portrait and landscape. Also confirm the diagnostics and
facelet net remain usable without horizontal page overflow.

## Desktop Chrome or Edge

1. Use a current Chrome/Edge browser on macOS/Windows with Bluetooth enabled.
2. Do not install Beacio on the Mac; it is only needed for Safari on iPhone/iPad.
3. Confirm Beacio reads **Ikke nødvendig** and Web Bluetooth is available.
4. Run connection, four-turn direction check, 30-turn sync check, disconnect, and manual reconnect as above.

## Recovery checks

- Beacio absent/disabled on iOS: PeterLingo must show Danish enable/install guidance while every non-BLE page still works.
- HTTP/insecure context: diagnostics must explain HTTPS/localhost.
- User cancels the chooser: no false “connected” state.
- Cube sleeps or moves out of range: UI returns to a truthful disconnected/error state; no chooser
  opens and there is no repeated retry loop.
- Refresh while disconnected: at most one quiet remembered-device attempt occurs; no chooser appears
  without a new tap.

## Completion evidence

Hardware integration can be called verified only when all three available target paths have a recorded result, or a target is explicitly marked unavailable. File issues with the exact step, visible status, and sanitized error text; do not include Bluetooth addresses or other device identifiers in public logs.

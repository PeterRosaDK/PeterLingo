# Physical GoCube verification checklist

Desktop pairing, state accuracy, outer-turn tracking, and one complete recovery have physically
succeeded. M-move normalization and the complete device matrix are **not yet verified**. Run this
checklist separately on each target below and record date, OS/browser version, GoCube model/firmware
if visible, and the result.

## Before each run

1. Charge and wake the GoCube; keep it close to the device.
2. Close other apps/tabs that may own its Bluetooth connection.
3. Serve PeterLingo over HTTPS or use `localhost` on desktop.
4. Open **Fag → Roux** and confirm the live 3D cube and training path appear immediately. If the
   browser already knows the GoCube, confirm this route tries to reconnect without a chooser.
   Choose **Opsætning** only for the deeper hardware checks below.
5. Hold the white GO centre upward and the green centre toward you. Keep this standard reference
   grip while comparing colours and testing moves: green F, blue B, red R, orange L, white U, yellow D.
6. Confirm the setup screen starts with connection and the live 3D cube, without an unfolded
   diagnostic net.

## iPhone Safari + Beacio

1. Install/open Beacio once.
2. Go to **Indstillinger → Apps → Safari → Udvidelser**.
3. Enable Beacio and allow it on the PeterLingo website.
4. Force-reload PeterLingo.
5. In Opsætning confirm: browser is iOS Safari, secure context is **Ja**, Web Bluetooth is **Tilgængelig**, Beacio is **Aktiv/polyfill fundet**.
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
9. Hold white/GO up and green front when the first gyro reading arrives. Turn and tilt the whole
   physical cube; confirm both the Opsætning view and the home-page Roux card follow the same axis
   and direction. This is a physical calibration check, not yet established by automated tests.
10. Turn `R`, `U`, `R'`, `U'` slowly. Confirm **Sidste træk** shows each outer move once with the
    same letter and direction. `R → B` means the cube is not in the standard reference grip.
11. Compare the physical cube, 3D colors, raw facelets, logical move count, and synchronization label.
    Remember that the hardware supplies a full snapshot at connection/re-read; between snapshots,
    the integration advances that state from the received move packets.
12. Make at least 30 mixed turns, return the physical cube to solved, and check agreement again.
13. Return to **Roux**, hold the physically solved cube with hvid/GO up and green forward as shown,
    and use **Kalibrer** once. Check that the 3D cube is square-on to the green face and the logical
    state is solved. Never use this direct action on a mixed cube.
14. Tap **Afbryd**; confirm no later physical turn is logged.
15. On desktop Chrome/Edge, reload once with the approved cube awake. PeterLingo should make a quiet
    startup reconnection without opening a chooser. Entering Roux may make one additional quiet
    retry; it must not loop. On iPhone/iPad, Beacio does not persist pairing across the reload, so a
    new user tap is expected. Reconnect manually and repeat four moves.
16. Start **Løs cuben hurtigt** and perform the shown move physically. A quarter-turn should
    advance immediately; a half-turn should advance only after its second matching quarter-turn.
    Disconnect the cube and confirm that the manual step buttons return.
17. Open **Roux → Second Block** with the cube solved. Perform the displayed `R`/`U`
    exercise setup, start the live attempt, and rebuild the red-yellow right block. Confirm that
    the five-piece counter follows the physical cube, completion is automatic, and deliberately
    breaking the orange First Block prevents completion until it is restored.
18. Open **Roux → Begynder-CMLL** with the cube solved. Run the orientation setup, start live
    practice, and execute Sune. Repeat with the permutation setup and T-perm. Confirm the app first
    reports four white corners oriented, then recognizes headlights and final corner placement.
    Break either 1×2×3 block during an attempt and confirm CMLL cannot complete until both blocks
    are restored.
19. Open **Roux → Last Six Edges** with the cube solved. Run each of the three displayed LSE-only
    setups. For EO, confirm the good-edge counter changes as `M` and `U` are turned. For L/R,
    confirm the app recognizes edges relative to the corner ring even after a `U` adjustment. For
    4C, confirm completion happens automatically only when all six faces are uniform. Deliberately
    disturb a block or corner and confirm LSE stops and names the broken prerequisite.

## iPad Safari + Beacio

Repeat the iPhone procedure in both portrait and landscape. Also confirm Opsætning and the 3D cube
remain usable without horizontal page overflow.

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
- Desktop refresh while disconnected: one quiet startup attempt is allowed, plus one Roux-entry
  retry; no chooser appears without a new tap and there is no repeated retry loop. iOS/Beacio starts
  without persistent pairing and must expose a clear manual connection button.

## Completion evidence

Hardware integration can be called verified only when all three available target paths have a recorded result, or a target is explicitly marked unavailable. File issues with the exact step, visible status, and sanitized error text; do not include Bluetooth addresses or other device identifiers in public logs.

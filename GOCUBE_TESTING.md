# Physical GoCube verification checklist

Desktop pairing, state accuracy, outer-turn tracking, and one complete recovery have physically
succeeded. M-move normalization and the complete device matrix are **not yet verified**. Run this
checklist separately on each target below and record date, OS/browser version, GoCube model/firmware
if visible, and the result.

## Before each run

1. Charge and wake the GoCube; keep it close to the device.
2. Close other apps/tabs that may own its Bluetooth connection.
3. Serve PeterLingo over HTTPS or use `localhost` on desktop.
4. Open **Fag → Roux** and confirm the live 3D cube and training path appear immediately. Native
   Chrome/Edge may quietly reconnect exactly one approved cube. iPad/Beacio must instead wait for
   the user's **Tilslut** tap; there is no separate Opsætning screen.
5. Hold the white GO centre upward and the green centre toward you. Keep this standard reference
   grip while comparing colours and testing moves: green F, blue B, red R, orange L, white U, yellow D.
6. Confirm the Roux workbench starts with connection and the live 3D cube, without an unfolded
   diagnostic net.

## iPhone Safari + Beacio

1. Install/open Beacio once.
2. Go to **Indstillinger → Apps → Safari → Udvidelser**.
3. Enable Beacio and allow it on the PeterLingo website.
4. Force-reload PeterLingo.
5. Open **Tekniske Bluetooth-detaljer** and confirm the path says Beacio, Beacio is active, direct
   reconnect is unsupported, core is 2.1.1, and the three GoCube/Rubiks name prefixes are shown.
6. Tap **Tilslut** once. Do not navigate away while the browser-controlled chooser is open. Confirm
   that the chooser appears directly from this tap and select the GoCube.
7. Reload once. Confirm iPad does not claim a remembered cube or attempt prompt-free reconnection;
   tap **Tilslut** again as required by Beacio's non-persistent pairing model.
8. If the displayed colors do not match, tap **Synkronisér farver**. Confirm the physical cube and
   3D orientation do not change and a mixed cube is not marked solved. If the second reading is
   still wrong, choose **Ret farver manuelt** in the same Roux workbench, correct the stickers, and
   save. Make the cube send another snapshot and confirm it does not silently replace the manual
   correction. **Synkronisér farver** must be the explicit action that returns to hardware colors.
9. Hold white/GO up and green front when the first gyro reading arrives. Turn and tilt the whole
   physical cube; confirm the Roux workbench and home-page Roux card follow the same axis and
   direction. This is a physical calibration check, not established by automated tests.
10. Turn `R`, `U`, `R'`, `U'` slowly. Confirm the 3D colors follow every physical turn once and in
    the correct direction from the fixed grip.
11. Make at least 30 mixed turns and compare all six physical sides with the rotatable 3D cube.
    Use **Synkronisér farver** once, then return the physical cube to solved and compare again.
12. Hold the cube with hvid/GO up and green forward as shown, and use
    **Kalibrer 3D** once. Check that only the model's visual direction changes. Facelets and solved
    state must remain identical before and after, whether the physical cube is solved or mixed.
13. Reload the page. On iPhone/iPad, Beacio does not persist pairing, so there must be no false
    “remembered” claim and a new **Tilslut** tap is expected. Reconnect and repeat four moves.
14. Start **Løs hurtigt** and perform the shown move physically. A quarter-turn should
    advance immediately; a half-turn should advance only after its second matching quarter-turn.
15. Open **Roux → Second Block** with the cube solved. Perform the displayed `R`/`U`
    exercise setup, start the live attempt, and rebuild the red-yellow right block. Confirm that
    the five-piece counter follows the physical cube, completion is automatic, and deliberately
    breaking the orange First Block prevents completion until it is restored.
16. Open **Roux → Begynder-CMLL** with the cube solved. Run the orientation setup, start live
    practice, and execute Sune. Repeat with the permutation setup and T-perm. Confirm the app first
    reports four white corners oriented, then recognizes headlights and final corner placement.
    Break either 1×2×3 block during an attempt and confirm CMLL cannot complete until both blocks
    are restored.
17. Open **Roux → Last Six Edges** with the cube solved. Run each of the three displayed LSE-only
    setups. For EO, confirm the good-edge counter changes as `M` and `U` are turned. For L/R,
    confirm the app recognizes edges relative to the corner ring even after a `U` adjustment. For
    4C, confirm completion happens automatically only when all six faces are uniform. Deliberately
    disturb a block or corner and confirm LSE stops and names the broken prerequisite.

## iPad Safari + Beacio

Repeat the iPhone procedure in both portrait and landscape. Also confirm the Roux workbench and 3D cube
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

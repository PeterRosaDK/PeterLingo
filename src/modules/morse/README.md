# Morse

`domain.ts` contains the human-editable ITU letter/digit map and central Koch configuration.
Code source: [ITU-R M.1677-1](https://www.itu.int/rec/R-REC-M.1677-1-200910-I).
The 36 characters each have independent `morse:receive:C` and `morse:send:C` units.
FSRS schedules them; Koch only determines eligibility. K/M start the progression. At least 30
recent receive attempts (the window grows to three per active character for larger sets), strictly over 90% clean accuracy, and coverage of every active character
unlock one additional character. Send attempts and hinted answers cannot unlock receive material.

`src/audio/morseAudio.ts` extends the existing Tone.js audio layer: local sine oscillator,
600 Hz, 5 ms envelope edges, 20 WPM character speed. PARIS-based Farnsworth spacing begins at
8 effective WPM and approaches 20 as the set grows. No sample files, microphone or networking.
The timer begins after the initial character and its spacing; replays do not reset it.
Single-character drills do not claim to measure continuous-copy WPM; effectiveWpm is configured
presentation spacing and is retained in attempt parameters.

Receive shows neither the expected letter nor a code overlay. The optional revealing teaching
hint shows both and is scored as assistance. Send supports pointer capture and focused Space key;
relative dit/dah duration and intra-character gaps are scored around the median inferred dit.
Timing vectors, normalized error and inferred dit are stored in attempt parameters and shown
after scoring. The binary reference tree uses left=dit and right=dah through digit depth.

Extend the map and Koch order together, preserving IDs. Punctuation, word groups, calibrated
physical listening, and touch interruption/recovery on real iOS hardware remain later work.

# Python-hjernen

`snippets/*.py` contains 42 reviewed, 3–8-line programs. `metadata.json` stores stable ID, topic,
difficulty, Danish rule explanation, minimum version, classification and misconception tags.
`answers.json` is the generated offline key: source, stdout, exception type, source SHA256 and
actual validating Python version. Each snippet has one `python_output:<id>` FSRS unit.

```sh
python3 tools/python-output/generate.py
npm run test:datasets
```

The tool executes each snippet in a fresh subprocess and temporary working directory with three
hash seeds, no inherited secrets, disabled site imports, timeout, CPU and output limits. It
captures stdout and exception type, rejects unequal results and writes the manifest only after
all pass. Tests prove timeout handling, prior stdout with exceptions, seed-sensitive set output
and external-effect rejection. This is **reviewed repository corpus tooling**, not a security
sandbox for arbitrary Python; the browser never executes Python or accepts executable uploads.

Use Python 3.13 (the checked-in manifest gives the exact patch used). --check compares source,
metadata and ground truth; CI runs the same major/minor. Expressions depending on set order or
incidental interning must not be added. Existing identity examples use explicitly separate objects.
Floating-point examples assume ordinary IEEE-754 binary64 and are documented version behavior.
The remaining core examples teach [Python language semantics](https://docs.python.org/3/reference/).

Typed stdout preserves spaces and internal blank lines, normalizes CRLF and tolerates one final
newline (textarea convention). If a snippet raises, the task accepts the exception type. Prior
stdout is still retained in the manifest/attempt metadata. Syntax colors, hints, explanation,
latency, topic and misconception tags integrate with the shared exercise/attempt layer.

To extend: add a .py plus metadata, execute the generator, inspect facit, then run tests. Do not
hand-edit generated answers. Original code and explanations are GPL-3.0; no third-party corpus.

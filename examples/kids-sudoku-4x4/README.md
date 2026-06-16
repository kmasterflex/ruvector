# Kids Sudoku 4×4

A tiny generator for **4×4 sudoku puzzles for kids**. The board is a 4×4 grid
divided into four **2×2 blocks** (exactly like the hand-drawn grid this was
based on). Every **row**, every **column**, and every **2×2 block** must contain
the numbers **1, 2, 3, 4** — each exactly once. It's the same idea as a normal
9×9 sudoku, just gentler for young solvers.

```
+---------+---------+
| 2   3 | 4   1 |
| 1   4 | 2   3 |
+---------+---------+
| 4   1 | 3   2 |
| 3   2 | 1   4 |
+---------+---------+
```

## What's here

| File          | Purpose                                                        |
|---------------|----------------------------------------------------------------|
| `sudoku4.js`  | Core generator (browser global `Sudoku4` + Node module)        |
| `index.html`  | Printable web page — pick difficulty/count, print a worksheet  |
| `cli.js`      | Terminal generator (ASCII puzzles + answer key)                |
| `test.js`     | Validity / uniqueness / determinism checks                     |

## Print a worksheet (web)

Open `index.html` in any browser. Choose the difficulty, how many puzzles, and a
seed, then click **Make puzzles** and **Print**. The 2×2 blocks are drawn with
thick dividers on a dotted background, with an optional answer key page.

## Generate from the terminal

```bash
node cli.js                                  # 6 easy puzzles + answer key
node cli.js --count 12 --difficulty medium   # a dozen medium puzzles
node cli.js --difficulty hard --no-key       # hard puzzles, no answers
node cli.js --seed 7                          # reproducible series
```

Options: `--count N`, `--difficulty easy|medium|hard`, `--seed N`, `--no-key`.

## Difficulty

Difficulty is the number of starting clues (givens). The generator guarantees
every puzzle has **exactly one solution**.

| Level  | Clues given |
|--------|-------------|
| easy   | 9           |
| medium | 7           |
| hard   | 5           |

## Use the generator in code

```js
const Sudoku4 = require('./sudoku4.js');

const series = Sudoku4.generateSeries({ count: 6, difficulty: 'easy', seed: 12345 });
// -> [{ index, difficulty, puzzle: number[16], solution: number[16] }, ...]
// In each array, 0 = blank cell; cells are row-major (index = row*4 + col).
```

The same `Sudoku4` object is available as a global when `sudoku4.js` is loaded
via a `<script>` tag in the browser.

## Run the tests

```bash
node test.js
```

Checks that solutions are valid, clues are consistent, every puzzle has a unique
solution, the right number of clues is given, and series are reproducible by seed.

/*
 * Kids Sudoku 4x4 — core generator
 *
 * A 4x4 grid split into four 2x2 blocks. Every row, every column and every
 * 2x2 block must contain the numbers 1, 2, 3, 4 exactly once — just like a
 * regular 9x9 sudoku uses 1-9.
 *
 * Grid indexing: cells are stored row-major in a flat array of length 16.
 *   index = row * 4 + col       (row, col in 0..3)
 * The 2x2 block of a cell is: blockRow = floor(row/2), blockCol = floor(col/2)
 *
 * Works both as a browser global (window.Sudoku4) and a Node module.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Sudoku4 = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var N = 4; // grid size
  var CELLS = N * N; // 16

  // --- small helpers ---------------------------------------------------------

  function shuffle(arr, rng) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  // Deterministic PRNG (mulberry32) so a seed always yields the same series.
  function makeRng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Is placing `val` at (row,col) legal given current grid?
  function isSafe(grid, row, col, val) {
    for (var i = 0; i < N; i++) {
      if (grid[row * N + i] === val) return false; // row
      if (grid[i * N + col] === val) return false; // column
    }
    var br = row - (row % 2);
    var bc = col - (col % 2);
    for (var r = br; r < br + 2; r++) {
      for (var c = bc; c < bc + 2; c++) {
        if (grid[r * N + c] === val) return false; // 2x2 block
      }
    }
    return true;
  }

  // --- solving / generation --------------------------------------------------

  // Fill an empty grid with a random complete valid solution.
  function fillSolution(grid, rng, pos) {
    pos = pos || 0;
    if (pos === CELLS) return true;
    var row = (pos / N) | 0;
    var col = pos % N;
    var candidates = shuffle([1, 2, 3, 4], rng);
    for (var k = 0; k < candidates.length; k++) {
      var v = candidates[k];
      if (isSafe(grid, row, col, v)) {
        grid[pos] = v;
        if (fillSolution(grid, rng, pos + 1)) return true;
        grid[pos] = 0;
      }
    }
    return false;
  }

  // Count solutions (stops early once it exceeds `limit`).
  function countSolutions(grid, limit, pos, acc) {
    pos = pos || 0;
    acc = acc || 0;
    while (pos < CELLS && grid[pos] !== 0) pos++;
    if (pos === CELLS) return acc + 1;
    var row = (pos / N) | 0;
    var col = pos % N;
    for (var v = 1; v <= N; v++) {
      if (isSafe(grid, row, col, v)) {
        grid[pos] = v;
        acc = countSolutions(grid, limit, pos + 1, acc);
        grid[pos] = 0;
        if (acc >= limit) return acc; // no need to keep counting
      }
    }
    return acc;
  }

  function generateSolution(rng) {
    var grid = new Array(CELLS).fill(0);
    fillSolution(grid, rng);
    return grid;
  }

  // Difficulty -> number of given (pre-filled) cells.
  // 4x4 puzzles need at least 4 givens to have a unique solution.
  var GIVENS = { easy: 9, medium: 7, hard: 5 };

  // Carve a puzzle out of a full solution, keeping the solution unique.
  function makePuzzle(solution, difficulty, rng) {
    var targetGivens = GIVENS[difficulty] || GIVENS.easy;
    var puzzle = solution.slice();
    var order = shuffle(
      Array.from({ length: CELLS }, function (_, i) { return i; }),
      rng
    );

    var givens = CELLS;
    for (var i = 0; i < order.length && givens > targetGivens; i++) {
      var idx = order[i];
      var backup = puzzle[idx];
      puzzle[idx] = 0;
      // If removing this clue creates a second solution, put it back.
      if (countSolutions(puzzle.slice(), 2) !== 1) {
        puzzle[idx] = backup;
      } else {
        givens--;
      }
    }
    return puzzle;
  }

  // Public: build a series of puzzles.
  // opts: { count, difficulty, seed }
  function generateSeries(opts) {
    opts = opts || {};
    var count = opts.count || 6;
    var difficulty = opts.difficulty || 'easy';
    var rng = makeRng(opts.seed != null ? opts.seed : 12345);

    var puzzles = [];
    for (var i = 0; i < count; i++) {
      var solution = generateSolution(rng);
      var puzzle = makePuzzle(solution, difficulty, rng);
      puzzles.push({
        index: i + 1,
        difficulty: difficulty,
        puzzle: puzzle,
        solution: solution
      });
    }
    return puzzles;
  }

  return {
    N: N,
    CELLS: CELLS,
    GIVENS: GIVENS,
    isSafe: isSafe,
    countSolutions: countSolutions,
    generateSolution: generateSolution,
    makePuzzle: makePuzzle,
    generateSeries: generateSeries,
    makeRng: makeRng
  };
});

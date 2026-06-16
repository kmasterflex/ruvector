#!/usr/bin/env node
/* Sanity tests for the 4x4 sudoku generator. */
'use strict';

var Sudoku4 = require('./sudoku4.js');

var failures = 0;
function check(cond, msg) {
  if (!cond) { failures++; console.error('FAIL: ' + msg); }
}

function isComplete(grid) {
  // every row/col/box is a permutation of 1..4
  function ok(vals) {
    return vals.slice().sort().join('') === '1234';
  }
  for (var i = 0; i < 4; i++) {
    var row = [], col = [];
    for (var j = 0; j < 4; j++) { row.push(grid[i * 4 + j]); col.push(grid[j * 4 + i]); }
    if (!ok(row) || !ok(col)) return false;
  }
  for (var br = 0; br < 4; br += 2) {
    for (var bc = 0; bc < 4; bc += 2) {
      var box = [];
      for (var r = br; r < br + 2; r++) for (var c = bc; c < bc + 2; c++) box.push(grid[r * 4 + c]);
      if (!ok(box)) return false;
    }
  }
  return true;
}

['easy', 'medium', 'hard'].forEach(function (diff) {
  var series = Sudoku4.generateSeries({ count: 10, difficulty: diff, seed: 999 });
  series.forEach(function (item) {
    check(isComplete(item.solution), diff + ' #' + item.index + ' solution is valid');

    var givens = item.puzzle.filter(function (v) { return v !== 0; }).length;
    check(givens === Sudoku4.GIVENS[diff], diff + ' #' + item.index + ' has ' +
      Sudoku4.GIVENS[diff] + ' givens (got ' + givens + ')');

    // puzzle clues must match the solution
    var consistent = item.puzzle.every(function (v, i) {
      return v === 0 || v === item.solution[i];
    });
    check(consistent, diff + ' #' + item.index + ' clues match solution');

    // exactly one solution
    var n = Sudoku4.countSolutions(item.puzzle.slice(), 3);
    check(n === 1, diff + ' #' + item.index + ' has a unique solution (got ' + n + ')');
  });
});

// Determinism: same seed -> same series
var a = JSON.stringify(Sudoku4.generateSeries({ count: 3, seed: 42 }));
var b = JSON.stringify(Sudoku4.generateSeries({ count: 3, seed: 42 }));
check(a === b, 'series is deterministic for a given seed');

if (failures === 0) {
  console.log('All tests passed ✔');
  process.exit(0);
} else {
  console.error('\n' + failures + ' test(s) failed.');
  process.exit(1);
}

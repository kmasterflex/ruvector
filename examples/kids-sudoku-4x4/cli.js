#!/usr/bin/env node
/*
 * Kids Sudoku 4x4 — command line generator.
 *
 * Prints a series of 4x4 puzzles (with the 2x2 boxes drawn) to the terminal,
 * followed by an answer key.
 *
 * Usage:
 *   node cli.js [--count N] [--difficulty easy|medium|hard] [--seed N] [--no-key]
 */
'use strict';

var Sudoku4 = require('./sudoku4.js');

function parseArgs(argv) {
  var opts = { count: 6, difficulty: 'easy', seed: 12345, key: true };
  for (var i = 2; i < argv.length; i++) {
    var a = argv[i];
    if (a === '--count') opts.count = parseInt(argv[++i], 10);
    else if (a === '--difficulty') opts.difficulty = argv[++i];
    else if (a === '--seed') opts.seed = parseInt(argv[++i], 10);
    else if (a === '--no-key') opts.key = false;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

// Render one 4x4 grid as ASCII with thick 2x2 box separators.
function renderAscii(values) {
  var cell = function (v) { return v ? ' ' + v + ' ' : ' . '; };
  var lines = [];
  lines.push('+---------+---------+');
  for (var r = 0; r < 4; r++) {
    var row = '|';
    for (var c = 0; c < 4; c++) {
      row += cell(values[r * 4 + c]);
      row += (c % 2 === 1) ? '|' : ' ';
    }
    lines.push(row);
    if (r === 1) lines.push('+---------+---------+');
  }
  lines.push('+---------+---------+');
  return lines.join('\n');
}

function main() {
  var opts = parseArgs(process.argv);
  if (opts.help) {
    console.log('Usage: node cli.js [--count N] [--difficulty easy|medium|hard] [--seed N] [--no-key]');
    return;
  }

  var series = Sudoku4.generateSeries({
    count: opts.count,
    difficulty: opts.difficulty,
    seed: opts.seed
  });

  console.log('Kids Sudoku 4x4  —  ' + opts.difficulty +
    '  (' + series.length + ' puzzles, seed ' + opts.seed + ')');
  console.log('Fill each row, column and 2x2 box with 1-4, once each.\n');

  series.forEach(function (item) {
    console.log('Puzzle ' + item.index);
    console.log(renderAscii(item.puzzle));
    console.log('');
  });

  if (opts.key) {
    console.log('================ ANSWER KEY ================\n');
    series.forEach(function (item) {
      console.log('Puzzle ' + item.index);
      console.log(renderAscii(item.solution));
      console.log('');
    });
  }
}

main();

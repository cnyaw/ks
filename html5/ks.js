//
// ks.js
// KillSudoku implementation.
//
// 2016/7/2 Waync Cheng.
//

//
// Constants.
//

var charw = 12, charh = 12;
var halfcharw = Math.floor(charw/2), halfcharh = Math.floor(charh/2);
var cellw = 3 * charw, cellh = 3 * charh;
var puzzlew = 9 * (1 + cellw), puzzleh = 9 * (1 + cellh);

//
// Puzzle.
//

var p = [];
var candidate = [];
var edit = true;

//
// Share link.
//

var p2 = [];
var sharelink;

//
// Lookup table.
//

var tCOL = [], tROW = [], tBOX = [];

for (var i = 0; i < 81; i++) {
  tCOL[i] = i % 9;
  tROW[i] = Math.floor(i / 9);
  tBOX[i] = 3 * Math.floor(tROW[i] / 3) + Math.floor(tCOL[i] / 3);
}

function COL(i) {
  return tCOL[i];
}

function ROW(i) {
  return tROW[i];
}

function BOX(i) {
  return tBOX[i];
}

//
// Init form.
//

document.getElementById('rstpzl').onclick = resetPuzzle;
document.getElementById('solpzl').onclick = solve;

sharelink = document.getElementById('sharelink');
sharelink.style.display = 'none';
sharelink.style.width = '400px';
sharelink.style.height = '2em';
sharelink.style.border = '1px solid #666';

document.getElementById('share').onclick = function() {

  if (edit) {
    p2 = p.slice(0);                    // Copy current puzzle.
  }

  var link = location.href.split("?")[0].split("#")[0] + '?p=';
  for (var i = 0; i < 81; i++) {
    link = link + p2[i];
  }

  if (!edit) {
    link = link + '&s=1';
  }

  sharelink.style.display = 'block';
  sharelink.value = link;
}

//
// Init edit canvas.
//

var c = document.getElementById('c0');
c.setAttribute('width', puzzlew);
c.setAttribute('height', puzzleh);

c.onmousedown = function(e) {

  sharelink.style.display = 'none';

  if (!edit || 2 == e.button) {
    return;
  }

  var offset = getOffset(e);
  var col = Math.floor(offset.x / (1 + cellw));
  var row = Math.floor(offset.y / (1 + cellh));
  var i = getIdxFromColRow(col, row);

  if (0 != p[i]) {
    p[i] = 0;
    initCandidates();
    renderPuzzle('c0');
    return false;
  }

  var chcol = Math.floor((offset.x - col * (1 + cellw)) / charw);
  var chrow = Math.floor((offset.y - row * (1 + cellh)) / charh);
  var j = chcol + 3 * chrow;
  if (0 != (candidate[i] & n2b(1 + j))) {
    p[i] = 1 + j;
    initCandidates();
    renderPuzzle('c0');
  }
}

//
// Common get mouse event offset x,y.
//

function getOffset(e)
{
  if (e.offsetX) {
    return {x:e.offsetX, y:e.offsetY};
  }

  var el = e.target;
  var offset = {x:0, y:0};

  while (el.offsetParent) {
    offset.x += el.offsetLeft;
    offset.y += el.offsetTop;
    el = el.offsetParent;
  }

  offset.x = e.pageX - offset.x;
  offset.y = e.pageY - offset.y;

  return offset;
}

//
// New game.
//

function resetPuzzle() {

  //
  // Enable edit.
  //

  edit = true;

  sharelink.style.display = 'none';

  //
  // Clear screen.
  //

  var s = document.getElementById('steps');
  if (s) {
    document.body.removeChild(s);
  }

  s = document.createElement('div');
  s.setAttribute('id', 'steps');
  document.body.appendChild(s);

  //
  // Rest puzzle.
  //

  for (var i = 0; i < 81; i++) {
    p[i] = 0;
  }

  initCandidates();

  //
  // Draw puzzle.
  //

  renderPuzzle('c0');
}

//
// Convert number(1~9) to bit mask.
//

function n2b(n) {
  return 1 << (n - 1);
}

//
// Get number of bit 1s.
//

function bc(n) {
  var c = 0;
  for (var i = 0; i < 9; i++) {
    if (n & (1 << i)) {
      c += 1;
    }
  }
  return c;
}

//
// Get number from mask.
//

function b2n(mask) {
  for (var i = 0; i < 9; i++) {
    if (mask & (1 << i)) {
      return 1 + i;
    }
  }
  return 0;
}

//
// Calc the puzzle cell index from col:row.
//

function getIdxFromColRow(col, row) {
  return 9 * row + col;
}

//
// Calc the puzzle cell index from box cell index.
//

function getIdxFromBoxIdx(box, i) {
  var bcol = box % 3;
  var brow = Math.floor(box / 3);
  var ccol = i % 3;
  var crow = Math.floor(i / 3);
  return 9 * (3 * brow + crow) + 3 * bcol + ccol;
}

//
// Is the cell solved?
//

function isSolved(i) {
  return 0 != p[i];
}

//
// Does this candidate bitset have only one naked single?
//

function isSingle(candidate) {
  var c = 0, n;
  for (var i = 0; i < 9; i++) {
    if (candidate & (1 << i)) {
      c += 1;
      n = i + 1;
    }
  }
  if (1 == c) {
    return n;
  } else {
    return 0;
  }
}

//
// Get the candidate list of a box.
//

function getCandidateListOfBox(box, c, idx) {
  for (var cell = 0; cell < 9; cell++) {
    var i = getIdxFromBoxIdx(box, cell);
    c[cell] = isSolved(i) ? 0 : candidate[i];
    idx[cell] = i;
  }
}

//
// Get the candidate list of a col.
//

function getCandidateListOfCol(col, c, idx) {
  for (var row = 0; row < 9; row++) {
    var i = getIdxFromColRow(col, row);
    c[row] = isSolved(i) ? 0 : candidate[i];
    idx[row] = i;
  }
}

//
// Get the candidate list of a row.
//

function getCandidateListOfRow(row, c, idx) {
  for (var col = 0; col < 9; col++) {
    var i = getIdxFromColRow(col, row);
    c[col] = isSolved(i) ? 0 : candidate[i];
    idx[col] = i;
  }
}

//
// Count how many n exist in the candidates list.
//

function getCandidateCountOfList(candidate, n, cell) {
  var c = 0;
  for (var i = 0; i < 9; i++) {
    if (candidate[i] & n2b(n)) {
      cell[c++] = i;
    }
  }
  return c;
}

//
// Init candidate bitset of each puzzle cell.
//

function initCandidates() {

  for (var row = 0; row < 9; row++) {
    for (var col = 0; col < 9; col++) {
      var i = getIdxFromColRow(col, row);
      if (!isSolved(i)) {
        candidate[i] = 0x1ff;
      } else {
        candidate[i] = n2b(p[i]);
      }
    }
  }

  //
  // Update candidates of puzzle cells by current state.
  //

  updateCandidates();
}

function updateCandidates() {

  //
  // Update candidates in a box.
  //

  for (var box = 0; box < 9; box++) {
    for (var cell = 0; cell < 9; cell++) {

      var index = getIdxFromBoxIdx(box, cell);
      if (!isSolved(index)) {
        continue;
      }

      //
      // Removed this solved number from from other cells candidate in this
      // box.
      //

      var n = p[index];
      for (var i = 0; i < 9; i++) {
        if (i != cell) {
          candidate[getIdxFromBoxIdx(box, i)] &= ~n2b(n);
        }
      }
    }
  }

  //
  // Update candidates in col.
  //

  for (var col = 0; col < 9; col++) {
    for (var row = 0; row < 9; row++) {

      var index = getIdxFromColRow(col, row);
      if (!isSolved(index)) {
        continue;
      }

      //
      // Removed this solved number from from other cells candidate in this
      // col.
      //

      var n = p[index];
      for (var i = 0; i < 9; i++) {
        if (i != row) {
          candidate[getIdxFromColRow(col, i)] &= ~n2b(n);
        }
      }
    }
  }

  //
  // Update candidates in row.
  //

  for (var row = 0; row < 9; row++) {
    for (var col = 0; col < 9; col++) {

      var index = getIdxFromColRow(col, row);
      if (!isSolved(index)) {
        continue;
      }

      //
      // Removed this solved number from from other cells candidate in this
      // row.
      //

      var n = p[index];
      for (var i = 0; i < 9; i++) {
        if (i != col) {
          candidate[getIdxFromColRow(i, row)] &= ~n2b(n);
        }
      }
    }
  }
}

//
// Render puzzle.
//

var ht1 = [];                           // High light pattern.
var ht2 = [];                           // High light helper cell.
var ht3 = [];                           // High light reduction cell.
var ht4 = [];                           // High light links.
var htMask = [];

function fillCell(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, cellw + 1, cellh + 1);
  ctx.fillStyle = 'Black';
}

function renderPuzzle(name) {

  var c = document.getElementById(name);
  var ctx = c.getContext('2d');
  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = 'Ivory';
  ctx.fillRect(0, 0, puzzlew, puzzleh);
  ctx.fillStyle = 'Black';

  //
  // Draw cells.
  //

  for (var i = 0; i < 81; i++) {

    var x = COL(i) * (1 + cellw), y = ROW(i) * (1 + cellh);

    if (-1 != ht1.indexOf(i)) {
      fillCell(ctx, x, y, '#B6FF00');
    } else if (-1 != ht2.indexOf(i)) {
      fillCell(ctx, x, y, '#F8FF90');
    }

    x += Math.floor(charw / 2);
    y += Math.floor(charh / 2) + 1;

    if (0 != p[i]) {

      //
      // Draw fixed cells.
      //

      ctx.font = '30px Arial';
      ctx.fillText(p[i], x + charw, y + charh);

    } else {

      //
      // Draw candidates.
      //

      ctx.font = charh + 'px sans-serif';
      for (var j = 0; j < 9; j++) {
        if (candidate[i] & n2b(1 + j)) {
          ctx.fillText(1 + j, x + (j % 3) * charw, y + Math.floor(j / 3) * charh);
        }
      }

      var ht = ht3.indexOf(i);
      if (-1 != ht && 0 != htMask[ht]) {
        ctx.fillStyle = 'Red';
        for (var j = 0; j < 9; j++) {
          if (htMask[ht] & n2b(1 + j)) {
            var cx = x + (j % 3) * charw, cy = y + Math.floor(j / 3) * charh;
            ctx.fillText(1 + j, cx, cy);
            ctx.moveTo(cx - halfcharw, cy - halfcharh);
            ctx.lineTo(cx + halfcharw, cy + halfcharh);
            ctx.stroke();
          }
        }
        ctx.fillStyle = 'Black';
      }
    }
  }

  //
  // Draw grids.
  //

  for (var i = 1; i < 9; i++) {
    if (0 == (i % 3)) {
      ctx.strokeStyle = 'Black';
    } else {
      ctx.strokeStyle = 'LightGray';
    }
    var x = i * (1 + cellw), y = i * (1 + cellh);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, puzzleh);
    ctx.moveTo(0, y);
    ctx.lineTo(puzzlew, y);
    ctx.stroke();
  }

  //
  // Draw links.
  //

  ctx.strokeStyle = 'Red';
  for (var i = 0; i < ht4.length; i += 3) {
    var a = ht4[i], b = ht4[i + 1];
    var n = ht4[i + 2] - 1;
    var xa = COL(a) * (1 + cellw), ya = ROW(a) * (1 + cellh);
    var cxa = xa + (n % 3) * charw, cya = ya + Math.floor(n / 3) * charh;
    var xb = COL(b) * (1 + cellw), yb = ROW(b) * (1 + cellh);
    var cxb = xb + (n % 3) * charw, cyb = yb + Math.floor(n / 3) * charh;
    ctx.beginPath();
    ctx.rect(cxa, cya, charw, charh);
    ctx.rect(cxb, cyb, charw, charh);
    ctx.moveTo(cxa + halfcharw, cya + halfcharh);
    ctx.lineTo(cxb + halfcharw, cyb + halfcharh);
    ctx.stroke();
  }
  ctx.strokeStyle = 'Black';

  //
  // Reset high lights.
  //

  ht1 = [];
  ht2 = [];
  ht3 = [];
  ht4 = [];
  htMask = [];
}

//
// Add solve step.
//

function addStep(round) {

  var name = 'c' + round;

  //
  // Create canvas.
  //

  var steps = document.getElementById('steps');

  var h = document.createElement('h1');
  h.appendChild(document.createTextNode(round + ', ' + msg));
  steps.appendChild(h);
  var c = document.createElement('canvas');
  c.setAttribute('id', name);
  c.setAttribute('width', puzzlew);
  c.setAttribute('height', puzzleh);
  steps.appendChild(c);

  //
  // Draw puzzle.
  //

  renderPuzzle(name);
}

//
// Check is there any state can be changed by any one of checking pattern.
//

var pattern = [];
var msg;

function solve() {
  sharelink.style.display = 'none';
  if (!edit) {
    return;
  }
  p2 = p.slice(0);                      // Backup original puzzle.
  var round = 1;
  while (true) {
    var over = true;
    for (var i = 0; i < pattern.length; i++) {
      if (pattern[i](round)) {
        updateCandidates();
        addStep(round++);
        over = false;
        edit = false;
        break;
      }
    }
    if (over) {
      break;
    }
  }
}

pattern.push(p_findSingle);
pattern.push(p_findClaiming);
pattern.push(p_findPointing);
pattern.push(p_findSubset);
pattern.push(p_findXWings);
pattern.push(p_findXyWings);
pattern.push(p_findWWings);
pattern.push(p_findXyzWings);
pattern.push(p_findXChains);
pattern.push(p_findXyChains);

//
// Find single candidate in a candidate list.
//

function findSingle(c, idx, round) {

  var cell = [];

  for (var n = 1; n <= 9; n++) {

    if (1 != getCandidateCountOfList(c, n, cell)) {
      continue;
    }

    var i = idx[cell[0]];

    p[i] = n;
    candidate[i] = n2b(n);

    ht1.push(i);

    return true;
  }

  return false;
}

function p_findSingle(round) {

  //
  // Find naked single.
  //

  for (var i = 0; i < 9 * 9; i++) {

    if (isSolved(i)) {
      continue;
    }

    var n = isSingle(candidate[i]);
    if (0 == n) {
      continue;
    }

    p[i] = n;
    candidate[i] = n2b(n);

    ht1.push(i);

    msg = 'Naked Single';
    return true;
  }

  //
  // Find hidden single.
  //

  msg = 'Hidden Single';

  var c = [], idx = [];
  for (var i = 0; i < 9; i++) {

    getCandidateListOfBox(i, c, idx);
    if (findSingle(c, idx, round)) {
      ht2 = idx;
      return true;
    }

    getCandidateListOfCol(i, c, idx);
    if (findSingle(c, idx, round)) {
      ht2 = idx;
      return true;
    }

    getCandidateListOfRow(i, c, idx);
    if (findSingle(c, idx, round)) {
      ht2 = idx;
      return true;
    }
  }

  return false;
}

function findClaiming(c, idx, round) {

  //
  // Find claiming pattern in a col or a row.
  //

  var cell = [];

  for (var n = 1; n <= 9; n++) {

    //
    // 1, there are only 2 or 3 candidates found, so it is possible in the
    // same box.
    //

    var count = getCandidateCountOfList(c, n, cell);
    if (2 != count && 3 != count) {
      continue;
    }

    if (2 == count) {
      cell[2] = cell[0];
    }

    //
    // 2, checks are theses candidates in the same box.
    //

    if (BOX(idx[cell[0]]) != BOX(idx[cell[1]]) ||
        BOX(idx[cell[0]]) != BOX(idx[cell[2]])) {
      continue;
    }

    //
    // Pattern found, remove extra candidates.
    //

    var c2 = [], idx2 = [];
    getCandidateListOfBox(BOX(idx[cell[0]]), c2, idx2);

    var changed = false;

    var mask = n2b(n);
    for (var i = 0; i < 9; i++) {

      var index = idx2[i];
      if (isSolved(index)) {
        continue;
      }

      var again = false;
      for (var j = 0; j < count; j++) {
        if (index == idx[cell[j]]) {
          again = true;
          break;
        }
      }
      if (again) {
        continue;
      }

      if (0 == (candidate[index] & mask)) {
        continue;
      }

      candidate[index] &= ~mask;
      changed = true;

      ht3.push(index);
      htMask.push(mask);
    }

    if (!changed) {
      continue;
    }

    //
    // State changed.
    //

    ht2 = idx;

    for (var i = 0; i < count; i++) {
      ht1.push(idx[cell[i]])
    }

    msg = 'Claiming';
    return true;
  }

  return false;
}

function p_findClaiming(round) {

  //
  // Find claiming pattern.
  //

  var c = [], idx = [];

  for (var i = 0; i < 9; i++) {

    getCandidateListOfCol(i, c, idx);
    if (findClaiming(c, idx, round)) {
      return true;
    }

    getCandidateListOfRow(i, c, idx);
    if (findClaiming(c, idx, round)) {
      return true;
    }
  }

  return false;
}

function p_findPointing(round) {

  //
  // Find pointing pattern in a box.
  //

  var c = [], idx = [], cell = [];

  for (var box = 0; box < 9; box++) {

    getCandidateListOfBox(box, c, idx);

    for (var n = 1; n <= 9; n++) {

      //
      // 1, there are must only 2 or 3 candidates in this box.
      //

      var count = getCandidateCountOfList(c, n, cell);
      if (2 != count && 3 != count) {
        continue;
      }

      //
      // 2, check are these candidates in the same col or row.
      //

      var col = [], row = [];
      for (var i = 0; i < count; i++) {
        var index = idx[cell[i]];
        col[i] = COL(index) % 3;
        row[i] = ROW(index) % 3;
      }

      if (2 == count) {
        col[2] = col[0];
        row[2] = row[0];
      }

      var c2 = [], idx2 = [];
      if (col[0] == col[1] && col[0] == col[2]) {
        getCandidateListOfCol(COL(idx[cell[0]]), c2, idx2);
      } else if (row[0] == row[1] && row[0] == row[2]) {
        getCandidateListOfRow(ROW(idx[cell[0]]), c2, idx2);
      } else {
        continue;
      }

      //
      // Pattern found, remove extra candidates.
      //

      var changed = false;

      var mask = n2b(n);
      for (var i = 0; i < 9; i++) {

        var index = idx2[i];
        if (isSolved(index)) {
          continue;
        }

        var again = false;
        for (var j = 0; j < count; j++) {
          if (index == idx[cell[j]]) {
            again = true;
          }
        }
        if (again) {
          continue;
        }

        if (0 == (candidate[index] & mask)) {
          continue;
        }

        candidate[index] &= ~mask;
        changed = true;

        ht2 = idx;
        ht3.push(index);
        htMask.push(mask);
      }

      if (!changed) {
        continue;
      }

      //
      // State changed.
      //

      for (var i = 0; i < count; i++) {
        ht1.push(idx[cell[i]]);
      }

      msg = 'Pointing';
      return true;
    }
  }

  return false;
}

function findNakedSet(c, idx, n, round) {

  //
  // Find naked subset.
  //

  var pos = [];

  for (var i = 0; i < 0x1ff; i++) {

    //
    // Use bit count technique to generate bitset pattern.
    //

    if (bc(i) != n) {
      continue;
    }

    //
    // Find is there exact n cells in the list that each cell contains
    // partial or all bits of generated bitset.
    //

    var i2 = 0;
    for (var j = 0; j < 9; j++) {
      if (c[j] && 0 == (c[j] & ~i)) {
        pos[i2++] = idx[j];
      }
    }

    if (i2 != n) {
      continue;
    }

    //
    // Pattern found, remove extra candidates.
    //

    var changed = false;

    for (var j = 0; j < 9; j++) {

      var index = idx[j];
      if (isSolved(index)) {
        continue;
      }

      var again = false;
      for (var k = 0; k < n; k++) {
        if (index == pos[k]) {
          again = true;
          break;
        }
      }
      if (again) {
        continue;
      }

      if (0 == (candidate[idx[j]] & i)) {
        continue;
      }

      htMask.push(candidate[idx[j]] & i);
      ht3.push(idx[j]);

      candidate[idx[j]] &= ~i;
      changed = true;
    }

    if (!changed) {
      continue;
    }

    //
    // State changed.
    //

    for (var j = 0; j < n; j++) {
      ht1.push(pos[j]);
    }

    ht2 = idx;

    msg = 'Naked Subset';
    return true;
  }

  return false;
}

function findHiddenSet(c, idx, n, round) {

  //
  // Gather the distributions of numbers 1~9.
  //

  var count = [];

  var cell = [];
  for (var i = 0; i < 9; i++) {
    cell[i] = [];
  }

  for (var i = 0; i < 9; i++) {
    count[i] = getCandidateCountOfList(c, 1 + i, cell[i]);
  }

  //
  // 1, check how many numbers fit in the range n. The count must equal to n,
  // and this will be the potential subset.
  //

  var nset = 0;
  var set = [];

  for (var i = 0; i < 9; i++) {
    if (0 != count[i] && count[i] <= n) {
      set[nset++] = i;
    }
  }

  if (nset != n) {
    return false;
  }

  //
  // 2, find how many cells occupied by these potential subset numbers.
  // The count should exact equal to the subset length(n).
  //

  var npos = 0;
  var pos = [];

  for (var i = 0; i < nset; i++) {
    for (var j = 0; j < count[set[i]]; j++) {
      if (0 != npos) {
        var found = false;
        for (var k = 0; k < npos; k++) {
          if (pos[k] == cell[set[i]][j]) {
            found = true;
            break;
          }
        }
        if (!found) {
          pos[npos++] = cell[set[i]][j];
        }
      } else {
        pos[npos++] = cell[set[i]][j];
      }
    }
  }

  if (npos != n) {
    return false;
  }

  //
  // Pattern found, remove extra candidates.
  //

  var change = false;

  for (var i = 0; i < 9; i++) {

    var index = idx[i];
    if (isSolved(index)) {
      continue;
    }

    for (var j = 0; j < npos; j++) {
      if (i == pos[j]) {

        var mask = 0;
        for (var k = 0; k < nset; k++) {
          mask |= n2b(1 + set[k]);
        }

        var prev = candidate[index];
        candidate[index] &= mask;
        if (prev != candidate[index]) {
          change = true;
          htMask.push(prev ^ mask);
        }

        break;
      }
    }
  }

  if (!change) {
    return false;
  }

  //
  // State changed.
  //

  for (var i = 0; i < n; i++) {
    ht1.push(idx[pos[i]]);
  }

  ht2 = idx;
  ht3 = ht1;

  msg = 'Hidden Subset';
  return true;
}

function p_findSubset(round) {

  //
  // Find subset pattern.
  //

  var c = [], idx = [];

  for (var n = 2; n <= 4; n++) {
    for (var i = 0; i < 9; i++) {

      getCandidateListOfBox(i, c, idx);
      if (findNakedSet(c, idx, n, round)) {
        return true;
      }

      getCandidateListOfCol(i, c, idx);
      if (findNakedSet(c, idx, n, round)) {
        return true;
      }

      getCandidateListOfRow(i, c, idx);
      if (findNakedSet(c, idx, n, round)) {
        return true;
      }
    }
  }

  for (var n = 2; n <= 4; n++) {
    for (var i = 0; i < 9; i++) {

      getCandidateListOfBox(i, c, idx);
      if (findHiddenSet(c, idx, n, round)) {
        return true;
      }

      getCandidateListOfCol(i, c, idx);
      if (findHiddenSet(c, idx, n, round)) {
        return true;
      }

      getCandidateListOfRow(i, c, idx);
      if (findHiddenSet(c, idx, n, round)) {
        return true;
      }
    }
  }

  return false;
}

function findXWings(round, isRow) {

  //
  // Find X Wing pattern.
  //

  var c = [], idx = [], cell = [];
  var c2 = [], idx2 = [], cell2 = [];
  var c34 = [], idx34 = [];
  for (var i = 0; i < 2; i++) {
    c34[i] = [];
    idx34[i] = [];
  }

  for (var n = 1; n <= 9; n++) {

    for (var i = 0; i < 9; i++) {

      //
      // X wings only contain 2 candidates.
      //

      if (isRow) {
        getCandidateListOfRow(i, c, idx);
      } else {
        getCandidateListOfCol(i, c, idx);
      }

      if (2 != getCandidateCountOfList(c, n, cell)) {
        continue;
      }

      for (var j = 1 + i; j < 9; j++) {

        //
        // X wings only contain 2 candidates.
        //

        if (isRow) {
          getCandidateListOfRow(j, c2, idx2);
        } else {
          getCandidateListOfCol(j, c2, idx2);
        }

        if (2 != getCandidateCountOfList(c2, n, cell2)) {
          continue;
        }

        //
        // 4 cells should in the same row or col.
        //

        if (cell[0] != cell2[0] || cell[1] != cell2[1]) {
          continue;
        }

        var changed = false;

        if (isRow) {
          getCandidateListOfCol(cell[0], c34[0], idx34[0]);
          getCandidateListOfCol(cell[1], c34[1], idx34[1]);
        } else {
          getCandidateListOfRow(cell[0], c34[0], idx34[0]);
          getCandidateListOfRow(cell[1], c34[1], idx34[1]);
        }

        for (var l = 0; l < 2; l++) {
          for (var k = 0; k < 9; k++) {

            if (i == k || j == k || isSolved(idx34[l][k])) {
              continue;
            }

            if (c34[l][k] & n2b(n)) {
              changed = true;
              candidate[idx34[l][k]] &= ~n2b(n);
              ht3.push(idx34[l][k]);
              htMask.push(n2b(n));
            }
          }
        }

        if (!changed) {
          continue;
        }

        //
        // State changed.
        //

        ht1.push(idx[cell[0]]);
        ht1.push(idx[cell[1]]);
        ht1.push(idx2[cell[0]]);
        ht1.push(idx2[cell[1]]);

        ht2 = idx.concat(idx2).concat(idx34[0]).concat(idx34[1]);

        ht4.push(idx[cell[0]]);
        ht4.push(idx2[cell[1]]);
        ht4.push(n);
        ht4.push(idx[cell[1]]);
        ht4.push(idx2[cell[0]]);
        ht4.push(n);

        msg = 'X-Wings';
        return true;
      }
    }
  }

  return false;
}

function p_findXWings(round) {

  //
  // Find X Wing pattern.
  //

  return findXWings(round, true) || findXWings(round, false);
}

function findXyWings1(round) {

  //
  // Find XY Wings type 1. 3 cells in 3 boxs.
  //

  for (var i = 0; i < 81; i++) {

    //
    // Each wing only contains 2 candidates.
    //

    if (isSolved(i) || 2 != bc(candidate[i])) {
      continue;
    }

    var box = BOX(i);
    var c = [], idx = [], c2 = [], idx2 = [];
    var w = [];

    getCandidateListOfRow(ROW(i), c, idx);

    for (var j = 0; j < 9; j++) {

      if (idx[j] == i || isSolved(idx[j]) ||
          2 != bc(c[j]) || 0 == (c[j] & candidate[i]) ||
          BOX(idx[j]) == box) {
        continue;
      }

      w[0] = idx[j];

      getCandidateListOfCol(COL(i), c2, idx2);

      for (var k = 0; k < 9; k++) {

        if (idx2[k] == i || isSolved(idx2[k]) ||
            2 != bc(c2[k]) || candidate[w[0]] != (c2[k] ^ candidate[i]) ||
            BOX(idx2[k]) == box) {
          continue;
        }

        w[1] = idx2[k];

        if (BOX(w[0]) == BOX(w[1])) {
          continue;
        }

        var i3 = getIdxFromColRow(COL(w[0]), ROW(w[1]));
        if (isSolved(i3)) {
          continue;
        }

        var mask = candidate[w[0]] & candidate[w[1]];
        if (0 == (candidate[i3] & mask)) {
          continue;
        }

        //
        // State changed.
        //

        candidate[i3] &= ~mask;

        ht1.push(i);
        ht1.push(w[0]);
        ht1.push(w[1]);

        ht3.push(i3);
        htMask.push(mask);

        msg = 'XY-Wings';
        return true;
      }
    }
  }

  return false;
}

function findXyWings2(round) {

  //
  // Find XY Wings type 2. 2 cells in one box.
  //

  var c = [], idx = [], c2 = [], idx2 = [];

  for (var box = 0; box < 9; box++) {

    getCandidateListOfBox(box, c, idx);

    for (var cell = 0; cell < 9; cell++) {

      //
      // Each wing only contains 2 candidates.
      //

      if (isSolved(idx[cell]) || 2 != bc(c[cell])) {
        continue;
      }

      for (var cell2 = 0; cell2 < 9; cell2++) {

        if (cell2 == cell || isSolved(idx[cell2]) || 2 != bc(c[cell2])) {
          continue;
        }

        if (0 == (c[cell] & c[cell2])) {
          continue;
        }

        //
        // Find 3rd cell.
        //

        var col = COL(idx[cell]), row = ROW(idx[cell]);
        var col2 = COL(idx[cell2]), row2 = ROW(idx[cell2]);

        var x = c[cell] ^ c[cell2];
        if (0 == x) {
          continue;
        }

        var i3, mask;

        var changed = false;

        if (col != col2) {

          getCandidateListOfCol(col, c2, idx2);

          for (var i = 0; i < 9; i++) {

            if (isSolved(idx2[i]) || 2 != bc(c2[i]) ||
                c2[i] != x || BOX(idx2[i]) == box) {
              continue;
            }

            //
            // 3rd cell found.
            //

            i3 = getIdxFromColRow(col, Math.floor(idx2[i] / 9));

            mask = c2[i] & c[cell2];
            for (var j = 0; j < 9; j++) {
              if (!isSolved(idx2[j]) && Math.floor(idx2[j] / 9) != row &&
                   0 != (c2[j] & mask) && BOX(idx2[j]) == box) {
                  changed = true;
                  candidate[idx2[j]] &= ~mask;
                  ht3.push(idx2[j]);
                  htMask.push(mask);
                }
            }

            getCandidateListOfCol(col2, c2, idx2);

            for (var j = 0; j < 9; j++) {
              if (!isSolved(idx2[j]) && 0 != (c2[j] & mask) &&
                   BOX(idx2[j]) == BOX(i3)) {
                  changed = true;
                  candidate[idx2[j]] &= ~mask;
                  ht3.push(idx2[j]);
                  htMask.push(mask);
                }
            }

            break;
          }
        }

        if (!changed && row != row2) {

          getCandidateListOfRow(row, c2, idx2);

          for (var i = 0; i < 9; i++) {

            if (isSolved(idx2[i]) || 2 != bc(c2[i]) ||
                c2[i] != x || BOX(idx2[i]) == box) {
              continue;
            }

            //
            // 3rd cell found.
            //

            i3 = getIdxFromColRow(COL(idx2[i]), row);

            mask = c2[i] & c[cell2];
            for (var j = 0; j < 9; j++) {
              if (!isSolved(idx2[j]) && COL(idx2[j]) != col &&
                   0 != (c2[j] & mask) && BOX(idx2[j]) == box) {
                  changed = true;
                  candidate[idx2[j]] &= ~mask;
                  ht3.push(idx2[j]);
                  htMask.push(mask);
                }
            }

            getCandidateListOfRow(row2, c2, idx2);

            for (var j = 0; j < 9; j++) {
              if (!isSolved(idx2[j]) && 0 != (c2[j] & mask) &&
                   BOX(idx2[j]) == BOX(i3)) {
                  changed = true;
                  candidate[idx2[j]] &= ~mask;
                  ht3.push(idx2[j]);
                  htMask.push(mask);
                }
            }

            break;
          }
        }

        if (!changed) {
          continue;
        }

        //
        // State changed.
        //

        ht1.push(idx[cell]);
        ht1.push(idx[cell2]);
        ht1.push(i3);

        msg = 'XY-Wings';
        return true;
      }
    }
  }

  return false;
}

function p_findXyWings(round) {

  //
  // Find XY Wings pattern.
  //

  return findXyWings1(round) || findXyWings2(round);
}

function isChanged(a, b, mask)
{
  var changed = false;
  var c = [], idx = [];

  if (COL(a) == COL(b)) {
    getCandidateListOfCol(COL(a), c, idx);
    for (var k = 0; k < 9; k++) {
      if (idx[k] != a && idx[k] != b && !isSolved(idx[k]) && c[k] & mask) {
        changed = true;
        candidate[idx[k]] &= ~mask;
        ht3.push(idx[k]);
        htMask.push(mask);
      }
    }
  } else if (ROW(a) == ROW(b)) {
    getCandidateListOfRow(ROW(a), c, idx);
    for (var k = 0; k < 9; k++) {
      if (idx[k] != a && idx[k] != b && !isSolved(idx[k]) && c[k] & mask) {
        changed = true;
        candidate[idx[k]] &= ~mask;
        ht3.push(idx[k]);
        htMask.push(mask);
      }
    }
  } else {
    getCandidateListOfBox(BOX(a), c, idx);
    for (var k = 0; k < 9; k++) {
      if (idx[k] != a && !isSolved(idx[k]) && c[k] & mask &&
          (ROW(b) == ROW(idx[k]) || COL(b) == COL(idx[k]))) {
        changed = true;
        candidate[idx[k]] &= ~mask;
        ht3.push(idx[k]);
        htMask.push(mask);
      }
    }

    getCandidateListOfBox(BOX(b), c, idx);
    for (var k = 0; k < 9; k++) {
      if (idx[k] != b && !isSolved(idx[k]) && c[k] & mask &&
          (ROW(a) == ROW(idx[k]) || COL(a) == COL(idx[k]))) {
        changed = true;
        candidate[idx[k]] &= ~mask;
        ht3.push(idx[k]);
        htMask.push(mask);
      }
    }

    var ix1 = getIdxFromColRow(COL(a), ROW(b));
    if (!isSolved(ix1) && candidate[ix1] & mask) {
      changed = true;
      candidate[ix1] &= ~mask;
      ht3.push(ix1);
      htMask.push(mask);
    }

    var ix2 = getIdxFromColRow(COL(b), ROW(a));
    if (!isSolved(ix2) && candidate[ix2] & mask) {
      changed = true;
      candidate[ix2] &= ~mask;
      ht3.push(ix2);
      htMask.push(mask);
    }
  }

  return changed;
}

function findWWings(c, idx, i1, i2, round) {

  var r1 = ROW(i1), c1 = COL(i1);
  var r2 = ROW(i2), c2 = COL(i2);

  if (r1 == r2 || c1 == c2) {
    return false;
  }

  var cell = [];
  for (var i = 0; i < 9; i++) {

    //
    // This number is one of the wing.
    //

    if (0 == (n2b(1 + i) & candidate[i1])) {
      continue;
    }

    //
    // There are only 2 candidates in this set that makes a strong chain.
    //

    if (2 != getCandidateCountOfList(c, 1 + i, cell)) {
      continue;
    }

    //
    // The chain is not i1 or i2.
    //

    if (idx[cell[0]] == i1 || idx[cell[0]] == i2 ||
        idx[cell[1]] == i1 || idx[cell[1]] == i2) {
      continue;
    }

    //
    // Make sure the chain links to i1 and i2.
    //

    var lr1 = ROW(idx[cell[0]]), lc1 = COL(idx[cell[0]]);
    var lr2 = ROW(idx[cell[1]]), lc2 = COL(idx[cell[1]]);

    if ((r1 != lr1 || r2 != lr2) && (c1 != lc1 || c2 != lc2) &&
        (r1 != lr2 || r2 != lr1) && (c1 != lc2 || c2 != lc1)) {
      continue;
    }

    //
    // Check changes.
    //

    if (!isChanged(i1, i2, candidate[i1] & ~n2b(1 + i))) {
      continue;
    }

    ht1.push(i1);
    ht1.push(i2);
    ht2.push(getIdxFromColRow(lc1, lr1));
    ht2.push(getIdxFromColRow(lc2, lr2));

    msg = 'W-Wings';
    return true;
  }

  return false;
}

function p_findWWings(round) {

  //
  // Find W Wings pattern.
  //

  for (var i = 0; i < 81; i++) {

    //
    // 1st, find a cell that contains only 2 candidates.
    //

    if (isSolved(i) || 2 != bc(candidate[i])) {
      continue;
    }

    var box1 = BOX(i);

    //
    // 2nd, find another cell that contains 2 same candidates with 1st cell.
    //

    for (var j = i + 1; j < 81; j++) {

      if (isSolved(j) || candidate[i] != candidate[j]) {
        continue;
      }

      var box2 = BOX(j);

      if (box1 == box2) {
        continue;
      }

      //
      // 3rd, for each row/col/box, find a single chain to link these 2 cells.
      //

      var c = [], idx = [];

      for (var k = 0; k < 9; k++) {

        getCandidateListOfCol(k, c, idx);
        if (findWWings(c, idx, i, j, round)) {
          return true;
        }

        getCandidateListOfRow(k, c, idx);
        if (findWWings(c, idx, i, j, round)) {
          return true;
        }

        getCandidateListOfBox(k, c, idx);
        if (findWWings(c, idx, i, j, round)) {
          return true;
        }
      }
    }
  }

  return false;
}

function findXyzWings(c, idx, box, isRow, rowcol, i1, i2, c1, c2, mask) {

  var x = c1 ^ c2;
  var changed = false;

  for (var i = 0; i < 9; i++) {

    if (isSolved(idx[i])) {
      continue;
    }

    //
    // 3rd cell must has 2 candidates and in different box to c1/c2.
    //

    if (2 != bc(c[i]) || 0 == (c[i] & x) || 0 == (c1 & c[i]) ||
        2 != bc(c1 & c[i]) || BOX(idx[i]) == box) {
      continue;
    }

    //
    // 3rd cell found.
    //

    var i3 = idx[i];

    mask = c[i] & c2;
    for (var j = 0; j < 9; j++) {
      if (!isSolved(idx[j]) && i1 != idx[j] && i2 != idx[j] &&
         ((isRow && ROW(idx[j]) != rowcol) || (COL(idx[j]) != rowcol)) &&
           0 != (c[j] & mask) && BOX(idx[j]) == box) {
          changed = true;
          candidate[idx[j]] &= ~mask;
          ht3.push(idx[j]);
          htMask.push(mask);
        }
    }

    break;
  }

  if (changed) {
    return i3;
  } else {
    return -1;
  }
}

function p_findXyzWings(round) {

  //
  // Find XYZ Wings pattern.
  //

  var c = [], idx = [], c2 = [], idx2 = [];

  for (var box = 0; box < 9; box++) {

    getCandidateListOfBox(box, c, idx);

    for (var cell = 0; cell < 9; cell++) {

      //
      // Each wing only contains 2 candidates.
      //

      if (isSolved(idx[cell]) || 3 != bc(c[cell])) {
        continue;
      }

      for (var cell2 = 0; cell2 < 9; cell2++) {

        if (cell2 == cell || isSolved(idx[cell2]) || 2 != bc(c[cell2])) {
          continue;
        }

        if (0 == (c[cell] & c[cell2]) || 2 != bc(c[cell] & c[cell2])) {
          continue;
        }

        //
        // Find 3rd cell.
        //

        var col = COL(idx[cell]), row = ROW(idx[cell]);
        var col2 = COL(idx[cell2]), row2 = ROW(idx[cell2]);

        if (0 == (c[cell] ^ c[cell2])) { // Make sure c1&c2 have common candidates.
          continue;
        }

        var i3, mask;

        if (col != col2) {
          getCandidateListOfCol(col, c2, idx2);
          i3 = findXyzWings(c2, idx2, box, true, row, idx[cell], idx[cell2], c[cell], c[cell2], mask);
        }

        if (row != row2) {
          getCandidateListOfRow(row, c2, idx2);
          i3 = findXyzWings(c2, idx2, box, false, col, idx[cell], idx[cell2], c[cell], c[cell2], mask);
        }

        if (-1 == i3) {
          continue;
        }

        //
        // State changed.
        //

        ht1.push(idx[cell]);
        ht1.push(idx[cell2]);
        ht1.push(i3);

        msg = 'XYZ-Wings';
        return true;
      }
    }
  }

  return false;
}

function hasLink(a, b) {
  return BOX(a) == BOX(b) || COL(a) == COL(b) || ROW(a) == ROW(b);
}

function p_findXChains(round) {

  //
  // Find X chains pattern.
  //

  var c = [], idx = [], cell = [];
  var cx, x = [];

  for (var n = 1; n <= 9; n++) {

    cx = 0;

    //
    // Collect strong links.
    //

    for (var row = 0; row < 9; row++) {
      getCandidateListOfRow(row, c, idx);
      if (2 == getCandidateCountOfList(c, n, cell)) {
        var i1 = idx[cell[0]], i2 = idx[cell[1]];
        if (BOX(i1) != BOX(i2)) {
          x[cx * 2 + 0] = i1;
          x[cx * 2 + 1] = i2;
          cx += 1;
        }
      }
    }

    for (var col = 0; col < 9; col++) {
      getCandidateListOfCol(col, c, idx);
      if (2 == getCandidateCountOfList(c, n, cell)) {
        var i1 = idx[cell[0]], i2 = idx[cell[1]];
        if (BOX(i1) != BOX(i2)) {
          x[cx * 2 + 0] = i1;
          x[cx * 2 + 1] = i2;
          cx += 1;
        }
      }
    }

    for (var box = 0; box < 9; box++) {
      getCandidateListOfBox(box, c, idx);
      if (2 == getCandidateCountOfList(c, n, cell)) {
        x[cx * 2 + 0] = idx[cell[0]];
        x[cx * 2 + 1] = idx[cell[1]];
        cx += 1;
      }
    }

    if (2 > cx) {
      continue;
    }

    //
    // Find strong link chain.
    //

    for (var i = 0; i < cx; i++) {

      var len = 0;                      // Length of the chain.
      var chain = [];

      var linked = []                   // Flags for attached links.
      for (var j = 0; j < 81; j++) {
        linked[j] = false;
      }

      var a = x[i * 2 + 0];             // Start-end points of the chain.
      var b = x[i * 2 + 1];

      linked[i] = true;
      chain[len++] = i;

      while (true) {
        var savLen = len;
        for (var j = 0; j < cx; j++) {

          var gotNewLink = false;
          if (linked[j]) {
            continue;
          }

          var ci = x[j * 2 + 0];
          var d = x[j * 2 + 1];

          //
          // Two links can't connect physically.
          //

          var dup = false;
          for (var k = 0; k < len; k++) {
            if (ci == x[2 * chain[k]] || d == x[2 * chain[k]] ||
                ci == x[2 * chain[k] + 1] || d == x[2 * chain[k] + 1]) {
              dup = true;
              break;
            }
          }
          if (dup) {
            continue;
          }

          //
          // Check is there a new link, if so change the start-end points of
          // the chain.
          //

          if (hasLink(a, ci) && BOX(b) != BOX(d)) {
            a = d;
            gotNewLink = true;
          } else if (hasLink(a, d) && BOX(b) != BOX(ci)) {
            a = ci;
            gotNewLink = true;
          } else if (hasLink(b, ci) && BOX(a) != BOX(d)) {
            b = d;
            gotNewLink = true;
          } else if (hasLink(b, d) && BOX(a) != BOX(ci)) {
            b = ci;
            gotNewLink = true;
          }

          if (!gotNewLink) {
            continue;
          }

          linked[j] = true;
          chain[len++] = j;

          //
          // Check changes.
          //

          if (!isChanged(a, b, n2b(n))) {
            continue;
          }

          ht1.push(a);
          ht1.push(b);

          for (var k = 0; k < len; k++) {
            ht4.push(x[2 * chain[k]]);
            ht4.push(x[2 * chain[k] + 1]);
            ht4.push(n);
          }

          msg = 'X-Chains';
          return true;
        }

        if (len == savLen) {            // No new link found.
          break;
        }
      }
    }

  }

  return false;
}

function c2b(c, n)
{
  //
  // Get n-th bit 1 of c.
  //

  for (var i = 0, mask = 1; i < 9; i++, mask <<= 1) {
    if (c & mask && 0 == --n) {
      return mask;
    }
  }
  return 0;
}

var xyMask;
var xyNCell;                            // # 2 candidates cells.
var xyCell = [];                        // 2 candidates cells.
var xyFlag = [];
var xyNChain;                           // Length of XY chain.
var xyChain = [];                       // The XY chain.

function findXyChains(round, link)
{
  //
  // Check is current chain valid.
  //

  if (2 < xyNChain && link == xyMask) {

    var a = xyChain[0];                 // Head.
    var b = xyChain[xyNChain - 1];      // Tail.

    if (BOX(a) != BOX(b) && 0 != (candidate[b] & xyMask) && isChanged(a, b, xyMask)) {

      ht1.push(a);
      ht1.push(b);

      var mask = xyMask;
      for (var i = 0; i < xyNChain - 1; i++) {
        ht4.push(xyChain[i]);
        ht4.push(xyChain[i + 1]);
        var c = candidate[xyChain[i]];
        l1 = c2b(c, 1), l2 = c2b(c, 2);
        var mask1 = l1 == mask ? l2 : l1;
        if (0 == mask1) {
          c = candidate[xyChain[i + 1]];
          l1 = c2b(c, 1), l2 = c2b(c, 2);
          mask1 = l1 == mask ? l2 : l1;
        }
        ht4.push(b2n(mask1));
        mask = mask1;
      }

      msg = 'XY-Chains';
      return true;
    }
  }

  //
  // Backtracking.
  //

  for (var i = 0; i < xyNCell; i++) {
    if (xyFlag[i]) {
      continue;
    }
    var cell = xyCell[i];
    if (!hasLink(xyChain[xyNChain - 1], cell)) {
      continue;
    }
    var c = candidate[cell];
    if (0 == (c & link)) {
      continue;
    }
    xyFlag[i] = true;
    xyChain[xyNChain++] = cell;
    var link1 = c2b(c, 1), link2 = c2b(c, 2);
    if (link == link1) {
      if (findXyChains(round, link2)) {
        return true;
      }
    } else {
      if (findXyChains(round, link1)) {
        return true;
      }
    }
    xyFlag[i] = false;
    xyNChain -= 1;
  }

  return false;
}

function p_findXyChains(round)
{
  xyNCell = xyNChain = 0;

  //
  // Collect cells that have 2 candidates.
  //

  for (var i = 0; i < 81; i++) {
    if (2 == bc(candidate[i])) {
      xyCell[xyNCell] = i;
      xyFlag[xyNCell] = false;
      xyNCell += 1;
    }
  }

  //
  // Backtracking to find a XY chain.
  //

  for (var i = 0; i < xyNCell; i++) {
    xyFlag[i] = true;
    var cell = xyCell[i];
    xyChain[xyNChain++] = cell;
    var c = candidate[cell];
    var link1 = c2b(c, 1), link2 = c2b(c, 2);
    xyMask = link2;
    if (findXyChains(round, link1)) {
      return true;
    }
    xyMask = link1;
    if (findXyChains(round, link2)) {
      return true;
    }
    xyFlag[i] = false;
    xyNChain -= 1;
  }

  return false;
}

//
// Init game.
//

resetPuzzle();

//
// Check URL param for init data.
//

function checkUrlParam() {

  var strUrl = location.search;
  if (strUrl.indexOf("?") == -1) {
    return;
  }

  var getSearch = strUrl.split("?");
  var getPara = getSearch[1].split("&");

  var doSolve = false;
  for (var i = 0; i < getPara.length; i++) {
    var param = getPara[i].split("=");
    if ("p" == param[0]) {
      var s = param[1];
      if (s.length > 81) {
        s = s.slice(0, 81);
      } else if (s.length < 81) {
        s = s + '0'.repeat(81 - s.length + 1);
      }
      p = s.split('');
    } else if ("s" == param[0]) {
      doSolve = param[1];
    }
  }

  initCandidates();
  renderPuzzle('c0');

  if (1 == doSolve) {
    solve();
  }
}

checkUrlParam();

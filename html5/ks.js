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
var CHAIN_TYPE_X = 0;
var CHAIN_TYPE_XY = 1;
var CHAIN_TYPE_XYZ = 2;

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
        ctx.strokeStyle = 'Red';
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
  for (var i = 0; i < ht4.length; i += 4) {
    var a = ht4[i], b = ht4[i + 1];
    var na = ht4[i + 2] - 1;
    var nb = ht4[i + 3] - 1;
    var xa = COL(a) * (1 + cellw), ya = ROW(a) * (1 + cellh);
    var cxa = xa + (na % 3) * charw, cya = ya + Math.floor(na / 3) * charh;
    var xb = COL(b) * (1 + cellw), yb = ROW(b) * (1 + cellh);
    var cxb = xb + (nb % 3) * charw, cyb = yb + Math.floor(nb / 3) * charh;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.rect(cxa, cya, charw, charh);
    ctx.rect(cxb, cyb, charw, charh);
    ctx.moveTo(cxa + halfcharw, cya + halfcharh);
    ctx.lineTo(cxb + halfcharw, cyb + halfcharh);
    ctx.lineWidth = 1;
    ctx.stroke();
    if (0 < i && 0 == (i % 4)) {
      var b0 = ht4[i - 3];
      var n1 = ht4[i - 1] - 1;
      var xb0 = COL(b0) * (1 + cellw), yb0 = ROW(b0) * (1 + cellh);
      var cxb0 = xb0 + (n1 % 3) * charw, cyb0 = yb0 + Math.floor(n1 / 3) * charh;
      ctx.setLineDash([5,3]);
      ctx.beginPath();
      ctx.moveTo(cxb0 + halfcharw, cyb0 + halfcharh);
      ctx.lineTo(cxa + halfcharw, cya + halfcharh);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

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
pattern.push(p_findXChains);
pattern.push(p_findXyChains);
pattern.push(p_findXyzChains);

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

function isChanged(a, b, mask, IsCheckOnly)
{
  var changed = false;
  var c = [], idx = [];

  if (COL(a) == COL(b) || ROW(a) == ROW(b)) {
    if (COL(a) == COL(b)) {
      getCandidateListOfCol(COL(a), c, idx);
    } else {
      getCandidateListOfRow(ROW(a), c, idx);
    }
    for (var k = 0; k < 9; k++) {
      if (idx[k] != a && idx[k] != b && !isSolved(idx[k]) && c[k] & mask) {
        changed = true;
        if (!IsCheckOnly) {
          candidate[idx[k]] &= ~mask;
        }
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
        if (!IsCheckOnly) {
          candidate[idx[k]] &= ~mask;
        }
        ht3.push(idx[k]);
        htMask.push(mask);
      }
    }

    getCandidateListOfBox(BOX(b), c, idx);
    for (var k = 0; k < 9; k++) {
      if (idx[k] != b && !isSolved(idx[k]) && c[k] & mask &&
          (ROW(a) == ROW(idx[k]) || COL(a) == COL(idx[k]))) {
        changed = true;
        if (!IsCheckOnly) {
          candidate[idx[k]] &= ~mask;
        }
        ht3.push(idx[k]);
        htMask.push(mask);
      }
    }

    var ix1 = getIdxFromColRow(COL(a), ROW(b));
    if (!isSolved(ix1) && candidate[ix1] & mask) {
      changed = true;
      if (!IsCheckOnly) {
        candidate[ix1] &= ~mask;
      }
      ht3.push(ix1);
      htMask.push(mask);
    }

    var ix2 = getIdxFromColRow(COL(b), ROW(a));
    if (!isSolved(ix2) && candidate[ix2] & mask) {
      changed = true;
      if (!IsCheckOnly) {
        candidate[ix2] &= ~mask;
      }
      ht3.push(ix2);
      htMask.push(mask);
    }
  }

  return changed;
}

function hasLink(a, b) {
  return BOX(a) == BOX(b) || COL(a) == COL(b) || ROW(a) == ROW(b);
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

//
// XyzChainState
//

var sType;
var scx, sx, sxMap;                     // X links.
var scxy, sxy, sxyMap;                  // XY cells.
var snCells, sCells;                    // Possible node of XYZ chains.
var sFlags;                             // Is used state of cell.
var snChain, sChain, sMask;             // XYZ chains.
var snBestChain, sBestChain, sBestMask; // Shortest chain.

function collectStrongLinkOfLine(n, cx, x, c, idx, cell)
{
  if (2 == getCandidateCountOfList(c, n, cell)) {
    var i1 = idx[cell[0]], i2 = idx[cell[1]];
    if (BOX(i1) != BOX(i2)) {
      x[cx * 2 + 0] = i1;
      x[cx * 2 + 1] = i2;
      cx += 1;
    }
  }
  return cx
}

function collectStrongLinks(n, x)
{
  var c = [], idx = [], cell = [];
  var cx = 0;

  for (var row = 0; row < 9; row++) {
    getCandidateListOfRow(row, c, idx);
    cx = collectStrongLinkOfLine(n, cx, x, c, idx, cell);
  }

  for (var col = 0; col < 9; col++) {
    getCandidateListOfCol(col, c, idx);
    cx = collectStrongLinkOfLine(n, cx, x, c, idx, cell);
  }

  for (var box = 0; box < 9; box++) {
    getCandidateListOfBox(box, c, idx);
    if (2 == getCandidateCountOfList(c, n, cell)) {
      x[cx * 2 + 0] = idx[cell[0]];
      x[cx * 2 + 1] = idx[cell[1]];
      cx += 1;
    }
  }

  return cx;
}

function getXyzChainEndPoint(n, cell)
{
  for (var i = 0; i < scx[n]; i++) {
    if (sx[n][2 * i] == cell) {
      return sx[n][2 * i + 1];
    } else if (sx[n][2 * i + 1] == cell) {
      return sx[n][2 * i];
    }
  }
  return -1;
}

function findXyzChains_i()
{
  //
  // Check is current chain valid.
  //

  if (((CHAIN_TYPE_X == sType && 4 <= snChain) || (4 < snChain)) &&
       snBestChain > snChain && sMask[0] == sMask[snChain - 1]) {
    var a = sChain[0];                  // Head.
    var b = sChain[snChain - 1];        // Tail.
    if (BOX(a) != BOX(b) && isChanged(a, b, sMask[0], true)) {
      snBestChain = snChain;
      sBestChain = sChain.slice();
      sBestMask = sMask.slice();
    }
  }

  //
  // Backtracking to find a XYZ chain.
  //

  for (var i = 0; i < snCells; i++) {
    if (snChain >= snBestChain) {       // Impossible to get shorter chain, skip.
      break;
    }
    var cell = sCells[i];
    if (sFlags[cell]) {
      continue;
    }
    var tail = sChain[snChain - 1];
    if (!hasLink(tail, cell)) {         // Has possible link?
      continue;
    }
    var mask = sMask[snChain - 1];
    sFlags[cell] += 1;
    if (cell != tail && sxyMap[cell]) { // Check link of XY cell.
      sChain[snChain] = cell;
      sChain[snChain + 1] = cell;
      var c = sxyMap[cell];
      var mask1 = c2b(c, 1), mask2 = c2b(c, 2);
      if (mask1 == mask) {
        sMask[snChain] = mask;
        sMask[snChain + 1] = mask2;
        snChain += 2;
        findXyzChains_i();
        snChain -= 2;
      } else if (mask2 == mask) {
        sMask[snChain] = mask;
        sMask[snChain + 1] = mask1;
        snChain += 2;
        findXyzChains_i();
        snChain -= 2;
      }
    }
    if (sxMap[cell]) {                  // Check link of X link.
      var cellmask = sxMap[cell];
      for (var j = 0; j < 9; j++) {     // Case 1: connected node can be a link of any number.
        if (CHAIN_TYPE_X == sType || (2 <= snChain && sChain[snChain - 2] == sChain[snChain - 1])) {
          continue;
        }
        var n = n2b(1 + j);
        if (n == mask || 0 == (cellmask & n)) {
          continue;
        }
        var end = getXyzChainEndPoint(j, cell);
        if (-1 != end && (tail == cell || tail == end)) {
          if (tail == cell) {
            sChain[snChain] = cell;
            sChain[snChain + 1] = end;
          } else {
            sChain[snChain] = end;
            sChain[snChain + 1] = cell;
          }
          sMask[snChain] = n;
          sMask[snChain + 1] = n;
          sFlags[end] += 1;
          snChain += 2;
          findXyzChains_i();
          snChain -= 2;
          sFlags[end] -= 1;
        }
      }
      var end = getXyzChainEndPoint(b2n(mask) - 1, cell);
      if (-1 != end && end != tail) {   // Case 2: dummy link with same number.
        sChain[snChain] = cell;
        sChain[snChain + 1] = end;
        sMask[snChain] = mask;
        sMask[snChain + 1] = mask;
        sFlags[end] += 1;
        snChain += 2;
        findXyzChains_i();
        snChain -= 2;
        sFlags[end] -= 1;
      }
    }
    sFlags[cell] -= 1;
  }
}

function findXyzChains(round)
{
  //
  // Collect strong links.
  //

  scx = [], sx = [];
  sxMap = new Array(81).fill(0);

  for (var i = 0; i < 9; i++) {
    scx[i] = 0;
    sx[i] = new Array(81).fill(0);;
    if (CHAIN_TYPE_XY != sType) {
      scx[i] = collectStrongLinks(1 + i, sx[i]);
    }
  }

  for (var i = 0; i < 9; i++) {
    var n = n2b(1 + i);
    for (var j = 0; j < scx[i]; j++) {
      var cell1 = sx[i][2 * j];
      var cell2 = sx[i][2 * j + 1];
      sxMap[cell1] |= n;
      sxMap[cell2] |= n;
    }
  }

  //
  // Collect cells that have 2 candidates.
  //

  scxy = 0;
  sxy = new Array(81).fill(0);
  sxyMap = new Array(81).fill(0);

  if (CHAIN_TYPE_X != sType) {
    for (var i = 0; i < 81; i++) {
      if (2 == bc(candidate[i])) {
        sxy[scxy] = i;
        scxy += 1;
      }
    }
  }

  for (var i = 0; i < scxy; i++) {
    var cell = sxy[i];
    sxyMap[cell] = candidate[cell];
  }

  //
  // Collect candidate cells of XYZ chains.
  //

  snCells = 0;
  sCells = new Array(81).fill(0);

  for (var i = 0; i < 81; i++) {
    if (sxMap[i] || sxyMap[i]) {
      sCells[snCells] = i;
      snCells += 1;
    }
  }

  //
  // Backtracking to find a XYZ chain of start points.
  //

  snBestChain = 1000, snChain = 0;
  sChain = new Array(81).fill(0);
  sFlags = new Array(81).fill(0);
  sMask = new Array(81).fill(0);
  sBestMask = new Array(81).fill(0);
  sBestChain = new Array(81).fill(0);

  for (var i = 0; i < snCells; i++) {
    var cell = sCells[i];
    sFlags[cell] += 1;
    if (CHAIN_TYPE_X != sType && sxyMap[cell]) {
      sChain[snChain] = cell;
      sChain[snChain + 1] = cell;
      var c = sxyMap[cell];
      var mask1 = c2b(c, 1), mask2 = c2b(c, 2);
      sMask[snChain] = mask2;
      sMask[snChain + 1] = mask1;
      snChain += 2;
      findXyzChains_i();
      snChain -= 2;
      sMask[snChain] = mask1;
      sMask[snChain + 1] = mask2;
      snChain += 2;
      findXyzChains_i();
      snChain -= 2;
    }
    if (CHAIN_TYPE_XY != sType && sxMap[cell]) {
      var mask = sxMap[cell];
      for (var j = 0; j < 9; j++) {
        var n = n2b(1 + j);
        if (0 == (mask & n)) {
          continue;
        }
        var end = getXyzChainEndPoint(j, cell);
        if (-1 != end) {
          sChain[snChain] = cell;
          sChain[snChain + 1] = end;
          sMask[snChain] = n;
          sMask[snChain + 1] = n;
          snChain += 2;
          sFlags[end] += 1;
          findXyzChains_i();
          snChain -= 2;
          sFlags[end] -= 1;
        }
      }
    }
    sFlags[cell] -= 1;
  }

  if (1000 != snBestChain) {
    var mask = sBestMask[0];
    var a = sBestChain[0];              // Head.
    var b = sBestChain[snBestChain - 1]; // Tail.
    if (BOX(a) != BOX(b) && isChanged(a, b, mask, false)) {
      updateCandidates();
      ht1.push(a), ht1.push(b);
      for (var i = 0; i < snBestChain; i += 2) {
        var x = sBestChain[i];
        var y = sBestChain[i + 1];
        var n1 = b2n(sBestMask[i]);
        var n2 = b2n(sBestMask[i + 1]);
        if (x != y) {
          ht4.push(x);
          ht4.push(y);
          ht4.push(n1);
          ht4.push(n1);
        } else {
          ht4.push(x);
          ht4.push(x);
          ht4.push(n1);
          ht4.push(n2);
        }
      }
      return true;
    }
  }

  return false;
}

function p_findXChains(round)
{
  msg = 'X-Chains';
  sType = CHAIN_TYPE_X;
  return findXyzChains(round);
}

function p_findXyChains(round)
{
  msg = 'XY-Chains';
  sType = CHAIN_TYPE_XY;
  return findXyzChains(round);
}

function p_findXyzChains(round)
{
  msg = 'XYZ-Chains';
  sType = CHAIN_TYPE_XYZ;
  return findXyzChains(round);
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

//
// ks.js
// KillSudoku implementation.
//
// 2020/10/10 Waync Cheng.
//

var charw = 12, charh = 12;
var cellw = 3 * charw, cellh = 3 * charh;
var puzzlew = 9 * (1 + cellw), puzzleh = 9 * (1 + cellh);
var halfcharw = Math.floor(charw/2), halfcharh = Math.floor(charh/2);
var SHOW_CANDIDATES = 1;
var PUZZLE_SIZE = 81;

var tCOL = [], tROW = [], tBOX = [];

for (var i = 0; i < PUZZLE_SIZE; i++) {
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

var p = [];
var solved = false;

var steps = document.getElementById('steps');

var sharelink = document.getElementById('sharelink');
sharelink.style.display = 'none';
sharelink.style.width = '400px';
sharelink.style.height = '2em';
sharelink.style.border = '1px solid #666';

var c0 = document.getElementById('c0');
c0.setAttribute('width', puzzlew);
c0.setAttribute('height', puzzleh);
var ctx = c0.getContext('2d');

c0.onmousedown = function(e) {
  sharelink.style.display = 'none';

  if (2 == e.button) {
    return;
  }

  var offset = getOffset(e);
  var col = Math.floor(offset.x / (1 + cellw));
  var row = Math.floor(offset.y / (1 + cellh));
  var i = getIdxFromColRow(col, row);

  if (0 != p[i]) {
    p[i] = 0;
    renderInitPuzzle();
    return false;
  }

  var chcol = Math.floor((offset.x - col * (1 + cellw)) / charw);
  var chrow = Math.floor((offset.y - row * (1 + cellh)) / charh);
  var j = chcol + 3 * chrow;
  if (isEditPuzzleValid(i, 1 + j)) {
    p[i] = 1 + j;
    renderInitPuzzle();
  }
}

function addStep(round, msg, p, candidate, ht1, ht2, ht3, ht4) {
  var h = document.createElement('h1');
  h.appendChild(document.createTextNode(round + ', ' + msg));
  steps.appendChild(h);
  var c = document.createElement('canvas');
  c.setAttribute('width', puzzlew);
  c.setAttribute('height', puzzleh);
  var ctx = c.getContext('2d');
  renderStep(ctx, p, candidate, ht1, ht2, ht3, ht4);
  steps.appendChild(c);
  solved = isSolved(p);
}

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
      if (s.length > PUZZLE_SIZE) {
        s = s.slice(0, PUZZLE_SIZE);
      } else if (s.length < PUZZLE_SIZE) {
        s = s + '0'.repeat(PUZZLE_SIZE - s.length + 1);
      }
      p = s.split('');
    } else if ("s" == param[0]) {
      doSolve = param[1];
    }
  }

  renderInitPuzzle();

  if (1 == doSolve) {
    solvePuzzle();
  }
}

function getOffset(e) {
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

function getIdxFromColRow(col, row) {
  return 9 * row + col;
}

function fillCell(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, cellw + 1, cellh + 1);
  ctx.fillStyle = 'Black';
}

function isEditPuzzleValid(i, n) {
  var s = p.join('');
  return Module.ccall('cIsEditPuzzleValid', 'number', ['string', 'number', 'number'], [s, i, n]);
}

function isSolved(p) {
  for (var i = 0; i < p.length; i++) {
    if (0 == p[i]) {
      return false;
    }
  }
  return true;
}

function n2b(n) {
  return 1 << (n - 1);
}

function prepArray(p, len) {
  var a = [];
  for (var i = 0; i < len; i++) {
    a.push(getValue(p + 4 * i, 'i32'));
  }
  return a;
}

function renderInitPuzzle() {
  var s = p.join('');
  Module.ccall('cPrintInitPuzzle', 'number', ['string'], [s]);
}

function renderStep(ctx, p, candidate, ht1, ht2, ht3, ht4) {
  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = 'Ivory';
  ctx.fillRect(0, 0, puzzlew, puzzleh);
  ctx.fillStyle = 'Black';

  //
  // Draw cells.
  //

  for (var i = 0; i < PUZZLE_SIZE; i++) {

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

    } else if (SHOW_CANDIDATES) {

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
      if (-1 != ht) {
        for (var a = 0; a < ht3.length; a += 2) {
          if (i != ht3[a]) {
            continue;
          }
          ctx.fillStyle = 'Red';
          ctx.strokeStyle = 'Red';
          var mask = ht3[a + 1];
          for (var j = 0; j < 9; j++) {
            if (mask & n2b(1 + j)) {
              var cx = x + (j % 3) * charw, cy = y + Math.floor(j / 3) * charh;
              ctx.fillText(1 + j, cx, cy);
              ctx.moveTo(cx - halfcharw, cy - halfcharh);
              ctx.lineTo(cx + halfcharw, cy + halfcharh);
              ctx.stroke();
            }
          }
          ctx.fillStyle = 'Black';
          break;
        }
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
}

function resetPuzzle() {
  sharelink.style.display = 'none';
  resetSteps();
  p[i] = 0;
  for (var i = 0; i < PUZZLE_SIZE; i++) {
    p[i] = 0;
  }
  renderInitPuzzle();
}

function resetSteps() {
  steps.innerHTML = '';
}

function sharePuzzle() {
  var p2 = p.slice(0);                  // Copy current puzzle.
  var link = location.href.split("?")[0].split("#")[0] + '?p=';
  for (var i = 0; i < PUZZLE_SIZE; i++) {
    link = link + p2[i];
  }
  sharelink.style.display = 'block';
  sharelink.value = link;
}

function solve(s) {
  Module.ccall('cSolve', 'number', ['string'], [s]);
}

function solvePuzzle() {
  sharelink.style.display = 'none';
  resetSteps();
  var s = p.join('');
  solve(s);
  if (!solved) {
    var h = document.createElement('h1');
    h.appendChild(document.createTextNode('(NOT SOLVED!)'));
    steps.appendChild(h);
  }
}

resetPuzzle();
checkUrlParam();

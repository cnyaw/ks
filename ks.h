//
// ks.h
// KillSudoku implementation.
//
// Copyright (c) 2016 Waync Cheng.
// All Rights Reserved.
//
// 2016/7/4 Waync Cheng.
//

class KillSudoku
{
public:

  enum {
    CHAIN_TYPE_X,
    CHAIN_TYPE_XY,
    CHAIN_TYPE_XYZ,
  };

  struct XyzChainState
  {
    int type;
    int cx[9], x[9][81], xmap[81];      // X links.
    int cxy, xy[81], xymap[81];         // XY cells.
    int nCells, cells[81];              // Possible node of XYZ chains.
    int flags[81];                      // Is used state of cell.
    int nChain, chain[81], mask[81];    // XYZ chains.
    int nBestChain, bestChain[81], bestMask[81]; // Shortest chain.
  };

  //
  // The puzzle consist of 9x9(p[81]) cells. Layout from left to right, top
  // to bottom. Each solved cell contains a number(1~9), and 0 indicates this
  // cell is not solved. Each cell maintains a candidate bitset to indicate
  // how many candidate numbers in this unsolved cell(candidate[81]).
  //

  int p[81];                            // Puzzle data, 0 indicates not solved. num 1~9.
  int candidate[81];                    // Candidates bitset of each cell. 1 bit for 1 num.

  typedef bool (KillSudoku::*CHECK)(int);
  int nchk;                             // Number of checking technique.
  CHECK chk[32];                        // Table of checking technique functions.

  //
  // Table of col/row/box index of each cell.
  //

  unsigned char tCol[81], tRow[81], tBox[81];

#define COL(i) (tCol[(i)])
#define ROW(i) (tRow[(i)])
#define BOX(i) (tBox[(i)])

  KillSudoku(int _p[]) : nchk(0)
  {
    memcpy(p, _p, sizeof(p));
    initCandidates();

    installCf(&KillSudoku::findSingle);
    installCf(&KillSudoku::findClaiming);
    installCf(&KillSudoku::findPointing);
    installCf(&KillSudoku::findSet);
    installCf(&KillSudoku::findXChains);
    installCf(&KillSudoku::findXyChains);
    installCf(&KillSudoku::findXyzChains);

    //
    // Build lookup table.
    //

    for (int i = 0; i < 81; i++) {
      tCol[i] = i % 9;
      tRow[i] = i / 9;
      tBox[i] = 3 * (tRow[i] / 3) + (tCol[i] / 3);
    }
  }

  virtual void printNakedSingle(int round, int i) const=0;
  virtual void printHiddenSingle(int round, int i, int type, int idx[/*9*/]) const=0;
  virtual void printPointing(int round, int n, int len, int idx[/*9*/], int cell[], int nht3, int ht3[]) const=0;
  virtual void printClaiming(int round, int n, int len, int idx[/*9*/], int cell[], int nht3, int ht3[]) const=0;
  virtual void printNakedSubset(int round, int len, int mask, int pos[], int idx[/*9*/], int nht3, int ht3[]) const=0;
  virtual void printHiddenSubset(int round, int len, int idx[], int pos[], int set[]) const=0;
  virtual void printXChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const=0;
  virtual void printXyChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const=0;
  virtual void printXyzChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const=0;
  virtual void printPuzzle() const=0;

  void installCf(CHECK f)
  {
    //
    // Helper to install checking function.
    //

    chk[nchk++] = f;
  }

  bool isSolved(int i) const
  {
    //
    // Is the cell solved?
    //

    return 0 != p[i];
  }

  bool isSingle(int candidate, int &n) const
  {
    //
    // Does this candidate bitset have only one naked single?
    //

    int c = 0;
    for (int i = 0; i < 9; i++) {
      if (candidate & (1 << i)) {
        c += 1;
        n = i + 1;
      }
    }
    return 1 == c;
  }

  bool isChanged(int a, int b, int mask, int &nht3, int ht3[], bool IsCheckOnly = false)
  {
    int c[9], idx[9];

    nht3 = 0;
    if (COL(a) == COL(b)) {
      getCandidateListOfCol(COL(a), c, idx);
      for (int k = 0; k < 9; k++) {
        if (idx[k] != a && idx[k] != b && !isSolved(idx[k]) && c[k] & mask) {
          if (!IsCheckOnly) {
            candidate[idx[k]] &= ~mask;
          }
          ht3[nht3++] = idx[k];
          ht3[nht3++] = mask;
        }
      }
    } else if (ROW(a) == ROW(b)) {
      getCandidateListOfRow(ROW(a), c, idx);
      for (int k = 0; k < 9; k++) {
        if (idx[k] != a && idx[k] != b && !isSolved(idx[k]) && c[k] & mask) {
          if (!IsCheckOnly) {
            candidate[idx[k]] &= ~mask;
          }
          ht3[nht3++] = idx[k];
          ht3[nht3++] = mask;
        }
      }
    } else {
      getCandidateListOfBox(BOX(a), c, idx);
      for (int k = 0; k < 9; k++) {
        if (idx[k] != a && !isSolved(idx[k]) && c[k] & mask && (ROW(b) == ROW(idx[k]) || COL(b) == COL(idx[k]))) {
          if (!IsCheckOnly) {
            candidate[idx[k]] &= ~mask;
          }
          ht3[nht3++] = idx[k];
          ht3[nht3++] = mask;
        }
      }

      getCandidateListOfBox(BOX(b), c, idx);
      for (int k = 0; k < 9; k++) {
        if (idx[k] != b && !isSolved(idx[k]) && c[k] & mask && (ROW(a) == ROW(idx[k]) || COL(a) == COL(idx[k]))) {
          if (!IsCheckOnly) {
            candidate[idx[k]] &= ~mask;
          }
          ht3[nht3++] = idx[k];
          ht3[nht3++] = mask;
        }
      }

      int ix1 = getIdxFromColRow(COL(a), ROW(b));
      if (!isSolved(ix1) && candidate[ix1] & mask) {
        if (!IsCheckOnly) {
          candidate[ix1] &= ~mask;
        }
        ht3[nht3++] = ix1;
        ht3[nht3++] = mask;
      }

      int ix2 = getIdxFromColRow(COL(b), ROW(a));
      if (!isSolved(ix2) && candidate[ix2] & mask) {
        if (!IsCheckOnly) {
          candidate[ix2] &= ~mask;
        }
        ht3[nht3++] = ix2;
        ht3[nht3++] = mask;
      }
    }

    return 0 < nht3;
  }

  int bc(int n) const
  {
    //
    // Get number of bit 1s.
    //

    int c = 0;
    for (int i = 0; i < 9; i++) {
      if (n & (1 << i)) {
        c += 1;
      }
    }
    return c;
  }

  int n2b(int n) const
  {
    //
    // Convert number(1~9) to bit mask.
    //

    return 1 << (n - 1);
  }

  int b2n(int mask) const
  {
    //
    // Get number from mask.
    //

    for (int i = 0; i < 9; i++) {
      if (mask & (1 << i)) {
        return 1 + i;
      }
    }
    return 0;
  }

  int c2b(int c, int n) const
  {
    //
    // Get n-th bit 1 of c.
    //

    for (int i = 0, mask = 1; i < 9; i++, mask <<= 1) {
      if (c & mask && 0 == --n) {
        return mask;
      }
    }
    return 0;
  }

  bool hasLink(int a, int b) const
  {
    return BOX(a) == BOX(b) || COL(a) == COL(b) || ROW(a) == ROW(b);
  }

  int getIdxFromColRow(int col, int row) const
  {
    //
    // Calc the puzzle cell index from col:row.
    //

    return 9 * row + col;
  }

  int getIdxFromBoxIdx(int box, int i) const
  {
    //
    // Calc the puzzle cell index from box cell index.
    //

    int bcol = box % 3;
    int brow = box / 3;
    int ccol = i % 3;
    int crow = i / 3;
    return 9 * (3 * brow + crow) + 3 * bcol + ccol;
  }

  void initCandidates()
  {
    //
    // Init candidate bitset of each puzzle cell.
    //

    for (int row = 0; row < 9; row++) {
      for (int col = 0; col < 9; col++) {
        int i = getIdxFromColRow(col, row);
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

  void updateCandidates()
  {
    //
    // Update candidates in a box.
    //

    for (int box = 0; box < 9; box++) {
      for (int cell = 0; cell < 9; cell++) {

        int index = getIdxFromBoxIdx(box, cell);
        if (!isSolved(index)) {
          continue;
        }

        //
        // Removed this solved number from from other cells candidate in this
        // box.
        //

        int n = p[index];
        for (int i = 0; i < 9; i++) {
          if (i != cell) {
            candidate[getIdxFromBoxIdx(box, i)] &= ~n2b(n);
          }
        }
      }
    }

    //
    // Update candidates in col.
    //

    for (int col = 0; col < 9; col++) {
      for (int row = 0; row < 9; row++) {

        int index = getIdxFromColRow(col, row);
        if (!isSolved(index)) {
          continue;
        }

        //
        // Removed this solved number from from other cells candidate in this
        // col.
        //

        int n = p[index];
        for (int i = 0; i < 9; i++) {
          if (i != row) {
            candidate[getIdxFromColRow(col, i)] &= ~n2b(n);
          }
        }
      }
    }

    //
    // Update candidates in row.
    //

    for (int row = 0; row < 9; row++) {
      for (int col = 0; col < 9; col++) {

        int index = getIdxFromColRow(col, row);
        if (!isSolved(index)) {
          continue;
        }

        //
        // Removed this solved number from from other cells candidate in this
        // row.
        //

        int n = p[index];
        for (int i = 0; i < 9; i++) {
          if (i != col) {
            candidate[getIdxFromColRow(i, row)] &= ~n2b(n);
          }
        }
      }
    }
  }

  void solve()
  {
    //
    // Check is there any state can be changed by any one of checking pattern.
    //

    int round = 1;

    while (true) {
      bool over = true;
      for (int i = 0; i < nchk; i++) {
        if ((this->*chk[i])(round)) {
          round += 1;
          printPuzzle();
          over = false;
          break;
        }
      }
      if (over) {
        break;
      }
    }
  }

  void getCandidateListOfBox(int box, int c[], int idx[]) const
  {
    //
    // Get the candidate list of a box.
    //

    for (int cell = 0; cell < 9; cell++) {
      int i = getIdxFromBoxIdx(box, cell);
      c[cell] = isSolved(i) ? 0 : candidate[i];
      idx[cell] = i;
    }
  }

  void getCandidateListOfCol(int col, int c[], int idx[]) const
  {
    //
    // Get the candidate list of a col.
    //

    for (int row = 0; row < 9; row++) {
      int i = getIdxFromColRow(col, row);
      c[row] = isSolved(i) ? 0 : candidate[i];
      idx[row] = i;
    }
  }

  void getCandidateListOfRow(int row, int c[], int idx[]) const
  {
    //
    // Get the candidate list of a row.
    //

    for (int col = 0; col < 9; col++) {
      int i = getIdxFromColRow(col, row);
      c[col] = isSolved(i) ? 0 : candidate[i];
      idx[col] = i;
    }
  }

  int getCandidateCountOfList(int candidate[], int n, int cell[]) const
  {
    //
    // Count how many n exist in the candidates list.
    //

    int c = 0;
    for (int i = 0; i < 9; i++) {
      if (candidate[i] & n2b(n)) {
        cell[c++] = i;
      }
    }

    return c;
  }

  bool findSingle(int c[], int idx[], int round, int type)
  {
    //
    // Find single candidate in a candidate list.
    //

    int cell[9];

    for (int n = 1; n <= 9; n++) {

      if (1 != getCandidateCountOfList(c, n, cell)) {
        continue;
      }

      int i = idx[cell[0]];

      p[i] = n;
      candidate[i] = n2b(n);

      updateCandidates();
      printHiddenSingle(round, i, type, idx); // type: 0(box), 1(col), 2(row).

      return true;
    }

    return false;
  }

  bool findSingle(int round)
  {
    //
    // Find naked single.
    //

    int n;
    for (int i = 0; i < 9 * 9; i++) {
      if (!isSolved(i) && isSingle(candidate[i], n)) {
        p[i] = n;
        candidate[i] = n2b(n);
        updateCandidates();
        printNakedSingle(round, i);
        return true;
      }
    }

    //
    // Find hidden single.
    //

    int c[9], idx[9];
    for (int i = 0; i < 9; i++) {

      getCandidateListOfBox(i, c, idx);
      if (findSingle(c, idx, round, 0)) {
        return true;
      }

      getCandidateListOfCol(i, c, idx);
      if (findSingle(c, idx, round, 1)) {
        return true;
      }

      getCandidateListOfRow(i, c, idx);
      if (findSingle(c, idx, round, 2)) {
        return true;
      }
    }

    return false;
  }

  bool findPointing(int round)
  {
    //
    // Find pointing pattern in a box.
    //

    int c[9], idx[9], cell[9];

    for (int box = 0; box < 9; box++) {

      getCandidateListOfBox(box, c, idx);

      for (int n = 1; n <= 9; n++) {

        //
        // 1, there are must only 2 or 3 candidates in this box.
        //

        int count = getCandidateCountOfList(c, n, cell);
        if (2 != count && 3 != count) {
          continue;
        }

        //
        // 2, check are these candidates in the same col or row.
        //

        int col[3], row[3];
        for (int i = 0; i < count; i++) {
          int index = idx[cell[i]];
          col[i] = COL(index) % 3;
          row[i] = ROW(index) % 3;
        }

        if (2 == count) {
          col[2] = col[0];
          row[2] = row[0];
        }

        int c2[9], idx2[9];
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

        bool changed = false;

        int mask = n2b(n), nht3 = 0, ht3[18];
        for (int i = 0; i < 9; i++) {

          int index = idx2[i];
          if (isSolved(index)) {
again:
            continue;
          }

          for (int j = 0; j < count; j++) {
            if (index == idx[cell[j]]) {
              goto again;
            }
          }

          if (0 == (candidate[index] & mask)) {
            continue;
          }

          candidate[index] &= ~mask;
          changed = true;

          ht3[nht3++] = index;
          ht3[nht3++] = mask;
        }

        if (!changed) {
          continue;
        }

        //
        // State changed, output some messages.
        //

        updateCandidates();
        printPointing(round, n, count, idx, cell, nht3, ht3);

        return true;
      }
    }

    return false;
  }

  bool findClaiming(int c[], int idx[], int round)
  {
    //
    // Find claiming pattern in a col or a row.
    //

    int cell[9];

    for (int n = 1; n <= 9; n++) {

      //
      // 1, there are only 2 or 3 candidates found, so it is possible in the
      // same box.
      //

      int count = getCandidateCountOfList(c, n, cell);
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

      int c2[9], idx2[9];
      getCandidateListOfBox(BOX(idx[cell[0]]), c2, idx2);

      bool changed = false;

      int mask = n2b(n), nht3 = 0, ht3[18];
      for (int i = 0; i < 9; i++) {

        int index = idx2[i];
        if (isSolved(index)) {
again:
          continue;
        }

        for (int j = 0; j < count; j++) {
          if (index == idx[cell[j]]) {
            goto again;
          }
        }

        if (0 == (candidate[index] & mask)) {
          continue;
        }

        candidate[index] &= ~mask;
        changed = true;

        ht3[nht3++] = index;
        ht3[nht3++] = mask;
      }

      if (!changed) {
        continue;
      }

      //
      // State changed, output some messages.
      //

      updateCandidates();
      printClaiming(round, n, count, idx, cell, nht3, ht3);

      return true;
    }

    return false;
  }

  bool findClaiming(int round)
  {
    //
    // Find claiming pattern.
    //

    int c[9], idx[9];

    for (int i = 0; i < 9; i++) {

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

  bool findNakedSet(int c[], int idx[], int n, int round)
  {
    //
    // Find naked subset.
    //

    int pos[9];

    for (int i = 0; i < 0x1ff; i++) {

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

      int i2 = 0;
      for (int j = 0; j < 9; j++) {
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

      bool changed = false;
      int nht3 = 0, ht3[18];

      for (int j = 0; j < 9; j++) {

        int index = idx[j];
        if (isSolved(index)) {
again:
          continue;
        }

        for (int k = 0; k < n; k++) {
          if (index == pos[k]) {
            goto again;
          }
        }

        if (0 == (candidate[idx[j]] & i)) {
          continue;
        }

        ht3[nht3++] = idx[j];
        ht3[nht3++] = candidate[idx[j]] & i;

        candidate[idx[j]] &= ~i;
        changed = true;
      }

      if (!changed) {
        continue;
      }

      //
      // State changed, output some messages.
      //

      updateCandidates();
      printNakedSubset(round, n, i, pos, idx, nht3, ht3);

      return true;
    }

    return false;
  }

  bool findHiddenSet(int c[], int idx[], int n, int round)
  {
    //
    // Gather the distributions of numbers 1~9.
    //

    int count[9];
    int cell[9][9];

    for (int i = 0; i < 9; i++) {
      count[i] = getCandidateCountOfList(c, 1 + i, cell[i]);
    }

    //
    // 1, check how many numbers fit in the range n. The count must equal to n,
    // and this will be the potential subset.
    //

    int nset = 0;
    int set[9];

    for (int i = 0; i < 9; i++) {
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

    int npos = 0;
    int pos[9];

    for (int i = 0; i < nset; i++) {
      for (int j = 0; j < count[set[i]]; j++) {
        if (0 != npos) {
          bool found = false;
          for (int k = 0; k < npos; k++) {
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

    bool change = false;

    for (int i = 0; i < 9; i++) {

      int index = idx[i];
      if (isSolved(index)) {
        continue;
      }

      for (int j = 0; j < npos; j++) {
        if (i == pos[j]) {

          int mask = 0;
          for (int k = 0; k < nset; k++) {
            mask |= n2b(1 + set[k]);
          }

          int prev = candidate[index];
          candidate[index] &= mask;
          if (prev != candidate[index]) {
            change = true;
          }

          break;
        }
      }
    }

    if (!change) {
      return false;
    }

    //
    // State changed, output some messages.
    //

    updateCandidates();
    printHiddenSubset(round, n, idx, pos, set);

    return true;
  }

  bool findSet(int round)
  {
    //
    // Find subset pattern.
    //

    int c[9], idx[9];

    for (int n = 2; n <= 4; n++) {
      for (int i = 0; i < 9; i++) {

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

    for (int n = 2; n <= 4; n++) {
      for (int i = 0; i < 9; i++) {

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

  void collectStrongLinks(int n, int &cx, int x[])
  {
    int c[9], idx[9], cell[9];
    cx = 0;

    for (int row = 0; row < 9; row++) {
      getCandidateListOfRow(row, c, idx);
      if (2 == getCandidateCountOfList(c, n, cell)) {
        int i1 = idx[cell[0]], i2 = idx[cell[1]];
        if (BOX(i1) != BOX(i2)) {
          x[cx * 2 + 0] = i1;
          x[cx * 2 + 1] = i2;
          cx += 1;
        }
      }
    }

    for (int col = 0; col < 9; col++) {
      getCandidateListOfCol(col, c, idx);
      if (2 == getCandidateCountOfList(c, n, cell)) {
        int i1 = idx[cell[0]], i2 = idx[cell[1]];
        if (BOX(i1) != BOX(i2)) {
          x[cx * 2 + 0] = i1;
          x[cx * 2 + 1] = i2;
          cx += 1;
        }
      }
    }

    for (int box = 0; box < 9; box++) {
      getCandidateListOfBox(box, c, idx);
      if (2 == getCandidateCountOfList(c, n, cell)) {
        x[cx * 2 + 0] = idx[cell[0]];
        x[cx * 2 + 1] = idx[cell[1]];
        cx += 1;
      }
    }
  }

  int getXyzChainEndPoint(const XyzChainState &s, int n, int cell)
  {
    for (int i = 0; i < s.cx[n]; i++) {
      if (s.x[n][2 * i] == cell) {
        return s.x[n][2 * i + 1];
      } else if (s.x[n][2 * i + 1] == cell) {
        return s.x[n][2 * i];
      }
    }
    return -1;
  }

  void findXyzChains(XyzChainState &s)
  {
    //
    // Check is current chain valid.
    //

    if (((CHAIN_TYPE_X == s.type && 4 <= s.nChain) || (4 < s.nChain)) &&
         s.nBestChain > s.nChain && s.mask[0] == s.mask[s.nChain - 1]) {
      int nht3 = 0, ht3[18];
      int a = s.chain[0];               // Head.
      int b = s.chain[s.nChain - 1];    // Tail.
      if (BOX(a) != BOX(b) && isChanged(a, b, s.mask[0], nht3, ht3, true)) {
        s.nBestChain = s.nChain;
        memcpy(s.bestChain, s.chain, sizeof(s.bestChain));
        memcpy(s.bestMask, s.mask, sizeof(s.bestMask));
      }
    }

    //
    // Backtracking to find a XYZ chain.
    //

    for (int i = 0; i < s.nCells; i++) {
      if (s.nChain >= s.nBestChain) {   // Impossible to get shorter chain, skip.
        break;
      }
      int cell = s.cells[i];
      if (s.flags[cell]) {
        continue;
      }
      int tail = s.chain[s.nChain - 1];
      if (!hasLink(tail, cell)) {       // Has possible link?
        continue;
      }
      int mask = s.mask[s.nChain - 1];
      s.flags[cell] += 1;
      if (cell != tail && s.xymap[cell]) { // Check link of XY cell.
        s.chain[s.nChain] = cell;
        s.chain[s.nChain + 1] = cell;
        int c = s.xymap[cell];
        int mask1 = c2b(c, 1), mask2 = c2b(c, 2);
        if (mask1 == mask) {
          s.mask[s.nChain] = mask;
          s.mask[s.nChain + 1] = mask2;
          s.nChain += 2;
          findXyzChains(s);
          s.nChain -= 2;
        } else if (mask2 == mask) {
          s.mask[s.nChain] = mask;
          s.mask[s.nChain + 1] = mask1;
          s.nChain += 2;
          findXyzChains(s);
          s.nChain -= 2;
        }
      }
      if (s.xmap[cell]) {               // Check link of X link.
        int cellmask = s.xmap[cell];
        for (int j = 0; j < 9; j++) {   // Case 1: connected node can be a link of any number.
          if (CHAIN_TYPE_X == s.type || (2 <= s.nChain && s.chain[s.nChain - 2] == s.chain[s.nChain - 1])) {
            continue;
          }
          int n = n2b(1 + j);
          if (n == mask || 0 == (cellmask & n)) {
            continue;
          }
          int end = getXyzChainEndPoint(s, j, cell);
          if (-1 != end && (tail == cell || tail == end)) {
            if (tail == cell) {
              s.chain[s.nChain] = cell;
              s.chain[s.nChain + 1] = end;
            } else {
              s.chain[s.nChain] = end;
              s.chain[s.nChain + 1] = cell;
            }
            s.mask[s.nChain] = n;
            s.mask[s.nChain + 1] = n;
            s.flags[end] += 1;
            s.nChain += 2;
            findXyzChains(s);
            s.nChain -= 2;
            s.flags[end] -= 1;
          }
        }
        int end = getXyzChainEndPoint(s, b2n(mask) - 1, cell);
        if (-1 != end && end != tail) { // Case 2: dummy link with same number.
          s.chain[s.nChain] = cell;
          s.chain[s.nChain + 1] = end;
          s.mask[s.nChain] = mask;
          s.mask[s.nChain + 1] = mask;
          s.flags[end] += 1;
          s.nChain += 2;
          findXyzChains(s);
          s.nChain -= 2;
          s.flags[end] -= 1;
        }
      }
      s.flags[cell] -= 1;
    }
  }

  void findXyzChains(XyzChainState &s, int type)
  {
    s.type = type;

    //
    // Collect strong links.
    //

    for (int i = 0; i < 9; i++) {
      if (CHAIN_TYPE_XY != type) {
        collectStrongLinks(1 + i, s.cx[i], s.x[i]);
      }
    }

    for (int i = 0; i < 9; i++) {
      int n = n2b(1 + i);
      for (int j = 0; j < s.cx[i]; j++) {
        int cell1 = s.x[i][2 * j];
        int cell2 = s.x[i][2 * j + 1];
        s.xmap[cell1] |= n;
        s.xmap[cell2] |= n;
      }
    }

    //
    // Collect cells that have 2 candidates.
    //

    if (CHAIN_TYPE_X != type) {
      for (int i = 0; i < 81; i++) {
        if (2 == bc(candidate[i])) {
          s.xy[s.cxy] = i;
          s.cxy += 1;
        }
      }
    }

    for (int i = 0; i < s.cxy; i++) {
      int cell = s.xy[i];
      s.xymap[cell] = candidate[cell];
    }

    //
    // Collect candidate cells of XYZ chains.
    //

    for (int i = 0; i < 81; i++) {
      if (s.xmap[i] || s.xymap[i]) {
        s.cells[s.nCells] = i;
        s.nCells += 1;
      }
    }

    //
    // Backtracking to find a XYZ chain of start points.
    //

    s.nBestChain = 1000;
    for (int i = 0; i < s.nCells; i++) {
      int cell = s.cells[i];
      s.flags[cell] += 1;
      if (CHAIN_TYPE_X != s.type && s.xymap[cell]) {
        s.chain[s.nChain] = cell;
        s.chain[s.nChain + 1] = cell;
        int c = s.xymap[cell];
        int mask1 = c2b(c, 1), mask2 = c2b(c, 2);
        s.mask[s.nChain] = mask2;
        s.mask[s.nChain + 1] = mask1;
        s.nChain += 2;
        findXyzChains(s);
        s.nChain -= 2;
        s.mask[s.nChain] = mask1;
        s.mask[s.nChain + 1] = mask2;
        s.nChain += 2;
        findXyzChains(s);
        s.nChain -= 2;
      }
      if (CHAIN_TYPE_XY != s.type && s.xmap[cell]) {
        int mask = s.xmap[cell];
        for (int j = 0; j < 9; j++) {
          int n = n2b(1 + j);
          if (0 == (mask & n)) {
            continue;
          }
          int end = getXyzChainEndPoint(s, j, cell);
          if (-1 != end) {
            s.chain[s.nChain] = cell;
            s.chain[s.nChain + 1] = end;
            s.mask[s.nChain] = n;
            s.mask[s.nChain + 1] = n;
            s.nChain += 2;
            s.flags[end] += 1;
            findXyzChains(s);
            s.nChain -= 2;
            s.flags[end] -= 1;
          }
        }
      }
      s.flags[cell] -= 1;
    }
  }

  typedef void (KillSudoku::*PrintXyzChainsT)(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const;

  bool findXyzChains(int round, int type, PrintXyzChainsT p)
  {
    XyzChainState s = {0};
    findXyzChains(s, type);

    if (1000 != s.nBestChain) {
      int mask = s.bestMask[0], nht3 = 0, ht3[18];
      int a = s.bestChain[0];           // Head.
      int b = s.bestChain[s.nBestChain - 1]; // Tail.
      if (BOX(a) != BOX(b) && isChanged(a, b, mask, nht3, ht3)) {
        ((KillSudoku*)this->*p)(round, b2n(mask), s, nht3, ht3);
        updateCandidates();
        return true;
      }
    }

    return false;
  }

  bool findXChains(int round)
  {
    return findXyzChains(round, CHAIN_TYPE_X, &KillSudoku::printXChains);
  }

  bool findXyChains(int round)
  {
    return findXyzChains(round, CHAIN_TYPE_XY, &KillSudoku::printXyChains);
  }

  bool findXyzChains(int round)
  {
    return findXyzChains(round, CHAIN_TYPE_XYZ, &KillSudoku::printXyzChains);
  }
};

// end of ks.h

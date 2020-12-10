//
// main.cpp
// Ki11Sudoku web C API.
//
// 2020/10/8 Waync created.
//

#include <string.h>

#include <emscripten.h>

#include "../ks.h"

class KillSudokuHtml5 : public KillSudoku
{
public:

  KillSudokuHtml5(const char *pPuzzle)
  {
    int puzzle[PUZZLE_SIZE] = {0};
    for (int i = 0; i < sizeof(puzzle); i++) {
      puzzle[i] = pPuzzle[i] - '0';
    }
    memcpy(p, puzzle, sizeof(p));
    initCandidates();
  }

  virtual void printNakedSingle(int round, int i) const
  {
    EM_ASM_ARGS({
      var p = prepArray($1, PUZZLE_SIZE);
      var candidate = prepArray($2, PUZZLE_SIZE);
      var ht1 = [$3];
      var ht2 = [];
      var ht3 = [];
      var ht4 = [];
      addStep($0, 'Naked Single', p, candidate, ht1, ht2, ht3, ht4);
    }, round, p, candidate, i);
  }

  virtual void printHiddenSingle(int round, int i, int type, int idx[/*9*/]) const
  {
    EM_ASM_ARGS({
      var p = prepArray($1, PUZZLE_SIZE);
      var candidate = prepArray($2, PUZZLE_SIZE);
      var ht1 = [$3];
      var ht2 = prepArray($4, 9);
      var ht3 = [];
      var ht4 = [];
      addStep($0, 'Hidden Single', p, candidate, ht1, ht2, ht3, ht4);
    }, round, p, candidate, i, idx);
  }

  void printPointingClaiming_i(int isClaiming, int round, int n, int len, int idx[/*9*/], int cell[], int nht3, int ht3[]) const
  {
    int ht1[9];
    for (int i = 0; i < len; i++) {
      ht1[i] = idx[cell[i]];
    }
    EM_ASM_ARGS({
      var p = prepArray($1, PUZZLE_SIZE);
      var candidate = prepArray($2, PUZZLE_SIZE);
      var ht1 = prepArray($3, $4);
      var ht2 = prepArray($5, 9);
      var ht3 = prepArray($6, $7);
      var ht4 = [];
      var msg = 'Claiming';
      if (1 != $8) {
        msg = 'Pointing';
      }
      addStep($0, msg, p, candidate, ht1, ht2, ht3, ht4);
    }, round, p, candidate, ht1, len, idx, ht3, nht3, isClaiming);
  }

  virtual void printClaiming(int round, int n, int len, int idx[/*9*/], int cell[], int nht3, int ht3[]) const
  {
    printPointingClaiming_i(1, round, n, len, idx, cell, nht3, ht3);
  }

  virtual void printPointing(int round, int n, int len, int idx[/*9*/], int cell[], int nht3, int ht3[]) const
  {
    printPointingClaiming_i(0, round, n, len, idx, cell, nht3, ht3);
  }

  virtual void printNakedSubset(int round, int len, int mask, int pos[], int idx[/*9*/], int nht3, int ht3[]) const
  {
    EM_ASM_ARGS({
      var p = prepArray($1, PUZZLE_SIZE);
      var candidate = prepArray($2, PUZZLE_SIZE);
      var ht1 = prepArray($3, $4);
      var ht2 = prepArray($5, 9);
      var ht3 = prepArray($6, $7);
      var ht4 = [];
      addStep($0, 'Naked Subset', p, candidate, ht1, ht2, ht3, ht4);
    }, round, p, candidate, pos, len, idx, ht3, nht3);
  }

  virtual void printHiddenSubset(int round, int len, int idx[], int pos[], int set[], int nht3, int ht3[]) const
  {
    int ht1Pos[9] = {0};
    for (int i = 0; i < len; i++) {
      ht1Pos[i] = idx[pos[i]];
    }
    EM_ASM_ARGS({
      var p = prepArray($1, PUZZLE_SIZE);
      var candidate = prepArray($2, PUZZLE_SIZE);
      var ht1 = prepArray($3, $4);
      var ht2 = prepArray($5, 9);
      var ht3 = prepArray($6, $7);
      var ht4 = [];
      addStep($0, 'Hidden Subset', p, candidate, ht1, ht2, ht3, ht4);
    }, round, p, candidate, ht1Pos, len, idx, ht3, nht3);
  }

  virtual void printXChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    printXyzChains_i(0, round, n, s, nht3, ht3);
  }

  virtual void printXyChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    printXyzChains_i(1, round, n, s, nht3, ht3);
  }

  virtual void printXyzChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    printXyzChains_i(2, round, n, s, nht3, ht3);
  }

  void printXyzChains_i(int type, int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    int a = s.bestChain[0];             // Head.
    int b = s.bestChain[s.nBestChain - 1]; // Tail.
    int ht1[] = {a, b};
    int nht4 = 0, ht4[PUZZLE_SIZE * 2];
    for (int i = 0; i < s.nBestChain; i += 2) {
      int x = s.bestChain[i];
      int y = s.bestChain[i + 1];
      int n1 = b2n(s.bestMask[i]);
      int n2 = b2n(s.bestMask[i + 1]);
      if (x != y) {
        ht4[nht4++] = x;
        ht4[nht4++] = y;
        ht4[nht4++] = n1;
        ht4[nht4++] = n1;
      } else {
        ht4[nht4++] = x;
        ht4[nht4++] = x;
        ht4[nht4++] = n1;
        ht4[nht4++] = n2;
      }
    }
    EM_ASM_ARGS({
      var p = prepArray($1, PUZZLE_SIZE);
      var candidate = prepArray($2, PUZZLE_SIZE);
      var ht1 = prepArray($4, 2);
      var ht2 = [];
      var ht3 = prepArray($5, $6);
      var ht4 = prepArray($7, $8);
      var msg = 'X-Chains';
      if (1 == $3) {
        msg = 'XY-Chains';
      } else if (2 == $3) {
        msg = 'XYZ-Chains';
      }
      addStep($0, msg, p, candidate, ht1, ht2, ht3, ht4);
    }, round, p, candidate, type, ht1, ht3, nht3, ht4, nht4);
  }

  virtual void printPuzzle() const
  {
  }
};

class KillSudokuRating : public KillSudoku
{
public:

  mutable int m_nClaiming, m_nPointing, m_nSubset, m_nXChains, m_nXyChains, m_nXyzChains;

  KillSudokuRating(const char *pPuzzle) : m_nClaiming(0), m_nPointing(0), m_nSubset(0), m_nXChains(0), m_nXyChains(0), m_nXyzChains(0)
  {
    int puzzle[PUZZLE_SIZE] = {0};
    for (int i = 0; i < sizeof(puzzle); i++) {
      puzzle[i] = pPuzzle[i] - '0';
    }
    memcpy(p, puzzle, sizeof(p));
    initCandidates();
  }

  int getRating() const
  {
    if (!isPuzzleSolved()) {
      return 10;
    }
    if (0 < m_nXyzChains) {
      return 9;
    }
    if (0 < m_nXyChains) {
      return 8;
    }
    if (0 < m_nXChains) {
      return 7;
    }
    if (0 < m_nSubset) {
      return 6;
    }
    if (0 < m_nClaiming) {
      return 5;
    }
    if (0 < m_nPointing) {
      return 4;
    }
    return 3;
  }

  bool isPuzzleSolved() const
  {
    for (int i = 0; i < PUZZLE_SIZE; i++) {
      if (!isSolved(i)) {
        return false;
      }
    }
    return true;
  }

  virtual void printNakedSingle(int round, int i) const
  {
  }

  virtual void printHiddenSingle(int round, int i, int type, int idx[/*9*/]) const
  {
  }

  virtual void printClaiming(int round, int n, int len, int idx[/*9*/], int cell[], int nht3, int ht3[]) const
  {
    m_nClaiming += 1;
  }

  virtual void printPointing(int round, int n, int len, int idx[/*9*/], int cell[], int nht3, int ht3[]) const
  {
    m_nPointing += 1;
  }

  virtual void printNakedSubset(int round, int len, int mask, int pos[], int idx[/*9*/], int nht3, int ht3[]) const
  {
    m_nSubset += 1;
  }

  virtual void printHiddenSubset(int round, int len, int idx[], int pos[], int set[], int nht3, int ht3[]) const
  {
    m_nSubset += 1;
  }

  virtual void printXChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    m_nXChains += 1;
  }

  virtual void printXyChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    m_nXyChains += 1;
  }

  virtual void printXyzChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    m_nXyzChains += 1;
  }

  virtual void printPuzzle() const
  {
  }
};

extern "C" {

int EMSCRIPTEN_KEEPALIVE cGetPuzzleRating(const char *pPuzzle)
{
  KillSudokuRating p(pPuzzle);
  p.solve();
  return p.getRating();
}

int EMSCRIPTEN_KEEPALIVE cIsEditPuzzleValid(const char *pPuzzle, int pi, int n)
{
  KillSudokuHtml5 p(pPuzzle);
  if (0 != (p.candidate[pi] & p.n2b(n))) {
    return 1;
  } else {
    return 0;
  }
}

int EMSCRIPTEN_KEEPALIVE cPrintInitPuzzle(const char *pPuzzle)
{
  KillSudokuHtml5 p(pPuzzle);
  EM_ASM_ARGS({
    var p = prepArray($0, PUZZLE_SIZE);
    var candidate = prepArray($1, PUZZLE_SIZE);
    renderStep(ctx, p, candidate, [], [], [], []);
  }, p.p, p.candidate);
  return 1;
}

int EMSCRIPTEN_KEEPALIVE cSolve(const char *pPuzzle)
{
  KillSudokuHtml5 p(pPuzzle);
  p.solve();
  return 1;
}

} // extern "C"

int main(int argc, char* argv[])
{
  emscripten_exit_with_live_runtime();
}

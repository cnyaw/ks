#include "stdafx.h"

#include "ks.h"

class KillSudokuConsole : public KillSudoku
{
public:

  KillSudokuConsole(int _p[]) : KillSudoku(_p)
  {
  }

  virtual void printNakedSingle(int round, int i) const
  {
    printf("%d, Naked single: %c%d = %d\n", round, 'a' + COL(i), 1 + ROW(i), p[i]);
  }

  virtual void printHiddenSingle(int round, int i, int type, int idx[/*9*/]) const
  {
    static const char *stype[] = {"box", "col", "row"};
    printf("%d, Hidden single(%s): %c%d = %d\n", round, stype[type], 'a' + COL(i), 1 + ROW(i), p[i]);
  }

  virtual void printPointing(int round, int n, int len, int idx[], int cell[], int nht3, int ht3[]) const
  {
    printf("%d, Pointing: ", round);
    for (int i = 0; i < len; i++) {
      int index = idx[cell[i]];
      printf("%c%d ", 'a' + COL(index), 1 + ROW(index));
    }
    printf("(%d)\n", n);
  }

  virtual void printClaiming(int round, int n, int len, int idx[], int cell[], int nht3, int ht3[]) const
  {
    printf("%d, Claiming: ", round);
    for (int i = 0; i < len; i++) {
      int index = idx[cell[i]];
      printf("%c%d ", 'a' + COL(index), 1 + ROW(index));
    }
    printf("(%d)\n", n);
  }

  virtual void printNakedSubset(int round, int len, int mask, int pos[], int idx[/*9*/], int nht3, int ht3[]) const
  {
    printf("%d, Naked subset: ", round);
    for (int i = 0; i < len; i++) {
      int index = pos[i];
      printf("%c%d ", 'a' + COL(index), 1 + ROW(index));
    }
    printf("(");
    for (int i = 0; i < 9; i++) {
      if (mask & (1 << i)) {
        printf("%d", 1 + i);
      }
    }
    printf(")\n");
  }

  virtual void printHiddenSubset(int round, int len, int idx[], int pos[], int set[]) const
  {
    printf("%d, Hidden subset: ", round);
    for (int i = 0; i < len; i++) {
      int index = idx[pos[i]];
      printf("%c%d ", 'a' + COL(index), 1 + ROW(index));
    }
    printf("(");
    for (int i = 0; i < len; i++) {
      printf("%d", 1 + set[i]);
    }
     printf(")\n");
  }

  virtual void printXWing(int round, int n, int a1, int a2, int b1, int b2, int *idx/*18*/, int nht3, int ht3[]) const
  {
    printf("%d, X-Wings: ", round);
    printf("%c%d-%c%d, %c%d-%c%d ", 'a' + COL(a1), 1 + ROW(a1), 'a' + COL(a2), 1 + ROW(a2), 'a' + COL(b1), 1 + ROW(b1), 'a' + COL(b2), 1 + ROW(b2));
    printf("(%d)\n", n);
  }

  virtual void printXyWing(int round, int n, int a, int b, int c, int nht3, int ht3[]) const
  {
    printf("%d, XY-Wings: ", round);
    printf("%c%d ", 'a' + COL(a), 1 + ROW(a));
    printf("%c%d ", 'a' + COL(b), 1 + ROW(b));
    printf("%c%d ", 'a' + COL(c), 1 + ROW(c));
    printf("(%d)\n", n);
  }

  virtual void printXyzWing(int round, int n, int a, int b, int c, int nht3, int ht3[]) const
  {
    printf("%d, XYZ-Wings: ", round);
    printf("%c%d ", 'a' + COL(a), 1 + ROW(a));
    printf("%c%d ", 'a' + COL(b), 1 + ROW(b));
    printf("%c%d ", 'a' + COL(c), 1 + ROW(c));
    printf("(%d)\n", n);
  }

  virtual void printWWing(int round, int n, int a1, int a2, int b1, int b2, int nht3, int ht3[]) const
  {
    printf("%d, W-Wings: ", round);
    printf("%c%d ", 'a' + COL(a1), 1 + ROW(a1));
    printf("%c%d ", 'a' + COL(a2), 1 + ROW(a2));
    printf("(%d)\n", n);
  }

  virtual void printXChains(int round, int n, int link[], int len, int chain[], int a, int b, int nht3, int ht3[]) const
  {
    printf("%d, X-Chains: ", round);
    for (int i = 0; i < len; i++) {
      printf(
        "%c%d-%c%d ",
        'a' + COL(link[2 * chain[i]]),
        1 + ROW(link[2 * chain[i]]),
        'a' + COL(link[2 * chain[i] + 1]),
        1 + ROW(link[2 * chain[i] + 1]));
    }
    printf("(%d)\n", n);
  }

  virtual void printXyChains(int round, int n, XyChainState const& s, int nht3, int ht3[]) const
  {
    printf("%d, XY-Chains: ", round);
    for (int i = 0; i < s.nChain; i++) {
      printf(
        "%c%d ",
        'a' + COL(s.chain[i]),
        1 + ROW(s.chain[i]));
    }
    printf("(%d)\n", n);
  }

  virtual void printPuzzle() const
  {
    //
    // Display puzzle with candidates.
    //
#if 0
    printf("  ");
    for (int c = 0; c < 9; c++) {
      printf(" %c  ", 'a' + c);
    }
    printf("\n");

    int i = 0, savi;
    for (int r = 0; r < 9; r++) {

      savi = i;
      for (int loop = 0; loop < 3; loop++) {

        if (1 == loop) {
          printf("%d ", 1 + r);
        } else {
          printf("  ");
        }

        i = savi;

        for (int c = 0; c < 9; c++, i++) {

          if (isSolved(i)) {
            if (1 == loop) {
              printf(" %d ", p[i]);
            } else {
              printf("   ");
            }
            if (8 != c) {
              printf("|");
            }
            continue;
          }

          for (int n = 0; n < 3; n++) {
            if (candidate[i] & (1 << (3 * loop + n))) {
              printf("%d", 1 + 3 * loop + n);
            } else {
              printf(".");
            }
          }

          if (8 != c) {
            printf("|");
          }
        }

        printf("\n");
      }

      printf("  ");
      for (int j = 0; j < 4 * 9 - 1; j++) {
        if (j && 3 == (j % 4)) {
          printf("+");
        } else {
          printf("-");
        }
      }
      printf("\n");
    }

    printf("\n");
#endif
  }
};

int _tmain(int argc, _TCHAR* argv[])
{
  FILE *f = fopen("puzzle.txt", "rt");
  if (0 == f) {
    printf("open 'puzzle.txt' failed\n");
    return 0;
  }

  int type = 0;
  fscanf(f, "%d\n", &type);

  int puzzle[81] = {0};

  switch (type)
  {
  case 0:                               // Open sudoku format.
    {
      char ps[512];
      fscanf(f, "%s\n", ps);
      for (int i = 0; i < 81 && i < (int)strlen(ps); i++) {
        puzzle[i] = ps[i] - '0';
      }
    }
    break;
  case 1:                               // Classic format.
    for (int i = 0; i < 81; i++) {
      fscanf(f, "%d,", &puzzle[i]);
      if (i && 0 == (i % 9)) {
        fscanf(f, "\n");
      }
    }
    break;
  }

  fclose(f);

  KillSudokuConsole p(puzzle);
  p.printPuzzle();

  p.solve();

  return 0;
}
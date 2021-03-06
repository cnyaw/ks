
//
// KillSudoku.h
// KillSudoku JNI implementation.
//
// Copyright (c) 2016 Waync Cheng.
// All Rights Reserved.
//
// 2016/7/16 Waync Cheng.
//

#include <string.h>

#include <jni.h>

#define JNI_ACTIVITY "weilican/ks/GameActivity"
#define JNI_NEW_PUZZLE_ACTIVITY "weilican/ks/EditActivity"

JNIEnv *tmpEnv;

#include "../../ks.h"

class KillSudokuAndroid : public KillSudoku
{
public:

  KillSudokuAndroid(int _p[]) : KillSudoku(_p)
  {
  }

  jintArray getIntArray(int len, const int *buff) const
  {
    jintArray ia = tmpEnv->NewIntArray(len);
    tmpEnv->SetIntArrayRegion(ia, 0, len, (const jint*)buff);
    return ia;
  }

  jintArray getPuzzleIntArray() const
  {
    return getIntArray(PUZZLE_SIZE, (const int*)&p);
  }

  jintArray getCandidateIntArray() const
  {
    return getIntArray(PUZZLE_SIZE, (const int*)&candidate);
  }

  void init() const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printInitPuzzle", "([I[I)V");
    if (mid) {
      tmpEnv->CallStaticVoidMethod(cls, mid, getPuzzleIntArray(), getCandidateIntArray());
    }
  }

  virtual void printNakedSingle(int round, int i) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printNakedSingle", "(I[I[II)V");
    if (!mid) {
      return;
    }
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), i);
  }

  virtual void printHiddenSingle(int round, int i, int type, int idx[/*9*/]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printHiddenSingle", "(I[I[II[I)V");
    if (!mid) {
      return;
    }
    jintArray iaHt2 = getIntArray(9, (const int*)idx);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), i, iaHt2);
  }

  void printPointingClaiming(jclass cls, jmethodID mid, int round, int len, int idx[/*9*/], int cell[], int nht3, int ht3[]) const
  {
    int ht1[9];
    for (int i = 0; i < len; i++) {
      ht1[i] = idx[cell[i]];
    }
    jintArray iaHt1 = getIntArray(len, ht1);
    jintArray iaHt2 = getIntArray(9, (const int*)idx);
    jintArray iaHt3 = getIntArray(nht3, (const int*)ht3);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), iaHt1, iaHt2, iaHt3);
  }

  virtual void printPointing(int round, int n, int len, int idx[/*9*/], int cell[], int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printPointing", "(I[I[I[I[I[I)V");
    if (!mid) {
      return;
    }
    printPointingClaiming(cls, mid, round, len, idx, cell, nht3, ht3);
  }

  virtual void printClaiming(int round, int n, int len, int idx[/*9*/], int cell[], int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printClaiming", "(I[I[I[I[I[I)V");
    if (!mid) {
      return;
    }
    printPointingClaiming(cls, mid, round, len, idx, cell, nht3, ht3);
  }

  virtual void printNakedSubset(int round, int len, int mask, int pos[], int idx[/*9*/], int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printNakedSubset", "(I[I[I[I[I[I)V");
    if (!mid) {
      return;
    }
    jintArray iaHt1 = getIntArray(len, pos);
    jintArray iaHt2 = getIntArray(9, (const int*)idx);
    jintArray iaHt3 = getIntArray(nht3, (const int*)ht3);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), iaHt1, iaHt2, iaHt3);
  }

  virtual void printHiddenSubset(int round, int len, int idx[], int pos[], int set[], int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printHiddenSubset", "(I[I[I[I[I[I)V");
    if (!mid) {
      return;
    }
    int ht1Pos[9] = {0};
    for (int i = 0; i < len; i++) {
      ht1Pos[i] = idx[pos[i]];
    }
    jintArray iaHt1 = getIntArray(len, ht1Pos);
    jintArray iaHt2 = getIntArray(9, (const int*)idx);
    jintArray iaHt3 = getIntArray(nht3, (const int*)ht3);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), iaHt1, iaHt2, iaHt3);
  }

  virtual void printXChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printXChains", "(I[I[III[I[I)V");
    if (!mid) {
      return;
    }
    printXyzChains(cls, mid, round, n, s, nht3, ht3);
  }

  virtual void printXyChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printXyChains", "(I[I[III[I[I)V");
    if (!mid) {
      return;
    }
    printXyzChains(cls, mid, round, n, s, nht3, ht3);
  }

  void printXyzChains(jclass cls, jmethodID mid, int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    int a = s.bestChain[0];             // Head.
    int b = s.bestChain[s.nBestChain - 1]; // Tail.
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
    jintArray iaHt3 = getIntArray(nht3, (const int*)ht3);
    jintArray iaHt4 = getIntArray(nht4, (const int*)ht4);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), a, b, iaHt3, iaHt4);
  }

  virtual void printXyzChains(int round, int n, XyzChainState const& s, int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printXyzChains", "(I[I[III[I[I)V");
    if (!mid) {
      return;
    }
    printXyzChains(cls, mid, round, n, s, nht3, ht3);
  }

  virtual void printPuzzle() const
  {
  }
};

extern "C" {

JNIEXPORT void JNICALL Java_weilican_ks_GameActivity_ksSolve(JNIEnv * env, jobject obj, jstring pPuzzle)
{
  if (!pPuzzle) {
    return;
  }

  const char* strPuzzle = env->GetStringUTFChars(pPuzzle, (jboolean *)0);

  int puzzle[PUZZLE_SIZE] = {0};
  for (int i = 0; i < PUZZLE_SIZE && i < (int)strlen(strPuzzle); i++) {
    puzzle[i] = strPuzzle[i] - '0';
  }

  tmpEnv = env;
  KillSudokuAndroid p(puzzle);
  p.init();
  p.solve();
}

JNIEXPORT void JNICALL Java_weilican_ks_EditActivity_ksCheck(JNIEnv * env, jobject obj, jstring pPuzzle)
{
  if (!pPuzzle) {
    return;
  }

  tmpEnv = env;

  const char* strPuzzle = tmpEnv->GetStringUTFChars(pPuzzle, (jboolean *)0);
  int puzzle[PUZZLE_SIZE] = {0};
  for (int i = 0; i < PUZZLE_SIZE && i < (int)strlen(strPuzzle); i++) {
    puzzle[i] = strPuzzle[i] - '0';
  }

  KillSudokuAndroid p(puzzle);
  p.updateCandidates();

  jclass cls = tmpEnv->FindClass(JNI_NEW_PUZZLE_ACTIVITY);
  jmethodID mid = tmpEnv->GetStaticMethodID(cls, "validatePuzzle", "([I[I)V");
  if (mid) {
    tmpEnv->CallStaticVoidMethod(cls, mid, p.getPuzzleIntArray(), p.getCandidateIntArray());
  }
}

} // extern "C"

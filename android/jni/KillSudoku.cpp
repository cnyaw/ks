
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

#define PUZZLE_SIZE 81

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

  virtual void printHiddenSubset(int round, int len, int idx[], int pos[], int set[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printHiddenSubset", "(I[I[I)V");
    if (!mid) {
      return;
    }
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray());
  }

  virtual void printXWing(int round, int n, int a1, int a2, int b1, int b2, int *idx/*18*/, int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printXWing", "(I[I[I[I[I[I[I)V");
    if (!mid) {
      return;
    }
    int ht1[] = {a1, a2, b1, b2};
    int ht4[] = {a1, b2, n, a2, b1, n};
    jintArray iaHt1 = getIntArray(sizeof(ht1)/sizeof(int), (const int*)ht1);
    jintArray iaHt2 = getIntArray(18, (const int*)idx);
    jintArray iaHt3 = getIntArray(nht3, (const int*)ht3);
    jintArray iaHt4 = getIntArray(sizeof(ht4)/sizeof(int), (const int*)ht4);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), iaHt1, iaHt2, iaHt3, iaHt4);
  }

  virtual void printXyWing(int round, int n, int a, int b, int c, int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printXyWing", "(I[I[I[I[I)V");
    if (!mid) {
      return;
    }
    int ht1[] = {a, b, c};
    jintArray iaHt1 = getIntArray(sizeof(ht1)/sizeof(int), (const int*)ht1);
    jintArray iaHt3 = getIntArray(nht3, (const int*)ht3);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), iaHt1, iaHt3);
  }

  virtual void printXyzWing(int round, int n, int a, int b, int c, int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printXyzWing", "(I[I[I[I[I)V");
    if (!mid) {
      return;
    }
    int ht1[] = {a, b, c};
    jintArray iaHt1 = getIntArray(sizeof(ht1)/sizeof(int), (const int*)ht1);
    jintArray iaHt3 = getIntArray(nht3, (const int*)ht3);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), iaHt1, iaHt3);
  }

  virtual void printWWing(int round, int n, int a1, int a2, int b1, int b2, int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printWWing", "(I[I[IIIII[I[I)V");
    if (!mid) {
      return;
    }
    int n2 = b2n(candidate[a1] ^ n2b(n));
    int ht4[] = {a1, b1, n2, a2, b2, n2};
    if (COL(a1) != COL(b1) && ROW(a1) != ROW(b1)) {
      ht4[1] = b2;
      ht4[4] = b1;
    }
    jintArray iaHt3 = getIntArray(nht3, (const int*)ht3);
    jintArray iaHt4 = getIntArray(sizeof(ht4)/sizeof(int), (const int*)ht4);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), a1, a2, b1, b2, iaHt3, iaHt4);
  }

  virtual void printXChains(int round, int n, int link[], int len, int chain[], int a, int b, int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printXChains", "(I[I[I[I[I[I)V");
    if (!mid) {
      return;
    }
    int ht1[] = {a, b};
    int nht4 = 0, ht4[81];
    for (int i = 0; i < len; i++) {
      ht4[nht4++] = link[2 * chain[i]];
      ht4[nht4++] = link[2 * chain[i] + 1];
      ht4[nht4++] = n;
    }
    jintArray iaHt1 = getIntArray(sizeof(ht1)/sizeof(int), (const int*)ht1);
    jintArray iaHt3 = getIntArray(nht3, (const int*)ht3);
    jintArray iaHt4 = getIntArray(nht4, (const int*)ht4);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), iaHt1, iaHt3, iaHt4);
  }

  virtual void printXyChains(int round, int n, XyChainState const& s, int nht3, int ht3[]) const
  {
    jclass cls = tmpEnv->FindClass(JNI_ACTIVITY);
    jmethodID mid = tmpEnv->GetStaticMethodID(cls, "printXyChains", "(I[I[III[I[I)V");
    if (!mid) {
      return;
    }
    int a = s.chain[0];                 // Head.
    int b = s.chain[s.nChain - 1];      // Tail.
    int nht4 = 0, ht4[81 * 2];
    int mask = s.mask;
    for (int i = 0; i < s.nChain - 1; i++) {
      ht4[nht4++] = s.chain[i];
      ht4[nht4++] = s.chain[i + 1];
      int c = candidate[s.chain[i]];
      int l1 = c2b(c, 1), l2 = c2b(c, 2);
      int mask1 = l1 == mask ? l2 : l1;
      if (0 == mask1) {
        c = candidate[s.chain[i + 1]];
        l1 = c2b(c, 1), l2 = c2b(c, 2);
        mask1 = l1 == mask ? l2 : l1;
      }
      ht4[nht4++] = b2n(mask1);
      mask = mask1;
    }
    jintArray iaHt3 = getIntArray(nht3, (const int*)ht3);
    jintArray iaHt4 = getIntArray(nht4, (const int*)ht4);
    tmpEnv->CallStaticVoidMethod(cls, mid, round, getPuzzleIntArray(), getCandidateIntArray(), a, b, iaHt3, iaHt4);
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

  int puzzle[81] = {0};
  for (int i = 0; i < 81 && i < (int)strlen(strPuzzle); i++) {
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
  int puzzle[81] = {0};
  for (int i = 0; i < 81 && i < (int)strlen(strPuzzle); i++) {
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
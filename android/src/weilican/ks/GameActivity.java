
//
// GameActivity.java
// KillSudoku game acvivity implementation.
//
// Copyright (c) 2016 Waync Cheng.
// All Rights Reserved.
//
// 2016/7/16 Waync Cheng.
//

package weilican.ks;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.BaseAdapter;
import android.widget.ListView;
import android.widget.TextView;
import java.util.ArrayList;

public class GameActivity extends Activity
{
  static final public int PATTERN_NAKED_SINGLE = 1;
  static final public int PATTERN_HIDDEN_SINGLE = 2;
  static final public int PATTERN_POINTING = 4;
  static final public int PATTERN_CLAIMING = 8;
  static final public int PATTERN_NAKED_SUBSET = 16;
  static final public int PATTERN_HIDDEN_SUBSET = 32;
  static final public int PATTERN_X_CHAINS = 64;
  static final public int PATTERN_XY_CHAINS = 128;
  static final public int PATTERN_XYZ_CHAINS = 256;

  static GameActivity This;

  int position;                         // Listview position.
  int pattern;                          // Pattern mask of steps.

  static class SolvingStep
  {
    String title;
    int puzzle[];
    int candidate[];
    int ht1[] = null;
    int ht2[] = null;
    int ht3[] = null;
    int ht4[] = null;

    public SolvingStep(String title, int puzzle[], int candidate[]) {
      this.title = title;
      this.puzzle = puzzle;
      this.candidate = candidate;
    }
  }

  class MyAdapter extends BaseAdapter
  {
    LayoutInflater inflater;
    ArrayList<SolvingStep> steps;

    public MyAdapter(Context context, ArrayList<SolvingStep> steps) {
      inflater = LayoutInflater.from(context);
      this.steps = steps;
    }

    @Override
    public int getCount() {
      return steps.size();
    }

    @Override
    public Object getItem(int arg0) {
      return steps.get(arg0);
    }

    @Override
    public long getItemId(int position) {
      return steps.indexOf(getItem(position));
    }

    @Override
     public boolean areAllItemsEnabled() {
       return false;
     }

     @Override
     public boolean isEnabled(int position) {
       return false;
     }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
      View v = convertView;
      if (null == convertView) {
        v = inflater.inflate(R.layout.step_list_item, null);
      }
      TextView title = (TextView)v.findViewById(R.id.title);
      SudokuView puzzle = (SudokuView)v.findViewById(R.id.puzzle);
      SolvingStep step = (SolvingStep)getItem(position);
      title.setText(step.title);
      puzzle.puzzle = step.puzzle;
      puzzle.candidate = step.candidate;
      puzzle.ht1 = step.ht1;
      puzzle.ht2 = step.ht2;
      puzzle.ht3 = step.ht3;
      puzzle.ht4 = step.ht4;
      return v;
    }
  }

  ArrayList<SolvingStep> steps = new ArrayList<SolvingStep>();
  MyAdapter adapter;

  @Override
  public void onCreate(Bundle savedInstanceState)
  {
    super.onCreate(savedInstanceState);

    ListView listView = new ListView(this);
    setContentView(listView);

    adapter = new MyAdapter(this, steps);
    listView.setAdapter(adapter);

    This = this;

    Intent intent = getIntent();
    position = intent.getIntExtra("position", -1);
    pattern = 0;

    ksSolve(intent.getStringExtra("puzzle"));
  }

  @Override
  public void onBackPressed() {
    Intent output = new Intent();
    output.putExtra("position", position);
    output.putExtra("pattern", pattern);
    setResult(RESULT_OK, output);
    finish();
  }

  void addStep(SolvingStep step) {
    steps.add(step);
    adapter.notifyDataSetChanged();
  }

  //
  // JNI.
  //

  static void printInitPuzzle(int puzzle[], int candidate[])
  {
    This.addStep(new SolvingStep("0, Initial State", puzzle, candidate));
  }

  static void printNakedSingle(int round, int puzzle[], int candidate[], int i)
  {
    SolvingStep s = new SolvingStep(round + ", Naked Single", puzzle, candidate);
    s.ht1 = new int[] {i};
    This.addStep(s);
    This.pattern |= PATTERN_NAKED_SINGLE;
  }

  static void printHiddenSingle(int round, int puzzle[], int candidate[], int i, int idx[])
  {
    SolvingStep s = new SolvingStep(round + ", Hidden Single", puzzle, candidate);
    s.ht1 = new int[] {i};
    s.ht2 = idx;
    This.addStep(s);
    This.pattern |= PATTERN_HIDDEN_SINGLE;
  }

  static void printPointing(int round, int puzzle[], int candidate[], int ht1[], int ht2[], int ht3[])
  {
    SolvingStep s = new SolvingStep(round + ", Pointing", puzzle, candidate);
    s.ht1 = ht1;
    s.ht2 = ht2;
    s.ht3 = ht3;
    This.addStep(s);
    This.pattern |= PATTERN_POINTING;
  }

  static void printClaiming(int round, int puzzle[], int candidate[], int ht1[], int ht2[], int ht3[])
  {
    SolvingStep s = new SolvingStep(round + ", Claiming", puzzle, candidate);
    s.ht1 = ht1;
    s.ht2 = ht2;
    s.ht3 = ht3;
    This.addStep(s);
    This.pattern |= PATTERN_CLAIMING;
  }

  static void printNakedSubset(int round, int puzzle[], int candidate[], int ht1[], int ht2[], int ht3[])
  {
    SolvingStep s = new SolvingStep(round + ", Naked Subset", puzzle, candidate);
    s.ht1 = ht1;
    s.ht2 = ht2;
    s.ht3 = ht3;
    This.addStep(s);
    This.pattern |= PATTERN_NAKED_SUBSET;
  }

  static void printHiddenSubset(int round, int puzzle[], int candidate[])
  {
    This.addStep(new SolvingStep(round + ", Hidden Subset", puzzle, candidate));
    This.pattern |= PATTERN_HIDDEN_SUBSET;
  }

  static void printXChains(int round, int puzzle[], int candidate[], int a, int b, int ht3[], int ht4[])
  {
    SolvingStep s = new SolvingStep(round + ", X-Chains", puzzle, candidate);
    s.ht1 = new int[] {a, b};
    s.ht3 = ht3;
    s.ht4 = ht4;
    This.addStep(s);
    This.pattern |= PATTERN_X_CHAINS;
  }

  static void printXyChains(int round, int puzzle[], int candidate[], int a, int b, int ht3[], int ht4[])
  {
    SolvingStep s = new SolvingStep(round + ", XY-Chains", puzzle, candidate);
    s.ht1 = new int[] {a, b};
    s.ht3 = ht3;
    s.ht4 = ht4;
    This.addStep(s);
    This.pattern |= PATTERN_XY_CHAINS;
  }

  static void printXyzChains(int round, int puzzle[], int candidate[], int a, int b, int ht3[], int ht4[])
  {
    SolvingStep s = new SolvingStep(round + ", XYZ-Chains", puzzle, candidate);
    s.ht1 = new int[] {a, b};
    s.ht3 = ht3;
    s.ht4 = ht4;
    This.addStep(s);
    This.pattern |= PATTERN_XYZ_CHAINS;
  }

  static native void ksSolve(String puzzle);
}


//
// EditActivity.java
// KillSudoku edit puzzle acvivity implementation.
//
// Copyright (c) 2016 Waync Cheng.
// All Rights Reserved.
//
// 2016/7/22 Waync Cheng.
//

package weilican.ks;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.widget.Button;
import android.widget.Toast;

public class EditActivity extends Activity implements View.OnTouchListener
{
  static SudokuView view;

  int position;
  int sel;
  Button btn[] = new Button[9];
  long back_pressed;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    setContentView(R.layout.new_puzzle);

    view = (SudokuView)findViewById(R.id.puzzle);
    view.setOnTouchListener(new OnTouchListener() {
      @Override
      public boolean onTouch(View v, MotionEvent event) {
        if (MotionEvent.ACTION_DOWN != event.getAction()) {
          return false;
        }
        int col = (int)(event.getX() / (1 + view.cellw));
        int row = (int)(event.getY() / (1 + view.cellw));
        int i = 9 * row + col;
        if (0 != view.puzzle[i]) {
          view.puzzle[i] = 0;
        } else if (0 != (view.candidate[i] & (1 << (sel - 1)))) {
          view.puzzle[i] = sel;
        } else {
          return true;
        }
        String puzzle = "";
        for (i = 0; i < view.puzzle.length; i++) {
          puzzle += "" + view.puzzle[i];
        }
        ksCheck(puzzle);
        return true;
      }
    });

    Intent intent = getIntent();

    position = intent.getIntExtra("position", -1);
    String puzzle = intent.getStringExtra("puzzle");

    if (-1 != position && null != puzzle) {
      ksCheck(puzzle);
    } else {
      ksCheck("");
    }

    btn[0] = (Button)findViewById(R.id.one);
    btn[1] = (Button)findViewById(R.id.two);
    btn[2] = (Button)findViewById(R.id.three);
    btn[3] = (Button)findViewById(R.id.four);
    btn[4] = (Button)findViewById(R.id.five);
    btn[5] = (Button)findViewById(R.id.six);
    btn[6] = (Button)findViewById(R.id.seven);
    btn[7] = (Button)findViewById(R.id.eight);
    btn[8] = (Button)findViewById(R.id.nine);

    for (int i = 0; i < btn.length; i++) {
      btn[i].setOnTouchListener(this);
      btn[i].setTag("" + (1 + i));
    }

    btn[0].setPressed(true);
    sel = 1;
  }

  @Override
  public boolean onTouch(View v, MotionEvent event) {
    if (MotionEvent.ACTION_DOWN != event.getAction()) {
      return true;
    }
    for (int i = 0; i < btn.length; i++) {
      btn[i].setPressed(false);
    }
    v.setPressed(true);
    sel = ((String)v.getTag()).charAt(0) - '0';
    return true;
  }

  @Override
  public void onBackPressed() {
    int count = 0;
    String puzzle = "";
    for (int i = 0; i < view.puzzle.length; i++) {
      puzzle += "" + view.puzzle[i];
      if (0 != view.puzzle[i]) {
        count += 1;
      }
    }

    if (17 > count && System.currentTimeMillis() > back_pressed + 2000) {
      Toast.makeText(this, "Need at least 17 cells filled! Press back again to exit!", Toast.LENGTH_SHORT).show();
      back_pressed = System.currentTimeMillis();
      return;
    }

    Intent output = new Intent();
    if (-1 != position) {
      output.putExtra("position", position);
    }
    output.putExtra("puzzle", puzzle);
    setResult(RESULT_OK, output);
    finish();
  }

  @Override
  public void onResume() {
    super.onResume();
    btn[sel - 1].setPressed(true);
  }

  //
  // JNI.
  //

  static void validatePuzzle(int puzzle[], int candidate[]) {
    view.puzzle = puzzle;
    view.candidate = candidate;
    view.invalidate();
  }

  static native void ksCheck(String puzzle);
}

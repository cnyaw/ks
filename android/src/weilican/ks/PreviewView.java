
//
// PreviewView.java
// Sudoku puzzle list preview implementation.
//
// Copyright (c) 2016 Waync Cheng.
// All Rights Reserved.
//
// 2016/7/21 Waync Cheng.
//

package weilican.ks;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.view.View;
import android.util.AttributeSet;

public class PreviewView extends View
{
  float puzzlew = 180;
  float cellw = (puzzlew / 9) - 1;
  float charw = cellw / 3;

  String puzzle;

  int COL(int i) {
    return i % 9;
  }

  int ROW(int i) {
    return i / 9;
  }

  public PreviewView(Context context, AttributeSet attrs) {
    super(context, attrs);
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    setMeasuredDimension((int)puzzlew + 1, (int)puzzlew + 1);
  }

  @Override
  protected void onDraw(Canvas canvas) {
    super.onDraw(canvas);

    Paint paint = new Paint();

    paint.setStyle(Paint.Style.FILL);
    paint.setColor(Color.rgb(255,255,240));
    canvas.drawRect(0, 0, puzzlew, puzzlew, paint);

    paint.setTextAlign(Paint.Align.CENTER);
    paint.setStrokeWidth(0);
    paint.setColor(Color.BLACK);
    paint.setTextSize(cellw);

    //
    // Draw cells.
    //

    for (int i = 0; i < 81 && i < puzzle.length(); i++) {
      if ('0' != puzzle.charAt(i)) {
        float x = COL(i) * (1 + cellw), y = ROW(i) * (1 + cellw);
        fillText(canvas, "" + puzzle.charAt(i), x, y + 1, cellw, paint);
      }
    }

    //
    // Draw grids.
    //

    for (int i = 1; i < 9; i++) {
      if (0 == (i % 3)) {
        paint.setColor(Color.BLACK);
      } else {
        paint.setColor(Color.LTGRAY);
      }
      float x = i * (1 + cellw), y = i * (1 + cellw);
      canvas.drawLine(x, 0, x, puzzlew, paint);
      canvas.drawLine(0, y, puzzlew, y, paint);
    }

    paint.setColor(Color.BLACK);
    paint.setStyle(Paint.Style.STROKE);
    canvas.drawRect(0, 0, puzzlew, puzzlew, paint);
  }

  void fillText(Canvas canvas, String s, float x, float y, float cw, Paint paint) {
    float cx = cw / 2;
    float cy = (cw - (paint.descent() + paint.ascent())) / 2;
    canvas.drawText(s, x + cx, y + cy, paint);
  }
}


//
// SudokuView.java
// Sudoku view implementation.
//
// Copyright (c) 2016 Waync Cheng.
// All Rights Reserved.
//
// 2016/7/17 Waync Cheng.
//

package weilican.ks;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Rect;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import android.util.AttributeSet;

public class SudokuView extends View
{
  float puzzlew;
  float cellw;
  float charw;

  int puzzle[];
  int candidate[];
  int ht1[] = null;
  int ht2[] = null;
  int ht3[] = null;                     // Reduced candidates: (idx,mask)*
  int ht4[] = null;                     // Links: (a,b,n)*

  int tCOL[], tROW[], tBOX[];

  int COL(int i) {
    return tCOL[i];
  }

  int ROW(int i) {
    return tROW[i];
  }

  int BOX(int i) {
    return tBOX[i];
  }

  int n2b(int n)
  {
    //
    // Convert number(1~9) to bit mask.
    //

    return 1 << (n - 1);
  }

  public SudokuView(Context context, AttributeSet attrs) {
    super(context, attrs);
    WindowManager wm = (WindowManager)context.getSystemService(Context.WINDOW_SERVICE);
    Display display = wm.getDefaultDisplay();
    int w = display.getWidth();
    int h = display.getHeight();
    if (h > w) {
      puzzlew = w - 50;
    } else {
      puzzlew = h - 50;
    }
    cellw = (puzzlew / 9) - 1;
    charw = cellw / 3;
    tCOL = new int[81];
    tROW = new int[81];
    tBOX = new int[81];
    for (int i = 0; i < 81; i++) {
      tCOL[i] = i % 9;
      tROW[i] = i / 9;
      tBOX[i] = 3 * (tROW[i] / 3) + (tCOL[i] / 3);
    }
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    setMeasuredDimension((int)puzzlew, (int)puzzlew);
  }

  void drawLink(Canvas canvas, float x0, float y0, float x1, float y1, Paint paint) {
    canvas.drawLine(x0 + charw/2, y0 + charw/2, x1 + charw/2, y1 + charw/2, paint);
  }

  protected void onDraw(Canvas canvas) {
    super.onDraw(canvas);

    Paint paint = new Paint();

    paint.setStyle(Paint.Style.FILL);
    paint.setColor(Color.rgb(255,255,240));
    canvas.drawRect(0, 0, puzzlew, puzzlew, paint);

    paint.setTextAlign(Paint.Align.CENTER);
    paint.setStrokeWidth(3);

    //
    // Draw cells.
    //

    for (int i = 0; i < 81; i++) {

      float x = COL(i) * (1 + cellw), y = ROW(i) * (1 + cellw);

      if (!checkAndFillHtCell(ht1, i, canvas, x, y, Color.rgb(182,255,0), paint)) {
        checkAndFillHtCell(ht2, i, canvas, x, y, Color.rgb(248,255,144), paint);
      }

      if (0 != puzzle[i]) {

        //
        // Draw fixed cells.
        //

        paint.setColor(Color.BLACK);
        paint.setTextSize(cellw - 8);

        fillText(canvas, "" + puzzle[i], x, y, cellw, paint);

      }  else {

        //
        // Draw candidates.
        //

        paint.setColor(Color.BLACK);
        paint.setTextSize(charw);

        for (int j = 0; j < 9; j++) {
          if (0 != (candidate[i] & n2b(1 + j))) {
            fillText(canvas, "" + (1 + j), x + (j % 3) * charw, y + (j / 3) * charw + 1, charw, paint);
          }
        }

        //
        // Draw reduced candidates.
        //

        if (null != ht3) {
          for (int a = 0; a < ht3.length; a += 2) {
            if (i != ht3[a]) {
              continue;
            }
            int mask = ht3[a + 1];
            for (int j = 0; j < 9; j++) {
              if (0 != (mask & n2b(1 + j))) {
                float lx = (j % 3) * charw;
                float ly = (j / 3) * charw;
                paint.setColor(Color.GRAY);
                fillText(canvas, "" + (1 + j), x + lx, y + ly + 1, charw, paint);
                paint.setColor(Color.RED);
                canvas.drawLine(x + lx, y + ly, x + lx + charw, y + ly + charw, paint);
              }
            }
            break;
          }
        }
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
    paint.setStrokeWidth(4);
    canvas.drawRect(0, 0, puzzlew, puzzlew, paint);

    //
    // Draw links.
    //

    Paint dotpaint = new Paint();
    dotpaint.setARGB(255, 255, 0, 0);
    dotpaint.setStyle(Paint.Style.STROKE);
    dotpaint.setPathEffect(new DashPathEffect(new float[] {5, 3}, 0));

    if (null != ht4) {
      paint.setColor(Color.RED);
      paint.setStrokeWidth(3);
      for (int i = 0; i < ht4.length; i += 4) {
        int a = ht4[i], b = ht4[i + 1];
        int na = ht4[i + 2] - 1;
        int nb = ht4[i + 3] - 1;
        float xa = COL(a) * (1 + cellw), ya = ROW(a) * (1 + cellw);
        float cxa = xa + (na % 3) * charw, cya = ya + (na / 3) * charw;
        float xb = COL(b) * (1 + cellw), yb = ROW(b) * (1 + cellw);
        float cxb = xb + (nb % 3) * charw, cyb = yb + (nb / 3) * charw;
        canvas.drawRect(cxa, cya, cxa + charw, cya + charw, paint);
        canvas.drawRect(cxb, cyb, cxb + charw, cyb + charw, paint);
        drawLink(canvas, cxa, cya, cxb, cyb, paint);
        if (0 < i && 0 == (i % 4)) {
          int b0 = ht4[i - 3];
          int n1 = ht4[i - 1] - 1;
          float xb0 = COL(b0) * (1 + cellw), yb0 = ROW(b0) * (1 + cellw);
          float cxb0 = xb0 + (n1 % 3) * charw, cyb0 = yb0 + (n1 / 3) * charw;
          drawLink(canvas, cxb0, cyb0, cxa, cya, dotpaint);
        }
      }
    }
  }

  void fillCell(Canvas canvas, float x, float y, int color, Paint paint) {
    paint.setStyle(Paint.Style.FILL);
    paint.setColor(color);
    Rect r = new Rect(0, 0, (int)cellw + 1, (int)cellw + 1);
    r.offset((int)x + 1, (int)y + 1);
    canvas.drawRect(r, paint);
  }

  void fillText(Canvas canvas, String s, float x, float y, float cw, Paint paint) {
    float cx = cw / 2;
    float cy = (cw - (paint.descent() + paint.ascent())) / 2;
    canvas.drawText(s, x + cx, y + cy, paint);
  }

  boolean checkAndFillHtCell(int ht[], int i, Canvas canvas, float x, float y, int color, Paint paint) {
    if (null != ht) {
      for (int j = 0; j < ht.length; j++) {
        if (i == ht[j]) {
          fillCell(canvas, x, y, color, paint);
          return true;
        }
      }
    }
    return false;
  }
}

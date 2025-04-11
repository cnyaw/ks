
//
// ListActivity.java
// KillSudoku puzzle list acvivity implementation.
//
// Copyright (c) 2016 Waync Cheng.
// All Rights Reserved.
//
// 2016/7/19 Waync Cheng.
//

package weilican.ks;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.AdapterView.OnItemLongClickListener;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.PopupMenu;
import android.widget.TextView;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.ArrayList;

public class ListActivity extends Activity
{
  static final String PUZZLE_SAV_FILE_NAME = "puzzle_sav.txt";
  static final int CMD_SOLVE_PUZZLE = 10000;
  static final int CMD_NEW_PUZZLE = 20000;
  static final int CMD_EDIT_PUZZLE = 30000;

  static class SudokuPuzzle
  {
    String puzzle;
    int pattern = 0;
    boolean solved = false;
    int steps = 0;

    public SudokuPuzzle(String puzzle) {
      this.puzzle = puzzle;
    }

    public SudokuPuzzle(String puzzle, int pattern) {
      this.puzzle = puzzle;
      this.pattern = pattern;
    }

    public SudokuPuzzle(String puzzle, int pattern, boolean solved, int steps) {
      this.puzzle = puzzle;
      this.pattern = pattern;
      this.solved = solved;
      this.steps = steps;
    }

    public String getPattern() {
      if (0 == pattern) {
        return "New";
      }
      final String p[] = {"Naked Single", "Hidden Single", "Pointing", "Claiming",
                          "Naked Subset", "Hidden Subset",
                          "X-Chains", "XY-Chains", "XYZ-Chains"};
      ArrayList<String> a = new ArrayList<String>();
      for (int i = 0; i < p.length; i++) {
        if (0 != (pattern & (1 << i))) {
          a.add(p[i]);
        }
      }
      String s = a.toString();
      return s.substring(1, s.length() - 1);
    }
  }

  class MyAdapter extends ArrayAdapter<SudokuPuzzle>
  {
    LayoutInflater inflater;

    public MyAdapter(Context context, ArrayList<SudokuPuzzle> data) {
      super(context, R.layout.puzzle_list_item, R.id.pattern, data);
      inflater = LayoutInflater.from(context);
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
      View v = convertView;
      if (null == convertView) {
        v = inflater.inflate(R.layout.puzzle_list_item, null);
      }
      PreviewView puzzle = (PreviewView)v.findViewById(R.id.puzzle);
      TextView pattern = (TextView)v.findViewById(R.id.pattern);
      SudokuPuzzle sudoku = (SudokuPuzzle)getItem(position);
      puzzle.puzzle = sudoku.puzzle;
      pattern.setText(sudoku.getPattern());
      TextView info = (TextView)v.findViewById(R.id.info);
      if (0 != sudoku.pattern && 0 < sudoku.steps) {
        info.setText((sudoku.solved ? "Solved:" : "Not solved:") + sudoku.steps + " steps");
      } else {
        info.setText("");
      }
      return v;
    }
  }

  ArrayList<SudokuPuzzle> listItems;
  MyAdapter adapter;

  @Override
  public void onCreate(Bundle savedInstanceState)
  {
    super.onCreate(savedInstanceState);

    if (!isTaskRoot()) {
      finish();
      return;
    }

    setContentView(R.layout.puzzle_list);

    ListView listView = (ListView)findViewById(R.id.puzzle_list);

    listItems = new ArrayList<SudokuPuzzle>();
    loadPuzzle(listItems);

    adapter = new MyAdapter(this, listItems);
    listView.setAdapter(adapter);

    listView.setOnItemClickListener(new OnItemClickListener() {
      @Override
      public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
        Intent intent = new Intent(getBaseContext(), GameActivity.class);
        intent.putExtra("position", position);
        intent.putExtra("puzzle", listItems.get(position).puzzle);
        startActivityForResult(intent, CMD_SOLVE_PUZZLE);
      }
    });

    listView.setOnItemLongClickListener(new OnItemLongClickListener() {
      @Override
      public boolean onItemLongClick(AdapterView<?> arg0, View arg1, int arg2, long arg3) {
         showListViewPopupMenu(arg1, arg2);
         return true;
      }
    });

    Button btn = (Button)findViewById(R.id.btn_new);
    btn.setOnClickListener(new OnClickListener() {
      @Override
      public void onClick(View view) {
        Intent intent = new Intent(getBaseContext(), EditActivity.class);
        startActivityForResult(intent, CMD_NEW_PUZZLE);
      }
    });
  }

  @Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    if (RESULT_OK != resultCode || null == data) {
      return;
    }

    if (CMD_SOLVE_PUZZLE == requestCode) {

      //
      // Solve view.
      //

      int position = data.getIntExtra("position", -1);
      int pattern = data.getIntExtra("pattern", 0);
      boolean solved = data.getBooleanExtra("solved", false);
      int steps = data.getIntExtra("steps", 0);
      if (-1 != position) {
        SudokuPuzzle p = listItems.get(position);
        if (p.pattern != pattern || p.solved != solved || p.steps != steps) {
          p.pattern = pattern;
          p.solved = solved;
          p.steps = steps;
          adapter.notifyDataSetChanged();
          savePuzzle(listItems);
        }
      }
    } else if (CMD_NEW_PUZZLE == requestCode) {

      //
      // New puzzle.
      //

      String puzzle = data.getStringExtra("puzzle");
      if (null != puzzle) {
        listItems.add(new SudokuPuzzle(puzzle));
        adapter.notifyDataSetChanged();
        savePuzzle(listItems);
      }
    } else if (CMD_EDIT_PUZZLE == requestCode) {

      //
      // Edit puzzle.
      //

      int position = data.getIntExtra("position", -1);
      String puzzle = data.getStringExtra("puzzle");

      if (-1 != position && null != puzzle) {
        SudokuPuzzle p = listItems.get(position);
        if (!p.puzzle.equals(puzzle)) {
          p.puzzle = puzzle;
          p.pattern = 0;
          p.solved = false;
          p.steps = 0;
          adapter.notifyDataSetChanged();
          savePuzzle(listItems);
        }
      }
    }
  }

  void loadPuzzle(ArrayList<SudokuPuzzle> listItems) {
    File file = getFileStreamPath(PUZZLE_SAV_FILE_NAME);
    if (!file.exists()) {
      listItems.add(new SudokuPuzzle("000801000603050710005070000007010006850307094400020300000090500039040602000602000"));
      listItems.add(new SudokuPuzzle("000400510000031090000270604304107800080305070007806309806052000020780000073004000"));
      listItems.add(new SudokuPuzzle("000840000000070094340000701100498200200000007003267009806000023720080000000029000"));
      listItems.add(new SudokuPuzzle("005001000200040010190086700609000040500209007020000105002870051030090006000600800"));
      return;
    }

    try {
      InputStream is = openFileInput(PUZZLE_SAV_FILE_NAME);
      InputStreamReader r = new InputStreamReader(is);
      BufferedReader buffer = new BufferedReader(r);
      String line;
      while (null != (line = buffer.readLine())) {
        String split[] = line.split("[,;\\s]+");
        int pattern = Integer.valueOf(split[1]);
        boolean solved = 3 <= split.length ? (1 == Integer.valueOf(split[2])) : false;
        int steps = 4 <= split.length ? Integer.valueOf(split[3]) : 0;
        listItems.add(new SudokuPuzzle(split[0], pattern, solved, steps));
      }
      is.close();
    } catch (Exception e) {
    }
  }

  void savePuzzle(ArrayList<SudokuPuzzle> listItems) {
    try {
      OutputStreamWriter w = new OutputStreamWriter(openFileOutput(PUZZLE_SAV_FILE_NAME, Context.MODE_PRIVATE));
      for (int i = 0; i < listItems.size(); i++) {
        SudokuPuzzle p = listItems.get(i);
        w.write(p.puzzle + " " + p.pattern + " " + (p.solved ? 1 : 0) + " " + p.steps + "\n");
      }
      w.close();
    } catch (Exception e) {
    }
  }

  void showListViewPopupMenu(View view, int position) {
    final int pos[] = {position};
    PopupMenu popupMenu = new PopupMenu(this, view);
    popupMenu.getMenuInflater().inflate(R.menu.list_menu, popupMenu.getMenu());
    popupMenu.setOnMenuItemClickListener(new PopupMenu.OnMenuItemClickListener() {
      @Override
      public boolean onMenuItemClick(MenuItem item) {
        switch (item.getItemId()) {
          case R.id.copy_puzzle:
            SudokuPuzzle s = listItems.get(pos[0]);
            listItems.add(new SudokuPuzzle(s.puzzle));
            adapter.notifyDataSetChanged();
            savePuzzle(listItems);
            pos[0] = listItems.size() - 1;
            // Fall throw.
          case R.id.edit_puzzle:
            Intent intent = new Intent(getBaseContext(), EditActivity.class);
            intent.putExtra("position", pos[0]);
            intent.putExtra("puzzle", listItems.get(pos[0]).puzzle);
            startActivityForResult(intent, CMD_EDIT_PUZZLE);
            return true;
          case R.id.delete_puzzle:
            listItems.remove(pos[0]);
            adapter.notifyDataSetChanged();
            savePuzzle(listItems);
            return true;
          default:
            return false;
        }
      }
    });
    popupMenu.show();
  }

  static {
    System.loadLibrary("ks");
  }
}

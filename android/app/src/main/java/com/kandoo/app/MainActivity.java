package com.kandoo.app;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // edge-to-edge — پلاگین SystemBars بعدا اینست ها را مدیریت می کند
    EdgeToEdge.enable(this);
    super.onCreate(savedInstanceState);
  }
}

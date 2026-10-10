package com.kandoo.app;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // edge-to-edge استاندارد androidx — محتوا زیر ناچ می رود و اینست ها توسط CSS مدیریت می شوند
    EdgeToEdge.enable(this);
    super.onCreate(savedInstanceState);
  }
}

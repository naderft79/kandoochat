package com.kandoo.app;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // اندروید ۱۵ به بعد edge-to-edge اجباری است — inset واقعی را به CSS می دهیم
    EdgeToEdge.enable(this);
    super.onCreate(savedInstanceState);
  }
}

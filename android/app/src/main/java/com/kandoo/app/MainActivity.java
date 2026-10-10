package com.kandoo.app;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // اندروید ۱۵ به بعد edge-to-edge اجباری است — فعال می کنیم تا محتوا زیر ناچ نرود
    EdgeToEdge.enable(this);
    super.onCreate(savedInstanceState);
  }
}

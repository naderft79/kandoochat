package com.kandoochats.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // پلاگین پرداخت مارکت فقط در فلیورهای بازار/مایکت کلاسش موجود است — با رفلکشن امن ثبت می شود
        try {
            @SuppressWarnings("unchecked")
            Class<? extends Plugin> billing =
                (Class<? extends Plugin>) Class.forName("com.kandoochats.app.MarketBillingPlugin");
            registerPlugin(billing);
        } catch (Throwable ignored) {
        }
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        applyBrandUserAgent();
    }

    // توکن برند/مارکت در User-Agent وب ویو — سرور برند و مارکت را از همین تشخیص می دهد
    // فرمت: KandooApp/<brand>.<market>/1.0 برای اپ های مارکتی؛ اپ کندو توکن پیش فرض را دارد
    private void applyBrandUserAgent() {
        try {
            String brand = strRes("ua_brand");
            String market = strRes("market_name");
            if (brand == null || brand.isEmpty()) return;
            String suffix = "KandooApp/" + brand + "." + market + "/1.0";
            android.webkit.WebView wv = getBridge().getWebView();
            if (wv != null) {
                String ua = wv.getSettings().getUserAgentString();
                if (ua != null && !ua.contains(suffix)) {
                    wv.getSettings().setUserAgentString(ua + " " + suffix);
                }
            }
        } catch (Throwable ignored) {
        }
    }

    private String strRes(String name) {
        try {
            int id = getResources().getIdentifier(name, "string", getPackageName());
            return id != 0 ? getString(id) : "";
        } catch (Exception e) {
            return "";
        }
    }
}

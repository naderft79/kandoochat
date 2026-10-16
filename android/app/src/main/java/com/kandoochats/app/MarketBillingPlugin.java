// پلاگین Capacitor پرداخت درون برنامه ای — فقط در خروجی های مارکتی (بازار/مایکت) فعال است
// تنظیمات مارکت از ریسورس های فلیور خوانده می شود: market_name / market_package / market_bind_action
package com.kandoochats.app;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.kandoochats.app.iap.IabBilling;

@CapacitorPlugin(name = "MarketBilling")
public class MarketBillingPlugin extends Plugin {

    private IabBilling billing;
    private String marketName = "";

    private IabBilling ensureBilling() {
        if (billing == null) {
            marketName = strRes("market_name");
            String pkg = strRes("market_package");
            String action = strRes("market_bind_action");
            billing = new IabBilling(getActivity(), pkg, action);
        }
        return billing;
    }

    private String strRes(String name) {
        try {
            int id = getContext().getResources().getIdentifier(name, "string", getContext().getPackageName());
            return id != 0 ? getContext().getString(id) : "";
        } catch (Exception e) {
            return "";
        }
    }

    private boolean isMarketApp() {
        String m = strRes("market_name");
        return "bazaar".equals(m) || "myket".equals(m);
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject out = new JSObject();
        out.put("ready", isMarketApp());
        out.put("market", strRes("market_name"));
        call.resolve(out);
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        if (!isMarketApp()) {
            call.reject("Market billing is not available in this build");
            return;
        }
        String productId = call.getString("productId");
        if (productId == null || productId.isEmpty()) {
            call.reject("productId is required");
            return;
        }
        IabBilling b = ensureBilling();
        IabBilling.Callback cb = new IabBilling.Callback() {
            @Override
            public void onResult(Bundle result) {
                JSObject out = new JSObject();
                out.put("productId", result.getString("productId"));
                out.put("purchaseToken", result.getString("purchaseToken"));
                out.put("orderId", result.getString("orderId"));
                out.put("packageName", result.getString("packageName"));
                out.put("signedData", result.getString("signedData"));
                out.put("signature", result.getString("signature"));
                call.resolve(out);
            }

            @Override
            public void onError(String message) {
                call.reject(message);
            }
        };
        if (!b.isConnected()) {
            b.connect(new IabBilling.Callback() {
                @Override
                public void onResult(Bundle result) {
                    b.purchase(productId, cb);
                }

                @Override
                public void onError(String message) {
                    call.reject(message);
                }
            });
        } else {
            b.purchase(productId, cb);
        }
    }

    // مصرف خرید سکه — JS بعد از تایید سرور صدا می زند تا خرید مجدد ممکن شود
    @PluginMethod
    public void consumePurchase(PluginCall call) {
        String purchaseToken = call.getString("purchaseToken");
        if (purchaseToken == null || purchaseToken.isEmpty()) {
            call.reject("purchaseToken is required");
            return;
        }
        IabBilling b = ensureBilling();
        if (!b.isConnected()) {
            b.connect(new IabBilling.Callback() {
                @Override
                public void onResult(Bundle result) {
                    b.consume(purchaseToken, consumeCallback(call));
                }

                @Override
                public void onError(String message) {
                    call.reject(message);
                }
            });
        } else {
            b.consume(purchaseToken, consumeCallback(call));
        }
    }

    private IabBilling.Callback consumeCallback(PluginCall call) {
        return new IabBilling.Callback() {
            @Override
            public void onResult(Bundle result) {
                call.resolve(new JSObject());
            }

            @Override
            public void onError(String message) {
                call.reject(message);
            }
        };
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (billing != null) {
            billing.handleActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (billing != null) billing.disconnect();
        super.handleOnDestroy();
    }
}

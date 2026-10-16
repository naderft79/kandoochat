// کلاینت پرداخت درون برنامه ای با سرویس IAB نسخه ۳ — بدون AIDL
// هر دو مارکت (کافه بازار و مایکت) از رابط استاندارد com.android.vending.billing.IInAppBillingService
// پشتیبانی می کنند؛ تراکنش ها مستقیم با IBinder.transact انجام می شوند تا به ابزار aidl وابسته نباشیم
package com.kandoochats.app.iap;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Parcel;
import android.os.RemoteException;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

public class IabBilling {

    public interface Callback {
        void onResult(Bundle result);
        void onError(String message);
    }

    private static final String TAG = "IabBilling";
    private static final String DESCRIPTOR = "com.android.vending.billing.IInAppBillingService";
    private static final int API_VERSION = 3;
    private static final int RC_PURCHASE = 10001;

    // کدهای تراکنش — به ترتیب تعریف متدها در اینترفیس IInAppBillingService
    private static final int TX_IS_BILLING_SUPPORTED = 1;
    private static final int TX_GET_SKU_DETAILS = 2;
    private static final int TX_GET_BUY_INTENT = 3;
    private static final int TX_GET_PURCHASES = 4;
    private static final int TX_CONSUME_PURCHASE = 5;

    private final Activity activity;
    private final String marketPackage;
    private final String bindAction;
    private IBinder service;
    private ServiceConnection connection;
    private final Handler main = new Handler(Looper.getMainLooper());

    private Callback pendingCallback;
    private String pendingSku;

    public IabBilling(Activity activity, String marketPackage, String bindAction) {
        this.activity = activity;
        this.marketPackage = marketPackage;
        this.bindAction = bindAction;
    }

    // اتصال به سرویس پرداخت مارکت
    public void connect(Callback cb) {
        Intent intent = new Intent(bindAction);
        intent.setPackage(marketPackage);
        connection = new ServiceConnection() {
            @Override
            public void onServiceConnected(ComponentName name, IBinder binder) {
                service = binder;
                postResult(cb, ok());
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {
                service = null;
            }
        };
        try {
            boolean bound = activity.bindService(intent, connection, Context.BIND_AUTO_CREATE);
            if (!bound) postError(cb, "سرویس پرداخت مارکت یافت نشد");
        } catch (SecurityException e) {
            postError(cb, "عدم دسترسی به سرویس پرداخت");
        }
    }

    public boolean isConnected() {
        return service != null;
    }

    public void disconnect() {
        if (connection != null) {
            try {
                activity.unbindService(connection);
            } catch (Exception ignored) {}
            connection = null;
        }
        service = null;
    }

    // شروع خرید — نتیجه از onActivityResult برمی گردد
    public void purchase(String productId, Callback cb) {
        if (service == null) {
            postError(cb, "سرویس پرداخت متصل نیست");
            return;
        }
        // محصولات اشتراک با تایپ subs خریداری می شوند
        String type = productId.startsWith("sub_") ? "subs" : "inapp";
        pendingCallback = cb;
        pendingSku = productId;
        try {
            Bundle buy = getBuyIntent(productId, type);
            if (buy == null) {
                postError(cb, "پاسخ نامعتبر از مارکت");
                return;
            }
            int rc = buy.getInt("RESPONSE_CODE", -1);
            if (rc != 0) {
                postError(cb, billingError(rc));
                return;
            }
            PendingIntent pi = buy.getParcelable("BUY_INTENT");
            if (pi == null) {
                postError(cb, "پاسخ نامعتبر از مارکت");
                return;
            }
            activity.startIntentSenderForResult(pi.getIntentSender(), RC_PURCHASE, new Intent(), 0, 0, 0);
        } catch (RemoteException e) {
            postError(cb, "خطا در ارتباط با مارکت");
        } catch (Exception e) {
            postError(cb, "خطا در شروع خرید");
        }
    }

    // مصرف خرید سکه — بعد از تایید سرور صدا زده می شود تا خرید مجدد ممکن شود
    public void consume(String purchaseToken, Callback cb) {
        if (service == null) {
            postError(cb, "سرویس پرداخت متصل نیست");
            return;
        }
        try {
            Parcel data = Parcel.obtain();
            Parcel reply = Parcel.obtain();
            try {
                data.writeInterfaceToken(DESCRIPTOR);
                data.writeInt(API_VERSION);
                data.writeString(activity.getPackageName());
                data.writeString(purchaseToken);
                service.transact(TX_CONSUME_PURCHASE, data, reply, 0);
                reply.setDataPosition(0);
                reply.readException();
                int rc = reply.readInt();
                if (rc == 0) postResult(cb, ok());
                else postError(cb, billingError(rc));
            } finally {
                data.recycle();
                reply.recycle();
            }
        } catch (RemoteException e) {
            postError(cb, "خطا در ارتباط با مارکت");
        }
    }

    // getBuyIntent(apiVersion, packageName, sku, type, developerPayload)
    private Bundle getBuyIntent(String sku, String type) throws RemoteException {
        Parcel data = Parcel.obtain();
        Parcel reply = Parcel.obtain();
        try {
            data.writeInterfaceToken(DESCRIPTOR);
            data.writeInt(API_VERSION);
            data.writeString(activity.getPackageName());
            data.writeString(sku);
            data.writeString(type);
            data.writeString("");
            service.transact(TX_GET_BUY_INTENT, data, reply, 0);
            reply.setDataPosition(0);
            reply.readException();
            return reply.readBundle(getClass().getClassLoader());
        } finally {
            data.recycle();
            reply.recycle();
        }
    }

    // نتیجه پنجره پرداخت — خروجی همان فیلدهای لازم برای تایید سمت سرور است
    public boolean handleActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != RC_PURCHASE) return false;
        Callback cb = pendingCallback;
        pendingCallback = null;
        if (cb == null) return true;

        if (resultCode != Activity.RESULT_OK || data == null) {
            postError(cb, "پرداخت لغو شد");
            return true;
        }
        int rc = data.getIntExtra("RESPONSE_CODE", -1);
        if (rc != 0) {
            postError(cb, billingError(rc));
            return true;
        }
        String purchaseData = data.getStringExtra("INAPP_PURCHASE_DATA");
        String signature = data.getStringExtra("INAPP_DATA_SIGNATURE");
        if (purchaseData == null || signature == null) {
            postError(cb, "داده خرید ناقص است");
            return true;
        }
        try {
            JSONObject purchase = new JSONObject(purchaseData);
            Bundle result = ok();
            result.putString("productId", purchase.optString("productId", pendingSku));
            result.putString("purchaseToken", purchase.optString("purchaseToken"));
            result.putString("orderId", purchase.optString("orderId"));
            result.putString("packageName", purchase.optString("packageName"));
            result.putString("signedData", purchaseData);
            result.putString("signature", signature);
            postResult(cb, result);
        } catch (JSONException e) {
            postError(cb, "داده خرید نامعتبر است");
        }
        return true;
    }

    private Bundle ok() {
        Bundle b = new Bundle();
        b.putBoolean("ok", true);
        return b;
    }

    private void postResult(Callback cb, Bundle result) {
        main.post(() -> cb.onResult(result));
    }

    private void postError(Callback cb, String message) {
        main.post(() -> cb.onError(message));
    }

    private String billingError(int code) {
        Log.w(TAG, "billing error code=" + code);
        switch (code) {
            case 1: return "پرداخت توسط کاربر لغو شد";
            case 3: return "سرویس پرداخت در این دستگاه در دسترس نیست";
            case 4: return "این محصول در مارکت موجود نیست";
            case 5: return "خطا در برنامه مارکت";
            case 6: return "خطا در سرویس پرداخت";
            case 7: return "این محصول قبلا خریداری شده است";
            case 8: return "مالکیت محصول در دسترس نیست";
            default: return "خطا در پرداخت (کد " + code + ")";
        }
    }
}

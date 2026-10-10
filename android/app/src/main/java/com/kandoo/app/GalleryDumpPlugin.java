package com.kandoo.app;

// پلاگین داخلی: خواندن ۵ عکس آخر گالری — فقط برای دیباگ/تست لوکال
import android.Manifest;
import android.content.ContentUris;
import android.content.ContentResolver;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "GalleryDump")
public class GalleryDumpPlugin extends Plugin {
    private static final int REQ_PHOTOS = 7001;
    private PluginCall pendingCall;

    private String[] neededPermissions() {
        if (Build.VERSION.SDK_INT >= 33) {
            return new String[]{Manifest.permission.READ_MEDIA_IMAGES};
        }
        return new String[]{Manifest.permission.READ_EXTERNAL_STORAGE};
    }

    private boolean hasPermission() {
        for (String p : neededPermissions()) {
            if (ActivityCompat.checkSelfPermission(getContext(), p) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    @PluginMethod
    public void lastPhotos(PluginCall call) {
        if (hasPermission()) {
            dump(call);
            return;
        }
        pendingCall = call;
        ActivityCompat.requestPermissions(getActivity(), neededPermissions(), REQ_PHOTOS);
    }

    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_PHOTOS || pendingCall == null) return;
        PluginCall call = pendingCall;
        pendingCall = null;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            dump(call);
        } else {
            call.reject("photos permission denied");
        }
    }

    private void dump(PluginCall call) {
        try {
            ContentResolver cr = getContext().getContentResolver();
            Uri collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
            String[] projection = {MediaStore.Images.Media._ID, MediaStore.Images.Media.DISPLAY_NAME};

            JSArray photos = new JSArray();
            Cursor cursor = cr.query(collection, projection, null, null, MediaStore.Images.Media.DATE_ADDED + " DESC");
            int count = 0;
            if (cursor != null) {
                while (cursor.moveToNext() && count < 5) {
                    long id = cursor.getLong(0);
                    String name = cursor.getString(1);
                    Uri uri = ContentUris.withAppendedId(collection, id);

                    InputStream in = cr.openInputStream(uri);
                    if (in == null) continue;
                    ByteArrayOutputStream bos = new ByteArrayOutputStream();
                    byte[] buf = new byte[8192];
                    int n;
                    while ((n = in.read(buf)) != -1) bos.write(buf, 0, n);
                    in.close();

                    JSObject p = new JSObject();
                    p.put("name", name != null ? name : "photo-" + id + ".jpg");
                    p.put("base64", Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP));
                    photos.put(p);
                    count++;
                }
                cursor.close();
            }

            JSObject ret = new JSObject();
            ret.put("photos", photos);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("gallery read failed: " + e.getMessage());
        }
    }
}

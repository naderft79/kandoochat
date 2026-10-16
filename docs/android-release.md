# انتشار اپ اندروید کندو

## دو خروجی APK

هر بیلد دو APK می سازد (Gradle flavors):

| فلیور | پکیج | نام | توکن UA | مسیر شروع |
|---|---|---|---|---|
| `user` | `com.kandoochats.app` | کندو | `KandooApp/1.0` | `/` |
| `admin` | `com.kandoo.admin` | مدیریت کندو | `KandooAdminApp/1.0` | `/admin-login` |

- خروجی: `android/app/build/outputs/apk/{user,admin}/{debug,release}/app-{flavor}-{variant}.apk`
- `webDir` کاپاسیتور `app-web` است (نه `public`) — چون محتوای اصلی از `server.url` ریموت لود می شود، فقط یک صفحه آفلاین سبک داخل اپ می رود و AAB ~۱.۵MB می ماند. `app-web/index.html` صفحه «تلاش مجدد» فارسی است.
- **اپ مدیریت:** آیکون مشکی + K طلایی، اسپلش مشکی، چرخش آزاد، بدون مجوز دوربین/میکروفون و بدون FCM. کانفیگ آن (`src/admin/assets/capacitor.config.json`) در هر بیلد توسط `scripts/build-apk.ts` تولید می شود و در git نیست.
- **جداسازی ورود در سرور:** ورود مدیر با توکن `KandooApp` و ورود کاربر عادی با `KandooAdminApp` در `/api/auth/login` با همان پاسخ «رمز اشتباه» رد می شود. ورود مدیر از مرورگر آزاد است.
- `npm run deploy:apk` هر دو APK را روی گوشی نصب می کند و پیش فرض اپ کاربر را اجرا می کند؛ با `--admin` اپ مدیریت اجرا می شود.

## پیش نیازها
- آدرس production در `CAPACITOR_SERVER_URL` یا `NEXT_PUBLIC_SITE_URL` باید **https** باشد (بیلد release بدون آن متوقف می شود).
- keystore امضا در `android/keystore.properties` (فقط محلی؛ هرگز commit نشود). بکاپ امن keystore الزامی است؛ گم شدنش یعنی امکان به روزرسانی اپ از بین می رود.
- `google-services.json` باید در `android/app/src/user/` باشد تا فقط فلیور کاربر پوش بگیرد (در ریشه ماژول بیلد فلیور admin خطا می خورد چون `com.kandoo.admin` در Firebase نیست). در نسخه اول گوگل پلی FCM وجود ندارد و این فایل لازم نیست.

## شماره نسخه
هر انتشار باید `versionCode` بزرگ تر از قبلی داشته باشد:

```bash
./gradlew assembleRelease -PkandooVersionCode=2 -PkandooVersionName=1.1
# یا با اسکریپت:
npm run build:aab -- --versionCode=2 --versionName=1.1
```

## بیلد ریلیز

### APK (نصب دستی/تست)
```bash
CAPACITOR_SERVER_URL=https://kandoochat.top npm run build:apk -- --release
```
خروجی: `android/app/build/outputs/apk/user/release/app-user-release.apk` و `.../admin/release/app-admin-release.apk` (با R8 و shrink فعال).

### AAB (گوگل پلی — فقط فلیور user)
```bash
CAPACITOR_SERVER_URL=https://kandoochat.top npm run build:aab -- --versionCode=1 --versionName=1.0
```
خروجی: `android/app/build/outputs/bundle/userRelease/app-user-release.aab`

## نکات انتشار گوگل پلی

- **پرداخت:** در نسخه پلی هیچ خرید سکه/اشتراکی داخل اپ نیست. با UA توکن `KandooApp` تب های خرید در کیف پول و پلن های اشتراک مخفی می شوند و `/api/payment/create` و `/api/wallet/buy` برای اپ `403` برمی گردانند.
- **حذف حساب:** صفحه عمومی `https://kandoochat.top/delete-account` برای فرم Account Deletion کنسول. مسیر درون اپ: تنظیمات → حذف حساب.
- **App Links:** `assetlinks.json` در `public/.well-known/` با fingerprint آپلود keystore سرو می شود. بعد از فعال شدن **Play App Signing**، fingerprint دوم را از Play Console → Setup → App integrity به آرایه اضافه کنید.
- **تست بسته:** حساب شخصی جدید قبل از production به ۱۴ روز تست بسته با حداقل ۱۲ تستر نیاز دارد.
- **حساب دمو:** برای فرم App access یک کاربر تستی واقعی (غیرادمین) بسازید و شماره/رمز را به بازرس بدهید.

## بررسی های قبل از آپلود
- در مانیفست merge شده ریلیز نباید `usesCleartextTraffic` باشد:
  `grep usesCleartextTraffic android/app/build/intermediates/merged_manifests/release/*/AndroidManifest.xml`
- `allowBackup="false"` باشد.
- مجوز `SCHEDULE_EXACT_ALARM` در مانیفست ریلیز نباشد.
- سرویس FCM و متادیتای آن در مانیفست ریلیز نباشد (نسخه اول بدون پوش).
- مجوزهای اعلام شده: `INTERNET`، `ACCESS_NETWORK_STATE`، `RECORD_AUDIO` (ضبط ویس)، `CAMERA` (احراز هویت)، `USE_BIOMETRIC`/`USE_FINGERPRINT` (قفل برنامه با اثر انگشت یا تشخیص چهره — فقط اگر کاربر فعال کند). اعلان سیستمی/پوش غیرفعال است — اعلان ها فقط داخل برنامه نمایش داده می شوند.
- `adb shell pm get-app-links com.kandoochats.app` → وضعیت verified.

## فرم های Google Play Console
- **Data safety:** جمع آوری پیام ها، عکس ها، صدا (ویس)، عکس کارت ملی و سلفی در احراز هویت، شماره موبایل، نام و اطلاعات پروفایل. موارد رمزگذاری شده در انتقال و امکان درخواست حذف حساب را اعلام کنید. چون خرید داخل اپ نیست، بخش اطلاعات پرداخت «جمع نمی شود» است.
- **Permission declarations:** `RECORD_AUDIO` برای ضبط پیام صوتی و احراز؛ `CAMERA` برای سلفی احراز هویت.
- **Financial features:** در اپ خرید داخل اپلیکیشنی وجود ندارد.
- **Content rating:** پرسشنامه IARC → Dating/Social → Mature 17+.
- **Target API:** `targetSdk = 36` (Android 16). در اندروید ۱۶ روی تبلت ها قفل حالت عمودی نادیده گرفته می شود؛ برای گوشی ها `screenOrientation="portrait"` اعمال است.

## یادداشت ها
- SDK مرکز عمودی: قفل عمودی در مانیفست برای گوشی ها و در PWA/مرورگر (در صورت پشتیبانی) اعمال است.
- پوش FCM در نسخه اول پلی وجود ندارد؛ اعلان های محلی (LocalNotifications) برای لایک و پیام در پس زمینه فعال است. برای برگرداندن FCM در نسخه های بعد: سرویس و متادیتا را به مانیفست برگردانید و `google-services.json` را در `src/user/` بگذارید.

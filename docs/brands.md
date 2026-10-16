# معماری چند برندی (White-Label)

یک کدبیس، یک سرور، یک دیتابیس — چند اپ با نام/لوگو/رنگ/پکیج متفاوت.
کاربران همه برندها روی یک دیتابیس اند و می توانند با هم چت کنند.

## کانفیگ مرکزی

همه چیز از `src/config/brands.json` خوانده می شود:

```json
{
  "default": { "id": "kandoo", "name": "کندو", "packageName": "com.kandoochats.app" },
  "brands": [
    {
      "id": "nafs",
      "name": "نفس",
      "packageName": "com.nafschats.app",
      "colors": { "primary": "#7c3aed", "light": "#a78bfa", "dark": "#5b21b6" },
      "iconText": "ن",
      "iapKeys": { "bazaar": "", "myket": "" }
    }
  ]
}
```

هر برند که اینجا اضافه شود، در بیلد بعدی دو خروجی (بازار + مایکت) می گیرد.
برند اصلی `kandoo` جدا از لیست `brands` است و همیشه با KandooPay کار می کند.

## تشخیص برند

برند از User-Agent اپ تشخیص داده می شود — نه ورودی کاربر:

- اپ کندو: `KandooApp/1.0`
- اپ های برندی: `KandooApp/<brandId>.<market>/1.0`

- `src/lib/app-ua.ts` — پارس UA سمت کلاینت و سرور
- `src/lib/brand-server.ts` — `getRequestBrand()` برای Server Components و روت ها
- `src/components/BrandProvider.tsx` — `useBrand()` برای Client Components
- `src/components/BrandLogo.tsx` — لوگوی برند (زنبور برای کندو، آیکون متنی برای برندها)

## آنچه برای هر برند تغییر می کند

- نام اپ در همه صفحات/نوتیف ها/مانیفست PWA
- رنگ های اصلی (متغیرهای CSS: `--brand-primary` و… در `layout.tsx` تزریق می شوند)
- آیکون PWA — `src/app/api/brand-icon/[size]/route.tsx` به صورت پویا تولید می شود
- مانیفست PWA — `src/app/manifest.json/route.ts`
- پکیج نیم اندروید، نام اپ، کی استور امضا، آیکون لانچر
- روش پرداخت (برندها = IAP مارکت، کندو = KandooPay)

## بیلد

```bash
# تولید ریسورس های اندروید از brands.json (آیکون، کی استور، flavors)
npm run brands:generate

# بیلد همه خروجی ها (APK + AAB release) به dist/android
npm run build:brands

# فقط یک خروجی
npm run build:brands -- nafsBazaar
```

خروجی ها: `userDirect` (کندو)، `adminDirect` (مدیریت)، و برای هر برند `<id>Bazaar` و `<id>Mycet` — مثلا `nafsBazaar`, `nafsMyket`.

## دیتابیس

`User.brand`, `PushSubscription.brand`, `FcmToken.brand` — برند هر کاربر/دستگاه ثبت می شود
تا نوتیف ها با نام برند درست ارسال شوند و ادمین بتواند بر اساس برند فیلتر کند.

## قانون طلایی

ویژگی های جدید فقط یک بار در کدبیس اصلی پیاده می شوند — همه برندها خودکار آن را می گیرند.
هر جا نام اپ لازم است از `useBrand()` / `getRequestBrand()` استفاده کن، نه رشته «کندو».

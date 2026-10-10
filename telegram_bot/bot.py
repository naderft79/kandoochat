# ربات استخراج کیس از کانال تلگرام و ساخت پروفایل فیک در دیتابیس کندو
import os
import sys
import random
import sqlite3
import shutil
import hashlib
import time
from pathlib import Path
from datetime import datetime, timedelta

# Telethon برای اتصال به تلگرام
from telethon.sync import TelegramClient
from telethon.tl.types import MessageMediaPhoto

import config
from fake_data import (
    MALE_FIRST_NAMES, FEMALE_FIRST_NAMES, LAST_NAMES,
    JOBS, BIOS, PROVINCES, PRIORITY_CITIES,
)

# --- ابزار های کمکی ---

def bcrypt_hash(password: str) -> str:
    """هش کردن رمز با bcrypt (سازگار با bcryptjs)"""
    try:
        import bcrypt
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=10))
        return hashed.decode("utf-8")
    except ImportError:
        print("[ERROR] bcrypt نصب نیست. دستور: pip install bcrypt")
        sys.exit(1)


def cuid() -> str:
    """تولید شناسه یکتا شبیه cuid"""
    import uuid
    return f"c{uuid.uuid4().hex[:24]}"


def random_phone() -> str:
    """تولید شماره موبایل فیک"""
    return f"09{random.randint(100000000, 999999999)}"


PERSIAN_MAP = {
    "آ": "a", "ا": "a", "ب": "b", "پ": "p", "ت": "t", "ث": "s",
    "ج": "j", "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ذ": "z",
    "ر": "r", "ز": "z", "ژ": "zh", "س": "s", "ش": "sh", "ص": "s",
    "ض": "z", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f",
    "ق": "gh", "ک": "k", "گ": "g", "ل": "l", "م": "m", "ن": "n",
    "و": "v", "ه": "h", "ی": "y", " ": "_",
}

def to_english(text: str) -> str:
    result = []
    for ch in text:
        result.append(PERSIAN_MAP.get(ch, ch))
    return "".join(result)


def random_username(first_name: str, last_name: str, used: set) -> str:
    """تولید یوزرنیم یکتا انگلیسی"""
    import uuid
    base = to_english(first_name).lower()
    for _ in range(50):
        suffix = uuid.uuid4().hex[:6]
        uname = f"{base}_{suffix}"
        if uname not in used:
            used.add(uname)
            return uname
    # اگر ۵۰ بار تکرار شد
    uname = f"user_{uuid.uuid4().hex[:10]}"
    used.add(uname)
    return uname


def random_profile_data(gender: str, used_usernames: set) -> dict:
    """ساخت داده های رندوم پروفایل"""
    if gender == "MALE":
        first_name = random.choice(MALE_FIRST_NAMES)
    else:
        first_name = random.choice(FEMALE_FIRST_NAMES)

    last_name = random.choice(LAST_NAMES)
    # توزیع شهرها: ۵۰٪ شهرهای اولویت، ۵۰٪ بقیه
    if random.random() < 0.5:
        city = random.choice(PRIORITY_CITIES)
        # پیدا کردن استان شهر انتخاب شده
        province = next((p for p, cities in PROVINCES.items() if city in cities), "تهران")
    else:
        province = random.choice(list(PROVINCES.keys()))
        city = random.choice(PROVINCES[province])

    return {
        "firstName": first_name,
        "lastName": last_name,
        "gender": gender,
        "province": province,
        "city": city,
        "age": random.randint(20, 45),
        "height": random.randint(160, 195) if gender == "MALE" else random.randint(155, 180),
        "weight": random.randint(60, 110) if gender == "MALE" else random.randint(45, 85),
        "income": random.choice([0, 0, 5_000_000, 8_000_000, 12_000_000, 15_000_000, 20_000_000, 30_000_000, 50_000_000]),
        "job": random.choice(JOBS),
        "bio": random.choice(BIOS),
        "neighborhood": None,
        "carModel": random.choice([None, None, None, "پراید", "پژو ۲۰۶", "سمند", "دنا", "هایما", "کیا سراتو"]),
        "username": random_username(first_name, last_name, used_usernames),
        "phone": random_phone(),
    }


# --- کار با دیتابیس ---

def get_db_conn() -> sqlite3.Connection:
    """اتصال به دیتابیس SQLite کندو"""
    if not os.path.exists(config.DB_PATH):
        print(f"[ERROR] دیتابیس یافت نشد: {config.DB_PATH}")
        sys.exit(1)
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_existing_usernames(conn) -> set:
    """دریافت همه یوزرنیم های موجود"""
    cursor = conn.execute("SELECT username FROM User")
    return {row["username"] for row in cursor.fetchall()}


def get_existing_phones(conn) -> set:
    """دریافت همه شماره های موجود"""
    cursor = conn.execute("SELECT phone FROM User")
    return {row["phone"] for row in cursor.fetchall()}


def create_fake_user(conn, photos_info: list, gender: str, used_usernames: set, used_phones: set) -> str | None:
    """ساخت یک کاربر فیک با عکس ها در دیتابیس"""
    data = random_profile_data(gender, used_usernames)

    # اطمینان از یکتایی شماره
    for _ in range(50):
        if data["phone"] not in used_phones:
            break
        data["phone"] = random_phone()
    if data["phone"] in used_phones:
        print("[WARN] شماره تکراری، رد می شود")
        return None

    used_phones.add(data["phone"])
    used_usernames.add(data["username"])

    user_id = cuid()
    hashed_pw = bcrypt_hash(config.DEFAULT_PASSWORD)

    # اعطای رندوم: سکه، تیک آبی، ویژه
    coins = random.choice([0, 0, 0, 10, 20, 30, 50, 80, 100, 150, 200])
    is_verified = random.random() < 0.6  # ۶۰٪ تیک آبی
    is_special = random.random() < 0.15  # ۱۵٪ ویژه

    from datetime import timezone
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    # ثبت کاربر
    conn.execute(
        """INSERT INTO User (
            id, phone, username, password, role, gender,
            firstName, lastName, province, city, age, height, weight,
            income, carModel, neighborhood, job, bio,
            isVerified, isActive, phoneVerified, isSpecial,
            lastSeen, isOnline, dailyLikesUsed, dailyLikesReset,
            dailySuperLikeUsed, dailySuperLikeReset,
            createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, 'USER', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, 0, 0, ?, 0, ?, ?, ?)""",
        (
            user_id, data["phone"], data["username"], hashed_pw, data["gender"],
            data["firstName"], data["lastName"], data["province"], data["city"],
            data["age"], data["height"], data["weight"],
            data["income"], data["carModel"], data["neighborhood"], data["job"], data["bio"],
            1 if is_verified else 0,   # isVerified
            1 if is_special else 0,    # isSpecial
            now,  # lastSeen
            now,  # dailyLikesReset
            now,  # dailySuperLikeReset
            now,  # createdAt
            now,  # updatedAt
        ),
    )

    # ساخت کیف پول
    wallet_id = cuid()
    conn.execute(
        "INSERT INTO Wallet (id, userId, balance) VALUES (?, ?, ?)",
        (wallet_id, user_id, coins),
    )

    # ثبت تراکنش سکه اگر سکه داده شده
    if coins > 0:
        tx_id = cuid()
        conn.execute(
            'INSERT INTO "Transaction" (id, userId, type, coins, amountToman, status, description, createdAt) VALUES (?, ?, ?, ?, 0, ?, ?, ?)',
            (tx_id, user_id, "ADMIN_ADJUST", coins, "COMPLETED", "سکه اولیه ربات", now),
        )

    # ذخیره عکس ها
    # اگر ۴ عکس یا بیشتر: عکس اول = پروفایل، ۳ عکس بعدی = گالری
    # اگر کمتر از ۴: یک عکس رندوم = پروفایل، بقیه = گالری (حداکثر ۳)
    saved_photos = photos_info[:4]  # حداکثر ۴ عکس

    if len(saved_photos) >= 4:
        profile_photo = saved_photos[0]
        gallery_photos = saved_photos[1:4]
    else:
        # یک عکس رندوم به عنوان پروفایل
        if saved_photos:
            profile_idx = random.randint(0, len(saved_photos) - 1)
            profile_photo = saved_photos[profile_idx]
            gallery_photos = [p for i, p in enumerate(saved_photos) if i != profile_idx][:3]
        else:
            profile_photo = None
            gallery_photos = []

    # ثبت عکس پروفایل
    if profile_photo:
        photo_id = cuid()
        conn.execute(
            "INSERT INTO ProfilePhoto (id, userId, url, \"order\", isProfile, isVerified, isRejected, createdAt) VALUES (?, ?, ?, 0, 1, 1, 0, ?)",
            (photo_id, user_id, profile_photo["url"], now),
        )

    # ثبت عکس های گالری
    for i, photo in enumerate(gallery_photos):
        photo_id = cuid()
        conn.execute(
            "INSERT INTO ProfilePhoto (id, userId, url, \"order\", isProfile, isVerified, isRejected, createdAt) VALUES (?, ?, ?, ?, 0, 1, 0, ?)",
            (photo_id, user_id, photo["url"], i + 1, now),
        )

    # ثبت تنظیمات کاربر
    settings_id = cuid()
    conn.execute(
        """INSERT INTO UserSettings (
            id, userId, notifLikes, notifMessages, notifSuperLikes,
            notifProfileViews, notifGifts, notifStreak,
            privacyShowOnline, privacyShowAge, privacyShowIncome, privacyOnlyVerified
        ) VALUES (?, ?, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0)""",
        (settings_id, user_id),
    )

    conn.commit()

    badges = []
    if is_verified:
        badges.append("تیک آبی")
    if is_special:
        badges.append("ویژه")
    if coins > 0:
        badges.append(f"{coins} سکه")

    badge_str = " | ".join(badges) if badges else "بدون نشان"
    print(f"  [OK] {data['firstName']} {data['lastName']} ({data['gender']}) — {len(saved_photos)} عکس — {badge_str}")

    return user_id


# --- استخراج از تلگرام ---

def download_media(client, message, case_dir: Path) -> str | None:
    """دانلود عکس از پیام تلگرام"""
    try:
        path = client.download_media(message, file=str(case_dir))
        if path:
            return str(path)
    except Exception as e:
        print(f"  [WARN] خطا در دانلود عکس: {e}")
    return None


def extract_cases_from_channel(client, conn, used_usernames: set, used_phones: set):
    """استخراج کیس ها از کانال و ساخت پروفایل فیک"""
    print(f"\n[INFO] شروع استخراج از کانال @{config.CHANNEL}...")

    # دریافت همه پیام های کانال
    messages = client.get_messages(config.CHANNEL, limit=None)
    print(f"[INFO] تعداد پیام ها: {len(messages)}")

    # گروه بندی پیام ها به کیس (بر اساس گروه رسانه یا پیست های متوالی)
    cases = []
    current_case = []

    for msg in messages:
        if msg.grouped_id:
            # پیام های همگروه (آلبوم)
            if current_case and current_case[0].grouped_id != msg.grouped_id:
                cases.append(current_case)
                current_case = []
            current_case.append(msg)
        elif msg.media and isinstance(msg.media, MessageMediaPhoto):
            # عکس تنها
            if current_case:
                cases.append(current_case)
            current_case = [msg]
        else:
            if current_case:
                cases.append(current_case)
                current_case = []

    if current_case:
        cases.append(current_case)

    print(f"[INFO] تعداد کیس های شناسایی شده: {len(cases)}")

    # پوشه ذخیره عکس های کانال (نام کانال)
    channel_dir = Path(config.CHANNEL_PHOTO_DIR)
    channel_dir.mkdir(parents=True, exist_ok=True)

    # پوشه موقت برای دانلود اولیه از تلگرام
    temp_dir = channel_dir / "_temp"
    temp_dir.mkdir(parents=True, exist_ok=True)

    success_count = 0
    for i, case in enumerate(cases):
        # فقط کیس هایی که عکس دارند
        photo_msgs = [m for m in case if m.media and isinstance(m.media, MessageMediaPhoto)]
        if not photo_msgs:
            continue

        print(f"\n[CASE {i + 1}] {len(photo_msgs)} عکس — در حال دانلود...")

        # دانلود عکس ها
        case_dir = temp_dir / f"case_{i}"
        case_dir.mkdir(exist_ok=True)

        downloaded = []
        for msg in photo_msgs:
            path = download_media(client, msg, case_dir)
            if path:
                downloaded.append(path)

        if not downloaded:
            print("  [SKIP] عکسی دانلود نشد")
            continue

        # کپی عکس ها به پوشه کانال با نام یکتا
        photos_info = []
        for j, src_path in enumerate(downloaded):
            ext = Path(src_path).suffix or ".jpg"
            unique_name = f"{config.CHANNEL}_{hashlib.md5(str(src_path).encode()).hexdigest()[:10]}_{j}{ext}"
            dest = channel_dir / unique_name
            shutil.copy2(src_path, dest)
            # URL نسبی از پوشه uploads
            relative_url = f"/uploads/{config.CHANNEL}/{unique_name}"
            photos_info.append({"url": relative_url, "local": str(dest)})

        # پاک کردن پوشه موقت
        shutil.rmtree(case_dir, ignore_errors=True)

        # انتخاب جنسیت رندوم
        gender = random.choice(["MALE", "FEMALE"])

        # ساخت کاربر فیک
        user_id = create_fake_user(conn, photos_info, gender, used_usernames, used_phones)
        if user_id:
            success_count += 1

        # تاخیر کوتاه برای جلوگیری از فشار روی دیتابیس
        time.sleep(0.1)

    # پاک کردن پوشه موقت
    shutil.rmtree(temp_dir, ignore_errors=True)

    print(f"\n[DONE] {success_count} پروفایل فیک ساخته شد")
    return success_count


# --- تابع اصلی ---

def main():
    print("=" * 60)
    print("ربات استخراج کیس از کانال تلگرام و ساخت پروفایل فیک")
    print("=" * 60)

    # اتصال به دیتابیس
    print(f"\n[INFO] اتصال به دیتابیس: {config.DB_PATH}")
    conn = get_db_conn()

    # دریافت داده های موجود
    used_usernames = get_existing_usernames(conn)
    used_phones = get_existing_phones(conn)
    print(f"[INFO] کاربران موجود: {len(used_usernames)}")

    # اتصال به تلگرام
    print(f"\n[INFO] اتصال به تلگرام با API ID {config.API_ID}...")
    session_file = str(Path(__file__).parent / "kandoo_session")

    client = TelegramClient(session_file, config.API_ID, config.API_HASH)
    client.start(phone=config.PHONE)

    if not client.is_user_authorized():
        print("[ERROR] نشست تلگرام معتبر نیست. لطفا اولین بار دستی وارد شوید.")
        sys.exit(1)

    print("[INFO] متصل به تلگرام")

    # استخراج و ساخت
    try:
        extract_cases_from_channel(client, conn, used_usernames, used_phones)
    except KeyboardInterrupt:
        print("\n[STOP] متوقف شد توسط کاربر")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()
        client.disconnect()
        print("\n[INFO] اتمام")


if __name__ == "__main__":
    main()

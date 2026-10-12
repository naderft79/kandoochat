// خروجی XLSX از یک تب مودال پروفایل کاربر؛ مجوز تب، محدودیت نرخ و ثبت در لاگ برای همه خروجی ها اعمال می شود
import { NextResponse } from "next/server";
import writeXlsxFile from "write-excel-file/node";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { canAccessUserTab, USER_TABS, type UserTab } from "@/lib/permissions";
import { getUserTab, parseTabQuery, EXPORT_MAX_ROWS, type UserRow } from "@/lib/admin-user-data";
import { formatDateTimeCustom } from "@/lib/format";

const EXPORT_LIMIT = { windowMs: 60 * 1000, maxRequests: 10 };

export async function GET(request: Request, { params }: { params: Promise<{ id: string; tab: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id, tab } = await params;
    if (!(USER_TABS as readonly string[]).includes(tab)) return NextResponse.json({ error: "تب نامعتبر است" }, { status: 404 });
    const userTab = tab as UserTab;
    if (!canAccessUserTab(admin.role, userTab)) return NextResponse.json({ error: "دسترسی به این بخش ندارید" }, { status: 403 });

    const limit = await rateLimit(`export:${admin.id}`, EXPORT_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json({ error: "تعداد خروجی بیش از حد است. کمی بعد دوباره تلاش کنید." }, { status: 429 });
    }

    const query = parseTabQuery(new URL(request.url).searchParams);
    // خروجی تا سقف مشخص، صفحه اول؛ نیازی به صفحه بندی کاربر نیست
    const page = await getUserTab(id, userTab, admin.role, { ...query, page: 1, pageSize: EXPORT_MAX_ROWS });

    await logAction(admin.id, "EXPORT_USER_DATA", "USER", id, `tab=${userTab};kind=${query.kind || "-"};range=${query.range};rows=${page.rows.length}`);

    const buffer = await writeXlsxFile(toSheetRows(page.rows), {
      sheet: "گزارش",
      columns: [
        { header: "تاریخ", cell: (r: SheetRow) => r.at, width: 22 },
        { header: "عنوان", cell: (r: SheetRow) => r.title, width: 32 },
        { header: "جزئیات", cell: (r: SheetRow) => r.subtitle, width: 46 },
        { header: "مقدار", cell: (r: SheetRow) => r.value, width: 26 },
        { header: "وضعیت", cell: (r: SheetRow) => r.status, width: 16 },
        { header: "طرف مقابل", cell: (r: SheetRow) => r.other, width: 26 },
        { header: "حذف شده", cell: (r: SheetRow) => r.deleted, width: 12 },
      ],
    }).toBuffer();

    const safeId = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 40);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="user-${safeId}-${userTab}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: err.message === "FORBIDDEN" ? 403 : 401 });
    if (err instanceof Error && err.message === "FORBIDDEN_TAB") return NextResponse.json({ error: "دسترسی به این بخش ندارید" }, { status: 403 });
    console.error("[admin/users/export] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

type SheetRow = { at: string; title: string; subtitle: string; value: string; status: string; other: string; deleted: string };

// تبدیل ردیف ها به متن خوانا برای اکسل (بدون فیلدهای داخلی مثل شناسه و آدرس تصویر)
function toSheetRows(rows: UserRow[]): SheetRow[] {
  return rows.map((r) => ({
    at: formatDateTimeCustom(r.at),
    title: r.title,
    subtitle: r.subtitle ?? "",
    value: r.value ?? "",
    status: r.status ?? "",
    other: r.other ? `${r.other.name} (@${r.other.username})` : "",
    deleted: r.deleted ? "بله" : "خیر",
  }));
}

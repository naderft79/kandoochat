// API مدیریت احراز هویت — تایید/رد درخواست های تیک آبی و احراز هویت کامل
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";

// لیست درخواست ها — فیلتر وضعیت و نوع
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const kind = searchParams.get("kind");

    const requests = await prisma.verificationRequest.findMany({
      where: {
        status,
        ...(kind ? { kind } : {}),
        user: { role: "USER" },
      },
      select: {
        id: true,
        kind: true,
        status: true,
        selfieUrls: true,
        voiceUrl: true,
        idCardFrontUrl: true,
        idCardBackUrl: true,
        nationalCode: true,
        fullName: true,
        birthDate: true,
        faceScore: true,
        faceCount: true,
        autoResult: true,
        createdAt: true,
        reviewedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/verify GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// تایید یا رد درخواست
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: "پارامترهای ناقص" }, { status: 400 });
    }

    const req = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      select: { id: true, userId: true, kind: true, status: true },
    });
    if (!req || req.status !== "PENDING") {
      return NextResponse.json({ error: "درخواست یافت نشد" }, { status: 404 });
    }

    const isBlueTick = req.kind === "BLUE_TICK";

    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.verificationRequest.update({
          where: { id: req.id },
          data: { status: "APPROVED", reviewedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: req.userId },
          data: isBlueTick
            ? { isVerified: true }
            : { isIdentityVerified: true },
        }),
        prisma.notification.create({
          data: {
            userId: req.userId,
            type: isBlueTick ? "VERIFY_BADGE" : "VERIFY_IDENTITY",
            title: isBlueTick
              ? "تیک آبی شما تایید شد"
              : "احراز هویت شما تایید شد",
            body: isBlueTick
              ? "پروفایل شما با موفقیت احراز شد. تیک آبی از این پس روی پروفایل شما نمایش داده می شود."
              : "هویت شما با موفقیت تایید شد. از این پس امکان برداشت برای شما فعال است.",
            data: JSON.stringify({ status: "APPROVED" }),
          },
        }),
      ]);
      await logAction(
        admin.id,
        isBlueTick ? "VERIFY_APPROVE" : "KYC_APPROVE",
        "USER",
        req.userId
      );
      console.log(`[admin/verify] admin ${admin.id} approved ${req.kind} request ${req.id}`);
    } else if (action === "REJECT") {
      await prisma.$transaction([
        prisma.verificationRequest.update({
          where: { id: req.id },
          data: { status: "REJECTED", reviewedAt: new Date() },
        }),
        prisma.notification.create({
          data: {
            userId: req.userId,
            type: isBlueTick ? "VERIFY_BADGE" : "VERIFY_IDENTITY",
            title: isBlueTick
              ? "درخواست تیک آبی رد شد"
              : "درخواست احراز هویت رد شد",
            body: "متاسفانه درخواست شما تایید نشد. لطفا مدارک باکیفیت تر و دقیق تر ارسال کنید.",
            data: JSON.stringify({ status: "REJECTED" }),
          },
        }),
      ]);
      await logAction(
        admin.id,
        isBlueTick ? "VERIFY_REJECT" : "KYC_REJECT",
        "USER",
        req.userId
      );
      console.log(`[admin/verify] admin ${admin.id} rejected ${req.kind} request ${req.id}`);
    } else {
      return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/verify POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

"use client";

// لندینگ پیج کندو: سبک اینستاگرام
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  MessagesSquare,
  Coins,
  MapPin,
  BadgeCheck,
  Sparkles,
  UserPlus,
  Search,
  ArrowLeft,
} from "lucide-react";
import { toPersianDigits, formatToman } from "@/lib/format";
import KandooLogo from "@/components/KandooLogo";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";

type Profile = {
  id: string;
  firstName: string;
  gender: string;
  age: number;
  city: string;
  province: string;
  job: string | null;
  height: number;
  photos: { url: string }[];
};

type Props = {
  profiles: Profile[];
  userCount: number;
  isLoggedIn: boolean;
  subscriptionPrice: number;
  coinValue: number;
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

export default function LandingClient({
  profiles,
  userCount,
  isLoggedIn,
  subscriptionPrice,
  coinValue,
}: Props) {
  const ctaHref = isLoggedIn ? "/dashboard" : "/register";

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* نوار بالا — مثل هدر اینستاگرام */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 border-b border-ig-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <KandooLogo href="/" iconClassName="w-8 h-8" textClassName="text-xl sm:text-2xl" />
          <nav className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-1.5 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover transition-colors"
              >
                پنل کاربری
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-lg text-sm font-bold text-foreground hover:bg-ig-gray-bg transition-colors"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-lg ig-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  ثبت نام رایگان
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* هیرو */}
      <section className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-ig-gray-bg text-foreground text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4 text-ig-blue" />
            {toPersianDigits(userCount)}+ عضو فعال در سراسر ایران
          </span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
          className="text-4xl sm:text-6xl font-bold leading-tight text-foreground"
        >
          نیمه گمشده ات را در{" "}
          <span className="ig-gradient-text">KanDoo</span>{" "}
          پیدا کن
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
          className="mt-6 text-base sm:text-lg text-ig-gray max-w-2xl mx-auto leading-8"
        >
          KanDoo یک جامعه امن برای آشنایی جدی و ازدواج است. پروفایل های تایید شده،
          هم شهری های شما و گفتگوی امن؛ همه در یک جا.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href={ctaHref}
            className="group w-full sm:w-auto px-8 py-3 rounded-lg ig-gradient text-white font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            همین حالا شروع کن
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <a
            href="#profiles"
            className="w-full sm:w-auto px-8 py-3 rounded-lg border border-ig-border text-foreground font-bold text-base hover:bg-ig-gray-bg transition-colors text-center"
          >
            مشاهده پروفایل ها
          </a>
        </motion.div>
      </section>

      {/* پروفایل های تایید شده — گرید مثل Explore */}
      <section id="profiles" className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <BadgeCheck className="w-7 h-7 text-ig-blue" />
            پروفایل های تایید شده
          </h2>
          <p className="mt-3 text-ig-gray text-sm">
            این پروفایل ها توسط تیم کندو بررسی و تایید شده اند
          </p>
        </motion.div>

        {profiles.length === 0 ? (
          <p className="text-center text-ig-gray py-10">
            به زودی پروفایل های تایید شده اینجا نمایش داده می شوند
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {profiles.map((p, i) => (
              <motion.div
                key={p.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={i * 0.5}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="bg-white border border-ig-border rounded-lg p-3 sm:p-5 text-center hover:shadow-md transition-shadow flex flex-col items-center"
              >
                {p.photos?.[0]?.url ? (
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0">
                    <Image src={p.photos[0].url} alt={p.firstName} fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                    <DefaultAvatar size={56} />
                  </div>
                )}
                <div className="mt-2 sm:mt-3 flex items-center justify-center gap-1 min-w-0 w-full">
                  <span className="font-bold text-foreground text-xs sm:text-sm truncate">{p.firstName}</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-ig-blue shrink-0" />
                </div>
                <p className="text-[10px] sm:text-xs text-ig-gray mt-1 truncate w-full">
                  {toPersianDigits(p.age)} ساله
                  {p.job ? ` · ${p.job}` : ""}
                </p>
                <p className="text-[10px] sm:text-xs text-ig-gray mt-1 sm:mt-2 flex items-center justify-center gap-1 truncate w-full">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{p.province}، {p.city}</span>
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ویژگی ها */}
      <section className="bg-ig-gray-bg border-y border-ig-border py-16">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12"
          >
            چرا KanDoo؟
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "پروفایل های تایید شده",
                desc: "هر پروفایل توسط مدیر سایت بررسی و تایید می شود تا خیالتان راحت باشد",
              },
              {
                icon: MapPin,
                title: "هم شهری های شما",
                desc: "فقط افرادی از شهر خودتان را می بینید تا آشنایی واقعی و در دسترس باشد",
              },
              {
                icon: MessagesSquare,
                title: "گفتگوی امن",
                desc: "چت خصوصی و امن با اشتراک ماهانه؛ بدون مزاحمت و پیام های بی هدف",
              },
              {
                icon: Coins,
                title: "کیف پول سکه",
                desc: "سیستم مالی شفاف بر پایه سکه با امکان برداشت و تبدیل به تومان",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={i}
                variants={fadeUp}
                className="p-6 rounded-lg bg-white border border-ig-border hover:border-ig-gray transition-colors"
              >
                <div className="w-10 h-10 rounded-lg ig-gradient flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-sm">{f.title}</h3>
                <p className="text-sm text-ig-gray leading-6">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* مراحل شروع */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12"
        >
          در سه قدم شروع کن
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: UserPlus,
              step: "۱",
              title: "ثبت نام و تکمیل مشخصات",
              desc: "نام، شهر، سن، قد، شغل و بقیه مشخصات خودت را وارد کن",
            },
            {
              icon: Search,
              step: "۲",
              title: "دیدن هم شهری ها",
              desc: "لیست افراد جنس مخالف در شهر خودت را ببین و انتخاب کن",
            },
            {
              icon: MessagesSquare,
              step: "۳",
              title: "شروع گفتگو",
              desc: "با خرید اشتراک، گفتگو را شروع کن و بیشتر آشنا شو",
            },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={i}
              variants={fadeUp}
              className="relative bg-white border border-ig-border rounded-lg p-8 text-center"
            >
              <span className="absolute -top-5 right-1/2 translate-x-1/2 w-10 h-10 rounded-full ig-gradient text-white font-bold flex items-center justify-center">
                {s.step}
              </span>
              <s.icon className="w-8 h-8 text-ig-blue mx-auto mt-3 mb-4" strokeWidth={1.5} />
              <h3 className="font-bold text-foreground mb-2 text-sm">{s.title}</h3>
              <p className="text-sm text-ig-gray leading-6">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* قیمت */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-2xl ig-gradient p-8 sm:p-12 text-white text-center"
        >
          <Coins className="w-10 h-10 mx-auto mb-4 opacity-90" strokeWidth={1.5} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            اشتراک ماهانه فقط {formatToman(subscriptionPrice)}
          </h2>
          <p className="opacity-90 leading-7 max-w-xl mx-auto text-sm">
            با سیستم سکه KanDoo، هر سکه {formatToman(coinValue)} ارزش دارد. سکه
            بخر، اشتراک فعال کن و هر وقت خواستی سکه هایت را به تومان تبدیل کن.
          </p>
          <Link
            href={ctaHref}
            className="inline-block mt-8 px-10 py-3 rounded-lg bg-white text-foreground font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            شروع رایگان
          </Link>
        </motion.div>
      </section>

      {/* فوتر */}
      <footer className="border-t border-ig-border bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KandooLogo color iconClassName="w-6 h-6" textClassName="text-lg" />
            <span className="text-ig-gray text-sm">| سایت همسریابی</span>
          </div>
          <p className="text-xs text-ig-gray">
            © {toPersianDigits(new Date().getFullYear())} KanDoo — همه حقوق محفوظ است
          </p>
        </div>
      </footer>
    </div>
  );
}

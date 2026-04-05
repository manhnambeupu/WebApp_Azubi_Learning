import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import "./landing.css";

export const metadata: Metadata = {
  title: "AzubiVN — Ôn thi Gastronomie miễn phí cho Azubi Việt Nam tại Đức",
  description:
    "Luyện thi Abschlussprüfung ngành Fachkraft für Gastronomie bằng tiếng Việt. Bài tập trắc nghiệm miễn phí + gia sư kèm riêng 1-1 bởi người có bằng AdA-Schein.",
  alternates: { canonical: "/" },
  keywords: [
    "Ausbildung",
    "Abschlussprüfung",
    "Gastronomie",
    "Fachkraft für Gastronomie",
    "Azubi Việt Nam",
    "ôn thi nghề Đức",
    "học nghề nhà hàng",
    "AdA-Schein",
    "luyện thi miễn phí",
    "gia sư nghề Đức",
  ],
  openGraph: {
    title: "AzubiVN — Ôn thi Gastronomie miễn phí",
    description:
      "Bài tập luyện thi Abschlussprüfung ngành Fachkraft für Gastronomie dành cho Azubi Việt Nam. 100% miễn phí, tiếng Việt.",
    type: "website",
    locale: "vi_VN",
    siteName: "AzubiVN",
    url: "/",
    images: [
      {
        url: "/images/Logo_Book.png",
        width: 800,
        height: 600,
        alt: "AzubiVN — Nền tảng ôn thi Ausbildung miễn phí",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AzubiVN — Ôn thi Gastronomie miễn phí cho Azubi Việt Nam",
    description:
      "Luyện thi Abschlussprüfung ngành Fachkraft für Gastronomie bằng tiếng Việt. 100% miễn phí.",
    images: ["/images/Logo_Book.png"],
  },
};

const schemas: Record<string, unknown>[] = [
  {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Ôn thi Abschlussprüfung Fachkraft für Gastronomie",
    description:
      "Khoá luyện thi miễn phí dành cho Azubi Việt Nam đang học nghề ngành nhà hàng tại Đức.",
    url: "https://azubivn.de/",
    image: "https://azubivn.de/images/Logo_Book.png",
    courseCode: "FKG-ABSCHLUSS",
    provider: {
      "@type": "EducationalOrganization",
      name: "AzubiVN",
      url: "https://azubivn.de",
      logo: "https://azubivn.de/images/Logo_Book.png",
      areaServed: { "@type": "Country", name: "Germany" },
    },
    inLanguage: "vi",
    isAccessibleForFree: true,
    educationalLevel: "Vocational",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: "Azubi (Auszubildende) Việt Nam tại Đức",
    },
    teaches: [
      "Abschlussprüfung Gastronomie",
      "Fachkraft für Gastronomie",
      "Ausbildung ngành nhà hàng",
    ],
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT1H",
      inLanguage: "vi",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Jason",
    jobTitle: "Gia sư Fachkraft für Gastronomie",
    description:
      "Tốt nghiệp Ausbildung ngành Gastronomie tại Đức, có chứng chỉ sư phạm nghề AdA-Schein.",
    image: "https://azubivn.de/images/avatar.jpg",
    knowsAbout: ["Fachkraft für Gastronomie", "Abschlussprüfung", "Ausbildung"],
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "Vocational Certificate",
        name: "Fachkraft für Gastronomie (Abschluss)",
      },
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "Teaching Certificate",
        name: "AdA-Schein (Ausbildereignungsprüfung)",
      },
    ],
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "Berufsschule in Deutschland",
    },
    worksFor: {
      "@type": "EducationalOrganization",
      name: "AzubiVN",
      url: "https://azubivn.de",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: "https://azubivn.de/",
      },
    ],
  },
];

const faqItems = [
  {
    question: "AzubiVN có thật sự miễn phí không?",
    answer:
      "Có. Toàn bộ bài học và bài tập trên nền tảng đều miễn phí 100%. Bọn mình vận hành bằng sự ủng hộ tự nguyện từ cộng đồng.",
  },
  {
    question: "Ai soạn nội dung bài học?",
    answer:
      "Nội dung được soạn bởi người đã tốt nghiệp Ausbildung ngành Gastronomie tại Đức và có bằng sư phạm nghề AdA-Schein.",
  },
  {
    question: "Mình đang học ngành khác, có dùng được không?",
    answer:
      "Hiện tại AzubiVN tập trung vào ngành Fachkraft für Gastronomie. Bọn mình đang có kế hoạch mở rộng sang các ngành nghề khác trong tương lai.",
  },
  {
    question: "Dịch vụ gia sư kèm riêng hoạt động thế nào?",
    answer:
      "Bạn liên hệ qua WhatsApp hoặc Email để trao đổi lịch học. Buổi học 1-1 online, linh hoạt theo giờ của bạn. Liên hệ để biết thêm chi tiết.",
  },
  {
    question: "Làm sao để ủng hộ AzubiVN?",
    answer:
      "Bạn có thể ủng hộ bọn mình qua PayPal, chỉ từ 2€. Mọi khoản ủng hộ đều giúp duy trì server và soạn thêm bài tập mới.",
  },
];

export default function Home() {
  return (
    <>
      <JsonLd data={schemas} faq={faqItems} />
      <section className="lingo-hero relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-16 text-center">
        <Image src="/images/bg-login.jpg" alt="" fill priority className="object-cover" />
        <div className="lingo-hero-overlay" />
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-4xl mx-auto">
          <Image
            src="/images/Logo_Book.png"
            width={160}
            height={160}
            alt="AzubiVN Logo"
            className="drop-shadow-lg"
            priority
          />
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Ôn thi Abschlussprüfung ngành Gastronomie — Miễn phí, bằng tiếng Việt
          </h1>
          <p className="text-xl text-white/90 max-w-3xl leading-relaxed">
            Bài tập tự luyện + gia sư kèm riêng dành cho Azubi Việt Nam tại Đức. Soạn bởi
            người đã tốt nghiệp Fachkraft für Gastronomie và có bằng AdA-Schein.
          </p>
          <Link href="/login" className="lingo-btn text-lg px-8 py-4">
            Bắt đầu luyện thi →
          </Link>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <span className="lingo-badge bg-white/20 text-white border-white/30">
              🎓 100% miễn phí
            </span>
            <span className="lingo-badge bg-white/20 text-white border-white/30">
              📱 Online 24/7
            </span>
            <span className="lingo-badge bg-white/20 text-white border-white/30">
              🇻🇳 Tiếng Việt
            </span>
          </div>
        </div>
      </section>

      <section className="lingo-section" style={{ backgroundColor: "var(--lingo-surface)" }}>
        <h2
          className="text-3xl md:text-4xl font-extrabold text-center mb-12"
          style={{ color: "var(--lingo-text)" }}
        >
          Tại sao nên học cùng AzubiVN?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="lingo-card flex flex-col items-center gap-4 p-8 text-center">
            <div className="lingo-icon-circle lingo-icon-circle--primary">📝</div>
            <h3 className="text-xl font-bold" style={{ color: "var(--lingo-text)" }}>
              Bài tập tự luyện
            </h3>
            <p style={{ color: "var(--lingo-text-secondary)" }}>
              Hệ thống câu hỏi trắc nghiệm bám sát đề thi Abschlussprüfung. Làm bài, nộp, và
              xem kết quả ngay.
            </p>
          </div>
          <div className="lingo-card flex flex-col items-center gap-4 p-8 text-center">
            <div className="lingo-icon-circle lingo-icon-circle--secondary">👨‍🏫</div>
            <h3 className="text-xl font-bold" style={{ color: "var(--lingo-text)" }}>
              Gia sư kèm riêng 1-1
            </h3>
            <p style={{ color: "var(--lingo-text-secondary)" }}>
              Được dạy trực tiếp bởi người đã tốt nghiệp Fachkraft và có chứng chỉ sư phạm
              nghề AdA-Schein. Hiểu rõ chương trình vì đã đi qua.
            </p>
          </div>
          <div className="lingo-card flex flex-col items-center gap-4 p-8 text-center">
            <div className="lingo-icon-circle lingo-icon-circle--warning">🇻🇳</div>
            <h3 className="text-xl font-bold" style={{ color: "var(--lingo-text)" }}>
              Nội dung tiếng Việt
            </h3>
            <p style={{ color: "var(--lingo-text-secondary)" }}>
              Toàn bộ bài học và giải thích bằng tiếng Việt. Giúp bạn hiểu sâu kiến thức thay
              vì chỉ dịch máy móc từ tiếng Đức.
            </p>
          </div>
        </div>
      </section>

      <section className="lingo-section" style={{ backgroundColor: "var(--lingo-bg-alt)" }}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative mx-auto max-w-[280px]">
            <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-[#58cc02] via-[#ffc800] to-[#58cc02] opacity-50 blur-sm" />
            <Image
              src="/images/avatar.jpg"
              width={280}
              height={280}
              alt="Jason — Gia sư Fachkraft für Gastronomie"
              className="relative rounded-full object-cover ring-4 ring-white shadow-xl"
            />
          </div>
          <div>
            <span className="lingo-badge">Fachkraft für Gastronomie • AdA-Schein</span>
            <h2
              className="text-3xl font-extrabold mt-4"
              style={{ color: "var(--lingo-text)" }}
            >
              Xin chào, mình là Jason 👋
            </h2>
            <p className="mt-4" style={{ color: "var(--lingo-text-secondary)" }}>
              Mình tốt nghiệp chương trình Ausbildung 2 năm ngành Fachkraft für Gastronomie
              tại Đức. Sau khi ra nghề, mình thi thêm bằng AdA-Schein (Ausbildereignung) —
              chứng chỉ sư phạm nghề cho phép đào tạo Azubi. Mình hiểu chương trình học từ A
              đến Z vì đã trải qua. Giờ mình muốn giúp các bạn Việt Nam cũng đang trên con
              đường này.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <a
                href="https://wa.me/4915758084635"
                target="_blank"
                rel="noopener noreferrer"
                className="lingo-card flex items-center gap-3 p-4 !border-b-4 hover:!border-b-[#58cc02]"
              >
                <div className="lingo-icon-circle lingo-icon-circle--primary !w-10 !h-10 !text-xl">
                  💬
                </div>
                <div>
                  <p className="font-bold" style={{ color: "var(--lingo-text)" }}>
                    WhatsApp
                  </p>
                  <p className="text-sm" style={{ color: "var(--lingo-text-secondary)" }}>
                    +49 15758084635
                  </p>
                </div>
              </a>
              <a
                href="mailto:bonziet@gmail.com"
                className="lingo-card flex items-center gap-3 p-4 !border-b-4 hover:!border-b-[#ce82ff]"
              >
                <div className="lingo-icon-circle lingo-icon-circle--secondary !w-10 !h-10 !text-xl">
                  ✉️
                </div>
                <div>
                  <p className="font-bold" style={{ color: "var(--lingo-text)" }}>
                    Email
                  </p>
                  <p className="text-sm" style={{ color: "var(--lingo-text-secondary)" }}>
                    bonziet@gmail.com
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="lingo-section" style={{ backgroundColor: "var(--lingo-surface)" }}>
        <h2
          className="text-3xl md:text-4xl font-extrabold text-center mb-12"
          style={{ color: "var(--lingo-text)" }}
        >
          3 bước để bắt đầu
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="lingo-step-number">1</div>
            <h3 className="text-xl font-bold" style={{ color: "var(--lingo-text)" }}>
              Đăng ký tài khoản
            </h3>
            <p style={{ color: "var(--lingo-text-secondary)" }}>
              Tạo tài khoản miễn phí bằng Email, Google, hoặc Facebook. Mất chưa tới 1 phút.
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="lingo-step-number">2</div>
            <h3 className="text-xl font-bold" style={{ color: "var(--lingo-text)" }}>
              Chọn bài học & làm quiz
            </h3>
            <p style={{ color: "var(--lingo-text-secondary)" }}>
              Bài học được sắp xếp theo chủ đề. Mỗi bài có phần lý thuyết và câu hỏi trắc
              nghiệm.
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="lingo-step-number">3</div>
            <h3 className="text-xl font-bold" style={{ color: "var(--lingo-text)" }}>
              Xem kết quả & ôn lại
            </h3>
            <p style={{ color: "var(--lingo-text-secondary)" }}>
              Hệ thống chấm điểm tự động. Xem lại đáp án đúng — sai để ôn tập hiệu quả.
            </p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link href="/login" className="lingo-btn text-lg px-8 py-4 mt-8">
            Đăng ký miễn phí →
          </Link>
        </div>
      </section>

      <section
        id="faq"
        className="lingo-section"
        style={{ backgroundColor: "var(--lingo-bg-alt)" }}
      >
        <h2
          className="text-3xl md:text-4xl font-extrabold text-center mb-12"
          style={{ color: "var(--lingo-text)" }}
        >
          Những câu hỏi hay gặp
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item) => (
            <details className="lingo-faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="lingo-footer">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <Image
                src="/images/Logo_Book.png"
                width={72}
                height={72}
                alt="AzubiVN Logo"
                className="brightness-0 invert opacity-80"
              />
              <p className="mt-4 text-white/80 text-sm leading-relaxed">
                AzubiVN — Nền tảng phi lợi nhuận hỗ trợ Azubi Việt Nam ôn thi nghề tại Đức.
              </p>
              <p className="text-white/50 text-sm mt-2">
                © 2026 AzubiVN. Tất cả nội dung miễn phí.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white/90 mb-4">Pháp lý</h3>
              <a
                href="/impressum"
                className="block text-white/70 hover:text-white transition-colors mb-2 text-sm"
              >
                Impressum
              </a>
              <a
                href="/datenschutz"
                className="block text-white/70 hover:text-white transition-colors mb-2 text-sm"
              >
                Datenschutzerklärung
              </a>
            </div>
            <div>
              <h3 className="font-bold text-white/90 mb-4">Liên hệ</h3>
              <a
                href="https://wa.me/4915758084635"
                className="block text-white/70 hover:text-white transition-colors mb-2 text-sm"
              >
                WhatsApp: +49 157 58084635
              </a>
              <a
                href="mailto:bonziet@gmail.com"
                className="block text-white/70 hover:text-white transition-colors mb-2 text-sm"
              >
                Email: bonziet@gmail.com
              </a>
            </div>
          </div>
          <hr className="border-white/20 my-8" />
          <p className="text-center text-sm text-white/50">
            Được xây dựng với ❤️ cho cộng đồng Azubi Việt Nam tại Đức
          </p>
        </div>
      </footer>
    </>
  );
}

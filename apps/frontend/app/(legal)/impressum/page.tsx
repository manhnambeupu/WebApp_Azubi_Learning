import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Rechtliche Hinweise und Anbieterkennzeichnung",
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white/80 p-8 shadow-lg backdrop-blur-sm sm:p-12 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Impressum
        </h1>

        <section className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Angaben gemäß § 5 TMG
            </h2>
            <p className="font-medium text-rose-600 dark:text-rose-400 mb-4 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-100 dark:border-rose-900/50">
              Dieses Projekt ist ein rein privates, nicht-kommerzielles Lernportal. Es werden keine Einnahmen erzielt und es wird keine Gewinnerzielungsabsicht verfolgt.
            </p>

            <p className="mt-2">
              <strong>[Tên đầy đủ của bạn : Nguyễn Lương Sơn ]</strong>
              <br />
              [Tên đường và số nhà: An der Glinder Au 67]
              <br />
              [Mã bưu điện PLZ: 22115] [Tên Thành Phố : Hamburg]
              <br />
              Deutschland
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2 mt-8">
              Kontakt
            </h2>
            <p>
              E-Mail: <span className="unicode-bidi">bonziet (at) gmail (dot) com</span>
            </p>
          </div>

          <div className="pt-8 text-sm text-slate-500">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Haftung für Inhalte
            </h3>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen
              Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
              als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

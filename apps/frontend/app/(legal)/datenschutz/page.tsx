import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Informationen zum Datenschutz (DSGVO)",
};

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white/80 p-8 shadow-lg backdrop-blur-sm sm:p-12 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Datenschutzerklärung
        </h1>

        <section className="space-y-8 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
              1. Datenschutz auf einen Blick
            </h2>
            <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
              Allgemeine Hinweise
            </h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
              personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
              Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem
              Text aufgeführten Datenschutzerklärung.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
              2. Verantwortlich für die Datenerfassung auf dieser Website
            </h2>
            <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber:</p>
            <p className="mt-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
              <strong>[Tên đầy đủ của bạn: Nguyễn Lương Sơn]</strong>
              <br />
              [Tên đường và số nhà: An der Glinder Au 67]
              <br />
              [Mã bưu điện PLZ: 22115] [Tên Thành Phố: Hamburg]
              <br />
              Deutschland
              <br />
              <br />
              E-Mail: bonziet (at) gmail (dot) com
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
              3. Datenerfassung auf unserer Website
            </h2>
            <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
              Cookies (Technisch notwendig)
            </h3>
            <p>
              Unsere Internetseiten verwenden teilweise sogenannte Cookies. Cookies richten auf
              Ihrem Rechner keinen Schaden an und enthalten keine Viren. Cookies dienen dazu, unser
              Angebot nutzerfreundlicher, effektiver und sicherer zu machen. Wir nutzen auf dieser
              Plattform ausschließlich **technisch notwendige Cookies** (z.B. JWT-Tokens für das
              Login), welche für den reibungslosen Betrieb der Lernplattform zwingend erforderlich
              sind. Wir setzen **keine** Werbe- oder Marketing-Tracker-Cookies ein.
            </p>

            <h3 className="font-medium text-slate-800 dark:text-slate-200 mt-5 mb-2">
              Registrierung & Authentifizierung
            </h3>
            <p>
              Wenn Sie sich auf unserer Website für den Zugang zum Lernportal registrieren, erheben
              wir Ihre E-Mail-Adresse und Ihren Namen. Diese Daten werden ausschließlich zum Zweck
              der Kontoverwaltung und Authentifizierung auf Basis von Art. 6 Abs. 1 lit. b DSGVO
              gespeichert.
            </p>

            <h3 className="font-medium text-slate-800 dark:text-slate-200 mt-5 mb-2">
              Ihre Rechte
            </h3>
            <p>
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und
              Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein
              Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

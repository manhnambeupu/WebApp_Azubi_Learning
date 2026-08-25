export default function DatenschutzPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] sm:p-10">
        <h1 className="text-3xl font-extrabold text-[#3c3c3c] dark:text-white mb-6">
          Datenschutzerklärung
        </h1>

        <section className="space-y-6 text-xs md:text-sm font-bold leading-relaxed text-[#777777] dark:text-slate-300">
          <div>
            <h2 className="text-base font-extrabold text-[#3c3c3c] dark:text-white mb-2">
              1. Datenschutz auf einen Blick
            </h2>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten
              passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
              persönlich identifiziert werden können.
            </p>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-[#3c3c3c] dark:text-white mb-2">
              2. Verantwortliche Stelle
            </h2>
            <p>Lương Thái Sơn</p>
            <p>An der Glinder Au 67</p>
            <p>22115 Hamburg</p>
            <p>Deutschland</p>
            <p>E-Mail:bonziet (at) gmail (dot) com</p>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-[#3c3c3c] dark:text-white mb-2">
              3. Datenerfassung auf unserer Website
            </h2>
            <h3 className="text-sm font-extrabold text-[#3c3c3c] dark:text-white mt-3 mb-1">Cookies (Technisch notwendig)</h3>
            <p className="mb-3">
              Wir nutzen auf dieser Plattform ausschließlich <strong>technisch notwendige Cookies</strong> (z.B. JWT-Tokens für das Login), welche für den reibungslosen Betrieb der Lernplattform zwingend erforderlich sind. Wir setzen <strong>keine</strong> Werbe- oder Marketing-Tracker-Cookies ein.
            </p>

            <h3 className="text-sm font-extrabold text-[#3c3c3c] dark:text-white mt-3 mb-1">Registrierung & Authentifizierung</h3>
            <p className="mb-3">
              Wenn Sie sich auf unserer Website für den Zugang zum Lernportal registrieren, erheben wir Ihre E-Mail-Adresse und Ihren Namen. Diese Daten werden ausschließlich zum Zweck der Kontoverwaltung, Authentifizierung und Bereitstellung der Lerninhalte auf Basis von Art. 6 Abs. 1 lit. b DSGVO gespeichert.
            </p>

            <h3 className="text-sm font-extrabold text-[#3c3c3c] dark:text-white mt-3 mb-1">Spenden über PayPal</h3>
            <p>
              Auf unserer Website bieten wir die Möglichkeit an, unsere Arbeit über PayPal zu unterstützen (Spenden-Button). Wenn Sie diesen Button anklicken, werden Sie auf die Website von PayPal weitergeleitet. Dabei werden ggf. Daten (wie Ihre IP-Adresse) an PayPal (Europe) S.à r.l. et Cie, S.C.A. übermittelt. Grundlage hierfür ist unser berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) an der Finanzierung unserer Plattform. Weitere Informationen zum Datenschutz bei PayPal finden Sie in deren Datenschutzerklärung.
            </p>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-[#3c3c3c] dark:text-white mb-2">
              4. Ihre Rechte
            </h2>
            <p>
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung, Sperrung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese jederzeit für die Zukunft widerrufen. Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

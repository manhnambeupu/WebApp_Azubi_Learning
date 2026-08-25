export default function ImpressumPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] sm:p-10">
        <h1 className="text-3xl font-extrabold text-[#3c3c3c] dark:text-white mb-6">
          Impressum
        </h1>

        <section className="space-y-6 text-xs md:text-sm font-bold leading-relaxed text-[#777777] dark:text-slate-300">
          <div>
            <h2 className="text-base font-extrabold text-[#3c3c3c] dark:text-white mb-2">
              Angaben gemäß § 5 DDG (ehemals TMG)
            </h2>
            <p>Lương Thái Sơn</p>
            <p>An der Glinder Au 67</p>
            <p>22115 Hamburg</p>
            <p>Deutschland</p>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-[#3c3c3c] dark:text-white mb-2">
              Kontakt
            </h2>
            <p>E-Mail: bonziet (at) gmail (dot) com</p>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-[#3c3c3c] dark:text-white mb-2">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>Nguyễn Lương Sơn</p>
            <p>An der Glinder Au 67, 22115 Hamburg</p>
            <p className="mt-2 text-[11px] font-medium italic">
              Hinweis zur Finanzierung: Diese Plattform wird kostenlos zur Verfügung gestellt. Zur Deckung der laufenden Server- und Wartungskosten bieten wir die Möglichkeit freiwilliger Spenden (z.B. über PayPal) an.
            </p>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-[#3c3c3c] dark:text-white mb-2">
              Haftung für Inhalte
            </h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 DDG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
              zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder
              Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
            </p>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-[#3c3c3c] dark:text-white mb-2">
              Haftung für Links
            </h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

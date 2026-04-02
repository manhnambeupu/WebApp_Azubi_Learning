type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

type FaqItem = {
  question: string;
  answer: string;
};

type JsonLdProps = {
  data: JsonLdValue;
  faq?: FaqItem[];
};

export function JsonLd({ data, faq }: JsonLdProps) {
  const normalizedFaq = faq?.filter(
    (item) => item.question.trim().length > 0 && item.answer.trim().length > 0,
  );
  const faqSchema =
    normalizedFaq && normalizedFaq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: normalizedFaq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;
  const payloadData = faqSchema
    ? [...(Array.isArray(data) ? data : [data]), faqSchema]
    : data;
  const payload = JSON.stringify(payloadData).replace(/</g, "\\u003c");

  return <script dangerouslySetInnerHTML={{ __html: payload }} type="application/ld+json" />;
}

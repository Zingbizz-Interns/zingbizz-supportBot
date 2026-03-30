const steps = [
  {
    number: "01",
    title: "Connect Your Data",
    description:
      "Enter your website URL or upload documents. We extract and process your content automatically.",
  },
  {
    number: "02",
    title: "Train in Seconds",
    description:
      "Click Train. Your chatbot becomes an expert on your business instantly — no waiting, no coding.",
  },
  {
    number: "03",
    title: "Embed Anywhere",
    description:
      "Copy one script tag. Paste it into your website's HTML. Your AI chatbot is live.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-[#2D3A31]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-serif)] text-4xl md:text-5xl font-bold text-white mb-4">
            Up and running in
            <br />
            <em>three steps</em>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 md:gap-16">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="font-[family-name:var(--font-serif)] text-6xl font-bold text-[#8C9A84]/40 mb-6">
                {step.number}
              </div>
              <h3 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="font-[family-name:var(--font-sans)] text-white/60 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

export function Hero() {
  return (
    <section className="pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <div className="inline-flex items-center rounded-full bg-[#8C9A84]/15 px-4 py-1.5 text-xs font-[family-name:var(--font-sans)] text-[#8C9A84] uppercase tracking-widest mb-8">
              AI-Powered Support
            </div>
            <h1 className="font-[family-name:var(--font-serif)] text-5xl md:text-7xl font-bold text-[#2D3A31] leading-[1.05] mb-6">
              Your website,
              <br />
              now <em>answers</em>
              <br />
              questions.
            </h1>
            <p className="font-[family-name:var(--font-sans)] text-lg text-[#2D3A31]/70 max-w-md mb-10 leading-relaxed">
              Create an AI chatbot trained on your business in minutes. Paste a
              URL, let it learn, and embed it on your site with one line of
              code.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-[#2D3A31] text-white px-10 py-4 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest transition-colors duration-300 hover:bg-[#3d5245]"
              >
                Start for free
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-[#8C9A84] text-[#8C9A84] px-10 py-4 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest transition-colors duration-300 hover:bg-[#8C9A84] hover:text-white"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Decorative arch image */}
          <div className="relative flex justify-center md:justify-end">
            <div
              className="w-72 h-96 md:w-80 md:h-[480px] bg-[#DCCFC2] flex items-center justify-center"
              style={{ borderRadius: "9999px 9999px 40px 40px" }}
            >
              <div className="text-center px-8">
                <div className="w-16 h-16 rounded-full bg-[#8C9A84]/30 flex items-center justify-center mx-auto mb-6">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8C9A84"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="font-[family-name:var(--font-serif)] text-xl italic text-[#2D3A31] leading-snug">
                  &ldquo;How can I help you today?&rdquo;
                </p>
                <p className="font-[family-name:var(--font-sans)] text-xs text-[#2D3A31]/50 mt-3 uppercase tracking-wider">
                  Your AI Assistant
                </p>
              </div>
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-4 -left-4 md:left-0 bg-white rounded-2xl p-4 shadow-[0_10px_30px_rgba(45,58,49,0.1)]">
              <p className="font-[family-name:var(--font-sans)] text-xs text-[#8C9A84] uppercase tracking-wide mb-1">
                Setup time
              </p>
              <p className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[#2D3A31]">
                &lt; 5 min
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

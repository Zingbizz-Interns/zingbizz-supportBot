import { Nav } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { Testimonials } from "@/components/marketing/testimonials";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { Footer } from "@/components/marketing/footer";

export default function HomePage() {
  return (
    <main>
      <Nav />
      <Hero />
      <Features />
      <Testimonials />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  );
}

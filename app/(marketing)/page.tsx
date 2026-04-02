import type { Metadata } from "next";
import { Nav } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { Testimonials } from "@/components/marketing/testimonials";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { Footer } from "@/components/marketing/footer";
import { getAbsoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Support for Your Business",
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ZingDesk - AI Support for Your Business",
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: siteConfig.ogImagePath,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} social preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZingDesk - AI Support for Your Business",
    description: siteConfig.description,
    images: [siteConfig.ogImagePath],
    creator: siteConfig.twitterHandle,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  url: siteConfig.siteUrl,
  description: siteConfig.description,
  operatingSystem: "Web",
  applicationCategory: "BusinessApplication",
  brand: {
    "@type": "Brand",
    name: siteConfig.name,
  },
  publisher: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
  },
  image: getAbsoluteUrl(siteConfig.ogImagePath),
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <Nav />
        <Hero />
        <Features />
        <Testimonials />
        <HowItWorks />
        <Pricing />
        <Footer />
      </main>
    </>
  );
}

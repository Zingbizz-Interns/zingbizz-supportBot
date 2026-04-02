const DEFAULT_SITE_URL = "http://127.0.0.1:3000";

function normalizeUrl(value?: string | null) {
  if (!value) return DEFAULT_SITE_URL;

  try {
    return new URL(value).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteConfig = {
  name: "ChatBot SaaS",
  shortName: "ChatBot SaaS",
  description:
    "Create an AI-powered chatbot trained on your website in minutes. Embed it anywhere with a single script tag.",
  keywords: [
    "AI chatbot",
    "customer support automation",
    "website chatbot",
    "RAG chatbot",
    "SaaS support chatbot",
    "embeddable AI assistant",
  ],
  creator: "ChatBot SaaS",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || undefined,
  siteUrl: normalizeUrl(process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL),
  ogImagePath: "/opengraph-image",
  themeColor: "#F9F8F4",
};

export function getMetadataBase() {
  return new URL(siteConfig.siteUrl);
}

export function getAbsoluteUrl(path = "/") {
  return new URL(path, siteConfig.siteUrl).toString();
}

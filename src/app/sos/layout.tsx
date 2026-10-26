import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata("/sos");

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

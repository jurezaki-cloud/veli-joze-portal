import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata("/kam-danes");

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

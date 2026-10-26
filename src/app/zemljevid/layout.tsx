import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata("/zemljevid");

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

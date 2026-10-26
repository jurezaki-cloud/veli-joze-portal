import Image from "next/image";
import Link from "next/link";
export default function Section({title,children}:{title:string,children:React.ReactNode}){
 return <main className="module" id="main-content">
  <div className="moduleTop">
   <Link href="/" className="moduleBrand"><span className="campLogo campLogoSmall"><Image src="/veli-logo-seo-1.14.1.png" alt="" width={48} height={48} unoptimized /></span><span><strong>VELI JOŽE</strong><small>KAMP SAVUDRIJA</small></span></Link>
   <Link href="/" className="back">← Nazaj na portal</Link>
  </div>
  <div className="moduleHead"><span>PORTAL PAVŠALISTOV · SAVUDRIJA</span><h1>{title}</h1></div>
  <section className="moduleCard">{children}</section>
  <footer className="moduleFooter"><b>VELI JOŽE · 1.14.1</b><span>Neuradni portal skupnosti pavšalistov Kampa Veli Jože</span><Link href="/pravila-skupnosti">Pravila skupnosti</Link></footer>
 </main>
}

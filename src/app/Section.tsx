import Link from "next/link";
export default function Section({title,children}:{title:string,children:React.ReactNode}){
 return <main className="module">
  <div className="moduleTop">
   <Link href="/" className="moduleBrand"><span className="miniBrand"><i/><b/></span><span><strong>VELI JOŽE</strong><small>KAMP SAVUDRIJA</small></span></Link>
   <Link href="/" className="back">← Nazaj na portal</Link>
  </div>
  <div className="moduleHead"><span>PORTAL PAVŠALISTOV · SAVUDRIJA</span><h1>{title}</h1><p>Naš kamp. Naša skupnost. Naše poletje.</p></div>
  <section className="moduleCard">{children}</section>
  <footer className="moduleFooter"><b>VELI JOŽE</b><span>Neuradni portal skupnosti pavšalistov Kampa Veli Jože</span></footer>
 </main>
}
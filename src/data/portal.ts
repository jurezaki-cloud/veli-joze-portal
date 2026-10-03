export type Pavsalist={id:number;ime:string;vzdevek:string;cona:string;online:boolean}
export type Obvestilo={id:number;naslov:string;datum:string;tip:"info"|"opozorilo"|"dogodek";vsebina:string}
export type Dogodek={id:number;naslov:string;datum:string;ura:string;kraj:string}
export type Oglas={id:number;naslov:string;cena:string;avtor:string;kategorija:string}
export const pavsalisti:Pavsalist[]=[{id:1,ime:"Jure",vzdevek:"Jure123",cona:"A",online:true},{id:2,ime:"Nina",vzdevek:"Nina",cona:"B",online:true},{id:3,ime:"Marko",vzdevek:"Marko",cona:"C",online:true}]
export const obvestila:Obvestilo[]=[{id:1,naslov:"Prekinitev vode v coni B",datum:"10. jul 2025, 08:15",tip:"opozorilo",vsebina:"Obvestilo skupnosti o začasni prekinitvi vode."},{id:2,naslov:"Dela na električnem omrežju",datum:"9. jul 2025, 19:42",tip:"opozorilo",vsebina:"Informacija o delih na omrežju."},{id:3,naslov:"Piknik pavšalistov",datum:"8. jul 2025, 12:30",tip:"dogodek",vsebina:"Skupnostno druženje pavšalistov."}]
export const dogodki:Dogodek[]=[{id:1,naslov:"Turnir v balinanju",datum:"12 JUL",ura:"17:00",kraj:"Veli Jože"},{id:2,naslov:"Večerno druženje",datum:"15 JUL",ura:"20:00",kraj:"Plaža"},{id:3,naslov:"Otroške igre",datum:"20 JUL",ura:"10:00",kraj:"Igrišče"}]
export const oglasi:Oglas[]=[{id:1,naslov:"Prodam kamp mizo",cena:"35 €",avtor:"Marko",kategorija:"Prodam"},{id:2,naslov:"Kupim senčnik",cena:"Po dogovoru",avtor:"Nina",kategorija:"Kupim"}]

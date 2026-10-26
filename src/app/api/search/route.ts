import {requireMember} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {privateJson} from "@/lib/community-security";
import {rateLimit} from "@/lib/rate-limit";
import {normalizeSearch,searchCategories,SearchResult} from "@/lib/portal-search";
const sourceLetters="čćšžđáàäâéèëêíìïîóòöôúùüû",targetLetters="ccszdaaaaeeeeiiiioooouuuu";
const normalized=(column:string)=>`translate(lower(${column}),'${sourceLetters}','${targetLetters}')`;
export async function GET(req:Request){
 const auth=await requireMember(req);if(auth.response)return auth.response;
 const params=new URL(req.url).searchParams,raw=params.get("q")||"",query=raw.trim().replace(/\s+/g," "),category=params.get("category")||"all",pageText=params.get("page")||"0";
 if(raw.length>500||query.length<2||query.length>80||query.split(" ").length>10||/[\u0000-\u0008\u000e-\u001f\u007f]/.test(query))return privateJson({ok:false,message:"Vnesi od 2 do 80 znakov in največ 10 besed."},400);
 if(!searchCategories.some(x=>x.value===category)||!/^\d{1,2}$/.test(pageText)||Number(pageText)>49)return privateJson({ok:false,message:"Neveljaven filter ali stran rezultatov."},400);
 const page=Number(pageText);
 try{
  const limited=await rateLimit(req,`portal-search-${auth.user!.id}`,60,60000);if(limited)return limited;
  const rows=await getDatabase().query<SearchResult>(`with content as (
   select id,'announcement'::text kind,title,content body,type detail,''::text status,published_at created_at,'/obvestila'::text href from announcements where archived_at is null
   union all
   select id,'event',title,description,concat_ws(' · ',event_date::text,left(event_time::text,5),location),'',created_at,'/dogodki' from events where archived_at is null and (event_date+event_time) at time zone 'Europe/Zagreb'>now()
   union all
   select l.id,'listing',l.title,l.description,concat_ws(' · ',l.category,nullif(l.price,'')),l.sale_status,l.created_at,'/oglasi' from listings l join members m on m.id=l.author_id where l.status='approved' and m.approved=true
   union all
   select p.id,p.board,p.title,p.description,p.location,p.status,p.created_at,case when p.board='help' then '/pomoc-sosedov' else '/izgubljeno-najdeno' end from community_posts p join members m on m.id=p.author_id where p.status!='archived' and m.approved=true
  ), normalized as (
   select *,${normalized("concat_ws(' ',title,body,detail)")} search_text,${normalized("title")} title_text from content
  ) select id,kind,title,body,detail,status,created_at,href from normalized
   where ($2::text='all' or kind=$2) and not exists(select 1 from unnest(string_to_array($1::text,' ')) word where strpos(search_text,word)=0)
   order by (title_text=$1::text) desc,(strpos(title_text,$1::text)>0) desc,created_at desc,kind,id
   limit 21 offset $3::int`,[normalizeSearch(query),category,page*20]);
  return privateJson({ok:true,data:rows.rows.slice(0,20),hasMore:rows.rows.length>20&&page<49,page,query,category});
 }catch{return privateJson({ok:false,message:"Iskanje trenutno ni dosegljivo. Poskusi znova."},503)}
}

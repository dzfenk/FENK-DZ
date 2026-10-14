const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const clean=(s,max=500)=>String(s||'').replace(/\\s+/g,' ').trim().slice(0,max);
function meta(html,name){const r=new RegExp(`<meta[^>]+(?:property|name)=["']${name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}["'][^>]+content=["']([^"']*)["'][^>]*>`,`i`).exec(html)||new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}["'][^>]*>`,`i`).exec(html);return r?clean(r[1],1000):''}
function title(html){const m=/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);return clean(m?.[1],300)}
function decode(s){return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
export default async request=>{
 if(request.method!=='POST')return json(405,{message:'METHOD_NOT_ALLOWED'});
 try{
  const {url}=await request.json();
  if(!/^https?:\/\//i.test(String(url||'')))return json(400,{message:'رابط غير صالح'});
  const u=new URL(url); const r=await fetch(u,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 FENK-Product-Inspector/1.0','accept':'text/html,application/xhtml+xml'}});
  const html=await r.text();
  if(!r.ok||html.length<100)return json(422,{message:'الموقع لم يسمح بقراءة الصفحة',partial:true,url});
  const data={url,site:u.hostname.replace(/^www\\./,''),title:decode(meta(html,'og:title')||meta(html,'twitter:title')||title(html)),description:decode(meta(html,'og:description')||meta(html,'description')||''),image:decode(meta(html,'og:image')||meta(html,'twitter:image')||''),price:decode(meta(html,'product:price:amount')||meta(html,'og:price:amount')||''),currency:decode(meta(html,'product:price:currency')||meta(html,'og:price:currency')||'')};
  if(!data.title&&!data.image&&!data.description)return json(200,{...data,partial:true,message:'لم نجد بيانات المنتج في الصفحة.'});
  return json(200,data);
 }catch(e){return json(502,{message:'تعذر الوصول إلى الموقع من الخادم.',partial:true});}
}

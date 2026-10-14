(function(){
  const U='https://wqfnzahjwlukncxlxdkp.supabase.co',K='sb_publishable__QR4tJ9p5RYOQkIuHkoYKQ_mbDa9tuA';
  const db2=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const DEFAULT={
    meta:{title:'FENK — كل ما تحتاجه في مكان واحد',announcement:'FENK يجيبلك • الدفع محليًا 🇩🇿 عبر بريد موب فقط • توصيل إلى الجزائر • تابع طلبك خطوة بخطوة',whatsapp:'213778939292'},
    hero:{enabled:true,type:'image',image:'assets/fenk-hero-fenkdz.webp',video:'',alt:'FENK DZ'},
    logo:{enabled:true,type:'image',image:'assets/logo-clean.webp',video:'',alt:'FENK',widthDesktop:170,widthMobile:94,offsetX:0,offsetY:0},
    marketplace:{title:'FENK Marketplace',subtitle:'منتجات • متاجر • سيارات • عقارات • أراضي',button:'فتح السوق ←',url:'marketplace.html'},
    promo:{enabled:true,items:['✨ عروض خاصة على طلباتك الأولى','لا تحتاج إلى Visa أو Mastercard','الدفع محليًا في الجزائر 🇩🇿 • بريد موب فقط','تابع طلبك خطوة بخطوة','من الرابط إلى باب منزلك','🔥 FENK يجيبلك من المواقع العالمية']},
    magic:{enabled:true,kicker:'🦊 FENK MAGIC',title:'لقيت حاجة؟ خلّي FENK يتكفّل بالباقي.',text:'أرسل رابطًا أو صورة أو اكتب ما تبحث عنه. نرتّب لك المعلومات ونجهّز طلبك.',resultTitle:'بعد الإرسال',resultText:'FENK يجهّز لك معلومات المنتج والسعر والخطوة التالية.',payment:'🟢 الدفع محليًا عبر بريد موب'},
    intelligence:{enabled:true,kicker:'🦊 FENK INTELLIGENCE',title:'من رابط إلى قرار شراء',text:'حلّل المنتج، شاهد المعلومات التي أمكن استخراجها، ثم جهّز طلبك أو راقبه بالسعر الذي تريده.',button:'🔎 حلّل المنتج',status:'جاهز — أرسل رابطًا للبدء.'},
    order:{enabled:true,title:'اطلب منتجك',subtitle:'4 خطوات قصيرة من المنتج إلى المراجعة'},
    ads:{enabled:true,label:'إعلانات FENK • تتغير تلقائيًا',slides:[1,2,3,4,5,6].map(i=>({image:`assets/fenk-ad-0${i}.jpg`,alt:`إعلان FENK ${i}`,href:'#order'}))},
    priceWatch:{enabled:true,title:'🔔 راقب السعر',subtitle:'حدد السعر الذي يناسبك، وسجّل المنتج لمراجعته عندما ينخفض السعر.'},
    calculator:{enabled:true,title:'💰 احسب السعر التقريبي',subtitle:'أدخل القيم المتوفرة لديك للحصول على تقدير سريع بالدينار الجزائري.'},
    videos:{enabled:true,title:'شاهد كيف FENK يجيبلك 🔥',subtitle:'مقاطع قصيرة توضّح التجربة من أول رابط حتى التوصيل',items:[{title:'من أي موقع عالمي إلى الجزائر',text:'شاهد رحلة طلبك',video:'assets/promo1.mp4',poster:'assets/hero-ref.webp'},{title:'كيف ترسل رابط المنتج؟',text:'خطوات بسيطة وسريعة',video:'assets/promo2.mp4',poster:'assets/tutorial-ref.webp'},{title:'الدفع عبر بريد موب',text:'محلي، واضح وآمن',video:'assets/promo3.mp4',poster:'assets/payment-ref.webp'}]},
    services:{enabled:true,title:'خدمات FENK ✨',subtitle:'أقسام إضافية مستوحاة من تجربة منصات الخدمات الرقمية، لكن بهوية FENK.',items:[{icon:'🎁',title:'بطاقات وهدايا',text:'بطاقات ألعاب ومنصات حسب الطلب',url:'#order'},{icon:'🔥',title:'الخدمات الأكثر طلبًا',text:'اختر الخدمة وأرسل الرابط إلى FENK',url:'#order'},{icon:'🛒',title:'شراء من المواقع العالمية',text:'AliExpress، Amazon، eBay، Temu والمزيد',url:'#order'},{icon:'🎮',title:'شحن الألعاب',text:'شحن مباشر وبطاقات رقمية',url:'game-topup.html?v=130'}]},
    popular:{enabled:true,title:'الأكثر طلبًا 🔥',subtitle:'اختصارات سريعة للخدمات التي يمكن طلبها من FENK.',items:[{icon:'📱',title:'هواتف وإكسسوارات',url:'#order'},{icon:'💻',title:'إلكترونيات',url:'#order'},{icon:'👟',title:'أزياء وأحذية',url:'#order'},{icon:'🏠',title:'منتجات منزلية',url:'#order'},{icon:'🎁',title:'بطاقات رقمية',url:'#order'},{icon:'🎮',title:'ألعاب وشحن',url:'game-topup.html?v=130'},{icon:'🔔',title:'راقب السعر',url:'#price-watch'}]},
    why:{enabled:true,title:'لماذا FENK يجيبلك؟',items:[{icon:'headphones',title:'دعم دائم',text:'نحن معك في كل خطوة'},{icon:'shield-check',title:'أسعار شفافة',text:'بدون رسوم خفية'},{icon:'zap',title:'سرعة في المعالجة',text:'وتحديث مستمر لطلبك'},{icon:'package',title:'توصيل إلى كل الولايات',text:'بأمان وموثوقية'}]},
    stages:{enabled:true,title:'مراحل الطلب',subtitle:'من الرابط إلى باب منزلك',items:[{icon:'link-2',text:'إرسال الرابط\nأو الصورة'},{icon:'search',text:'التحقق من المنتج\nوحساب السعر'},{icon:'circle-dollar-sign',text:'تأكيد السعر\nمن طرف الإدارة'},{icon:'credit-card',text:'دفع عبر بريد موب\nورفع إثبات الدفع'},{icon:'shopping-cart',text:'شراء المنتج\nبواسطة FENK'},{icon:'package',text:'الشحن\nومتابعة التتبع'},{icon:'truck',text:'وصول إلى الجزائر\nوتسليمه لك'}]},
    ai:{enabled:true,kicker:'FENK AI',title:'محتار ماذا تشتري؟',text:'أرسل صورة المنتج أو اكتب ما تبحث عنه، وFENK AI يساعدك في البحث والمقارنة والمواصفات والطلب والدفع والمتابعة.',button:'اسأل FENK AI'},
    payment:{enabled:true,title:'الدفع محليًا في الجزائر 🇩🇿 • بريد موب فقط',subtitle:'محلي، واضح، وسريع'},
    contact:{enabled:true,title:'تواصل معنا عبر WhatsApp',text:'بعد إرسال طلبك، سنتواصل معك عبر WhatsApp لتأكيد السعر والدفع.'},
    footer:{tagline:'كل ما تحتاجه .. في مكان واحد',copyright:'© 2026 FENK · جميع الحقوق محفوظة. من الجزائر إلى العالم'},
    visibility:{games:true,marketplace:true,share:true,tutorial:true,trust:true,services:true,popular:true,videos:true,calculator:true,priceWatch:true},custom_css:''
  };
  let cfg=JSON.parse(JSON.stringify(DEFAULT));
  const get=(o,path)=>path.split('.').reduce((a,k)=>a?.[k],o);
  const set=(o,path,v)=>{const p=path.split('.');let x=o;for(let i=0;i<p.length-1;i++)x=x[p[i]]??=(Number.isInteger(+p[i+1])?[]:{});x[p[p.length-1]]=v};
  const input=(label,path,type='text',ph='')=>`<label class="sb-field"><span>${esc(label)}</span><input data-sb-path="${esc(path)}" type="${type}" value="${esc(get(cfg,path)??'')}" placeholder="${esc(ph)}"></label>`;
  const videoInput=(label,path,typePath='')=>`<label class="sb-field sb-image-field"><span>${esc(label)}</span><div class="sb-image-tools"><input data-sb-path="${esc(path)}" type="text" value="${esc(get(cfg,path)??'')}" placeholder="رابط أو مسار الفيديو"><button type="button" class="sb-upload-btn" data-sb-video-upload-path="${esc(path)}" data-sb-video-type-path="${esc(typePath)}">🎥 رفع فيديو</button><input class="sb-hidden-file" data-sb-video-file-for="${esc(path)}" type="file" accept="video/mp4,video/webm,video/quicktime"></div></label>`;
  const imageInput=(label,path)=>`<label class="sb-field sb-image-field"><span>${esc(label)}</span><div class="sb-image-tools"><input data-sb-path="${esc(path)}" type="text" value="${esc(get(cfg,path)??'')}" placeholder="رابط أو مسار الصورة"><button type="button" class="sb-upload-btn" data-sb-upload="${esc(path)}">📷 تغيير الصورة</button><input class="sb-hidden-file" data-sb-file-for="${esc(path)}" type="file" accept="image/*"></div><div class="sb-image-preview"><img src="${esc(get(cfg,path)??'')}" alt="معاينة" onerror="this.style.display='none'" onload="this.style.display='block'"></div></label>`;
  const textarea=(label,path,rows=3)=>{let v=get(cfg,path)??'';if(path==='promo.items'&&Array.isArray(v))v=v.join('\n');return `<label class="sb-field sb-wide"><span>${esc(label)}</span><textarea data-sb-path="${esc(path)}" rows="${rows}">${esc(v)}</textarea></label>`};
  const check=(label,path)=>`<label class="sb-check"><input data-sb-path="${esc(path)}" type="checkbox" ${get(cfg,path)!==false?'checked':''}><span>${esc(label)}</span></label>`;
  function section(title,html){return `<div class="sb-group"><div class="sb-group-head"><h4>${title}</h4></div><div class="sb-grid">${html}</div></div>`}
  function build(){
    const box=$('siteBuilderForm');if(!box)return;
    let h='';
    h+=section('⚙️ الهوية العامة',input('عنوان الصفحة / المتصفح','meta.title')+textarea('شريط الإعلان العلوي','meta.announcement',2)+input('WhatsApp بدون +','meta.whatsapp','tel'));
    h+=section('🦊 Hero',check('إظهار Hero','hero.enabled')+`<label class="sb-field"><span>نوع Hero</span><select data-sb-path="hero.type"><option value="image" ${get(cfg,'hero.type')!=='video'?'selected':''}>🖼️ صورة</option><option value="video" ${get(cfg,'hero.type')==='video'?'selected':''}>🎥 فيديو</option></select></label>`+imageInput('صورة Hero','hero.image')+videoInput('فيديو Hero','hero.video','hero.type')+input('النص البديل','hero.alt'));
    h+=section('🦊 تحكم في شعار FENK العلوي',check('إظهار الشعار','logo.enabled')+`<label class="sb-field"><span>نوع الشعار</span><select data-sb-path="logo.type"><option value="image" ${get(cfg,'logo.type')!=='video'?'selected':''}>🖼️ صورة</option><option value="video" ${get(cfg,'logo.type')==='video'?'selected':''}>🎥 فيديو</option></select></label>`+imageInput('صورة الشعار','logo.image')+videoInput('فيديو الشعار','logo.video','logo.type')+input('النص البديل','logo.alt')+input('العرض على الكمبيوتر (px)','logo.widthDesktop','number')+input('العرض على الهاتف (px)','logo.widthMobile','number')+input('تحريك يمين / يسار (px)','logo.offsetX','number')+input('تحريك أعلى / أسفل (px)','logo.offsetY','number')+`<div class="sb-row-actions"><button type="button" class="admin-secondary-btn" id="sbResetLogo">↩️ استعادة الشعار الأصلي</button></div>`);
    h+=section('🛍️ شريط Marketplace',input('الاسم','marketplace.title')+input('الوصف','marketplace.subtitle')+input('الزر','marketplace.button')+input('الرابط','marketplace.url'));
    h+=section('📢 الشريط المتحرك',check('إظهار الشريط','promo.enabled')+textarea('الجمل — كل جملة في سطر','promo.items',5));
    h+=section('✨ FENK Magic',check('إظهار القسم','magic.enabled')+input('Kicker','magic.kicker')+input('العنوان','magic.title')+textarea('الوصف','magic.text')+input('عنوان النتيجة','magic.resultTitle')+input('نص النتيجة','magic.resultText')+input('نص الدفع','magic.payment'));
    h+=section('🧠 FENK Intelligence',check('إظهار القسم','intelligence.enabled')+input('Kicker','intelligence.kicker')+input('العنوان','intelligence.title')+textarea('الوصف','intelligence.text')+input('زر التحليل','intelligence.button')+input('رسالة الحالة','intelligence.status'));
    h+=section('🛒 طلب منتج',check('إظهار القسم','order.enabled')+input('العنوان','order.title')+input('الوصف','order.subtitle'));
    h+=section('🔔 مراقبة السعر',check('إظهار القسم','priceWatch.enabled')+input('العنوان','priceWatch.title')+textarea('الوصف','priceWatch.subtitle'));
    h+=section('💰 حاسبة السعر',check('إظهار القسم','calculator.enabled')+input('العنوان','calculator.title')+textarea('الوصف','calculator.subtitle'));
    h+=section('🤖 FENK AI',check('إظهار القسم','ai.enabled')+input('Kicker','ai.kicker')+input('العنوان','ai.title')+textarea('الوصف','ai.text')+input('الزر','ai.button'));
    h+=section('💳 الدفع',check('إظهار القسم','payment.enabled')+input('العنوان','payment.title')+input('الوصف','payment.subtitle'));
    h+=section('📞 التواصل',check('إظهار القسم','contact.enabled')+input('العنوان','contact.title')+textarea('الوصف','contact.text'));
    h+=`<div class="sb-group"><div class="sb-group-head"><h4>🖼️ إعلانات Hero / Carousel</h4><p>اختر صورة أو فيديو لكل شريحة، وارفع وسائط جديدة، وأضف أو احذف أي شريحة بدون تعديل الكود.</p></div><div id="sbAdsRows"></div><div class="sb-row-actions"><button type="button" class="admin-secondary-btn sb-add-row" id="sbAddAd">➕ إضافة صورة / فيديو إعلان</button></div></div>`;
    h+=`<div class="sb-group"><div class="sb-group-head"><h4>✨ خدمات FENK</h4><p>تحكم في الاسم، الأيقونة، الوصف والرابط.</p></div><div id="sbServicesRows"></div></div>`;
    h+=`<div class="sb-group"><div class="sb-group-head"><h4>🔥 الأكثر طلبًا</h4></div><div id="sbPopularRows"></div></div>`;
    h+=`<div class="sb-group"><div class="sb-group-head"><h4>💚 لماذا FENK</h4></div><div id="sbWhyRows"></div></div>`;
    h+=`<div class="sb-group"><div class="sb-group-head"><h4>🧭 مراحل الطلب</h4></div><div id="sbStagesRows"></div></div>`;
    h+=section('🎬 الفيديوهات',check('إظهار القسم','videos.enabled')+input('العنوان','videos.title')+textarea('الوصف','videos.subtitle')+`<div class="sb-field sb-wide"><span>صور الفيديوهات (Poster)</span><div id="sbVideoRows"></div></div>`);
    h+=`<div class="sb-group"><div class="sb-group-head"><h4>👁️ إظهار / إخفاء أقسام أخرى</h4></div><div class="sb-check-grid">${check('شحن الألعاب','visibility.games')}${check('المواقع المدعومة','visibility.marketplace')}${check('مشاركة FENK','visibility.share')}${check('شرح نسخ الرابط','visibility.tutorial')}${check('مزايا الثقة','visibility.trust')}${check('الخدمات','visibility.services')}${check('الأكثر طلبًا','visibility.popular')}${check('الفيديوهات','visibility.videos')}${check('الحاسبة','visibility.calculator')}${check('مراقبة السعر','visibility.priceWatch')}</div></div>`;
    h+=section('🎨 تحكم متقدم',textarea('CSS مخصص للصفحة — اختياري','custom_css',8)+`<label class="sb-field sb-wide"><span>JSON كامل لإعدادات الصفحة</span><textarea id="sbRawJson" rows="14" spellcheck="false">${esc(JSON.stringify(cfg,null,2))}</textarea></label>`);
    box.innerHTML=h;
    renderRows();
    box.querySelectorAll('[data-sb-path]').forEach(el=>el.addEventListener('input',()=>syncField(el)));
    box.querySelectorAll('[data-sb-path][type=checkbox]').forEach(el=>el.addEventListener('change',()=>syncField(el)));
    $('sbRawJson')?.addEventListener('change',()=>{try{cfg=JSON.parse($('sbRawJson').value);build()}catch(e){setMsg('JSON غير صالح: '+e.message,'error')}});
  }
  function syncField(el){const p=el.dataset.sbPath;let v=el.type==='checkbox'?el.checked:el.value;if(p==='promo.items')v=String(v).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);set(cfg,p,v);if($('sbRawJson'))$('sbRawJson').value=JSON.stringify(cfg,null,2)}
  function rowHtml(arr,key,fields){return arr.map((x,i)=>`<div class="sb-row sb-row-rich"><b>#${i+1}</b>${fields.map(f=>f.image?`<label><span>${esc(f.label)}</span><div class="sb-image-tools"><input data-sb-array="${key}" data-sb-index="${i}" data-sb-field="${f.key}" value="${esc(x[f.key]??'')}"><button type="button" class="sb-upload-btn" data-sb-row-upload="${esc(key)}" data-sb-row-index="${i}" data-sb-row-field="${esc(f.key)}">📷 تغيير</button><input class="sb-hidden-file" data-sb-row-file="${esc(key)}|${i}|${esc(f.key)}" type="file" accept="image/*"></div><img class="sb-row-preview" src="${esc(x[f.key]??'')}" alt="" onerror="this.style.display='none'"></label>`:f.video?`<label><span>${esc(f.label)}</span><div class="sb-image-tools"><input data-sb-array="${key}" data-sb-index="${i}" data-sb-field="${f.key}" value="${esc(x[f.key]??'')}"><button type="button" class="sb-upload-btn" data-sb-row-video-upload="${esc(key)}" data-sb-row-index="${i}" data-sb-row-field="${esc(f.key)}">🎥 رفع</button><input class="sb-hidden-file" data-sb-row-video-file="${esc(key)}|${i}|${esc(f.key)}" type="file" accept="video/mp4,video/webm,video/quicktime"></div></label>`:`<label><span>${esc(f.label)}</span><input data-sb-array="${key}" data-sb-index="${i}" data-sb-field="${f.key}" value="${esc(x[f.key]??'')}" ${f.type?`type="${f.type}"`:''}></label>`).join('')}<button type="button" class="sb-delete-row" data-sb-delete-row="${esc(key)}" data-sb-delete-index="${i}">🗑️ حذف</button></div>`).join('')}
  async function uploadImage(file){
    if(!file || !file.type.startsWith('image/')) throw new Error('اختر ملف صورة صالحًا.');
    if(file.size>10*1024*1024) throw new Error('حجم الصورة يجب ألا يتجاوز 10MB.');
    const {data:{session}}=await db2.auth.getSession();
    if(!session?.user) throw new Error('انتهت جلسة الإدارة. سجّل الدخول مرة أخرى.');
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const path=`${session.user.id}/site-builder/${crypto.randomUUID()}.${ext}`;
    const up=await db2.storage.from('marketplace-images').upload(path,file,{contentType:file.type,upsert:false});
    if(up.error) throw up.error;
    const {data}=db2.storage.from('marketplace-images').getPublicUrl(path);
    if(!data?.publicUrl) throw new Error('تعذر الحصول على رابط الصورة.');
    return data.publicUrl;
  }
  async function uploadVideo(file){
    if(!file || !file.type.startsWith('video/')) throw new Error('اختر ملف فيديو صالحًا.');
    if(file.size>50*1024*1024) throw new Error('حجم الفيديو يجب ألا يتجاوز 50MB.');
    const {data:{session}}=await db2.auth.getSession();
    if(!session?.user) throw new Error('انتهت جلسة الإدارة. سجّل الدخول مرة أخرى.');
    const ext=(file.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,'')||'mp4';
    const path=`${session.user.id}/site-builder/videos/${crypto.randomUUID()}.${ext}`;
    const up=await db2.storage.from('marketplace-images').upload(path,file,{contentType:file.type,upsert:false});
    if(up.error) throw up.error;
    const {data}=db2.storage.from('marketplace-images').getPublicUrl(path);
    if(!data?.publicUrl) throw new Error('تعذر الحصول على رابط الفيديو.');
    return data.publicUrl;
  }
  function bindImageTools(){
    document.querySelectorAll('[data-sb-upload]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector(`[data-sb-file-for="${CSS.escape(btn.dataset.sbUpload)}"]`)?.click()));
    document.querySelectorAll('[data-sb-file-for]').forEach(fileEl=>fileEl.addEventListener('change',async()=>{
      const path=fileEl.dataset.sbFileFor, file=fileEl.files?.[0]; if(!file)return;
      const btn=document.querySelector(`[data-sb-upload="${CSS.escape(path)}"]`); if(btn)btn.disabled=true;
      try{setMsg('جارٍ رفع الصورة…');const url=await uploadImage(file);set(cfg,path,url);build();setMsg('✓ تم رفع الصورة. اضغط حفظ لتطبيقها.','success')}catch(e){setMsg(e?.message||'تعذر رفع الصورة.','error')}finally{if(btn)btn.disabled=false}
    }));
  }
  function renderRows(){
    const vr=$('sbVideoRows'); if(vr) vr.innerHTML=(cfg.videos.items||[]).map((x,i)=>`<div class="sb-video-row"><b>#${i+1}</b><span>${esc(x.title||'فيديو')}</span><div class="sb-image-tools"><input data-sb-video-poster="${i}" value="${esc(x.poster||'')}"><button type="button" class="sb-upload-btn" data-sb-video-upload="${i}">📷 تغيير الصورة</button><input class="sb-hidden-file" data-sb-video-file="${i}" type="file" accept="image/*"></div><img class="sb-row-preview" src="${esc(x.poster||'')}" alt="" onerror="this.style.display='none'"></div>`).join('');
    $('sbAdsRows').innerHTML=rowHtml(cfg.ads.slides,'ads.slides',[{key:'image',label:'الصورة',image:true},{key:'video',label:'الفيديو',video:true},{key:'alt',label:'النص/Alt'},{key:'href',label:'الرابط'}]);
    $('sbServicesRows').innerHTML=rowHtml(cfg.services.items,'services.items',[{key:'icon',label:'الأيقونة'},{key:'title',label:'الاسم'},{key:'text',label:'الوصف'},{key:'url',label:'الرابط'}]);
    $('sbPopularRows').innerHTML=rowHtml(cfg.popular.items,'popular.items',[{key:'icon',label:'الأيقونة'},{key:'title',label:'الاسم'},{key:'url',label:'الرابط'}]);
    $('sbWhyRows').innerHTML=rowHtml(cfg.why.items,'why.items',[{key:'icon',label:'Lucide icon'},{key:'title',label:'العنوان'},{key:'text',label:'الوصف'}]);
    $('sbStagesRows').innerHTML=rowHtml(cfg.stages.items,'stages.items',[{key:'icon',label:'Lucide icon'},{key:'text',label:'النص'}]);
    document.querySelectorAll('[data-sb-array]').forEach(el=>el.addEventListener('input',()=>{const a=el.dataset.sbArray.split('.').reduce((o,k)=>o[k],cfg);a[Number(el.dataset.sbIndex)][el.dataset.sbField]=el.value;if($('sbRawJson'))$('sbRawJson').value=JSON.stringify(cfg,null,2)}));
    document.querySelectorAll('[data-sb-delete-row]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.dataset.sbDeleteRow.split('.').reduce((o,k)=>o[k],cfg);a.splice(Number(btn.dataset.sbDeleteIndex),1);build()}));
    document.querySelectorAll('[data-sb-row-upload]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector(`[data-sb-row-file="${CSS.escape(btn.dataset.sbRowUpload+'|'+btn.dataset.sbRowIndex+'|'+btn.dataset.sbRowField)}"]`)?.click()));
    document.querySelectorAll('[data-sb-row-file]').forEach(fileEl=>fileEl.addEventListener('change',async()=>{const file=fileEl.files?.[0];if(!file)return;const [key,idx,field]=fileEl.dataset.sbRowFile.split('|');try{setMsg('جارٍ رفع الصورة…');const url=await uploadImage(file);const a=key.split('.').reduce((o,k)=>o[k],cfg);a[Number(idx)][field]=url;build();setMsg('✓ تم تغيير الصورة. اضغط حفظ لتطبيقها.','success')}catch(e){setMsg(e?.message||'تعذر رفع الصورة.','error')}}));
    document.querySelectorAll('[data-sb-row-video-upload]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector(`[data-sb-row-video-file="${CSS.escape(btn.dataset.sbRowVideoUpload+'|'+btn.dataset.sbRowIndex+'|'+btn.dataset.sbRowField)}"]`)?.click()));
    document.querySelectorAll('[data-sb-row-video-file]').forEach(fileEl=>fileEl.addEventListener('change',async()=>{const file=fileEl.files?.[0];if(!file)return;const [key,idx,field]=fileEl.dataset.sbRowVideoFile.split('|');try{setMsg('جارٍ رفع الفيديو…');const url=await uploadVideo(file);const a=key.split('.').reduce((o,k)=>o[k],cfg);a[Number(idx)][field]=url;build();setMsg('✓ تم رفع الفيديو. اضغط حفظ.','success')}catch(e){setMsg(e?.message||'تعذر رفع الفيديو.','error')}}));
    bindImageTools();
    document.querySelectorAll('[data-sb-video-poster]').forEach(el=>el.addEventListener('input',()=>{cfg.videos.items[Number(el.dataset.sbVideoPoster)].poster=el.value;if($('sbRawJson'))$('sbRawJson').value=JSON.stringify(cfg,null,2)}));
    document.querySelectorAll('[data-sb-video-upload]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector(`[data-sb-video-file="${CSS.escape(btn.dataset.sbVideoUpload)}"]`)?.click()));
    document.querySelectorAll('[data-sb-video-file]').forEach(el=>el.addEventListener('change',async()=>{const file=el.files?.[0];if(!file)return;try{setMsg('جارٍ رفع صورة الفيديو…');const url=await uploadImage(file);cfg.videos.items[Number(el.dataset.sbVideoFile)].poster=url;build();setMsg('✓ تم تغيير صورة الفيديو. اضغط حفظ.','success')}catch(e){setMsg(e?.message||'تعذر رفع الصورة.','error')}}));
    document.querySelectorAll('[data-sb-video-upload-path]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector(`[data-sb-video-file-for="${CSS.escape(btn.dataset.sbVideoUploadPath)}"]`)?.click()));
    document.querySelectorAll('[data-sb-video-file-for]').forEach(el=>el.addEventListener('change',async()=>{const file=el.files?.[0];if(!file)return;const path=el.dataset.sbVideoFileFor;const btn=document.querySelector(`[data-sb-video-upload-path="${CSS.escape(path)}"]`);const typePath=btn?.dataset.sbVideoTypePath;try{setMsg('جارٍ رفع الفيديو…');const url=await uploadVideo(file);set(cfg,path,url);if(typePath)set(cfg,typePath,'video');build();setMsg('✓ تم رفع الفيديو. اضغط حفظ.','success')}catch(e){setMsg(e?.message||'تعذر رفع الفيديو.','error')}}));
    $('sbResetLogo')?.addEventListener('click',()=>{cfg.logo={enabled:true,type:'image',image:'assets/logo-clean.webp',video:'',alt:'FENK',widthDesktop:170,widthMobile:94,offsetX:0,offsetY:0};build();setMsg('تمت استعادة الشعار الأصلي. اضغط حفظ لتطبيقه.','success')});
    const addAd=$('sbAddAd'); if(addAd)addAd.onclick=()=>{cfg.ads.slides.push({image:'',video:'',alt:`إعلان FENK ${cfg.ads.slides.length+1}`,href:'#order'});build()};
  }
  function setMsg(t,type=''){const e=$('siteBuilderMsg');if(e){e.textContent=t;e.className='admin-msg '+type}}
  async function load(){
    const {data,error}=await db2.from('site_settings').select('homepage_config').eq('id',true).maybeSingle();
    if(error){setMsg('تعذر تحميل إعدادات الصفحة: '+error.message,'error');return}
    cfg={...JSON.parse(JSON.stringify(DEFAULT)),...(data?.homepage_config||{})};
    // Deep merge simple objects/arrays from stored config.
    const merge=(a,b)=>{for(const k of Object.keys(b||{})){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
    cfg=merge(JSON.parse(JSON.stringify(DEFAULT)),data?.homepage_config||{});build();setMsg('تم تحميل إعدادات الصفحة الحالية ✓');
  }
  async function save(){
    const b=$('saveSiteBuilder');b.disabled=true;setMsg('جارٍ حفظ إعدادات الصفحة…');
    try{
      const {data:{session}}=await db2.auth.getSession();if(!session?.user)throw new Error('انتهت جلسة الإدارة. سجّل الدخول مرة أخرى.');
      const {data:admin}=await db2.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();if(!admin)throw new Error('هذا الحساب ليس Admin.');
      const {error}=await db2.from('site_settings').upsert({id:true,homepage_config:cfg,updated_at:new Date().toISOString()},{onConflict:'id'});if(error)throw error;
      $('sbRawJson').value=JSON.stringify(cfg,null,2);setMsg('✓ تم حفظ كل إعدادات الصفحة. افتح الموقع أو حدّثه لرؤية التغييرات.','success');
      window.FENKSiteBuilder?.apply(cfg);
    }catch(e){console.error(e);setMsg(e?.message||'تعذر الحفظ.','error')}finally{b.disabled=false}
  }
  document.addEventListener('click',e=>{
    const tab=e.target.closest?.('.admin-tab[data-tab="siteBuilder"]');if(tab){setTimeout(load,60)}
  });
  document.addEventListener('DOMContentLoaded',()=>{
    $('saveSiteBuilder')?.addEventListener('click',save);
    $('reloadSiteBuilder')?.addEventListener('click',load);
    $('exportSiteBuilder')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fenk-homepage-config.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
    $('importSiteBuilder')?.addEventListener('click',()=>{const f=$('importSiteBuilderFile')?.files?.[0];if(!f){setMsg('اختر ملف JSON أولًا.','error');return}const r=new FileReader();r.onload=()=>{try{cfg=JSON.parse(r.result);build();setMsg('تم تحميل الملف. اضغط حفظ لتطبيقه.','success')}catch(e){setMsg('ملف JSON غير صالح.','error')}};r.readAsText(f)});
  });
})();

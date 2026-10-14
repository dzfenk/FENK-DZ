const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const clean = (v, max = 8000) => String(v ?? '').trim().slice(0, max);

const SYSTEM = `أنت FENK AI، مساعد شراء تابع لخدمة FENK في الجزائر.
تحدث بالعربية افتراضيًا، وافهم الفرنسية والدارجة الجزائرية. إذا كتب المستخدم بفرنسية أو دارجة، يمكنك الرد بنفس الأسلوب.
مهمتك: فهم ما يريد المستخدم، تحليل وصف/صورة المنتجات، شرح المواصفات، اقتراح أسئلة مفيدة، مقارنة منتجات عندما تتوفر بيانات، وشرح طريقة الطلب والدفع عبر بريد موب.
لا تخترع سعرًا حاليًا، توفرًا، شحنًا، أو معلومات لم ترها. إذا لم تتوفر بيانات حقيقية قل بوضوح إنها تحتاج تحققًا.
لا تقل إنك اشتريت المنتج أو تتبعت الشحنة إلا إذا أعطاك النظام بيانات تثبت ذلك.
عندما يرسل المستخدم صورة، صف المنتج المحتمل والعناصر المرئية، واذكر درجة الثقة بشكل لفظي (مرتفع/متوسط/منخفض) بدل رقم مخترع.
عندما يكون هناك رابط أو بيانات مستخرجة من صفحة، استخدمها كسياق ولا تعتبرها ضمانًا للسعر النهائي.
اجعل الرد عمليًا وقصيرًا، ويمكنك استخدام نقاط وعناوين عربية.`;

export default async request => {
  if (request.method !== 'POST') return json(405, { message: 'METHOD_NOT_ALLOWED' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json(503, { message: 'FENK AI غير مفعّل بعد. أضف OPENAI_API_KEY إلى متغيرات Netlify.' });

  try {
    const body = await request.json();
    const message = clean(body?.message, 5000);
    const image = typeof body?.image === 'string' ? body.image : '';
    const productContext = body?.productContext && typeof body.productContext === 'object'
      ? JSON.stringify(body.productContext).slice(0, 12000)
      : '';

    if (!message && !image) return json(400, { message: 'اكتب سؤالك أو أرسل صورة.' });
    if (image && !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(image)) {
      return json(400, { message: 'صيغة الصورة غير مدعومة.' });
    }
    if (image && image.length > 8_000_000) return json(413, { message: 'الصورة كبيرة جدًا. اختر صورة أصغر من فضلك.' });

    const content = [];
    if (message) content.push({ type: 'input_text', text: message });
    if (productContext) content.push({ type: 'input_text', text: `سياق منتج مستخرج من FENK:\n${productContext}` });
    if (image) content.push({ type: 'input_image', image_url: image, detail: 'high' });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.FENK_AI_MODEL || 'gpt-5.6-luna',
        instructions: SYSTEM,
        input: [{ role: 'user', content }],
        max_output_tokens: 900
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('OpenAI error', response.status, data);
      return json(502, { message: 'تعذر الاتصال بـ FENK AI حاليًا. حاول مرة أخرى.' });
    }

    const output = Array.isArray(data.output)
      ? data.output.flatMap(item => Array.isArray(item.content) ? item.content : [])
          .filter(x => x.type === 'output_text' && x.text)
          .map(x => x.text)
          .join('\n')
      : '';

    if (!output) return json(502, { message: 'لم يصل رد من FENK AI. حاول مرة أخرى.' });
    return json(200, { reply: output, model: data.model || process.env.FENK_AI_MODEL || 'gpt-5.6-luna' });
  } catch (error) {
    console.error('FENK AI function error', error);
    return json(500, { message: 'حدث خطأ أثناء تشغيل FENK AI.' });
  }
};

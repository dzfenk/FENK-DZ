# FENK V200 — Google + Telegram Login

تم تعديل صفحة تسجيل الدخول الحالية لتعرض طريقتين فقط:
- Google OAuth عبر Supabase.
- Telegram Login Widget عبر بوت FENK_DZ_Bot.

## ما تم تغييره
- تصميم نافذة الدخول قريب من واجهة منصات الشحن: شعار FENK، زران واضحان، وفاصل «أو».
- الحفاظ على Supabase وRLS وبيانات الحسابات الحالية.
- إضافة Edge Function باسم `telegram-login` للتحقق من Telegram server-side قبل إنشاء/تسجيل جلسة Supabase.
- عدم استبدال رقم الهاتف الموجود في ملف profile عند تسجيل الدخول عبر Telegram.
- Google يعيد المستخدم إلى `https://fenk.site/index.html`.

## خطوة مطلوبة مرة واحدة في Telegram
في BotFather للبوت `@FENK_DZ_Bot` اضبط Domain على:
`fenk.site`

بعد ذلك افتح صفحة تسجيل الدخول في `https://fenk.site/` واختبر الزرين.

ملاحظة: تسجيل Telegram يعتمد على `TELEGRAM_BOT_TOKEN` الموجود في Supabase Edge Function secrets. لا تضع التوكن داخل ملفات الموقع.

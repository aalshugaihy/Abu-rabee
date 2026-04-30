# 🚀 دليل النشر على Render — Abu-Rabee

> **Render Deployment Guide** — step-by-step deployment of the Abu-Rabee
> platform to [Render.com](https://render.com) using the included
> `render.yaml` blueprint.

---

## ما الذي ستحصل عليه؟

عند انتهاء النشر سيكون لديك ثلاث موارد متكاملة:

| المورد | النوع | الخطة | ماذا يفعل |
|---|---|---|---|
| `abu-rabee-db`     | PostgreSQL 16     | Free (90 يوم) | قاعدة بيانات الإنتاج |
| `abu-rabee-api`    | Node Web Service  | Free          | الـ API + WebSocket |
| `abu-rabee-client` | Static Site       | Free          | واجهة Vite SPA |

---

## ✅ متطلبات قبل البدء

1. **حساب GitHub** يحتوي على هذا الـ repo (الفرع `main`).
2. **حساب Render مجاني** — [render.com/register](https://render.com/register).
3. الـ PR رقم #1 مدموج إلى `main` (أو شغّل من فرع آخر مباشرة).

---

## الخطوات التفصيلية

### 1️⃣ ادمج الـ PR إلى main

في صفحة الـ PR على GitHub:

1. اضغط **Merge pull request**
2. اختر **Squash and merge** (أنظف للتاريخ) أو **Rebase and merge**
3. **Confirm**

هذا يضمن أن `render.yaml` موجود على الفرع الذي ستربطه Render.

---

### 2️⃣ سجّل دخول Render

اذهب إلى [https://dashboard.render.com](https://dashboard.render.com) وسجّل دخولك.

> تلميح: استخدم زر **Sign up with GitHub** ليُربط الحساب تلقائياً.

---

### 3️⃣ أنشئ Blueprint

1. من لوحة التحكم اضغط **New +** (أعلى يمين الصفحة) → **Blueprint**.
2. ربط GitHub: اضغط **Connect GitHub** ووافق على إذن الوصول للـ repo `aalshugaihy/abu-rabee`.
3. اختر الـ repo: `aalshugaihy/abu-rabee`، الفرع: `main`.
4. Render سيقرأ `render.yaml` تلقائياً ويعرض ملخّصاً:

   ```
   ✓ Database: abu-rabee-db (PostgreSQL 16, frankfurt)
   ✓ Web Service: abu-rabee-api (Node, frankfurt)
   ✓ Static Site: abu-rabee-client
   ```

5. اضغط **Apply** أسفل الصفحة.

> الإعداد يستغرق **5–10 دقائق** للبناء الأول.

---

### 4️⃣ راقب البناء

في Render → **Dashboard**، ستظهر الموارد الثلاثة. اضغط على كل واحدة لمتابعة الـ logs:

| المورد | متى يكون جاهزاً |
|---|---|
| `abu-rabee-db` | فوراً (~30 ثانية) |
| `abu-rabee-api` | عند ظهور `abu-rabee server listening on :4000` في الـ logs |
| `abu-rabee-client` | عند ظهور `Live ✓` بجانب اسم الموقع |

---

### 5️⃣ تعبئة بيانات تجريبية (موصى به)

بعد جاهزية الـ API:

1. افتح **abu-rabee-api** → تبويب **Shell**
2. شغّل:
   ```bash
   npm run seed
   ```
3. سيُنشئ ثلاث حسابات:

   | البريد | كلمة المرور | الدور |
   |---|---|---|
   | `admin@aburabee.gov`  | `admin1234`  | مدير |
   | `staff@aburabee.gov`  | `staff1234`  | موظف |
   | `viewer@aburabee.gov` | `viewer1234` | قارئ |

---

### 6️⃣ افتح المنصة

من لوحة Render → `abu-rabee-client` → اضغط على الرابط بأعلى الصفحة:

```
https://abu-rabee-client.onrender.com
```

سجّل دخول بحساب المدير، وستجد:
- ✅ Dashboard مع الإحصائيات
- ✅ Committees / Requests / Tasks بالبيانات التجريبية
- ✅ Realtime يعمل (افتح نافذتين وعدّل بيانات → ترى التحديث في الأخرى فوراً)
- ✅ Activity log يعرض تسجيل الدخول الذي قمت به للتو

---

## 🔧 خيارات التخصيص

### تغيير المنطقة الجغرافية

في `render.yaml` غيّر `region:` إلى أحد:
- `frankfurt` (افتراضي — أوروبا)
- `oregon` (أمريكا الغربية)
- `ohio` (أمريكا الشرقية)
- `singapore` (آسيا)

ثم ادفع التغيير وأعد تشغيل الـ blueprint.

### نطاق مخصص (Custom Domain)

لكل خدمة في Render:
1. افتح الخدمة → **Settings** → **Custom Domains** → **Add**
2. اتبع تعليمات DNS لإضافة CNAME

ثم **حدّث env vars**:
- في `abu-rabee-api`: غيّر `CLIENT_ORIGIN` إلى نطاقك الجديد
- في `abu-rabee-client`: غيّر `VITE_API_URL` إلى نطاق الـ API الجديد
  - **مهم:** هذا متغيّر **build-time**، فيجب إعادة بناء الـ static site من تبويب **Manual Deploy → Clear build cache & deploy**.

### تفعيل Email حقيقي

في `abu-rabee-api` → **Environment**:
1. غيّر `NODEMAIL_TRANSPORT` من `noop` إلى `smtp`
2. أضف:
   - `SMTP_HOST` = خادم SMTP (مثل `smtp.sendgrid.net`)
   - `SMTP_PORT` = `587` (أو 465 لـ SSL)
   - `SMTP_USER` = اسم المستخدم
   - `SMTP_PASS` = كلمة المرور / API key
   - `MAIL_FROM` = `Abu-Rabee <noreply@your-domain.com>`
3. **Save Changes** → الخدمة ستعيد التشغيل تلقائياً.

### ترقية الخطط (إزالة قيود الـ free tier)

| القيد | الترقية | السعر |
|---|---|---|
| الخادم ينام بعد 15 دقيقة خمول | API → **Starter** | $7/شهر |
| Postgres تنتهي بعد 90 يوم | DB → **Starter** | $7/شهر |
| موارد محدودة | حسب الحاجة | متغيّر |

في Render → الخدمة → **Settings** → **Plan** → اختر الخطة الجديدة.

---

## 🧪 قائمة التحقق بعد النشر

- [ ] فتح الـ static site → الصفحة الرئيسية تظهر بالعربية
- [ ] تبديل اللغة إلى الإنجليزية → يعمل (RTL → LTR)
- [ ] تسجيل دخول `admin` → يدخل لوحة التحكم
- [ ] إضافة لجنة → تظهر فوراً في القائمة
- [ ] فتح المنصة في نافذتين، تعديل في الأولى → يظهر toast "تم استلام تحديث" في الثانية
- [ ] فتح `https://abu-rabee-api.onrender.com/api/docs` → Swagger UI يعمل
- [ ] فتح `https://abu-rabee-api.onrender.com/health` → `{"ok":true}`
- [ ] فتح `https://abu-rabee-api.onrender.com/ready` → `{"ok":true,"db":"up"}`
- [ ] صفحة Activity → ترى أحداث الـ login المسجّلة
- [ ] حساب `viewer` → لا يستطيع إضافة/تعديل/حذف (الأزرار مخفية أو 403)

### ✅ تحقق آلي بأمر واحد

شغّل هذا من جهازك بعد انتهاء النشر — سيمر على ~13 فحصاً (health, ready, swagger, login, refresh, CORS preflight, frontend index, SPA fallback) ويبلّغك بأي شيء معطّل:

```bash
./scripts/check-deploy.sh \
  https://abu-rabee-api.onrender.com \
  https://abu-rabee-client.onrender.com
```

النتيجة المتوقعة:
```
✅  All 13 checks passed.
```

إذا فشل CORS فالسكريبت يقترح الإصلاح بنفسه (تحديث `CLIENT_ORIGIN` على
الـ API ليطابق رابط الواجهة).

---

## 🔥 حلّ المشاكل (Troubleshooting)

### "Application failed to respond" عند فتح الموقع

السبب: الـ web service مجاني ينام بعد الخمول، الطلب الأول يستغرق ~30 ثانية لإيقاظه.
**الحل:** انتظر 30 ثانية وأعد التحميل، أو ترقية إلى **Starter** plan.

### تسجيل الدخول لا يحفظ الـ cookie

السبب: غالباً `CLIENT_ORIGIN` لا يطابق رابط الـ static site.
**الحل:**
1. تحقّق من `abu-rabee-api` → **Environment** → `CLIENT_ORIGIN`.
2. يجب أن يطابق رابط الـ static site تماماً (بدون `/` نهائية).
3. تأكّد من أن `COOKIE_SAMESITE=none` (مطلوب لـ cross-origin).

### Frontend لا يصل للـ API

السبب: `VITE_API_URL` غير صحيح، أو لم يُعَد بناؤه بعد التغيير.
**الحل:**
1. `abu-rabee-client` → **Environment** → تأكّد من `VITE_API_URL`.
2. اضغط **Manual Deploy** → **Clear build cache & deploy**.

### Postgres expired (بعد 90 يوماً)

السبب: الخطة المجانية تنتهي بعد 90 يوماً.
**الحل:**
1. خذ نسخة احتياطية: Render → DB → **Backups** → **Download**
2. ترقية إلى **Starter** ($7/شهر) أو إنشاء قاعدة جديدة واستيراد النسخة.

### CI أخضر لكن build فشل في Render

السبب الأشهر: نقص `prisma generate` أو خطأ في الـ schema.
**الحل:** افتح **Logs** للـ web service وتحقّق من الخطأ. تأكّد من أن `npm run prepare:production` نجح في البداية.

---

## 📞 ماذا أفعل بعد ذلك؟

أرسل لي رابط الـ static site (`https://....onrender.com`) فور انتهاء النشر، وسأساعدك في:
- التحقق من سلامة كل الميزات
- ضبط أي إعداد إضافي
- إضافة بيانات حقيقية أو استيرادها
- تحسينات أداء أو ميزات جديدة

---

## 🌐 English summary

If you prefer English: this guide is mirrored in `README.md` under
**Option D — One-click deploy to Render**. The blueprint (`render.yaml`)
provisions a free PostgreSQL DB + Node API + static SPA in one go.

```
1. Merge PR #1 to main
2. Render → New → Blueprint → connect this repo
3. Render reads render.yaml, builds everything (~5–10 min)
4. (Optional) render shell --service abu-rabee-api → npm run seed
5. Open https://abu-rabee-client.onrender.com and sign in
```

Free tier caveats: web service sleeps after 15 min idle (~30s cold start);
Postgres free plan expires after 90 days. Upgrade to Starter ($7/mo each)
for production use.

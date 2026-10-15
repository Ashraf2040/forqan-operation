from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
    Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable)
from reportlab.lib.colors import HexColor

OUT = r"C:\Users\Programming\Desktop\operation-plan\output\pdf\دليل-إعداد-AWS-ورفع-الشواهد.pdf"
pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold", italic="Arial", boldItalic="Arial-Bold")
GREEN = HexColor("#236b55")
MINT = HexColor("#eaf4ee")
GOLD = HexColor("#b28a4b")
INK = HexColor("#263b33")
MUTED = HexColor("#66776f")
LINE = HexColor("#dce7df")

styles = getSampleStyleSheet()
def sty(name, **kw):
    base = dict(fontName="Arial", fontSize=10, leading=17, textColor=INK,
                alignment=TA_RIGHT, wordWrap="RTL", shaping=0, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)

title = sty("TitleAr", fontName="Arial-Bold", fontSize=25, leading=36, textColor=GREEN, spaceAfter=8)
subtitle = sty("SubAr", fontSize=12, leading=21, textColor=MUTED, spaceAfter=12)
h1 = sty("H1Ar", fontName="Arial-Bold", fontSize=17, leading=25, textColor=GREEN, spaceBefore=5, spaceAfter=10)
h2 = sty("H2Ar", fontName="Arial-Bold", fontSize=12, leading=19, textColor=GREEN, spaceBefore=5, spaceAfter=5)
body = sty("BodyAr", fontSize=9.5, leading=16, spaceAfter=5)
small = sty("SmallAr", fontSize=8.5, leading=14, textColor=MUTED, spaceAfter=3)
stepstyle = sty("StepAr", fontSize=9.2, leading=15, spaceAfter=0)
numstyle = sty("Num", fontName="Arial-Bold", fontSize=11, leading=16, textColor=GREEN, alignment=TA_CENTER, wordWrap="RTL", shaping=1)
code = ParagraphStyle("Code", fontName="Courier", fontSize=8.2, leading=13, textColor=INK, alignment=TA_LEFT, wordWrap="CJK", spaceAfter=0)
center = sty("CenterAr", alignment=TA_CENTER, fontSize=9, leading=15)

def P(text, style=body): return Paragraph(text, style)
def step(n, text):
    t = Table([[P(text, stepstyle), P(str(n), numstyle)]], colWidths=[16.1*cm, 0.8*cm], hAlign="RIGHT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.white),
        ("BOX", (0,0), (-1,-1), .5, LINE), ("ROUNDEDCORNERS", [7]),
        ("BACKGROUND", (1,0), (1,0), MINT),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 9), ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ]))
    return KeepTogether([t, Spacer(1, 5)])

def box(text, bg=MINT, border=LINE):
    t = Table([[P(text, body)]], colWidths=[16.9*cm], hAlign="RIGHT")
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),bg),("BOX",(0,0),(-1,-1),.7,border),
        ("LEFTPADDING",(0,0),(-1,-1),11),("RIGHTPADDING",(0,0),(-1,-1),11),
        ("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),9)]))
    return t

def link(label, url):
    return f'<link href="{url}" color="#236b55"><u>{label}</u></link>'

class GuideDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=A4, rightMargin=2.05*cm, leftMargin=2.05*cm,
                         topMargin=2.15*cm, bottomMargin=1.8*cm, title="دليل إعداد AWS ورفع الشواهد",
                         author="منصة الخطة التشغيلية")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="main", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate(id="all", frames=frame, onPage=self.decorate)])
    def decorate(self, canvas, doc):
        canvas.saveState()
        w, h = A4
        canvas.setFillColor(GREEN); canvas.rect(0, h-0.42*cm, w, 0.42*cm, stroke=0, fill=1)
        canvas.setStrokeColor(LINE); canvas.line(2.05*cm, 1.35*cm, w-2.05*cm, 1.35*cm)
        canvas.setFont("Arial", 8); canvas.setFillColor(MUTED)
        canvas.drawRightString(w-2.05*cm, .92*cm, "دليل ربط شواهد البرامج بـ AWS")
        canvas.drawString(2.05*cm, .92*cm, f"{doc.page}")
        canvas.restoreState()

story = []
story += [Spacer(1, .25*cm), P("دليل إعداد AWS<br/>وربط شواهد البرامج", title),
          P("خطوات عملية لإعداد قاعدة PostgreSQL على Amazon RDS، وتخزين الملفات في S3، وربطها بسجلات البرامج ومستويات المتابعة.", subtitle),
          HRFlowable(width="100%", thickness=1.2, color=GOLD, spaceBefore=2, spaceAfter=12),
          P("الصورة ببساطة", h1),
          box("<b>Amazon RDS / PostgreSQL</b> يحفظ بيانات الشاهد وعلاقته بالمرحلة والبرنامج والمستوى. <b>Amazon S3</b> يحفظ الملف نفسه. التطبيق يتصل بالخدمتين من الخادم، ولا توضع كلمات المرور أو مفاتيح AWS في الواجهة."),
          Spacer(1, 10), P("قبل أن تبدأ", h2),
          P("ستحتاج إلى حساب AWS، واسم نطاق/استضافة للتطبيق أو خطة لنقله إلى AWS، وصلاحية إنشاء RDS وS3 وIAM. اختر منطقة قريبة من التطبيق، وراجع تقدير التكلفة قبل إنشاء الموارد.", body),
          P("كيف يرتبط الشاهد بالبرنامج؟", h2),
          P("المشروع لديه جدول Evidence في Prisma. كل سجل يحمل stage وprogramId وprogramTitle وlevel، بالإضافة إلى الحالة والملاحظات وبيانات الملف. لذلك يظهر الشاهد ضمن البرنامج والمستوى اللذين اختارهما المستخدم.", body),
          box("<b>مهم:</b> الكود الحالي يحفظ الملف داخل public/uploads محليًا. إعداد قاعدة RDS وحده ينقل بيانات السجلات فقط. لإرسال الملفات إلى AWS، أكمل خطوة S3 في الصفحة الرابعة من هذا الدليل.", bg=HexColor("#fff6e8"), border=HexColor("#ecd8b5")),
          Spacer(1, 8), P("الخطة المقترحة", h2),
          P("1) إنشاء RDS خاصة داخل شبكة VPC. &nbsp; 2) إنشاء S3 مع حظر الوصول العام. &nbsp; 3) ضبط أسرار التطبيق والاتصال. &nbsp; 4) إنشاء جداول Prisma. &nbsp; 5) تعديل الرفع والتنزيل ليستخدما S3.", body),
          PageBreak(), P("الخطوة الأولى: قاعدة البيانات على RDS", h1),
          P("من AWS Console افتح خدمة Amazon RDS. اختر إنشاء PostgreSQL بإعدادات Standard create حتى تظهر خيارات الشبكة والنسخ الاحتياطي.", body),
          step("١", "اختر المنطقة (Region) المناسبة، ثم افتح <b>Databases → Create database → Standard create</b> واختر <b>PostgreSQL</b> والمحرك المدعوم من التطبيق."),
          step("٢", "اختر إعدادًا صغيرًا للتجربة أو حجمًا مناسبًا للاستخدام الفعلي. أدخل معرّفًا مثل <b>alfurqan-evidence</b> واسم مستخدم قاعدة البيانات. خزّن كلمة المرور بأمان ولا تضعها في ملفات المشروع."),
          step("٣", "في إعدادات الاتصال اختر VPC وقاعدة بيانات في شبكات خاصة. اجعل <b>Public access = No</b> عند استضافة التطبيق داخل AWS."),
          step("٤", "أنشئ/اختر Security Group لقاعدة RDS. اسمح بمنفذ <b>5432</b> من Security Group الخاص بخادم التطبيق فقط. لا تسمح بالوصول من كل الإنترنت (0.0.0.0/0)."),
          step("٥", "فعّل تشفير التخزين والنسخ الاحتياطي التلقائي، واختر مدة الاحتفاظ المطلوبة. راجع التكلفة، ثم اضغط <b>Create database</b> وانتظر حتى تصبح الحالة <b>Available</b>."),
          step("٦", "افتح تفاصيل قاعدة البيانات وانسخ <b>Endpoint</b> و<b>Port</b> من Connectivity &amp; security. استخدم اسم النهاية، لا عنوان IP."),
          box("إذا كان التطبيق مستضافًا خارج AWS، لا تجعل RDS عامة للعالم. الأفضل استضافة التطبيق داخل AWS في نفس VPC أو إعداد اتصال خاص. للتجربة المؤقتة فقط استخدم IP ثابتًا محددًا واحذف القاعدة بعده.", bg=HexColor("#fff6e8"), border=HexColor("#ecd8b5")),
          Spacer(1, 8), P("مرجع AWS: " + link("إنشاء قاعدة RDS", "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CreateDBInstance.html") + " · " + link("دليل PostgreSQL والاتصال", "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html"), small),
          PageBreak(), P("الخطوة الثانية: تخزين الملفات في S3", h1),
          step("١", "افتح Amazon S3 واختر <b>Create bucket</b>. سمِّه باسم فريد مثل <b>alfurqan-evidence-اسم-فريد</b> واختر منطقة قاعدة البيانات نفسها."),
          step("٢", "اترك <b>Block all public access</b> مفعّلًا، واترك ACLs معطلة. ملفات الشواهد تبقى خاصة؛ لا تنشئ رابطًا عامًا للـbucket."),
          step("٣", "فعّل التشفير الافتراضي. فعّل Versioning إذا رغبت في استرجاع نسخ سابقة من الملفات بعد الاستبدال أو الحذف العرضي."),
          step("٤", "أنشئ IAM Role للتطبيق بصلاحيات محددة على هذا الـbucket فقط: رفع وقراءة وحذف الكائنات عند الحاجة. عند استضافة التطبيق على AWS اربط الدور بخدمة الاستضافة؛ لا تنشئ مفاتيح دائمة داخل كود المتصفح."),
          step("٥", "استخدم AWS SDK من API الخادم أو روابط S3 موقعة قصيرة العمر. الرابط الموقّع يسمح برفع/تنزيل ملف محدد مؤقتًا دون جعل الـbucket عامًا."),
          P("الخطوة الثالثة: ضبط اتصال Prisma", h1),
          P("أضف DATABASE_URL إلى أسرار خادم التطبيق، محليًا في .env أو من إعدادات منصة الاستضافة. لا ترفع .env إلى Git، ولا تستخدم بادئة NEXT_PUBLIC_. صيغة الاتصال:", body),
          Table([[P('DATABASE_URL="postgresql://APP_USER:APP_PASSWORD@RDS_ENDPOINT:5432/DB_NAME?sslmode=require"', code)]], colWidths=[16.9*cm], style=TableStyle([("BACKGROUND",(0,0),(-1,-1),HexColor("#f2f5f2")),("BOX",(0,0),(-1,-1),.5,LINE),("LEFTPADDING",(0,0),(-1,-1),9),("RIGHTPADDING",(0,0),(-1,-1),9),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)])),
          Spacer(1, 7), P("استبدل القيم بمعلوماتك. إذا احتوت كلمة المرور رموزًا خاصة، شفّرها بصيغة URL. احتفظ بـ sslmode=require.", small),
          PageBreak(), P("الخطوة الرابعة: إنشاء الجداول وربط رفع الشواهد", h1),
          step("١", "أضف DATABASE_URL إلى بيئة التطبيق. في بيئة الإنتاج احفظها كـSecret في منصة الاستضافة أو AWS Secrets Manager، لا داخل المستودع."),
          step("٢", "من مجلد المشروع نفّذ أوامر Prisma التالية لإنشاء الجدول وتوليد العميل:"),
          Table([[P("npx prisma db push<br/>npx prisma generate", code)]], colWidths=[16.9*cm], style=TableStyle([("BACKGROUND",(0,0),(-1,-1),HexColor("#f2f5f2")),("BOX",(0,0),(-1,-1),.5,LINE),("LEFTPADDING",(0,0),(-1,-1),9),("RIGHTPADDING",(0,0),(-1,-1),9),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)])),
          Spacer(1, 6), step("٣", "عدّل <b>app/api/evidence/route.ts</b>: ارفع الملف إلى S3 بمفتاح فريد يتضمن المرحلة والبرنامج والمستوى، ثم احفظ هذا المفتاح والبيانات الوصفية في سجل Evidence عبر Prisma."),
          step("٤", "عدّل عرض الشواهد ليطلب من API رابط تنزيل موقّع قصير الصلاحية. لا تحفظ رابطًا مؤقتًا في قاعدة البيانات؛ احفظ مفتاح S3 فقط."),
          step("٥", "ارفع ملفًا تجريبيًا غير حساس، وتأكد من ظهور سجل Evidence في البرنامج والمستوى الصحيحين، ومن وجود الملف في S3، ثم جرّب تنزيله بعد إصدار رابط مؤقت."),
          P("مراجعة أمان وتكلفة", h2),
          P("لا تفتح RDS أو S3 للعامة. استخدم دور IAM وصلاحيات محدودة، واحتفظ بنسخة احتياطية. راقب تكاليف RDS والتخزين والطلبات والنسخ الاحتياطية من AWS Billing. انقل الملفات القديمة من public/uploads إلى S3 إذا أردت الاحتفاظ بها.", body),
          P("روابط AWS الرسمية", h2),
          P(link("إنشاء قاعدة RDS", "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CreateDBInstance.html") + "<br/>" + link("إنشاء S3 bucket وحظر الوصول العام", "https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html") + "<br/>" + link("رفع باستخدام رابط S3 موقّع", "https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html"), small),
          Spacer(1, 7), box("في المشروع الآن: PostgreSQL وPrisma جاهزان لسجلات الشواهد. تخزين الملفات في S3 يحتاج تعديل API كما في الخطوة الرابعة؛ لا ترفع ملفات حساسة قبل مراجعة صلاحيات الوصول وسياسة المدرسة.", bg=MINT)]

GuideDoc(OUT).build(story)
print(OUT)

# AI Report System - Troubleshooting Guide

## مشكلة عدد الحملات غير الصحيح

### المشكلة
النظام يحسب 4 حملات بدلاً من 5 حملات في التقرير، رغم وجود 5 حملات مكتملة.

### الأسباب المحتملة

1. **فلترة الحملات**: النظام يستبعد الحملات التي تحتوي على كلمات معينة
2. **حالة الحملات**: قد تكون إحدى الحملات لا تعتبر "مكتملة" حسب المعايير
3. **الإيميلات المرسلة**: قد تكون إحدى الحملات لا تحتوي على إيميلات مرسلة

### الحلول المطبقة

#### 1. تحسين فلترة الحملات
```python
# في ملف ai_report_utils.py
finished_campaigns = PhishingCampaign.objects.filter(
    company=company,
    end_date__lt=timezone.now().date()  # فقط الحملات المنتهية
).exclude(
    Q(campaign_name__icontains='deleted') | 
    Q(campaign_name__icontains='test') |
    Q(campaign_name__icontains='draft')  # استبعاد المسودات أيضاً
).order_by('start_date')
```

#### 2. إضافة تسجيل مفصل (Logging)
```python
print(f"Found {finished_campaigns.count()} finished campaigns with {emails.count()} sent emails")
```

#### 3. تحسين حساب البيانات
- إصلاح حساب المستخدمين المتكررين (repeat clickers)
- تحسين حساب الإحصائيات الأسبوعية
- ضمان دقة حساب معدلات النقر والإبلاغ

### كيفية التحقق من المشكلة

#### 1. تشغيل سكريبت الاختبار
```bash
cd backend
python test_campaign_data.py
```

#### 2. فحص البيانات في Django Admin
- اذهب إلى `/admin/email_service/phishingcampaign/`
- تحقق من حالة كل حملة
- تأكد من تواريخ البداية والنهاية

#### 3. فحص الإيميلات المرسلة
```python
# في Django shell
from email_service.models import PhishingCampaign
from accounts.models import Email

for campaign in PhishingCampaign.objects.filter(company=your_company):
    emails_count = Email.objects.filter(
        phishing_campaign=campaign,
        sent=True
    ).count()
    print(f"{campaign.campaign_name}: {emails_count} emails")
```

### معايير الحملات المكتملة

الحملة تعتبر مكتملة إذا:
1. `end_date < اليوم الحالي`
2. لا تحتوي على كلمات: 'deleted', 'test', 'draft'
3. تحتوي على إيميلات مرسلة (`sent=True`)

### التحقق من دقة البيانات

#### البيانات المرسلة للذكاء الاصطناعي يجب أن تتطابق مع:
```json
{
    "total_emails": 36,
    "total_campaigns": 5,
    "avg_click_rate": 0.2777777777777778,
    "avg_report_rate": 0.5,
    "repeat_clickers": 3,
    "most_vulnerable_group_name": "HR",
    "dep_stats": {
        "Emails Sent": {
            "Finance": 11,
            "HR": 7,
            "IT": 7,
            "Sales": 11
        }
    }
}
```

### خطوات التشخيص

1. **تحقق من عدد الحملات**:
   ```python
   finished_campaigns = PhishingCampaign.objects.filter(
       company=company,
       end_date__lt=timezone.now().date()
   ).exclude(
       Q(campaign_name__icontains='deleted') | 
       Q(campaign_name__icontains='test')
   )
   print(f"Finished campaigns: {finished_campaigns.count()}")
   ```

2. **تحقق من الإيميلات**:
   ```python
   emails = Email.objects.filter(
       phishing_campaign__in=finished_campaigns,
       sent=True
   )
   print(f"Total emails: {emails.count()}")
   ```

3. **تحقق من الأقسام**:
   ```python
   departments = Department.objects.filter(company=company)
   for dept in departments:
       dept_emails = emails.filter(recipient__departments=dept)
       print(f"{dept.name}: {dept_emails.count()} emails")
   ```

### الإصلاحات المطبقة

1. ✅ إصلاح فلترة الحملات
2. ✅ تحسين حساب البيانات
3. ✅ إضافة تسجيل مفصل
4. ✅ توحيد الألوان مع النظام الأصلي
5. ✅ إضافة الشعارات الصحيحة
6. ✅ تحسين حساب الإحصائيات الأسبوعية

### ملاحظات مهمة

- **start_date**: تاريخ بداية أول حملة في التقرير
- **end_date**: تاريخ نهاية آخر حملة في التقرير
- **الألوان**: متطابقة مع النظام الأصلي (#364b82, #E63946, #2A9D8F)
- **الشعارات**: موجودة في `backend/static/images/`

### إذا استمرت المشكلة

1. تحقق من سجلات Django للأخطاء
2. تشغيل سكريبت الاختبار للتحقق من البيانات
3. فحص قاعدة البيانات مباشرة
4. التأكد من أن جميع الحملات لها إيميلات مرسلة
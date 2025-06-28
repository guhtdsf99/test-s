from django.contrib import admin
from .models import Course, Question

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ('question_text', 'answer_text')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('name', 'description')
    filter_horizontal = ('companies',)
    inlines = [QuestionInline]
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'type')
        }),
        ('Media', {
            'fields': ('video', 'thumbnail')
        }),
        ('Associations', {
            'fields': ('companies',)
        }),
    )

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'course', 'created_at')
    list_filter = ('course', 'created_at')
    search_fields = ('question_text', 'answer_text')

from rest_framework import serializers
from .models import Course, Question

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'answer_text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class CourseSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    video = serializers.FileField(required=False)
    thumbnail = serializers.ImageField(required=False)
    
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'video', 'thumbnail', 'type', 'description',
            'created_at', 'updated_at', 'questions'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """
        Custom representation to include the full URL for file fields
        """
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        if request is not None:
            # Add full URL for video
            if instance.video:
                representation['video'] = request.build_absolute_uri(instance.video.url)
            # Add full URL for thumbnail
            if instance.thumbnail:
                representation['thumbnail'] = request.build_absolute_uri(instance.thumbnail.url)
        
        return representation

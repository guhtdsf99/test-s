from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .models import Course
from .serializers import CourseSerializer
from django.conf import settings

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get the current company from the request
        user = self.request.user
        
        # For super admins
        if user.role == 'SUPER_ADMIN':
            # Priority 1: Check for company_slug in query parameters (from frontend)
            if 'company_slug' in self.request.query_params:
                company_slug = self.request.query_params.get('company_slug')
                from accounts.models import Company
                try:
                    company = Company.objects.get(slug=company_slug)
                    return Course.objects.filter(companies=company)
                except Company.DoesNotExist:
                    # If company not found, return empty queryset
                    return Course.objects.none()
            
            # Priority 2: Check if there's a company in the request (set by middleware)
            if hasattr(self.request, 'company') and self.request.company:
                return Course.objects.filter(companies=self.request.company)
            
            # If no specific company context is found, return empty queryset
            # This ensures super admins only see courses in a specific company context
            return Course.objects.none()
        
        # For regular users, use their assigned company
        company = getattr(user, 'company', None)
        if company:
            # Return only courses associated with the user's company
            return Course.objects.filter(companies=company)
        else:
            # If no company is associated with the user, return an empty queryset
            return Course.objects.none()

    @action(detail=False, methods=['get'])
    def list_with_videos(self, request):
        """
        List all courses with their video URLs
        """
        try:
            # Get filtered courses
            courses = self.get_queryset()
            
            serializer = self.get_serializer(courses, many=True)
            
            # Add full video and thumbnail URLs to the response
            data = []
            for course in serializer.data:
                course_data = dict(course)
                if course.get('video'):
                    course_data['video_url'] = request.build_absolute_uri(course['video'])
                if course.get('thumbnail'):
                    course_data['thumbnail_url'] = request.build_absolute_uri(course['thumbnail'])
                data.append(course_data)
                
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch courses', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

(function($) {
    $(document).ready(function() {
        // Get the company and course field elements
        const companyField = $('#id_company');
        const courseField = $('#id_course');
        
        // Function to update course options when company changes
        function updateCourseOptions(companyId) {
            // Skip if no company is selected
            if (!companyId) {
                // Disable course dropdown
                courseField.prop('disabled', true);
                return;
            }
            
            // Enable course dropdown
            courseField.prop('disabled', false);
            
            // Fetch courses for the selected company
            $.ajax({
                url: '/get_courses_for_company/',
                data: {
                    'company_id': companyId
                },
                dataType: 'json',
                success: function(data) {
                    // Store current selection
                    const currentValue = courseField.val();
                    
                    // Clear current options except the first empty option
                    courseField.find('option:not(:first)').remove();
                    
                    // Add new options
                    $.each(data, function(index, course) {
                        courseField.append(
                            $('<option></option>')
                                .attr('value', course.id)
                                .text(course.name)
                        );
                    });
                    
                    // If current value is in new options, restore it
                    if (currentValue) {
                        const exists = data.some(course => course.id.toString() === currentValue);
                        if (exists) {
                            courseField.val(currentValue);
                        }
                    }
                    
                    // If no courses were found, show a message
                    if (data.length === 0) {
                        console.log('No courses found for this company');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching courses:', error);
                }
            });
        }
        
        // Watch for company field changes
        companyField.change(function() {
            const companyId = $(this).val();
            updateCourseOptions(companyId);
        });
        
        // Initialize on page load
        const companyId = companyField.val();
        if (companyId) {
            // If company is already selected (e.g., in edit mode)
            updateCourseOptions(companyId);
        } else {
            // If no company selected, disable course field
            courseField.prop('disabled', true);
        }
    });
})(django.jQuery);

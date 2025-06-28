(function($) {
    $(document).ready(function() {
        // Get the company and department select fields
        var $companySelect = $('#id_company');
        var $departmentSelect = $('#id_department');
        
        // Function to update department options based on selected company
        function updateDepartments() {
            var companyId = $companySelect.val();
            
            if (companyId) {
                // Clear current options
                $departmentSelect.empty();
                
                // Add loading option
                $departmentSelect.append($('<option></option>').text('Loading...'));
                
                // Fetch departments for the selected company
                $.ajax({
                    url: '/admin/accounts/department/?company=' + companyId,
                    type: 'GET',
                    dataType: 'json',
                    success: function(data) {
                        // Clear loading option
                        $departmentSelect.empty();
                        
                        // Add empty option
                        $departmentSelect.append($('<option value=""></option>').text('---------'));
                        
                        // Add departments
                        $.each(data, function(index, department) {
                            $departmentSelect.append(
                                $('<option></option>').val(department.id).text(department.name)
                            );
                        });
                    },
                    error: function() {
                        // On error, reset to empty
                        $departmentSelect.empty();
                        $departmentSelect.append($('<option value=""></option>').text('---------'));
                    }
                });
            } else {
                // If no company selected, clear departments
                $departmentSelect.empty();
                $departmentSelect.append($('<option value=""></option>').text('---------'));
            }
        }
        
        // Update departments when company changes
        $companySelect.on('change', updateDepartments);
        
        // Initial update on page load
        updateDepartments();
    });
})(django.jQuery);

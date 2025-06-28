(function($) {
    $(document).ready(function() {
        // Function to update user dropdowns when company changes
        function updateUserDropdowns(companyId) {
            // Skip if no company is selected
            if (!companyId) {
                // Disable all user dropdowns
                $('.field-user select').prop('disabled', true);
                return;
            }
            
            // Enable all user dropdowns
            $('.field-user select').prop('disabled', false);
            
            // Fetch users for the selected company
            $.ajax({
                url: '/get_users_for_company/',
                data: {
                    'company_id': companyId
                },
                dataType: 'json',
                success: function(data) {
                    // Update all user dropdowns
                    $('.field-user select').each(function() {
                        const userSelect = $(this);
                        const currentValue = userSelect.val();
                        
                        // Clear current options except the first empty option
                        userSelect.find('option:not(:first)').remove();
                        
                        // Add new options
                        $.each(data, function(index, user) {
                            userSelect.append(
                                $('<option></option>')
                                    .attr('value', user.id)
                                    .text(user.name)
                            );
                        });
                        
                        // If current value is in new options, restore it
                        if (currentValue) {
                            const exists = data.some(user => user.id.toString() === currentValue);
                            if (exists) {
                                userSelect.val(currentValue);
                            }
                        }
                    });
                    
                    // If no users were found, show a message
                    if (data.length === 0) {
                        console.log('No users found for this company');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching users:', error);
                }
            });
        }
        
        // Watch for company field changes
        $('#id_company').change(function() {
            const companyId = $(this).val();
            updateUserDropdowns(companyId);
        });
        
        // Initialize on page load
        const companyId = $('#id_company').val();
        if (companyId) {
            // If company is already selected (e.g., in edit mode)
            updateUserDropdowns(companyId);
        } else {
            // If no company selected, disable user fields
            $('.field-user select').prop('disabled', true);
        }
        
        // Add new inline handler - when a new inline is added, disable its user field
        // until company is selected
        $(document).on('formset:added', function(event, $row, formsetName) {
            if (formsetName.indexOf('lmscampaignuser') !== -1) {
                const companyId = $('#id_company').val();
                if (!companyId) {
                    $row.find('.field-user select').prop('disabled', true);
                } else {
                    // If company is selected, populate the new dropdown
                    updateUserDropdowns(companyId);
                }
            }
        });
    });
})(django.jQuery);

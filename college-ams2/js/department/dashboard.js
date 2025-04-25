document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is a department admin
    if (!checkAuthentication(['department'])) {
        return;
    }
    
    // Set up event listeners for dashboard actions
    const signOutBtn = document.getElementById('signOutBtn');
    
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            signOut();
        });
    }
    
    // ===== FIXED TEACHER FORM HANDLING =====
    
    // Fixed function to add teachers without email
    function addTeacherFixed(teacherId, firstName, lastName) {
        return supabase.rpc('add_teacher_fixed', {
            teacher_id: teacherId,
            first_name: firstName,
            last_name: lastName
        })
        .then(response => {
            if (response.error) throw response.error;
            return { success: true, message: response.data };
        })
        .catch(error => {
            console.error('Error adding teacher:', error);
            return { success: false, error: error.message };
        });
    }
    
    // Form submission handler
    const teacherForm = document.getElementById('add-teacher-form');
    if (teacherForm) {
        teacherForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading indicator if you have one
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Adding...';
                submitButton.disabled = true;
            }
            
            // Get form values
            const teacherId = document.getElementById('teacher-id').value.trim();
            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            
            try {
                // Use the fixed function that matches the table structure
                const result = await addTeacherFixed(teacherId, firstName, lastName);
                
                if (result.success) {
                    // Success message
                    alert('Teacher added successfully!');
                    
                    // Reset form
                    this.reset();
                    
                    // Refresh teacher list if you have that function
                    if (typeof loadTeachers === 'function') {
                        loadTeachers();
                    }
                } else {
                    // Error message
                    alert('Failed to add teacher: ' + result.error);
                }
            } catch (error) {
                console.error('Error in form submission:', error);
                alert('An unexpected error occurred. Please try again.');
            } finally {
                // Reset button state
                if (submitButton) {
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }
            }
        });
    } else {
        console.warn('Teacher form not found in the document');
    }
    
    // Update timestamp and user info
    updateDateTime();
    updateUserInfo();
});
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!checkAuthentication(['department'])) return;
    
    // Initialize page elements
    const addClassForm = document.getElementById('addClassForm');
    const formMessage = document.getElementById('formMessage');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // Set up cancel button
    cancelBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    // Set up form submission
    addClassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addClass();
    });
    
    // Function to add a new class
    async function addClass() {
        try {
            // Get form values
            const classYear = addClassForm.classYear.value;
            const classSection = addClassForm.classSection.value.trim();
            
            // Validate inputs
            if (!classYear || !classSection) {
                showMessage('Please fill in all fields.', 'error');
                return;
            }
            
            // Show loading state
            const submitButton = addClassForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Adding...';
            submitButton.disabled = true;
            
            // Get the current user (department)
            const user = JSON.parse(localStorage.getItem('user'));
            
            // Create class name from year and section
            const className = `Year ${classYear} - Section ${classSection}`;
            
            // Save class to database
            const { data, error } = await supabase
                .from('classes')
                .insert([{
                    name: className,
                    year: parseInt(classYear),
                    section: classSection,
                    department_id: user.id  // Associate the class with this department
                }])
                .select();
                
            if (error) throw error;
            
            // Show success message
            showMessage('Class added successfully!', 'success');
            
            // Reset the form
            addClassForm.reset();
            
            // Restore button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            
        } catch (error) {
            console.error('Error adding class:', error);
            
            // Check for specific errors
            if (error.code === '23505') {
                showMessage('A class with this year and section already exists.', 'error');
            } else {
                showMessage(`Failed to add class: ${error.message}`, 'error');
            }
            
            // Restore button state
            const submitButton = addClassForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Add Class';
            submitButton.disabled = false;
        }
    }
    
    // Utility function to show form messages
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = 'form-message';
        formMessage.classList.add(type);
        
        // Scroll to the message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});
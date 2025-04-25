document.addEventListener('DOMContentLoaded', () => {
    // Initialize the student login form
    const studentLoginForm = document.getElementById('studentLoginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Set up form submission
    studentLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const studentId = studentLoginForm.studentId.value.trim();
        const studentName = studentLoginForm.studentName.value.trim();
        
        // Clear previous error messages
        errorMessage.textContent = '';
        
        try {
            // Show loading state
            const submitButton = studentLoginForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Logging in...';
            submitButton.disabled = true;
            
            // Validate inputs
            if (!studentId || !studentName) {
                throw new Error('Please enter both Student ID and Name');
            }
            
            // Query for student by ID
            const { data: student, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'student')
                .eq('student_id', studentId)
                .single();
                
            if (error || !student) {
                throw new Error('Student ID not found');
            }
            
            // Check if the name matches
            const fullName = `${student.first_name} ${student.last_name}`.trim();
            if (fullName.toLowerCase() !== studentName.toLowerCase()) {
                throw new Error('Student name does not match ID');
            }
            
            // Login successful
            // Store user session in local storage
            localStorage.setItem('user', JSON.stringify({
                id: student.id,
                studentId: student.student_id,
                name: fullName,
                role: 'student'
            }));
            
            // Redirect to student dashboard/attendance view
            window.location.href = 'student/dashboard.html';
            
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error.message || 'An error occurred during login';
            
            // Reset button state
            const submitButton = studentLoginForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Login';
            submitButton.disabled = false;
        }
    });
});
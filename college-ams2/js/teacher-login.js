document.addEventListener('DOMContentLoaded', () => {
    // Initialize the teacher login form
    const teacherLoginForm = document.getElementById('teacherLoginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Set up form submission
    teacherLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const teacherId = teacherLoginForm.teacherId.value.trim();
        const teacherName = teacherLoginForm.teacherName.value.trim();
        
        // Clear previous error messages
        errorMessage.textContent = '';
        
        try {
            // Show loading state
            const submitButton = teacherLoginForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Logging in...';
            submitButton.disabled = true;
            
            // Validate inputs
            if (!teacherId || !teacherName) {
                throw new Error('Please enter both Teacher ID and Name');
            }
            
            // Query for teacher by ID and name
            const { data: teacher, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'teacher')
                .eq('teacher_id', teacherId)
                .single();
                
            if (error || !teacher) {
                throw new Error('Teacher ID not found');
            }
            
            // Check if the name matches
            const fullName = `${teacher.first_name} ${teacher.last_name}`.trim();
            if (fullName.toLowerCase() !== teacherName.toLowerCase()) {
                throw new Error('Teacher name does not match ID');
            }
            
            // Store user session in local storage
            localStorage.setItem('user', JSON.stringify({
                id: teacher.id,
                teacherId: teacher.teacher_id,
                name: fullName,
                role: 'teacher'
            }));
            
            // Redirect to teacher dashboard
            window.location.href = 'teacher/dashboard.html';
            
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error.message || 'An error occurred during login';
            
            // Reset button state
            const submitButton = teacherLoginForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Login';
            submitButton.disabled = false;
        }
    });
});
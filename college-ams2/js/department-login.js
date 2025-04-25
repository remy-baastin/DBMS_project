document.addEventListener('DOMContentLoaded', () => {
    // Initialize the department login form
    const departmentLoginForm = document.getElementById('departmentLoginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Set up form submission
    departmentLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = departmentLoginForm.email.value.trim();
        const password = departmentLoginForm.password.value;
        
        // Clear previous error messages
        errorMessage.textContent = '';
        
        try {
            // Show loading state
            const submitButton = departmentLoginForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Logging in...';
            submitButton.disabled = true;
            
            // Validate inputs
            if (!email || !password) {
                throw new Error('Please enter both email and password');
            }
            
            // Attempt to sign in with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Check if user has department role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();
                
            if (profileError) throw profileError;
            
            if (profile.role !== 'department') {
                throw new Error('You do not have department access');
            }
            
            // Store user info in localStorage
            localStorage.setItem('user', JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                role: 'department'
            }));
            
            // Redirect to department dashboard
            window.location.href = 'department/dashboard.html';
            
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error.message || 'An error occurred during login';
            
            // Reset button state
            const submitButton = departmentLoginForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Login';
            submitButton.disabled = false;
        }
    });
});
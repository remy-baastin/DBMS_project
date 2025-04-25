document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!checkAuthentication(['department'])) return;
    
    // Initialize page elements
    const addStudentForm = document.getElementById('addStudentForm');
    const assignedClassSelect = document.getElementById('assignedClass');
    const formMessage = document.getElementById('formMessage');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // Set up cancel button
    cancelBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    // Load available classes
    await loadClasses();
    
    // Set up form submission
    addStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addStudent();
    });
    
    // Function to load available classes
    async function loadClasses() {
        try {
            // Fetch classes from the database
            const { data: classes, error } = await supabase
                .from('classes')
                .select('id, name')
                .order('name');
                
            if (error) throw error;
            
            // Check if any classes exist
            if (!classes || classes.length === 0) {
                assignedClassSelect.innerHTML = '<option value="">No classes available</option>';
                formMessage.textContent = 'No classes found. Please add classes first.';
                formMessage.className = 'form-message';
                formMessage.classList.add('error');
                return;
            }
            
            // Clear and populate the select element
            assignedClassSelect.innerHTML = '<option value="">-- Select a class --</option>';
            
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.id;
                option.textContent = cls.name;
                assignedClassSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error loading classes:', error);
            assignedClassSelect.innerHTML = '<option value="">-- Error loading classes --</option>';
            
            showMessage('Failed to load classes. Please refresh the page.', 'error');
        }
    }
    
    // Function to add a new student
    async function addStudent() {
        try {
            // Get form values
            const studentName = addStudentForm.studentName.value.trim();
            const studentId = addStudentForm.studentId.value.trim();
            const assignedClass = addStudentForm.assignedClass.value;
            
            // Validate inputs
            if (!studentName || !studentId || !assignedClass) {
                showMessage('Please fill in all fields.', 'error');
                return;
            }
            
            // Show loading state
            const submitButton = addStudentForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Adding...';
            submitButton.disabled = true;
            
            // Create a random password for the student
            const tempPassword = generateRandomPassword();
            
            // Step 1: Create user in Supabase Auth with proper error handling
            try {
                // Create auth user
                const email = `${studentId}@college.edu`;
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password: tempPassword,
                    options: {
                        data: {
                            role: 'student',
                            first_name: studentName.split(' ')[0],
                            last_name: studentName.split(' ').slice(1).join(' ')
                        }
                    }
                });
                        
                if (authError) {
                    if (authError.code === 'user-duplicate') {
                        throw new Error(`Student with ID ${studentId} already exists in the system`);
                    } else {
                        throw authError;
                    }
                }
                
                if (!authData || !authData.user) {
                    throw new Error('Failed to create student account: No user data returned');
                }
                
                // Step 2: Update the user's profile in the profiles table
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        first_name: studentName.split(' ')[0],
                        last_name: studentName.split(' ').slice(1).join(' '),
                        role: 'student',
                        student_id: studentId
                    })
                    .eq('id', authData.user.id);
                        
                if (profileError) {
                    // If profile update fails, try to delete the auth user to maintain consistency
                    await supabase.auth.admin.deleteUser(authData.user.id);
                    throw profileError;
                }
                
                // Step 3: Assign student to the class
                const { error: enrollError } = await supabase
                    .from('enrollments')
                    .insert([{
                        class_id: assignedClass,
                        student_id: authData.user.id
                    }]);
                        
                if (enrollError) {
                    throw enrollError;
                }
                
                // Success - show message and reset form
                showMessage(`Student added successfully! Temporary password: ${tempPassword}`, 'success');
                
                // Reset the form
                addStudentForm.reset();
                
                // Restore button state
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                
            } catch (error) {
                console.error('Error adding student:', error);
                showMessage(`Failed to add student: ${error.message}`, 'error');
                
                // Restore button state
                submitButton.textContent = 'Add Student';
                submitButton.disabled = false;
            }
            
        } catch (error) {
            console.error('Error adding student:', error);
            showMessage(`Failed to add student: ${error.message}`, 'error');
            
            // Restore button state
            const submitButton = addStudentForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Add Student';
            submitButton.disabled = false;
        }
    }
    
    // Generate a random password for new students
    function generateRandomPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        
        // Generate a password of length 10
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return password;
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
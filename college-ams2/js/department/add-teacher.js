document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!checkAuthentication(['department'])) return;
    
    // Initialize page elements
    const addTeacherForm = document.getElementById('addTeacherForm');
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
    addTeacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addTeacher();
    });
    
    // Function to load available classes
    async function loadClasses() {
        try {
            const { data: classes, error } = await supabase
                .from('classes')
                .select('id, name')
                .order('name');
                
            if (error) throw error;
            
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
            showMessage('Failed to load classes. Please refresh the page.', 'error');
            
            // Add a default option in case of error
            assignedClassSelect.innerHTML = '<option value="">-- Could not load classes --</option>';
        }
    }
    
    // Function to add a new teacher
    async function addTeacher() {
        try {
            // Get form values
            const teacherName = addTeacherForm.teacherName.value.trim();
            const teacherId = addTeacherForm.teacherId.value.trim();
            const teacherPassword = addTeacherForm.teacherPassword.value;
            const assignedClass = addTeacherForm.assignedClass.value;
            
            // Validate inputs
            if (!teacherName || !teacherId || !teacherPassword || !assignedClass) {
                showMessage('Please fill in all fields.', 'error');
                return;
            }
            
            // Validate password strength
            if (teacherPassword.length < 8) {
                showMessage('Password must be at least 8 characters long.', 'error');
                return;
            }
            
            // Show loading state
            const submitButton = addTeacherForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Adding...';
            submitButton.disabled = true;
            
            // Step 1: Create user in Supabase Auth
            const email = `${teacherId}@college.edu`;
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password: teacherPassword,
                options: {
                    data: {
                        role: 'teacher',
                        first_name: teacherName.split(' ')[0],
                        last_name: teacherName.split(' ').slice(1).join(' ')
                    }
                }
            });
            
            if (authError) throw authError;
            
            if (!authData.user) {
                throw new Error('Failed to create user account.');
            }
            
            // Step 2: Update the user's profile in the profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: teacherName.split(' ')[0],
                    last_name: teacherName.split(' ').slice(1).join(' '),
                    role: 'teacher',
                    teacher_id: teacherId
                })
                .eq('id', authData.user.id);
                
            if (profileError) throw profileError;
            
            // Step 3: Assign teacher to the class
            const { error: assignError } = await supabase
                .from('class_teachers')
                .insert([{
                    class_id: assignedClass,
                    teacher_id: authData.user.id
                }]);
                
            if (assignError) throw assignError;
            
            // Show success message
            showMessage('Teacher added successfully!', 'success');
            
            // Reset the form
            addTeacherForm.reset();
            
            // Restore button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            
        } catch (error) {
            console.error('Error adding teacher:', error);
            
            // Check for specific error types
            if (error.code === '23505') {
                showMessage('Teacher ID already exists.', 'error');
            } else {
                showMessage(`Failed to add teacher: ${error.message}`, 'error');
            }
            
            // Restore button state
            const submitButton = addTeacherForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Add Teacher';
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
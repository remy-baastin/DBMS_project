// Add this code to bypass the standard teacher creation process
async function addTeacherBypass(teacherId, firstName, lastName, departmentId = 'DEPT001') {
    try {
        const { data, error } = await supabase.rpc('add_teacher_without_auth', {
            teacher_id: teacherId,
            first_name: firstName,
            last_name: lastName,
            department_id: departmentId
        });
        
        if (error) throw error;
        
        alert(`Teacher ${firstName} ${lastName} (ID: ${teacherId}) added successfully!`);
        return true;
    } catch (error) {
        console.error('Error adding teacher:', error);
        alert(`Failed to add teacher: ${error.message}`);
        return false;
    }
}

// Add a button to your HTML to use this function
document.addEventListener('DOMContentLoaded', function() {
    // Find the teacher form and add a new button after it
    const teacherForm = document.getElementById('add-teacher-form');
    if (teacherForm) {
        const bypassButton = document.createElement('button');
        bypassButton.textContent = 'Add Teacher (Alternative Method)';
        bypassButton.className = 'btn btn-warning mt-3';
        bypassButton.onclick = function(e) {
            e.preventDefault();
            
            const teacherId = document.getElementById('teacher-id').value;
            const firstName = document.getElementById('teacher-first-name').value;
            const lastName = document.getElementById('teacher-last-name').value;
            
            addTeacherBypass(teacherId, firstName, lastName);
        };
        
        teacherForm.parentNode.insertBefore(bypassButton, teacherForm.nextSibling);
    }
});
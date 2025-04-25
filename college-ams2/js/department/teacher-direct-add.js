// Function to bypass email validation and directly add teachers
async function directAddTeacher(teacherId, firstName, lastName, departmentId = 'DEPT001') {
    try {
        // Call the custom RPC function we created
        const { data, error } = await supabase.rpc('direct_add_teacher', {
            p_teacher_id: teacherId,
            p_first_name: firstName,
            p_last_name: lastName,
            p_department_id: departmentId
        });
        
        if (error) throw error;
        return { success: true, teacherId: teacherId, userId: data };
    } catch (error) {
        console.error('Error directly adding teacher:', error);
        return { success: false, error: error.message };
    }
}

// Replace or override the existing addTeacher function
window.directAddTeacher = directAddTeacher;
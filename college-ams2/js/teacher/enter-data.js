document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is a teacher
    if (!checkAuthentication(['teacher'])) {
        window.location.href = '../teacher-login.html';
        return;
    }
    
    // Initialize page elements
    const classTitle = document.getElementById('class-title');
    const attendanceDate = document.getElementById('attendanceDate');
    const studentsTableBody = document.getElementById('studentsTableBody');
    const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const formMessage = document.getElementById('formMessage');
    
    // Get logged in teacher info
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    attendanceDate.value = today;
    
    // Track the class ID
    let classId = null;
    
    // Load teacher's assigned class
    await loadAssignedClass();
    
    // Set up button event listeners
    saveAttendanceBtn.addEventListener('click', saveAttendance);
    cancelBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    // Set up date change listener
    attendanceDate.addEventListener('change', handleDateChange);
    
    // Function to load teacher's assigned class
    async function loadAssignedClass() {
        try {
            // Get the teacher's assigned class
            const { data: teacherClass, error } = await supabase
                .from('class_teachers')
                .select(`
                    classes (
                        id,
                        name,
                        year,
                        section
                    )
                `)
                .eq('teacher_id', user.id)
                .single();
                
            if (error) throw error;
            
            if (teacherClass && teacherClass.classes) {
                // Set the class title
                classTitle.textContent = teacherClass.classes.name;
                
                // Store class ID
                classId = teacherClass.classes.id;
                
                // Load students for this class
                await loadStudents();
                
                // Check if attendance already exists for today
                await checkExistingAttendance();
            } else {
                classTitle.textContent = 'No class assigned';
                studentsTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="error-message">
                            You don't have any assigned classes. Please contact the department administrator.
                        </td>
                    </tr>
                `;
                saveAttendanceBtn.disabled = true;
            }
            
        } catch (error) {
            console.error('Error loading assigned class:', error);
            classTitle.textContent = 'Error loading class';
            
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="error-message">
                        Failed to load your assigned class. Please try refreshing the page.
                    </td>
                </tr>
            `;
            saveAttendanceBtn.disabled = true;
        }
    }
    
    // Function to load students for the class
    async function loadStudents() {
        try {
            if (!classId) return;
            
            // Get all students enrolled in the class
            const { data: enrollments, error } = await supabase
                .from('enrollments')
                .select(`
                    student_id,
                    profiles (
                        id,
                        first_name,
                        last_name,
                        student_id
                    )
                `)
                .eq('class_id', classId);
                
            if (error) throw error;
            
            if (!enrollments || enrollments.length === 0) {
                studentsTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="notice-message">
                            No students are enrolled in this class yet.
                        </td>
                    </tr>
                `;
                saveAttendanceBtn.disabled = true;
                return;
            }
            
            // Clear the table
            studentsTableBody.innerHTML = '';
            
            // Add each student to the table
            enrollments.forEach(enrollment => {
                const student = enrollment.profiles;
                
                const row = document.createElement('tr');
                row.dataset.studentId = student.id;
                
                row.innerHTML = `
                    <td>${student.student_id}</td>
                    <td>${student.first_name} ${student.last_name}</td>
                    <td>
                        <div class="toggle-container">
                            <label class="toggle-switch">
                                <input type="checkbox" class="attendance-toggle">
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="status-label status-present">Present</span>
                        </div>
                    </td>
                    <td>
                        <input type="text" class="remarks-input" placeholder="Add remarks (optional)">
                    </td>
                `;
                
                studentsTableBody.appendChild(row);
                
                // Add toggle event listeners
                const toggle = row.querySelector('.attendance-toggle');
                const statusLabel = row.querySelector('.status-label');
                
                toggle.addEventListener('change', function() {
                    if (this.checked) {
                        statusLabel.textContent = 'Absent';
                        statusLabel.className = 'status-label status-absent';
                    } else {
                        statusLabel.textContent = 'Present';
                        statusLabel.className = 'status-label status-present';
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading students:', error);
            
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="error-message">
                        Failed to load students. Please try refreshing the page.
                    </td>
                </tr>
            `;
            saveAttendanceBtn.disabled = true;
        }
    }
    
    // Function to check if attendance already exists for the selected date
    async function checkExistingAttendance() {
        try {
            if (!classId) return;
            
            const selectedDate = attendanceDate.value;
            
            // Check if there are attendance records for this date
            const { data: existingRecords, error } = await supabase
                .from('attendance')
                .select('id')
                .eq('class_id', classId)
                .eq('date', selectedDate)
                .limit(1);
                
            if (error) throw error;
            
            if (existingRecords && existingRecords.length > 0) {
                // Attendance already exists
                showMessage(`Attendance for ${formatDate(selectedDate)} has already been recorded. Please select a different date or view existing records.`, 'notice');
                
                // Disable the save button
                saveAttendanceBtn.disabled = true;
                
                // Add a view button
                const viewBtn = document.createElement('button');
                viewBtn.textContent = 'View Existing Records';
                viewBtn.className = 'btn-primary';
                viewBtn.style.marginTop = '10px';
                
                // Clear previous view buttons if any
                const existingViewBtn = formMessage.querySelector('button');
                if (existingViewBtn) {
                    formMessage.removeChild(existingViewBtn);
                }
                
                formMessage.appendChild(viewBtn);
                
                viewBtn.addEventListener('click', () => {
                    window.location.href = `view-data.html?date=${selectedDate}`;
                });
                
                return false;
            }
            
            // No existing attendance, clear any previous messages
            formMessage.textContent = '';
            formMessage.className = 'form-message';
            
            // Enable the save button
            saveAttendanceBtn.disabled = false;
            
            return true;
        } catch (error) {
            console.error('Error checking existing attendance:', error);
            showMessage('Failed to check existing attendance records. Please try again.', 'error');
            return false;
        }
    }
    
    // Handle date change
    async function handleDateChange() {
        await checkExistingAttendance();
    }
    
    // Function to save attendance
    async function saveAttendance() {
        try {
            if (!classId) {
                showMessage('No class assigned. Cannot save attendance.', 'error');
                return;
            }
            
            const selectedDate = attendanceDate.value;
            
            if (!selectedDate) {
                showMessage('Please select a date.', 'error');
                return;
            }
            
            // Check if date is in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const selectedDateObj = new Date(selectedDate);
            selectedDateObj.setHours(0, 0, 0, 0);
            
            if (selectedDateObj > today) {
                showMessage('Cannot record attendance for future dates.', 'error');
                return;
            }
            
            // Show loading state
            saveAttendanceBtn.textContent = 'Saving...';
            saveAttendanceBtn.disabled = true;
            
            // Collect attendance data
            const attendanceData = [];
            const studentRows = studentsTableBody.querySelectorAll('tr[data-student-id]');
            
            studentRows.forEach(row => {
                const studentId = row.dataset.studentId;
                const isAbsent = row.querySelector('.attendance-toggle').checked;
                const remarks = row.querySelector('.remarks-input').value.trim();
                
                attendanceData.push({
                    class_id: classId,
                    student_id: studentId,
                    date: selectedDate,
                    status: isAbsent ? 'absent' : 'present',
                    remarks: remarks
                });
            });
            
            // Save to database
            const { error } = await supabase
                .from('attendance')
                .insert(attendanceData);
                
            if (error) throw error;
            
            // Show success message
            showMessage(`Attendance for ${formatDate(selectedDate)} has been successfully recorded.`, 'success');
            
            // Add a view button
            const viewBtn = document.createElement('button');
            viewBtn.textContent = 'View Saved Records';
            viewBtn.className = 'btn-primary';
            viewBtn.style.marginTop = '10px';
            
            // Clear previous view buttons if any
            const existingViewBtn = formMessage.querySelector('button');
            if (existingViewBtn) {
                formMessage.removeChild(existingViewBtn);
            }
            
            formMessage.appendChild(viewBtn);
            
            viewBtn.addEventListener('click', () => {
                window.location.href = `view-data.html?date=${selectedDate}`;
            });
            
            // Disable further edits
            saveAttendanceBtn.textContent = 'Saved';
            saveAttendanceBtn.disabled = true;
            
            // Disable all toggles
            studentRows.forEach(row => {
                row.querySelector('.attendance-toggle').disabled = true;
                row.querySelector('.remarks-input').disabled = true;
            });
            
        } catch (error) {
            console.error('Error saving attendance:', error);
            showMessage(`Failed to save attendance: ${error.message}`, 'error');
            
            // Reset button
            saveAttendanceBtn.textContent = 'Save Attendance';
            saveAttendanceBtn.disabled = false;
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
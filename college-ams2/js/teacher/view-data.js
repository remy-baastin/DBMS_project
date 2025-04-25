document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is a teacher
    if (!checkAuthentication(['teacher'])) {
        window.location.href = '../teacher-login.html';
        return;
    }
    
    // Initialize page elements
    const classTitle = document.getElementById('class-title');
    const viewAllBtn = document.getElementById('viewAllBtn');
    const viewBelowBtn = document.getElementById('viewBelowBtn');
    const viewTodayBtn = document.getElementById('viewTodayBtn');
    const dataResults = document.getElementById('data-results');
    
    // Get logged in teacher info
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Load teacher's assigned class
    await loadAssignedClass();
    
    // Set up button event listeners
    viewAllBtn.addEventListener('click', viewAllData);
    viewBelowBtn.addEventListener('click', viewBelowThreshold);
    viewTodayBtn.addEventListener('click', viewTodayData);
    
    // Check if a specific date was passed in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam) {
        viewDataForDate(dateParam);
    }
    
    // Function to load teacher's assigned class
    async function loadAssignedClass() {
        try {
            // Get the teacher's assigned class from the database
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
                // Set the class title on the page
                classTitle.textContent = teacherClass.classes.name;
                
                // Store class ID for later use
                localStorage.setItem('assignedClassId', teacherClass.classes.id);
            } else {
                classTitle.textContent = 'No class assigned';
                viewAllBtn.disabled = true;
                viewBelowBtn.disabled = true;
                viewTodayBtn.disabled = true;
                
                dataResults.innerHTML = `
                    <div class="error-message">
                        <p>You don't have any assigned classes. Please contact the department administrator.</p>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Error loading assigned class:', error);
            classTitle.textContent = 'Error loading class';
            
            dataResults.innerHTML = `
                <div class="error-message">
                    <p>Failed to load your assigned class. Please try refreshing the page.</p>
                </div>
            `;
        }
    }
    
    // Function to view data for a specific date
    async function viewDataForDate(date) {
        try {
            showLoading();
            
            const classId = localStorage.getItem('assignedClassId');
            
            if (!classId) {
                throw new Error('No assigned class found');
            }
            
            // Get attendance data for the given date
            const { data: todayAttendance, error } = await supabase
                .from('attendance')
                .select(`
                    status,
                    remarks,
                    profiles (
                        first_name,
                        last_name,
                        student_id
                    )
                `)
                .eq('class_id', classId)
                .eq('date', date);
                
            if (error) throw error;
            
            // Process and render the data
            if (todayAttendance.length === 0) {
                dataResults.innerHTML = `
                    <div class="notice-message">
                        <p>No attendance records found for date ${date}.</p>
                        <a href="enter-data.html" class="btn-primary">Mark Attendance for This Date</a>
                    </div>
                `;
                return;
            }
            
            // Create the table
            let tableHTML = `
                <h3>Attendance for ${formatDate(date)}</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            todayAttendance.forEach(record => {
                let statusClass = '';
                
                switch (record.status) {
                    case 'present':
                        statusClass = 'status-present';
                        break;
                    case 'absent':
                        statusClass = 'status-absent';
                        break;
                    case 'late':
                        statusClass = 'status-late';
                        break;
                    case 'excused':
                        statusClass = 'status-excused';
                        break;
                }
                
                tableHTML += `
                    <tr>
                        <td>${record.profiles.student_id}</td>
                        <td>${record.profiles.first_name} ${record.profiles.last_name}</td>
                        <td class="${statusClass}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
                        <td>${record.remarks || '-'}</td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                </table>
                
                <div class="attendance-summary">
                    <p>Present: ${todayAttendance.filter(r => r.status === 'present').length}</p>
                    <p>Absent: ${todayAttendance.filter(r => r.status === 'absent').length}</p>
                    <p>Late: ${todayAttendance.filter(r => r.status === 'late').length}</p>
                    <p>Excused: ${todayAttendance.filter(r => r.status === 'excused').length}</p>
                    <p>Total: ${todayAttendance.length}</p>
                </div>
            `;
            
            dataResults.innerHTML = tableHTML;
            
        } catch (error) {
            console.error('Error viewing date\'s data:', error);
            
            dataResults.innerHTML = `
                <div class="error-message">
                    <p>Failed to load attendance data for the selected date. Please try again.</p>
                </div>
            `;
        }
    }
    
    // Function to view all attendance data
    async function viewAllData() {
        try {
            showLoading();
            
            const classId = localStorage.getItem('assignedClassId');
            
            if (!classId) {
                throw new Error('No assigned class found');
            }
            
            // Get attendance data for all students in the class
            const { data: attendanceData, error } = await supabase
                .from('attendance')
                .select(`
                    date,
                    status,
                    profiles (
                        first_name,
                        last_name,
                        student_id
                    )
                `)
                .eq('class_id', classId)
                .order('date', { ascending: false });
                
            if (error) throw error;
            
            // Process data and render the view
            renderAttendanceTable(attendanceData, 'All Attendance Records');
            
        } catch (error) {
            console.error('Error viewing all data:', error);
            
            dataResults.innerHTML = `
                <div class="error-message">
                    <p>Failed to load attendance data. Please try again.</p>
                </div>
            `;
        }
    }
    
    // Function to view students below 75% attendance
    async function viewBelowThreshold() {
        try {
            showLoading();
            
            const classId = localStorage.getItem('assignedClassId');
            
            if (!classId) {
                throw new Error('No assigned class found');
            }
            
            // First, get all students enrolled in the class
            const { data: enrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select(`
                    student_id,
                    profiles (
                        first_name,
                        last_name,
                        student_id
                    )
                `)
                .eq('class_id', classId);
                
            if (enrollError) throw enrollError;
            
            // For each student, calculate their attendance percentage
            const attendancePromises = enrollments.map(async (enrollment) => {
                const { data: studentAttendance, error: attendError } = await supabase
                    .from('attendance')
                    .select('status')
                    .eq('class_id', classId)
                    .eq('student_id', enrollment.student_id);
                    
                if (attendError) throw attendError;
                
                const totalClasses = studentAttendance.length;
                const presentCount = studentAttendance.filter(
                    record => record.status === 'present' || record.status === 'late'
                ).length;
                
                const attendancePercentage = totalClasses > 0 
                    ? (presentCount / totalClasses) * 100 
                    : 0;
                
                return {
                    studentId: enrollment.student_id,
                    name: `${enrollment.profiles.first_name} ${enrollment.profiles.last_name}`,
                    rollNo: enrollment.profiles.student_id,
                    attendancePercentage: attendancePercentage.toFixed(2),
                    totalClasses,
                    presentCount
                };
            });
            
            const studentsAttendance = await Promise.all(attendancePromises);
            
            // Filter students below 75% attendance
            const lowAttendanceStudents = studentsAttendance.filter(
                student => parseFloat(student.attendancePercentage) < 75
            );
            
            // Render the results
            if (lowAttendanceStudents.length === 0) {
                dataResults.innerHTML = `
                    <div class="success-message">
                        <p>Great! All students have attendance above 75%.</p>
                    </div>
                `;
                return;
            }
            
            // Create the table
            let tableHTML = `
                <h3>Students with Attendance Below 75%</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Attendance %</th>
                            <th>Classes Present</th>
                            <th>Total Classes</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            lowAttendanceStudents.forEach(student => {
                tableHTML += `
                    <tr class="low-attendance">
                        <td>${student.rollNo}</td>
                        <td>${student.name}</td>
                        <td>${student.attendancePercentage}%</td>
                        <td>${student.presentCount}</td>
                        <td>${student.totalClasses}</td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                </table>
            `;
            
            dataResults.innerHTML = tableHTML;
            
        } catch (error) {
            console.error('Error viewing below threshold data:', error);
            
            dataResults.innerHTML = `
                <div class="error-message">
                    <p>Failed to load attendance data. Please try again.</p>
                </div>
            `;
        }
    }
    
    // Function to view today's attendance
    async function viewTodayData() {
        try {
            showLoading();
            
            const classId = localStorage.getItem('assignedClassId');
            
            if (!classId) {
                throw new Error('No assigned class found');
            }
            
            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];
            
            // Get attendance data for today
            const { data: todayAttendance, error } = await supabase
                .from('attendance')
                .select(`
                    status,
                    remarks,
                    profiles (
                        first_name,
                        last_name,
                        student_id
                    )
                `)
                .eq('class_id', classId)
                .eq('date', today);
                
            if (error) throw error;
            
            // Process and render the data
            if (todayAttendance.length === 0) {
                dataResults.innerHTML = `
                    <div class="notice-message">
                        <p>No attendance records found for today (${today}).</p>
                        <a href="enter-data.html" class="btn-primary">Mark Today's Attendance</a>
                    </div>
                `;
                return;
            }
            
            // Create the table
            let tableHTML = `
                <h3>Today's Attendance (${today})</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            todayAttendance.forEach(record => {
                let statusClass = '';
                
                switch (record.status) {
                    case 'present':
                        statusClass = 'status-present';
                        break;
                    case 'absent':
                        statusClass = 'status-absent';
                        break;
                    case 'late':
                        statusClass = 'status-late';
                        break;
                    case 'excused':
                        statusClass = 'status-excused';
                        break;
                }
                
                tableHTML += `
                    <tr>
                        <td>${record.profiles.student_id}</td>
                        <td>${record.profiles.first_name} ${record.profiles.last_name}</td>
                        <td class="${statusClass}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
                        <td>${record.remarks || '-'}</td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                </table>
                
                <div class="attendance-summary">
                    <p>Present: ${todayAttendance.filter(r => r.status === 'present').length}</p>
                    <p>Absent: ${todayAttendance.filter(r => r.status === 'absent').length}</p>
                    <p>Late: ${todayAttendance.filter(r => r.status === 'late').length}</p>
                    <p>Excused: ${todayAttendance.filter(r => r.status === 'excused').length}</p>
                    <p>Total: ${todayAttendance.length}</p>
                </div>
            `;
            
            dataResults.innerHTML = tableHTML;
            
        } catch (error) {
            console.error('Error viewing today\'s data:', error);
            
            dataResults.innerHTML = `
                <div class="error-message">
                    <p>Failed to load today's attendance data. Please try again.</p>
                </div>
            `;
        }
    }
    
    // Function to render a generic attendance table
    function renderAttendanceTable(data, title) {
        if (!data || data.length === 0) {
            dataResults.innerHTML = `
                <div class="notice-message">
                    <p>No attendance records found.</p>
                </div>
            `;
            return;
        }
        
        // Process the data to count attendance by date and student
        const attendanceByDate = {};
        const students = new Map();
        
        data.forEach(record => {
            // Track unique students
            if (!students.has(record.profiles.student_id)) {
                students.set(record.profiles.student_id, {
                    id: record.profiles.student_id,
                    name: `${record.profiles.first_name} ${record.profiles.last_name}`
                });
            }
            
            // Group by date
            if (!attendanceByDate[record.date]) {
                attendanceByDate[record.date] = [];
            }
            
            attendanceByDate[record.date].push(record);
        });
        
        // Create tables for each date
        let tablesHTML = `<h3>${title}</h3>`;
        
        // Sort dates in descending order (most recent first)
        const sortedDates = Object.keys(attendanceByDate).sort((a, b) => new Date(b) - new Date(a));
        
        sortedDates.forEach(date => {
            const dateRecords = attendanceByDate[date];
            
            tablesHTML += `
                <div class="date-section">
                    <h4>Date: ${formatDate(date)}</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            dateRecords.forEach(record => {
                let statusClass = '';
                
                switch (record.status) {
                    case 'present':
                        statusClass = 'status-present';
                        break;
                    case 'absent':
                        statusClass = 'status-absent';
                        break;
                    case 'late':
                        statusClass = 'status-late';
                        break;
                    case 'excused':
                        statusClass = 'status-excused';
                        break;
                }
                
                tablesHTML += `
                    <tr>
                        <td>${record.profiles.student_id}</td>
                        <td>${record.profiles.first_name} ${record.profiles.last_name}</td>
                        <td class="${statusClass}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
                        <td>${record.remarks || '-'}</td>
                    </tr>
                `;
            });
            
            tablesHTML += `
                        </tbody>
                    </table>
                    
                    <div class="attendance-summary">
                        <p>Present: ${dateRecords.filter(r => r.status === 'present').length}</p>
                        <p>Absent: ${dateRecords.filter(r => r.status === 'absent').length}</p>
                        <p>Late: ${dateRecords.filter(r => r.status === 'late').length}</p>
                        <p>Excused: ${dateRecords.filter(r => r.status === 'excused').length}</p>
                        <p>Total: ${dateRecords.length}</p>
                    </div>
                </div>
            `;
        });
        
        dataResults.innerHTML = tablesHTML;
    }
    
    // Show loading state in the results area
    function showLoading() {
        dataResults.innerHTML = `
            <div class="loading">
                <p>Loading data...</p>
            </div>
        `;
    }
});
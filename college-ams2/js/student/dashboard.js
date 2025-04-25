document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is a student
    if (!checkAuthentication(['student'])) {
        window.location.href = '../student-login.html';
        return;
    }
    
    // Initialize page elements
    const studentName = document.getElementById('student-name');
    const percentageCircle = document.getElementById('percentageCircle');
    const attendanceValue = document.getElementById('attendanceValue');
    const classesAttended = document.getElementById('classesAttended');
    const totalClasses = document.getElementById('totalClasses');
    const lastAbsence = document.getElementById('lastAbsence');
    const attendanceMessage = document.getElementById('attendanceMessage');
    const monthlyAttendance = document.getElementById('monthlyAttendance');
    const attendanceHistory = document.getElementById('attendanceHistory');
    
    // Get logged in student info
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Display student name
    if (user && user.name) {
        studentName.textContent = user.name;
    } else {
        studentName.textContent = 'Student Information';
    }
    
    // Load student attendance data
    await loadAttendanceData();
    
    // Function to load student attendance data
    async function loadAttendanceData() {
        try {
            // Get student's attendance records
            const { data: attendanceRecords, error: attendanceError } = await supabase
                .from('attendance')
                .select(`
                    date,
                    status,
                    class_id,
                    remarks
                `)
                .eq('student_id', user.id)
                .order('date', { ascending: false });
                
            if (attendanceError) throw attendanceError;
            
            if (!attendanceRecords || attendanceRecords.length === 0) {
                // No attendance records found
                showNoAttendanceData();
                return;
            }
            
            // Calculate attendance statistics
            const totalClassCount = attendanceRecords.length;
            const presentCount = attendanceRecords.filter(
                record => record.status === 'present' || record.status === 'late'
            ).length;
            
            const attendancePercentage = (presentCount / totalClassCount) * 100;
            
            // Find the last absence
            const lastAbsenceRecord = attendanceRecords.find(record => record.status === 'absent');
            
            // Update UI with attendance data
            attendanceValue.textContent = attendancePercentage.toFixed(0);
            percentageCircle.style.setProperty('--percentage', `${attendancePercentage}%`);
            
            classesAttended.textContent = presentCount;
            totalClasses.textContent = totalClassCount;
            
            if (lastAbsenceRecord) {
                lastAbsence.textContent = formatDate(lastAbsenceRecord.date);
            } else {
                lastAbsence.textContent = 'None';
            }
            
            // Set the appropriate message based on attendance percentage
            if (attendancePercentage >= 85) {
                attendanceMessage.textContent = 'Excellent attendance! Keep it up!';
                attendanceMessage.className = 'attendance-message good';
            } else if (attendancePercentage >= 75) {
                attendanceMessage.textContent = 'Good attendance, but try to improve!';
                attendanceMessage.className = 'attendance-message warning';
            } else {
                attendanceMessage.textContent = 'Warning: Your attendance is below the required 75%. Please improve immediately.';
                attendanceMessage.className = 'attendance-message danger';
            }
            
            // Load monthly attendance chart
            await loadMonthlyChart(attendanceRecords);
            
            // Load recent attendance history
            loadAttendanceHistory(attendanceRecords);
            
        } catch (error) {
            console.error('Error loading attendance data:', error);
            
            attendanceMessage.textContent = 'Failed to load attendance data. Please try refreshing the page.';
            attendanceMessage.className = 'attendance-message danger';
            
            // Clear loading messages
            monthlyAttendance.innerHTML = '<h3>Monthly Attendance</h3><div class="error-message">Error loading data</div>';
            attendanceHistory.innerHTML = '<h3>Recent Attendance Records</h3><div class="error-message">Error loading data</div>';
        }
    }
    
    // Function to show message when no attendance data is found
    function showNoAttendanceData() {
        attendanceValue.textContent = '0';
        percentageCircle.style.setProperty('--percentage', '0%');
        
        classesAttended.textContent = '0';
        totalClasses.textContent = '0';
        lastAbsence.textContent = 'N/A';
        
        attendanceMessage.textContent = 'No attendance records found. Records will appear once your classes begin.';
        attendanceMessage.className = 'attendance-message';
        
        // Clear loading messages
        monthlyAttendance.innerHTML = '<h3>Monthly Attendance</h3><div class="notice-message">No attendance data available</div>';
        attendanceHistory.innerHTML = '<h3>Recent Attendance Records</h3><div class="notice-message">No attendance records available</div>';
    }
    
    // Function to load monthly attendance chart
    async function loadMonthlyChart(attendanceRecords) {
        // Group records by month
        const monthlyData = {};
        
        // Define months
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        // Initialize all months with zero
        months.forEach(month => {
            monthlyData[month] = {
                total: 0,
                present: 0
            };
        });
        
        // Process attendance records
        attendanceRecords.forEach(record => {
            const date = new Date(record.date);
            const month = months[date.getMonth()];
            
            monthlyData[month].total++;
            
            if (record.status === 'present' || record.status === 'late') {
                monthlyData[month].present++;
            }
        });
        
        // Create the monthly chart HTML
        let chartHTML = '<h3>Monthly Attendance</h3>';
        chartHTML += '<div class="monthly-chart">';
        
        // Only include months with data
        const monthsWithData = months.filter(month => monthlyData[month].total > 0);
        
        if (monthsWithData.length === 0) {
            monthlyAttendance.innerHTML = '<h3>Monthly Attendance</h3><div class="notice-message">No monthly data available yet</div>';
            return;
        }
        
        monthsWithData.forEach(month => {
            const data = monthlyData[month];
            const percentage = data.total > 0 ? (data.present / data.total) * 100 : 0;
            
            chartHTML += `
                <div class="month-bar">
                    <div class="bar" style="height: ${percentage}%;" title="${percentage.toFixed(1)}%"></div>
                    <div class="bar-label">${month}</div>
                </div>
            `;
        });
        
        chartHTML += '</div>';
        
        // Add a legend
        chartHTML += `
            <div class="chart-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #3498db;"></div>
                    <div class="legend-label">Attendance %</div>
                </div>
            </div>
        `;
        
        monthlyAttendance.innerHTML = chartHTML;
    }
    
    // Function to load attendance history
    function loadAttendanceHistory(attendanceRecords) {
        // Only show the most recent 10 records
        const recentRecords = attendanceRecords.slice(0, 10);
        
        if (recentRecords.length === 0) {
            attendanceHistory.innerHTML = '<h3>Recent Attendance Records</h3><div class="notice-message">No attendance records available</div>';
            return;
        }
        
        let historyHTML = '<h3>Recent Attendance Records</h3>';
        historyHTML += `
            <table class="attendance-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        recentRecords.forEach(record => {
            let statusClass = '';
            let statusText = '';
            
            switch (record.status) {
                case 'present':
                    statusClass = 'status-present';
                    statusText = 'Present';
                    break;
                case 'absent':
                    statusClass = 'status-absent';
                    statusText = 'Absent';
                    break;
                case 'late':
                    statusClass = 'status-late';
                    statusText = 'Late';
                    break;
                case 'excused':
                    statusClass = 'status-excused';
                    statusText = 'Excused';
                    break;
            }
            
            historyHTML += `
                <tr>
                    <td>${formatDate(record.date)}</td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                    <td>${record.remarks || '-'}</td>
                </tr>
            `;
        });
        
        historyHTML += `
                </tbody>
            </table>
        `;
        
        attendanceHistory.innerHTML = historyHTML;
    }
});
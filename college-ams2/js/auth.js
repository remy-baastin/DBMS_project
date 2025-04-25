// Initialize Supabase
const supabaseUrl = 'https://hpzhjyyfmzkacculsaca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwemhqeXlmbXprYWNjdWxzYWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNjUzMjksImV4cCI6MjA2MDk0MTMyOX0.hCZOSotEtD7SKKfT71hNCFIY_n1A1GfTDBoB6Png8tA';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Check if user is already logged in
function checkAuthentication(allowedRoles) {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        // User is not logged in, redirect to login page
        if (window.location.pathname.includes('/teacher/')) {
            window.location.href = '../teacher-login.html';
        } else if (window.location.pathname.includes('/student/')) {
            window.location.href = '../student-login.html';
        } else if (window.location.pathname.includes('/department/')) {
            window.location.href = '../department-login.html';
        } else {
            window.location.href = 'index.html';
        }
        return false;
    }
    
    if (!allowedRoles.includes(user.role)) {
        alert('You do not have permission to access this page');
        
        // Redirect based on user's role
        if (user.role === 'teacher') {
            window.location.href = '/teacher/dashboard.html';
        } else if (user.role === 'student') {
            window.location.href = '/student/dashboard.html';
        } else if (user.role === 'department') {
            window.location.href = '/department/dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
        return false;
    }
    
    return true;
}

// Sign out user
function signOut() {
    // Remove user from localStorage
    localStorage.removeItem('user');
    
    // Sign out from Supabase Auth
    supabase.auth.signOut().then(() => {
        // Redirect to home page
        window.location.href = '../index.html';
    });
}
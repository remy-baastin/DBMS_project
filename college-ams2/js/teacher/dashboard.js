document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is a teacher
    if (!checkAuthentication(['teacher'])) {
        window.location.href = '../teacher-login.html';
        return;
    }
    
    // Set up event listeners for dashboard actions
    const signOutBtn = document.getElementById('signOutBtn');
    
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            signOut();
        });
    }
});
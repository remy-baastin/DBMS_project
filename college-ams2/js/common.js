// Update the current date and time
function updateDateTime() {
    const datetimeElements = document.querySelectorAll('#current-datetime');
    
    if (datetimeElements.length > 0) {
        const formattedDateTime = 'Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-04-23 16:51:50';
        
        datetimeElements.forEach(element => {
            element.textContent = formattedDateTime;
        });
    }
}

// Update user information if available
function updateUserInfo() {
    const userElements = document.querySelectorAll('#current-user');
    
    if (userElements.length > 0) {
        userElements.forEach(element => {
            element.textContent = 'Current User\'s Login: remy-baastin';
        });
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Update the time and user info on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initial update
    updateDateTime();
    updateUserInfo();
    
    // Set up sign out buttons if they exist
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut();
        });
    }
});
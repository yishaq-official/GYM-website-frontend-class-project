document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('loginForm');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const alertBox = document.getElementById('login-alert');
            const API_BASE_URL = 'http://localhost:3000';

            // --- Theme Toggle Logic ---
            const body = document.body;
            const themeToggle = document.getElementById('theme-toggle');
            const icon = themeToggle.querySelector('i');
            const savedTheme = localStorage.getItem('admin-theme'); // Consistent storage key
            
            if (savedTheme === 'dark') {
                body.classList.add('dark-mode');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                 icon.classList.remove('fa-sun');
                 icon.classList.add('fa-moon');
            }

            themeToggle.addEventListener('click', () => {
                body.classList.toggle('dark-mode');
                
                if (body.classList.contains('dark-mode')) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                    localStorage.setItem('admin-theme', 'dark');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                    localStorage.setItem('admin-theme', 'light');
                }
            });

            // --- Updated Login Submission Logic (Async/Await) ---
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                alertBox.classList.add('d-none'); // Hide previous errors

                const email = emailInput.value.trim();
                const password = passwordInput.value.trim();

                try {
                    // 1. Check if it's a USER
                    const userResponse = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
                    const users = await userResponse.json();

                    if (users.length > 0) {
                        const user = users[0];

                        // --- APPROVAL CHECK LOGIC ---
                        if (user.role !== 'admin') {
                            if (user.membershipStatus === 'pending') {
                                window.location.href = '../pending/pending.html';
                                return;
                            }
                            if (user.membershipStatus === 'rejected') {
                                alertBox.textContent = "Your account application was rejected. Please contact support.";
                                alertBox.classList.remove('d-none');
                                return;
                            }
                        }

                        // Save session details
                        localStorage.setItem('currentUser', JSON.stringify(user));
                        localStorage.setItem('userRole', 'user');
                        
                        console.log("User login successful:", user.fullName);
                        window.location.href = '../user/userDashboard.html';
                        return; // Stop execution
                    }

                    // 2. If not a user, Check if it's an ADMIN
                    const adminResponse = await fetch(`${API_BASE_URL}/admins?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
                    const admins = await adminResponse.json();

                    if (admins.length > 0) {
                        const admin = admins[0];
                        // Save session details
                        localStorage.setItem('currentUser', JSON.stringify(admin));
                        localStorage.setItem('userRole', 'admin');
                        
                        console.log("Admin login successful:", admin.fullName);
                        window.location.href = '../admin/adminPage.html';
                        return; // Stop execution
                    }

                    // 3. If neither found, show error
                    throw new Error('Invalid credentials');

                } catch (error) {
                    console.error("Login Error:", error);
                    alertBox.textContent = "Invalid email or password. Please try again.";
                    alertBox.classList.remove('d-none');
                    passwordInput.value = ''; // Clear password for security
                }
            });
        });
        // --- State Variables ---
        let currentCode = null;
        let userEmail = "";
        let userId = null;

        // --- Core Functions ---
        document.addEventListener('DOMContentLoaded', () => {
            setupThemeToggle();
            setupForms();
        });

        // 1. Theme Logic
        function setupThemeToggle() {
            const body = document.body;
            const themeToggle = document.getElementById('theme-toggle');
            const icon = themeToggle.querySelector('i');
            const savedTheme = localStorage.getItem('theme');
            
            if (savedTheme === 'dark') {
                body.classList.add('dark-mode');
                icon.className = 'fas fa-sun';
            }

            themeToggle.addEventListener('click', () => {
                body.classList.toggle('dark-mode');
                const isDark = body.classList.contains('dark-mode');
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });
        }

        // 2. Form Logic
        function setupForms() {
            const step1 = document.getElementById('step1');
            const step2 = document.getElementById('step2');
            const step3 = document.getElementById('step3');
            const successState = document.getElementById('successState');
            const emailInput = document.getElementById('email');
            const emailFeedback = document.getElementById('emailFeedback');

            // --- STEP 1: Check Email ---
            document.getElementById('emailForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const emailBtn = e.target.querySelector('button');
                emailInput.classList.remove('is-invalid');
                
                if (!emailInput.checkValidity()) {
                    emailInput.classList.add('is-invalid');
                    return;
                }

                // Loading UI
                const originalBtnText = emailBtn.innerHTML;
                emailBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Checking...';
                emailBtn.disabled = true;

                try {
                    // Check DB
                    const response = await fetch(`http://localhost:3000/users?email=${emailInput.value}`);
                    const users = await response.json();

                    if (users.length === 0) {
                        emailInput.classList.add('is-invalid');
                        emailFeedback.textContent = "No account found with this email address.";
                    } else {
                        userEmail = users[0].email;
                        userId = users[0].id; // Needed for update
                        
                        generateAndSendCode();
                        
                        document.getElementById('displayEmail').textContent = userEmail;
                        step1.classList.add('d-none');
                        step2.classList.remove('d-none');
                    }
                } catch (error) {
                    console.error(error);
                    alert("Connection error. Is JSON Server running?");
                } finally {
                    emailBtn.innerHTML = originalBtnText;
                    emailBtn.disabled = false;
                }
            });

            document.getElementById('backToStep1').addEventListener('click', (e) => {
                e.preventDefault();
                step2.classList.add('d-none');
                step1.classList.remove('d-none');
            });

            document.getElementById('resendLink').addEventListener('click', (e) => {
                e.preventDefault();
                generateAndSendCode();
            });

            // --- STEP 2: Verify Code ---
            document.getElementById('codeForm').addEventListener('submit', (e) => {
                e.preventDefault();
                const inputCode = document.getElementById('verificationCode').value;
                const codeAlert = document.getElementById('codeAlert');

                if (parseInt(inputCode) === currentCode) {
                    codeAlert.classList.add('d-none');
                    step2.classList.add('d-none');
                    step3.classList.remove('d-none');
                } else {
                    codeAlert.classList.remove('d-none');
                    document.getElementById('verificationCode').value = '';
                }
            });

            // --- STEP 3: Reset Password (API Call) ---
            document.getElementById('passwordForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const newPass = document.getElementById('newPassword').value;
                const confirmPass = document.getElementById('confirmPassword').value;
                const passAlert = document.getElementById('passwordAlert');
                const submitBtn = e.target.querySelector('button');

                passAlert.classList.add('d-none');

                if (newPass.length < 6) {
                    passAlert.textContent = "Password must be at least 6 characters.";
                    passAlert.classList.remove('d-none');
                    return;
                }
                if (newPass !== confirmPass) {
                    passAlert.textContent = "Passwords do not match.";
                    passAlert.classList.remove('d-none');
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Updating...';

                try {
                    // Update Password in DB
                    const response = await fetch(`http://localhost:3000/users/${userId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: newPass })
                    });

                    if (response.ok) {
                        step3.classList.add('d-none');
                        successState.classList.remove('d-none');
                        setTimeout(() => {
                            window.location.href = '../login/login.html';
                        }, 3000);
                    } else {
                        throw new Error('Update failed');
                    }
                } catch (error) {
                    passAlert.textContent = "Failed to update password on server.";
                    passAlert.classList.remove('d-none');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Reset Password';
                }
            });
        }

        // --- HELPER: SHOW NOTIFICATION INSTEAD OF CONSOLE ---
        function generateAndSendCode() {
            currentCode = Math.floor(100000 + Math.random() * 900000);
            
            // UI Notification Logic
            const notif = document.getElementById('fakeEmailNotification');
            const codeDisplay = document.getElementById('notifCode');
            
            codeDisplay.textContent = currentCode;
            notif.classList.add('show');

            // Play a notification sound (Optional, but cool for mobile)
            // let audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            // audio.play().catch(e => console.log('Audio blocked'));

            // Auto-hide after 8 seconds
            setTimeout(() => {
                notif.classList.remove('show');
            }, 8000);
        }

        window.togglePassword = (fieldId) => {
            const input = document.getElementById(fieldId);
            const icon = input.nextElementSibling.querySelector('i');
            if (input.type === "password") {
                input.type = "text";
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = "password";
                icon.className = 'fas fa-eye';
            }
        };
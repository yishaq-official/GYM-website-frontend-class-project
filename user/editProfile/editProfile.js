document.addEventListener('DOMContentLoaded', async () => {
            
            // --- 0. Authentication Check ---
            const sessionUser = JSON.parse(localStorage.getItem('currentUser'));
            const userRole = localStorage.getItem('userRole');

            if (!sessionUser || userRole !== 'user') {
                window.location.href = '../../login/login.html';
                return;
            }

            const API_URL = `http://localhost:3000/users/${sessionUser.id}`;
            let currentUserData = {}; // Store fetched data here

            // --- 1. Theme Setup ---
            const body = document.body;
            const themeToggle = document.getElementById('theme-toggle');
            const icon = themeToggle.querySelector('i');
            
            const savedTheme = localStorage.getItem('dashboard-theme');
            if (savedTheme === 'dark') {
                body.classList.add('dark-mode');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }

            themeToggle.addEventListener('click', () => {
                body.classList.toggle('dark-mode');
                if (body.classList.contains('dark-mode')) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                    localStorage.setItem('dashboard-theme', 'dark');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                    localStorage.setItem('dashboard-theme', 'light');
                }
            });

            // --- 2. Logout Logic ---
            document.getElementById('logoutBtn').addEventListener('click', () => {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userRole');
                window.location.href = '../../login/login.html';
            });

            // --- 3. Load User Data ---
            async function loadUserData() {
                try {
                    const res = await fetch(API_URL);
                    if (!res.ok) throw new Error("Failed to fetch user data");
                    
                    currentUserData = await res.json();
                    const user = currentUserData;

                    // Headers
                    document.getElementById('memberNameHeader').textContent = user.fullName;
                    document.getElementById('memberIdHeader').textContent = `ID: ${user.membershipId}`;
                    document.getElementById('profileNameDisplay').innerHTML = `<i class="fas fa-user me-1"></i> ${user.fullName.split(' ')[0]}`;

                    // Profile Picture
                    if (user.profileImage && user.profileImage.startsWith('data:image')) {
                        document.getElementById('profilePicturePreview').innerHTML = `<img src="${user.profileImage}" alt="Profile">`;
                    }

                    // Form Fields
                    document.getElementById('fullName').value = user.fullName;
                    document.getElementById('email').value = user.email;
                    document.getElementById('phone').value = user.phone;
                    document.getElementById('memberId').value = user.membershipId;
                    document.getElementById('membershipType').value = user.membershipType;

                    // Conditional Logic
                    const uniFields = document.getElementById('universityFields');
                    const extFields = document.getElementById('externalFields');

                    if (user.isUniversityMember) {
                        uniFields.classList.remove('d-none');
                        extFields.classList.add('d-none');
                        document.getElementById('universityId').value = user.universityId;
                        document.getElementById('department').value = user.department || '';
                    } else {
                        uniFields.classList.add('d-none');
                        extFields.classList.remove('d-none');
                        document.getElementById('nationalId').value = user.nationalId;
                        document.getElementById('address').value = user.address || '';
                    }

                } catch (error) {
                    console.error(error);
                    alert("Error loading profile data.");
                }
            }

            // Call load immediately
            loadUserData();

            // --- 4. Handle Profile Picture Update ---
            const photoInput = document.getElementById('profilePictureInput');
            const btnUpdatePic = document.getElementById('btnUpdatePicture');

            // Preview on selection
            photoInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        document.getElementById('profilePicturePreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    }
                    reader.readAsDataURL(this.files[0]);
                }
            });

            // Save Picture
            btnUpdatePic.addEventListener('click', async () => {
                if (photoInput.files.length === 0) return alert("Please select an image first.");
                
                const file = photoInput.files[0];
                const reader = new FileReader();
                
                reader.onloadend = async () => {
                    const base64String = reader.result;
                    try {
                        const res = await fetch(API_URL, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ profileImage: base64String })
                        });
                        if (res.ok) {
                            alert("Profile picture updated!");
                            loadUserData(); // Refresh
                        }
                    } catch (err) {
                        alert("Failed to upload image.");
                    }
                };
                reader.readAsDataURL(file);
            });


            // --- 5. Handle Profile Info Update ---
            document.getElementById('profileForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const updatedData = {
                    fullName: document.getElementById('fullName').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                };

                if (currentUserData.isUniversityMember) {
                    updatedData.department = document.getElementById('department').value;
                } else {
                    updatedData.address = document.getElementById('address').value;
                }

                try {
                    const res = await fetch(API_URL, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedData)
                    });

                    if (res.ok) {
                        const saveAlert = document.getElementById('saveAlert');
                        saveAlert.classList.remove('d-none');
                        setTimeout(() => saveAlert.classList.add('d-none'), 3000);
                        loadUserData();
                    }
                } catch (err) {
                    alert("Failed to update profile.");
                }
            });


            // --- 6. Handle Password Change ---
            document.getElementById('passwordForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const alertBox = document.getElementById('passwordAlert');
                alertBox.classList.add('d-none');
                alertBox.className = 'alert d-none'; // Reset classes

                const oldPass = document.getElementById('oldPassword').value;
                const newPass = document.getElementById('newPassword').value;
                const confirmPass = document.getElementById('confirmNewPassword').value;

                // 1. Verify Old Password
                if (oldPass !== currentUserData.password) {
                    alertBox.textContent = "Incorrect old password.";
                    alertBox.classList.add('alert-danger');
                    alertBox.classList.remove('d-none');
                    return;
                }

                // 2. Validate New Password
                if (newPass.length < 6) {
                    alertBox.textContent = "New password must be at least 6 chars.";
                    alertBox.classList.add('alert-danger');
                    alertBox.classList.remove('d-none');
                    return;
                }

                if (newPass !== confirmPass) {
                    alertBox.textContent = "Passwords do not match.";
                    alertBox.classList.add('alert-danger');
                    alertBox.classList.remove('d-none');
                    return;
                }

                // 3. Save
                try {
                    const res = await fetch(API_URL, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: newPass })
                    });

                    if (res.ok) {
                        alertBox.textContent = "Password changed successfully!";
                        alertBox.classList.add('alert-success');
                        alertBox.classList.remove('d-none');
                        document.getElementById('passwordForm').reset();
                        // Update local data reference
                        currentUserData.password = newPass; 
                    }
                } catch (err) {
                    alertBox.textContent = "Server error. Try again later.";
                    alertBox.classList.add('alert-danger');
                    alertBox.classList.remove('d-none');
                }
            });

        });
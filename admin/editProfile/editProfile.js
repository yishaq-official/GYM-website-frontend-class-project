document.addEventListener('DOMContentLoaded', async () => {
            
            // --- 0. Authentication Check ---
            const sessionUser = JSON.parse(localStorage.getItem('currentUser'));
            const userRole = localStorage.getItem('userRole');

            if (!sessionUser || userRole !== 'admin') {
                window.location.href = '../../login/login.html';
                return;
            }

            const ADMIN_API_URL = `http://localhost:3000/admins/${sessionUser.id}`;
            const SETTINGS_API_URL = `http://localhost:3000/settings`;
            
            let currentAdminData = {};

            // --- 1. Load Data ---
            async function initData() {
                try {
                    // Fetch Admin Data
                    const adminRes = await fetch(ADMIN_API_URL);
                    currentAdminData = await adminRes.json();
                    
                    // Fetch Settings Data
                    const settingsRes = await fetch(SETTINGS_API_URL);
                    const settingsData = await settingsRes.json();

                    // --- Populate Admin Profile ---
                    document.getElementById('adminNameHeader').textContent = currentAdminData.fullName;
                    document.getElementById('adminIdHeader').textContent = `ID: ${currentAdminData.id}`;
                    document.getElementById('profileNameDisplay').innerHTML = `<i class="fas fa-user-shield me-1"></i> ${currentAdminData.fullName.split(' ')[0]}`;

                    if(currentAdminData.profileImage && currentAdminData.profileImage.startsWith('data:image')){
                        document.getElementById('profilePicturePreview').innerHTML = `<img src="${currentAdminData.profileImage}" alt="Profile">`;
                    }

                    document.getElementById('fullName').value = currentAdminData.fullName;
                    document.getElementById('username').value = currentAdminData.username;
                    document.getElementById('email').value = currentAdminData.email;
                    document.getElementById('phone').value = currentAdminData.phone;
                    document.getElementById('adminId').value = currentAdminData.id;
                    document.getElementById('role').value = currentAdminData.position || 'Admin';

                    // --- Populate Settings ---
                    document.getElementById('announcementMessage').value = settingsData.announcementMessage || '';
                    document.getElementById('openingHours').value = settingsData.openingHours || '';
                    
                    if(settingsData.defaultPricing) {
                        document.getElementById('priceMonthly').value = settingsData.defaultPricing.monthly;
                        document.getElementById('priceThreeMonths').value = settingsData.defaultPricing.threeMonths;
                        document.getElementById('priceSixMonths').value = settingsData.defaultPricing.sixMonths;
                        document.getElementById('priceYearly').value = settingsData.defaultPricing.yearly;
                    }

                } catch (error) {
                    console.error("Error loading data:", error);
                    alert("Failed to load profile or settings data.");
                }
            }
            
            // Setup Theme & Logout (Standard logic)
            setupThemeAndLogout();
            
            // Initialize
            await initData();


            // --- 2. Update Profile Picture ---
            const photoInput = document.getElementById('profilePictureInput');
            const btnUpdatePic = document.getElementById('btnUpdatePicture');

            photoInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => document.getElementById('profilePicturePreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    reader.readAsDataURL(this.files[0]);
                }
            });

            btnUpdatePic.addEventListener('click', async () => {
                if (photoInput.files.length === 0) return alert("Select an image first.");
                const reader = new FileReader();
                reader.onloadend = async () => {
                    await updateAdminField({ profileImage: reader.result }, "Profile picture updated!");
                    location.reload(); // Refresh to update headers
                };
                reader.readAsDataURL(photoInput.files[0]);
            });


            // --- 3. Save Admin Profile Info ---
            document.getElementById('profileForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const updatedData = {
                    fullName: document.getElementById('fullName').value,
                    username: document.getElementById('username').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value
                };
                await updateAdminField(updatedData, "Profile details updated.");
            });


            // --- 4. Change Password ---
            document.getElementById('passwordForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const alertBox = document.getElementById('passwordAlert');
                alertBox.className = 'alert d-none'; 
                
                const oldPass = document.getElementById('currentPassword').value;
                const newPass = document.getElementById('newPassword').value;
                const confirmPass = document.getElementById('confirmNewPassword').value;

                if (oldPass !== currentAdminData.password) {
                    showAlert(alertBox, "Incorrect current password.", "danger");
                    return;
                }
                if (newPass.length < 5) {
                    showAlert(alertBox, "Password too short.", "danger");
                    return;
                }
                if (newPass !== confirmPass) {
                    showAlert(alertBox, "Passwords do not match.", "danger");
                    return;
                }

                await updateAdminField({ password: newPass }, "Password changed successfully!");
                document.getElementById('passwordForm').reset();
                currentAdminData.password = newPass; // Update local ref
            });


            // --- 5. Save System Config (Settings) ---
            document.getElementById('settingsForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const configData = {
                    announcementMessage: document.getElementById('announcementMessage').value,
                    openingHours: document.getElementById('openingHours').value,
                    defaultPricing: {
                        monthly: Number(document.getElementById('priceMonthly').value),
                        threeMonths: Number(document.getElementById('priceThreeMonths').value),
                        sixMonths: Number(document.getElementById('priceSixMonths').value),
                        yearly: Number(document.getElementById('priceYearly').value)
                    }
                };

                try {
                    const res = await fetch(SETTINGS_API_URL, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(configData)
                    });
                    if(res.ok) {
                        showGlobalSuccess("Business configuration updated.");
                    }
                } catch(err) {
                    alert("Failed to update configuration.");
                }
            });


            // --- Helper Functions ---

            async function updateAdminField(data, successMsg) {
                try {
                    const res = await fetch(ADMIN_API_URL, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (res.ok) showGlobalSuccess(successMsg);
                    else throw new Error("API Error");
                } catch (err) {
                    alert("Update failed.");
                }
            }

            function showGlobalSuccess(msg) {
                const alert = document.getElementById('saveAlert');
                alert.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${msg}`;
                alert.classList.remove('d-none');
                setTimeout(() => alert.classList.add('d-none'), 3000);
            }

            function showAlert(element, msg, type) {
                element.textContent = msg;
                element.classList.add(`alert-${type}`);
                element.classList.remove('d-none');
            }

            function setupThemeAndLogout() {
                const body = document.body;
                const toggle = document.getElementById('theme-toggle');
                const icon = toggle.querySelector('i');
                const theme = localStorage.getItem('admin-theme');
                if(theme === 'dark') { body.classList.add('dark-mode'); icon.className = 'fas fa-sun'; }
                
                toggle.addEventListener('click', () => {
                    body.classList.toggle('dark-mode');
                    const isDark = body.classList.contains('dark-mode');
                    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                    localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
                });

                document.getElementById('logoutBtn').addEventListener('click', () => {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('userRole');
                    window.location.href = '../../login/login.html';
                });
            }

        });
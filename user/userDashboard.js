document.addEventListener('DOMContentLoaded', async () => {
            
            // --- 0. Auth Check ---
            const sessionUser = JSON.parse(localStorage.getItem('currentUser'));
            const userRole = localStorage.getItem('userRole');

            if (!sessionUser || userRole !== 'user') {
                window.location.href = '../login/login.html';
                return;
            }

            // --- 1. Setup Theme & Variables ---
            const body = document.body;
            const themeToggle = document.getElementById('theme-toggle');
            const icon = themeToggle.querySelector('i');
            
            // API Endpoints
            const USER_API_URL = `http://localhost:3000/users/${sessionUser.id}`;
            const SETTINGS_API_URL = `http://localhost:3000/settings`;

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
                window.location.href = '../login/login.html';
            });

            // --- 3. Utility Functions ---
            function calculateRemainingDays(expiryDateStr) {
                if(!expiryDateStr) return 0;
                const today = new Date();
                const expiry = new Date(expiryDateStr);
                today.setHours(0, 0, 0, 0);
                expiry.setHours(0, 0, 0, 0);
                const diffTime = expiry.getTime() - today.getTime();
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            function getStatusBadge(daysLeft) {
                if (daysLeft < 0) return `<span class="status-badge bg-danger text-white"><i class="fas fa-times-circle me-1"></i> Expired</span>`;
                if (daysLeft <= 7) return `<span class="status-badge bg-warning text-dark"><i class="fas fa-exclamation-triangle me-1"></i> Expiring Soon</span>`;
                return `<span class="status-badge bg-success text-white"><i class="fas fa-check-circle me-1"></i> Active</span>`;
            }

            // --- 4. Fetch & Render Data ---
            try {
                // Fetch User AND Settings in parallel to calculate price
                const [userRes, settingsRes] = await Promise.all([
                    fetch(USER_API_URL),
                    fetch(SETTINGS_API_URL)
                ]);

                if (!userRes.ok) throw new Error('User not found');
                
                const user = await userRes.json();
                const settings = await settingsRes.json();
                
                // Calculations
                const daysRemaining = calculateRemainingDays(user.expiryDate);
                const statusBadgeHTML = getStatusBadge(daysRemaining);

                // --- Calculate Payment Amount ---
                let cost = 0;
                // Map select option values to db.json keys
                const typeMap = {
                    'Monthly': 'monthly',
                    '3Months': 'threeMonths', 
                    '6Months': 'sixMonths',
                    '1Year': 'yearly'
                };
                const pricingKey = typeMap[user.membershipType];
                
                if (pricingKey && settings.defaultPricing[pricingKey]) {
                    cost = settings.defaultPricing[pricingKey];
                    // Apply Discount if University Member
                    if (user.isUniversityMember) {
                        const discount = user.discountPercentage || 20; // Default to 20 if null
                        cost = cost - (cost * (discount / 100));
                    }
                }

                // A. Header
                document.getElementById('welcomeName').textContent = user.fullName.split(' ')[0];

                // B. Account Details
                document.getElementById('infoFullName').textContent = user.fullName;
                document.getElementById('infoMemberId').textContent = user.membershipId || "PENDING";
                
                const typeLabel = document.getElementById('infoAccountType');
                typeLabel.textContent = user.isUniversityMember ? 'University Member' : 'External Member';
                typeLabel.className = `badge status-badge ${user.isUniversityMember ? 'bg-info' : 'bg-primary'}`;
                
                document.getElementById('infoStatus').innerHTML = statusBadgeHTML;

                // C. Conditional Info
                if (user.isUniversityMember) {
                    document.getElementById('uniDetails').classList.remove('d-none');
                    document.getElementById('infoUniId').textContent = user.universityId;
                    document.getElementById('infoDepartment').textContent = user.department;
                } else {
                    document.getElementById('extDetails').classList.remove('d-none');
                    document.getElementById('infoNationalId').textContent = user.nationalId;
                    document.getElementById('infoAddress').textContent = user.address;
                }

                // E. Summary
                document.getElementById('sumType').textContent = user.membershipType;
                document.getElementById('sumStartDate').textContent = user.joinDate;
                document.getElementById('sumPlanCost').textContent = cost.toLocaleString() + " ETB"; // Display Cost
                
                const expEl = document.getElementById('sumExpiryDate');
                expEl.textContent = user.expiryDate;
                if(daysRemaining < 7) expEl.classList.add('text-danger');

                const payBadge = document.getElementById('sumPaymentStatus');
                payBadge.textContent = user.paymentStatus;
                payBadge.className = `badge status-badge ${user.paymentStatus === 'Paid' ? 'bg-success' : 'bg-danger'}`;

                document.getElementById('sumRemainingDays').textContent = daysRemaining < 0 ? 'Expired' : `${daysRemaining} Days`;
                if (daysRemaining < 7) document.getElementById('sumRemainingDays').classList.add('text-danger');

                // G. Notifications (Custom + System Announcement)
                const notifArea = document.getElementById('notificationArea');
                
                // 1. Add System Announcement if exists
                if (settings.announcementMessage) {
                    notifArea.insertAdjacentHTML('afterbegin', 
                        `<div class="alert alert-primary py-2 mb-2"><i class="fas fa-info-circle me-2"></i> ${settings.announcementMessage}</div>`
                    );
                }

                // 2. Add Expiry Alerts
                if (daysRemaining <= 7 && daysRemaining >= 0) {
                    notifArea.insertAdjacentHTML('afterbegin', 
                        `<div class="alert alert-warning py-2 mb-2"><i class="fas fa-clock me-2"></i> Membership expires in ${daysRemaining} days.</div>`
                    );
                } else if (daysRemaining < 0) {
                    notifArea.insertAdjacentHTML('afterbegin', 
                        `<div class="alert alert-danger py-2 mb-2"><i class="fas fa-lock me-2"></i> Membership has expired. Please renew.</div>`
                    );
                }

            } catch (error) {
                console.error("Dashboard Error:", error);
                alert("Failed to load user data. Please login again.");
                localStorage.removeItem('currentUser');
                window.location.href = '../login/login.html';
            }
        });
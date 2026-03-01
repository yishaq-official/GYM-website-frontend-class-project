
    document.addEventListener('DOMContentLoaded', async () => {
            const API_URL = 'http://localhost:3000/users';
            let membersData = [];
            let filteredData = []; // Store currently filtered results
            const CURRENT_DATE = new Date(); 
           
            // PAGINATION VARIABLES
            let currentPage = 1;
            const itemsPerPage = 8;

            const sessionUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!sessionUser || localStorage.getItem('userRole') !== 'admin') {
                window.location.href = '../login/login.html'; return;
            }
            document.getElementById('adminProfileName').innerHTML = `<i class="fas fa-user-shield me-1"></i> ${sessionUser.fullName}`;

            setupThemeToggle();
            setupLogout();
            await fetchMembers();
            
            async function fetchMembers() {
                try {
                    const res = await fetch(API_URL);
                    const allUsers = await res.json();
                    
                    // Filter: Only show Members (exclude admin, exclude pending/rejected)
                    membersData = allUsers.filter(u => u.role === 'user' && (u.membershipStatus === 'active' || u.membershipStatus === 'expired' || u.membershipStatus === 'expiring_soon'));
                    
                    // Process Status
                    membersData = membersData.map(member => ({...member, ...getMembershipStatus(member.expiryDate)}));
                    
                    // Initialize: Show All by default
                    filteredData = [...membersData];

                    updateStatistics();
                    renderCharts();
                    renderAdminAlerts();
                    
                    // RENDER TABLE IMMEDIATELY
                    renderTable(); 
                } catch (err) { console.error(err); }
            }

            function getMembershipStatus(expiryDateStr) {
                if (!expiryDateStr) return { computedStatus: 'unknown', badgeClass: 'bg-secondary' };
                const days = Math.ceil((new Date(expiryDateStr) - new Date()) / (1000 * 60 * 60 * 24));
                if (days < 0) return { computedStatus: "expired", badgeClass: "bg-danger" };
                if (days <= 7) return { computedStatus: "expiring_soon", badgeClass: "bg-warning text-dark" };
                return { computedStatus: "active", badgeClass: "bg-success" };
            }

            // --- Stats Logic ---
            function updateStatistics() {
                const total = membersData.length;
                // Active = active OR expiring_soon
                const active = membersData.filter(m => m.computedStatus === 'active' || m.computedStatus === 'expiring_soon').length;
                const expired = membersData.filter(m => m.computedStatus === 'expired').length;
                const uni = membersData.filter(m => m.isUniversityMember).length;
                const ext = total - uni;

                const prices = { 'Monthly': 300, '3Months': 800, '6Months': 1500, '1Year': 2500 };
                let revenue = 0;
                membersData.forEach(m => {
                    let cost = prices[m.membershipType] || 0;
                    if(m.isUniversityMember) cost *= 0.8;
                    revenue += cost;
                });

                document.getElementById('statTotalMembers').textContent = total;
                document.getElementById('statActiveMembers').textContent = active;
                document.getElementById('statExpiredMembers').textContent = expired;
                document.getElementById('statUniMembers').textContent = uni;
                document.getElementById('statExtMembers').textContent = ext;
                document.getElementById('statTotalRevenue').textContent = revenue.toLocaleString();
                document.getElementById('sumYearlyRevenue').textContent = revenue.toLocaleString() + " ETB";
                document.getElementById('sumPaymentsDue').textContent = `${expired} Members`;
            }

            // --- Filter Logic ---
            const searchInput = document.getElementById('memberSearch');
            const filterStatus = document.getElementById('memberFilterStatus');
            const filterType = document.getElementById('memberFilterType');

            function applyFilters() {
                const term = searchInput.value.toLowerCase();
                const status = filterStatus.value;
                const type = filterType.value;

                filteredData = membersData.filter(m => {
                    const matchesSearch = m.membershipId.toLowerCase().includes(term) || m.fullName.toLowerCase().includes(term);
                    const matchesStatus = !status || m.computedStatus === status;
                    let matchesType = true;
                    if(type === 'university') matchesType = m.isUniversityMember;
                    if(type === 'external') matchesType = !m.isUniversityMember;

                    return matchesSearch && matchesStatus && matchesType;
                });

                currentPage = 1; // Reset to page 1
                renderTable();
            }

            searchInput.addEventListener('input', applyFilters);
            filterStatus.addEventListener('change', applyFilters);
            filterType.addEventListener('change', applyFilters);

            // --- Table & Pagination Render ---
            function renderTable() {
                const tbody = document.getElementById('membersTableBody');
                const pagination = document.getElementById('paginationControls');
                
                // Pagination Logic
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const paginatedItems = filteredData.slice(start, end);

                // Render Rows
                tbody.innerHTML = paginatedItems.length ? paginatedItems.map(m => `
                    <tr>
                        <td>${m.membershipId}</td>
                        <td>${m.fullName}</td>
                        <td><span class="badge ${m.isUniversityMember ? 'bg-info' : 'bg-secondary'}">${m.isUniversityMember?'Uni':'Ext'}</span></td>
                        <td>${m.phone}</td>
                        <td>${m.membershipType}</td>
                        <td>${m.expiryDate}</td>
                        <td><span class="badge ${m.badgeClass}">${m.computedStatus === 'expiring_soon' ? 'Expiring Soon' : m.computedStatus}</span></td>
                        <td><button class="btn btn-sm btn-outline-danger" onclick="deleteMember('${m.id}')"><i class="fas fa-trash"></i></button></td>
                    </tr>`).join('') : '<tr><td colspan="8" class="text-center text-muted py-3">No members found matching criteria.</td></tr>';

                // Render Pagination Buttons
                const totalPages = Math.ceil(filteredData.length / itemsPerPage);
                let paginationHTML = '';
                
                if (totalPages > 1) {
                    // Prev
                    paginationHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a></li>`;
                    
                    // Numbers
                    for (let i = 1; i <= totalPages; i++) {
                        paginationHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`;
                    }

                    // Next
                    paginationHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a></li>`;
                }
                pagination.innerHTML = paginationHTML;
            }

            // Expose changePage to window scope
            window.changePage = (page) => {
                if (page < 1) return;
                currentPage = page;
                renderTable();
            };

            // --- Add Member Modal Logic ---
            const addForm = document.getElementById('addNewMemberForm');
            const uniBtn = document.getElementById('modal-type-uni-btn');
            const extBtn = document.getElementById('modal-type-ext-btn');
            const gymIdDisplay = document.getElementById('modalGymIdDisplay');
            const costDisplay = document.getElementById('modalCostDisplay');
            let currentAddType = 'university';
            const priceMap = { 'Monthly': 300, '3Months': 800, '6Months': 1500, '1Year': 2500 };

            // Validators
            const restrictText = (e) => e.target.value = e.target.value.replace(/[0-9]/g, '');
            document.getElementById('modalDepartment').addEventListener('input', restrictText);
            document.getElementById('modalFullName').addEventListener('input', restrictText);
            document.getElementById('modalNationalID').addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, '').substring(0, 16));
            document.getElementById('modalPhoneNumber').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9+]/g, ''); e.target.classList.remove('is-invalid'); });

            function updateModalUI(type) {
                currentAddType = type;
                uniBtn.classList.toggle('active', type === 'university');
                extBtn.classList.toggle('active', type === 'external');
                document.getElementById('modal-uniFields').classList.toggle('d-none', type !== 'university');
                document.getElementById('modal-extFields').classList.toggle('d-none', type !== 'external');
                
                document.getElementById('modalUniID').required = (type === 'university');
                document.getElementById('modalDepartment').required = (type === 'university');
                document.getElementById('modalNationalID').required = (type === 'external');
                document.getElementById('modalAddress').required = (type === 'external');

                generateNextID();
                updateCost();
            }

            function generateNextID() {
                const prefix = currentAddType === 'university' ? 'DBU' : 'EXT';
                const count = membersData.filter(m => m.membershipId && m.membershipId.startsWith(prefix)).length + 1;
                gymIdDisplay.textContent = `${prefix}-${new Date().getFullYear()}-${String(count).padStart(4,'0')}`;
            }

            function updateCost() {
                const plan = document.getElementById('modalMembershipType').value;
                let cost = priceMap[plan] || 0;
                if(currentAddType === 'university') cost *= 0.8;
                costDisplay.textContent = `${cost} ETB`;
            }

            uniBtn.addEventListener('click', () => updateModalUI('university'));
            extBtn.addEventListener('click', () => updateModalUI('external'));
            document.getElementById('modalMembershipType').addEventListener('change', updateCost);
            document.getElementById('addNewMemberModal').addEventListener('show.bs.modal', () => updateModalUI('university'));

            addForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const phoneInput = document.getElementById('modalPhoneNumber');
                if (!/^(\+251(9|7)\d{8}|0(9|7)\d{8})$/.test(phoneInput.value.trim())) { phoneInput.classList.add('is-invalid'); return; }
                if(currentAddType === 'external' && document.getElementById('modalNationalID').value.length !== 16) { alert("National ID must be 16 digits."); return; }

                const plan = document.getElementById('modalMembershipType').value;
                const date = new Date();
                if (plan === 'Monthly') date.setMonth(date.getMonth() + 1);
                else if (plan === '1Year') date.setFullYear(date.getFullYear() + 1);
                else date.setMonth(date.getMonth() + 3);

                const newMember = {
                    role: "user",
                    fullName: document.getElementById('modalFullName').value,
                    email: document.getElementById('modalEmail').value,
                    phone: phoneInput.value,
                    password: document.getElementById('modalPassword').value,
                    gender: document.getElementById('modalGender').value,
                    profileImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==",
                    isUniversityMember: currentAddType === 'university',
                    universityId: currentAddType === 'university' ? document.getElementById('modalUniID').value : null,
                    department: currentAddType === 'university' ? document.getElementById('modalDepartment').value : null,
                    nationalId: currentAddType === 'external' ? document.getElementById('modalNationalID').value : null,
                    address: currentAddType === 'external' ? document.getElementById('modalAddress').value : null,
                    membershipId: gymIdDisplay.textContent,
                    membershipType: plan,
                    membershipStatus: "active", // Admins create ACTIVE users directly
                    joinDate: new Date().toISOString().split('T')[0],
                    expiryDate: date.toISOString().split('T')[0],
                    paymentStatus: "Paid"
                };

                try {
                    await fetch(API_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newMember) });
                    bootstrap.Modal.getInstance(document.getElementById('addNewMemberModal')).hide();
                    addForm.reset();
                    fetchMembers();
                } catch(err) { alert("Failed."); }
            });

            // Charts & Utils
            function renderCharts() {
                const monthLabels = []; const joinedData = [0,0,0,0,0,0]; const expiredData = [0,0,0,0,0,0];
                for(let i=5; i>=0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); monthLabels.push(d.toLocaleString('default', { month: 'short' })); }
                membersData.forEach(m => {
                    const joinD = new Date(m.joinDate); const diff = (new Date().getMonth() - joinD.getMonth() + 12) % 12;
                    if(diff < 6) joinedData[5 - diff]++;
                    if(m.computedStatus === 'expired') expiredData[5]++;
                });
                new Chart(document.getElementById('membershipChart'), { type: 'line', data: { labels: monthLabels, datasets: [{ label: 'Joined', data: joinedData, borderColor: '#51CCF9', tension: 0.4 }, { label: 'Expired', data: expiredData, borderColor: '#dc3545', tension: 0.4 }] } });
                const uni = membersData.filter(m => m.isUniversityMember).length;
                new Chart(document.getElementById('distributionChart'), { type: 'doughnut', data: { labels: ['Uni', 'Ext'], datasets: [{ data: [uni, membersData.length-uni], backgroundColor: ['#51CCF9', '#6c757d'] }] } });
            }

            function renderAdminAlerts() {
                const expired = membersData.filter(m => m.computedStatus === 'expired').length;
                document.getElementById('adminAlerts').innerHTML = expired > 0 ? `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i><strong>Attention:</strong> ${expired} expired members.</div>` : '';
            }

            window.deleteMember = async (id) => { if(confirm("Delete?")) { await fetch(`${API_URL}/${id}`, {method:'DELETE'}); fetchMembers(); } };
            function setupThemeToggle() {
                const toggle = document.getElementById('theme-toggle');
                const theme = localStorage.getItem('admin-theme');
                if(theme === 'dark') { document.body.classList.add('dark-mode'); toggle.querySelector('i').className='fas fa-sun'; }
                toggle.addEventListener('click', () => { document.body.classList.toggle('dark-mode'); localStorage.setItem('admin-theme', document.body.classList.contains('dark-mode')?'dark':'light'); toggle.querySelector('i').className = document.body.classList.contains('dark-mode')?'fas fa-sun':'fas fa-moon'; });
            }
            function setupLogout() { document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../login/login.html'; }); }
        });
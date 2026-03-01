
    document.addEventListener('DOMContentLoaded', async () => {
        const form = document.getElementById('registrationForm');
        const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = document.getElementById('phoneNumber');
            const validPhone = /^(\+251(9|7)\d{8}|0(9|7)\d{8})$/.test(phone.value.trim());
            
            if (!validPhone) {
                phone.classList.add('is-invalid');
                phone.focus();
                return; 
            } else {
                phone.classList.remove('is-invalid');
            }

            if(!validatePassword()) { document.getElementById('password').focus(); return; }
            if(!form.checkValidity()) { form.classList.add('was-validated'); return; }
            modal.show();
        });

        // Toggles
        const uniBtn = document.getElementById('type-uni-btn');
        const extBtn = document.getElementById('type-ext-btn');
        let currentType = 'university';
        
        const prices = {
            'Monthly': 300,
            '3Months': 800,
            '6Months': 1500,
            '1Year': 2500
        };

        function toggle(type) {
            currentType = type;
            uniBtn.classList.toggle('active', type=='university');
            extBtn.classList.toggle('active', type=='external');
            document.getElementById('uniFields').classList.toggle('d-none', type!='university');
            document.getElementById('extFields').classList.toggle('d-none', type!='external');
            
            document.getElementById('uniID').required = (type=='university');
            document.getElementById('department').required = (type=='university');
            document.getElementById('nationalID').required = (type=='external');
            document.getElementById('address').required = (type=='external');
            
            updatePrice();
            generateId();
        }
        uniBtn.addEventListener('click', () => toggle('university'));
        extBtn.addEventListener('click', () => toggle('external'));

        document.getElementById('membershipType').addEventListener('change', updatePrice);
        
        function updatePrice() {
            const plan = document.getElementById('membershipType').value;
            let cost = prices[plan] || 0; 
            if(currentType === 'university') cost *= 0.8;
            document.getElementById('priceDisplay').textContent = `${cost} ETB`;
            document.getElementById('modalPayAmount').textContent = `${cost} ETB`;
        }

        const restrictText = (e) => e.target.value = e.target.value.replace(/[0-9]/g, '');
        document.getElementById('fullName').addEventListener('input', restrictText);
        document.getElementById('department').addEventListener('input', restrictText);

        document.getElementById('phoneNumber').addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9+]/g, '');
            this.classList.remove('is-invalid');
            let num = this.value;
            document.getElementById('payPhoneTele').value = num;
            document.getElementById('payPhoneMpesa').value = num;
        });

        const passInput = document.getElementById('password');
        passInput.addEventListener('input', validatePassword);
        function validatePassword() {
            const val = passInput.value;
            const len = val.length >= 8;
            const cmplx = /[0-9]/.test(val) && /[!@#$%^&*]/.test(val);
            document.getElementById('req-len').className = `requirement ${len?'valid':'invalid'}`;
            document.getElementById('req-num').className = `requirement ${cmplx?'valid':'invalid'}`;
            return len && cmplx;
        }

        // --- FIXED ID GENERATION LOGIC ---
        let dbuNextId = 1;
        let extNextId = 1;

        try { 
            const res = await fetch('http://localhost:3000/users'); 
            const users = await res.json(); 
            // Separate Counts for DBU vs EXT
            const dbuCount = users.filter(u => u.membershipId && u.membershipId.startsWith('DBU')).length;
            const extCount = users.filter(u => u.membershipId && u.membershipId.startsWith('EXT')).length;
            dbuNextId = dbuCount + 1;
            extNextId = extCount + 1;
        } catch(e) {}

        function generateId() {
            const isUni = currentType === 'university';
            const prefix = isUni ? 'DBU' : 'EXT';
            const count = isUni ? dbuNextId : extNextId; // Pick correct counter
            const yr = new Date().getFullYear();
            const cnt = String(count).padStart(4,'0');
            document.getElementById('gymIdDisplay').textContent = `${prefix}-${yr}-${cnt}`;
        }
        generateId(); // Initial call

        window.finalizeRegistration = async function() {
            const convertBase64 = (file) => new Promise((res,rej) => {
                const r = new FileReader(); r.readAsDataURL(file); r.onload=()=>res(r.result); r.onerror=rej;
            });
            let img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";
            const f = document.getElementById('profileImage').files[0];
            if(f) img = await convertBase64(f);

            const newUser = {
                role: 'user',
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phoneNumber').value,
                password: document.getElementById('password').value,
                gender: document.getElementById('gender').value,
                membershipType: document.getElementById('membershipType').value,
                membershipId: document.getElementById('gymIdDisplay').textContent,
                isUniversityMember: currentType === 'university',
                universityId: document.getElementById('uniID').value,
                department: document.getElementById('department').value,
                nationalId: document.getElementById('nationalID').value,
                address: document.getElementById('address').value,
                profileImage: img,
                joinDate: new Date().toISOString().split('T')[0],
                expiryDate: new Date(new Date().setMonth(new Date().getMonth()+1)).toISOString().split('T')[0],
                
                // --- PENDING STATUS ---
                membershipStatus: 'pending',
                paymentStatus: 'Paid'
            };
            
            try {
                await fetch('http://localhost:3000/users', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(newUser)});
                window.location.href='../pending/pending.html'; // Redirect to Pending Page
            } catch(e) { alert('JSON Server Error'); }
        }

        const themeBtn = document.getElementById('theme-toggle');
        themeBtn.addEventListener('click', ()=>{
            document.body.classList.toggle('dark-mode');
            themeBtn.querySelector('i').className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';
        });
    });
/* payment.js - Final Version with Themed Errors & Safaricom Green */

document.addEventListener('DOMContentLoaded', () => {
    // --- SELECTORS ---
    const methods = document.querySelectorAll('.method-card');
    const sections = document.querySelectorAll('.payment-form-section');
    const payBtn = document.getElementById('initiatePayBtn');
    
    // Gateway Elements
    const gatewayOverlay = document.getElementById('gatewayOverlay');
    const gwLogo = document.getElementById('gwLogo');
    const gwTitle = document.getElementById('gwTitle');
    const gwMessage = document.getElementById('gwMessage');
    const gwInput = document.getElementById('gwInput');
    const gwConfirmBtn = document.getElementById('gwConfirmBtn');
    const gwCancelBtn = document.getElementById('gwCancelBtn');
    const gwErrorMsg = document.getElementById('gwErrorMsg');

    // New Custom Alert Elements
    const customAlert = document.getElementById('customAlert');
    const alertTitle = document.getElementById('alertTitle');
    const alertMsg = document.getElementById('alertMsg');
    const alertIcon = document.getElementById('alertIcon');
    const alertBtn = document.getElementById('alertBtn');
    const alertHeader = document.querySelector('.custom-alert-header');

    let selectedMethod = 'card';
    const amount = document.getElementById('modalPayAmount').textContent;

    // --- 1. METHOD SELECTION ---
    methods.forEach(card => {
        card.addEventListener('click', () => {
            methods.forEach(m => m.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            card.classList.add('active');
            selectedMethod = card.dataset.method;
            document.getElementById(`section-${selectedMethod}`).classList.add('active');
            
            updateMainButton(selectedMethod);
        });
    });

    function updateMainButton(method) {
        let color = '#333';
        let text = 'Pay Securely';
        if (method === 'telebirr') { color = '#00A3E0'; text = 'Pay with Telebirr'; }
        if (method === 'mpesa') { color = '#43B02A'; text = 'Pay with M-Pesa'; } // SAFARICOM GREEN
        if (method === 'cbe') { color = '#6A1B9A'; text = 'Pay with CBE Birr'; }
        
        payBtn.style.backgroundColor = color;
        payBtn.style.borderColor = color;
        payBtn.textContent = text;
    }

    // --- 2. VALIDATION LOGIC ---
    payBtn.addEventListener('click', () => {
        const validation = validateNetwork(selectedMethod);
        if (!validation.isValid) {
            showThemedAlert("Validation Error", validation.msg, selectedMethod, 'error');
            return;
        }
        showGateway(selectedMethod);
    });

    function validateNetwork(method) {
        const ethioRegex = /^(\+2519\d{8}|09\d{8})$/;
        const safaricomRegex = /^(\+2517\d{8}|07\d{8})$/;

        if (method === 'card') {
            const num = document.getElementById('inputCardNum').value;
            if(num.length < 16) return { isValid: false, msg: "Invalid Card Number. Please enter 16 digits." };
            return { isValid: true };
        }

        if (method === 'cbe') {
            const acc = document.getElementById('payAccountCbe').value;
            if (!/^1000\d{9}$/.test(acc)) return { isValid: false, msg: "Invalid CBE Account. Must be 13 digits starting with 1000." };
            return { isValid: true };
        }

        // Phone Checks
        let phone = '';
        if (method === 'telebirr') phone = document.getElementById('payPhoneTele').value.trim();
        if (method === 'mpesa') phone = document.getElementById('payPhoneMpesa').value.trim();

        if (method === 'telebirr') {
            if (safaricomRegex.test(phone)) return { isValid: false, msg: "This is a Safaricom number. Telebirr requires Ethio Telecom (09...)." };
            if (!ethioRegex.test(phone)) return { isValid: false, msg: "Invalid Telebirr number. Use 09... or +2519..." };
        }

        if (method === 'mpesa') {
            if (ethioRegex.test(phone)) return { isValid: false, msg: "This is an Ethio Telecom number. M-Pesa requires Safaricom (07...)." };
            if (!safaricomRegex.test(phone)) return { isValid: false, msg: "Invalid Safaricom number. Use 07... or +2517..." };
        }

        return { isValid: true };
    }

    // --- 3. THEMED ALERT POPUP ---
    function showThemedAlert(title, msg, method, type) {
        customAlert.style.display = 'flex';
        alertTitle.textContent = title;
        alertMsg.textContent = msg;

        // Reset Styles
        alertHeader.className = 'custom-alert-header';
        alertBtn.className = 'btn w-100 fw-bold text-white';

        // Apply Theme
        if (method === 'telebirr') {
            alertHeader.style.backgroundColor = '#00A3E0';
            alertBtn.style.backgroundColor = '#00A3E0';
            alertIcon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle';
        } else if (method === 'mpesa') {
            alertHeader.style.backgroundColor = '#43B02A'; // Safaricom Green
            alertBtn.style.backgroundColor = '#43B02A';
            alertIcon.className = type === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle';
        } else if (method === 'cbe') {
            alertHeader.style.backgroundColor = '#6A1B9A';
            alertBtn.style.backgroundColor = '#6A1B9A';
            alertIcon.className = 'fas fa-university';
        } else {
            alertHeader.style.backgroundColor = '#333';
            alertBtn.style.backgroundColor = '#333';
            alertIcon.className = 'fas fa-credit-card';
        }
    }

    // Close Alert
    alertBtn.addEventListener('click', () => {
        customAlert.style.display = 'none';
    });

    // --- 4. SHOW GATEWAY ---
    function showGateway(method) {
        gatewayOverlay.className = 'gateway-overlay';
        gatewayOverlay.style.display = 'flex';
        gwErrorMsg.style.display = 'none';
        gwInput.value = '';
        
        if (method === 'telebirr') {
            gatewayOverlay.classList.add('theme-telebirr');
            gwLogo.innerHTML = '<i class="fas fa-mobile-alt"></i>';
            gwTitle.textContent = "Telebirr";
            gwMessage.innerHTML = `Request: <strong>${amount}</strong><br>Enter <strong>6-digit PIN</strong>.`;
            gwInput.maxLength = 6;
        } 
        else if (method === 'mpesa') {
            gatewayOverlay.classList.add('theme-mpesa');
            gwLogo.innerHTML = '<i class="fas fa-sim-card"></i>';
            gwTitle.textContent = "M-PESA";
            gwMessage.innerHTML = `Pay <strong>${amount}</strong>?<br>Enter <strong>6-digit PIN</strong>.`;
            gwInput.maxLength = 6;
        }
        else if (method === 'cbe') {
            gatewayOverlay.classList.add('theme-cbe');
            gwLogo.innerHTML = '<i class="fas fa-university"></i>';
            gwTitle.textContent = "CBE Birr";
            gwMessage.innerHTML = `Transfer: <strong>${amount}</strong><br>Enter <strong>4-digit PIN</strong>.`;
            gwInput.maxLength = 4; 
        }
        else {
            simulateSuccess(); return;
        }
        gwInput.focus();
    }

    // --- 5. PIN CONFIRMATION ---
    gwConfirmBtn.addEventListener('click', () => {
        const pin = gwInput.value;
        const requiredLen = gwInput.maxLength;

        if (pin.length < requiredLen) {
            // Show Themed Error instead of generic text
            showThemedAlert("Authentication Failed", `Invalid Credentials. PIN must be ${requiredLen} digits.`, selectedMethod, 'error');
            return;
        }

        // Simulate Success
        gwConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        setTimeout(() => {
            simulateSuccess();
        }, 2000);
    });

    gwCancelBtn.addEventListener('click', () => {
        gatewayOverlay.style.display = 'none';
        gwConfirmBtn.innerHTML = 'Confirm Payment';
    });

    function simulateSuccess() {
        gatewayOverlay.style.display = 'none';
        document.querySelector('.modal-body-content').style.display = 'none';
        document.getElementById('mainSuccess').classList.remove('d-none');
        setTimeout(() => { if(window.finalizeRegistration) window.finalizeRegistration(); }, 1500);
    }

    // Auto-formatting Card
    const cardInput = document.getElementById('inputCardNum');
    if(cardInput) cardInput.addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim());
});
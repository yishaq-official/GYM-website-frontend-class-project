document.addEventListener('DOMContentLoaded', async () => {
            
            // --- 0. Authentication Check ---
            const sessionUser = JSON.parse(localStorage.getItem('currentUser'));
            const userRole = localStorage.getItem('userRole');

            if (!sessionUser || userRole !== 'admin') {
                window.location.href = '../../login/login.html';
                return;
            }

            const API_BASE = 'http://localhost:3000';
            const SETTINGS_URL = `${API_BASE}/settings`;
            let currentSettings = {};

            // --- 1. Load Settings ---
            try {
                const res = await fetch(SETTINGS_URL);
                if(res.ok) {
                    currentSettings = await res.json();
                    populateForm(currentSettings);
                }
            } catch (err) {
                console.error(err);
                alert("Error connecting to server.");
            }

            function populateForm(data) {
                // Mapping fields
                document.getElementById('systemName').value = data.systemName || '';
                document.getElementById('language').value = data.language || 'en';
                document.getElementById('timezone').value = data.timezone || 'UTC+3';
                document.getElementById('maintenanceMode').checked = data.maintenanceMode || false;
                document.getElementById('twoFA').checked = data.twoFA || false;
                
                if (data.passwordPolicy) {
                    document.getElementById('minPassLength').value = data.passwordPolicy.minLength || 8;
                    document.getElementById('passExpiry').value = data.passwordPolicy.expiryDays || 90;
                    document.getElementById('specialChars').checked = data.passwordPolicy.specialChars || false;
                }
                
                document.getElementById('sessionTimeout').value = data.sessionTimeout || 30;
                document.getElementById('maxLoginAttempts').value = data.maxLoginAttempts || 3;
                document.getElementById('emailNotif').checked = data.emailNotifications || false;
                document.getElementById('smsNotif').checked = data.smsNotifications || false;
                document.getElementById('senderEmail').value = data.senderEmail || '';
                document.getElementById('apiKey').value = data.apiKey || '';
                document.getElementById('autoBackup').checked = data.autoBackup || false;
                document.getElementById('backupFreq').value = data.backupFrequency || 'daily';
                
                if(data.theme === 'dark') document.getElementById('themeDark').checked = true;
                else document.getElementById('themeLight').checked = true;
                
                document.getElementById('accentColor').value = data.accentColor || '#51CCF9';
                document.getElementById('layoutStyle').value = data.layoutStyle || 'comfortable';
            }

            // --- 2. Save Settings ---
            const saveBtn = document.getElementById('saveBtn');
            const spinner = document.getElementById('saveSpinner');
            const icon = document.getElementById('saveIcon');
            const toastEl = document.getElementById('liveToast');
            const toast = new bootstrap.Toast(toastEl);

            saveBtn.addEventListener('click', async () => {
                saveBtn.disabled = true;
                spinner.classList.remove('d-none');
                icon.classList.add('d-none');

                const updatedSettings = {
                    ...currentSettings,
                    systemName: document.getElementById('systemName').value,
                    language: document.getElementById('language').value,
                    timezone: document.getElementById('timezone').value,
                    maintenanceMode: document.getElementById('maintenanceMode').checked,
                    twoFA: document.getElementById('twoFA').checked,
                    passwordPolicy: {
                        minLength: parseInt(document.getElementById('minPassLength').value),
                        expiryDays: parseInt(document.getElementById('passExpiry').value),
                        specialChars: document.getElementById('specialChars').checked
                    },
                    sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
                    maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
                    emailNotifications: document.getElementById('emailNotif').checked,
                    smsNotifications: document.getElementById('smsNotif').checked,
                    senderEmail: document.getElementById('senderEmail').value,
                    apiKey: document.getElementById('apiKey').value,
                    autoBackup: document.getElementById('autoBackup').checked,
                    backupFrequency: document.getElementById('backupFreq').value,
                    theme: document.querySelector('input[name="theme"]:checked').value,
                    accentColor: document.getElementById('accentColor').value,
                    layoutStyle: document.getElementById('layoutStyle').value
                };

                try {
                    const res = await fetch(SETTINGS_URL, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedSettings)
                    });

                    if (res.ok) {
                        toast.show();
                        if (updatedSettings.theme === 'dark') {
                            document.body.style.backgroundColor = '#121212';
                            document.body.style.color = '#fff';
                        } else {
                            document.body.style.backgroundColor = '#f4f7f9';
                            document.body.style.color = '#212529';
                        }
                    } else {
                        alert("Failed to save settings.");
                    }
                } catch (err) {
                    alert("Error saving settings.");
                } finally {
                    saveBtn.disabled = false;
                    spinner.classList.add('d-none');
                    icon.classList.remove('d-none');
                }
            });

            // --- 3. DOWNLOAD BACKUP FUNCTIONALITY ---
            document.getElementById('btnDownloadBackup').addEventListener('click', async () => {
                try {
                    // Fetch all collections in parallel to simulate a full DB dump
                    const [users, admins, settings, logs, passwordResets] = await Promise.all([
                        fetch(`${API_BASE}/users`).then(r => r.json()),
                        fetch(`${API_BASE}/admins`).then(r => r.json()),
                        fetch(`${API_BASE}/settings`).then(r => r.json()),
                        fetch(`${API_BASE}/logs`).then(r => r.json()),
                        fetch(`${API_BASE}/passwordResets`).then(r => r.json())
                    ]);

                    // Reconstruct the DB object
                    const dbBackup = { users, admins, settings, logs, passwordResets };

                    // Create file blob
                    const dataStr = JSON.stringify(dbBackup, null, 2);
                    const blob = new Blob([dataStr], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    
                    // Create temporary link and click it
                    const link = document.createElement('a');
                    link.href = url;
                    const date = new Date().toISOString().split('T')[0];
                    link.download = `dbu_gym_backup_${date}.json`;
                    document.body.appendChild(link);
                    link.click();
                    
                    // Cleanup
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                } catch (e) {
                    console.error("Backup failed", e);
                    alert("Failed to download backup. Ensure server is running.");
                }
            });

        });
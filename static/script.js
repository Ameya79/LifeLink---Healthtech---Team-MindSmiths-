const onReady = (fn) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
};

// ==============================================
// THEME TOGGLE & PERSISTENCE
// ==============================================
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeToggle) return;
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ==============================================
// SETTINGS & PREFERENCE PERSISTENCE
// ==============================================
function setupPreferencePersistence() {
    const elements = document.querySelectorAll('[data-preference-key]');
    if (!elements.length) return;

    elements.forEach((el) => {
        const storageKey = `lifelink_pref_${el.dataset.preferenceKey}`;
        const saved = localStorage.getItem(storageKey);
        const isCheckbox = el.type === 'checkbox';
        const isSelect = el.tagName === 'SELECT';

        if (saved !== null) {
            if (isCheckbox) {
                el.checked = saved === 'true';
            } else {
                el.value = saved;
            }
        }

        const eventName = isCheckbox || isSelect ? 'change' : 'input';
        el.addEventListener(eventName, () => {
            if (isCheckbox) {
                localStorage.setItem(storageKey, el.checked ? 'true' : 'false');
            } else {
                localStorage.setItem(storageKey, el.value);
            }
        });
    });
}

// ==============================================
// FLASH MESSAGES
// ==============================================
function setupAlerts() {
    document.querySelectorAll('.alert').forEach(alert => {
        const hideAlert = () => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-12px)';
            setTimeout(() => alert.remove(), 300);
        };

        setTimeout(hideAlert, 5000);
        const closeBtn = alert.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideAlert);
        }
    });
}

// ==============================================
// TABLE FILTERING HELPERS
// ==============================================
const tableFilterState = {};

function applyTableFilters(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const filters = tableFilterState[tableId] || {};
    const searchTerm = (filters.search || '').toLowerCase();

    rows.forEach(row => {
        let visible = true;

        Object.entries(filters).forEach(([key, value]) => {
            if (!visible || !value || value === 'all' || key === 'search') return;
            const dataValue = (row.dataset[key] || '').toLowerCase();
            if (!dataValue.includes(value.toLowerCase())) {
                visible = false;
            }
        });

        if (visible && searchTerm) {
            visible = row.textContent.toLowerCase().includes(searchTerm);
        }

        row.style.display = visible ? '' : 'none';
    });
}

function setupTableFilters() {
    const registerFilter = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        const tableId = el.dataset.table;
        tableFilterState[tableId] = tableFilterState[tableId] || {};
        el.addEventListener('change', () => {
            tableFilterState[tableId][key] = el.value;
            applyTableFilters(tableId);
        });
    };

    registerFilter('blood-filter', 'blood');
    registerFilter('organ-filter', 'organ');
    registerFilter('location-filter', 'location');

    const searchInput = document.getElementById('table-search');
    if (searchInput) {
        const tableId = searchInput.dataset.table;
        tableFilterState[tableId] = tableFilterState[tableId] || {};
        searchInput.addEventListener('input', () => {
            tableFilterState[tableId].search = searchInput.value.trim();
            applyTableFilters(tableId);
        });
    }
}

// ==============================================
// ORGAN-SPECIFIC FIELD TOGGLES
// ==============================================
function setupOrganFields() {
    const ids = ['organ_type', 'organ_needed'];
    ids.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const handleChange = () => {
            document.querySelectorAll('.organ-specific').forEach(section => {
                section.style.display = 'none';
            });
            const organ = select.value;
            if (!organ) return;
            const section = document.getElementById(`${organ.toLowerCase()}-fields`);
            if (section) {
                section.style.display = 'block';
            }
        };
        select.addEventListener('change', handleChange);
        if (select.value) handleChange();
    });
}

// ==============================================
// URGENCY SLIDER
// ==============================================
function setupUrgencySlider() {
    const slider = document.getElementById('urgency_score');
    if (!slider) return;
    const valueEl = document.getElementById('urgency-value');
    const labelEl = document.getElementById('urgency-label');

    const updateUrgency = () => {
        const value = parseInt(slider.value, 10);
        if (valueEl) valueEl.textContent = value;
        if (labelEl) {
            if (value >= 90) {
                labelEl.textContent = '🔴 Critical';
                labelEl.style.color = 'var(--danger)';
            } else if (value >= 70) {
                labelEl.textContent = '⚠️ High';
                labelEl.style.color = 'var(--warning)';
            } else if (value >= 50) {
                labelEl.textContent = '✓ Moderate';
                labelEl.style.color = 'var(--primary)';
            } else {
                labelEl.textContent = '✓ Low';
                labelEl.style.color = 'var(--success)';
            }
        }
    };

    slider.addEventListener('input', updateUrgency);
    updateUrgency();
}

// ==============================================
// LICENSE LOOKUP
// ==============================================
function setupLicenseLookup() {
    const licenseInput = document.getElementById('license_number');
    const hospitalInput = document.getElementById('hospital_name');
    if (!licenseInput || !hospitalInput) return;

    const approvedHospitals = JSON.parse(
        document.getElementById('approved-hospitals-data')?.textContent || '{}'
    );

    licenseInput.addEventListener('blur', () => {
        const license = licenseInput.value.trim().toUpperCase();
        if (approvedHospitals[license]) {
            hospitalInput.value = approvedHospitals[license];
            hospitalInput.readOnly = true;
            hospitalInput.dataset.autofilled = 'true';
        } else {
            hospitalInput.readOnly = false;
            if (hospitalInput.dataset.autofilled === 'true') {
                hospitalInput.value = '';
            }
            hospitalInput.dataset.autofilled = 'false';
        }
    });
}

// ==============================================
// TABLE ROW NAVIGATION
// ==============================================
function setupRowNavigation() {
    document.querySelectorAll('table tbody tr[data-id]').forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', (event) => {
            // Don't navigate if clicking a button, link, input, label, or form
            if (event.target.closest('a, button, input, label, form')) {
                return;
            }
            const id = row.dataset.id;
            const type = row.dataset.type;
            if (id && type) {
                window.location.href = `/${type}/${id}`;
            }
        });
        
        // Add hover effect
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = 'var(--gray-50)';
        });
        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
        });
    });
}

// ==============================================
// FORM VALIDATION
// ==============================================
function setupFormValidation() {
    document.querySelectorAll('form[data-validate]').forEach(form => {
        form.addEventListener('submit', event => {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = 'var(--danger)';
                    setTimeout(() => (field.style.borderColor = ''), 2000);
                }
            });
            if (!isValid) {
                event.preventDefault();
                alert('Please fill all required fields');
            }
        });
    });
}

// ==============================================
// BMI CALCULATOR
// ==============================================
function setupBmiCalculator() {
    const weightInput = document.getElementById('weight_kg');
    const heightInput = document.getElementById('height_cm');
    const bmiDisplay = document.getElementById('bmi-display');
    if (!weightInput || !heightInput || !bmiDisplay) return;

    const updateBMI = () => {
        const weight = parseFloat(weightInput.value);
        const height = parseFloat(heightInput.value);
        if (weight > 0 && height > 0) {
            const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
            bmiDisplay.value = `BMI: ${bmi}`;
            if (bmi < 18.5) {
                bmiDisplay.style.color = 'var(--warning)';
            } else if (bmi <= 24.9) {
                bmiDisplay.style.color = 'var(--success)';
            } else if (bmi <= 29.9) {
                bmiDisplay.style.color = 'var(--warning)';
            } else {
                bmiDisplay.style.color = 'var(--danger)';
            }
        } else {
            bmiDisplay.value = 'BMI: --';
            bmiDisplay.style.color = '';
        }
    };

    weightInput.addEventListener('input', updateBMI);
    heightInput.addEventListener('input', updateBMI);
}

// ==============================================
// SMOOTH SCROLL + CTA BUTTONS
// ==============================================
function setupSmoothScroll() {
    const scrollToTarget = selector => {
        const target = document.querySelector(selector);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', event => {
            const href = anchor.getAttribute('href');
            if (href.length > 1) {
                event.preventDefault();
                scrollToTarget(href);
            }
        });
    });

    document.querySelectorAll('[data-scroll-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            scrollToTarget(btn.getAttribute('data-scroll-target'));
        });
    });
}

// ==============================================
// INTERSECTION OBSERVER FOR LANDING
// ==============================================
function setupRevealAnimations() {
    const revealItems = document.querySelectorAll('[data-reveal]');
    if (!revealItems.length) return;

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    revealItems.forEach(item => observer.observe(item));
}

// ==============================================
// MAIN INITIALIZER
// ==============================================
function initLifeLinkApp() {
    setupThemeToggle();
    setupPreferencePersistence();
    setupAlerts();
    setupTableFilters();
    setupOrganFields();
    setupUrgencySlider();
    setupLicenseLookup();
    setupRowNavigation();
    setupFormValidation();
    setupBmiCalculator();
    setupSmoothScroll();
    setupRevealAnimations();
}

onReady(initLifeLinkApp);

// ==============================================
// COPY TO CLIPBOARD (GLOBAL)
// ==============================================
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.createElement('div');
        toast.textContent = `Copied: ${text}`;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = 'var(--success)';
        toast.style.color = '#fff';
        toast.style.padding = '1rem 2rem';
        toast.style.borderRadius = '0.5rem';
        toast.style.zIndex = '10000';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    });
}

// ==============================================
// REM CHATBOT
// ==============================================
function toggleRemChat() {
    const chatWindow = document.getElementById('rem-chat-window');
    if (chatWindow) {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
        if (chatWindow.style.display === 'flex') {
            const input = document.getElementById('rem-input');
            if (input) input.focus();
        }
    }
}

function sendRemMessage() {
    const input = document.getElementById('rem-input');
    const messages = document.getElementById('rem-messages');
    
    if (!input || !messages || !input.value.trim()) return;
    
    const userMessage = input.value.trim();
    input.value = '';
    
    // Add user message
    addRemMessage(userMessage, 'user');
    
    // Show typing indicator
    const typingId = addRemMessage('Thinking...', 'bot');
    
    // Send to backend
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage })
    })
    .then(response => response.json())
    .then(data => {
        // Remove typing indicator
        const typingMsg = document.getElementById(typingId);
        if (typingMsg) typingMsg.remove();
        
        // Add bot response
        addRemMessage(data.response || 'I apologize, but I encountered an error. Please try again.', 'bot');
    })
    .catch(error => {
        const typingMsg = document.getElementById(typingId);
        if (typingMsg) typingMsg.remove();
        addRemMessage('Sorry, I\'m having trouble connecting. Please check your API keys in Settings.', 'bot');
    });
}

function addRemMessage(text, type) {
    const messages = document.getElementById('rem-messages');
    if (!messages) return;
    
    const messageId = 'rem-msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `rem-message ${type}`;
    messageDiv.textContent = text;
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
    
    return messageId;
}

// Initialize REM with welcome message
onReady(() => {
    const messages = document.getElementById('rem-messages');
    if (messages && messages.children.length === 0) {
        addRemMessage('Hello! I\'m REM (Resource & Emergency Matching assistant). I can help you query the database, find matches, and answer questions about patients and donors. How can I assist you today?', 'bot');
    }
    
    // Setup notifications
    setupNotifications();
});

// ==============================================
// NOTIFICATIONS
// ==============================================
function setupNotifications() {
    const btn = document.getElementById('notifications-btn');
    const dropdown = document.getElementById('notifications-dropdown');
    const countEl = document.getElementById('notification-count');
    
    if (!btn || !dropdown) return;
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        if (dropdown.style.display === 'block') {
            loadNotifications();
        }
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Mark all read
    const markAllRead = document.getElementById('mark-all-read');
    if (markAllRead) {
        markAllRead.addEventListener('click', () => {
            persistSeenNotifications(window.latestNotificationIds || []);
            const list = document.getElementById('notifications-list');
            if (list) {
                list.innerHTML = '<div style="padding: 32px; text-align: center; color: var(--text-muted);">No new notifications</div>';
            }
            if (countEl) {
                countEl.style.display = 'none';
            }
        });
    }
    
    // Load notifications only once per page load
    if (!window.notificationsLoaded) {
        loadNotifications();
        window.notificationsLoaded = true;
    }
}

function getSeenNotifications() {
    try {
        return new Set(JSON.parse(localStorage.getItem('lifelinkSeenNotifications') || '[]'));
    } catch {
        return new Set();
    }
}

function persistSeenNotifications(ids) {
    if (!ids || !ids.length) return;
    const seen = getSeenNotifications();
    ids.forEach(id => seen.add(id));
    localStorage.setItem('lifelinkSeenNotifications', JSON.stringify(Array.from(seen)));
}

async function loadNotifications() {
    const list = document.getElementById('notifications-list');
    const countEl = document.getElementById('notification-count');
    
    if (!list) return;
    
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        const notifications = data.notifications || [];
        window.latestNotificationIds = notifications.map(n => n.id);

        const seen = getSeenNotifications();
        const freshNotifications = notifications.filter(n => !seen.has(n.id));
        
        if (freshNotifications.length > 0) {
            list.innerHTML = freshNotifications.map(n => `
                <div style="padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s;" 
                     onmouseover="this.style.background='var(--bg-secondary)'" 
                     onmouseout="this.style.background=''" 
                     onclick="handleNotificationClick('${n.id}', '${n.link}')">
                    <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px; color: var(--text-primary);">${n.title}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${n.time}</div>
                </div>
            `).join('');
            
            if (countEl) {
                countEl.textContent = freshNotifications.length;
                countEl.style.display = 'block';
            }
        } else {
            list.innerHTML = '<div style="padding: 32px; text-align: center; color: var(--text-muted);">You\'re all caught up</div>';
            if (countEl) {
                countEl.style.display = 'none';
            }
        }
    } catch (error) {
        list.innerHTML = '<div style="padding: 32px; text-align: center; color: var(--text-muted);">Error loading notifications</div>';
    }
}

function handleNotificationClick(id, link) {
    persistSeenNotifications([id]);
    window.location.href = link;
}
document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const searchForm = document.getElementById('search-form');
    const searchBtn = document.getElementById('search-btn');
    const resultsContainer = document.getElementById('results-container');
    const resultsCount = document.getElementById('results-count');
    const userNameEl = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');

    // Check Auth Status
    fetch('/api/auth/status')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                showDashboard(data.profile);
            }
        });

    function showToast(message, isError = false) {
        toastMsg.textContent = message;
        toast.className = `toast ${isError ? 'error' : ''}`;
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    function toggleLoader(btn, show) {
        const span = btn.querySelector('span');
        const loader = btn.querySelector('.loader');
        if (show) {
            span.classList.add('hidden');
            loader.classList.remove('hidden');
            btn.disabled = true;
        } else {
            span.classList.remove('hidden');
            loader.classList.add('hidden');
            btn.disabled = false;
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        loginError.textContent = '';
        toggleLoader(loginBtn, true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (data.success) {
                showDashboard(data.profile);
                showToast('Welcome back!');
            } else {
                loginError.textContent = data.message || 'Login failed';
            }
        } catch (err) {
            loginError.textContent = 'Network error. Please try again.';
        } finally {
            toggleLoader(loginBtn, false);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        dashboardView.classList.remove('active');
        loginView.classList.add('active');
        resultsContainer.innerHTML = '<div class="empty-state"><p>Select criteria and search to find available classes.</p></div>';
        resultsCount.textContent = '0';
    });

    function showDashboard(profile) {
        loginView.classList.remove('active');
        dashboardView.classList.add('active');
        userNameEl.textContent = profile.name || profile.first_name || 'Student';
    }

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('search-date').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;

        toggleLoader(searchBtn, true);
        resultsContainer.innerHTML = '<div class="empty-state"><p>Searching for classes...</p></div>';

        try {
            const res = await fetch('/api/classes/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, startTime: parseInt(startTime), endTime: parseInt(endTime) })
            });
            const data = await res.json();
            
            if (data && data.data && data.data.length > 0) {
                renderClasses(data.data.filter(c => c.headquarter_id === 2)); // Only Unicentro default
            } else {
                resultsContainer.innerHTML = '<div class="empty-state"><p>No classes found for this criteria.</p></div>';
                resultsCount.textContent = '0';
            }
        } catch (err) {
            resultsContainer.innerHTML = '<div class="empty-state"><p style="color: var(--error-color)">Error fetching classes.</p></div>';
            showToast('Failed to load classes', true);
        } finally {
            toggleLoader(searchBtn, false);
        }
    });

    function renderClasses(classes) {
        resultsCount.textContent = classes.length;
        if (classes.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state"><p>No Unicentro classes found for this criteria.</p></div>';
            return;
        }

        resultsContainer.innerHTML = '';
        classes.forEach(c => {
            const card = document.createElement('div');
            card.className = 'class-card';
            
            // Format time
            const startH = Math.floor(c.start_hour / 60);
            const startM = c.start_hour % 60;
            const timeStr = `${startH > 12 ? startH - 12 : startH}:${startM === 0 ? '00' : startM} ${startH >= 12 ? 'PM' : 'AM'}`;

            card.innerHTML = `
                <div class="class-info">
                    <h4>Class Level: ${c.course_level_group_name || 'A2'}</h4>
                    <div class="class-meta">
                        <span>🕒 ${timeStr} (${c.duration} mins)</span>
                        <span>📍 Room: ${c.classroom_name || 'TBD'}</span>
                        <span>👥 ${c.reserved}/${c.max_student} Students</span>
                    </div>
                </div>
                <button class="btn-primary" style="width: auto; padding: 10px 20px" data-class='${JSON.stringify(c)}'>
                    <span>Book Now</span>
                    <div class="loader hidden"></div>
                </button>
            `;

            const btn = card.querySelector('button');
            btn.addEventListener('click', () => bookClass(btn, c));
            resultsContainer.appendChild(card);
        });
    }

    async function bookClass(btn, scheduleItem) {
        toggleLoader(btn, true);
        try {
            const res = await fetch('/api/classes/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduleItem })
            });
            
            if (res.ok) {
                showToast('Class booked successfully! 🎉');
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
                btn.querySelector('span').textContent = 'Booked';
                btn.disabled = true;
            } else {
                const err = await res.json();
                showToast(err.error || 'Failed to book', true);
            }
        } catch (e) {
            showToast('Network error during booking', true);
        } finally {
            if (!btn.disabled) toggleLoader(btn, false);
        }
    }
});

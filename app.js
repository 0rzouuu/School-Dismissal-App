// app.js - VISUALLY IMPROVED VERSION WITH BETTER STUDENT DISPLAY
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getDatabase, ref, push, set, onValue, remove, get, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { getMessaging, getToken, onMessage, isSupported } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js';

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCAai2enHwfyrxcBpu556rtKSw9sjtyAno",
    authDomain: "tunis-school-dismissal.firebaseapp.com",
    projectId: "tunis-school-dismissal",
    storageBucket: "tunis-school-dismissal.firebasestorage.app",
    messagingSenderId: "490622758126",
    appId: "1:490622758126:web:54221213cd1c2c5e2657ff",
    measurementId: "G-0H39R6ESX0",
    databaseURL: "https://tunis-school-dismissal-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let messaging = null;

// ==================== OPTIMIZATIONS ====================

const STUDENT_CACHE_KEY = 'maarif_students_cache';
const CACHE_EXPIRY = 5 * 60 * 1000;

const clickCooldown = new Map();
const COOLDOWN_TIME = 3000;

// YEAR-BASED FILTERING
let currentYearFilter = 'all';
let allPendingPickups = [];

// Student Data
let students = [];
let isLoadingStudents = false;
let studentLoadPromise = null;

// Track which students have disabled buttons (already marked)
let disabledStudentButtons = new Set();

// Check if messaging is supported
(async() => {
    if (await isSupported()) {
        messaging = getMessaging(app);
        setupNotifications();
    } else {
        console.log('Firebase Messaging not supported');
        const notifBtn = document.getElementById('request-notif');
        if (notifBtn) notifBtn.style.display = 'none';
    }
})();

// ==================== DAILY RESET SYSTEM ====================

async function checkAndResetForNewDay() {
    try {
        const lastResetRef = ref(db, 'system/lastReset');
        const snapshot = await get(lastResetRef);

        const today = new Date().toDateString();

        if (!snapshot.exists()) {
            await set(lastResetRef, { date: today, timestamp: Date.now() });
            console.log('System initialized with date:', today);
            return;
        }

        const lastResetDate = snapshot.val().date;

        if (lastResetDate !== today) {
            console.log('New day detected! Resetting system...');
            await resetSystemForNewDay();
            await set(lastResetRef, { date: today, timestamp: Date.now() });
            disabledStudentButtons.clear();
            showToast('🔄 System reset for new day - All pickups cleared', 'success');
        }
    } catch (error) {
        console.error('Error checking daily reset:', error);
    }
}

async function resetSystemForNewDay() {
    try {
        const pendingRef = ref(db, 'pendingPickups');
        const pendingSnapshot = await get(pendingRef);

        if (pendingSnapshot.exists()) {
            const pendingData = pendingSnapshot.val();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const archiveDate = yesterday.toDateString().replace(/\s/g, '_');
            const archiveRef = ref(db, `archive/${archiveDate}`);
            await set(archiveRef, {
                pendingPickups: pendingData,
                archivedAt: Date.now(),
                archivedDate: yesterday.toDateString()
            });
        }

        const releasedRef = ref(db, 'releasedPickups');
        const releasedSnapshot = await get(releasedRef);

        if (releasedSnapshot.exists()) {
            const releasedData = releasedSnapshot.val();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const archiveDate = yesterday.toDateString().replace(/\s/g, '_');
            const archiveReleasedRef = ref(db, `archive/${archiveDate}/releasedPickups`);
            await set(archiveReleasedRef, releasedData);
        }

        await remove(ref(db, 'pendingPickups'));
        await remove(ref(db, 'releasedPickups'));

        updatePendingCount();
        updateReleasedCount();

    } catch (error) {
        console.error('Error resetting system:', error);
        showToast('Error resetting system', 'error');
    }
}

// ==================== OPTIMIZED STUDENT LOADING ====================

async function loadStudentsFromCSV() {
    if (studentLoadPromise) return studentLoadPromise;

    const cached = getCachedStudents();
    if (cached) {
        console.log('Using cached students');
        students = cached;
        updateStudentCount();
        renderStudentList();
        updateYearFilterButtons();
        return Promise.resolve(students);
    }

    isLoadingStudents = true;
    updateLoadingUI(true);

    studentLoadPromise = loadStudentsFromCSVInternal()
        .then(result => {
            students = result;
            cacheStudents(students);
            updateStudentCount();
            renderStudentList();
            updateYearFilterButtons();
            isLoadingStudents = false;
            updateLoadingUI(false);
            return students;
        })
        .catch(error => {
            console.error('Failed to load students:', error);
            loadFallbackStudents();
            isLoadingStudents = false;
            updateLoadingUI(false);
            throw error;
        });

    return studentLoadPromise;
}

async function loadStudentsFromCSVInternal() {
    console.log('Loading students from CSV...');

    try {
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(`./students.csv${cacheBuster}`);

        if (!response.ok) throw new Error('CSV file not found');

        const text = await response.text();
        const lines = text.trim().split('\n');
        const loadedStudents = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length >= 2) {
                const name = parts[0].trim();
                const className = parts[1].trim();

                if (name) {
                    const year = extractYearFromClassName(className);
                    loadedStudents.push({
                        name: name,
                        class: className,
                        year: year,
                        id: `${name.toLowerCase().replace(/\s+/g, '_')}_${className}_${year}`
                    });
                }
            }

            if (i % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        console.log(`Loaded ${loadedStudents.length} students`);
        return loadedStudents;

    } catch (err) {
        console.error('Error loading CSV:', err);
        throw err;
    }
}

function extractYearFromClassName(className) {
    className = className.trim();

    if (className.toUpperCase().includes('KG')) {
        return className.toUpperCase();
    }

    const yearMatch = className.match(/Year\s*(\d+)/i);
    if (yearMatch) {
        return `Year ${yearMatch[1]}`;
    }

    return 'Other';
}

function getYearDisplayName(year) {
    if (year.includes('KG')) {
        return year.toUpperCase();
    }
    if (year.includes('Year')) {
        return year;
    }
    return year;
}

function loadFallbackStudents() {
    console.log('Loading fallback students');
    students = [
        { name: "AILA ALLA", class: "KG1", year: "KG1", id: "aila_alla_kg1" },
        { name: "AMIN OSMAN", class: "kg2", year: "KG2", id: "amin_osman_kg2" },
        { name: "AYLA ERDOĞAN", class: "Year 1", year: "Year 1", id: "ayla_erdogan_year1" },
        { name: "AWES AYARI", class: "Year 2", year: "Year 2", id: "awes_ayari_year2" },
        { name: "ADAM KHALIFA ElSHAWESH", class: "Year 3", year: "Year 3", id: "adam_khalifa_elshawesh_year3" },
        { name: "BAYA MEFTEH", class: "Year 4", year: "Year 4", id: "baya_mefteh_year4" },
        { name: "AHMED KARIM OTHMAN", class: "Year 5", year: "Year 5", id: "ahmed_karim_othman_year5" },
        { name: "ABDELRAHMEN DRIDI", class: "Year 6", year: "Year 6", id: "abdelrahmen_dridi_year6" },
        { name: "ADAM KENZ", class: "Year 7", year: "Year 7", id: "adam_kenz_year7" },
        { name: "AHMET EMRE DUZCU", class: "Year 8", year: "Year 8", id: "ahmet_emre_duzcu_year8" },
        { name: "ABDULLAH ADEM TURAN", class: "Year 9", year: "Year 9", id: "abdullah_adem_turan_year9" }
    ];

    updateStudentCount();
    renderStudentList();
    updateYearFilterButtons();
    showToast('Using cached/sample data', 'warning');
}

function cacheStudents(studentList) {
    try {
        const cacheData = {
            students: studentList,
            timestamp: Date.now()
        };
        localStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
        console.warn('Failed to cache students:', e);
    }
}

function getCachedStudents() {
    try {
        const cached = localStorage.getItem(STUDENT_CACHE_KEY);
        if (!cached) return null;

        const cacheData = JSON.parse(cached);
        const isExpired = Date.now() - cacheData.timestamp > CACHE_EXPIRY;

        if (isExpired) {
            localStorage.removeItem(STUDENT_CACHE_KEY);
            return null;
        }

        return cacheData.students;
    } catch (e) {
        console.warn('Failed to read cache:', e);
        return null;
    }
}

function updateLoadingUI(isLoading) {
    const studentListElement = document.getElementById('student-list');
    if (!studentListElement) return;

    if (isLoading) {
        studentListElement.innerHTML = `
            <li class="empty-state">
                <div class="loading" style="width: 40px; height: 40px; margin-bottom: 20px;"></div>
                <h3>Loading Students...</h3>
                <p>Please wait while we load the student database</p>
            </li>
        `;
    }
}

// ==================== TEACHER PANEL YEAR FILTERS ====================

function updateYearFilterButtons() {
    const filterContainer = document.getElementById('teacher-filters');
    if (!filterContainer) return;

    const uniqueYears = [...new Set(students.map(student => student.year))].sort((a, b) => {
        const aIsYear = a.includes('Year');
        const bIsYear = b.includes('Year');
        const aIsKG = a.includes('KG');
        const bIsKG = b.includes('KG');

        if (aIsKG && bIsKG) return a.localeCompare(b);
        if (aIsKG) return -1;
        if (bIsKG) return 1;
        if (aIsYear && bIsYear) {
            const aNum = parseInt(a.replace(/\D/g, ''));
            const bNum = parseInt(b.replace(/\D/g, ''));
            return aNum - bNum;
        }
        return 0;
    });

    const yearCounts = {};
    allPendingPickups.forEach(([_, pickup]) => {
        const year = pickup.year || extractYearFromClassName(pickup.class);
        yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    filterContainer.innerHTML = `
        <button class="filter-btn ${currentYearFilter === 'all' ? 'active' : ''}" data-year="all">
            All Students (${allPendingPickups.length})
        </button>
        ${uniqueYears.map(year => `
            <button class="filter-btn ${currentYearFilter === year ? 'active' : ''}" data-year="${year}">
                ${getYearDisplayName(year)} (${yearCounts[year] || 0})
            </button>
        `).join('')}
    `;

    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentYearFilter = btn.dataset.year;
            filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFilteredPendingList();
        });
    });
}

function setupPendingPickupsListener() {
    const pendingRef = ref(db, 'pendingPickups');

    onValue(pendingRef, (snapshot) => {
        const pendingListElement = document.getElementById('pending-list');
        if (!pendingListElement) return;

        const data = snapshot.val();
        allPendingPickups = data ? Object.entries(data) : [];

        const pendingStudentNames = new Set();
        allPendingPickups.forEach(([_, pickup]) => {
            pendingStudentNames.add(pickup.name);
        });
        
        disabledStudentButtons.forEach(studentName => {
            if (!pendingStudentNames.has(studentName)) {
                disabledStudentButtons.delete(studentName);
            }
        });

        updatePendingCount();
        updateYearFilterButtons();
        renderFilteredPendingList();
        renderStudentList(document.getElementById('student-search')?.value || '');

        document.getElementById('active-pickups').textContent = allPendingPickups.length;
    });
}

function renderFilteredPendingList() {
    const pendingListElement = document.getElementById('pending-list');
    if (!pendingListElement) return;

    let filteredPickups = allPendingPickups;
    
    if (currentYearFilter !== 'all') {
        filteredPickups = allPendingPickups.filter(([_, pickup]) => {
            const pickupYear = pickup.year || extractYearFromClassName(pickup.class);
            return pickupYear === currentYearFilter;
        });
    }

    if (filteredPickups.length === 0) {
        pendingListElement.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>No Pending Pickups</h3>
                <p>${currentYearFilter !== 'all' ? `No pickups for ${getYearDisplayName(currentYearFilter)}` : 'When parents arrive, they\'ll appear here'}</p>
            </li>
        `;
        return;
    }

    filteredPickups.sort((a, b) => a[1].timestamp - b[1].timestamp);
    pendingListElement.innerHTML = '';

    filteredPickups.forEach(([key, pickup]) => {
        const waitTime = pickup.timestamp ?
            Math.max(1, Math.round((Date.now() - pickup.timestamp) / 60000)) : 1;

        const li = document.createElement('li');
        li.className = 'list-item pending';
        li.innerHTML = `
            <div class="student-info">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                    <div>
                        <div class="student-name">${pickup.name}</div>
                        <div style="margin-top: 5px;">
                            <span class="student-class">${pickup.class}</span>
                            <span class="wait-time">${waitTime} min waiting</span>
                        </div>
                    </div>
                </div>
                <div class="arrival-time">
                    <i class="far fa-clock"></i>
                    Arrived: ${pickup.arrivedAt || 'Just now'}
                </div>
            </div>
            <button class="btn btn-danger release-btn" data-key="${key}">
                <i class="fas fa-user-check"></i>
                Release
            </button>
        `;

        li.querySelector('.release-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showReleaseConfirmation(key, pickup);
        });

        pendingListElement.appendChild(li);
    });
}

// ==================== ADMIN PANEL - VISUALLY IMPROVED ====================

async function isStudentAlreadyPending(studentName) {
    try {
        const pendingRef = ref(db, 'pendingPickups');
        const snapshot = await get(pendingRef);

        if (!snapshot.exists()) return false;

        const pendingPickups = snapshot.val();

        for (const key in pendingPickups) {
            if (pendingPickups[key].name === studentName) {
                return {
                    isPending: true,
                    key: key,
                    data: pendingPickups[key]
                };
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking pending status:', error);
        return false;
    }
}

async function markParentArrived(student, buttonElement) {
    console.log('Marking parent for:', student.name);

    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.style.opacity = '0.5';
        buttonElement.style.cursor = 'not-allowed';
        buttonElement.innerHTML = '<i class="fas fa-clock"></i> Waiting for Release...';
    }
    
    disabledStudentButtons.add(student.name);

    const now = Date.now();
    const lastClick = clickCooldown.get(student.name);

    if (lastClick && (now - lastClick < COOLDOWN_TIME)) {
        showToast(`Please wait a few seconds before marking ${student.name} again`, 'warning');
        return;
    }

    clickCooldown.set(student.name, now);

    const existingPickup = await isStudentAlreadyPending(student.name);

    if (existingPickup) {
        const waitTime = Math.round((Date.now() - existingPickup.data.timestamp) / 60000);
        showToast(`❌ ${student.name} is already waiting (${waitTime} minutes)`, 'warning');
        return;
    }

    try {
        const pendingRef = ref(db, 'pendingPickups');
        const newPickupRef = push(pendingRef);

        const pickupData = {
            name: student.name,
            class: student.class,
            year: student.year,
            studentId: student.id,
            timestamp: Date.now(),
            arrivedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            markedBy: 'admin',
            status: 'waiting'
        };

        await set(newPickupRef, pickupData);
        console.log('Parent marked successfully:', pickupData);

        showToast(`✅ ${student.name} (${student.year}) marked for pickup!`, 'success');
        playNotificationSound();

        updatePendingCount();
        setTimeout(() => updatePendingCount(), 1000);

    } catch (error) {
        console.error('Error marking parent arrived:', error);
        showToast('Error: Could not mark parent arrived', 'error');

        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.style.opacity = '1';
            buttonElement.style.cursor = 'pointer';
            buttonElement.innerHTML = '<i class="fas fa-user-check"></i> Parent Here';
        }
        disabledStudentButtons.delete(student.name);
    }
}

// ==================== VISUALLY IMPROVED STUDENT RENDERING ====================

function renderStudentList(filter = '') {
    const studentListElement = document.getElementById('student-list');
    if (!studentListElement) return;
    
    if (isLoadingStudents) {
        updateLoadingUI(true);
        return;
    }

    studentListElement.innerHTML = '';

    let filteredStudents = students;
    if (filter) {
        const searchTerm = filter.toLowerCase();
        filteredStudents = students.filter(student =>
            student.name.toLowerCase().includes(searchTerm) ||
            student.class.toLowerCase().includes(searchTerm) ||
            student.year.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredStudents.length === 0) {
        studentListElement.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No students found</h3>
                <p>Try a different search term</p>
            </li>
        `;
        return;
    }

    // Group students by year for better organization
    const groupedStudents = {};
    filteredStudents.forEach(student => {
        const year = student.year;
        if (!groupedStudents[year]) {
            groupedStudents[year] = [];
        }
        groupedStudents[year].push(student);
    });

    // Sort years
    const sortedYears = Object.keys(groupedStudents).sort((a, b) => {
        const aIsYear = a.includes('Year');
        const bIsYear = b.includes('Year');
        const aIsKG = a.includes('KG');
        const bIsKG = b.includes('KG');

        if (aIsKG && bIsKG) return a.localeCompare(b);
        if (aIsKG) return -1;
        if (bIsKG) return 1;
        if (aIsYear && bIsYear) {
            const aNum = parseInt(a.replace(/\D/g, ''));
            const bNum = parseInt(b.replace(/\D/g, ''));
            return aNum - bNum;
        }
        return 0;
    });

    const fragment = document.createDocumentFragment();

    // Add search result summary if searching
    if (filter) {
        const summaryLi = document.createElement('li');
        summaryLi.className = 'list-item';
        summaryLi.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        summaryLi.style.color = 'white';
        summaryLi.style.border = 'none';
        summaryLi.style.marginBottom = '20px';
        summaryLi.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-search" style="font-size: 1.2rem;"></i>
                    <span style="font-weight: 600;">Found ${filteredStudents.length} student${filteredStudents.length > 1 ? 's' : ''}</span>
                </div>
                <span style="background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 0.9rem;">
                    "${filter}"
                </span>
            </div>
        `;
        fragment.appendChild(summaryLi);
    }

    // Render students grouped by year
    sortedYears.forEach(year => {
        const yearStudents = groupedStudents[year];
        
        // Year header
        const yearHeader = document.createElement('li');
        yearHeader.className = 'list-item';
        yearHeader.style.background = 'var(--light)';
        yearHeader.style.border = 'none';
        yearHeader.style.borderLeft = `6px solid ${getYearColor(year)}`;
        yearHeader.style.marginTop = '15px';
        yearHeader.style.marginBottom = '10px';
        yearHeader.style.padding = '12px 20px';
        yearHeader.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas ${getYearIcon(year)}" style="color: ${getYearColor(year)}; font-size: 1.2rem;"></i>
                    <span style="font-weight: 700; font-size: 1.1rem; color: var(--dark);">${getYearDisplayName(year)}</span>
                </div>
                <span style="background: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: ${getYearColor(year)};">
                    ${yearStudents.length} Student${yearStudents.length > 1 ? 's' : ''}
                </span>
            </div>
        `;
        fragment.appendChild(yearHeader);
        
        // Students in this year
        yearStudents.forEach(student => {
            const li = document.createElement('li');
            li.className = 'list-item';
            
            const isButtonDisabled = disabledStudentButtons.has(student.name);
            const isPending = allPendingPickups.some(([_, pickup]) => pickup.name === student.name);
            
            if (isPending && !disabledStudentButtons.has(student.name)) {
                disabledStudentButtons.add(student.name);
            }

            li.innerHTML = `
                <div class="student-info">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${getYearColor(student.year)}20; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-user-graduate" style="color: ${getYearColor(student.year)}; font-size: 1.1rem;"></i>
                        </div>
                        <div>
                            <div class="student-name" style="font-size: 1.2rem; font-weight: 600; color: var(--dark);">
                                ${student.name}
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span class="student-class" style="background: ${getYearColor(student.year)}; padding: 4px 12px; border-radius: 20px; color: white; font-size: 0.8rem; font-weight: 600;">
                                    ${student.class}
                                </span>
                                ${isPending ? `
                                    <span style="display: flex; align-items: center; gap: 4px; color: #dc2626; font-size: 0.8rem; font-weight: 600;">
                                        <i class="fas fa-exclamation-circle"></i>
                                        Waiting for release
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                <button class="btn ${isPending || isButtonDisabled ? 'btn-secondary' : 'btn-primary'} arrival-btn" 
                        data-student-id="${student.id}"
                        data-student-name="${student.name}"
                        ${isPending || isButtonDisabled ? 'disabled' : ''}
                        style="${isPending || isButtonDisabled ? 'opacity: 0.7; cursor: not-allowed; background: var(--gray); min-width: 160px;' : 'min-width: 160px; background: linear-gradient(135deg, var(--primary), var(--primary-dark));'}">
                    <i class="fas ${isPending || isButtonDisabled ? 'fa-clock' : 'fa-user-check'}"></i>
                    ${isPending || isButtonDisabled ? 'Waiting for Release' : 'Parent Here'}
                </button>
            `;

            const button = li.querySelector('.arrival-btn');
            
            if (!isPending && !isButtonDisabled) {
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (button.disabled) return;
                    
                    const now = Date.now();
                    const lastClick = clickCooldown.get(student.name);

                    if (lastClick && (now - lastClick < COOLDOWN_TIME)) {
                        const secondsLeft = Math.ceil((COOLDOWN_TIME - (now - lastClick)) / 1000);
                        showToast(`Wait ${secondsLeft}s before clicking again`, 'warning');
                        return;
                    }

                    const existingPickup = await isStudentAlreadyPending(student.name);
                    if (existingPickup) {
                        const waitTime = Math.round((Date.now() - existingPickup.data.timestamp) / 60000);
                        showToast(`❌ ${student.name} is already waiting (${waitTime} minutes)`, 'warning');
                        
                        disabledStudentButtons.add(student.name);
                        button.disabled = true;
                        button.style.opacity = '0.7';
                        button.style.cursor = 'not-allowed';
                        button.innerHTML = '<i class="fas fa-clock"></i> Waiting for Release';
                        return;
                    }

                    await markParentArrived(student, button);
                });
            } else {
                button.disabled = true;
            }

            fragment.appendChild(li);
        });
    });
    
    studentListElement.appendChild(fragment);
}

// Helper functions for visual styling
function getYearColor(year) {
    if (year.includes('KG')) {
        return '#f59e0b'; // Orange for KG
    }
    if (year.includes('Year')) {
        const yearNum = parseInt(year.replace(/\D/g, ''));
        const colors = [
            '#3b82f6', // Year 1 - Blue
            '#10b981', // Year 2 - Green
            '#8b5cf6', // Year 3 - Purple
            '#ec4899', // Year 4 - Pink
            '#ef4444', // Year 5 - Red
            '#14b8a6', // Year 6 - Teal
            '#f97316', // Year 7 - Orange
            '#6366f1', // Year 8 - Indigo
            '#6b7280'  // Year 9 - Gray
        ];
        return colors[yearNum - 1] || '#64748b';
    }
    return '#64748b';
}

function getYearIcon(year) {
    if (year.includes('KG')) {
        return 'fa-child';
    }
    if (year.includes('Year')) {
        const yearNum = parseInt(year.replace(/\D/g, ''));
        const icons = [
            'fa-star',      // Year 1
            'fa-rocket',    // Year 2
            'fa-flask',     // Year 3
            'fa-book',      // Year 4
            'fa-globe',     // Year 5
            'fa-calculator', // Year 6
            'fa-flask',     // Year 7
            'fa-music',     // Year 8
            'fa-graduation-cap' // Year 9
        ];
        return icons[yearNum - 1] || 'fa-user-graduate';
    }
    return 'fa-user-graduate';
}

// ==================== CONFIRMATION DIALOG ====================

let pendingReleaseKey = null;
let pendingReleaseData = null;

function showReleaseConfirmation(key, pickupData) {
    pendingReleaseKey = key;
    pendingReleaseData = pickupData;

    const waitTime = pickupData.timestamp ?
        Math.max(1, Math.round((Date.now() - pickupData.timestamp) / 60000)) : 1;

    document.getElementById('confirm-student-name').textContent = pickupData.name;
    document.getElementById('confirm-student-class').textContent = pickupData.class;
    document.getElementById('confirm-wait-time').textContent = `${waitTime} minutes`;
    document.getElementById('confirm-arrival-time').textContent = pickupData.arrivedAt || 'Unknown';

    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'flex';
    document.getElementById('confirm-cancel').focus();
}

function setupConfirmationDialog() {
    const modal = document.getElementById('confirmation-modal');
    const cancelBtn = document.getElementById('confirm-cancel');
    const confirmBtn = document.getElementById('confirm-release');

    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        pendingReleaseKey = null;
        pendingReleaseData = null;
    });

    confirmBtn.addEventListener('click', async () => {
        if (pendingReleaseKey && pendingReleaseData) {
            modal.style.display = 'none';
            await releaseStudent(pendingReleaseKey, pendingReleaseData.name);
            pendingReleaseKey = null;
            pendingReleaseData = null;
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
            pendingReleaseKey = null;
            pendingReleaseData = null;
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            pendingReleaseKey = null;
            pendingReleaseData = null;
        }
    });
}

async function releaseStudent(key, studentName) {
    console.log('Releasing student:', studentName);

    try {
        const pickupRef = ref(db, `pendingPickups/${key}`);
        const snapshot = await get(pickupRef);

        if (snapshot.exists()) {
            const pickupData = snapshot.val();

            pickupData.releasedAt = Date.now();
            pickupData.releasedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            pickupData.releasedBy = 'teacher';

            const releasedRef = ref(db, `releasedPickups/${key}`);
            await set(releasedRef, pickupData);
            await remove(pickupRef);

            disabledStudentButtons.delete(studentName);
            
            renderStudentList(document.getElementById('student-search')?.value || '');

            showToast(`✅ ${studentName} released safely!`, 'success');
            updateReleasedCount();

        } else {
            showToast('Error: Pickup not found', 'error');
        }

    } catch (error) {
        console.error('Error releasing student:', error);
        showToast('Error releasing student', 'error');
    }
}

// ==================== NOTIFICATIONS ====================

function setupNotifications() {
    const requestNotifBtn = document.getElementById('request-notif');
    const notificationStatus = document.getElementById('notification-status');

    if (!requestNotifBtn || !notificationStatus) return;

    if (Notification.permission === 'granted') {
        requestNotifBtn.innerHTML = '<i class="fas fa-bell"></i> Notifications Enabled';
        requestNotifBtn.disabled = true;
        notificationStatus.textContent = '✅ Notifications are enabled';
        notificationStatus.style.color = 'var(--secondary)';
    }

    requestNotifBtn.addEventListener('click', async () => {
        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                const token = await getToken(messaging, {
                    vapidKey: 'BFkDcJvK7xDqpvHlUws0fXHaXpI2qU9hww-SFXtNSE55kmE-YwksroR58RY1jPecKsijY26r0yATiS21dLdNB6A'
                });

                console.log('FCM Token:', token);
                localStorage.setItem('fcmToken', token);

                requestNotifBtn.innerHTML = '<i class="fas fa-bell"></i> Notifications Enabled';
                requestNotifBtn.disabled = true;
                notificationStatus.textContent = '✅ Notifications are enabled';
                notificationStatus.style.color = 'var(--secondary)';

                showToast('Notifications enabled!', 'success');

            } else {
                notificationStatus.textContent = '❌ Notifications blocked';
                notificationStatus.style.color = 'var(--danger)';
                showToast('Notifications permission denied', 'warning');
            }

        } catch (err) {
            console.error('Notification setup failed:', err);
            showToast('Error enabling notifications', 'error');
        }
    });

    onMessage(messaging, (payload) => {
        if (payload.notification) {
            const { title, body } = payload.notification;
            showToast(`${title}: ${body}`, 'info');
            playNotificationSound();
        }
    });
}

// ==================== UTILITY FUNCTIONS ====================

function showToast(message, type = 'info', duration = 5000) {
    const icons = {
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        error: 'fas fa-times-circle',
        info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${icons[type] || icons.info} toast-icon"></i>
        <div class="toast-content">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    const container = document.getElementById('toast-container');
    if (container) {
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, duration);
    }
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;

        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);

    } catch (e) {
        console.log('Sound not available');
    }
}

function updateStudentCount() {
    const totalStudentsElement = document.getElementById('total-students');
    if (totalStudentsElement) {
        totalStudentsElement.textContent = students.length;
    }
}

async function updatePendingCount() {
    try {
        const pendingRef = ref(db, 'pendingPickups');
        const snapshot = await get(pendingRef);
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;

        ['pending-count', 'active-pickups'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = count;
        });

    } catch (error) {
        console.error('Error updating pending count:', error);
    }
}

async function updateReleasedCount() {
    try {
        const releasedRef = ref(db, 'releasedPickups');
        const snapshot = await get(releasedRef);
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;

        const releasedElement = document.getElementById('released-today');
        if (releasedElement) releasedElement.textContent = count;

    } catch (error) {
        console.error('Error updating released count:', error);
    }
}

function cleanupClickCooldown() {
    const now = Date.now();
    for (const [studentName, timestamp] of clickCooldown.entries()) {
        if (now - timestamp > COOLDOWN_TIME * 10) {
            clickCooldown.delete(studentName);
        }
    }
}

let searchTimeout = null;
function setupSearch() {
    const searchInput = document.getElementById('student-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            renderStudentList(e.target.value);
        }, 300);
    });
    
    // Add placeholder improvement
    searchInput.placeholder = '🔍 Search by student name, class, or year...';
}

// ==================== FORCE RESET BUTTON ====================

window.forceResetForNewDay = async function() {
    if (confirm('Are you sure you want to reset the system for a new day? This will archive all current pickups.')) {
        await resetSystemForNewDay();
        showToast('System reset complete!', 'success');
    }
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    checkAndResetForNewDay().catch(console.error);
    loadStudentsFromCSV().catch(console.error);
    
    setTimeout(() => {
        setupPendingPickupsListener();
        setupConfirmationDialog();
        setupSearch();
        
        updatePendingCount();
        updateReleasedCount();
        
        setInterval(cleanupClickCooldown, 60000);
        setInterval(checkAndResetForNewDay, 60 * 60 * 1000);
        
        console.log('App initialized');
    }, 100);
});

function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    console.log('Online status:', isOnline ? 'Online' : 'Offline');

    if (!isOnline) {
        showToast('You are offline. Data may not sync.', 'warning');
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

window.renderStudentList = renderStudentList;
window.students = students;
window.clearStudentCache = () => {
    localStorage.removeItem(STUDENT_CACHE_KEY);
    studentLoadPromise = null;
    loadStudentsFromCSV();
};

console.log('App.js loaded successfully - VISUALLY IMPROVED VERSION');
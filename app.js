// app.js - SMOOTH VERSION WITH ADMIN UNDO & COLOR CODING
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getDatabase, ref, push, set, onValue, remove, get } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

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

// ==================== CLASSES ====================
const CLASSES = [
    "KG1", "KG2", "Year 1", "Year 2", "Year 3",
    "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9"
];

// Teacher filter - default to 'all'
let teacherFilter = 'all';
let historyFilter = 'all';
let savedTeacherClass = localStorage.getItem('maarif_teacher_class');
if (savedTeacherClass && savedTeacherClass !== 'all') {
    teacherFilter = savedTeacherClass;
}

// ==================== STUDENTS ARRAY ====================
const STUDENTS = [
    { name: "AILA ALLA", class: "KG1", year: "KG1" },
    { name: "ALI ILBEY ZOR", class: "KG1", year: "KG1" },
    { name: "ESMA SERT", class: "KG1", year: "KG1" },
    { name: "LIYA MAYAN KAYA", class: "KG1", year: "KG1" },
    { name: "RAKAN HAMROUNI", class: "KG1", year: "KG1" },
    { name: "AMIN OSMAN", class: "kg2", year: "KG2" },
    { name: "CHAHINE BEN AMOR", class: "kg2", year: "KG2" },
    { name: "KAMAR TARHOUNI", class: "kg2", year: "KG2" },
    { name: "NIBRAS KARJIKAR", class: "kg2", year: "KG2" },
    { name: "RAKAN ELBAKBAK", class: "kg2", year: "KG2" },
    { name: "ROUMAYSA ARWA", class: "kg2", year: "KG2" },
    { name: "SOFIA MEFTEH", class: "kg2", year: "KG2" },
    { name: "YOSSEF ALLA NUSEIR", class: "kg2", year: "KG2" },
    { name: "ZEYNEP ELA SERT", class: "kg2", year: "KG2" },
    { name: "MIKAIL HAKTAN", class: "kg2", year: "KG2" },
    { name: "AYLA ERDOGAN", class: "Year 1", year: "Year 1" },
    { name: "AZAM SHABEER", class: "Year 1", year: "Year 1" },
    { name: "EFE AYDOGDU", class: "Year 1", year: "Year 1" },
    { name: "ERVA OZDEMIR", class: "Year 1", year: "Year 1" },
    { name: "HUSSAM NUSEIR", class: "Year 1", year: "Year 1" },
    { name: "JULIA CHERNI", class: "Year 1", year: "Year 1" },
    { name: "LARA KAABI", class: "Year 1", year: "Year 1" },
    { name: "MIRAY DEMIR", class: "Year 1", year: "Year 1" },
    { name: "OMER MUSAB YAVUZTURK", class: "Year 1", year: "Year 1" },
    { name: "Hasan Efe Meşe", class: "Year 1", year: "Year 1" },
    { name: "AWES AYARI", class: "Year 2", year: "Year 2" },
    { name: "FARES ALASWAD", class: "Year 2", year: "Year 2" },
    { name: "FIRDAOUS TURAN", class: "Year 2", year: "Year 2" },
    { name: "HASAN HUSSEYIN TEMEL", class: "Year 2", year: "Year 2" },
    { name: "ILEF SFAR", class: "Year 2", year: "Year 2" },
    { name: "KHADIJA ABUFALGHA", class: "Year 2", year: "Year 2" },
    { name: "LAYANA KATRAMIZ", class: "Year 2", year: "Year 2" },
    { name: "MOHAMED YESSINE NESSIB", class: "Year 2", year: "Year 2" },
    { name: "RAYEN HAMZAOUI", class: "Year 2", year: "Year 2" },
    { name: "SILA KHALIFA ELSHAWESH", class: "Year 2", year: "Year 2" },
    { name: "YUSUF UNUTKAN", class: "Year 2", year: "Year 2" },
    { name: "ADAM KHALIFA ELSHAWESH", class: "Year 3", year: "Year 3" },
    { name: "AICHA KENZ", class: "Year 3", year: "Year 3" },
    { name: "ANAYA HANEEN MAJID", class: "Year 3", year: "Year 3" },
    { name: "AYSE SERRA DEMIRCILER", class: "Year 3", year: "Year 3" },
    { name: "CEMAL SELIM KURNAZ", class: "Year 3", year: "Year 3" },
    { name: "ELISSA AOUADHI", class: "Year 3", year: "Year 3" },
    { name: "GHALIA HENTATI", class: "Year 3", year: "Year 3" },
    { name: "JAD EL OUNI", class: "Year 3", year: "Year 3" },
    { name: "KHADIJA JALLELI", class: "Year 3", year: "Year 3" },
    { name: "LUJAIN DRIDI", class: "Year 3", year: "Year 3" },
    { name: "MARWA LOUISE CHAMPON", class: "Year 3", year: "Year 3" },
    { name: "MUHAMMAD HASHIM BHATTI", class: "Year 3", year: "Year 3" },
    { name: "NARJES IBN EL AZZOUZI", class: "Year 3", year: "Year 3" },
    { name: "OMER DUZCU", class: "Year 3", year: "Year 3" },
    { name: "RACHED BEN KHATEM", class: "Year 3", year: "Year 3" },
    { name: "ROUDINA ARWA", class: "Year 3", year: "Year 3" },
    { name: "SARA SARAL", class: "Year 3", year: "Year 3" },
    { name: "YASMINA CHEKIR", class: "Year 3", year: "Year 3" },
    { name: "YOUSSEF KHADRA", class: "Year 3", year: "Year 3" },
    { name: "ZEYNEP MEKSI", class: "Year 3", year: "Year 3" },
    { name: "ZEYD SFAR", class: "Year 3", year: "Year 3" },
    { name: "BAYA MEFTEH", class: "Year 4", year: "Year 4" },
    { name: "BAYA AROUA", class: "Year 4", year: "Year 4" },
    { name: "DONIA HAKTAN", class: "Year 4", year: "Year 4" },
    { name: "GHANEM MAZROUAI", class: "Year 4", year: "Year 4" },
    { name: "MEHMET EYMEN KURNAZ", class: "Year 4", year: "Year 4" },
    { name: "MELIA KATRAMIZ", class: "Year 4", year: "Year 4" },
    { name: "MOHAMED ASAF TEMEL", class: "Year 4", year: "Year 4" },
    { name: "MOHAMED HANI TARHOUNI", class: "Year 4", year: "Year 4" },
    { name: "SANDRA JERBI", class: "Year 4", year: "Year 4" },
    { name: "YAHIA MAAFA", class: "Year 4", year: "Year 4" },
    { name: "ZAKARYA BEN AMAR", class: "Year 4", year: "Year 4" },
    { name: "AHMED KARIM OTHMAN", class: "Year 5", year: "Year 5" },
    { name: "ALI EYMEN YANMAZ", class: "Year 5", year: "Year 5" },
    { name: "ATHAULLAH ZAIDAN KURNIA", class: "Year 5", year: "Year 5" },
    { name: "BARAA NECHI", class: "Year 5", year: "Year 5" },
    { name: "CHARIF KZADRI", class: "Year 5", year: "Year 5" },
    { name: "GHALA ABOUKIM", class: "Year 5", year: "Year 5" },
    { name: "HALIMA JALLELI", class: "Year 5", year: "Year 5" },
    { name: "IPEK BELKIS TURAN", class: "Year 5", year: "Year 5" },
    { name: "IREM BAYAR", class: "Year 5", year: "Year 5" },
    { name: "KHALEEFA ARWA", class: "Year 5", year: "Year 5" },
    { name: "OMER ZUBEYR UNUTKAN", class: "Year 5", year: "Year 5" },
    { name: "YAGMUR RACHEL OZDEMIR", class: "Year 5", year: "Year 5" },
    { name: "YAZID IBN EL AZZOUZI", class: "Year 5", year: "Year 5" },
    { name: "ABDELRAHMEN DRIDI", class: "Year 6", year: "Year 6" },
    { name: "AYMEN OSMAN", class: "Year 6", year: "Year 6" },
    { name: "FATIMA SHABEER", class: "Year 6", year: "Year 6" },
    { name: "GHAZEL ABOUKIM", class: "Year 6", year: "Year 6" },
    { name: "MABROUK ABUFALGHA", class: "Year 6", year: "Year 6" },
    { name: "MALEK ALAHMAR", class: "Year 6", year: "Year 6" },
    { name: "MIRAL EL KHECHINE", class: "Year 6", year: "Year 6" },
    { name: "MOHAMED ALI SHABEER", class: "Year 6", year: "Year 6" },
    { name: "MOHAMED KINEN NECHI", class: "Year 6", year: "Year 6" },
    { name: "MUHAMMAD HASHIR BHATTI", class: "Year 6", year: "Year 6" },
    { name: "NADIA OUKHAI", class: "Year 6", year: "Year 6" },
    { name: "NAYA TALOUZI", class: "Year 6", year: "Year 6" },
    { name: "OMER FARUK DEMIRCILER", class: "Year 6", year: "Year 6" },
    { name: "SARA ALFADLEY", class: "Year 6", year: "Year 6" },
    { name: "SOFIA HENTATI", class: "Year 6", year: "Year 6" },
    { name: "YANIS TABOUBI", class: "Year 6", year: "Year 6" },
    { name: "ZEYNEP ARYA AKGEYIK", class: "Year 6", year: "Year 6" },
    { name: "ADAM KENZ", class: "Year 7", year: "Year 7" },
    { name: "ATHARIZZ ZAFRAN KURNIA", class: "Year 7", year: "Year 7" },
    { name: "AYA AGEEL", class: "Year 7", year: "Year 7" },
    { name: "EFE MERSIN", class: "Year 7", year: "Year 7" },
    { name: "EZED BOUDEN", class: "Year 7", year: "Year 7" },
    { name: "FATMA EZAHRA FEKIH", class: "Year 7", year: "Year 7" },
    { name: "LINA NESSIB", class: "Year 7", year: "Year 7" },
    { name: "MARIEM HAMZAOUI", class: "Year 7", year: "Year 7" },
    { name: "MILYA EL KHECHINE", class: "Year 7", year: "Year 7" },
    { name: "MIRAA MAZROUAI", class: "Year 7", year: "Year 7" },
    { name: "MISHAAL MAJID", class: "Year 7", year: "Year 7" },
    { name: "MOHAMED AGEEL", class: "Year 7", year: "Year 7" },
    { name: "MOHAMED SKANDER BAROUNI", class: "Year 7", year: "Year 7" },
    { name: "MELEK DHAOUI", class: "Year 7", year: "Year 7" },
    { name: "NERMIN TURAN", class: "Year 7", year: "Year 7" },
    { name: "OMER BAYAR", class: "Year 7", year: "Year 7" },
    { name: "RAHSHED MAZROUAI", class: "Year 7", year: "Year 7" },
    { name: "SOULAYMEN HENTATI", class: "Year 7", year: "Year 7" },
    { name: "ZAKARIA HENTATI", class: "Year 7", year: "Year 7" },
    { name: "AHMET EMRE DUZCU", class: "Year 8", year: "Year 8" },
    { name: "AICHA BEN ZAIED", class: "Year 8", year: "Year 8" },
    { name: "CHAIMA CHIKHAOUI", class: "Year 8", year: "Year 8" },
    { name: "ESMA HAVVA KOCABEY", class: "Year 8", year: "Year 8" },
    { name: "FATMA CHIKHAOUI", class: "Year 8", year: "Year 8" },
    { name: "HAMAD MAZROUAI", class: "Year 8", year: "Year 8" },
    { name: "HILAL ZUMRA OZBEY", class: "Year 8", year: "Year 8" },
    { name: "ISMAIL ZAYATI", class: "Year 8", year: "Year 8" },
    { name: "IYED JALOULI", class: "Year 8", year: "Year 8" },
    { name: "MOHAMD ALI BAROUDI", class: "Year 8", year: "Year 8" },
    { name: "MOHAMED KZADRI", class: "Year 8", year: "Year 8" },
    { name: "NOUHA BOUYAHIA", class: "Year 8", year: "Year 8" },
    { name: "NOUR BOUYAHIA", class: "Year 8", year: "Year 8" },
    { name: "ROUKAYA MEHRI", class: "Year 8", year: "Year 8" },
    { name: "YAZAN BAROUDI", class: "Year 8", year: "Year 8" },
    { name: "ZAINEB JALLEI", class: "Year 8", year: "Year 8" },
    { name: "ZAYD LAMIRI", class: "Year 8", year: "Year 8" },
    { name: "ABDULLAH ADEM TURAN", class: "Year 9", year: "Year 9" },
    { name: "AHMED CHEKIR", class: "Year 9", year: "Year 9" },
    { name: "AICHA ELLOUZ", class: "Year 9", year: "Year 9" },
    { name: "AICHA KZADRI", class: "Year 9", year: "Year 9" },
    { name: "AMIR OUKHAI", class: "Year 9", year: "Year 9" },
    { name: "ASEEL MOHAMMED AMMAR ALAHMER", class: "Year 9", year: "Year 9" },
    { name: "DORRA DAFDOUF", class: "Year 9", year: "Year 9" },
    { name: "ELYES TABOUBI", class: "Year 9", year: "Year 9" },
    { name: "EYA OUERTANI", class: "Year 9", year: "Year 9" },
    { name: "INES BEN ZAIED", class: "Year 9", year: "Year 9" },
    { name: "MARIA HAMZAOUI", class: "Year 9", year: "Year 9" },
    { name: "MOHAMED YASSINE BARKAOUI", class: "Year 9", year: "Year 9" },
    { name: "NEVA DEMIRCAN", class: "Year 9", year: "Year 9" },
    { name: "ROUKAYA BEN OMRANE", class: "Year 9", year: "Year 9" },
    { name: "SAFIA DARGHOUTH", class: "Year 9", year: "Year 9" },
    { name: "SHADA MOHAMMED AMMAR ALAHMER", class: "Year 9", year: "Year 9" },
    { name: "TAYMA YASMINA KENZ", class: "Year 9", year: "Year 9" },
    { name: "WAJD HOUAICHINE", class: "Year 9", year: "Year 9" },
    { name: "YASSINE GUITOUNI", class: "Year 9", year: "Year 9" }
];

// ==================== STATE ====================
const RELEASED_MEMORY_KEY = 'maarif_released';
const ABSENT_MEMORY_KEY = 'maarif_absent';
let allPendingPickups = [];
let allHistoryItems = [];
let releasedStudentsToday = new Set();
let absentStudentsToday = new Set();
let pendingReleaseKey = null;
let pendingReleaseData = null;

// Load released and absent from memory
try {
    const saved = localStorage.getItem(RELEASED_MEMORY_KEY);
    if (saved) releasedStudentsToday = new Set(JSON.parse(saved));

    const savedAbsent = localStorage.getItem(ABSENT_MEMORY_KEY);
    if (savedAbsent) {
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem('maarif_last_reset');
        if (lastReset === today) {
            absentStudentsToday = new Set(JSON.parse(savedAbsent));
        } else {
            localStorage.removeItem(ABSENT_MEMORY_KEY);
        }
    }
} catch (e) {}

// ==================== DROPDOWN FILTER ====================
function renderTeacherFilter() {
    const container = document.getElementById('teacher-filter-container');
    if (!container) return;

    const classCounts = {};
    allPendingPickups.forEach(([_, p]) => {
        if (p && p.class) {
            classCounts[p.class] = (classCounts[p.class] || 0) + 1;
        }
    });

    let options = '<option value="all">📋 All Classes</option>';
    const sortedClasses = [...CLASSES].sort((a, b) => {
        const aKG = a.includes('KG'),
            bKG = b.includes('KG');
        const aYear = a.includes('Year'),
            bYear = b.includes('Year');
        if (aKG && bKG) return a.localeCompare(b);
        if (aKG) return -1;
        if (bKG) return 1;
        if (aYear && bYear) {
            return parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, ''));
        }
        return 0;
    });

    sortedClasses.forEach(className => {
        const hasStudents = STUDENTS.some(s => s.class.toLowerCase() === className.toLowerCase());
        if (hasStudents) {
            const count = classCounts[className] || 0;
            const selected = teacherFilter === className ? 'selected' : '';
            options += `<option value="${className}" ${selected}>${className} (${count})</option>`;
        }
    });

    container.innerHTML = `
        <div class="filter-dropdown-wrapper">
            <label for="class-filter" class="filter-label">
                <i class="fas fa-filter"></i> Show:
            </label>
            <select id="class-filter" class="filter-dropdown" onchange="setTeacherFilter(this.value)">
                ${options}
            </select>
        </div>
    `;
}

window.setTeacherFilter = function(filter) {
    teacherFilter = filter;
    localStorage.setItem('maarif_teacher_class', filter);
    renderTeacherFilter();
    renderFilteredPendingList();
    renderHistoryList();
};

// ==================== HISTORY FILTER ====================
function renderHistoryFilter() {
    const container = document.getElementById('history-filter-container');
    if (!container) return;

    const releasedCount = allHistoryItems.filter(item => item && item.status === 'released').length;
    const absentCount = allHistoryItems.filter(item => item && item.status === 'absent').length;

    container.innerHTML = `
        <div class="history-filter-wrapper">
            <button class="history-filter-btn ${historyFilter === 'all' ? 'active' : ''}" onclick="setHistoryFilter('all')">
                <i class="fas fa-list-ul"></i> All <span class="filter-count">${allHistoryItems.length}</span>
            </button>
            <button class="history-filter-btn released-filter ${historyFilter === 'released' ? 'active' : ''}" onclick="setHistoryFilter('released')">
                <i class="fas fa-check-circle"></i> Released <span class="filter-count">${releasedCount}</span>
            </button>
            <button class="history-filter-btn absent-filter ${historyFilter === 'absent' ? 'active' : ''}" onclick="setHistoryFilter('absent')">
                <i class="fas fa-calendar-times"></i> Absent <span class="filter-count">${absentCount}</span>
            </button>
        </div>
    `;
}

window.setHistoryFilter = function(filter) {
    historyFilter = filter;
    renderHistoryFilter();
    renderHistoryList();
};

// ==================== CONFIRMATION DIALOG FUNCTIONS ====================
function showReleaseConfirmation(key, data) {
    pendingReleaseKey = key;
    pendingReleaseData = {...data, status: 'released' };

    const found = allPendingPickups.find(([k]) => k === key);
    let waitTime = 1;
    if (found && found[1] && found[1].timestamp) {
        waitTime = Math.max(1, Math.round((Date.now() - found[1].timestamp) / 60000));
    }

    document.getElementById('confirm-student-name').textContent = data.name;
    document.getElementById('confirm-student-class').textContent = data.class;
    document.getElementById('confirm-wait-time').textContent = waitTime + ' minutes';
    document.getElementById('confirm-arrival-time').textContent = data.arrivedAt || 'Unknown';
    document.getElementById('confirmation-modal').style.display = 'flex';
}

function showAbsentConfirmation(key, data) {
    pendingReleaseKey = key;
    pendingReleaseData = {...data, status: 'absent' };

    document.getElementById('absent-student-name').textContent = data.name;
    document.getElementById('absent-student-class').textContent = data.class;
    document.getElementById('absent-modal').style.display = 'flex';
}

window.showReleaseConfirmation = showReleaseConfirmation;
window.showAbsentConfirmation = showAbsentConfirmation;

function setupConfirmationDialogs() {
    // Release modal
    const releaseModal = document.getElementById('confirmation-modal');
    document.getElementById('confirm-cancel').addEventListener('click', () => {
        releaseModal.style.display = 'none';
        pendingReleaseKey = null;
        pendingReleaseData = null;
    });
    document.getElementById('confirm-release').addEventListener('click', async() => {
        if (pendingReleaseKey && pendingReleaseData) {
            releaseModal.style.display = 'none';
            await releaseStudent(pendingReleaseKey, pendingReleaseData);
            pendingReleaseKey = null;
            pendingReleaseData = null;
        }
    });

    // Absent modal
    const absentModal = document.getElementById('absent-modal');
    document.getElementById('absent-cancel').addEventListener('click', () => {
        absentModal.style.display = 'none';
        pendingReleaseKey = null;
        pendingReleaseData = null;
    });
    document.getElementById('confirm-absent').addEventListener('click', async() => {
        if (pendingReleaseKey && pendingReleaseData) {
            absentModal.style.display = 'none';
            await releaseStudent(pendingReleaseKey, pendingReleaseData);
            pendingReleaseKey = null;
            pendingReleaseData = null;
        }
    });

    // Reset modal
    const resetModal = document.getElementById('reset-modal');
    const resetBtn = document.getElementById('reset-btn');
    const confirmResetBtn = document.getElementById('confirm-reset');
    const cancelResetBtn = document.getElementById('cancel-reset');

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetModal.style.display = 'flex';
        });
    }

    if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', () => {
            resetModal.style.display = 'none';
        });
    }

    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', async() => {
            resetModal.style.display = 'none';
            await resetApp();
        });
    }

    // Close on Escape or outside click
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            releaseModal.style.display = 'none';
            absentModal.style.display = 'none';
            if (resetModal) resetModal.style.display = 'none';
        }
    });

    releaseModal.addEventListener('click', (e) => {
        if (e.target === releaseModal) {
            releaseModal.style.display = 'none';
            pendingReleaseKey = null;
            pendingReleaseData = null;
        }
    });

    absentModal.addEventListener('click', (e) => {
        if (e.target === absentModal) {
            absentModal.style.display = 'none';
            pendingReleaseKey = null;
            pendingReleaseData = null;
        }
    });

    if (resetModal) {
        resetModal.addEventListener('click', (e) => {
            if (e.target === resetModal) {
                resetModal.style.display = 'none';
            }
        });
    }
}

// ==================== ACTIONS ====================
window.markParentArrived = async function(name, className, year) {
    try {
        await set(push(ref(db, 'pendingPickups')), {
            name,
            class: className,
            year,
            timestamp: Date.now(),
            arrivedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        showToast(`✅ ${name} marked`, 'success');
    } catch (error) {
        showToast('❌ Error', 'error');
    }
};

window.undoMarkParent = async function(name) {
    const pending = allPendingPickups.find(([_, p]) => p && p.name === name);
    if (pending) {
        await remove(ref(db, `pendingPickups/${pending[0]}`));
        showToast(`↩️ Undo ${name}`, 'info');
    }
};

async function releaseStudent(key, data) {
    try {
        const snapshot = await get(ref(db, `pendingPickups/${key}`));
        if (snapshot.exists()) {
            const record = snapshot.val();
            record.status = data.status;
            record.timestamp = Date.now();
            record.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Move to history
            await set(ref(db, `history/${key}`), record);
            await remove(ref(db, `pendingPickups/${key}`));

            // Update local state
            if (data.status === 'released') {
                releasedStudentsToday.add(record.name);
                localStorage.setItem(RELEASED_MEMORY_KEY, JSON.stringify([...releasedStudentsToday]));
                showToast(`✅ ${record.name} released`, 'success');
            } else {
                absentStudentsToday.add(record.name);
                localStorage.setItem(ABSENT_MEMORY_KEY, JSON.stringify([...absentStudentsToday]));
                localStorage.setItem('maarif_last_reset', new Date().toDateString());
                showToast(`📝 ${record.name} marked absent`, 'info');
            }

            // FORCE IMMEDIATE UI UPDATE - THIS IS THE KEY PART
            renderStudentList(); // Remove from admin panel
            renderFilteredPendingList(); // Remove from teacher panel
            renderHistoryList(); // Add to history
        }
    } catch (error) {
        showToast('❌ Error', 'error');
    }
}

// ==================== RENDER FUNCTIONS ====================
function renderStudentList() {
    const list = document.getElementById('student-list');
    if (!list) return;

    // Filter out students who are already released OR absent
    const availableStudents = STUDENTS.filter(s =>
        !releasedStudentsToday.has(s.name) && !absentStudentsToday.has(s.name)
    );

    if (availableStudents.length === 0) {
        list.innerHTML = '<li class="empty-state"><i class="fas fa-users"></i><h3>No students available</h3><p>All students have been processed</p></li>';
        return;
    }

    const pendingCounts = {};
    allPendingPickups.forEach(([_, p]) => {
        if (p && p.year) pendingCounts[p.year] = (pendingCounts[p.year] || 0) + 1;
    });

    const groups = {};
    availableStudents.forEach(s => {
        if (!groups[s.year]) groups[s.year] = [];
        groups[s.year].push(s);
    });

    const years = Object.keys(groups).sort((a, b) => {
        const aKG = a.includes('KG'),
            bKG = b.includes('KG');
        const aYear = a.includes('Year'),
            bYear = b.includes('Year');
        if (aKG && bKG) return a.localeCompare(b);
        if (aKG) return -1;
        if (bKG) return 1;
        if (aYear && bYear) {
            return parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, ''));
        }
        return 0;
    });

    let html = '';
    years.forEach(year => {
                const pendingCount = pendingCounts[year] || 0;
                const pendingBadge = pendingCount > 0 ?
                    `<span class="year-pending-badge"><i class="fas fa-clock"></i> ${pendingCount} waiting</span>` : '';

                html += `<li class="list-item year-header" style="background:var(--light);border-left:6px solid ${getYearColor(year)};margin-top:15px">
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
                <div style="display:flex;align-items:center;gap:10px">
                    <i class="fas ${getYearIcon(year)}" style="color:${getYearColor(year)}"></i>
                    <span style="font-weight:700; font-size:1.1rem;">${year}</span>
                    ${pendingBadge}
                </div>
                <span class="year-count" style="background:white;padding:4px 12px;border-radius:20px;color:${getYearColor(year)};font-weight:600">
                    <i class="fas fa-users"></i> ${groups[year].length}
                </span>
            </div>
        </li>`;

                groups[year].forEach(s => {
                            const isPending = allPendingPickups.some(([_, p]) => p && p.name === s.name);

                            html += `<li class="list-item ${isPending ? 'pending-item' : ''}">
                <div class="student-info">
                    <div style="display:flex;align-items:center;gap:12px">
                        <div class="student-avatar" style="width:40px;height:40px;border-radius:50%;background:${getYearColor(s.year)}20;display:flex;align-items:center;justify-content:center">
                            <i class="fas fa-user-graduate" style="color:${getYearColor(s.year)}"></i>
                        </div>
                        <div>
                            <div class="student-name">${s.name}</div>
                            <span class="student-class" style="background:${getYearColor(s.year)}">${s.class}</span>
                            ${isPending ? '<span class="pending-badge"><i class="fas fa-exclamation-circle"></i> Waiting</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="action-buttons" style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${isPending ? `
                        <button class="btn btn-undo" onclick="undoMarkParent('${s.name}')">
                            <i class="fas fa-undo-alt"></i> Undo
                        </button>
                    ` : ''}
                    <button class="btn ${isPending ? 'btn-disabled' : 'btn-arrived'}" 
                        ${isPending ? 'disabled' : ''} 
                        onclick="markParentArrived('${s.name}', '${s.class}', '${s.year}')">
                        ${isPending ? '<i class="fas fa-clock"></i> Waiting' : '<i class="fas fa-user-check"></i> Parent Here'}
                    </button>
                </div>
            </li>`;
        });
    });
    list.innerHTML = html;
}

function renderFilteredPendingList() {
    const list = document.getElementById('pending-list');
    if (!list) return;

    let filtered = allPendingPickups;
    if (teacherFilter !== 'all') {
        filtered = allPendingPickups.filter(([_, p]) => 
            p && p.class && p.class.toLowerCase() === teacherFilter.toLowerCase()
        );
    }

    if (filtered.length === 0) {
        list.innerHTML = '<li class="empty-state"><i class="fas fa-check-circle"></i><h3>No Pending Pickups</h3><p>When parents arrive, they\'ll appear here</p></li>';
        return;
    }

    let html = '';
    filtered.forEach(([key, p]) => {
        if (!p) return;
        const waitTime = Math.max(1, Math.round((Date.now() - p.timestamp) / 60000));
        
        html += `<li class="list-item pending">
            <div class="student-info">
                <div class="student-name">${p.name}</div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap; margin-top:5px;">
                    <span class="student-class">${p.class}</span>
                    <span class="wait-time"><i class="far fa-clock"></i> ${waitTime} min</span>
                </div>
                <div class="arrival-time"><i class="far fa-calendar-check"></i> Arrived: ${p.arrivedAt || 'Just now'}</div>
            </div>
            <div class="action-buttons" style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-release" onclick='showReleaseConfirmation("${key}", ${JSON.stringify(p).replace(/'/g, "\\'")})'>
                    <i class="fas fa-check-circle"></i> Release
                </button>
                <button class="btn btn-absent" onclick='showAbsentConfirmation("${key}", ${JSON.stringify(p).replace(/'/g, "\\'")})'>
                    <i class="fas fa-calendar-times"></i> Absent
                </button>
            </div>
        </li>`;
    });
    list.innerHTML = html;
}

function renderHistoryList() {
    const list = document.getElementById('history-list');
    if (!list) return;

    if (allHistoryItems.length === 0) {
        list.innerHTML = '<li class="empty-state"><i class="fas fa-history"></i><h3>No History</h3><p>Released and absent students will appear here</p></li>';
        return;
    }

    let filtered = allHistoryItems;
    if (historyFilter === 'released') {
        filtered = allHistoryItems.filter(item => item && item.status === 'released');
    } else if (historyFilter === 'absent') {
        filtered = allHistoryItems.filter(item => item && item.status === 'absent');
    }

    if (teacherFilter !== 'all') {
        filtered = filtered.filter(item => 
            item && item.class && item.class.toLowerCase() === teacherFilter.toLowerCase()
        );
    }

    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    let html = '';
    filtered.forEach(item => {
        if (!item) return;
        const time = item.time || new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isReleased = item.status === 'released';
        
        html += `<li class="list-item ${isReleased ? 'released' : 'absent-history'}">
            <div class="student-info">
                <div style="display:flex;align-items:center;gap:12px; margin-bottom:8px;">
                    <div class="status-icon ${isReleased ? 'released-icon' : 'absent-icon'}" style="background: ${isReleased ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${isReleased ? '#10b981' : '#ef4444'};">
                        <i class="fas ${isReleased ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    </div>
                    <div>
                        <div class="student-name">${item.name}</div>
                        <span class="student-class" style="background: ${isReleased ? '#10b981' : '#ef4444'}">${item.class}</span>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center; margin-top:5px;">
                    <span class="status-badge" style="background: ${isReleased ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${isReleased ? '#10b981' : '#ef4444'}; border: 1px solid ${isReleased ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
                        <i class="fas ${isReleased ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${isReleased ? 'Released' : 'Absent'}
                    </span>
                    <span class="history-time"><i class="far fa-clock"></i> ${time}</span>
                </div>
            </div>
        </li>`;
    });
    list.innerHTML = html;
}

// Helper functions
function getYearColor(year) {
    if (year.includes('KG')) return '#f59e0b';
    if (year.includes('Year')) {
        const num = parseInt(year.replace(/\D/g, ''));
        const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#8b5cf6'];
        return colors[num - 1] || '#64748b';
    }
    return '#64748b';
}

function getYearIcon(year) {
    if (year.includes('KG')) return 'fa-child';
    if (year.includes('Year')) {
        const num = parseInt(year.replace(/\D/g, ''));
        const icons = ['fa-star', 'fa-rocket', 'fa-flask', 'fa-book', 'fa-globe', 'fa-calculator', 'fa-flask', 'fa-music', 'fa-graduation-cap'];
        return icons[num - 1] || 'fa-user-graduate';
    }
    return 'fa-user-graduate';
}

function showToast(message, type = 'success', duration = 3000) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <div class="toast-content">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// ==================== SEARCH ====================
const searchInput = document.getElementById('student-search');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase();
        const list = document.getElementById('student-list');
        if (!list) return;

        const filtered = STUDENTS.filter(s => 
            !releasedStudentsToday.has(s.name) && !absentStudentsToday.has(s.name) &&
            (s.name.toLowerCase().includes(term) || s.class.toLowerCase().includes(term))
        );

        if (filtered.length === 0) {
            list.innerHTML = '<li class="empty-state"><i class="fas fa-users"></i><h3>No students found</h3></li>';
            return;
        }

        let html = '';
        filtered.forEach(s => {
            const isPending = allPendingPickups.some(([_, p]) => p && p.name === s.name);
            html += `<li class="list-item ${isPending ? 'pending-item' : ''}">
                <div class="student-info">
                    <div style="display:flex;align-items:center;gap:12px">
                        <div class="student-avatar" style="width:40px;height:40px;border-radius:50%;background:${getYearColor(s.year)}20;display:flex;align-items:center;justify-content:center">
                            <i class="fas fa-user-graduate" style="color:${getYearColor(s.year)}"></i>
                        </div>
                        <div>
                            <div class="student-name">${s.name}</div>
                            <span class="student-class" style="background:${getYearColor(s.year)}">${s.class}</span>
                            ${isPending ? '<span class="pending-badge"><i class="fas fa-exclamation-circle"></i> Waiting</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="action-buttons" style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${isPending ? `
                        <button class="btn btn-undo" onclick="undoMarkParent('${s.name}')">
                            <i class="fas fa-undo-alt"></i> Undo
                        </button>
                    ` : ''}
                    <button class="btn ${isPending ? 'btn-disabled' : 'btn-arrived'}" 
                        ${isPending ? 'disabled' : ''} 
                        onclick="markParentArrived('${s.name}', '${s.class}', '${s.year}')">
                        ${isPending ? '<i class="fas fa-clock"></i> Waiting' : '<i class="fas fa-user-check"></i> Parent Here'}
                    </button>
                </div>
            </li>`;
        });
        list.innerHTML = html;
    });
}

// ==================== SECTION SWITCHING ====================
window.showSection = function(section) {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.role-btn.${section}`).classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
};

// ==================== REALTIME LISTENERS ====================
onValue(ref(db, 'pendingPickups'), (snapshot) => {
    const data = snapshot.val();
    allPendingPickups = data ? Object.entries(data) : [];
    
    const activePickupsEl = document.getElementById('active-pickups');
    const pendingCountEl = document.getElementById('pending-count');
    if (activePickupsEl) activePickupsEl.textContent = allPendingPickups.length;
    if (pendingCountEl) pendingCountEl.textContent = allPendingPickups.length;
    
    renderTeacherFilter();
    renderFilteredPendingList();
    renderStudentList();
});

onValue(ref(db, 'history'), (snapshot) => {
    const data = snapshot.val();
    allHistoryItems = data ? Object.values(data) : [];
    
    const releasedCount = allHistoryItems.filter(item => item && item.status === 'released').length;
    const absentCount = allHistoryItems.filter(item => item && item.status === 'absent').length;
    
    const releasedEl = document.getElementById('released-today');
    const absentEl = document.getElementById('absent-today');
    const historyCountEl = document.getElementById('history-count');
    
    if (releasedEl) releasedEl.textContent = releasedCount;
    if (absentEl) absentEl.textContent = absentCount;
    if (historyCountEl) historyCountEl.textContent = allHistoryItems.length;
    
    renderHistoryFilter();
    renderHistoryList();
    renderStudentList(); // Update admin panel to remove processed students
});

// ==================== RESET FUNCTION ====================
window.resetApp = async function() {
    try {
        await set(ref(db, 'pendingPickups'), null);
        await set(ref(db, 'history'), null);
        localStorage.removeItem(RELEASED_MEMORY_KEY);
        localStorage.removeItem(ABSENT_MEMORY_KEY);
        localStorage.removeItem('maarif_last_reset');
        localStorage.removeItem('maarif_teacher_class');
        releasedStudentsToday.clear();
        absentStudentsToday.clear();
        teacherFilter = 'all';
        showToast('✅ System reset for new day!', 'success');
    } catch (error) {
        showToast('❌ Error resetting', 'error');
    }
};

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('App starting...');
    
    const totalStudentsEl = document.getElementById('total-students');
    if (totalStudentsEl) totalStudentsEl.textContent = STUDENTS.length;
    
    renderStudentList();
    renderTeacherFilter();
    renderHistoryFilter();
    setupConfirmationDialogs();
    
    // Update date/time display
    updateDateTime();
    setInterval(updateDateTime, 60000);
});

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    };
    
    let el = document.getElementById('current-datetime');
    if (el) {
        el.innerHTML = `<i class="far fa-calendar-alt" style="color: var(--maarif-teal);"></i> ${now.toLocaleDateString('en-US', options)}`;
    }
}

console.log('App ready with smooth UI, admin undo, and beautiful history panel!');
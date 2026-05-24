/* =========================================
   3. JavaScript: ロジック（ドラッグ＆ドロップ＋グラフ色調整版）
   ========================================= */

const STORAGE_KEY_TASKS = 'todo_save_data_v3';
const STORAGE_KEY_TOTAL = 'todo_total_amount_v3';
const STORAGE_KEY_HISTORY = 'todo_history_v1';
const STORAGE_KEY_TEMPLATES = 'todo_templates_v1';
const STORAGE_KEY_THEME_NAME = 'todo_theme_name_v2';

let tasks = [];
let totalAmount = 0;
let historyData = [];
let templates = [];

const defaultTemplates = [
    { title: "服片付ける", money: "50" },
    { title: "皿洗い", money: "100" },
    { title: "掃除機", money: "150" }
];

const themePalettes = {
    yellow: { primary: '#FFB703', bg: '#f0edee', text: '#6d6875', placeholder: '#a7a3af' },
    red: { primary: '#d84a58', bg: '#f5f5f0', text: '#9c8aa5', placeholder: '#c1b5c8' },
    blue: { primary: '#89c3eb', bg: '#f9f6f2', text: '#a98474', placeholder: '#cbb2a7' },
    black: { primary: '#2c363f', bg: '#e6e6e6', text: '#88a096', placeholder: '#b3c3bd' }
};

const taskListEl = document.getElementById('task-list');
const addFormEl = document.getElementById('add-form');
const newTitleInp = document.getElementById('new-title');
const newMoneyInp = document.getElementById('new-money');
const totalAmountDisp = document.getElementById('total-amount-display');
const animationContainer = document.getElementById('money-animation-container');
const templateAreaEl = document.getElementById('template-area');
const saveTplBtn = document.getElementById('save-tpl-btn');

const viewHome = document.getElementById('view-home');
const viewArchive = document.getElementById('view-archive');
const viewMypage = document.getElementById('view-mypage');
const homeControls = document.getElementById('home-controls');
const navHome = document.getElementById('nav-home');
const navArchive = document.getElementById('nav-archive');
const navMypage = document.getElementById('nav-mypage');
const archiveTitleEl = document.querySelector('.archive-title');

const templateAddForm = document.getElementById('template-add-form');
const tplTitleInp = document.getElementById('tpl-title');
const tplMoneyInp = document.getElementById('tpl-money');
const mypageTemplateListEl = document.getElementById('mypage-template-list');

let myChart = null;
const coinsIcons = ['💰', '🪙', '💸', '✨'];
const motivationMessages = ["めっちゃ頑張ってる！その調子！", "良い感じ！毎日コツコツ偉い！", "すごい！目標まであと少し？", "今日も一日、お疲れ様！", "素晴らしい！成果が出てるね！"];

function init() {
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS)) || [];
    totalAmount = parseInt(localStorage.getItem(STORAGE_KEY_TOTAL), 10);
    if (isNaN(totalAmount)) totalAmount = 2210;

    historyData = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || [];
    templates = JSON.parse(localStorage.getItem(STORAGE_KEY_TEMPLATES)) || defaultTemplates;

    const savedThemeName = localStorage.getItem(STORAGE_KEY_THEME_NAME) || 'yellow';
    applyThemePalette(savedThemeName);

    if (tasks.length === 0 && historyData.length === 0) {
        tasks.push({ id: 'default', title: '服片付ける', money: '50' });
    }

    renderTasks();
    renderTotalAmount();
    renderTemplates();
    initSortable(); // ★ドラッグ＆ドロップの初期化
}

function saveData() {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEY_TOTAL, totalAmount.toString());
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(historyData));
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
}

function renderTotalAmount() {
    totalAmountDisp.innerHTML = `¥ ${totalAmount.toLocaleString()}`;
}

// テンプレート表示（修正版）
function renderTemplates() {
    templateAreaEl.innerHTML = '';
    templates.forEach(tpl => {
        const btn = document.createElement('button');
        btn.className = 'template-btn';
        btn.innerText = `${tpl.title} ¥${tpl.money}`;
        btn.addEventListener('click', () => {
            newTitleInp.value = tpl.title;
            newMoneyInp.value = tpl.money;
            addFormEl.dispatchEvent(new Event('submit'));
        });
        templateAreaEl.appendChild(btn);
    });

    mypageTemplateListEl.innerHTML = '';
    templates.forEach((tpl, index) => {
        const btn = document.createElement('button');
        btn.className = 'template-btn';
        
        // ★ここを修正しました！赤色固定をやめて、テーマカラーと連動させます。
        btn.style.borderColor = 'var(--primary-color)'; 
        
        btn.innerText = `${tpl.title} ¥${tpl.money} ×`;
        btn.addEventListener('click', () => {
            if(confirm(`テンプレート「${tpl.title}」を削除しますか？`)) {
                templates.splice(index, 1);
                saveData();
                renderTemplates();
            }
        });
        mypageTemplateListEl.appendChild(btn);
    });
}

// ★ドラッグ＆ドロップの設定（SortableJS）
function initSortable() {
    const sortableOptions = {
        animation: 150,
        delay: 200, // スマホでスワイプした時に誤爆しないよう0.2秒長押しで掴む
        delayOnTouchOnly: true,
        onEnd: function (evt) {
            // ドラッグが終わったら配列の順番も入れ替えて保存
            const movedItem = templates.splice(evt.oldIndex, 1)[0];
            templates.splice(evt.newIndex, 0, movedItem);
            saveData();
            renderTemplates(); // 両方の画面の並び順を同期
        }
    };
    
    // ホーム画面とマイページ画面の両方のリストにドラッグ機能をつける
    new Sortable(templateAreaEl, sortableOptions);
    new Sortable(mypageTemplateListEl, sortableOptions);
}

templateAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = tplTitleInp.value.trim();
    const money = tplMoneyInp.value.replace(/[^0-9]/g, '');
    if(!title || !money) return;

    templates.push({ title: title, money: money });
    saveData();
    renderTemplates();
    tplTitleInp.value = '';
    tplMoneyInp.value = '';
});

saveTplBtn.addEventListener('click', () => {
    const title = newTitleInp.value.trim();
    const money = newMoneyInp.value.replace(/[^0-9]/g, '');

    if (!title || !money) {
        alert("「やること」と「おこづかい」を入力してから＋ボタンを押してください。");
        return;
    }

    templates.push({ title: title, money: money });
    saveData();
    renderTemplates();
    addFormEl.dispatchEvent(new Event('submit'));
});

document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        const themeName = dot.dataset.theme;
        applyThemePalette(themeName);
        localStorage.setItem(STORAGE_KEY_THEME_NAME, themeName);
        if (viewArchive.style.display === 'block') renderChart();
    });
});

function applyThemePalette(themeName) {
    const palette = themePalettes[themeName] || themePalettes.yellow;
    document.documentElement.style.setProperty('--primary-color', palette.primary);
    document.documentElement.style.setProperty('--bg-color', palette.bg);
    document.documentElement.style.setProperty('--header-text-color', palette.text);
    document.documentElement.style.setProperty('--text-color', palette.text);
    document.documentElement.style.setProperty('--placeholder-color', palette.placeholder);
}

function renderTasks() {
    taskListEl.innerHTML = '';
    tasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.id = task.id;
        li.addEventListener('click', () => completeTask(li));
        
        li.addEventListener('contextmenu', (e) => { e.preventDefault(); silentDeleteTask(task.id); });
        let pressTimer;
        li.addEventListener('touchstart', () => { pressTimer = window.setTimeout(() => silentDeleteTask(task.id), 800); });
        li.addEventListener('touchend', () => clearTimeout(pressTimer));
        li.addEventListener('touchmove', () => clearTimeout(pressTimer));

        li.innerHTML = `<span class="task-title">${escapeHtml(task.title)}</span><div class="task-right"><span class="task-money">¥ ${escapeHtml(task.money)}</span></div>`;
        taskListEl.appendChild(li);
    });
}

function silentDeleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (confirm(`「${task.title}」を削除しますか？`)) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveData(); renderTasks();
    }
}

function completeTask(taskItemEl) {
    const taskId = taskItemEl.dataset.id;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const completedTask = tasks[taskIndex];
    const money = parseInt(completedTask.money, 10);
    totalAmount += money;

    const today = new Date();
    const dateStr = today.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    
    historyData.push({
        historyId: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        date: dateStr, title: completedTask.title, money: money, timestamp: Date.now()
    });

    saveData(); renderTotalAmount(); startMoneyAnimation(); playCoinSound();
    taskItemEl.classList.add('completing');
    setTimeout(() => { tasks.splice(taskIndex, 1); saveData(); renderTasks(); }, 300);
}

addFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = newTitleInp.value.trim();
    const money = parseInt(newMoneyInp.value.replace(/[^0-9]/g, ''), 10);
    if (!title || !money) return;

    tasks.push({ id: Date.now().toString(), title: title, money: money.toString() });
    saveData(); renderTasks();
    newTitleInp.value = ''; newMoneyInp.value = '';
});

function switchView(target) {
    viewHome.style.display = target === 'home' ? 'block' : 'none';
    viewArchive.style.display = target === 'archive' ? 'block' : 'none';
    viewMypage.style.display = target === 'mypage' ? 'block' : 'none';
    homeControls.style.display = target === 'home' ? 'block' : 'none';

    navHome.classList.toggle('active', target === 'home');
    navArchive.classList.toggle('active', target === 'archive');
    navMypage.classList.toggle('active', target === 'mypage');
}

navHome.addEventListener('click', () => switchView('home'));
navArchive.addEventListener('click', () => { switchView('archive'); archiveTitleEl.innerText = motivationMessages[Math.floor(Math.random() * motivationMessages.length)]; renderChart(); });
navMypage.addEventListener('click', () => switchView('mypage'));

function renderChart() {
    const canvas = document.getElementById('historyChart');
    const ctx = canvas.getContext('2d');
    const labels = []; const data = []; let historySumTotal = 0;
    
    for(let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
        labels.push(d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })); 
        const dailySum = historyData.filter(h => h.date === dateStr).reduce((sum, current) => sum + current.money, 0);
        data.push(dailySum); historySumTotal += dailySum;
    }

    const averageValue = historyData.length > 0 ? (historySumTotal / 7) : 0;
    
    // ★現在のテーマカラーとプレースホルダーカラーを取得
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const pastColor = getComputedStyle(document.documentElement).getPropertyValue('--placeholder-color').trim();

    if(myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ 
                data: data, 
                // ★今日（最後）はテーマ色、過去はプレースホルダー色を適用
                backgroundColor: data.map((_, i) => i === data.length - 1 ? themeColor : pastColor), 
                borderRadius: 5 
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true, aspectRatio: 1.8,
            plugins: {
                legend: { display: false },
                annotation: { annotations: { line1: { type: 'line', yMin: averageValue, yMax: averageValue, borderColor: '#aaaaaa', borderWidth: 1.5, borderDash: [5, 5], label: { display: true, content: '平均', position: 'start', backgroundColor: 'transparent', color: '#aaaaaa', font: { size: 10 }, yAdjust: -10, xAdjust: 10 } } } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#aaaaaa', font: { size: 10 }, stepSize: 100 } },
                x: { grid: { display: false }, ticks: { color: '#aaaaaa', font: { size: 10 } } }
            }
        }
    });

    const historyListEl = document.getElementById('history-list');
    historyListEl.innerHTML = '';
    [...historyData].reverse().slice(0, 10).forEach(h => {
        const li = document.createElement('li'); li.className = 'history-item'; li.style.cursor = 'pointer';
        li.addEventListener('click', () => restoreTask(h.historyId));
        const dateParts = h.date.split('-');
        li.innerHTML = `<div><span class="history-date">${parseInt(dateParts[1])}/${parseInt(dateParts[2])}</span><span>${escapeHtml(h.title)}</span></div><span class="task-money">¥ ${h.money}</span>`;
        historyListEl.appendChild(li);
    });
}

function restoreTask(historyId) {
    const historyItem = historyData.find(h => h.historyId === historyId);
    if (!historyItem) return;
    if (confirm(`「${historyItem.title}」を未完了に戻しますか？`)) {
        totalAmount -= historyItem.money; if (totalAmount < 0) totalAmount = 0;
        tasks.push({ id: Date.now().toString(), title: historyItem.title, money: historyItem.money.toString() });
        historyData = historyData.filter(h => h.historyId !== historyId);
        saveData(); renderTotalAmount(); renderTasks(); renderChart();
    }
}

function startMoneyAnimation() {
    for (let i = 0; i < 10; i++) {
        const coin = document.createElement('div'); coin.className = 'coin';
        coin.innerText = coinsIcons[Math.floor(Math.random() * coinsIcons.length)];
        coin.style.left = Math.random() * 100 + 'vw'; coin.style.animationDelay = Math.random() * 0.3 + 's';
        animationContainer.appendChild(coin); coin.addEventListener('animationend', () => coin.remove());
    }
}

function playCoinSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext; const ctx = new AudioContext();
        const osc = ctx.createOscillator(); const gainNode = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(1500, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gainNode); gainNode.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
}

function escapeHtml(str) { return str ? str.replace(/[&<>"']/g, m => ({'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#39;'}[m])) : ''; }

init();
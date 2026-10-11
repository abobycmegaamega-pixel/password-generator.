// Password Generator Application
class PasswordGenerator {
    constructor() {
        this.settings = this.loadSettings();
        this.history = this.loadHistory();
        this.bulkPasswords = [];
        this.currentPin = '';
        this.historyFilter = '';
        this.isPronounceable = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTheme();
        this.applySettings();
        this.updateHistoryDisplay();
        this.generatePassword();
    }

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchPage(e.currentTarget.dataset.page));
        });

        document.getElementById('generateBtn').addEventListener('click', () => this.generatePassword());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyPassword());
        document.getElementById('refreshBtn').addEventListener('click', () => this.generatePassword());
        document.getElementById('toggleVisibilityBtn').addEventListener('click', () => this.togglePasswordVisibility());
        document.getElementById('lengthSlider').addEventListener('input', (e) => {
            document.getElementById('lengthValue').textContent = e.target.value;
            this.isPronounceable = false;
            this.generatePassword();
        });

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this.applyPreset(btn.dataset.preset));
        });

        ['uppercase', 'lowercase', 'numbers', 'symbols', 'excludeSimilar', 'excludeDuplicates', 'ensureEachType', 'autoCopy', 'autoSaveHistory'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.saveSettings());
        });

        document.getElementById('customExclude').addEventListener('input', () => this.saveSettings());
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
        document.getElementById('exportHistoryBtn').addEventListener('click', () => this.exportHistory('json'));
        document.getElementById('exportHistoryCsvBtn').addEventListener('click', () => this.exportHistory('csv'));
        document.getElementById('resetSettingsBtn').addEventListener('click', () => this.resetSettings());
        document.getElementById('historySearch').addEventListener('input', (e) => {
            this.historyFilter = e.target.value.toLowerCase();
            this.updateHistoryDisplay();
        });

        document.getElementById('themeSwitch').addEventListener('change', (e) => this.toggleTheme(e.target.checked));

        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzePassword());
        document.getElementById('analysisPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.analyzePassword();
        });
        document.getElementById('toggleAnalysisVisibility').addEventListener('click', () => {
            const input = document.getElementById('analysisPassword');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        document.getElementById('generatePassphraseBtn').addEventListener('click', () => this.generatePassphrase());
        document.getElementById('copyPassphraseBtn').addEventListener('click', () => this.copyText(document.getElementById('passphraseOutput').value, 'Фраза скопирована!'));

        document.getElementById('generateBulkBtn').addEventListener('click', () => this.generateBulk());
        document.getElementById('copyAllBulkBtn').addEventListener('click', () => this.copyAllBulk());
        document.getElementById('exportBulkBtn').addEventListener('click', () => this.exportBulk());

        document.getElementById('generatePinBtn').addEventListener('click', () => this.generatePIN());
        document.getElementById('copyPinBtn').addEventListener('click', () => this.copyText(this.currentPin, 'PIN скопирован!'));
        document.getElementById('pinLengthSlider').addEventListener('input', (e) => {
            document.getElementById('pinLengthValue').textContent = e.target.value;
        });

        document.getElementById('historyList').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const index = parseInt(btn.dataset.index, 10);
            const action = btn.dataset.action;
            if (action === 'copy') this.copyHistoryPassword(this.history[index].password);
            if (action === 'delete') this.deleteHistoryItem(index);
            if (action === 'reveal') this.toggleHistoryReveal(index, btn);
        });

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        window.addEventListener('beforeunload', () => this.saveSettings());
    }

    handleKeyboard(e) {
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            this.generatePassword();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            this.copyPassword();
        }
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            this.togglePasswordVisibility();
        }
    }

    switchPage(pageId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });

        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === `${pageId}-page`);
        });

        if (pageId === 'history') {
            this.updateHistoryDisplay();
        }
    }

    getCharSets() {
        const sets = [];
        if (document.getElementById('uppercase').checked) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ');
        if (document.getElementById('lowercase').checked) sets.push('abcdefghijkmnpqrstuvwxyz');
        if (document.getElementById('numbers').checked) sets.push('23456789');
        if (document.getElementById('symbols').checked) sets.push('!@#$%^&*');
        return sets;
    }

    buildCharset(sets) {
        let chars = sets.join('');
        if (chars === '') {
            chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        }

        if (document.getElementById('excludeSimilar').checked) {
            chars = chars.split('').filter(c => !'il1Lo0O'.includes(c)).join('');
        }

        const customExclude = document.getElementById('customExclude').value;
        if (customExclude) {
            const excludeSet = new Set(customExclude.split(''));
            chars = chars.split('').filter(c => !excludeSet.has(c)).join('');
        }

        return chars;
    }

    randomIndex(max) {
        const crypto = window.crypto || window.msCrypto;
        return crypto.getRandomValues(new Uint32Array(1))[0] % max;
    }

    shuffleArray(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.randomIndex(i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    generatePronounceablePassword(length) {
        const vowels = 'aeiou';
        const consonants = 'bcdfghjklmnpqrstvwxyz';
        let password = '';
        for (let i = 0; i < length; i++) {
            const pool = i % 2 === 0 ? consonants : vowels;
            password += pool[this.randomIndex(pool.length)];
        }
        if (document.getElementById('uppercase').checked) {
            password = password.charAt(0).toUpperCase() + password.slice(1);
        }
        if (document.getElementById('numbers').checked && length > 2) {
            const pos = this.randomIndex(password.length);
            password = password.slice(0, pos) + (2 + this.randomIndex(8)) + password.slice(pos + 1);
        }
        return password;
    }

    generatePassword(options = {}) {
        const length = options.length || parseInt(document.getElementById('lengthSlider').value, 10);
        const silent = options.silent || false;
        const skipUi = options.skipUi || false;

        if (this.isPronounceable && !skipUi) {
            const password = this.generatePronounceablePassword(length);
            this.setPasswordOutput(password, silent);
            return password;
        }

        const sets = this.getCharSets();
        let chars = this.buildCharset(sets);
        const excludeDuplicates = document.getElementById('excludeDuplicates').checked;
        const ensureEachType = document.getElementById('ensureEachType').checked;

        if (excludeDuplicates && chars.length < length) {
            if (!silent) this.showNotification('Недостаточно уникальных символов для заданной длины', 'warning');
            return '';
        }

        let password = '';

        if (ensureEachType && sets.length > 0) {
            sets.forEach(set => {
                const filtered = this.buildCharset([set]);
                if (filtered) password += filtered[this.randomIndex(filtered.length)];
            });
            while (password.length < length) {
                password += chars[this.randomIndex(chars.length)];
            }
            password = this.shuffleArray(password.split('')).join('').slice(0, length);
        } else if (excludeDuplicates) {
            const pool = chars.split('');
            password = this.shuffleArray(pool).slice(0, length).join('');
        } else {
            for (let i = 0; i < length; i++) {
                password += chars[this.randomIndex(chars.length)];
            }
        }

        if (!skipUi) {
            this.setPasswordOutput(password, silent);
        }
        return password;
    }

    setPasswordOutput(password, silent) {
        document.getElementById('password').value = password;
        this.updateStrengthIndicator(password);
        this.updateEntropyDisplay(password);

        if (document.getElementById('autoCopy').checked && password) {
            this.copyText(password, 'Пароль скопирован!', false);
        }

        if (document.getElementById('autoSaveHistory').checked && password) {
            this.saveToHistory(password, 'generated');
        }

        if (!silent && password) {
            document.getElementById('password').classList.add('flash');
            setTimeout(() => document.getElementById('password').classList.remove('flash'), 400);
        }
    }

    calculateEntropy(password, charsetSize) {
        if (!password || !charsetSize) return 0;
        return Math.round(password.length * Math.log2(charsetSize) * 10) / 10;
    }

    updateEntropyDisplay(password) {
        const sets = this.getCharSets();
        const charset = this.buildCharset(sets);
        const entropy = this.calculateEntropy(password, charset.length || 62);
        document.getElementById('entropyValue').textContent = entropy;
        document.getElementById('charsetInfo').textContent = `Алфавит: ${charset.length} символов`;
    }

    applyPreset(preset) {
        this.isPronounceable = false;
        const lengthSlider = document.getElementById('lengthSlider');
        const presets = {
            balanced: { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeSimilar: true, ensureEachType: true },
            maximum: { length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeSimilar: true, ensureEachType: true, excludeDuplicates: false },
            simple: { length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false, excludeSimilar: true, ensureEachType: true },
            pronounceable: { length: 14, uppercase: true, lowercase: true, numbers: true, symbols: false }
        };

        const config = presets[preset];
        if (!config) return;

        if (preset === 'pronounceable') {
            this.isPronounceable = true;
        }

        lengthSlider.value = config.length;
        document.getElementById('lengthValue').textContent = config.length;
        document.getElementById('uppercase').checked = config.uppercase;
        document.getElementById('lowercase').checked = config.lowercase;
        document.getElementById('numbers').checked = config.numbers;
        document.getElementById('symbols').checked = config.symbols;
        document.getElementById('excludeSimilar').checked = !!config.excludeSimilar;
        document.getElementById('ensureEachType').checked = !!config.ensureEachType;
        if ('excludeDuplicates' in config) {
            document.getElementById('excludeDuplicates').checked = config.excludeDuplicates;
        }

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === preset);
        });

        this.saveSettings();
        this.showNotification(`Профиль «${preset}» применён`, 'info');
    }

    togglePasswordVisibility() {
        const input = document.getElementById('password');
        const icon = document.querySelector('#toggleVisibilityBtn i');
        input.type = input.type === 'password' ? 'text' : 'password';
        icon.className = input.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }

    updateStrengthIndicator(password) {
        let strength = 0;

        if (password.length >= 16) strength += 25;
        else if (password.length >= 12) strength += 20;
        else if (password.length >= 8) strength += 15;
        else strength += 5;

        if (/[A-Z]/.test(password)) strength += 20;
        if (/[a-z]/.test(password)) strength += 20;
        if (/[0-9]/.test(password)) strength += 20;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        strength = Math.min(strength, 100);

        const fillElement = document.getElementById('strengthFill');
        const labelElement = document.getElementById('strengthLabel');
        const scoreElement = document.getElementById('strengthScore');

        fillElement.style.width = `${strength}%`;
        scoreElement.textContent = `${strength}/100`;

        if (strength < 40) {
            fillElement.style.background = '#ef4444';
            labelElement.textContent = 'Слабый';
        } else if (strength < 70) {
            fillElement.style.background = '#f59e0b';
            labelElement.textContent = 'Средний';
        } else {
            fillElement.style.background = '#10b981';
            labelElement.textContent = 'Сильный';
        }
    }

    copyPassword() {
        const password = document.getElementById('password').value;
        if (password) {
            this.copyText(password, 'Пароль скопирован!', true);
        }
    }

    copyText(text, message, saveHistory = false) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            if (saveHistory) this.saveToHistory(text, 'copied');
            this.showNotification(message, 'success');
        });
    }

    generatePassphrase() {
        const words = [
            'apple', 'river', 'cloud', 'tiger', 'stone', 'light', 'storm', 'eagle',
            'forest', 'ocean', 'planet', 'shadow', 'crystal', 'thunder', 'silver',
            'dragon', 'ember', 'frost', 'maple', 'orbit', 'pixel', 'quest', 'rocket',
            'solar', 'violet', 'wave', 'zenith', 'anchor', 'blaze', 'comet', 'delta',
            'flame', 'glacier', 'harbor', 'ivory', 'jungle', 'knight', 'lunar', 'meadow',
            'nova', 'oasis', 'prism', 'quartz', 'ridge', 'spark', 'terra', 'ultra'
        ];

        const count = parseInt(document.getElementById('wordCount').value, 10);
        const separator = document.getElementById('wordSeparator').value;
        const capitalize = document.getElementById('capitalizeWords').checked;
        const addNumber = document.getElementById('addPassphraseNumber').checked;

        const selected = [];
        for (let i = 0; i < count; i++) {
            let word = words[this.randomIndex(words.length)];
            if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
            selected.push(word);
        }

        let passphrase = selected.join(separator);
        if (addNumber) passphrase += separator + (10 + this.randomIndex(990));

        document.getElementById('passphraseOutput').value = passphrase;
        this.saveToHistory(passphrase, 'passphrase');
        this.showNotification('Фраза-пароль сгенерирована!', 'success');
    }

    generateBulk() {
        const count = parseInt(document.getElementById('bulkCount').value, 10);
        const length = parseInt(document.getElementById('bulkLength').value, 10);
        const seen = new Set();
        this.bulkPasswords = [];

        let attempts = 0;
        while (this.bulkPasswords.length < count && attempts < count * 20) {
            const pwd = this.generatePassword({ length, silent: true, skipUi: true });
            if (pwd && !seen.has(pwd)) {
                seen.add(pwd);
                this.bulkPasswords.push(pwd);
            }
            attempts++;
        }

        const list = document.getElementById('bulkList');
        list.innerHTML = this.bulkPasswords.map((pwd, i) => `
            <div class="bulk-item">
                <span class="bulk-index">${i + 1}.</span>
                <code>${this.escapeHtml(pwd)}</code>
                <button class="bulk-copy-btn" data-bulk-index="${i}" title="Копировать">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `).join('');

        list.querySelectorAll('[data-bulk-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.copyText(this.bulkPasswords[btn.dataset.bulkIndex], 'Пароль скопирован!');
            });
        });

        document.getElementById('copyAllBulkBtn').disabled = this.bulkPasswords.length === 0;
        document.getElementById('exportBulkBtn').disabled = this.bulkPasswords.length === 0;
        this.showNotification(`Сгенерировано ${this.bulkPasswords.length} паролей`, 'success');
    }

    copyAllBulk() {
        if (this.bulkPasswords.length === 0) return;
        this.copyText(this.bulkPasswords.join('\n'), 'Все пароли скопированы!');
    }

    exportBulk() {
        if (this.bulkPasswords.length === 0) return;
        this.downloadFile('passwords.txt', this.bulkPasswords.join('\n'), 'text/plain');
        this.showNotification('Файл passwords.txt скачан', 'success');
    }

    generatePIN() {
        const length = parseInt(document.getElementById('pinLengthSlider').value, 10);
        const noRepeat = document.getElementById('pinNoRepeat').checked;
        const digits = '0123456789';

        if (noRepeat && length > 10) {
            this.showNotification('Без повторов PIN может быть максимум 10 цифр', 'warning');
            return;
        }

        let pin = '';
        const used = new Set();

        while (pin.length < length) {
            const d = digits[this.randomIndex(digits.length)];
            if (noRepeat && used.has(d)) continue;
            used.add(d);
            pin += d;
        }

        this.currentPin = pin;
        document.getElementById('pinDisplay').textContent = pin;
        this.saveToHistory(pin, 'pin');
        this.showNotification('PIN сгенерирован!', 'success');
    }

    saveToHistory(password, source = 'copied') {
        const now = new Date();
        this.history.unshift({
            password,
            date: now.toISOString(),
            timestamp: now.getTime(),
            source,
            length: password.length
        });

        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }

        localStorage.setItem('passwordHistory', JSON.stringify(this.history));
        this.updateHistoryDisplay();
    }

    getFilteredHistory() {
        if (!this.historyFilter) return this.history;
        return this.history.filter(item => {
            const dateStr = new Date(item.date).toLocaleString('ru-RU').toLowerCase();
            const source = (item.source || '').toLowerCase();
            const len = String(item.length || item.password.length);
            return dateStr.includes(this.historyFilter) || source.includes(this.historyFilter) || len.includes(this.historyFilter);
        });
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        const totalPasswords = document.getElementById('totalPasswords');
        const thisWeekCount = document.getElementById('thisWeekCount');
        const avgLength = document.getElementById('avgLength');

        if (!historyList) return;

        const filtered = this.getFilteredHistory();

        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>История пуста</p>
                    <span>Сгенерируйте и сохраните первый пароль</span>
                </div>
            `;
            if (totalPasswords) totalPasswords.textContent = '0';
            if (thisWeekCount) thisWeekCount.textContent = '0';
            if (avgLength) avgLength.textContent = '0';
            return;
        }

        if (totalPasswords) totalPasswords.textContent = this.history.length;

        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const weekCount = this.history.filter(item => item.timestamp > oneWeekAgo).length;
        if (thisWeekCount) thisWeekCount.textContent = weekCount;

        const avg = Math.round(this.history.reduce((sum, item) => sum + (item.length || item.password.length), 0) / this.history.length);
        if (avgLength) avgLength.textContent = avg;

        if (filtered.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Ничего не найдено</p>
                    <span>Попробуйте другой запрос</span>
                </div>
            `;
            return;
        }

        historyList.innerHTML = filtered.map(item => {
            const realIndex = this.history.indexOf(item);
            const sourceLabel = { generated: 'Генератор', copied: 'Копирование', passphrase: 'Фраза', pin: 'PIN' }[item.source] || '—';
            return `
            <div class="history-item">
                <div>
                    <div class="history-password" data-revealed="false" id="hist-pwd-${realIndex}">${this.maskPassword(item.password)}</div>
                    <div class="history-meta">
                        <span class="history-date">${new Date(item.date).toLocaleString('ru-RU')}</span>
                        <span class="history-badge">${sourceLabel}</span>
                        <span class="history-badge">${item.length || item.password.length} симв.</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button data-action="reveal" data-index="${realIndex}" title="Показать">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button data-action="copy" data-index="${realIndex}" title="Копировать">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button data-action="delete" data-index="${realIndex}" title="Удалить" class="danger-icon">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `}).join('');
    }

    maskPassword(password) {
        if (password.length <= 8) return password;
        return password.substring(0, 4) + '••••' + password.substring(password.length - 4);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleHistoryReveal(index, btn) {
        const item = this.history[index];
        const el = document.getElementById(`hist-pwd-${index}`);
        const revealed = el.dataset.revealed === 'true';
        el.textContent = revealed ? this.maskPassword(item.password) : item.password;
        el.dataset.revealed = revealed ? 'false' : 'true';
        btn.querySelector('i').className = revealed ? 'fas fa-eye' : 'fas fa-eye-slash';
    }

    copyHistoryPassword(password) {
        this.copyText(password, 'Пароль скопирован из истории!');
    }

    deleteHistoryItem(index) {
        this.history.splice(index, 1);
        localStorage.setItem('passwordHistory', JSON.stringify(this.history));
        this.updateHistoryDisplay();
        this.showNotification('Запись удалена', 'info');
    }

    clearHistory() {
        if (confirm('Вы уверены, что хотите очистить всю историю паролей?')) {
            this.history = [];
            localStorage.removeItem('passwordHistory');
            this.updateHistoryDisplay();
            this.showNotification('История очищена', 'info');
        }
    }

    exportHistory(format) {
        if (this.history.length === 0) {
            this.showNotification('История пуста', 'warning');
            return;
        }

        if (format === 'json') {
            const data = JSON.stringify(this.history.map(({ password, ...rest }) => ({
                ...rest,
                passwordMasked: this.maskPassword(password)
            })), null, 2);
            this.downloadFile('password-history.json', data, 'application/json');
        } else {
            const rows = ['date,source,length,password'];
            this.history.forEach(item => {
                rows.push(`"${item.date}","${item.source || ''}",${item.length || item.password.length},"${item.password.replace(/"/g, '""')}"`);
            });
            this.downloadFile('password-history.csv', rows.join('\n'), 'text/csv');
        }
        this.showNotification('История экспортирована', 'success');
    }

    downloadFile(filename, content, mime) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    resetSettings() {
        if (!confirm('Сбросить все настройки к значениям по умолчанию?')) return;
        localStorage.removeItem('passwordSettings');
        this.settings = this.loadSettings();
        this.applySettings();
        this.generatePassword();
        this.showNotification('Настройки сброшены', 'info');
    }

    analyzePassword() {
        const password = document.getElementById('analysisPassword').value;
        if (!password) {
            this.showNotification('Введите пароль для анализа', 'warning');
            return;
        }

        let strength = 0;
        let details = {
            length: password.length,
            uppercase: (password.match(/[A-Z]/g) || []).length,
            lowercase: (password.match(/[a-z]/g) || []).length,
            numbers: (password.match(/[0-9]/g) || []).length,
            symbols: (password.match(/[^A-Za-z0-9]/g) || []).length
        };

        if (details.length >= 12) strength += 25;
        else if (details.length >= 8) strength += 15;
        else strength += 5;

        if (details.uppercase > 0) strength += 20;
        if (details.lowercase > 0) strength += 20;
        if (details.numbers > 0) strength += 20;
        if (details.symbols > 0) strength += 25;

        strength = Math.min(strength, 100);

        let charset = 0;
        if (details.uppercase > 0) charset += 26;
        if (details.lowercase > 0) charset += 26;
        if (details.numbers > 0) charset += 10;
        if (details.symbols > 0) charset += 32;
        if (charset === 0) charset = 26;

        const entropy = this.calculateEntropy(password, charset);

        let crackTime = this.calculateCrackTime(password.length, details.uppercase > 0,
            details.lowercase > 0, details.numbers > 0, details.symbols > 0);

        document.getElementById('analysisResult').style.display = 'block';
        const resultFill = document.getElementById('resultFill');
        const resultScore = document.getElementById('resultScore');

        resultFill.style.width = `${strength}%`;

        if (strength < 40) {
            resultFill.style.background = '#ef4444';
            resultScore.innerHTML = `<span style="color: #ef4444;">Слабый (${strength}/100)</span>`;
        } else if (strength < 70) {
            resultFill.style.background = '#f59e0b';
            resultScore.innerHTML = `<span style="color: #f59e0b;">Средний (${strength}/100)</span>`;
        } else {
            resultFill.style.background = '#10b981';
            resultScore.innerHTML = `<span style="color: #10b981;">Сильный (${strength}/100)</span>`;
        }

        document.getElementById('detailLength').textContent = details.length;
        document.getElementById('detailUppercase').textContent = details.uppercase;
        document.getElementById('detailLowercase').textContent = details.lowercase;
        document.getElementById('detailNumbers').textContent = details.numbers;
        document.getElementById('detailSymbols').textContent = details.symbols;
        document.getElementById('detailEntropy').textContent = `${entropy} бит`;
        document.getElementById('detailCrackTime').textContent = crackTime;
        document.getElementById('detailGrade').textContent = strength >= 80 ? 'A' : strength >= 60 ? 'B' : strength >= 40 ? 'C' : 'D';

        this.checkWeakPassword(password);

        let feedback = this.getFeedback(strength, details);
        document.getElementById('resultFeedback').innerHTML = feedback;
    }

    checkWeakPassword(password) {
        const weakList = [
            'password', '123456', '12345678', 'qwerty', 'admin', 'letmein',
            'welcome', 'monkey', 'dragon', 'master', 'sunshine', 'princess',
            'football', 'iloveyou', 'password1', '123456789', 'qwerty123'
        ];
        const lower = password.toLowerCase();
        const breachEl = document.getElementById('breachStatus');
        const breachBox = document.getElementById('breachCheck');

        const isWeak = weakList.some(w => lower.includes(w)) || /^(.)\1+$/.test(password) || /^(\d+)\1*$/.test(password);

        if (isWeak) {
            breachEl.textContent = '⚠️ Пароль похож на часто используемый или слишком простой шаблон';
            breachBox.className = 'breach-check weak';
        } else if (password.length < 8) {
            breachEl.textContent = '⚠️ Слишком короткий пароль';
            breachBox.className = 'breach-check weak';
        } else {
            breachEl.textContent = '✅ Не найден в списке типичных слабых паролей';
            breachBox.className = 'breach-check safe';
        }
    }

    calculateCrackTime(length, hasUpper, hasLower, hasNumbers, hasSymbols) {
        let charset = 0;
        if (hasUpper) charset += 26;
        if (hasLower) charset += 26;
        if (hasNumbers) charset += 10;
        if (hasSymbols) charset += 32;

        if (charset === 0) return 'менее секунды';

        const combinations = Math.pow(charset, length);
        const attemptsPerSecond = 1000000000;
        const seconds = combinations / attemptsPerSecond;

        if (seconds < 1) return 'менее секунды';
        if (seconds < 60) return `${Math.floor(seconds)} секунд`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} минут`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} часов`;
        if (seconds < 31536000) return `${Math.floor(seconds / 86400)} дней`;
        if (seconds < 31536000 * 1000) return `${Math.floor(seconds / 31536000)} лет`;
        return 'тысячи лет';
    }

    getFeedback(strength, details) {
        if (strength >= 80) {
            return '✅ Отлично! Это очень надёжный пароль. Продолжайте использовать такие сложные пароли.';
        } else if (strength >= 60) {
            let suggestions = [];
            if (details.length < 12) suggestions.push('увеличить длину до 12+ символов');
            if (details.symbols === 0) suggestions.push('добавить специальные символы');
            if (suggestions.length > 0) {
                return `⚠️ Хороший пароль, но можно улучшить: ${suggestions.join(', ')}.`;
            }
            return '⚠️ Неплохой пароль, но есть потенциал для улучшения.';
        } else {
            let suggestions = [];
            if (details.length < 8) suggestions.push('использовать минимум 8 символов');
            if (details.uppercase === 0) suggestions.push('добавить заглавные буквы');
            if (details.lowercase === 0) suggestions.push('добавить строчные буквы');
            if (details.numbers === 0) suggestions.push('добавить цифры');
            if (details.symbols === 0) suggestions.push('добавить специальные символы');
            return `❌ Слабый пароль! Рекомендации: ${suggestions.join(', ')}.`;
        }
    }

    saveSettings() {
        this.settings = {
            uppercase: document.getElementById('uppercase').checked,
            lowercase: document.getElementById('lowercase').checked,
            numbers: document.getElementById('numbers').checked,
            symbols: document.getElementById('symbols').checked,
            excludeSimilar: document.getElementById('excludeSimilar').checked,
            excludeDuplicates: document.getElementById('excludeDuplicates').checked,
            ensureEachType: document.getElementById('ensureEachType').checked,
            autoCopy: document.getElementById('autoCopy').checked,
            autoSaveHistory: document.getElementById('autoSaveHistory').checked,
            customExclude: document.getElementById('customExclude').value
        };
        localStorage.setItem('passwordSettings', JSON.stringify(this.settings));
        this.isPronounceable = false;
        this.generatePassword();
    }

    loadSettings() {
        const saved = localStorage.getItem('passwordSettings');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
            excludeSimilar: false,
            excludeDuplicates: false,
            ensureEachType: false,
            autoCopy: false,
            autoSaveHistory: false,
            customExclude: ''
        };
    }

    loadHistory() {
        const saved = localStorage.getItem('passwordHistory');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }

    applySettings() {
        document.getElementById('uppercase').checked = this.settings.uppercase;
        document.getElementById('lowercase').checked = this.settings.lowercase;
        document.getElementById('numbers').checked = this.settings.numbers;
        document.getElementById('symbols').checked = this.settings.symbols;
        document.getElementById('excludeSimilar').checked = this.settings.excludeSimilar;
        document.getElementById('excludeDuplicates').checked = this.settings.excludeDuplicates ?? false;
        document.getElementById('ensureEachType').checked = this.settings.ensureEachType ?? false;
        document.getElementById('autoCopy').checked = this.settings.autoCopy ?? false;
        document.getElementById('autoSaveHistory').checked = this.settings.autoSaveHistory ?? false;
        document.getElementById('customExclude').value = this.settings.customExclude ?? '';
    }

    toggleTheme(isDark) {
        if (isDark) {
            document.body.classList.remove('light');
        } else {
            document.body.classList.add('light');
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme !== 'light';
        document.getElementById('themeSwitch').checked = isDark;
        if (!isDark) {
            document.body.classList.add('light');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const icon = notification.querySelector('i');
        const span = notification.querySelector('span');

        icon.className = type === 'success' ? 'fas fa-check-circle' :
            type === 'warning' ? 'fas fa-exclamation-triangle' :
                'fas fa-info-circle';

        notification.style.background = type === 'warning' ? 'var(--warning)' :
            type === 'info' ? 'var(--accent-primary)' : 'var(--success)';

        span.textContent = message;

        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

let passwordGenerator;

document.addEventListener('DOMContentLoaded', () => {
    passwordGenerator = new PasswordGenerator();
    window.passwordGenerator = passwordGenerator;
});

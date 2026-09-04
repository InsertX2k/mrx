(() => {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let commandTable = {};
    let cmdHistory = [];
    let historyIndex = -1;
    let skipBoot = false;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, skipBoot ? 0 : ms));

    const bootLines = [
        { text: '[ OK ] Initializing insertx2k_dev.sh', cls: 'ok' },
        { text: '[ OK ] Mounting /home/ziad', cls: 'ok' },
        { text: '[ OK ] Starting portfolio.service', cls: 'ok' },
        { text: '[WARN] Coffee levels low', cls: 'warn' },
        { text: '[ OK ] Establishing uplink to github.com', cls: 'ok' },
        { text: '', cls: '' },
        { text: 'insertx2k_dev v5.0.0 — channel: stable', cls: '' },
        { text: "Type 'help' to see available commands.", cls: '' },
    ];

    /* ---------------------------------------------------------------
       Boot sequence
       --------------------------------------------------------------- */

    async function typeBoot() {
        const boot = document.getElementById('boot');
        boot.textContent = '';

        if (reducedMotion) {
            bootLines.forEach((line) => {
                const span = document.createElement('span');
                if (line.cls) span.className = line.cls;
                span.textContent = line.text;
                boot.appendChild(span);
                boot.appendChild(document.createTextNode('\n'));
            });
            return;
        }

        for (const line of bootLines) {
            const span = document.createElement('span');
            if (line.cls) span.className = line.cls;
            boot.appendChild(span);
            for (const ch of line.text) {
                span.textContent += ch;
                await sleep(6 + Math.random() * 12);
            }
            boot.appendChild(document.createTextNode('\n'));
            await sleep(60);
        }
        await sleep(200);
    }

    function armBootSkip() {
        const skip = () => { skipBoot = true; };
        document.getElementById('term').addEventListener('click', skip, { once: true });
        window.addEventListener('keydown', skip, { once: true });
    }

    function revealMain() {
        const main = document.getElementById('main');
        main.classList.add('is-visible');
    }

    /* ---------------------------------------------------------------
       Command table — built from the real DOM rows, so the markup
       stays the single source of truth (add a row, get a command).
       --------------------------------------------------------------- */

    function buildCommandTable() {
        const table = {};
        document.querySelectorAll('[data-cmd]').forEach((el) => {
            const key = el.dataset.cmd.toLowerCase();
            const nameEl = el.querySelector('.fs-row__name');
            table[key] = {
                label: nameEl ? nameEl.textContent.trim() : key,
                action: el.dataset.action || 'nav',
                href: el.getAttribute('href') || null,
                value: el.dataset.value || null,
            };
        });
        return table;
    }

    /* ---------------------------------------------------------------
       Shell transcript helpers
       --------------------------------------------------------------- */

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function promptRow() {
        return document.querySelector('.row--prompt');
    }

    function scrollToBottom() {
        const body = document.getElementById('termBody');
        body.scrollTop = body.scrollHeight;
    }

    function echoCommand(raw) {
        const line = document.createElement('div');
        line.className = 'shell-line';
        line.innerHTML = '<span class="ps1"><span class="ps1__user">guest@insertx2k</span>'
            + '<span class="ps1__path">:~$</span></span> ' + escapeHTML(raw);
        promptRow().before(line);
        scrollToBottom();
    }

    function printOutput(text, variant) {
        const p = document.createElement('p');
        p.className = 'shell-output' + (variant ? ' shell-output--' + variant : '');
        p.textContent = text;
        promptRow().before(p);
        scrollToBottom();
        return p;
    }

    function clearShell() {
        document.querySelectorAll('.shell-line, .shell-output').forEach((el) => el.remove());
    }

    /* ---------------------------------------------------------------
       Commands
       --------------------------------------------------------------- */

    function printHelp() {
        const names = Object.keys(commandTable);
        const lines = [
            'available commands:',
            '  help                    show this list',
            '  ls, ls projects, ls links   list entries',
            '  cat about.txt           print bio',
            '  open <name>             open a project or link',
            '  <name>                  shortcut for "open <name>"',
            '  clear                   clear this terminal',
            '  history                 show command history',
            '  date, echo <text>       the usual suspects',
            '',
            'entries: ' + names.join(', '),
        ];
        printOutput(lines.join('\n'));
    }

    function printListing(containerId) {
        const container = document.getElementById(containerId);
        const rows = [...container.querySelectorAll('[data-cmd]')];
        const lines = rows.map((row) => {
            const perm = row.querySelector('.fs-row__perm').textContent;
            const name = row.querySelector('.fs-row__name').textContent;
            const note = row.querySelector('.fs-row__note').textContent;
            return perm + '  ' + name.padEnd(20) + ' # ' + note;
        });
        printOutput(lines.join('\n'));
    }

    function printBio() {
        printOutput(
            'Ziad Ahmed — aka Mr.X / Insertx2k Dev\n'
            + 'Desktop software developer, widely known for Temp_Cleaner GUI.'
        );
    }

    function copyToClipboard(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value)
                .then(() => printOutput('copied "' + value + '" to clipboard ✓', 'warn'))
                .catch(() => printOutput("couldn't reach the clipboard — here's the tag: " + value, 'error'));
        } else {
            printOutput("clipboard isn't available here — here's the tag: " + value, 'error');
        }
    }

    function lookupTable(name) {
        const entry = commandTable[name];
        if (!entry) return false;
        if (entry.action === 'copy') {
            copyToClipboard(entry.value);
        } else if (entry.href) {
            window.open(entry.href, '_blank', 'noopener');
            printOutput('opening ' + entry.label + '…', 'dim');
        }
        return true;
    }

    function runMatrix() {
        if (reducedMotion) {
            printOutput('(skipping the matrix rain — reduced motion is on)', 'dim');
            return;
        }
        printOutput('...you know there\u2019s no spoon, right?', 'dim');

        const canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
            position: 'fixed', inset: '0', zIndex: '60',
            pointerEvents: 'none', opacity: '0', transition: 'opacity 0.4s ease',
        });
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const fontSize = 16;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = new Array(columns).fill(1);
        const chars = 'アイウエオカキクケコサシスセソ0123456789ZIAD';

        requestAnimationFrame(() => { canvas.style.opacity = '1'; });

        let frame = 0;
        const maxFrames = 130;
        const timer = setInterval(() => {
            ctx.fillStyle = 'rgba(5, 9, 6, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#a9f4c9';
            ctx.font = fontSize + 'px monospace';
            drops.forEach((y, i) => {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, y * fontSize);
                if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            });
            frame++;
            if (frame > maxFrames) {
                clearInterval(timer);
                canvas.style.opacity = '0';
                setTimeout(() => canvas.remove(), 450);
            }
        }, 40);
    }

    function runCommand(raw) {
        const parts = raw.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const rest = parts.slice(1).join(' ').toLowerCase();

        switch (cmd) {
            case 'help':
                printHelp();
                break;
            case 'ls':
            case 'll':
                if (rest.includes('link')) printListing('links');
                else if (rest.includes('project')) printListing('projects');
                else { printListing('projects'); printListing('links'); }
                break;
            case 'projects':
                printListing('projects');
                break;
            case 'links':
                printListing('links');
                break;
            case 'whoami':
                printBio();
                break;
            case 'cat':
                if (!rest) { printOutput("cat: missing operand — try 'cat about.txt'", 'error'); break; }
                if (rest.includes('about') || rest.includes('readme')) { printBio(); break; }
                if (!lookupTable(rest)) printOutput('cat: ' + rest + ': No such file', 'error');
                break;
            case 'open':
                if (!rest) { printOutput("open: missing operand — try 'open github'", 'error'); break; }
                if (!lookupTable(rest)) printOutput('open: ' + rest + ': command not found', 'error');
                break;
            case 'pwd':
                printOutput('/home/ziad/portfolio');
                break;
            case 'cd':
                printOutput("cd: there's nowhere else to go — this whole page is one directory. try 'open <name>'", 'dim');
                break;
            case 'clear':
                clearShell();
                break;
            case 'history':
                printOutput(cmdHistory.length ? cmdHistory.join('\n') : '(empty)');
                break;
            case 'date':
                printOutput(new Date().toString());
                break;
            case 'echo':
                printOutput(parts.slice(1).join(' '));
                break;
            case 'sudo':
                printOutput('guest is not in the sudoers file. this incident will be reported. (it will not)', 'error');
                break;
            case 'matrix':
                runMatrix();
                break;
            case 'exit':
            case 'quit':
                printOutput("this isn't that kind of terminal — try closing the tab. or don't.", 'dim');
                break;
            default:
                if (!lookupTable(cmd)) {
                    printOutput("bash: " + cmd + ": command not found — type 'help' for a list of commands", 'error');
                }
        }
    }

    /* ---------------------------------------------------------------
       Live input line
       --------------------------------------------------------------- */

    function initShell() {
        const row = promptRow();
        const staticCursor = row.querySelector('.static-cursor');
        if (staticCursor) staticCursor.remove();

        const inputRow = document.createElement('div');
        inputRow.className = 'shell-input-row';

        const label = document.createElement('label');
        label.className = 'visually-hidden';
        label.setAttribute('for', 'shellInput');
        label.textContent = 'Type a command';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'shellInput';
        input.className = 'shell-input';
        input.autocomplete = 'off';
        input.autocapitalize = 'off';
        input.spellcheck = false;
        input.setAttribute('aria-label', "Type a command, try 'help'");

        inputRow.appendChild(label);
        inputRow.appendChild(input);
        row.appendChild(inputRow);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const raw = input.value;
                if (raw.trim()) {
                    echoCommand(raw);
                    cmdHistory.push(raw.trim());
                    historyIndex = cmdHistory.length;
                    runCommand(raw);
                }
                input.value = '';
                scrollToBottom();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (cmdHistory.length) {
                    historyIndex = Math.max(0, historyIndex - 1);
                    input.value = cmdHistory[historyIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (cmdHistory.length) {
                    historyIndex = Math.min(cmdHistory.length, historyIndex + 1);
                    input.value = cmdHistory[historyIndex] || '';
                }
            }
        });

        document.getElementById('termBody').addEventListener('click', (e) => {
            if (window.getSelection().toString()) return;
            if (e.target.closest('a, button')) return;
            input.focus();
        });

        if (canHover) input.focus();
    }

    /* ---------------------------------------------------------------
       Discord copy button (works even before the shell is wired up)
       --------------------------------------------------------------- */

    function wireDiscordButton() {
        const btn = document.querySelector('[data-cmd="discord"][data-action="copy"]');
        if (!btn) return;
        btn.addEventListener('click', () => copyToClipboard(btn.dataset.value));
    }

    /* ---------------------------------------------------------------
       Init
       --------------------------------------------------------------- */

    async function init() {
        document.documentElement.classList.add('js');
        commandTable = buildCommandTable();
        wireDiscordButton();
        armBootSkip();
        try {
            await typeBoot();
        } catch (err) {
            console.error(err);
        } finally {
            revealMain();
            initShell();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

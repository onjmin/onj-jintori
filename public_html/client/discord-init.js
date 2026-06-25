import { DiscordSDK, patchUrlMappings } from '../discord-sdk.js';

const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';

// ─── ステータス表示 ──────────────────────────────────────────
const discordDot = document.getElementById('discord-dot');
const statusText = document.getElementById('status-text');
const bootMsg = document.getElementById('boot-msg');

const setStatus = (state, msg) => {
    if (statusText) statusText.textContent = msg;
    if (discordDot) discordDot.className = state || '';
};

// ─── イベントバインディング（CSP準拠のためにinline onclick不使用） ──
function bindEvents() {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.addEventListener('click', () => window.startGame?.());

    const teamSelect = document.getElementById('team-select');
    if (teamSelect) {
        teamSelect.addEventListener('change', () => window.selectExistingTeam?.(teamSelect.value));
    }

    const emojiBtn = document.getElementById('emoji-picker-btn');
    if (emojiBtn) emojiBtn.addEventListener('click', () => window.toggleEmojiPicker?.());

    const flagSelect = document.getElementById('flag-select');
    if (flagSelect) {
        const flags = [
            ['','🏳️ なし'],['🇯🇵','🇯🇵 日本'],['🇺🇸','🇺🇸 アメリカ'],
            ['🇬🇧','🇬🇧 イギリス'],['🇰🇷','🇰🇷 韓国'],['🇨🇳','🇨🇳 中国'],
            ['🇹🇼','🇹🇼 台湾'],['🇩🇪','🇩🇪 ドイツ'],['🇫🇷','🇫🇷 フランス'],
            ['🇮🇹','🇮🇹 イタリア'],['🇪🇸','🇪🇸 スペイン'],['🇧🇷','🇧🇷 ブラジル'],
            ['🇷🇺','🇷🇺 ロシア'],['🇺🇦','🇺🇦 ウクライナ'],['🇮🇳','🇮🇳 インド'],
            ['🇦🇺','🇦🇺 オーストラリア'],['🇨🇦','🇨🇦 カナダ'],['🇲🇽','🇲🇽 メキシコ'],
            ['🇸🇦','🇸🇦 サウジ'],['🇹🇭','🇹🇭 タイ'],['🇻🇳','🇻🇳 ベトナム'],
            ['🇵🇭','🇵🇭 フィリピン'],['🇻🇪','🇻🇪 ベネズエラ'],['🍂','🍂 落ち葉'],
        ];
        flags.forEach(([val, label]) => {
            const opt = document.createElement('option');
            opt.value = val; opt.textContent = label;
            flagSelect.appendChild(opt);
        });
    }
}
bindEvents();

// ─── 起動処理 ──────────────────────────────────────────────
async function boot() {
    try {
        patchUrlMappings([
            { prefix: '/.proxy/cdnjs', target: 'cdnjs.cloudflare.com' },
        ]);
    } catch (_) {}

    let discordName = null;
    try {
        const sdk = new DiscordSDK(CLIENT_ID);
        await Promise.race([
            sdk.ready(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        const auth = await sdk.commands.authenticate({ access_token: true });
        discordName = auth.user.username.slice(0, 8);
        setStatus('connected', `DISCORD: ${auth.user.username}`);
    } catch (e) {
        const isTimeout = e?.message === 'timeout';
        setStatus('error', isTimeout ? 'STANDALONE MODE' : 'DISCORD ERROR');
    }

    if (bootMsg) bootMsg.remove();

    const input = document.getElementById('username-input');
    if (input && discordName) input.value = discordName;

    setTimeout(() => {
        const tryStart = () => {
            if (window.socket?.readyState === WebSocket.OPEN) {
                window.startGame?.();
                return true;
            }
            return false;
        };
        if (!tryStart()) {
            const iv = setInterval(() => {
                if (tryStart()) clearInterval(iv);
            }, 300);
            setTimeout(() => clearInterval(iv), 15000);
        }
    }, 1500);
}

boot().catch(e => {
    console.error('[Zinti] Fatal:', e);
    if (bootMsg) bootMsg.textContent = '⚠ ERROR';
});

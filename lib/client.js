/**
 * dsh-answer-style — browser half.
 *
 * Scope: the Assistant rows of the chat transcript
 * (`[data-chat-flow-kind="assistant-step"]`), i.e. the model's answers
 * (including the reasoning text inside them). User messages, tool rows and
 * the rest of the UI keep the theme's typography.
 *
 * Mechanics: one `<style>` element in `document.head` carrying `!important`
 * declarations that beat the theme's own markdown rules. The markdown root
 * carries a CSS-module class (`_markdown_<hash>_<n>`), so the selectors also
 * match `[class*="_markdown_"]` and fall back to the block-level text
 * elements, which keeps streaming answers styled as well.
 *
 * Persistence: the Host half keeps `~/.dsh/answer-style.json`; this half
 * reads it at boot and writes it on every change, so the preference is shared
 * by every browser and by the Desktop app of the same Host. `localStorage`
 * only caches the last value for an instant first paint / offline fallback.
 */
window.__ModuleLoader__.load({
	id: 'dsh-answer-style',
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
		let react = require('react');
		const h = react.createElement;

		const STYLE_ID = 'dsh-answer-style-sheet';
		const CONFIG_URL = '/answer-style/config';
		const STORAGE_KEY = 'dsh-answer-style/v1';
		const SCOPE = '[data-chat-flow-kind="assistant-step"]';

		const DEFAULTS = Object.freeze({ enabled: true, family: '', weight: 'default', color: '' });
		const WEIGHTS = ['default', '300', '400', '500', '600', '700'];
		const WEIGHT_LABELS = {
			default: '默认（跟随主题）',
			300: '细体 300',
			400: '常规 400',
			500: '中等 500',
			600: '半粗 600',
			700: '加粗 700',
		};

		const GENERIC_FAMILIES = new Set([
			'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
			'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math',
			'fangsong', '-apple-system', 'blinkmacsystemfont', 'inherit',
		]);

		/** Curated stacks; every entry names fonts that ship with common systems or OFL webfonts. */
		const FONT_PRESETS = [
			{ label: '系统默认（跟随主题）', value: '' },
			{ label: '微软雅黑', value: '"Microsoft YaHei UI", "Microsoft YaHei", sans-serif' },
			{ label: '苹方 / 冬青黑', value: '"PingFang SC", "Hiragino Sans GB", sans-serif' },
			{ label: '思源黑体', value: '"Source Han Sans SC", "Noto Sans SC", "Microsoft YaHei", sans-serif' },
			{ label: '霞鹜文楷', value: '"LXGW WenKai Screen", "LXGW WenKai", "KaiTi", serif' },
			{ label: '楷体', value: '"KaiTi", "STKaiti", "Kaiti SC", serif' },
			{ label: '宋体 / 思源宋体', value: '"SimSun", "Songti SC", "Source Han Serif SC", serif' },
			{ label: '等线 / 黑体', value: '"DengXian", "SimHei", "Microsoft YaHei", sans-serif' },
			{ label: '等宽字体（SF Mono / JetBrains Mono）', value: '"JetBrains Mono", "Cascadia Code", Consolas, monospace' },
			{ label: '西文衬线（Georgia / Times）', value: 'Georgia, "Times New Roman", serif' },
		];

		/** Host persistence status shown under the preview. */
		const SAVE_LABELS = {
			idle: '偏好保存在 Host 的 answer-style.json，所有浏览器与桌面端共用。',
			saving: '正在保存到 Host…',
			saved: '已保存到 Host（~/.dsh/answer-style.json），换浏览器或桌面端都还在。',
			error: 'Host 侧还没就绪，本次只存在这个浏览器；重启一次 dsh web 即可启用文件保存。',
		};

		const COLOR_PRESETS = ['#1f2328', '#111827', '#374151', '#1d4ed8', '#7c3aed', '#b91c1c', '#047857', '#b45309'];

		/**
		 * Normalize free-form text into a safe CSS font-family list.
		 * Quotes, angle brackets, braces, semicolons and control characters are
		 * dropped so the value can never escape the declaration it is embedded in.
		 * @param value - user-entered or stored list.
		 * @returns a normalized comma-separated list, or `''`.
		 */
		function sanitizeFamily(value) {
			if (typeof value !== 'string') return '';
			return value
				.split(',')
				.map((name) => name.replace(/["'\\<>{}\u0000-\u001f\u007f]/gu, '').replace(/\s+/gu, ' ').trim())
				.filter((name) => name !== '')
				.map((name) => (GENERIC_FAMILIES.has(name.toLowerCase()) ? name : `"${name}"`))
				.join(', ');
		}

		/**
		 * Accept only colors that cannot carry arbitrary CSS.
		 * @param value - candidate color.
		 * @returns whether the value is a hex color or an rgb()/rgba() color.
		 */
		function isColor(value) {
			return typeof value === 'string'
				&& (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/iu.test(value) || /^rgba?\([\d\s.,%/]+\)$/iu.test(value));
		}

		/**
		 * Normalize one raw preference document — from the Host config file or
		 * from the local cache — into the accepted shape.
		 * @param parsed - raw JSON value.
		 * @returns the accepted preference.
		 */
		function normalizePreference(parsed) {
			const source = parsed !== null && typeof parsed === 'object' ? parsed : {};
			return {
				enabled: source.enabled !== false,
				family: sanitizeFamily(source.family),
				weight: WEIGHTS.includes(source.weight) ? source.weight : 'default',
				color: isColor(source.color) ? source.color : '',
			};
		}

		/**
		 * Read the locally cached preference; it paints instantly and covers the
		 * window before the Host answers (and offline use).
		 * @returns the cached or default preference.
		 */
		function readCache() {
			try {
				const raw = window.localStorage.getItem(STORAGE_KEY);
				return raw === null || raw === '' ? { ...DEFAULTS } : normalizePreference(JSON.parse(raw));
			} catch {
				return { ...DEFAULTS };
			}
		}

		/** Mirror the current preference into the local cache. */
		function writeCache() {
			try {
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
			} catch {}
		}

		let state = readCache();
		/** 'idle' | 'saving' | 'saved' | 'error' — surfaced in the settings panel. */
		let saveStatus = 'idle';
		let pushTimer = 0;
		const listeners = new Set();

		/**
		 * Read the current preference.
		 * @returns the current state.
		 */
		function snapshot() {
			return state;
		}

		/**
		 * Subscribe to preference changes.
		 * @param listener - called after every commit or external (storage) update.
		 * @returns unsubscribe.
		 */
		function subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		}

		/** Notify every subscriber. */
		function notify() {
			for (const listener of [...listeners]) {
				try {
					listener();
				} catch (error) {
					console.warn('[dsh-answer-style] listener failed', error);
				}
			}
		}

		/**
		 * Read the Host-side config file, which every browser and the Desktop app
		 * of this Host share. Missing route (host half not reloaded yet) or any
		 * failure leaves the cached preference in place.
		 */
		async function pullFromServer() {
			try {
				const response = await fetch(CONFIG_URL, { headers: { accept: 'application/json' }, cache: 'no-store' });
				if (!response.ok) return;
				state = normalizePreference(await response.json());
				writeCache();
				saveStatus = 'saved';
				paint();
				notify();
			} catch {}
		}

		/** Write the preference to the Host config file (debounced). */
		function pushToServer() {
			saveStatus = 'saving';
			notify();
			clearTimeout(pushTimer);
			pushTimer = setTimeout(async () => {
				try {
					const response = await fetch(CONFIG_URL, {
						method: 'PUT',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify(state),
					});
					saveStatus = response.ok ? 'saved' : 'error';
				} catch {
					saveStatus = 'error';
				}
				notify();
			}, 250);
		}

		/**
		 * Merge a patch into the preference, paint it and persist it.
		 * @param patch - changed fields.
		 */
		function commit(patch) {
			state = {
				enabled: 'enabled' in patch ? patch.enabled !== false : state.enabled,
				family: 'family' in patch ? sanitizeFamily(patch.family) : state.family,
				weight: 'weight' in patch ? (WEIGHTS.includes(patch.weight) ? patch.weight : 'default') : state.weight,
				color: 'color' in patch ? (isColor(patch.color) ? patch.color : '') : state.color,
			};
			writeCache();
			paint();
			notify();
			pushToServer();
		}

		/** Restore every field to its default, in the page and in the config file. */
		function resetAll() {
			state = { ...DEFAULTS };
			try {
				window.localStorage.removeItem(STORAGE_KEY);
			} catch {}
			paint();
			notify();
			pushToServer();
		}

		/**
		 * Build the stylesheet body for the current preference.
		 * @returns CSS text, or `''` when nothing should be overridden.
		 */
		function sheetText() {
			if (!state.enabled) return '';
			const containers = `${SCOPE} [class*="_markdown_"], ${SCOPE} [data-text-interaction-source]`;
			const blocks = `${SCOPE} :is(p, li, blockquote, dd, dt, figcaption, th, td)`;
			const headings = `${SCOPE} :is(h1, h2, h3, h4, h5, h6)`;
			const rules = [];
			if (state.family !== '') {
				rules.push(`${containers},\n${blocks},\n${headings} { font-family: ${state.family} !important; }`);
			}
			if (state.weight !== 'default') {
				rules.push(`${containers},\n${blocks} { font-weight: ${state.weight} !important; }`);
			}
			if (state.color !== '') {
				// Every bold-looking run: `**bold**`, headings and table headers.
				// Ordinary body text keeps the theme's own color.
				rules.push(`${SCOPE} :is(strong, b, h1, h2, h3, h4, h5, h6, th) { color: ${state.color} !important; }`);
			}
			return rules.join('\n');
		}

		/** Create/update/remove the injected stylesheet from the current preference. */
		function paint() {
			const css = sheetText();
			const existing = document.getElementById(STYLE_ID);
			if (css === '') {
				existing?.remove();
				return;
			}
			const style = existing ?? document.createElement('style');
			style.id = STYLE_ID;
			if (style.textContent !== css) style.textContent = css;
			if (!style.isConnected) document.head.append(style);
		}

		/* ---------------------------------------------------------------- UI ---- */

		const styles = {
			card: {
				display: 'grid',
				gap: 18,
				padding: '16px 18px',
				borderRadius: 12,
				border: '0.5px solid var(--dsw-alias-settings-card-stroke, rgba(128, 128, 128, 0.28))',
				background: 'var(--dsw-alias-settings-card-fill, transparent)',
				color: 'var(--dsw-alias-label-primary, inherit)',
			},
			header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
			title: { fontSize: 14, fontWeight: 600, lineHeight: '22px' },
			hint: { marginTop: 4, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary, #888)' },
			row: { display: 'grid', gap: 6 },
			rowTitle: { fontSize: 13, fontWeight: 500, lineHeight: '20px' },
			rowDesc: { fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary, #888)' },
			control: {
				width: '100%',
				boxSizing: 'border-box',
				padding: '7px 10px',
				borderRadius: 8,
				border: '0.5px solid var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.4))',
				background: 'var(--dsw-alias-bg-layer-2, transparent)',
				color: 'var(--dsw-alias-label-primary, inherit)',
				fontFamily: 'inherit',
				fontSize: 13,
				lineHeight: '20px',
			},
			button: {
				padding: '6px 12px',
				borderRadius: 8,
				border: '0.5px solid var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.4))',
				background: 'var(--dsw-alias-interactive-bg-hover, transparent)',
				color: 'var(--dsw-alias-label-primary, inherit)',
				fontFamily: 'inherit',
				fontSize: 12,
				lineHeight: '18px',
				cursor: 'pointer',
			},
			toolbar: { display: 'flex', alignItems: 'center', gap: 10 },
			preview: {
				marginTop: 2,
				padding: '10px 12px',
				borderRadius: 8,
				border: '0.5px dashed var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.4))',
				lineHeight: '24px',
				fontSize: 'var(--dsh-content-font-size, 14px)',
			},
			swatches: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
			swatch: { width: 22, height: 22, padding: 0, borderRadius: 6, cursor: 'pointer', border: '0.5px solid var(--dsw-alias-border-l3, rgba(128,128,128,0.4))' },
		};

		/**
		 * One labelled setting block.
		 * @param title - row title.
		 * @param desc - row description.
		 * @param control - control element.
		 * @returns the row element.
		 */
		function row(title, desc, control) {
			return h(
				'div',
				{ style: styles.row },
				h('div', { style: styles.rowTitle }, title),
				h('div', { style: styles.rowDesc }, desc),
				control,
			);
		}

		// `useState`/`useEffect` are the only hooks used; the section re-renders
		// from the module-level listener so every surface (including a second
		// tab) stays in sync with one preference.
		function AnswerStyleSection(props) {
			const [, bump] = react.useState(0);
			react.useEffect(() => subscribe(() => bump((n) => n + 1)), []);
			const [customMode, setCustomMode] = react.useState(false);
			const [localFonts, setLocalFonts] = react.useState(null);
			const [fontError, setFontError] = react.useState('');
			const value = props.get();
			const preset = FONT_PRESETS.some((option) => option.value === value.family);
			const custom = customMode || (value.family !== '' && !preset);
			const selectValue = custom ? '__custom__' : value.family;

			const loadLocalFonts = () => {
				setFontError('');
				const api = typeof window.queryLocalFonts === 'function' ? window.queryLocalFonts : undefined;
				if (api === undefined) {
					setFontError('当前浏览器不支持读取本机字体，可在下方「自定义字体」手动填写字体名。');
					return;
				}
				api.call(window).then((fonts) => {
					const families = [...new Set(fonts.map((font) => font.family))].sort((a, b) => a.localeCompare(b));
					setLocalFonts(families);
				}).catch(() => {
					setFontError('读取本机字体被拒绝或失败；可以重试，或手动填写字体名。');
				});
			};

			const groups = [
				h(
					'optgroup',
					{ key: 'preset', label: '常用字体' },
					FONT_PRESETS.map((option) => h(
						'option',
						{ key: option.value === '' ? '__default__' : option.value, value: option.value, style: { fontFamily: option.value === '' ? undefined : option.value } },
						option.label,
					)),
				),
			];
			if (localFonts !== null) {
				groups.push(h(
					'optgroup',
					{ key: 'local', label: '本机已安装字体' },
					localFonts.map((family) => h('option', { key: `local:${family}`, value: sanitizeFamily(family), style: { fontFamily: family } }, family)),
				));
			}

			return h(
				'div',
				{ style: { display: 'grid', gap: 16, padding: '4px 2px 24px' } },
				h(
					'div',
					{ style: styles.card },
					h(
						'div',
						{ style: styles.header },
						h(
							'div',
							null,
							h('div', { style: styles.title }, '回答字体样式'),
							h('div', { style: styles.hint }, '只作用于模型回答（含思考过程），不影响你的消息和界面控件。改动即时生效，刷新后保留。'),
						),
						h(
							'div',
							{ style: styles.toolbar },
							h(
								'label',
								{ style: { ...styles.rowDesc, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' } },
								h('input', {
									type: 'checkbox',
									checked: value.enabled,
									onChange: (event) => props.update({ enabled: event.currentTarget.checked }),
								}),
								'启用',
							),
							h('button', { type: 'button', style: styles.button, onClick: () => { setCustomMode(false); props.reset() } }, '恢复默认'),
						),
					),
					row(
						'字体',
						'下拉里选常用字体，或「读取本机字体」把电脑上装好的字体都列出来；也可以直接写自定义 font-family。',
						h(
							'div',
							{ style: { display: 'grid', gap: 8 } },
							h(
								'select',
								{
									style: styles.control,
									value: selectValue,
									onChange: (event) => {
										const next = event.currentTarget.value;
										if (next === '__custom__') {
											setCustomMode(true);
											return;
										}
										setCustomMode(false);
										props.update({ family: next });
									},
								},
								groups,
								h('option', { key: '__custom__', value: '__custom__' }, '自定义…'),
							),
							h(
								'div',
								{ style: { display: 'flex', gap: 8, alignItems: 'center' } },
								h('button', { type: 'button', style: styles.button, onClick: loadLocalFonts }, '读取本机字体'),
								fontError !== '' ? h('span', { style: styles.rowDesc }, fontError) : null,
							),
							custom
								? h('input', {
									type: 'text',
									style: styles.control,
									key: value.family,
									defaultValue: value.family,
									placeholder: '例如：LXGW WenKai, Microsoft YaHei, sans-serif',
									spellCheck: false,
									autoComplete: 'off',
									onBlur: (event) => props.update({ family: sanitizeFamily(event.currentTarget.value) }),
									onKeyDown: (event) => {
										if (event.key === 'Enter') event.currentTarget.blur();
									},
								})
								: null,
						),
					),
					row(
						'粗细 / 加粗',
						'让整段回答更粗或更细；标题与行内加粗会保留自己的字重。',
						h(
							'select',
							{
								style: styles.control,
								value: value.weight,
								onChange: (event) => props.update({ weight: event.currentTarget.value }),
							},
							WEIGHTS.map((weight) => h('option', { key: weight, value: weight }, WEIGHT_LABELS[weight])),
						),
					),
					row(
						'加粗文字颜色',
						'只改回答里 `**加粗**` 那部分的颜色，正文仍跟随主题色；「跟随主题」恢复默认。',
						h(
							'div',
							{ style: { display: 'grid', gap: 8 } },
							h(
								'div',
								{ style: styles.swatches },
								h('input', {
									type: 'color',
									style: { ...styles.swatch, width: 34, height: 26 },
									value: value.color === '' ? '#1f2328' : value.color,
									onChange: (event) => props.update({ color: event.currentTarget.value }),
									'aria-label': '加粗文字颜色',
								}),
								COLOR_PRESETS.map((color) => h('button', {
									key: color,
									type: 'button',
									title: color,
									style: { ...styles.swatch, background: color },
									onClick: () => props.update({ color }),
								})),
								h('button', { type: 'button', style: styles.button, onClick: () => props.update({ color: '' }) }, '跟随主题'),
							),
							h('div', { style: styles.rowDesc }, value.color === '' ? '当前：加粗跟随主题色' : `当前：加粗为 ${value.color}`),
						),
					),
					h(
						'div',
						{
							style: {
								...styles.preview,
								fontFamily: value.family === '' ? undefined : value.family,
								fontWeight: value.weight === 'default' ? undefined : value.weight,
							},
						},
						'预览：普通正文保持主题色，',
						h('strong', { style: { color: value.color === '' ? undefined : value.color } }, '这一段加粗文字'),
						' 按设定着色。The quick brown fox jumps over the lazy dog. 0123456789',
					),
					h('div', { style: styles.rowDesc }, SAVE_LABELS[props.status()] ?? SAVE_LABELS.idle),
				),
			);
		}

		/* ------------------------------------------------------- plugin face ---- */

		/** No client services are required up front; `slots` is the one used. */
		const inject = ['slots'];
		const name = 'answer-style';

		/**
		 * Mount the stylesheet and the settings section.
		 * @param ctx - browser plugin context.
		 */
		function apply(ctx) {
			paint();
			pullFromServer();
			ctx.effect(() => () => {
				document.getElementById(STYLE_ID)?.remove();
			}, 'dsh-answer-style: stylesheet');
			ctx.effect(() => {
				const onStorage = (event) => {
					if (event.key !== STORAGE_KEY && event.key !== null) return;
					state = readCache();
					paint();
					notify();
				};
				window.addEventListener('storage', onStorage);
				return () => window.removeEventListener('storage', onStorage);
			}, 'dsh-answer-style: cross-tab sync');
			ctx.slots.inject('settings.section', () => ctx.slots.register({
				name: 'settings.section',
				id: 'answer-style',
				order: 40,
				label: () => '回答字体',
				inject: () => ({ get: snapshot, update: commit, reset: resetAll, status: () => saveStatus }),
			}, AnswerStyleSection));
		}

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		exports.AnswerStyleSection = AnswerStyleSection;
		return module.exports;
	},
});

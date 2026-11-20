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

		const DEFAULT_SCOPE = Object.freeze({ strong: true, headings: true, headers: true });
		const DEFAULTS = Object.freeze({
			enabled: true,
			family: '',
			weight: 'default',
			headingWeight: 'default',
			color: '',
			colorScope: DEFAULT_SCOPE,
		});
		const WEIGHTS = ['default', '300', '400', '500', '600', '700'];
		const HEADING_WEIGHTS = ['default', '400', '500', '600', '700'];
		const HEADING_WEIGHT_LABELS = {
			default: '默认（跟随主题）',
			400: '常规 400',
			500: '中等 500',
			600: '半粗 600',
			700: '加粗 700',
		};
		/** Which bold-looking runs the color applies to. */
		const SCOPE_KEYS = ['strong', 'headings', 'headers'];
		const SCOPE_LABELS = {
			strong: '加粗片段',
			headings: '标题 h1–h6',
			headers: '表头',
		};
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

		/**
		 * Preset stacks, grouped by availability. System fonts come first because
		 * a stack only renders when its families are actually installed; the
		 * open-source group is labelled so nobody expects it to work untuned.
		 */
		const FONT_PRESET_GROUPS = [
			{
				label: '中文 · 系统自带',
				options: [
					{ label: '系统默认（跟随主题）', value: '' },
					{ label: '微软雅黑', value: '"Microsoft YaHei", "Microsoft YaHei UI", sans-serif' },
					{ label: '苹方', value: '"PingFang SC", "Hiragino Sans GB", sans-serif' },
					{ label: '宋体', value: '"SimSun", "Songti SC", serif' },
					{ label: '楷体', value: '"KaiTi", "STKaiti", "Kaiti SC", serif' },
					{ label: '黑体', value: '"SimHei", "Heiti SC", sans-serif' },
				],
			},
			{
				label: '西文 · 系统自带',
				options: [
					{ label: 'Segoe UI', value: '"Segoe UI", Tahoma, "Helvetica Neue", sans-serif' },
					{ label: 'Helvetica', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
					{ label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
					{ label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
					{ label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
				],
			},
			{
				label: '等宽',
				options: [
					{ label: 'Consolas', value: 'Consolas, "Courier New", monospace' },
					{ label: 'Menlo', value: 'Menlo, Monaco, Consolas, monospace' },
					{ label: 'Courier New', value: '"Courier New", Courier, monospace' },
				],
			},
			{
				label: '开源字体 · 需自行安装',
				options: [
					{ label: '思源黑体', value: '"Source Han Sans SC", "Noto Sans SC", "Microsoft YaHei", sans-serif' },
					{ label: '霞鹜文楷', value: '"LXGW WenKai", "LXGW WenKai Screen", "KaiTi", serif' },
					{ label: 'JetBrains Mono', value: '"JetBrains Mono", "Cascadia Code", Consolas, monospace' },
				],
			},
		];

		/** Flat view of every preset, used to detect a custom stack. */
		const FONT_PRESETS = FONT_PRESET_GROUPS.flatMap((group) => group.options);

		/** Persistence states worth surfacing; a healthy save stays silent. */
		const SAVE_LABELS = {
			saving: '正在保存…',
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
			const scope = source.colorScope !== null && typeof source.colorScope === 'object' ? source.colorScope : {};
			return {
				enabled: source.enabled !== false,
				family: sanitizeFamily(source.family),
				weight: WEIGHTS.includes(source.weight) ? source.weight : 'default',
				headingWeight: HEADING_WEIGHTS.includes(source.headingWeight) ? source.headingWeight : 'default',
				color: isColor(source.color) ? source.color : '',
				colorScope: {
					strong: scope.strong !== false,
					headings: scope.headings !== false,
					headers: scope.headers !== false,
				},
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
			const scope = 'colorScope' in patch && patch.colorScope !== null && typeof patch.colorScope === 'object'
				? { ...state.colorScope, ...patch.colorScope }
				: state.colorScope;
			state = {
				enabled: 'enabled' in patch ? patch.enabled !== false : state.enabled,
				family: 'family' in patch ? sanitizeFamily(patch.family) : state.family,
				weight: 'weight' in patch ? (WEIGHTS.includes(patch.weight) ? patch.weight : 'default') : state.weight,
				headingWeight: 'headingWeight' in patch
					? (HEADING_WEIGHTS.includes(patch.headingWeight) ? patch.headingWeight : 'default')
					: state.headingWeight,
				color: 'color' in patch ? (isColor(patch.color) ? patch.color : '') : state.color,
				colorScope: {
					strong: scope.strong !== false,
					headings: scope.headings !== false,
					headers: scope.headers !== false,
				},
			};
			writeCache();
			paint();
			notify();
			pushToServer();
		}

		/** Restore every field to its default, in the page and in the config file. */
		function resetAll() {
			state = { ...DEFAULTS, colorScope: { ...DEFAULT_SCOPE } };
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
			if (state.headingWeight !== 'default') {
				rules.push(`${headings} { font-weight: ${state.headingWeight} !important; }`);
			}
			if (state.color !== '') {
				// Only the selected bold-looking runs; body text keeps the theme color.
				const targets = [];
				if (state.colorScope.strong) targets.push('strong', 'b');
				if (state.colorScope.headings) targets.push('h1', 'h2', 'h3', 'h4', 'h5', 'h6');
				if (state.colorScope.headers) targets.push('th');
				if (targets.length > 0) {
					rules.push(`${SCOPE} :is(${targets.join(', ')}) { color: ${state.color} !important; }`);
				}
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
				gap: 24,
				padding: '22px 24px',
				borderRadius: 14,
				border: '0.5px solid var(--dsw-alias-settings-card-stroke, rgba(128, 128, 128, 0.28))',
				background: 'var(--dsw-alias-settings-card-fill, transparent)',
				color: 'var(--dsw-alias-label-primary, inherit)',
			},
			header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
			title: { fontSize: 14, fontWeight: 600, lineHeight: '22px' },
			hint: { marginTop: 4, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary, #888)' },
			row: { display: 'grid', gap: 8 },
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
				padding: '14px 16px',
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


		/** Uppercase-ish block label used by every settings group. */
		const sectionLabel = {
			fontSize: 12,
			fontWeight: 600,
			letterSpacing: '0.06em',
			color: 'var(--dsw-alias-label-tertiary, #999)',
			marginBottom: -4,
		};

		/** Hairline between setting groups. */
		const divider = { height: '0.5px', background: 'var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.28))' };

		/**
		 * Toggle chip used for the color scope: unmistakably on or off.
		 * @param active - whether the scope is enabled.
		 * @returns the chip style.
		 */
		function chipStyle(active) {
			return {
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				padding: '7px 14px',
				borderRadius: 999,
				cursor: 'pointer',
				fontFamily: 'inherit',
				fontSize: 12,
				lineHeight: '18px',
				border: `0.5px solid ${active
					? 'var(--dsw-alias-label-secondary, #6b6862)'
					: 'var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.4))'}`,
				background: active ? 'var(--dsw-alias-bg-layer-3, rgba(0, 0, 0, 0.06))' : 'transparent',
				color: active ? 'var(--dsw-alias-label-primary, inherit)' : 'var(--dsw-alias-label-tertiary, #999)',
				fontWeight: active ? 600 : 400,
			};
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
			const status = props.status();
			const preset = FONT_PRESETS.some((option) => option.value === value.family);
			const custom = customMode || (value.family !== '' && !preset);
			const selectValue = custom ? '__custom__' : value.family;

			const loadLocalFonts = () => {
				setFontError('');
				const api = typeof window.queryLocalFonts === 'function' ? window.queryLocalFonts : undefined;
				if (api === undefined) {
					setFontError('当前环境不支持读取本机字体，可在下面手写字体名。');
					return;
				}
				api.call(window).then((fonts) => {
					const families = [...new Set(fonts.map((font) => font.family))].sort((a, b) => a.localeCompare(b));
					setLocalFonts(families);
				}).catch(() => {
					setFontError('读取本机字体被拒绝或失败；可以重试，或手写字体名。');
				});
			};

			const groups = FONT_PRESET_GROUPS.map((group) => h(
				'optgroup',
				{ key: group.label, label: group.label },
				group.options.map((option) => h(
					'option',
					{ key: option.value === '' ? '__default__' : option.value, value: option.value, style: { fontFamily: option.value === '' ? undefined : option.value } },
					option.label,
				)),
			));
			if (localFonts !== null) {
				groups.push(h(
					'optgroup',
					{ key: 'local', label: '本机已安装字体' },
					localFonts.map((family) => h('option', { key: `local:${family}`, value: sanitizeFamily(family), style: { fontFamily: family } }, family)),
				));
			}

			const button = (label, onClick) => h('button', { type: 'button', style: styles.button, onClick }, label);
			const toggle = (checked, onChange) => h(
				'label',
				{ style: { display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' } },
				h('input', {
					type: 'checkbox',
					checked,
					onChange: (event) => onChange(event.currentTarget.checked),
					style: { position: 'absolute', width: 0, height: 0, opacity: 0 },
				}),
				h('span', {
					style: {
						display: 'inline-block',
						position: 'relative',
						width: 40,
						height: 22,
						borderRadius: 999,
						background: checked
							? 'var(--dsw-alias-label-primary, #1f1e1d)'
							: 'var(--dsw-alias-border-l3, #d9d3c6)',
						transition: 'background 150ms ease',
					},
				},
					h('span', {
						style: {
							position: 'absolute',
							top: 3,
							left: checked ? 21 : 3,
							width: 16,
							height: 16,
							borderRadius: '50%',
							background: '#fff',
							boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
							transition: 'left 150ms ease',
						},
					}),
				),
			);
			const field = (label, control) => h(
				'div',
				{ style: { display: 'grid', gap: 6 } },
				h('div', { style: styles.rowTitle }, label),
				control,
			);
			const hint = (text) => h('div', { style: styles.rowDesc }, text);
			const scopeChips = SCOPE_KEYS.map((key) => h(
				'button',
				{
					key,
					type: 'button',
					style: chipStyle(value.colorScope[key]),
					'aria-pressed': value.colorScope[key],
					onClick: () => props.update({ colorScope: { [key]: !value.colorScope[key] } }),
				},
				`${value.colorScope[key] ? '✓ ' : ''}${SCOPE_LABELS[key]}`,
			));

			return h(
				'div',
				{ style: { display: 'grid', gap: 16, padding: '2px 2px 28px' } },
				h(
					'div',
					{ style: styles.card },
					h(
						'div',
						{ style: { ...styles.header, alignItems: 'center' } },
						h(
							'div',
							{ style: { display: 'grid', gap: 4 } },
							h('div', { style: { fontSize: 15, fontWeight: 600, lineHeight: '22px' } }, '回答字体'),
							h('div', { style: styles.hint }, '只作用于模型回答'),
						),
						h(
							'div',
							{ style: { display: 'flex', alignItems: 'center', gap: 16 } },
							h('button', {
								type: 'button',
								style: {
									border: 'none',
									background: 'transparent',
									padding: '2px 0',
									fontFamily: 'inherit',
									fontSize: 12,
									lineHeight: '18px',
									color: 'var(--dsw-alias-label-secondary, #6b6862)',
									cursor: 'pointer',
								},
								onClick: () => { setCustomMode(false); props.reset(); },
							}, '恢复默认'),
							toggle(value.enabled, (checked) => props.update({ enabled: checked })),
						),
					),
					h('div', { style: divider }),

					h(
						'div',
						{ style: { display: 'grid', gap: 12 } },
						h('div', { style: sectionLabel }, '字体'),
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
							{ style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' } },
							button('读取本机字体', loadLocalFonts),
							fontError !== '' ? hint(fontError) : null,
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
					h('div', { style: divider }),

					h(
						'div',
						{ style: { display: 'grid', gap: 12 } },
						h('div', { style: sectionLabel }, '粗细'),
						h(
							'div',
							{ style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } },
							field(
								'正文',
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
							field(
								'标题 h1–h6',
								h(
									'select',
									{
										style: styles.control,
										value: value.headingWeight,
										onChange: (event) => props.update({ headingWeight: event.currentTarget.value }),
									},
									HEADING_WEIGHTS.map((weight) => h('option', { key: weight, value: weight }, HEADING_WEIGHT_LABELS[weight])),
								),
							),
						),
						hint('正文与标题分开控制；行内加粗始终保留自己的字重。'),
					),
					h('div', { style: divider }),

					h(
						'div',
						{ style: { display: 'grid', gap: 14 } },
						h('div', { style: sectionLabel }, '颜色'),
						h(
							'div',
							{ style: styles.swatches },
							COLOR_PRESETS.map((color) => h('button', {
								key: color,
								type: 'button',
								title: color,
								'aria-label': `使用 ${color}`,
								style: {
									...styles.swatch,
									background: color,
									outline: value.color === color ? '2px solid var(--dsw-alias-label-secondary, #6b6862)' : 'none',
									outlineOffset: 2,
								},
								onClick: () => props.update({ color }),
							})),
							h(
								'label',
								{
									style: {
										...styles.swatch,
										width: 34,
										height: 26,
										position: 'relative',
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: 'pointer',
										overflow: 'hidden',
										background: 'conic-gradient(from 210deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f87171)',
									},
									title: '自定义颜色',
								},
								h('span', { style: { position: 'relative', fontSize: 15, lineHeight: '1', color: '#fff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.45)' } }, '＋'),
								h('input', {
									type: 'color',
									value: value.color === '' ? '#1d4ed8' : value.color,
									style: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' },
									onChange: (event) => props.update({ color: event.currentTarget.value }),
									'aria-label': '自定义颜色',
								}),
							),
							button('跟随主题', () => props.update({ color: '' })),
						),
						h(
							'div',
							{ style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' } },
							h('input', {
								type: 'text',
								key: value.color,
								defaultValue: value.color,
								placeholder: '#1d4ed8 或 rgb(29, 78, 216)',
								style: { ...styles.control, width: 220 },
								spellCheck: false,
								autoComplete: 'off',
								'aria-label': '颜色值',
								onBlur: (event) => props.update({ color: event.currentTarget.value.trim() }),
								onKeyDown: (event) => {
									if (event.key === 'Enter') event.currentTarget.blur();
								},
							}),
							hint('也可以直接粘贴颜色值，回车生效。'),
						),
						h('div', { style: { display: 'grid', gap: 8 } },
							h('div', { style: styles.rowTitle }, '上色范围'),
							h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } }, scopeChips),
							hint('未勾选的部分保持主题色；普通正文始终不上色。'),
						),
					),
					h('div', { style: divider }),

					h(
						'div',
						{ style: { display: 'grid', gap: 10 } },
						h('div', { style: sectionLabel }, '预览'),
						h(
							'div',
							{
								style: {
									...styles.preview,
									fontFamily: value.family === '' ? undefined : value.family,
									fontWeight: value.weight === 'default' ? undefined : value.weight,
								},
							},
							h(
								'h2',
								{
									style: {
										margin: '0 0 10px',
										fontSize: 18,
										lineHeight: '26px',
										fontWeight: value.headingWeight === 'default' ? 700 : Number(value.headingWeight),
										color: value.color === '' || !value.colorScope.headings ? undefined : value.color,
									},
								},
								'标题预览：h2 的字重与配色',
							),
							'普通正文保持主题色，',
							h('strong', { style: { color: value.color === '' || !value.colorScope.strong ? undefined : value.color } }, '这一段加粗文字'),
							' 按设定着色。The quick brown fox jumps over the lazy dog.',
						),
					),
					status in SAVE_LABELS ? h('div', { style: styles.rowDesc }, SAVE_LABELS[status]) : null,
				),
			);
		}

		/**
		 * Settings navigation icon: the character 文 in a serif face, so the
		 * section reads as a typography page rather than the shell's gear.
		 * @param props - slot owner props (`size`, `active`).
		 * @returns the glyph element.
		 */
		function SettingsIcon(props) {
			const size = typeof props.size === 'number' && props.size > 0 ? props.size : 16;
			const active = props.active === true;
			return react.createElement(
				'span',
				{
					style: {
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: size,
						height: size,
						fontSize: Math.round(size * 1.04),
						lineHeight: 1,
						fontFamily: '"KaiTi", "STKaiti", "Noto Serif SC", serif',
						fontWeight: 600,
						opacity: active ? 1 : 0.78,
					},
					'aria-hidden': 'true',
				},
				'文',
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
			ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
				name: 'settings.section.icon',
				id: 'answer-style',
				label: () => '回答字体',
			}, SettingsIcon));
		}

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		exports.AnswerStyleSection = AnswerStyleSection;
		exports.SettingsIcon = SettingsIcon;
		return module.exports;
	},
});

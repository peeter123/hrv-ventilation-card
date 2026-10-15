//#region node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: p, getPrototypeOf: m } = Object, h = globalThis, g = h.trustedTypes, _ = g ? g.emptyScript : "", ee = h.reactiveElementPolyfillSupport, v = (e, t) => e, y = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? _ : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, te = (e, t) => !l(e, t), ne = {
	attribute: !0,
	type: String,
	converter: y,
	reflect: !1,
	useDefault: !1,
	hasChanged: te
};
Symbol.metadata ??= Symbol("metadata"), h.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var b = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = ne) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? ne;
	}
	static _$Ei() {
		if (this.hasOwnProperty(v("elementProperties"))) return;
		let e = m(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(v("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(v("properties"))) {
			let e = this.properties, t = [...f(e), ...p(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? y : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? y : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? te)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
b.elementStyles = [], b.shadowRootOptions = { mode: "open" }, b[v("elementProperties")] = /* @__PURE__ */ new Map(), b[v("finalized")] = /* @__PURE__ */ new Map(), ee?.({ ReactiveElement: b }), (h.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var re = globalThis, ie = (e) => e, ae = re.trustedTypes, oe = ae ? ae.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, se = "$lit$", x = `lit$${Math.random().toFixed(9).slice(2)}$`, ce = "?" + x, le = `<${ce}>`, S = document, ue = () => S.createComment(""), de = (e) => e === null || typeof e != "object" && typeof e != "function", fe = Array.isArray, pe = (e) => fe(e) || typeof e?.[Symbol.iterator] == "function", me = "[ 	\n\f\r]", he = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ge = /-->/g, _e = />/g, C = RegExp(`>|${me}(?:([^\\s"'>=/]+)(${me}*=${me}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ve = /'/g, ye = /"/g, be = /^(?:script|style|textarea|title)$/i, xe = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), w = xe(1), Se = xe(2), T = Symbol.for("lit-noChange"), E = Symbol.for("lit-nothing"), Ce = /* @__PURE__ */ new WeakMap(), D = S.createTreeWalker(S, 129);
function we(e, t) {
	if (!fe(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return oe === void 0 ? t : oe.createHTML(t);
}
var Te = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = he;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === he ? c[1] === "!--" ? o = ge : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = C) : (be.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = C) : o = _e : o === C ? c[0] === ">" ? (o = i ?? he, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? C : c[3] === "\"" ? ye : ve) : o === ye || o === ve ? o = C : o === ge || o === _e ? o = he : (o = C, i = void 0);
		let d = o === C && e[t + 1].startsWith("/>") ? " " : "";
		a += o === he ? n + le : l >= 0 ? (r.push(s), n.slice(0, l) + se + n.slice(l) + x + d) : n + x + (l === -2 ? t : d);
	}
	return [we(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, Ee = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Te(t, n);
		if (this.el = e.createElement(l, r), D.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = D.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(se)) {
					let t = u[o++], n = i.getAttribute(e).split(x), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ae : r[1] === "?" ? je : r[1] === "@" ? Me : ke
					}), i.removeAttribute(e);
				} else e.startsWith(x) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (be.test(i.tagName)) {
					let e = i.textContent.split(x), t = e.length - 1;
					if (t > 0) {
						i.textContent = ae ? ae.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], ue()), D.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], ue());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === ce) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(x, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += x.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = S.createElement("template");
		return n.innerHTML = e, n;
	}
};
function O(e, t, n = e, r) {
	if (t === T) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = de(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = O(e, i._$AS(e, t.values), i, r)), t;
}
var De = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? S).importNode(t, !0);
		D.currentNode = r;
		let i = D.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Oe(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Ne(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = D.nextNode(), a++);
		}
		return D.currentNode = S, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Oe = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = E, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = O(this, e, t), de(e) ? e === E || e == null || e === "" ? (this._$AH !== E && this._$AR(), this._$AH = E) : e !== this._$AH && e !== T && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? pe(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== E && de(this._$AH) ? this._$AA.nextSibling.data = e : this.T(S.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Ee.createElement(we(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new De(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = Ce.get(e.strings);
		return t === void 0 && Ce.set(e.strings, t = new Ee(e)), t;
	}
	k(t) {
		fe(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(ue()), this.O(ue()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ie(e).nextSibling;
			ie(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, ke = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = E, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = E;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = O(this, e, t, 0), a = !de(e) || e !== this._$AH && e !== T, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = O(this, r[n + o], t, o), s === T && (s = this._$AH[o]), a ||= !de(s) || s !== this._$AH[o], s === E ? e = E : e !== E && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === E ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ae = class extends ke {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === E ? void 0 : e;
	}
}, je = class extends ke {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== E);
	}
}, Me = class extends ke {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = O(this, e, t, 0) ?? E) === T) return;
		let n = this._$AH, r = e === E && n !== E || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== E && (n === E || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Ne = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		O(this, e);
	}
}, Pe = re.litHtmlPolyfillSupport;
Pe?.(Ee, Oe), (re.litHtmlVersions ??= []).push("3.3.3");
var Fe = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Oe(t.insertBefore(ue(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Ie = globalThis, k = class extends b {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Fe(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return T;
	}
};
k._$litElement$ = !0, k.finalized = !0, Ie.litElementHydrateSupport?.({ LitElement: k });
var Le = Ie.litElementPolyfillSupport;
Le?.({ LitElement: k }), (Ie.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region node_modules/lit-html/directive.js
var Re = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, ze = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), Be = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
}, Ve = "important", He = " !" + Ve, A = ze(class extends Be {
	constructor(e) {
		if (super(e), e.type !== Re.ATTRIBUTE || e.name !== "style" || e.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
	}
	render(e) {
		return Object.keys(e).reduce((t, n) => {
			let r = e[n];
			return r == null ? t : t + `${n = n.includes("-") ? n : n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${r};`;
		}, "");
	}
	update(e, [t]) {
		let { style: n } = e.element;
		if (this.ft === void 0) return this.ft = new Set(Object.keys(t)), this.render(t);
		for (let e of this.ft) t[e] ?? (this.ft.delete(e), e.includes("-") ? n.removeProperty(e) : n[e] = null);
		for (let e in t) {
			let r = t[e];
			if (r != null) {
				this.ft.add(e);
				let t = typeof r == "string" && r.endsWith(He);
				e.includes("-") || t ? n.setProperty(e, t ? r.slice(0, -11) : r, t ? Ve : "") : n[e] = r;
			}
		}
		return T;
	}
}), Ue = 1.2, We = 1006, Ge = 2501, Ke = 1.86, qe = 3600, j = (e) => e !== void 0 && Number.isFinite(e), Je = (e, t) => ({
	total: e.h - t.h,
	latent: Ge * (e.A - t.A)
});
function Ye(e) {
	let { temperature: t, absoluteHumidity: n, supplyFlow: r, bypass: i, airDensity: a } = e, o = [
		t.outdoor,
		t.supply,
		t.extract
	].filter(j), s = n && [
		n.outdoor,
		n.supply,
		n.extract
	].filter(j);
	if (o.length !== 3 || !j(r) || !j(i) || s !== void 0 && s.length !== 3 || !(Number.isFinite(a) && a > 0)) return;
	let c = (e, t) => ({
		h: a * We * e + t * (Ge + Ke * e),
		A: t
	}), [l, u, d] = o.map((e, t) => c(e, s?.[t] ?? 0)), f = r / qe, p = i > 0 || l.h > d.h, m = d.h >= l.h, h, g;
	if (p) {
		let [e, t] = m ? [d, l] : [l, d];
		h = Je(e, u), g = Je(u, t);
	} else h = Je(u, l), g = Je(d, u);
	let _ = {
		mode: p ? "cooling" : "heating",
		freeCooling: i > 0 && m,
		saving: Math.max(h.total, 0) * f,
		recovered: {
			sensible: (h.total - h.latent) * f,
			latent: h.latent * f
		},
		lost: {
			sensible: (g.total - g.latent) * f,
			latent: g.latent * f
		},
		latentKnown: s !== void 0
	};
	if (n !== void 0) {
		let e = Xe(n, r);
		e !== void 0 && (_.moisture = e);
	}
	return _;
}
function Xe(e, t) {
	if (e === void 0 || !j(t)) return;
	let { outdoor: n, supply: r, extract: i } = e;
	if (j(n) && j(r) && j(i)) return {
		extracted: t * (i - n),
		recovered: t * (r - n),
		outside: t * (i - r)
	};
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/property.js
var Ze = {
	attribute: !0,
	type: String,
	converter: y,
	reflect: !1,
	hasChanged: te
}, Qe = (e = Ze, t, n) => {
	let { kind: r, metadata: i } = n, a = globalThis.litPropertyMetadata.get(i);
	if (a === void 0 && globalThis.litPropertyMetadata.set(i, a = /* @__PURE__ */ new Map()), r === "setter" && ((e = Object.create(e)).wrapped = !0), a.set(n.name, e), r === "accessor") {
		let { name: r } = n;
		return {
			set(n) {
				let i = t.get.call(this);
				t.set.call(this, n), this.requestUpdate(r, i, e, !0, n);
			},
			init(t) {
				return t !== void 0 && this.C(r, void 0, e, t), t;
			}
		};
	}
	if (r === "setter") {
		let { name: r } = n;
		return function(n) {
			let i = this[r];
			t.call(this, n), this.requestUpdate(r, i, e, !0, n);
		};
	}
	throw Error("Unsupported decorator location: " + r);
};
function $e(e) {
	return (t, n) => typeof n == "object" ? Qe(e, t, n) : ((e, t, n) => {
		let r = t.hasOwnProperty(n);
		return t.constructor.createProperty(n, e), r ? Object.getOwnPropertyDescriptor(t, n) : void 0;
	})(e, t, n);
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/state.js
function et(e) {
	return $e({
		...e,
		state: !0,
		attribute: !1
	});
}
//#endregion
//#region src/lib/define.ts
function tt(e, t) {
	let n = customElements.get(e);
	n === void 0 ? customElements.define(e, t) : n !== t && console.warn(`${e} is already defined by another copy of the module; that copy stays in use.`);
}
//#endregion
//#region src/strings.ts
var M = "\xA0", nt = {
	"outdoor.temperature": "outdoor air temperature",
	"outdoor.humidity": "outdoor air humidity",
	"outdoor.absolute_humidity": "outdoor air absolute humidity",
	"supply.temperature": "supply air temperature",
	"supply.humidity": "supply air humidity",
	"supply.absolute_humidity": "supply air absolute humidity",
	"extract.temperature": "extract air temperature",
	"extract.humidity": "extract air humidity",
	"extract.absolute_humidity": "extract air absolute humidity",
	"exhaust.temperature": "exhaust air temperature",
	"exhaust.humidity": "exhaust air humidity",
	"exhaust.absolute_humidity": "exhaust air absolute humidity",
	"fans.level": "fan level",
	"fans.supply_flow": "supply flow",
	"fans.exhaust_flow": "exhaust flow",
	"bypass.position": "bypass position",
	"bypass.mode": "bypass mode",
	"bypass.next_change": "next bypass change",
	"status.operating_mode": "operating mode",
	"status.target_temperature": "profile target temperature",
	"status.temperature_profile": "temperature profile",
	"status.next_fan_change": "next fan change",
	"status.filter_days": "filter days remaining",
	"status.power": "power",
	"status.rmot": "running mean outdoor temperature",
	"seasons.heating": "heating season",
	"seasons.cooling": "cooling season"
}, rt = (e) => `Missing required entities: ${e.map((e) => nt[e]).join(", ")}`, N = {
	invalid: (e, t) => `Invalid option ${e}: expected ${t}`,
	number: (e, t) => `a number from ${e} to ${t}`,
	color: "a CSS colour such as #db4437 or rgb(219, 68, 55)",
	boolean: "true or false",
	object: "a group of options",
	choice: (e) => `one of ${e.join(", ")}`
}, it = {
	diagram: {
		name: "HRV Airflow Diagram",
		description: "The four air streams of a heat recovery ventilation unit, with bypass, fans and the current saving."
	},
	recovery: {
		name: "HRV Recovery Balance",
		description: "Heat or cooling recovered and still lost by the exchanger, or the free cooling of the bypass, split into temperature and moisture."
	},
	moisture: {
		name: "HRV Moisture Balance",
		description: "Moisture extracted from the house, recovered by the exchanger and put outside."
	}
}, P = {
	advanced: "Advanced settings",
	noForm: "The visual editor is not available in this version of Home Assistant. Use the code editor instead.",
	sections: {
		outdoor: "Outdoor air",
		supply: "Supply air",
		extract: "Extract air",
		exhaust: "Exhaust air",
		fans: "Fans",
		bypass: "Bypass",
		status: "Status",
		seasons: "Seasons",
		calculation: "Calculation",
		colors: "Colours",
		heating: "Heating colours",
		cooling: "Cooling colours",
		animation: "Animation"
	},
	fields: {
		temperature: "Temperature",
		humidity: "Relative humidity",
		absolute_humidity: "Absolute humidity",
		level: "Fan level",
		supply_flow: "Supply flow",
		exhaust_flow: "Exhaust flow",
		position: "Bypass position",
		mode: "Bypass mode",
		next_change: "Next bypass change",
		operating_mode: "Operating mode",
		target_temperature: "Profile target temperature",
		temperature_profile: "Temperature profile",
		next_fan_change: "Next fan change",
		filter_days: "Filter days remaining",
		power: "Power",
		rmot: "Running mean outdoor temperature",
		heating: "Heating season",
		cooling: "Cooling season",
		smoothing: "Humidity smoothing (minutes, 0 = off)",
		air_density: "Air density (kg/m³)",
		min_scale: "Minimum scale",
		neutral_threshold: "Neutral threshold (g/m³)",
		color: "Temperature colour",
		color_latent: "Moisture colour",
		drying_color: "Drying colour",
		gaining_color: "Gaining colour",
		cold: "Cold colour",
		warm: "Warm colour",
		enabled: "Animate the air flow",
		nominal_flow: "Nominal flow (in the unit of the flow entities)",
		layout: "Layout",
		show_unavailable: "Show unavailable values"
	},
	layouts: {
		auto: "Automatic",
		full: "Full",
		compact: "Compact"
	}
}, F = {
	titleHeating: "Heat Recovery",
	titleCooling: "Cooling Recovery",
	titleFreeCooling: "Free Cooling",
	titleNoValue: "Recovery",
	header: (e, t, n) => `Recovered ${e}${M}W of ${t}${M}W (${n}${M}%)`,
	headerNoPotential: (e) => `Recovered ${e}${M}W`,
	headerFreeCooling: (e, t, n) => `Cooling ${e}${M}W of ${t}${M}W (${n}${M}%)`,
	headerFreeCoolingNoPotential: (e) => `Cooling ${e}${M}W`,
	laneSensible: "Temperature",
	laneLatent: "Moisture",
	recovered: (e) => `Recovered ${e}${M}W`,
	cooling: (e) => `Cooling ${e}${M}W`,
	lost: (e) => `Lost ${e}${M}W`,
	missed: (e) => `Missed ${e}${M}W`,
	water: (e) => `Water Recovered ${e}${M}g/h`,
	waterKeptOut: (e) => `Water Kept Out ${e}${M}g/h`,
	scale: (e) => `Scale ±${e}${M}W`
}, I = {
	title: "Moisture",
	titleDrying: "Moisture: House Drying",
	titleGaining: "Moisture: House Gaining (Outdoor More Humid)",
	titleNeutral: "Moisture: Indoor ≈ Outdoor",
	neutral: "within sensor accuracy",
	header: ({ gaining: e, recovered: t, extracted: n }) => `${e ? "Kept out" : "Recovered"} ${t} of ${n}${M}g/h`,
	percent: (e, t) => t === void 0 ? ` (${e}${M}%)` : ` (${e}${M}%, with bypass ${t}${M}%)`,
	bypass: (e) => `Bypass ${e}${M}% — part of the supply air skips the exchanger, so less is recovered (intended, free cooling)`,
	flow: ({ gaining: e, extracted: t, recovered: n, outside: r }) => e ? `Outdoor Air Brings In ${t} → Kept Out ${n} + Enters ${r}${M}g/h` : `Extracted ${t} → Recovered ${n} + Outside ${r}${M}g/h`,
	swatchRecovered: (e) => e ? "Kept Out" : "Recovered",
	swatchOutside: (e) => e ? "Enters" : "Outside",
	humidities: (e, t) => `Indoor ${e}${M}g/m³ · Outdoor ${t}${M}g/m³`,
	scale: (e) => `Scale ±${e}${M}g/h`
}, at = {
	prefixes: { rmot: "RMOT " },
	notPlanned: "—",
	seasons: {
		heating: "Heating season",
		cooling: "Cooling season",
		between: "Between seasons"
	},
	saving: (e) => `${e}${M}W`
}, ot = /* @__PURE__ */ new Set(["unknown", "unavailable"]), st = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
function ct(e) {
	return e === void 0 || ot.has(e.state);
}
function lt(e) {
	if (!st.test(e)) return;
	let t = Number(e);
	return Number.isFinite(t) ? t + 0 : void 0;
}
function ut(e) {
	return e === void 0 ? void 0 : lt(e.state);
}
//#endregion
//#region src/lib/config.ts
var dt = [
	"outdoor",
	"supply",
	"extract",
	"exhaust"
], L = (e) => ({
	outdoor: e("outdoor"),
	supply: e("supply"),
	extract: e("extract"),
	exhaust: e("exhaust")
}), ft = /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/;
function R(e, t) {
	let n = e;
	for (let e of t.split(".")) {
		if (typeof n != "object" || !n || !Object.hasOwn(n, e)) return;
		n = n[e];
	}
	return n;
}
function pt(e) {
	if (typeof e != "string") return;
	let t = e.trim();
	return ft.test(t) ? t : void 0;
}
function z(e, t) {
	return pt(R(e, t));
}
function mt(e, t) {
	return z(e, t) !== void 0;
}
function ht(e, t) {
	let n = z(e, `${t}.absolute_humidity`);
	if (n !== void 0) return { absolute: n };
	let r = z(e, `${t}.humidity`), i = z(e, `${t}.temperature`);
	return r !== void 0 && i !== void 0 ? {
		relative: r,
		temperature: i
	} : void 0;
}
var gt = (e, t) => ht(e, t) !== void 0;
function _t(e, t, n) {
	let r = (t) => mt(e, `${t}.absolute_humidity`) || mt(e, `${t}.humidity`);
	return n === "all_or_none" && !t.some(r) ? [] : t.flatMap((t) => r(t) ? gt(e, t) ? [] : [`${t}.temperature`] : [`${t}.humidity`]);
}
function vt(e, t) {
	let n = t.paths.filter((t) => !mt(e, t)), { humidity: r } = t;
	return r && n.push(..._t(e, r.streams, r.rule)), [...new Set(n)];
}
//#endregion
//#region src/editor/schema.ts
function yt(e) {
	return "type" in e;
}
function bt(e) {
	let { advanced: t, ...n } = e;
	return n;
}
function xt(e) {
	return e.flatMap((e) => yt(e) ? e.schema.map((t) => ({
		field: t,
		path: e.flatten ? t.name : `${e.name}.${t.name}`
	})) : [{
		field: e,
		path: e.name
	}]);
}
function St(e, t) {
	let n = (e) => t || e.advanced !== !0;
	return e.flatMap((e) => {
		if (!yt(e)) return n(e) ? [bt(e)] : [];
		let t = e.schema.filter(n).map(bt);
		return t.length > 0 ? [{
			...e,
			schema: t
		}] : [];
	});
}
function Ct(e, t) {
	if (e == null || e === "") return !1;
	if (t.default === void 0) return !0;
	if (typeof t.default == "number") {
		let n = typeof e == "number" ? e : typeof e == "string" ? lt(e) : void 0;
		if (n !== void 0) return n !== t.default;
	}
	return wt(e) !== wt(t.default);
}
function wt(e) {
	return (typeof e == "string" || typeof e == "number" || typeof e == "boolean" ? String(e) : JSON.stringify(e)).toLowerCase();
}
function Tt(e, t) {
	return xt(e).some(({ field: e, path: n }) => e.advanced === !0 && Ct(R(t, n), e));
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/decorate.js
function B(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
//#endregion
//#region src/editor/hrv-card-editor.ts
var Et = "hrv-card-editor", Dt = [{
	name: "advanced",
	selector: { boolean: {} }
}], Ot = () => P.advanced, kt = P.sections, At = P.fields;
function jt(e) {
	return yt(e) ? e.title ?? kt[e.name] ?? e.name : At[e.name] ?? e.name;
}
var V = class extends k {
	static {
		this.styles = o`
    .hint {
      color: var(--secondary-text-color);
    }
    .switch {
      display: block;
      margin-bottom: 8px;
    }
  `;
	}
	constructor() {
		super(), this.schema = [], this._switch = { advanced: !1 }, this._formDefined = customElements.get("ha-form") !== void 0, this._formSchema = [], this._toggleAdvanced = (e) => {
			e.stopPropagation(), this._switch = { advanced: e.detail.value.advanced === !0 || this._locked };
		}, this._configChanged = (e) => {
			e.stopPropagation();
			let t = e.detail.value;
			this._config = t, this.dispatchEvent(new CustomEvent("config-changed", {
				detail: { config: t },
				bubbles: !0,
				composed: !0
			}));
		}, this._formDefined || customElements.whenDefined("ha-form").then(() => {
			this._formDefined = !0;
		});
	}
	get _locked() {
		return this._config !== void 0 && Tt(this.schema, this._config);
	}
	setConfig(e) {
		this._config = e, this._locked && !this._switch.advanced && (this._switch = { advanced: !0 });
	}
	willUpdate(e) {
		e.has("schema") && this._locked && !this._switch.advanced && (this._switch = { advanced: !0 }), (e.has("schema") || e.has("_switch")) && (this._formSchema = St(this.schema, this._switch.advanced));
	}
	render() {
		return this._config ? this._formDefined ? w`
      <ha-form
        class="switch"
        .hass=${this.hass}
        .data=${this._switch}
        .schema=${Dt}
        .computeLabel=${Ot}
        @value-changed=${this._toggleAdvanced}
      ></ha-form>
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._formSchema}
        .computeLabel=${jt}
        @value-changed=${this._configChanged}
      ></ha-form>
    ` : w`<p class="hint">${P.noForm}</p>` : E;
	}
};
B([$e({ attribute: !1 })], V.prototype, "hass", void 0), B([$e({ attribute: !1 })], V.prototype, "schema", void 0), B([et()], V.prototype, "_config", void 0), B([et()], V.prototype, "_switch", void 0), B([et()], V.prototype, "_formDefined", void 0), tt(Et, V);
//#endregion
//#region src/lib/options.ts
var Mt = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, Nt = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|var)\((.*)\)$/i, Pt = /^[#a-zA-Z0-9(),.%\s/+-]+$/, Ft = /* @__PURE__ */ new Set(/* @__PURE__ */ "aliceblue.antiquewhite.aqua.aquamarine.azure.beige.bisque.black.blanchedalmond.blue.blueviolet.brown.burlywood.cadetblue.chartreuse.chocolate.coral.cornflowerblue.cornsilk.crimson.cyan.darkblue.darkcyan.darkgoldenrod.darkgray.darkgreen.darkgrey.darkkhaki.darkmagenta.darkolivegreen.darkorange.darkorchid.darkred.darksalmon.darkseagreen.darkslateblue.darkslategray.darkslategrey.darkturquoise.darkviolet.deeppink.deepskyblue.dimgray.dimgrey.dodgerblue.firebrick.floralwhite.forestgreen.fuchsia.gainsboro.ghostwhite.gold.goldenrod.gray.green.greenyellow.grey.honeydew.hotpink.indianred.indigo.ivory.khaki.lavender.lavenderblush.lawngreen.lemonchiffon.lightblue.lightcoral.lightcyan.lightgoldenrodyellow.lightgray.lightgreen.lightgrey.lightpink.lightsalmon.lightseagreen.lightskyblue.lightslategray.lightslategrey.lightsteelblue.lightyellow.lime.limegreen.linen.magenta.maroon.mediumaquamarine.mediumblue.mediumorchid.mediumpurple.mediumseagreen.mediumslateblue.mediumspringgreen.mediumturquoise.mediumvioletred.midnightblue.mintcream.mistyrose.moccasin.navajowhite.navy.oldlace.olive.olivedrab.orange.orangered.orchid.palegoldenrod.palegreen.paleturquoise.palevioletred.papayawhip.peachpuff.peru.pink.plum.powderblue.purple.rebeccapurple.red.rosybrown.royalblue.saddlebrown.salmon.sandybrown.seagreen.seashell.sienna.silver.skyblue.slateblue.slategray.slategrey.snow.springgreen.steelblue.tan.teal.thistle.tomato.turquoise.violet.wheat.white.whitesmoke.yellow.yellowgreen.transparent.currentcolor".split("."));
function It(e) {
	let t = 0;
	for (let n = 0; n < e.length; n++) if (e[n] === "(" && t++, e[n] === ")" && (t--, t < 0 || t === 0 && n !== e.length - 1)) return !1;
	return t === 0;
}
function Lt(e) {
	let t = e.trim();
	if (t.length === 0 || t.length > 100 || !Pt.test(t)) return !1;
	if (Mt.test(t) || Ft.has(t.toLowerCase())) return !0;
	let n = Nt.exec(t);
	if (n === null || !It(t)) return !1;
	if (n[1]?.toLowerCase() !== "var") return !0;
	let [r, ...i] = (n[2] ?? "").split(",");
	return /^\s*--[a-zA-Z0-9-]+\s*$/.test(r ?? "") && (i.length === 0 || Lt(i.join(",")));
}
var Rt = (e) => e == null;
function zt(e) {
	switch (e.kind) {
		case "number": return N.number(String(e.min), String(e.max));
		case "color": return N.color;
		case "boolean": return N.boolean;
		case "choice": return N.choice(e.choices);
	}
}
function Bt(e, t) {
	switch (e.kind) {
		case "number": return typeof t == "number" && Number.isFinite(t) && t >= e.min && t <= e.max;
		case "color": return typeof t == "string" && Lt(t);
		case "boolean": return typeof t == "boolean";
		case "choice": return typeof t == "string" && e.choices.includes(t);
	}
}
function Vt(e, t) {
	let n = t.split(".").slice(0, -1);
	for (let t = 1; t <= n.length; t++) {
		let r = n.slice(0, t).join("."), i = R(e, r);
		if (!Rt(i) && (typeof i != "object" || Array.isArray(i))) return r;
	}
}
function Ht(e, t) {
	let n = t.flatMap((t) => {
		let n = Vt(e, t.path);
		if (n !== void 0) return [N.invalid(n, N.object)];
		let r = R(e, t.path);
		return Rt(r) || Bt(t, r) ? [] : [N.invalid(t.path, zt(t))];
	});
	return [...new Set(n)];
}
function H(e, t) {
	let n = R(e, t.path);
	return Rt(n) || !Bt(t, n) ? t.default : n;
}
//#endregion
//#region src/lib/units.ts
var U = { scale: 1 }, Ut = {
	temperature: /* @__PURE__ */ new Map([["°c", U], ["°f", {
		scale: 5 / 9,
		offset: -32
	}]]),
	flow: /* @__PURE__ */ new Map([
		["m3/h", U],
		["l/s", { scale: 3.6 }],
		["ft3/min", { scale: 1.69901079552 }]
	]),
	absolute_humidity: /* @__PURE__ */ new Map([["g/m3", U]]),
	relative_humidity: /* @__PURE__ */ new Map([["%", U]]),
	percentage: /* @__PURE__ */ new Map([["%", U]])
};
function Wt(e) {
	return e.trim().replaceAll("º", "°").normalize("NFKC").toLowerCase();
}
function W(e, t) {
	let n = ut(e);
	return n === void 0 ? void 0 : Gt(t, n, e?.attributes.unit_of_measurement);
}
function Gt(e, t, n) {
	if (!Number.isFinite(t) || n === void 0) return;
	let r = Ut[e].get(Wt(n));
	return r ? (t + (r.offset ?? 0)) * r.scale : void 0;
}
//#endregion
//#region src/calc/humidity.ts
var Kt = -100, qt = 100;
function Jt(e, t) {
	if (!(!Number.isFinite(e) || e < Kt || e > qt) && !(!Number.isFinite(t) || t < 0 || t > 100)) return 6.112 * Math.exp(17.67 * e / (e + 243.5)) * t * 2.1674 / (273.15 + e);
}
//#endregion
//#region src/calc/smoothing.ts
var Yt = 6e4, Xt = 1440, Zt = 5 * Yt;
function Qt(e) {
	let t = e.map((e) => Date.parse(e?.last_updated ?? "")).filter(Number.isFinite);
	return t.length > 0 ? Math.max(...t) : void 0;
}
function $t(e, t, n) {
	let r = t - n, i = 0, a = 0;
	for (let n = 0; n < e.length; n++) {
		let o = e[n];
		if (o === void 0 || o.time > t) break;
		let s = e[n + 1], c = n === 0 ? r : Math.max(o.time, r), l = s === void 0 || s.time > t ? t : s.time;
		l <= c || o.value === void 0 || (i += o.value * (l - c), a += l - c);
	}
	return a > 0 ? i / a : void 0;
}
function en(e, t, n) {
	let r = e.at(-1);
	if (r !== void 0) return !(t > 0) || e.length === 1 ? r.value : $t(e, Math.max(n ?? r.time, r.time), t * Yt);
}
function tn(e, t) {
	let n = e.length;
	for (; n > 0 && (e[n - 1]?.time ?? -Infinity) > t.time;) n--;
	e[n - 1]?.time === t.time ? e[n - 1] = t : e.splice(n, 0, t);
}
var nn = class {
	constructor() {
		this.series = /* @__PURE__ */ new Map(), this.listeners = /* @__PURE__ */ new Set();
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	smoothed(e, t, n, r) {
		let i = Number.isFinite(n) ? Math.min(Math.max(0, n), Xt) : 0, a = i * Yt, o = this.series.get(t.key);
		o === void 0 && (o = {
			samples: [],
			windowMs: a,
			history: { state: "none" }
		}, this.series.set(t.key, o)), o.windowMs = Math.max(o.windowMs, a);
		let s = this.add(o, e, t);
		if (a > 0 && this.needsHistory(o) && this.loadHistory(o, e, t), s !== void 0) return o.history.state === "loading" && o.history.first ? s : en(o.samples, i, r);
	}
	needsHistory(e) {
		let { history: t, samples: n, windowMs: r } = e;
		switch (t.state) {
			case "none": return !0;
			case "loading": return !1;
			case "loaded": return r > t.windowMs;
			case "failed": {
				let [e, i] = [n[0], n.at(-1)];
				return !(e !== void 0 && i !== void 0 && e.time <= i.time - r) && Date.now() - t.at >= Zt;
			}
		}
	}
	add(e, t, n) {
		let r = n.entityIds.map((e) => t.states[e]), i = Qt(r);
		if (i === void 0) return;
		let a = n.value(r);
		return tn(e.samples, {
			time: i,
			value: a
		}), this.prune(e), a;
	}
	prune(e) {
		let t = e.samples.at(-1);
		if (t === void 0) return;
		let n = t.time - e.windowMs, r = 0;
		for (; r + 1 < e.samples.length && (e.samples[r + 1]?.time ?? Infinity) <= n;) r++;
		r > 0 && e.samples.splice(0, r);
	}
	async loadHistory(e, t, n) {
		let r = e.windowMs;
		e.history = {
			state: "loading",
			first: e.history.state === "none"
		};
		let i = e.samples.at(-1)?.time ?? Date.now(), a = [];
		try {
			a = rn(await t.callWS({
				type: "history/history_during_period",
				start_time: new Date(i - r).toISOString(),
				end_time: new Date(i).toISOString(),
				entity_ids: [...n.entityIds],
				minimal_response: !0,
				no_attributes: !0
			}), t, n);
		} catch {}
		if (!a.some((e) => e.value !== void 0)) e.history = {
			state: "failed",
			at: Date.now()
		};
		else {
			e.history = {
				state: "loaded",
				windowMs: r
			};
			for (let t of a) tn(e.samples, t);
			this.prune(e), this.listeners.forEach((e) => {
				e();
			});
		}
	}
};
function rn(e, t, n) {
	let r = n.entityIds.flatMap((t, n) => (e[t] ?? []).flatMap((e) => typeof e.lu == "number" && typeof e.s == "string" ? [{
		time: e.lu * 1e3,
		index: n,
		state: e.s
	}] : []));
	r.sort((e, t) => e.time - t.time);
	let i = n.entityIds.map((e) => t.states[e]?.attributes ?? {}), a = n.entityIds.map(() => void 0), o = [];
	for (let e of r) a[e.index] = {
		state: e.state,
		attributes: i[e.index] ?? {}
	}, tn(o, {
		time: e.time,
		value: n.value(a)
	});
	return o;
}
var an = new nn(), G = {
	smoothing: {
		kind: "number",
		path: "smoothing",
		min: 0,
		max: Xt,
		default: 10
	},
	airDensity: {
		kind: "number",
		path: "air_density",
		min: .5,
		max: 1.5,
		default: Ue
	}
}, on = [
	"outdoor",
	"supply",
	"extract"
];
function sn(e, t) {
	let n = ht(e, t);
	if (n !== void 0) return "absolute" in n ? {
		key: n.absolute,
		entityIds: [n.absolute],
		value: ([e]) => W(e, "absolute_humidity")
	} : {
		key: `derived:${n.relative}|${n.temperature}`,
		entityIds: [n.relative, n.temperature],
		value: ([e, t]) => {
			let [n, r] = [W(e, "relative_humidity"), W(t, "temperature")];
			return n === void 0 || r === void 0 ? void 0 : Jt(r, n);
		}
	};
}
function cn(e, t = an) {
	let n = H(e, G.smoothing), r = H(e, G.airDensity), i = on.map((t) => z(e, `${t}.temperature`)), a = on.map((t) => sn(e, t)), o = a.every((e) => e !== void 0) ? a : void 0, s = z(e, "fans.supply_flow"), c = z(e, "bypass.position"), l = [
		...i,
		...(o ?? []).flatMap((e) => e.entityIds),
		s,
		c
	].filter((e) => e !== void 0), u = ([e, t, n]) => ({
		outdoor: e,
		supply: t,
		extract: n
	});
	return (e) => {
		let a = (t, n) => t === void 0 ? void 0 : W(e.states[t], n), d = Qt(l.map((t) => e.states[t])), f = {
			temperature: u(i.map((e) => a(e, "temperature"))),
			supplyFlow: a(s, "flow"),
			bypass: c === void 0 ? 0 : a(c, "percentage"),
			airDensity: r
		};
		o !== void 0 && (f.absoluteHumidity = u(o.map((r) => t.smoothed(e, r, n, d))));
		let p = Ye(f);
		return p === void 0 ? { inputs: f } : {
			inputs: f,
			result: p
		};
	};
}
//#endregion
//#region src/lib/bar.ts
var ln = 250, un = (e) => Math.round(e * 1e6) / 1e6, dn = (e) => Number.isFinite(e) ? e : 0;
function fn(e, t) {
	let n = un(e.reduce((e, t) => e + Math.abs(dn(t)), 0));
	return Math.max(dn(t), Math.ceil(n / ln) * ln);
}
function pn(e, t) {
	let n = (e) => t > 0 ? Math.min(e, t) / t * 50 : 0, r = 0, i = 0;
	return e.map((e) => {
		let t = dn(e);
		if (t >= 0) {
			let e = n(r);
			return r += t, {
				left: 50 + e,
				width: n(r) - e
			};
		}
		let a = n(i);
		i -= t;
		let o = n(i);
		return {
			left: 50 - o,
			width: o - a
		};
	});
}
//#endregion
//#region src/lib/format.ts
var mn = "−";
function hn(e) {
	let t = e?.locale;
	return typeof t == "object" && t ? t : e?.language === void 0 ? {} : { language: e.language };
}
function gn(e) {
	switch (e.number_format) {
		case "comma_decimal": return ["en-US", "en"];
		case "decimal_comma": return [
			"de",
			"es",
			"it"
		];
		case "quote_decimal": return ["de-CH"];
		case "space_comma": return [
			"fr",
			"sv",
			"cs"
		];
		case "none": return ["en-US"];
		case "system": return;
		default: return e.language === void 0 ? void 0 : [e.language];
	}
}
var _n = /* @__PURE__ */ new Map();
function vn(e, t) {
	let n = gn(e), r = e.number_format !== "none", i = `${n?.join(",") ?? ""}|${String(t)}|${String(r)}`, a = _n.get(i);
	return a === void 0 && (a = new Intl.NumberFormat(n, {
		minimumFractionDigits: t,
		maximumFractionDigits: t,
		useGrouping: r
	}), _n.set(i, a)), a;
}
function K(e, t, n = 0) {
	if (!Number.isFinite(e)) return "n/a";
	let r = Number.isFinite(n) ? Math.min(20, Math.max(0, Math.trunc(n))) : 0, i = Math.abs(e) < .5 / 10 ** r ? 0 : e;
	return vn(t ?? {}, r).formatToParts(i).map((e) => e.type === "minusSign" ? mn : e.value).join("");
}
//#endregion
//#region src/cards/bar.ts
var yn = (e) => `repeating-linear-gradient(135deg, ${e} 0 3px, transparent 3px 6px)`, bn = o`
  ha-card {
    /* The outline of the bar, its lanes and the legend swatches: stands out from the card in light and dark themes. */
    --hrv-bar-outline: color-mix(in srgb, var(--secondary-text-color, #727272) 50%, transparent);
    padding: 12px 16px;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 0 12px;
    margin-bottom: 8px;
  }
  .title {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
  }
  .net {
    font-size: 16px;
    font-weight: 500;
  }
  .bar {
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 22px;
    border: 1px solid var(--hrv-bar-outline);
    border-radius: 6px;
    overflow: hidden;
    background: var(--secondary-background-color, #eee);
  }
  .bar.lanes {
    height: 28px;
  }
  .lane {
    position: relative;
    flex: 1 1 0;
  }
  .lane + .lane {
    border-top: 1px solid var(--hrv-bar-outline);
  }
  .seg {
    position: absolute;
    top: 0;
    bottom: 0;
    overflow: hidden;
  }
  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
  }
  .zero {
    position: absolute;
    top: -2px;
    bottom: -2px;
    left: 50%;
    width: 2px;
    margin-left: -1px;
    background: var(--primary-text-color);
    opacity: 0.6;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-top: 8px;
    font-size: 13px;
    color: var(--secondary-text-color);
  }
  /* A legend item: its swatch, words and value stay on one line; lines break between items. */
  .legend .item {
    white-space: nowrap;
  }
  .swatch {
    display: inline-block;
    box-sizing: border-box;
    width: 10px;
    height: 10px;
    border: 1px solid var(--hrv-bar-outline);
    border-radius: 2px;
    margin-right: 6px;
  }
`;
function xn({ left: e, width: t }) {
	if (!(t <= 0)) return {
		left: `${String(-e / t * 100)}%`,
		width: `${String(100 / t * 100)}%`
	};
}
function Sn(e) {
	return w`<div class="bar ${e.length > 1 ? "lanes" : ""}">
    ${e.map((e) => w`<div class="lane">
          ${e.map((e) => {
		let t = xn(e);
		return w`<div
              class="seg"
              style=${A({
			left: `${String(e.left)}%`,
			width: `${String(e.width)}%`
		})}
            >
              ${t ? w`<div class="fill" style=${A({
			...t,
			background: e.background
		})}></div>` : E}
            </div>`;
	})}
        </div>`)}
    <div class="zero"></div>
  </div>`;
}
function Cn(e) {
	return w`<span class="swatch" style=${A({ background: e })}></span>`;
}
//#endregion
//#region src/cards/moisture-view.ts
var wn = {
	paths: ["fans.supply_flow"],
	humidity: {
		streams: [
			"outdoor",
			"supply",
			"extract"
		],
		rule: "required"
	}
}, q = {
	...G,
	neutralThreshold: {
		kind: "number",
		path: "neutral_threshold",
		min: 0,
		max: 5,
		default: .3
	},
	minScale: {
		kind: "number",
		path: "min_scale",
		min: 50,
		max: 1e5,
		default: 250
	},
	dryingColor: {
		kind: "color",
		path: "drying_color",
		default: "#00897b"
	},
	gainingColor: {
		kind: "color",
		path: "gaining_color",
		default: "#8e24aa"
	}
}, Tn = Object.values(q), En = "#fdd835", Dn = (e) => e.extracted < 0, On = (e, t) => Math.abs(e.indoor - e.outdoor) < t, kn = (e) => e === void 0 ? 0 : Math.round(Math.min(Math.max(e, 0), 100));
function An(e) {
	let t = Dn(e), n = t ? -1 : 1, r = (e) => Math.round(e * n);
	return {
		gaining: t,
		extracted: r(e.extracted),
		recovered: r(e.recovered),
		outside: r(e.outside)
	};
}
var jn = (e, t) => ({
	gaining: e.gaining,
	extracted: K(e.extracted, t),
	recovered: K(e.recovered, t),
	outside: K(e.outside, t)
});
function Mn(e, t, n, r) {
	if (t) return {
		title: I.titleNeutral,
		header: I.neutral
	};
	let i = I.header(jn(e, r));
	if (e.extracted > 0) {
		let t = K(e.recovered / e.extracted * 100, r);
		i += I.percent(t, n > 0 ? K(n, r) : void 0);
	}
	return {
		title: e.gaining ? I.titleGaining : I.titleDrying,
		header: i
	};
}
function Nn(e, t, n, r, i) {
	if (e === void 0 || t === void 0) return {
		title: I.title,
		header: "n/a",
		segments: [],
		swatches: void 0,
		lines: []
	};
	let a = Dn(e), o = On(t, r.neutralThreshold), s = a ? r.gainingColor : r.dryingColor, c = kn(n), l = [e.recovered, e.outside], u = fn(l, r.minScale), d = [s, yn(s)], f = pn(l, u).map((e, t) => ({
		...e,
		background: d[t] ?? s
	})), p = An(e), { title: m, header: h } = Mn(p, o, c, i), g = (e) => K(e, i, 1), _ = {
		title: m,
		header: h,
		segments: f,
		swatches: {
			recovered: I.swatchRecovered(a),
			outside: I.swatchOutside(a),
			color: s
		},
		lines: [
			I.flow(jn(p, i)),
			I.humidities(g(t.indoor), g(t.outdoor)),
			I.scale(K(u, i))
		]
	};
	return o || (_.headerColor = s), c > 0 && (_.bypass = {
		position: c,
		text: I.bypass(K(c, i))
	}), _;
}
//#endregion
//#region src/editor/fields.ts
var Pn = { entity: { domain: "sensor" } }, J = (e, { advanced: t = !1, required: n = !1 } = {}) => ({
	name: e,
	selector: Pn,
	...t ? { advanced: t } : {},
	...n ? { required: n } : {}
}), Fn = (e) => ({
	name: e,
	selector: { entity: { domain: "binary_sensor" } }
}), Y = (e, { requiredTemperature: t, advancedAbsolute: n = !0 }) => ({
	type: "expandable",
	name: e,
	schema: [
		J("temperature", { required: t }),
		J("humidity"),
		J("absolute_humidity", { advanced: n })
	]
}), X = (e, t, n, r) => ({
	name: e,
	advanced: !0,
	default: t.default,
	selector: { number: {
		min: t.min,
		max: t.max,
		step: n,
		mode: "box",
		...r === void 0 ? {} : { unit_of_measurement: r }
	} }
}), Z = (e, t) => ({
	name: e,
	advanced: !0,
	default: t,
	selector: { text: {} }
}), In = (e, t, { advanced: n = !1 } = {}) => ({
	name: e,
	default: t.default,
	selector: { boolean: {} },
	...n ? { advanced: n } : {}
}), Ln = (e, t, n) => ({
	name: e,
	advanced: !0,
	default: t.default,
	selector: { select: {
		mode: "dropdown",
		options: t.choices.map((e) => ({
			value: e,
			label: n[e] ?? e
		}))
	} }
}), Rn = {
	type: "expandable",
	name: "fans",
	schema: [J("supply_flow", { required: !0 })]
}, zn = {
	type: "expandable",
	name: "bypass",
	schema: [J("position")]
}, Bn = {
	type: "expandable",
	name: "calculation",
	flatten: !0,
	schema: [X("smoothing", G.smoothing, 1, "min"), X("air_density", G.airDensity, .01, "kg/m³")]
}, Vn = [
	Y("outdoor", { requiredTemperature: !1 }),
	Y("supply", { requiredTemperature: !1 }),
	Y("extract", { requiredTemperature: !1 }),
	Rn,
	zn,
	Bn,
	X("neutral_threshold", q.neutralThreshold, .1, "g/m³"),
	X("min_scale", q.minScale, 50, "g/h"),
	{
		type: "expandable",
		name: "colors",
		flatten: !0,
		schema: [Z("drying_color", q.dryingColor.default), Z("gaining_color", q.gainingColor.default)]
	}
];
//#endregion
//#region src/lib/render.ts
function Hn(e) {
	let t = /* @__PURE__ */ new Set(), n = (e) => {
		for (let r of Object.values(e)) if (typeof r == "object" && r && !Array.isArray(r)) n(r);
		else {
			let e = pt(r);
			e !== void 0 && t.add(e);
		}
	};
	return n(e), [...t];
}
function Un(e, t) {
	return e === t || Array.isArray(e) && Array.isArray(t) && e.length === t.length && e.every((e, n) => e === t[n]);
}
function Wn(e, t) {
	if (e === t) return !0;
	if (typeof e != "object" || typeof t != "object" || e === null || t === null) return !1;
	let n = Object.keys(e), r = Object.keys(t);
	return n.length === r.length && n.every((n) => Object.hasOwn(t, n) && Un(e[n], t[n]));
}
function Gn(e, t, n) {
	return e === void 0 || e.locale !== t.locale || e.language !== t.language || e.localize !== t.localize || e.formatEntityState !== t.formatEntityState || e.themes?.darkMode !== t.themes?.darkMode || n.some((n) => e.states[n] !== t.states[n] || !Wn(e.entities?.[n], t.entities?.[n]));
}
function Kn(e, t, n, r) {
	return e.size === 1 && e.has("hass") ? t !== void 0 && Gn(n, t, r) : !0;
}
//#endregion
//#region src/cards/base-card.ts
function qn(e, t, n) {
	let r = vt(e, t);
	if (r.length > 0) throw Error(rt(r));
	let i = Ht(e, n);
	if (i.length > 0) throw Error(i.join("; "));
}
var Jn = class extends k {
	constructor(...e) {
		super(...e), this.entityIds = [];
	}
	static getStubConfig() {
		return {};
	}
	setConfig(e) {
		this.check(e), this.configure(e), this.calculator = cn(e), this.entityIds = Hn(e), this.config = e;
	}
	connectedCallback() {
		super.connectedCallback(), this.unsubscribe = an.subscribe(() => {
			this.requestUpdate();
		});
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.unsubscribe?.(), this.unsubscribe = void 0;
	}
	shouldUpdate(e) {
		return Kn(e, this.hass, this.rendered, this.entityIds);
	}
	updated() {
		this.rendered = this.hass;
	}
};
B([$e({ attribute: !1 })], Jn.prototype, "hass", void 0), B([et()], Jn.prototype, "config", void 0);
//#endregion
//#region src/cards/bar-card.ts
var Yn = class extends Jn {
	static {
		this.styles = bn;
	}
	getCardSize() {
		return 3;
	}
	getGridOptions() {
		return {
			columns: 12,
			min_columns: 6
		};
	}
}, Xn = "hrv-moisture-balance-card";
function Zn(e) {
	qn(e, wn, Tn);
}
tt(Xn, class extends Yn {
	static {
		this.styles = [bn, o`
      .swatches .item + .item {
        margin-left: 12px;
      }
      .bypass {
        margin-top: 6px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .bypass-strip {
        height: 4px;
        border-radius: 2px;
        background: var(--secondary-background-color, #eee);
        overflow: hidden;
        margin-bottom: 2px;
      }
      .bypass-fill {
        height: 100%;
      }
    `];
	}
	static getConfigElement() {
		let e = document.createElement(Et);
		return e.schema = Vn, e;
	}
	getCardSize() {
		return 4;
	}
	check(e) {
		Zn(e);
	}
	configure(e) {
		this.settings = {
			dryingColor: H(e, q.dryingColor),
			gainingColor: H(e, q.gainingColor),
			neutralThreshold: H(e, q.neutralThreshold),
			minScale: H(e, q.minScale)
		};
	}
	render() {
		if (!this.config || !this.hass || !this.calculator || !this.settings) return E;
		let { inputs: e } = this.calculator(this.hass), t = e.absoluteHumidity, n = e.bypass === void 0 ? void 0 : Xe(t, e.supplyFlow), r = Nn(n, n && t?.extract !== void 0 && t.outdoor !== void 0 ? {
			indoor: t.extract,
			outdoor: t.outdoor
		} : void 0, e.bypass, this.settings, hn(this.hass));
		return w`<ha-card>
      <div class="head">
        <span class="title">${r.title}</span>
        <span class="net" style=${A({ color: r.headerColor ?? "var(--secondary-text-color)" })}
          >${r.header}</span
        >
      </div>
      ${Sn([r.segments])}
      ${r.bypass ? w`<div class="bypass">
              <div class="bypass-strip">
                <div
                  class="bypass-fill"
                  style=${A({
			width: `${String(r.bypass.position)}%`,
			background: En
		})}
                ></div>
              </div>
              <span>${r.bypass.text}</span>
            </div>` : E}
      <div class="legend">
        ${r.swatches ? w`<span class="swatches">
                <span class="item">${Cn(r.swatches.color)}${r.swatches.recovered}</span>
                <span class="item">${Cn(yn(r.swatches.color))}${r.swatches.outside}</span>
              </span>` : E}
        ${r.lines.map((e) => w`<span>${e}</span>`)}
      </div>
    </ha-card>`;
	}
});
//#endregion
//#region src/cards/recovery-view.ts
var Qn = {
	paths: [
		"outdoor.temperature",
		"supply.temperature",
		"extract.temperature",
		"fans.supply_flow"
	],
	humidity: {
		streams: [
			"outdoor",
			"supply",
			"extract"
		],
		rule: "all_or_none"
	}
}, $n = (e, t) => ({
	kind: "color",
	path: e,
	default: t
}), Q = {
	...G,
	minScale: {
		kind: "number",
		path: "min_scale",
		min: 50,
		max: 1e5,
		default: 500
	},
	heatingColor: $n("heating.color", "#db4437"),
	heatingLatent: $n("heating.color_latent", "#f4a09a"),
	coolingColor: $n("cooling.color", "#039be5"),
	coolingLatent: $n("cooling.color_latent", "#8fd3f7")
}, er = Object.values(Q);
function tr(e, t, n) {
	if (e === void 0) return {
		title: F.titleNoValue,
		header: "n/a",
		lanes: [],
		legend: []
	};
	let { color: r, latent: i } = t.colors[e.mode], a = Math.round, o = (e) => K(e, n), s = {
		sensible: a(e.recovered.sensible),
		latent: a(e.recovered.latent)
	}, c = {
		sensible: a(e.lost.sensible),
		latent: a(e.lost.latent)
	}, l = (e, t, n) => ({
		values: [e, t],
		backgrounds: [n, yn(n)]
	}), u = [l(s.sensible, c.sensible, r)];
	e.latentKnown && u.push(l(s.latent, c.latent, i));
	let d = Math.max(...u.map(({ values: e }) => fn(e, t.minScale))), f = u.map(({ values: e, backgrounds: t }) => pn(e, d).map((e, n) => ({
		...e,
		background: t[n] ?? r
	}))), p = s.sensible + s.latent, m = p + c.sensible + c.latent, [h, g] = e.freeCooling ? [F.headerFreeCooling, F.headerFreeCoolingNoPotential] : [F.header, F.headerNoPotential], _ = m > 0 ? h(o(p), o(m), K(p / m * 100, n)) : g(o(p)), [ee, v] = e.freeCooling ? [F.cooling, F.missed] : [F.recovered, F.lost], y = [{
		kind: "part",
		color: r,
		label: F.laneSensible,
		recovered: ee(o(s.sensible)),
		lost: v(o(c.sensible))
	}];
	if (e.latentKnown && (y.push({
		kind: "part",
		color: i,
		label: F.laneLatent,
		recovered: ee(o(s.latent)),
		lost: v(o(c.latent))
	}), e.moisture)) {
		let t = e.moisture.recovered, n = t < 0 ? F.waterKeptOut(o(-t)) : F.water(o(t));
		y.push({
			kind: "text",
			text: n
		});
	}
	return y.push({
		kind: "text",
		text: F.scale(o(d))
	}), {
		title: e.freeCooling ? F.titleFreeCooling : e.mode === "heating" ? F.titleHeating : F.titleCooling,
		header: _,
		headerColor: r,
		lanes: f,
		legend: y
	};
}
//#endregion
//#region src/editor/recovery-schema.ts
var nr = [
	Y("outdoor", { requiredTemperature: !0 }),
	Y("supply", { requiredTemperature: !0 }),
	Y("extract", { requiredTemperature: !0 }),
	Rn,
	zn,
	Bn,
	X("min_scale", Q.minScale, 50, "W"),
	{
		type: "expandable",
		name: "heating",
		schema: [Z("color", Q.heatingColor.default), Z("color_latent", Q.heatingLatent.default)]
	},
	{
		type: "expandable",
		name: "cooling",
		schema: [Z("color", Q.coolingColor.default), Z("color_latent", Q.coolingLatent.default)]
	}
], rr = "hrv-recovery-balance-card";
function ir(e) {
	qn(e, Qn, er);
}
tt(rr, class extends Yn {
	constructor(...e) {
		super(...e), this.minScale = Q.minScale.default;
	}
	static {
		this.styles = [bn, o`
      ha-card {
        container-type: inline-size;
      }
      .parts {
        flex-basis: 100%;
        display: grid;
        grid-template-columns: repeat(3, max-content);
        gap: 2px 16px;
      }
      .part {
        display: contents;
      }
      .lane-name {
        font-weight: 500;
      }
      @container (width < 400px) {
        .parts {
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 6px 16px;
        }
        .part {
          display: grid;
          gap: 2px;
          align-content: start;
        }
      }
    `];
	}
	getCardSize() {
		return 4;
	}
	static getConfigElement() {
		let e = document.createElement(Et);
		return e.schema = nr, e;
	}
	check(e) {
		ir(e);
	}
	configure(e) {
		this.colors = {
			heating: {
				color: H(e, Q.heatingColor),
				latent: H(e, Q.heatingLatent)
			},
			cooling: {
				color: H(e, Q.coolingColor),
				latent: H(e, Q.coolingLatent)
			}
		}, this.minScale = H(e, Q.minScale);
	}
	render() {
		if (!this.config || !this.hass || !this.calculator || !this.colors) return E;
		let { result: e } = this.calculator(this.hass), t = tr(e, {
			colors: this.colors,
			minScale: this.minScale
		}, hn(this.hass)), n = t.legend.filter((e) => e.kind === "part"), r = t.legend.filter((e) => e.kind === "text");
		return w`<ha-card>
      <div class="head">
        <span class="title">${t.title}</span>
        <span class="net" style=${A({ color: t.headerColor ?? "var(--secondary-text-color)" })}
          >${t.header}</span
        >
      </div>
      ${Sn(t.lanes)}
      <div class="legend">
        <div class="parts">
          ${n.map((e) => w`<div class="part">
                <span class="lane-name">${e.label}</span>
                <span class="item">${Cn(e.color)}${e.recovered}</span>
                <span class="item">${Cn(yn(e.color))}${e.lost}</span>
              </div>`)}
        </div>
        ${r.map((e) => w`<span>${e.text}</span>`)}
      </div>
    </ha-card>`;
	}
});
//#endregion
//#region node_modules/lit-html/directives/if-defined.js
var ar = (e) => e ?? E, or = {
	paths: [
		"outdoor.temperature",
		"supply.temperature",
		"extract.temperature",
		"fans.supply_flow"
	],
	humidity: {
		streams: [
			"outdoor",
			"supply",
			"extract"
		],
		rule: "required"
	}
}, sr = (e) => vt(e, or).length === 0;
function cr(e, t, n) {
	if (e === void 0) return t.showUnavailable ? {
		kind: "grey",
		text: "n/a"
	} : void 0;
	let r = at.saving(K(e.saving, n));
	return e.saving <= .5 ? {
		kind: "grey",
		text: r
	} : e.mode === "heating" ? {
		kind: "warm",
		text: r,
		tint: t.colors.warm
	} : {
		kind: "cold",
		text: r,
		tint: t.colors.cold
	};
}
//#endregion
//#region src/diagram/drawing.ts
var lr = {
	width: 400,
	height: 200
}, ur = {
	supply: "M 86 62 C 160 62 240 138 306 138",
	exhaust: "M 314 62 C 240 62 160 138 94 138",
	bypass: "M 86 62 C 146 62 124 192 200 192 C 272 192 280 138 306 138"
}, dr = 14, fr = {
	supply: "306,124 326,138 306,152",
	exhaust: "94,124 74,138 94,152"
}, pr = "175.8,26 224.2,26 255,100 224.2,174 175.8,174 145,100", mr = "181.3,38 218.7,38 240.7,100 218.7,162 181.3,162 159.3,100", hr = "M 6.5 18 A 4.5 4.5 0 0 1 6 9.05 A 6 6 0 0 1 17.5 10 A 4 4 0 0 1 17.5 18 Z", gr = "M 12 4 L 21 12 L 18 12 L 18 20 L 14 20 L 14 15 L 10 15 L 10 20 L 6 20 L 6 12 L 3 12 Z", _r = 0;
function vr() {
	_r += 1;
	let e = String(_r);
	return {
		supply: `hrv-supply-${e}`,
		exhaust: `hrv-exhaust-${e}`
	};
}
var yr = 1.5;
function br(e, t) {
	let n = t > 0 ? Math.round(yr / t * 1e3) / 1e3 : yr;
	return {
		[`--${e}-duration`]: `${String(n)}s`,
		[`--${e}-state`]: t > 0 ? "running" : "paused"
	};
}
function xr(e, t, n) {
	if (n <= 0) return null;
	let r = e === "exhaust" ? "exhaust" : "supply";
	return Se`<path class="stream ${e}" d=${ur[e]} stroke=${t} stroke-width=${dr}
      opacity=${n}></path>
    <path class="flow ${r}-air" d=${ur[e]} opacity=${n}></path>`;
}
var Sr = (e, t) => Se`<stop offset=${e} style=${A({ "stop-color": t })}></stop>`, Cr = (e, t, n) => Se`<g class="symbol">
    <circle cx=${e} cy="100" r="20" style=${A({ fill: t })}></circle>
    <path d=${n} transform="translate(${String(e - 12)} ${"88"})"></path>
  </g>`;
function wr({ ids: e, colors: t, bypass: n, speeds: r }) {
	let i = (e) => Math.round(e * 1e3) / 1e3, [a, o] = [i(n), i(1 - n)], s = `url(#${e.supply})`, c = `url(#${e.exhaust})`;
	return Se`<svg
    class="art"
    viewBox="0 0 ${String(lr.width)} ${String(lr.height)}"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    style=${A({
		...br("supply", r.supply),
		...br("exhaust", r.exhaust)
	})}
  >
    <defs>
      <linearGradient id=${e.supply} gradientUnits="userSpaceOnUse" x1="86" y1="62" x2="326" y2="138">
        ${Sr("0", t.outdoor)}${Sr("1", t.supply)}
      </linearGradient>
      <linearGradient id=${e.exhaust} gradientUnits="userSpaceOnUse" x1="314" y1="62" x2="74" y2="138">
        ${Sr("0", t.extract)}${Sr("1", t.exhaust)}
      </linearGradient>
    </defs>
    ${Cr(36, t.outdoor, hr)}
    ${Cr(364, t.extract, gr)}
    <polygon class="exchanger" points=${pr}></polygon>
    <polygon class="exchanger-inner" points=${mr}></polygon>
    ${xr("bypass", s, a)}
    ${xr("supply", s, o)}
    <polygon class="head" points=${fr.supply} style=${A({ fill: t.supply })}></polygon>
    ${xr("exhaust", c, 1)}
    <polygon class="head" points=${fr.exhaust} style=${A({ fill: t.exhaust })}></polygon>
  </svg>`;
}
//#endregion
//#region src/diagram/flow.ts
var Tr = .25;
function Er(e, t) {
	let n = ut(e);
	return n === void 0 ? 1 : n <= 0 ? 0 : t === void 0 || t <= 0 ? 1 : Math.min(Math.max(n / t, Tr), 2);
}
function Dr(e, t) {
	return e === "auto" ? t !== void 0 && t > 0 && t < 340 : e === "compact";
}
var Or = ["status.power", "status.rmot"], kr = ["seasons.heating", "seasons.cooling"], Ar = ["fans.supply_flow", "fans.exhaust_flow"], jr = [
	"fans.level",
	"bypass.mode",
	"bypass.next_change",
	"status.operating_mode",
	"status.target_temperature",
	"status.temperature_profile",
	"status.next_fan_change",
	"status.filter_days"
], Mr = {
	"fans.level": {
		column: 1,
		row: 1
	},
	"status.next_fan_change": {
		column: 1,
		row: 2
	},
	"status.filter_days": {
		column: 1,
		row: 3
	},
	"bypass.mode": {
		column: 2,
		row: 1
	},
	"bypass.next_change": {
		column: 2,
		row: 2
	},
	"status.operating_mode": {
		column: 3,
		row: 1
	},
	"status.temperature_profile": {
		column: 3,
		row: 2
	},
	"status.target_temperature": {
		column: 3,
		row: 3
	}
}, Nr = { "status.rmot": at.prefixes.rmot }, Pr = {
	"status.power": "mdi:lightning-bolt",
	"status.rmot": "mdi:thermometer-lines",
	"fans.level": "mdi:fan",
	"bypass.mode": "mdi:shuffle-variant",
	"bypass.next_change": "mdi:timer-outline",
	"status.operating_mode": "mdi:cog-outline",
	"status.target_temperature": "mdi:thermometer",
	"status.temperature_profile": "mdi:thermostat",
	"status.next_fan_change": "mdi:timer-outline",
	"status.filter_days": "mdi:air-filter"
}, Fr = /* @__PURE__ */ new Set(["bypass.next_change", "status.next_fan_change"]), Ir = /^\s*n\/a\s*$/i;
function Lr(e, t) {
	return Fr.has(e) && (Ir.test(t?.state ?? "") || t?.state === "unknown");
}
function Rr(e, t, n) {
	return Lr(e, t) ? !0 : e === "bypass.position" && ut(t) === 0 ? !1 : n || !ct(t);
}
function zr(e, t, { showUnavailable: n, compact: r }) {
	let i = (r) => r.flatMap((r) => {
		let i = z(e, r);
		if (i === void 0) return [];
		let a = t[i], o = Rr(r, a, n), s = Pr[r];
		return [{
			role: r,
			entityId: i,
			...s === void 0 ? {} : { icon: s },
			prefix: Nr[r] ?? "",
			visible: o,
			...Lr(r, a) ? { notPlanned: !0 } : {}
		}];
	}), a = (t) => t.some((t) => z(e, t) !== void 0), o = {
		corners: L((e) => i(r ? [`${e}.temperature`, `${e}.humidity`] : [
			`${e}.temperature`,
			`${e}.humidity`,
			`${e}.absolute_humidity`
		])),
		centre: i(["bypass.position"]),
		flows: r ? [] : i(Ar)
	};
	return a([...Or, ...kr]) && (o.top = i(Or)), r || a(jr) && (o.status = i(jr)), o;
}
//#endregion
//#region src/diagram/options.ts
var Br = { paths: [
	"outdoor.temperature",
	"supply.temperature",
	"extract.temperature",
	"exhaust.temperature"
] }, Vr = [
	"auto",
	"full",
	"compact"
], $ = {
	...G,
	cold: {
		kind: "color",
		path: "colors.cold",
		default: "#039be5"
	},
	warm: {
		kind: "color",
		path: "colors.warm",
		default: "#db4437"
	},
	animation: {
		kind: "boolean",
		path: "animation.enabled",
		default: !0
	},
	nominalFlow: {
		kind: "number",
		path: "animation.nominal_flow",
		min: 1,
		max: 1e5,
		default: void 0
	},
	layout: {
		kind: "choice",
		path: "layout",
		choices: Vr,
		default: "auto"
	},
	showUnavailable: {
		kind: "boolean",
		path: "show_unavailable",
		default: !1
	}
}, Hr = Object.values($), Ur = {
	heating: "mdi:sun-thermometer",
	cooling: "mdi:snowflake-thermometer",
	between: "mdi:sun-snowflake-variant"
};
function Wr(e, t, n) {
	let r = z(e, "seasons.heating"), i = z(e, "seasons.cooling"), a = (e) => t[e]?.state, o = (e, t, n) => ({
		season: e,
		icon: Ur[e],
		color: t,
		title: at.seasons[e],
		entityId: n
	});
	if (r !== void 0 && a(r) === "on") return o("heating", n.warm, r);
	if (i !== void 0 && a(i) === "on") return o("cooling", n.cold, i);
	if (r !== void 0 && i !== void 0 && a(r) === "off" && a(i) === "off") return o("between", "var(--secondary-text-color)", r);
}
//#endregion
//#region src/diagram/streams.ts
var Gr = "var(--disabled-text-color, #9e9e9e)", Kr = 10;
function qr(e) {
	let t = ut(e);
	return t === void 0 ? 0 : Math.min(Math.max(t / 100, 0), 1);
}
function Jr(e) {
	let t = L((t) => W(e[t], "temperature")), n = Object.values(t).filter((e) => e !== void 0), r = Math.min(...n), i = Math.max(...n), a = Math.max(i - r, Kr), o = (r + i) / 2 - a / 2, s = (e) => e === void 0 ? void 0 : Math.min(Math.max((e - o) / a, 0), 1);
	return L((e) => s(t[e]));
}
function Yr(e, t) {
	if (e === void 0) return Gr;
	let n = Math.round(e * 1e3) / 10;
	return n <= 0 ? t.cold : n >= 100 ? t.warm : `color-mix(in srgb, ${t.warm} ${String(n)}%, ${t.cold})`;
}
function Xr(e, t) {
	let n = Jr(e);
	return L((e) => Yr(n[e], t));
}
//#endregion
//#region src/editor/diagram-schema.ts
var Zr = { advanced: !0 }, Qr = [
	Y("outdoor", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	Y("supply", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	Y("extract", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	Y("exhaust", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	{
		type: "expandable",
		name: "fans",
		schema: [
			J("level"),
			J("supply_flow"),
			J("exhaust_flow")
		]
	},
	{
		type: "expandable",
		name: "bypass",
		schema: [
			J("position"),
			J("mode"),
			J("next_change", Zr)
		]
	},
	{
		type: "expandable",
		name: "status",
		schema: [
			J("operating_mode"),
			J("target_temperature", Zr),
			J("temperature_profile", Zr),
			J("next_fan_change", Zr),
			J("filter_days"),
			J("power"),
			J("rmot")
		]
	},
	{
		type: "expandable",
		name: "seasons",
		schema: [Fn("heating"), Fn("cooling")]
	},
	{
		type: "expandable",
		name: "animation",
		schema: [In("enabled", $.animation), X("nominal_flow", $.nominalFlow, 1)]
	},
	Bn,
	{
		type: "expandable",
		name: "colors",
		schema: [Z("cold", $.cold.default), Z("warm", $.warm.default)]
	},
	Ln("layout", $.layout, P.layouts),
	In("show_unavailable", $.showUnavailable, Zr)
], $r = (e, t) => t === void 0 ? void 0 : e[t];
function ei(e, t) {
	let n = e.states[t];
	if (n === void 0) return "n/a";
	if (typeof e.formatEntityState == "function") return e.formatEntityState(n);
	let r = n.attributes.unit_of_measurement;
	return r && !ct(n) ? `${n.state} ${r}` : n.state;
}
//#endregion
//#region src/cards/ventilation-card.ts
var ti = "hrv-ventilation-card";
function ni(e) {
	qn(e, Br, Hr);
}
var ri = (e, t) => {
	let n = nt[e];
	return `${n.charAt(0).toUpperCase()}${n.slice(1)}: ${t}`;
}, ii = class extends Jn {
	constructor(...e) {
		super(...e), this.compact = !1, this.observer = new ResizeObserver((e) => {
			this.width = e[0]?.contentRect.width, this.updateCompact();
		}), this.ids = vr(), this.activate = (e) => {
			if (e instanceof KeyboardEvent) {
				let t = e.ctrlKey || e.altKey || e.metaKey;
				if (e.key !== "Enter" && e.key !== " " || e.repeat || t) return;
			}
			let t = e.target.closest("[data-entity]")?.dataset.entity;
			t !== void 0 && (e.preventDefault(), this.dispatchEvent(new CustomEvent("hass-more-info", {
				detail: { entityId: t },
				bubbles: !0,
				composed: !0
			})));
		};
	}
	static {
		this.styles = o`
    /* The host is the container the label sizes follow: cqi units resolve against an ancestor container. */
    :host {
      display: block;
      container-type: inline-size;
    }
    ha-card {
      padding: 8px 12px;
      color: var(--primary-text-color);
      font-size: clamp(11px, 3.4cqi, 14px);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 2px 12px;
      min-height: 1.5em;
    }
    /* Season left, power centred on the card, RMOT right, whatever their widths. */
    /* The separators below the top row and above the status grid span the content width, corner stack to corner stack. */
    .top {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--divider-color);
    }
    .top > :last-child {
      justify-self: end;
    }
    /*
     * Three equal columns of a fixed width, one subject each, centred under the drawing; every role has a fixed cell
     * (STATUS_CELLS).
     */
    .status {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 9em));
      justify-content: center;
      gap: 2px 16px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid var(--divider-color);
      color: var(--secondary-text-color);
    }
    .status .cell {
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .not-planned .value {
      opacity: 0.6;
    }
    .drawing {
      position: relative;
      aspect-ratio: 2 / 1;
    }
    .art {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .exchanger {
      fill: var(--secondary-background-color);
      stroke: var(--divider-color);
      stroke-width: 2;
    }
    .exchanger-inner {
      fill: none;
      stroke: var(--divider-color);
      stroke-width: 1.5;
    }
    .stream {
      fill: none;
    }
    /* Moving air: short dashes in a tint towards the card background, moved along the path. */
    .flow {
      fill: none;
      stroke: var(--card-background-color, var(--primary-background-color));
      stroke-opacity: 0.6;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-dasharray: 3 21;
      animation: hrv-flow linear infinite;
    }
    .supply-air {
      animation-duration: var(--supply-duration);
      animation-play-state: var(--supply-state);
    }
    .exhaust-air {
      animation-duration: var(--exhaust-duration);
      animation-play-state: var(--exhaust-state);
    }
    @keyframes hrv-flow {
      to {
        stroke-dashoffset: -24;
      }
    }
    .still .flow {
      animation: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .flow {
        animation: none;
      }
    }
    .symbol path {
      fill: var(--card-background-color, var(--primary-background-color));
    }
    /* Label positions in % of the drawing band, which has the drawing's 400 by 200 coordinates (see drawing.ts). */
    .corner,
    .on-drawing {
      position: absolute;
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    /* Just below the exchanger's inner outline (y 38). */
    .bypass-position {
      top: 20.5%;
      left: 50%;
      transform: translateX(-50%);
    }
    /* On the exchanger's centre. */
    .saving {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    /* Above the arrow tips (y 124), clear of the symbols (x 56 and 344) and of the bypass path; a little smaller. */
    .exhaust-flow,
    .supply-flow {
      bottom: 39%;
      font-size: max(11px, 0.9em);
    }
    .exhaust-flow {
      left: 15.5%;
    }
    .supply-flow {
      right: 15.5%;
    }
    .corner.outdoor {
      top: 0;
      left: 0;
    }
    .corner.extract {
      top: 0;
      right: 0;
      align-items: flex-end;
    }
    .corner.exhaust {
      bottom: 0;
      left: 0;
    }
    .corner.supply {
      bottom: 0;
      right: 0;
      align-items: flex-end;
    }
    .label {
      cursor: pointer;
      white-space: nowrap;
    }
    /* A label's icon: the height of its text, on the text's baseline. */
    .label ha-icon {
      --mdc-icon-size: 1.15em;
      vertical-align: -0.2em;
      margin-right: 3px;
    }
    .hidden {
      visibility: hidden;
    }
    .temperature {
      font-weight: 500;
    }
    /*
     * A hexagon like the exchanger: the outline is the element's background, clipped to the hexagon, with the fill
     * drawn on top by ::before, inset by the outline's width. The colours come from --badge-border and --badge-fill.
     */
    .badge {
      --slant: 0.6em;
      --hexagon: polygon(
        var(--slant) 0,
        calc(100% - var(--slant)) 0,
        100% 50%,
        calc(100% - var(--slant)) 100%,
        var(--slant) 100%,
        0 50%
      );
      position: relative;
      isolation: isolate;
      display: block;
      cursor: pointer;
      padding: 3px calc(var(--slant) + 4px);
      white-space: nowrap;
      background: var(--badge-border, var(--divider-color));
      clip-path: var(--hexagon);
    }
    /* The hexagon clips the focus ring, so focus shows as the outline colour (over a tint set inline). */
    .badge:focus-visible {
      outline: none;
      background: var(--primary-color, currentColor);
    }
    .badge::before {
      content: '';
      position: absolute;
      inset: 1.5px;
      z-index: -1;
      background: var(--badge-fill, var(--secondary-background-color));
      clip-path: var(--hexagon);
    }
    ha-icon.season {
      cursor: pointer;
      --mdc-icon-size: 22px;
    }
  `;
	}
	static getConfigElement() {
		let e = document.createElement(Et);
		return e.schema = Qr, e;
	}
	getCardSize() {
		return 6;
	}
	getGridOptions() {
		return {
			columns: 12,
			min_columns: 9
		};
	}
	check(e) {
		ni(e);
	}
	configure(e) {
		this.settings = {
			colors: {
				cold: H(e, $.cold),
				warm: H(e, $.warm)
			},
			layout: H(e, $.layout),
			showUnavailable: H(e, $.showUnavailable),
			badge: sr(e),
			temperatures: L((t) => z(e, `${t}.temperature`)),
			bypass: z(e, "bypass.position"),
			flows: {
				supply: z(e, "fans.supply_flow"),
				exhaust: z(e, "fans.exhaust_flow")
			},
			animate: H(e, $.animation),
			nominalFlow: H(e, $.nominalFlow)
		}, this.updateCompact();
	}
	updateCompact() {
		if (!this.settings) return;
		let e = Dr(this.settings.layout, this.width);
		e !== this.compact && (this.compact = e);
	}
	connectedCallback() {
		super.connectedCallback(), this.observer.observe(this);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.observer.disconnect();
	}
	label(e) {
		let t = this.hass ? ei(this.hass, e.entityId) : "", n = e.role.split(".")[1] ?? "", r = e.icon ? w`<ha-icon .icon=${e.icon} aria-hidden="true"></ha-icon>` : E;
		if (!e.visible) return w`<span class="label ${n} hidden" aria-hidden="true">${r}${e.prefix}${t}</span>`;
		let i = e.notPlanned ? w`<span class="value">${at.notPlanned}</span>` : t;
		return w`<span
      class="label ${n} ${e.notPlanned ? "not-planned" : ""}"
      role="button"
      tabindex="0"
      aria-label="${nt[e.role]}: ${t}"
      title=${ri(e.role, t)}
      data-entity=${e.entityId}
      >${r}${e.prefix}${i}</span
    >`;
	}
	topRow(e, t) {
		let n = (t) => {
			let n = e.find((e) => e.role === t);
			return n ? this.label(n) : E;
		};
		return w`<div class="row top">
      <span>${this.season(t)}</span><span>${n("status.power")}</span><span>${n("status.rmot")}</span>
    </div>`;
	}
	statusGrid(e) {
		return w`<div class="status">
      ${e.map((e) => {
			let t = Mr[e.role];
			return w`<div
          class="cell"
          style=${A({
				"grid-column": String(t.column),
				"grid-row": String(t.row)
			})}
        >
          ${this.label(e)}
        </div>`;
		})}
    </div>`;
	}
	season(e) {
		return e ? w`<ha-icon
      class="season"
      .icon=${e.icon}
      title=${e.title}
      aria-label=${e.title}
      role="button"
      tabindex="0"
      data-entity=${e.entityId}
      style=${A({ color: e.color })}
    ></ha-icon>` : E;
	}
	badge(e) {
		if (!e) return E;
		let t = e.tint === void 0 ? {} : {
			"--badge-fill": `color-mix(in srgb, ${e.tint} 25%, var(--card-background-color, #fff))`,
			"--badge-border": e.tint
		};
		return w`<span
      class="badge ${e.kind}"
      role="button"
      tabindex="0"
      data-entity=${ar(this.settings?.temperatures.supply)}
      style=${A(t)}
      >${e.text}</span
    >`;
	}
	render() {
		if (!this.config || !this.hass || !this.settings) return E;
		let { settings: e, hass: t } = this, { compact: n } = this, r = zr(this.config, t.states, {
			showUnavailable: e.showUnavailable,
			compact: n
		}), i = Wr(this.config, t.states, e.colors), a = e.badge && this.calculator ? cr(this.calculator(t).result, e, hn(t)) : void 0, { states: o } = t, { temperatures: s, flows: c } = e, l = wr({
			ids: this.ids,
			colors: Xr(L((e) => $r(o, s[e])), e.colors),
			bypass: qr($r(o, e.bypass)),
			speeds: {
				supply: Er($r(o, c.supply), e.nominalFlow),
				exhaust: Er($r(o, c.exhaust), e.nominalFlow)
			}
		});
		return w`<ha-card @click=${this.activate} @keydown=${this.activate}>
      ${r.top ? this.topRow(r.top, i) : E}
      <div class="drawing ${e.animate ? "" : "still"}">
        ${l}
        ${dt.map((e) => w`<div class="corner ${e}">${r.corners[e].map((e) => this.label(e))}</div>`)}
        <div class="on-drawing bypass-position">${r.centre.map((e) => this.label(e))}</div>
        ${a ? w`<div class="on-drawing saving">${this.badge(a)}</div>` : E}
        ${r.flows.map((e) => w`<div class="on-drawing ${e.role === "fans.supply_flow" ? "supply-flow" : "exhaust-flow"}">
              ${this.label(e)}
            </div>`)}
      </div>
      ${r.status ? this.statusGrid(r.status) : E}
    </ha-card>`;
	}
};
B([et()], ii.prototype, "compact", void 0), tt(ti, ii);
//#endregion
//#region src/index.ts
var ai = [
	{
		type: ti,
		...it.diagram,
		preview: !1
	},
	{
		type: rr,
		...it.recovery,
		preview: !1
	},
	{
		type: Xn,
		...it.moisture,
		preview: !1
	}
];
function oi(e = window) {
	let t = e.customCards ??= [];
	for (let e of ai) t.some((t) => t.type === e.type) || t.push({ ...e });
}
oi();
//#endregion
export { ai as CARD_ENTRIES, oi as registerCardPicker };

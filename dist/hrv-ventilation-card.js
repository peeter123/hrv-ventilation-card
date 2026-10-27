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
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: p, getPrototypeOf: m } = Object, h = globalThis, g = h.trustedTypes, _ = g ? g.emptyScript : "", v = h.reactiveElementPolyfillSupport, y = (e, t) => e, b = {
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
}, x = (e, t) => !l(e, t), S = {
	attribute: !0,
	type: String,
	converter: b,
	reflect: !1,
	useDefault: !1,
	hasChanged: x
};
Symbol.metadata ??= Symbol("metadata"), h.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var C = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = S) {
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
		return this.elementProperties.get(e) ?? S;
	}
	static _$Ei() {
		if (this.hasOwnProperty(y("elementProperties"))) return;
		let e = m(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(y("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(y("properties"))) {
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
			let i = (n.converter?.toAttribute === void 0 ? b : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? b : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? x)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
C.elementStyles = [], C.shadowRootOptions = { mode: "open" }, C[y("elementProperties")] = /* @__PURE__ */ new Map(), C[y("finalized")] = /* @__PURE__ */ new Map(), v?.({ ReactiveElement: C }), (h.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var ee = globalThis, te = (e) => e, ne = ee.trustedTypes, re = ne ? ne.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ie = "$lit$", w = `lit$${Math.random().toFixed(9).slice(2)}$`, ae = "?" + w, oe = `<${ae}>`, se = document, ce = () => se.createComment(""), le = (e) => e === null || typeof e != "object" && typeof e != "function", ue = Array.isArray, de = (e) => ue(e) || typeof e?.[Symbol.iterator] == "function", fe = "[ 	\n\f\r]", pe = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, me = /-->/g, he = />/g, T = RegExp(`>|${fe}(?:([^\\s"'>=/]+)(${fe}*=${fe}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ge = /'/g, _e = /"/g, ve = /^(?:script|style|textarea|title)$/i, ye = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), E = ye(1), D = ye(2), be = Symbol.for("lit-noChange"), O = Symbol.for("lit-nothing"), xe = /* @__PURE__ */ new WeakMap(), Se = se.createTreeWalker(se, 129);
function Ce(e, t) {
	if (!ue(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return re === void 0 ? t : re.createHTML(t);
}
var we = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = pe;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === pe ? c[1] === "!--" ? o = me : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = T) : (ve.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = T) : o = he : o === T ? c[0] === ">" ? (o = i ?? pe, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? T : c[3] === "\"" ? _e : ge) : o === _e || o === ge ? o = T : o === me || o === he ? o = pe : (o = T, i = void 0);
		let d = o === T && e[t + 1].startsWith("/>") ? " " : "";
		a += o === pe ? n + oe : l >= 0 ? (r.push(s), n.slice(0, l) + ie + n.slice(l) + w + d) : n + w + (l === -2 ? t : d);
	}
	return [Ce(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, Te = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = we(t, n);
		if (this.el = e.createElement(l, r), Se.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = Se.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(ie)) {
					let t = u[o++], n = i.getAttribute(e).split(w), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ae : r[1] === "?" ? je : r[1] === "@" ? Me : ke
					}), i.removeAttribute(e);
				} else e.startsWith(w) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (ve.test(i.tagName)) {
					let e = i.textContent.split(w), t = e.length - 1;
					if (t > 0) {
						i.textContent = ne ? ne.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], ce()), Se.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], ce());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === ae) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(w, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += w.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = se.createElement("template");
		return n.innerHTML = e, n;
	}
};
function Ee(e, t, n = e, r) {
	if (t === be) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = le(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = Ee(e, i._$AS(e, t.values), i, r)), t;
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? se).importNode(t, !0);
		Se.currentNode = r;
		let i = Se.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Oe(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Ne(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = Se.nextNode(), a++);
		}
		return Se.currentNode = se, r;
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
		this.type = 2, this._$AH = O, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = Ee(this, e, t), le(e) ? e === O || e == null || e === "" ? (this._$AH !== O && this._$AR(), this._$AH = O) : e !== this._$AH && e !== be && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? de(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== O && le(this._$AH) ? this._$AA.nextSibling.data = e : this.T(se.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Te.createElement(Ce(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new De(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = xe.get(e.strings);
		return t === void 0 && xe.set(e.strings, t = new Te(e)), t;
	}
	k(t) {
		ue(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(ce()), this.O(ce()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = te(e).nextSibling;
			te(e).remove(), e = t;
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
		this.type = 1, this._$AH = O, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = O;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = Ee(this, e, t, 0), a = !le(e) || e !== this._$AH && e !== be, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = Ee(this, r[n + o], t, o), s === be && (s = this._$AH[o]), a ||= !le(s) || s !== this._$AH[o], s === O ? e = O : e !== O && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === O ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ae = class extends ke {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === O ? void 0 : e;
	}
}, je = class extends ke {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== O);
	}
}, Me = class extends ke {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = Ee(this, e, t, 0) ?? O) === be) return;
		let n = this._$AH, r = e === O && n !== O || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== O && (n === O || r);
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
		Ee(this, e);
	}
}, Pe = ee.litHtmlPolyfillSupport;
Pe?.(Te, Oe), (ee.litHtmlVersions ??= []).push("3.3.3");
var Fe = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Oe(t.insertBefore(ce(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Ie = globalThis, Le = class extends C {
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
		return be;
	}
};
Le._$litElement$ = !0, Le.finalized = !0, Ie.litElementHydrateSupport?.({ LitElement: Le });
var Re = Ie.litElementPolyfillSupport;
Re?.({ LitElement: Le }), (Ie.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region node_modules/lit-html/directive.js
var ze = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, Be = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), Ve = class {
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
}, He = "important", Ue = " !" + He, k = Be(class extends Ve {
	constructor(e) {
		if (super(e), e.type !== ze.ATTRIBUTE || e.name !== "style" || e.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
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
				let t = typeof r == "string" && r.endsWith(Ue);
				e.includes("-") || t ? n.setProperty(e, t ? r.slice(0, -11) : r, t ? He : "") : n[e] = r;
			}
		}
		return be;
	}
}), We = 1.2, Ge = 1006, Ke = 2501, qe = 1.86, Je = 3600, Ye = 3, Xe = 1.5, Ze = .5, Qe = (e) => e.freeCooling ? "freeCooling" : e.mode === "cooling" ? "cooling" : "heat";
function $e(e) {
	let t = ({ sensible: e, latent: t }) => ({
		sensible: Math.round(e),
		latent: Math.round(t)
	}), n = {
		recovered: t(e.recovered),
		lost: t(e.lost),
		preHeater: t(e.preHeater)
	}, r = n.recovered.sensible + n.recovered.latent;
	return {
		recovered: r,
		potential: r + n.lost.sensible + n.lost.latent,
		parts: n
	};
}
var et = (e, t) => e >= t * (1 - 1e-9), tt = (e, t) => Math.min(Math.max(e / t * 100, 0), 100), nt = (e, t, n, r) => {
	let i = Math.abs(t);
	if (!(Math.round(i * r) <= 0 || !et(i, n * 1006 * Ye))) return tt(e, i);
}, rt = ({ outdoor: e, supply: t, extract: n }, r) => {
	let i = n - e;
	if (!(Math.round(Math.abs(r)) <= 0 || !et(Math.abs(i), Xe))) return tt(t - e, i);
}, A = (e) => e !== void 0 && Number.isFinite(e), it = (e, t) => ({
	total: e.h - t.h,
	latent: Ke * (e.A - t.A)
});
function at(e) {
	let { temperature: t, absoluteHumidity: n, supplyFlow: r, bypass: i, airDensity: a, preHeater: o } = e, s = [
		t.outdoor,
		t.supply,
		t.extract
	].filter(A), c = n && [
		n.outdoor,
		n.supply,
		n.extract
	].filter(A);
	if (s.length !== 3 || !A(t.outdoor) || !A(r) || !A(i) || c !== void 0 && c.length !== 3 || !(Number.isFinite(a) && a > 0)) return;
	let l = (e, t) => ({
		h: a * Ge * e + t * (Ke + qe * e),
		A: t
	}), [u, d, f] = s.map((e, t) => l(e, c?.[t] ?? 0)), p = r / Je, m = i > 0 || u.h > f.h, h = f.h >= u.h, g = u, _ = m ? void 0 : o;
	if (_ !== void 0 && (_.on ?? (A(_.temperatureAfter) && et(_.temperatureAfter - t.outdoor, Ze)))) {
		if (!A(_.temperatureAfter) || "absoluteHumidityAfter" in _ && !A(_.absoluteHumidityAfter)) return;
		g = l(Math.max(_.temperatureAfter, t.outdoor), c === void 0 ? 0 : _.absoluteHumidityAfter ?? u.A);
	}
	let v, y;
	if (m) {
		let [e, t] = h ? [f, u] : [u, f];
		v = it(e, d), y = it(d, t);
	} else v = it(d, g), y = it(f, d);
	let b = it(g, u), x = n && ot(n, r), S = nt(v.total, f.h - g.h, a, p), C = x && rt(n, x.extracted);
	return {
		mode: m ? "cooling" : "heating",
		freeCooling: i > 0 && h,
		saving: Math.max(v.total, 0) * p,
		recovered: {
			sensible: (v.total - v.latent) * p,
			latent: v.latent * p
		},
		lost: {
			sensible: (y.total - y.latent) * p,
			latent: y.latent * p
		},
		preHeater: {
			sensible: (b.total - b.latent) * p,
			latent: b.latent * p
		},
		latentKnown: c !== void 0,
		...x ? { moisture: x } : {},
		effectiveness: {
			...S === void 0 ? {} : { total: S },
			...C === void 0 ? {} : { moisture: C }
		}
	};
}
function ot(e, t) {
	if (e === void 0 || !A(t)) return;
	let { outdoor: n, supply: r, extract: i } = e;
	if (A(n) && A(r) && A(i)) return {
		extracted: t * (i - n),
		recovered: t * (r - n),
		outside: t * (i - r)
	};
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/property.js
var st = {
	attribute: !0,
	type: String,
	converter: b,
	reflect: !1,
	hasChanged: x
}, ct = (e = st, t, n) => {
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
function lt(e) {
	return (t, n) => typeof n == "object" ? ct(e, t, n) : ((e, t, n) => {
		let r = t.hasOwnProperty(n);
		return t.constructor.createProperty(n, e), r ? Object.getOwnPropertyDescriptor(t, n) : void 0;
	})(e, t, n);
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/state.js
function ut(e) {
	return lt({
		...e,
		state: !0,
		attribute: !1
	});
}
//#endregion
//#region src/lib/config.ts
var dt = [
	"outdoor",
	"supply",
	"extract",
	"exhaust"
], ft = (e) => ({
	outdoor: e("outdoor"),
	supply: e("supply"),
	extract: e("extract"),
	exhaust: e("exhaust")
}), pt = /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/;
function j(e, t) {
	let n = e;
	for (let e of t.split(".")) {
		if (typeof n != "object" || !n || !Object.hasOwn(n, e)) return;
		n = n[e];
	}
	return n;
}
function mt(e) {
	if (typeof e != "string") return;
	let t = e.trim();
	return pt.test(t) ? t : void 0;
}
function M(e, t) {
	return mt(j(e, t));
}
function ht(e, t) {
	return M(e, t) !== void 0;
}
function gt(e, t) {
	let n = M(e, `${t}.absolute_humidity`);
	if (n !== void 0) return { absolute: n };
	let r = M(e, `${t}.humidity`), i = M(e, `${t}.temperature`);
	return r !== void 0 && i !== void 0 ? {
		relative: r,
		temperature: i
	} : void 0;
}
var _t = (e, t) => gt(e, t) !== void 0;
function vt(e, t) {
	return t.every((t) => _t(e, t));
}
function yt(e, t, n) {
	let r = (t) => ht(e, `${t}.absolute_humidity`) || ht(e, `${t}.humidity`);
	return n === "all_or_none" && !t.some(r) ? [] : t.flatMap((t) => r(t) ? _t(e, t) ? [] : [`${t}.temperature`] : [`${t}.humidity`]);
}
function bt(e, t) {
	let n = t.paths.filter((t) => !ht(e, t)), { humidity: r } = t;
	return r && n.push(...yt(e, r.streams, r.rule)), [...new Set(n)];
}
//#endregion
//#region src/lib/define.ts
function xt(e, t) {
	let n = customElements.get(e);
	n === void 0 ? customElements.define(e, t) : n !== t && console.warn(`${e} is already defined by another copy of the module; that copy stays in use.`);
}
var St = [
	"Away",
	"Low",
	"Medium",
	"High"
], Ct = "Ventilation disabled", wt = {
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
	"fans.ventilation_mode": "ventilation mode",
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
	"status.heating_saving": "saved heating power",
	"status.cooling_saving": "saved cooling power",
	"status.moisture_recovery": "moisture recovery rate",
	"status.moisture_outside": "moisture put-outside rate",
	"pre_heater.power": "pre-heater",
	"pre_heater.energy": "pre-heater energy",
	"pre_heater.temperature_after": "pre-heater temperature after",
	"pre_heater.humidity_after": "pre-heater humidity after",
	"seasons.heating": "heating season",
	"seasons.cooling": "cooling season"
}, Tt = (e) => `Missing required entities: ${e.map((e) => wt[e]).join(", ")}`, N = {
	invalid: (e, t) => `Invalid option ${e}: expected ${t}`,
	number: (e, t) => `a number from ${e} to ${t}`,
	color: "a CSS colour such as #db4437 or rgb(219, 68, 55)",
	boolean: "true or false",
	object: "a group of options",
	choice: (e) => `one of ${e.join(", ")}`,
	list: "a list of texts"
}, Et = "Sample values", Dt = {
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
}, Ot = {
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
		pre_heater: "Pre-heater",
		seasons: "Seasons",
		calculation: "Calculation",
		colors: "Colours",
		heating: "Heating colours",
		cooling: "Cooling colours",
		animation: "Animation"
	},
	fields: {
		exchanger_type: "Exchanger type",
		temperature: "Temperature",
		humidity: "Relative humidity",
		absolute_humidity: "Absolute humidity",
		level: "Fan level",
		ventilation_mode: "Ventilation mode",
		stopped_states: "Stopped states (states of the ventilation mode that mean the fans are off)",
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
		heating_saving: "Saved heating power",
		cooling_saving: "Saved cooling power",
		moisture_recovery: "Moisture recovery rate",
		moisture_outside: "Moisture put-outside rate",
		energy: "Energy",
		max_power: "Maximum power (W)",
		temperature_after: "Temperature after pre-heater",
		humidity_after: "Humidity after pre-heater",
		glow_color: "Glow colour",
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
		show_effectiveness: "Show effectiveness rings",
		layout: "Layout",
		show_unavailable: "Show unavailable values"
	},
	exchangerTypes: {
		hrv: "Heat recovery (HRV)",
		erv: "Energy recovery (ERV)"
	},
	layouts: {
		auto: "Automatic",
		full: "Full",
		compact: "Compact"
	}
}, kt = "g/h", P = {
	titles: {
		heat: "Heat Recovery",
		cooling: "Cooling Recovery",
		freeCooling: "Free Cooling"
	},
	titleNoValue: "Recovery",
	header: (e, t, n) => `Recovered ${e} W of ${t} W (${n} %)`,
	headerNoPotential: (e) => `Recovered ${e} W`,
	headerFreeCooling: (e, t, n) => `Cooling ${e} W of ${t} W (${n} %)`,
	headerFreeCoolingNoPotential: (e) => `Cooling ${e} W`,
	laneSensible: "Temperature",
	laneLatent: "Moisture",
	recovered: (e) => `Recovered ${e} W`,
	cooling: (e) => `Cooling ${e} W`,
	lost: (e) => `Lost ${e} W`,
	missed: (e) => `Missed ${e} W`,
	preHeater: (e) => `Pre-Heater ${e} W`,
	scale: (e) => `Scale ±${e} W`
}, F = {
	title: "Moisture Recovery",
	subtitles: {
		drying: "House drying",
		gaining: "House gaining (outdoor more humid)",
		neutral: "Indoor ≈ outdoor"
	},
	neutral: "within sensor accuracy",
	header: ({ gaining: e, recovered: t, extracted: n }) => `${e ? "Kept out" : "Recovered"} ${t} of ${n} g/h`,
	percent: (e, t) => t === void 0 ? ` (${e} %)` : ` (${e} %, with bypass ${t} %)`,
	bypass: (e) => `Bypass ${e} % — part of the supply air skips the exchanger, so less is recovered (intended, free cooling)`,
	flow: ({ gaining: e, extracted: t, recovered: n, outside: r }) => e ? `Outdoor Air Brings In ${t} → Kept Out ${n} + Enters ${r} g/h` : `Extracted ${t} → Recovered ${n} + Outside ${r} g/h`,
	swatchRecovered: (e) => e ? "Kept Out" : "Recovered",
	swatchOutside: (e) => e ? "Enters" : "Outside",
	humidities: (e, t) => `Indoor ${e} g/m³ · Outdoor ${t} g/m³`,
	scale: (e) => `Scale ±${e} g/h`
}, I = {
	prefixes: { rmot: "RMOT " },
	notPlanned: "—",
	seasons: {
		heating: "Heating season",
		cooling: "Cooling season",
		between: "Between seasons"
	},
	saving: (e) => `${e} W`,
	moisture: (e) => `${e} ${kt}`,
	moistureUnit: kt,
	powerUnit: "W",
	moistureRecoveredIcon: "mdi:water-sync",
	moistureKeptOutIcon: "mdi:water-remove",
	moistureRecovered: (e) => `Moisture recovered: ${e}`,
	moistureKeptOut: (e) => `Moisture kept out: ${e}`,
	moistureNoValue: "Moisture recovery: n/a",
	moisturePutOutsideIcon: "mdi:water-remove",
	moistureBroughtInIcon: "mdi:water-plus",
	moisturePutOutside: (e) => `Moisture put outside: ${e}`,
	moistureBroughtIn: (e) => `Moisture brought in: ${e}`,
	moistureOutsideNoValue: "Moisture put outside: n/a",
	effectiveness: (e, t, n) => `Effectiveness: ${e}${t === void 0 ? "" : `, moisture ${t}`}${n === void 0 ? "" : ` (bypass ${n} %)`}`,
	effectivenessKinds: {
		heat: "heat",
		cooling: "cooling",
		freeCooling: "free cooling"
	},
	effectivenessFigure: (e, t, n = "") => `${e === void 0 ? "" : `${e} `}${t}${n}`,
	effectivenessAbsolute: (e, t, n) => ` (${e} / ${t} ${n})`,
	effectivenessPercent: (e) => `${e} %`,
	effectivenessNoValue: "not measurable"
}, At = /* @__PURE__ */ new Set(["unknown", "unavailable"]), jt = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
function Mt(e) {
	return e === void 0 || At.has(e.state);
}
function Nt(e) {
	if (!jt.test(e)) return;
	let t = Number(e);
	return Number.isFinite(t) ? t + 0 : void 0;
}
function Pt(e) {
	return e === void 0 ? void 0 : Nt(e.state);
}
//#endregion
//#region src/editor/schema.ts
function Ft(e) {
	return "type" in e;
}
function It(e) {
	let { advanced: t, ...n } = e;
	return n;
}
function Lt(e) {
	return e.flatMap((e) => Ft(e) ? e.schema.map((t) => ({
		field: t,
		path: e.flatten ? t.name : `${e.name}.${t.name}`
	})) : [{
		field: e,
		path: e.name
	}]);
}
function Rt(e, t) {
	let n = (e) => t || e.advanced !== !0;
	return e.flatMap((e) => {
		if (!Ft(e)) return n(e) ? [It(e)] : [];
		let t = e.schema.filter(n).map(It);
		return t.length > 0 ? [{
			...e,
			schema: t
		}] : [];
	});
}
function zt(e, t) {
	if (e == null || e === "") return !1;
	if (t.default === void 0) return !0;
	if (typeof t.default == "number") {
		let n = typeof e == "number" ? e : typeof e == "string" ? Nt(e) : void 0;
		if (n !== void 0) return n !== t.default;
	}
	return Bt(e) !== Bt(t.default);
}
function Bt(e) {
	return (typeof e == "string" || typeof e == "number" || typeof e == "boolean" ? String(e) : JSON.stringify(e)).toLowerCase();
}
function Vt(e, t) {
	return Lt(e).some(({ field: e, path: n }) => e.advanced === !0 && zt(j(t, n), e));
}
function Ht(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Ut(e, t, n, r, i = "") {
	let [a, ...o] = t.split("."), s = e, { [a]: c, ...l } = s;
	if (o.length === 0) return n === void 0 ? l : {
		...l,
		[a]: n
	};
	let u = Ut(Ht(c) ? c : {}, o.join("."), n, r, `${i}${a}.`), d = r !== void 0 && j(r, `${i}${a}`) !== void 0;
	return n === void 0 && Object.keys(u).length === 0 && !d ? l : {
		...s,
		[a]: u
	};
}
function Wt(e, t, n = /* @__PURE__ */ new Set()) {
	return Lt(e).reduce((e, { field: r, path: i }) => r.default !== void 0 && j(t, i) === void 0 && !n.has(i) ? Ut(e, i, r.default) : e, t);
}
function Gt(e, t, n) {
	return Lt(e).map(({ path: e }) => e).filter((e) => j(t, e) !== void 0 && j(n, e) === void 0);
}
function Kt(e) {
	if (!Ht(e)) return e;
	let t = Object.entries(e).filter(([, e]) => e !== void 0).map(([e, t]) => [e, Kt(t)]);
	return t.length !== Object.keys(e).length || t.some(([t, n]) => n !== e[t]) ? Object.fromEntries(t) : e;
}
function qt(e, t) {
	return Lt(e).reduce((e, { field: n, path: r }) => {
		let i = n.selector.text, a = j(e, r);
		if (!Ht(i) || i.multiple !== !0 || !Array.isArray(a)) return e;
		let o = a.filter((e) => e !== null && (typeof e != "string" || e.trim() !== ""));
		return o.length === a.length && o.length > 0 ? e : Ut(e, r, o.length > 0 ? o : void 0, t);
	}, t);
}
function Jt(e, t, n) {
	return Lt(e).reduce((e, { field: n, path: r }) => n.default !== void 0 && j(t, r) === void 0 && j(e, r) !== void 0 && !zt(j(e, r), n) ? Ut(e, r, void 0, t) : e, n);
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/decorate.js
function L(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
//#endregion
//#region src/editor/hrv-card-editor.ts
var Yt = "hrv-card-editor", Xt = [{
	name: "advanced",
	selector: { boolean: {} }
}], Zt = () => Ot.advanced, Qt = Ot.sections, $t = Ot.fields;
function en(e) {
	return Ft(e) ? e.title ?? Qt[e.name] ?? e.name : $t[e.name] ?? e.name;
}
var tn = class extends Le {
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
		super(), this.schema = [], this._switch = { advanced: !1 }, this._formDefined = customElements.get("ha-form") !== void 0, this._formSchema = [], this._shown = {}, this._emptied = /* @__PURE__ */ new Set(), this._toggleAdvanced = (e) => {
			e.stopPropagation(), this._emptied = /* @__PURE__ */ new Set(), this._switch = { advanced: e.detail.value.advanced === !0 || this._locked };
		}, this._configChanged = (e) => {
			e.stopPropagation();
			let t = Kt(e.detail.value), n = qt(this.schema, t);
			this._draft = n === t ? void 0 : t;
			let r = Gt(this.schema, this._shown, n);
			this._emptied = new Set([...this._emptied, ...r].filter((e) => j(n, e) === void 0));
			let i = this._config ? Jt(this.schema, this._config, n) : n;
			this._config = i, this.dispatchEvent(new CustomEvent("config-changed", {
				detail: { config: i },
				bubbles: !0,
				composed: !0
			}));
		}, this._formDefined || customElements.whenDefined("ha-form").then(() => {
			this._formDefined = !0;
		});
	}
	get _locked() {
		return this._config !== void 0 && Vt(this.schema, this._config);
	}
	setConfig(e) {
		let t = JSON.stringify(e) !== JSON.stringify(this._config);
		this._emptied.size > 0 && t && (this._emptied = /* @__PURE__ */ new Set()), t && (this._draft = void 0), this._config = e, this._locked && !this._switch.advanced && (this._switch = { advanced: !0 });
	}
	willUpdate(e) {
		e.has("schema") && this._locked && !this._switch.advanced && (this._switch = { advanced: !0 }), (e.has("schema") || e.has("_switch")) && (this._formSchema = Rt(this.schema, this._switch.advanced)), this._config && (e.has("schema") || e.has("_config") || e.has("_switch") || e.has("_draft")) && (this._shown = Wt(this._formSchema, this._draft ?? this._config, this._emptied));
	}
	render() {
		return this._config ? this._formDefined ? E`
      <ha-form
        class="switch"
        .hass=${this.hass}
        .data=${this._switch}
        .schema=${Xt}
        .computeLabel=${Zt}
        @value-changed=${this._toggleAdvanced}
      ></ha-form>
      <ha-form
        .hass=${this.hass}
        .data=${this._shown}
        .schema=${this._formSchema}
        .computeLabel=${en}
        @value-changed=${this._configChanged}
      ></ha-form>
    ` : E`<p class="hint">${Ot.noForm}</p>` : O;
	}
};
L([lt({ attribute: !1 })], tn.prototype, "hass", void 0), L([lt({ attribute: !1 })], tn.prototype, "schema", void 0), L([ut()], tn.prototype, "_config", void 0), L([ut()], tn.prototype, "_switch", void 0), L([ut()], tn.prototype, "_formDefined", void 0), L([ut()], tn.prototype, "_draft", void 0), xt(Yt, tn);
//#endregion
//#region src/lib/options.ts
var nn = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, rn = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|var)\((.*)\)$/i, an = /^[#a-zA-Z0-9(),.%\s/+-]+$/, on = /* @__PURE__ */ new Set(/* @__PURE__ */ "aliceblue.antiquewhite.aqua.aquamarine.azure.beige.bisque.black.blanchedalmond.blue.blueviolet.brown.burlywood.cadetblue.chartreuse.chocolate.coral.cornflowerblue.cornsilk.crimson.cyan.darkblue.darkcyan.darkgoldenrod.darkgray.darkgreen.darkgrey.darkkhaki.darkmagenta.darkolivegreen.darkorange.darkorchid.darkred.darksalmon.darkseagreen.darkslateblue.darkslategray.darkslategrey.darkturquoise.darkviolet.deeppink.deepskyblue.dimgray.dimgrey.dodgerblue.firebrick.floralwhite.forestgreen.fuchsia.gainsboro.ghostwhite.gold.goldenrod.gray.green.greenyellow.grey.honeydew.hotpink.indianred.indigo.ivory.khaki.lavender.lavenderblush.lawngreen.lemonchiffon.lightblue.lightcoral.lightcyan.lightgoldenrodyellow.lightgray.lightgreen.lightgrey.lightpink.lightsalmon.lightseagreen.lightskyblue.lightslategray.lightslategrey.lightsteelblue.lightyellow.lime.limegreen.linen.magenta.maroon.mediumaquamarine.mediumblue.mediumorchid.mediumpurple.mediumseagreen.mediumslateblue.mediumspringgreen.mediumturquoise.mediumvioletred.midnightblue.mintcream.mistyrose.moccasin.navajowhite.navy.oldlace.olive.olivedrab.orange.orangered.orchid.palegoldenrod.palegreen.paleturquoise.palevioletred.papayawhip.peachpuff.peru.pink.plum.powderblue.purple.rebeccapurple.red.rosybrown.royalblue.saddlebrown.salmon.sandybrown.seagreen.seashell.sienna.silver.skyblue.slateblue.slategray.slategrey.snow.springgreen.steelblue.tan.teal.thistle.tomato.turquoise.violet.wheat.white.whitesmoke.yellow.yellowgreen.transparent.currentcolor".split("."));
function sn(e) {
	let t = 0;
	for (let n = 0; n < e.length; n++) if (e[n] === "(" && t++, e[n] === ")" && (t--, t < 0 || t === 0 && n !== e.length - 1)) return !1;
	return t === 0;
}
function cn(e) {
	let t = e.trim();
	if (t.length === 0 || t.length > 100 || !an.test(t)) return !1;
	if (nn.test(t) || on.has(t.toLowerCase())) return !0;
	let n = rn.exec(t);
	if (n === null || !sn(t)) return !1;
	if (n[1]?.toLowerCase() !== "var") return !0;
	let [r, ...i] = (n[2] ?? "").split(",");
	return /^\s*--[a-zA-Z0-9-]+\s*$/.test(r ?? "") && (i.length === 0 || cn(i.join(",")));
}
var ln = (e) => e == null;
function un(e) {
	switch (e.kind) {
		case "number": return N.number(String(e.min), String(e.max));
		case "color": return N.color;
		case "boolean": return N.boolean;
		case "choice": return N.choice(e.choices);
		case "list": return N.list;
	}
}
var dn = (e) => e === null || [
	"string",
	"number",
	"boolean"
].includes(typeof e);
function fn(e) {
	return e.map((e) => typeof e == "boolean" ? e ? "on" : "off" : e === null ? "" : String(e)).filter((e) => e.trim() !== "");
}
function pn(e, t) {
	switch (e.kind) {
		case "number": return typeof t == "number" && Number.isFinite(t) && t >= e.min && t <= e.max;
		case "color": return typeof t == "string" && cn(t);
		case "boolean": return typeof t == "boolean";
		case "choice": return typeof t == "string" && e.choices.includes(t);
		case "list": return Array.isArray(t) && t.every(dn);
	}
}
function mn(e, t) {
	let n = t.split(".").slice(0, -1);
	for (let t = 1; t <= n.length; t++) {
		let r = n.slice(0, t).join("."), i = j(e, r);
		if (!ln(i) && (typeof i != "object" || Array.isArray(i))) return r;
	}
}
function hn(e, t) {
	let n = t.flatMap((t) => {
		let n = mn(e, t.path);
		if (n !== void 0) return [N.invalid(n, N.object)];
		let r = j(e, t.path);
		return ln(r) || pn(t, r) ? [] : [N.invalid(t.path, un(t))];
	});
	return [...new Set(n)];
}
function R(e, t) {
	let n = j(e, t.path);
	if (t.kind === "list" && Array.isArray(n) && pn(t, n)) {
		let e = fn(n);
		return e.length > 0 ? e : t.default;
	}
	return ln(n) || !pn(t, n) ? t.default : n;
}
//#endregion
//#region src/lib/units.ts
var gn = { scale: 1 }, _n = {
	temperature: /* @__PURE__ */ new Map([["°c", gn], ["°f", {
		scale: 5 / 9,
		offset: -32
	}]]),
	flow: /* @__PURE__ */ new Map([
		["m3/h", gn],
		["l/s", { scale: 3.6 }],
		["ft3/min", { scale: 1.69901079552 }]
	]),
	absolute_humidity: /* @__PURE__ */ new Map([["g/m3", gn]]),
	relative_humidity: /* @__PURE__ */ new Map([["%", gn]]),
	percentage: /* @__PURE__ */ new Map([["%", gn]]),
	power: /* @__PURE__ */ new Map([["w", gn], ["kw", { scale: 1e3 }]])
};
function vn(e) {
	return e.trim().replaceAll("º", "°").normalize("NFKC").toLowerCase();
}
function z(e, t) {
	let n = Pt(e);
	return n === void 0 ? void 0 : yn(t, n, e?.attributes.unit_of_measurement);
}
function yn(e, t, n) {
	if (!Number.isFinite(t) || n === void 0) return;
	let r = _n[e].get(vn(n));
	return r ? (t + (r.offset ?? 0)) * r.scale : void 0;
}
//#endregion
//#region src/lib/preheater.ts
function bn(e) {
	let t = z(e && {
		state: e.state,
		attributes: e.attributes ?? {}
	}, "power");
	if (t !== void 0) return t > 0;
	if (e?.state === "on") return !0;
	if (e?.state === "off") return !1;
}
//#endregion
//#region src/calc/humidity.ts
var xn = -100, Sn = 100;
function Cn(e, t) {
	if (!(!Number.isFinite(e) || e < xn || e > Sn) && !(!Number.isFinite(t) || t < 0 || t > 100)) return 6.112 * Math.exp(17.67 * e / (e + 243.5)) * t * 2.1674 / (273.15 + e);
}
//#endregion
//#region src/calc/smoothing.ts
var wn = 6e4, Tn = 1440, En = 5 * wn;
function Dn(e) {
	let t = e.map((e) => Date.parse(e?.last_updated ?? "")).filter(Number.isFinite);
	return t.length > 0 ? Math.max(...t) : void 0;
}
function On(e, t, n) {
	let r = t - n, i = 0, a = 0;
	for (let n = 0; n < e.length; n++) {
		let o = e[n];
		if (o === void 0 || o.time > t) break;
		let s = e[n + 1], c = n === 0 ? r : Math.max(o.time, r), l = s === void 0 || s.time > t ? t : s.time;
		l <= c || o.value === void 0 || (i += o.value * (l - c), a += l - c);
	}
	return a > 0 ? i / a : void 0;
}
function kn(e, t, n) {
	let r = e.at(-1);
	if (r !== void 0) return !(t > 0) || e.length === 1 ? r.value : On(e, Math.max(n ?? r.time, r.time), t * wn);
}
function An(e, t) {
	let n = e.length;
	for (; n > 0 && (e[n - 1]?.time ?? -Infinity) > t.time;) n--;
	e[n - 1]?.time === t.time ? e[n - 1] = t : e.splice(n, 0, t);
}
var jn = class {
	constructor() {
		this.series = /* @__PURE__ */ new Map(), this.listeners = /* @__PURE__ */ new Set();
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	smoothed(e, t, n, r) {
		let i = Number.isFinite(n) ? Math.min(Math.max(0, n), Tn) : 0, a = i * wn, o = this.series.get(t.key);
		o === void 0 && (o = {
			samples: [],
			windowMs: a,
			history: { state: "none" }
		}, this.series.set(t.key, o)), o.windowMs = Math.max(o.windowMs, a);
		let s = this.add(o, e, t);
		if (a > 0 && this.needsHistory(o) && this.loadHistory(o, e, t), s !== void 0) return o.history.state === "loading" && o.history.first ? s : kn(o.samples, i, r);
	}
	needsHistory(e) {
		let { history: t, samples: n, windowMs: r } = e;
		switch (t.state) {
			case "none": return !0;
			case "loading": return !1;
			case "loaded": return r > t.windowMs;
			case "failed": {
				let [e, i] = [n[0], n.at(-1)];
				return !(e !== void 0 && i !== void 0 && e.time <= i.time - r) && Date.now() - t.at >= En;
			}
		}
	}
	add(e, t, n) {
		let r = n.entityIds.map((e) => t.states[e]), i = Dn(r);
		if (i === void 0) return;
		let a = n.value(r);
		return An(e.samples, {
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
			a = Mn(await t.callWS({
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
			for (let t of a) An(e.samples, t);
			this.prune(e), this.listeners.forEach((e) => {
				e();
			});
		}
	}
};
function Mn(e, t, n) {
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
	}, An(o, {
		time: e.time,
		value: n.value(a)
	});
	return o;
}
var Nn = new jn(), Pn = {
	smoothing: {
		kind: "number",
		path: "smoothing",
		min: 0,
		max: Tn,
		default: 10
	},
	airDensity: {
		kind: "number",
		path: "air_density",
		min: .5,
		max: 1.5,
		default: We
	}
}, Fn = [
	"outdoor",
	"supply",
	"extract"
];
function In(e, t) {
	let n = gt(e, t);
	if (n !== void 0) return "absolute" in n ? {
		key: n.absolute,
		entityIds: [n.absolute],
		value: ([e]) => z(e, "absolute_humidity")
	} : Ln(n.relative, n.temperature);
}
function Ln(e, t) {
	return {
		key: `derived:${e}|${t}`,
		entityIds: [e, t],
		value: ([e, t]) => {
			let [n, r] = [z(e, "relative_humidity"), z(t, "temperature")];
			return n === void 0 || r === void 0 ? void 0 : Cn(r, n);
		}
	};
}
function Rn(e, t = Nn) {
	let n = R(e, Pn.smoothing), r = R(e, Pn.airDensity), i = Fn.map((t) => M(e, `${t}.temperature`)), a = Fn.map((t) => In(e, t)), o = a.every((e) => e !== void 0) ? a : void 0, s = M(e, "fans.supply_flow"), c = M(e, "bypass.position"), l = M(e, "pre_heater.power"), u = M(e, "pre_heater.temperature_after"), d = M(e, "pre_heater.humidity_after"), f = o !== void 0 && u !== void 0 && d !== void 0 ? Ln(d, u) : void 0, p = [
		...i,
		...(o ?? []).flatMap((e) => e.entityIds),
		s,
		c,
		...u === void 0 ? [] : [
			l,
			u,
			...f?.entityIds ?? []
		]
	].filter((e) => e !== void 0), m = ([e, t, n]) => ({
		outdoor: e,
		supply: t,
		extract: n
	});
	return (e, { noAirflow: a = !1 } = {}) => {
		let d = (t, n) => t === void 0 ? void 0 : z(e.states[t], n), h = Dn(p.map((t) => e.states[t])), g = {
			temperature: m(i.map((e) => d(e, "temperature"))),
			supplyFlow: a ? 0 : d(s, "flow"),
			bypass: c === void 0 ? 0 : d(c, "percentage"),
			airDensity: r
		};
		o !== void 0 && (g.absoluteHumidity = m(o.map((r) => t.smoothed(e, r, n, h)))), u !== void 0 && !a && (g.preHeater = {
			on: l === void 0 ? void 0 : bn(e.states[l]),
			temperatureAfter: d(u, "temperature")
		}, f !== void 0 && (g.preHeater.absoluteHumidityAfter = t.smoothed(e, f, n, h)));
		let _ = at(g);
		return _ === void 0 ? { inputs: g } : {
			inputs: g,
			result: _
		};
	};
}
//#endregion
//#region src/lib/bar.ts
var zn = 250, Bn = (e) => Math.round(e * 1e6) / 1e6, Vn = (e) => Number.isFinite(e) ? e : 0;
function Hn(e, t) {
	let n = Bn(e.reduce((e, t) => e + Math.abs(Vn(t)), 0));
	return Math.max(Vn(t), Math.ceil(n / zn) * zn);
}
function Un(e, t) {
	let n = (e) => t > 0 ? Math.min(e, t) / t * 50 : 0, r = 0, i = 0;
	return e.map((e) => {
		let t = Vn(e);
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
//#region src/lib/colors.ts
var Wn = "#00897b", Gn = "−";
function Kn(e) {
	let t = e?.locale;
	return typeof t == "object" && t ? t : e?.language === void 0 ? {} : { language: e.language };
}
function qn(e) {
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
var Jn = /* @__PURE__ */ new Map();
function Yn(e, t) {
	let n = qn(e), r = e.number_format !== "none", i = `${n?.join(",") ?? ""}|${String(t)}|${String(r)}`, a = Jn.get(i);
	return a === void 0 && (a = new Intl.NumberFormat(n, {
		minimumFractionDigits: t,
		maximumFractionDigits: t,
		useGrouping: r
	}), Jn.set(i, a)), a;
}
function B(e, t, n = 0) {
	if (!Number.isFinite(e)) return "n/a";
	let r = Number.isFinite(n) ? Math.min(20, Math.max(0, Math.trunc(n))) : 0, i = Math.abs(e) < .5 / 10 ** r ? 0 : e;
	return Yn(t ?? {}, r).formatToParts(i).map((e) => e.type === "minusSign" ? Gn : e.value).join("");
}
//#endregion
//#region src/cards/bar.ts
var Xn = (e) => `repeating-linear-gradient(135deg, ${e} 0 3px, transparent 3px 6px)`, Zn = o`
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
  /* A title with a muted subtitle under it; the head aligns on the title's baseline. */
  .title-block {
    display: flex;
    flex-direction: column;
  }
  .subtitle {
    font-size: 13px;
    color: var(--secondary-text-color);
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
  /* Two lanes of 13 px and the 1 px line between them: an even inner height cannot split into equal lanes. */
  .bar.lanes {
    height: 29px;
  }
  .lane {
    position: relative;
    flex: 1 1 0;
  }
  /* The line between two lanes: a row of its own, so it takes no height from either lane. */
  .divider {
    flex: none;
    height: 1px;
    background: var(--hrv-bar-outline);
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
function Qn({ left: e, width: t }) {
	if (!(t <= 0)) return {
		left: `${String(-e / t * 100)}%`,
		width: `${String(100 / t * 100)}%`
	};
}
function $n(e) {
	return E`<div class="bar ${e.length > 1 ? "lanes" : ""}">
    ${e.map((e, t) => E`${t > 0 ? E`<div class="divider"></div>` : O}
          <div class="lane">
            ${e.map((e) => {
		let t = Qn(e);
		return E`<div
                class="seg"
                style=${k({
			left: `${String(e.left)}%`,
			width: `${String(e.width)}%`
		})}
              >
                ${t ? E`<div class="fill" style=${k({
			...t,
			background: e.background
		})}></div>` : O}
              </div>`;
	})}
          </div>`)}
    <div class="zero"></div>
  </div>`;
}
function er(e) {
	return E`<span class="swatch" style=${k({ background: e })}></span>`;
}
//#endregion
//#region src/cards/moisture-view.ts
var tr = {
	paths: ["fans.supply_flow"],
	humidity: {
		streams: [
			"outdoor",
			"supply",
			"extract"
		],
		rule: "required"
	}
}, V = {
	...Pn,
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
		default: Wn
	},
	gainingColor: {
		kind: "color",
		path: "gaining_color",
		default: "#8e24aa"
	}
}, nr = Object.values(V), rr = "#fdd835", ir = (e) => e.extracted < 0, ar = (e, t) => Math.abs(e.indoor - e.outdoor) < t, or = (e) => e === void 0 ? 0 : Math.round(Math.min(Math.max(e, 0), 100));
function sr(e) {
	let t = ir(e), n = t ? -1 : 1, r = (e) => Math.round(e * n);
	return {
		gaining: t,
		extracted: r(e.extracted),
		recovered: r(e.recovered),
		outside: r(e.outside)
	};
}
var cr = (e, t) => ({
	gaining: e.gaining,
	extracted: B(e.extracted, t),
	recovered: B(e.recovered, t),
	outside: B(e.outside, t)
});
function lr(e, t, n, r) {
	if (t) return {
		subtitle: F.subtitles.neutral,
		header: F.neutral
	};
	let i = F.header(cr(e, r));
	if (e.extracted > 0) {
		let t = B(e.recovered / e.extracted * 100, r);
		i += F.percent(t, n > 0 ? B(n, r) : void 0);
	}
	return {
		subtitle: e.gaining ? F.subtitles.gaining : F.subtitles.drying,
		header: i
	};
}
function ur(e, t, n, r, i) {
	if (e === void 0 || t === void 0) return {
		title: F.title,
		header: "n/a",
		segments: [],
		swatches: void 0,
		lines: []
	};
	let a = ir(e), o = ar(t, r.neutralThreshold), s = a ? r.gainingColor : r.dryingColor, c = or(n), l = [e.recovered, e.outside], u = Hn(l, r.minScale), d = [s, Xn(s)], f = Un(l, u).map((e, t) => ({
		...e,
		background: d[t] ?? s
	})), p = sr(e), { subtitle: m, header: h } = lr(p, o, c, i), g = (e) => B(e, i, 1), _ = {
		title: F.title,
		subtitle: m,
		header: h,
		segments: f,
		swatches: {
			recovered: F.swatchRecovered(a),
			outside: F.swatchOutside(a),
			color: s
		},
		lines: [
			F.flow(cr(p, i)),
			F.humidities(g(t.indoor), g(t.outdoor)),
			F.scale(B(u, i))
		]
	};
	return o || (_.headerColor = s), c > 0 && (_.bypass = {
		position: c,
		text: F.bypass(B(c, i))
	}), _;
}
//#endregion
//#region src/editor/fields.ts
var dr = { entity: { domain: "sensor" } }, H = (e, { advanced: t = !1, required: n = !1 } = {}) => ({
	name: e,
	selector: dr,
	...t ? { advanced: t } : {},
	...n ? { required: n } : {}
}), fr = (e) => ({
	name: e,
	selector: { entity: { domain: "binary_sensor" } }
}), pr = (e) => ({
	name: e,
	selector: { entity: { domain: [
		"sensor",
		"binary_sensor",
		"switch"
	] } }
}), mr = (e) => ({
	name: e,
	selector: { entity: { domain: [
		"sensor",
		"fan",
		"select"
	] } }
}), hr = (e) => ({
	name: e,
	selector: { entity: { domain: [
		"sensor",
		"binary_sensor",
		"select"
	] } }
}), gr = (e, t) => ({
	name: e,
	advanced: !0,
	default: t.default,
	selector: { text: { multiple: !0 } }
}), U = (e, { requiredTemperature: t, advancedAbsolute: n = !0 }) => ({
	type: "expandable",
	name: e,
	schema: [
		H("temperature", { required: t }),
		H("humidity"),
		H("absolute_humidity", { advanced: n })
	]
}), _r = (e, t, n, r) => ({
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
}), W = (e, t) => ({
	name: e,
	advanced: !0,
	default: t,
	selector: { text: {} }
}), vr = (e, t, { advanced: n = !1 } = {}) => ({
	name: e,
	default: t.default,
	selector: { boolean: {} },
	...n ? { advanced: n } : {}
}), yr = (e, t, n, { advanced: r = !0 } = {}) => ({
	name: e,
	...r ? { advanced: r } : {},
	default: t.default,
	selector: { select: {
		mode: "dropdown",
		options: t.choices.map((e) => ({
			value: e,
			label: n[e] ?? e
		}))
	} }
}), br = {
	type: "expandable",
	name: "fans",
	schema: [H("supply_flow", { required: !0 })]
}, xr = {
	type: "expandable",
	name: "bypass",
	schema: [H("position")]
}, Sr = {
	type: "expandable",
	name: "calculation",
	flatten: !0,
	schema: [_r("smoothing", Pn.smoothing, 1, "min"), _r("air_density", Pn.airDensity, .01, "kg/m³")]
}, Cr = [
	U("outdoor", { requiredTemperature: !1 }),
	U("supply", { requiredTemperature: !1 }),
	U("extract", { requiredTemperature: !1 }),
	br,
	xr,
	Sr,
	_r("neutral_threshold", V.neutralThreshold, .1, "g/m³"),
	_r("min_scale", V.minScale, 50, "g/h"),
	{
		type: "expandable",
		name: "colors",
		flatten: !0,
		schema: [W("drying_color", V.dryingColor.default), W("gaining_color", V.gainingColor.default)]
	}
];
//#endregion
//#region src/lib/render.ts
function wr(e) {
	let t = /* @__PURE__ */ new Set(), n = (e) => {
		for (let r of Object.values(e)) if (typeof r == "object" && r && !Array.isArray(r)) n(r);
		else {
			let e = mt(r);
			e !== void 0 && t.add(e);
		}
	};
	return n(e), [...t];
}
function Tr(e, t) {
	return e === t || Array.isArray(e) && Array.isArray(t) && e.length === t.length && e.every((e, n) => e === t[n]);
}
function Er(e, t) {
	if (e === t) return !0;
	if (typeof e != "object" || typeof t != "object" || e === null || t === null) return !1;
	let n = Object.keys(e), r = Object.keys(t);
	return n.length === r.length && n.every((n) => Object.hasOwn(t, n) && Tr(e[n], t[n]));
}
function Dr(e, t, n) {
	return e === void 0 || e.locale !== t.locale || e.language !== t.language || e.localize !== t.localize || e.formatEntityState !== t.formatEntityState || e.themes?.darkMode !== t.themes?.darkMode || n.some((n) => e.states[n] !== t.states[n] || !Er(e.entities?.[n], t.entities?.[n]));
}
function Or(e, t, n, r) {
	return e.size === 1 && e.has("hass") ? t !== void 0 && Dr(n, t, r) : !0;
}
//#endregion
//#region src/lib/sample.ts
var G = (e) => `hrv_sample.${e.replace(".", "_")}`, kr = {
	outdoor: {
		temperature: G("outdoor.temperature"),
		humidity: G("outdoor.humidity")
	},
	supply: {
		temperature: G("supply.temperature"),
		humidity: G("supply.humidity")
	},
	extract: {
		temperature: G("extract.temperature"),
		humidity: G("extract.humidity")
	},
	exhaust: {
		temperature: G("exhaust.temperature"),
		humidity: G("exhaust.humidity")
	},
	fans: {
		level: G("fans.level"),
		supply_flow: G("fans.supply_flow"),
		exhaust_flow: G("fans.exhaust_flow")
	},
	bypass: {
		position: G("bypass.position"),
		mode: G("bypass.mode"),
		next_change: G("bypass.next_change")
	},
	status: {
		operating_mode: G("status.operating_mode"),
		target_temperature: G("status.target_temperature"),
		temperature_profile: G("status.temperature_profile"),
		next_fan_change: G("status.next_fan_change"),
		filter_days: G("status.filter_days"),
		power: G("status.power"),
		rmot: G("status.rmot"),
		heating_saving: G("status.heating_saving"),
		cooling_saving: G("status.cooling_saving"),
		moisture_recovery: G("status.moisture_recovery"),
		moisture_outside: G("status.moisture_outside")
	},
	pre_heater: {
		power: G("pre_heater.power"),
		energy: G("pre_heater.energy"),
		temperature_after: G("pre_heater.temperature_after"),
		humidity_after: G("pre_heater.humidity_after")
	},
	seasons: {
		heating: G("seasons.heating"),
		cooling: G("seasons.cooling")
	}
}, Ar = (e) => typeof e == "object" && !!e && !Array.isArray(e), jr = (e) => e == null || typeof e == "string" && e.trim() === "", Mr = (e, t) => ({
	...e,
	...Object.fromEntries(Object.entries(t).flatMap(([t, n]) => {
		let r = e[t];
		return jr(n) || Ar(r) && !Ar(n) ? [] : [[t, Ar(n) && Ar(r) ? Mr(r, n) : n]];
	}))
}), Nr = (e) => Object.keys(wt).some((t) => !jr(j(e, t))), Pr = (e) => Mr(kr, e), Fr = [
	[
		"outdoor.temperature",
		"2",
		"°C"
	],
	[
		"outdoor.humidity",
		"85",
		"%"
	],
	[
		"supply.temperature",
		"18.5",
		"°C"
	],
	[
		"supply.humidity",
		"45",
		"%"
	],
	[
		"extract.temperature",
		"21.5",
		"°C"
	],
	[
		"extract.humidity",
		"50",
		"%"
	],
	[
		"exhaust.temperature",
		"5.5",
		"°C"
	],
	[
		"exhaust.humidity",
		"90",
		"%"
	],
	["fans.level", "2"],
	[
		"fans.supply_flow",
		"200",
		"m³/h"
	],
	[
		"fans.exhaust_flow",
		"200",
		"m³/h"
	],
	[
		"bypass.position",
		"0",
		"%"
	],
	["bypass.mode", "Auto"],
	["bypass.next_change", "n/a"],
	["status.operating_mode", "Auto"],
	[
		"status.target_temperature",
		"21",
		"°C"
	],
	["status.temperature_profile", "Normal"],
	["status.next_fan_change", "n/a"],
	[
		"status.filter_days",
		"120",
		"d"
	],
	[
		"status.power",
		"38",
		"W"
	],
	[
		"status.rmot",
		"4.5",
		"°C"
	],
	[
		"status.heating_saving",
		"1452",
		"W"
	],
	[
		"status.cooling_saving",
		"0",
		"W"
	],
	[
		"status.moisture_recovery",
		"478",
		"g/h"
	],
	[
		"status.moisture_outside",
		"462",
		"g/h"
	],
	[
		"pre_heater.power",
		"0",
		"W"
	],
	[
		"pre_heater.energy",
		"8",
		"kWh"
	],
	[
		"pre_heater.temperature_after",
		"2",
		"°C"
	],
	[
		"pre_heater.humidity_after",
		"85",
		"%"
	],
	["seasons.heating", "on"],
	["seasons.cooling", "off"]
], Ir = "2026-01-01T12:00:00Z", Lr = Object.fromEntries(Fr.map(([e, t, n]) => [G(e), {
	entity_id: G(e),
	state: t,
	last_updated: Ir,
	attributes: n === void 0 ? {} : { unit_of_measurement: n }
}]));
//#endregion
//#region src/cards/base-card.ts
function Rr(e, t, n) {
	let r = bt(e, t);
	if (r.length > 0) throw Error(Tt(r));
	let i = hn(e, n);
	if (i.length > 0) throw Error(i.join("; "));
}
var zr = o`
  .sample-note {
    margin-top: 4px;
    text-align: right;
    font-size: 12px;
    color: var(--secondary-text-color);
  }
`, Br = class extends Le {
	constructor(...e) {
		super(...e), this.sample = !1, this.entityIds = [];
	}
	static getStubConfig() {
		return {};
	}
	setConfig(e) {
		let t = !Nr(e), n = t ? Pr(e) : e;
		this.check(n);
		let r = t ? {
			...n,
			smoothing: 0
		} : e;
		this.configure(r), this.calculator = Rn(r), this.entityIds = wr(r), this.sample = t, this.shown = void 0, this.config = r;
	}
	getCardSize() {
		return this.contentSize() + +!!this.sample;
	}
	get shownHass() {
		let { hass: e } = this;
		return !this.sample || !e ? e : (this.shown?.from !== e && (this.shown = {
			from: e,
			hass: {
				...e,
				states: {
					...e.states,
					...Lr
				}
			}
		}), this.shown.hass);
	}
	sampleNote() {
		return this.sample ? E`<div class="sample-note">${Et}</div>` : O;
	}
	connectedCallback() {
		super.connectedCallback(), this.unsubscribe = Nn.subscribe(() => {
			this.requestUpdate();
		});
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.unsubscribe?.(), this.unsubscribe = void 0;
	}
	shouldUpdate(e) {
		return Or(e, this.hass, this.rendered, this.entityIds);
	}
	updated() {
		this.rendered = this.hass;
	}
};
L([lt({ attribute: !1 })], Br.prototype, "hass", void 0), L([ut()], Br.prototype, "config", void 0);
//#endregion
//#region src/cards/bar-card.ts
var Vr = class extends Br {
	static {
		this.styles = [Zn, zr];
	}
	contentSize() {
		return 3;
	}
	getGridOptions() {
		return {
			columns: 12,
			min_columns: 6
		};
	}
}, Hr = "hrv-moisture-balance-card";
function Ur(e) {
	Rr(e, tr, nr);
}
xt(Hr, class extends Vr {
	static {
		this.styles = [Vr.styles, o`
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
		let e = document.createElement(Yt);
		return e.schema = Cr, e;
	}
	contentSize() {
		return 5;
	}
	check(e) {
		Ur(e);
	}
	configure(e) {
		this.settings = {
			dryingColor: R(e, V.dryingColor),
			gainingColor: R(e, V.gainingColor),
			neutralThreshold: R(e, V.neutralThreshold),
			minScale: R(e, V.minScale)
		};
	}
	render() {
		let e = this.shownHass;
		if (!this.config || !e || !this.calculator || !this.settings) return O;
		let { inputs: t } = this.calculator(e), n = t.absoluteHumidity, r = t.bypass === void 0 ? void 0 : ot(n, t.supplyFlow), i = ur(r, r && n?.extract !== void 0 && n.outdoor !== void 0 ? {
			indoor: n.extract,
			outdoor: n.outdoor
		} : void 0, t.bypass, this.settings, Kn(e));
		return E`<ha-card>
      <div class="head">
        <span class="title-block">
          <span class="title">${i.title}</span>
          ${i.subtitle ? E`<span class="subtitle">${i.subtitle}</span>` : O}
        </span>
        <span class="net" style=${k({ color: i.headerColor ?? "var(--secondary-text-color)" })}
          >${i.header}</span
        >
      </div>
      ${$n([i.segments])}
      ${i.bypass ? E`<div class="bypass">
              <div class="bypass-strip">
                <div
                  class="bypass-fill"
                  style=${k({
			width: `${String(i.bypass.position)}%`,
			background: rr
		})}
                ></div>
              </div>
              <span>${i.bypass.text}</span>
            </div>` : O}
      <div class="legend">
        ${i.swatches ? E`<span class="swatches">
                <span class="item">${er(i.swatches.color)}${i.swatches.recovered}</span>
                <span class="item">${er(Xn(i.swatches.color))}${i.swatches.outside}</span>
              </span>` : O}
        ${i.lines.map((e) => E`<span>${e}</span>`)}
      </div>
      ${this.sampleNote()}
    </ha-card>`;
	}
});
//#endregion
//#region src/cards/recovery-view.ts
var Wr = {
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
}, Gr = (e, t) => ({
	kind: "color",
	path: e,
	default: t
}), K = {
	...Pn,
	minScale: {
		kind: "number",
		path: "min_scale",
		min: 50,
		max: 1e5,
		default: 500
	},
	heatingColor: Gr("heating.color", "#db4437"),
	heatingLatent: Gr("heating.color_latent", "#f4a09a"),
	coolingColor: Gr("cooling.color", "#039be5"),
	coolingLatent: Gr("cooling.color_latent", "#8fd3f7"),
	preHeaterColor: Gr("pre_heater.glow_color", "#ff9800")
}, Kr = Object.values(K);
function qr(e, t, n) {
	if (e === void 0) return {
		title: P.titleNoValue,
		header: "n/a",
		lanes: [],
		legend: []
	};
	let { color: r, latent: i } = t.colors[e.mode], a = (e) => B(e, n), { recovered: o, potential: s, parts: c } = $e(e), { recovered: l, lost: u, preHeater: d } = c, f = d.sensible + d.latent, p = (e, n, r, i) => ({
		values: r === 0 ? [e, n] : [
			r,
			e,
			n
		],
		backgrounds: r === 0 ? [i, Xn(i)] : [
			t.colors.preHeater,
			i,
			Xn(i)
		]
	}), m = [p(l.sensible, u.sensible, d.sensible, r)];
	e.latentKnown && m.push(p(l.latent, u.latent, d.latent, i));
	let h = Math.max(...m.map(({ values: e }) => Hn(e, t.minScale))), g = m.map(({ values: e, backgrounds: t }) => Un(e, h).map((e, n) => ({
		...e,
		background: t[n] ?? r
	}))), [_, v] = e.freeCooling ? [P.headerFreeCooling, P.headerFreeCoolingNoPotential] : [P.header, P.headerNoPotential], y = s > 0 ? _(a(o), a(s), B(o / s * 100, n)) : v(a(o)), [b, x] = e.freeCooling ? [P.cooling, P.missed] : [P.recovered, P.lost], S = [{
		kind: "part",
		color: r,
		label: P.laneSensible,
		recovered: b(a(l.sensible)),
		lost: x(a(u.sensible))
	}];
	return e.latentKnown && S.push({
		kind: "part",
		color: i,
		label: P.laneLatent,
		recovered: b(a(l.latent)),
		lost: x(a(u.latent))
	}), (d.sensible !== 0 || d.latent !== 0) && S.push({
		kind: "swatch",
		color: t.colors.preHeater,
		text: P.preHeater(a(f))
	}), S.push({
		kind: "text",
		text: P.scale(a(h))
	}), {
		title: P.titles[Qe(e)],
		header: y,
		headerColor: r,
		lanes: g,
		legend: S
	};
}
//#endregion
//#region src/editor/recovery-schema.ts
var Jr = [
	U("outdoor", { requiredTemperature: !0 }),
	U("supply", { requiredTemperature: !0 }),
	U("extract", { requiredTemperature: !0 }),
	br,
	xr,
	{
		type: "expandable",
		name: "pre_heater",
		schema: [
			pr("power"),
			H("temperature_after"),
			H("humidity_after"),
			W("glow_color", K.preHeaterColor.default)
		]
	},
	Sr,
	_r("min_scale", K.minScale, 50, "W"),
	{
		type: "expandable",
		name: "heating",
		schema: [W("color", K.heatingColor.default), W("color_latent", K.heatingLatent.default)]
	},
	{
		type: "expandable",
		name: "cooling",
		schema: [W("color", K.coolingColor.default), W("color_latent", K.coolingLatent.default)]
	}
], Yr = "hrv-recovery-balance-card";
function Xr(e) {
	Rr(e, Wr, Kr);
}
xt(Yr, class extends Vr {
	constructor(...e) {
		super(...e), this.preHeaterEntry = !1, this.minScale = K.minScale.default;
	}
	static {
		this.styles = [Vr.styles, o`
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
	contentSize() {
		return this.preHeaterEntry ? 5 : 4;
	}
	static getConfigElement() {
		let e = document.createElement(Yt);
		return e.schema = Jr, e;
	}
	check(e) {
		Xr(e);
	}
	configure(e) {
		this.colors = {
			heating: {
				color: R(e, K.heatingColor),
				latent: R(e, K.heatingLatent)
			},
			cooling: {
				color: R(e, K.coolingColor),
				latent: R(e, K.coolingLatent)
			},
			preHeater: R(e, K.preHeaterColor)
		}, this.minScale = R(e, K.minScale);
	}
	render() {
		let e = this.shownHass;
		if (!this.config || !e || !this.calculator || !this.colors) return O;
		let { result: t } = this.calculator(e), n = qr(t, {
			colors: this.colors,
			minScale: this.minScale
		}, Kn(e));
		this.preHeaterEntry = n.legend.some((e) => e.kind === "swatch");
		let r = n.legend.filter((e) => e.kind === "part"), i = n.legend.filter((e) => e.kind !== "part");
		return E`<ha-card>
      <div class="head">
        <span class="title">${n.title}</span>
        <span class="net" style=${k({ color: n.headerColor ?? "var(--secondary-text-color)" })}
          >${n.header}</span
        >
      </div>
      ${$n(n.lanes)}
      <div class="legend">
        <div class="parts">
          ${r.map((e) => E`<div class="part">
                <span class="lane-name">${e.label}</span>
                <span class="item">${er(e.color)}${e.recovered}</span>
                <span class="item">${er(Xn(e.color))}${e.lost}</span>
              </div>`)}
        </div>
        ${i.map((e) => e.kind === "swatch" ? E`<span class="item">${er(e.color)}${e.text}</span>` : E`<span>${e.text}</span>`)}
      </div>
      ${this.sampleNote()}
    </ha-card>`;
	}
});
//#endregion
//#region node_modules/lit-html/directives/if-defined.js
var q = (e) => e ?? O, Zr = {
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
}, Qr = { paths: Zr.paths }, $r = (e) => bt(e, Zr).length === 0, ei = (e) => bt(e, Qr).length === 0, ti = (e, t) => e === "cooling" ? t.cold : t.warm;
function ni(e, t, n) {
	if (e === void 0) return t.showUnavailable ? {
		kind: "grey",
		text: "n/a"
	} : void 0;
	let r = I.saving(B(e.saving, n));
	return e.saving <= .5 ? {
		kind: "grey",
		text: r
	} : {
		kind: e.mode === "heating" ? "warm" : "cold",
		text: r,
		tint: ti(e.mode, t.colors)
	};
}
function ri(e, t, n) {
	if (e === void 0) return;
	let { heating: r, cooling: i } = t;
	if (r !== void 0 && i !== void 0) {
		let [e, t] = [r, i].map((e) => z(n[e], "power"));
		if (e !== void 0 && t !== void 0 && e !== t) return e > t ? r : i;
	}
	return t[e.mode];
}
function ii(e, t, n, r) {
	if (t.exchanger !== "erv" || !t.badge) return;
	if (e === void 0) return t.showUnavailable ? {
		text: "n/a",
		title: r.noValue
	} : void 0;
	let i = B(Math.abs(e), n), a = Math.round(e) < 0 ? r.negative : r.positive;
	return {
		text: i,
		unit: I.moistureUnit,
		icon: a.icon,
		title: a.title(I.moisture(i))
	};
}
function ai(e, t, n) {
	return ii(e?.moisture?.recovered, t, n, {
		noValue: I.moistureNoValue,
		negative: {
			icon: I.moistureKeptOutIcon,
			title: I.moistureKeptOut
		},
		positive: {
			icon: I.moistureRecoveredIcon,
			title: I.moistureRecovered
		}
	});
}
function oi(e, t, n) {
	return ii(e?.moisture?.outside, t, n, {
		noValue: I.moistureOutsideNoValue,
		negative: {
			icon: I.moistureBroughtInIcon,
			title: I.moistureBroughtIn
		},
		positive: {
			icon: I.moisturePutOutsideIcon,
			title: I.moisturePutOutside
		}
	});
}
function si(e, t, n, r) {
	let i = (e) => e === void 0 ? I.effectivenessNoValue : I.effectivenessPercent(B(e, r)), a = (e, t = !1) => B(t && Math.round(e) !== 0 ? -Math.abs(e) : Math.abs(e), r), o = e?.effectiveness.total, s = e && o !== void 0 ? $e(e) : void 0, c = e?.effectiveness.moisture === void 0 ? void 0 : e.moisture, l = e && I.effectivenessKinds[Qe(e)], u = t !== void 0 && t > 0;
	return I.effectiveness(I.effectivenessFigure(l, i(o), s && I.effectivenessAbsolute(a(s.recovered, s.recovered < 0), a(s.potential), I.powerUnit)), n ? I.effectivenessFigure(void 0, i(e?.effectiveness.moisture), c && I.effectivenessAbsolute(a(c.recovered, c.recovered * c.extracted < 0), a(c.extracted), I.moistureUnit)) : void 0, u ? t >= 1 ? B(t, r) : B(Math.max(t, .1), r, 1) : void 0);
}
//#endregion
//#region src/diagram/drawing.ts
var ci = {
	width: 400,
	height: 200
}, li = 14, J = {
	x: 86,
	y: 62
}, Y = {
	x: 306,
	y: 138
}, ui = 34, di = J.x + ui, X = Y.x - ui, fi = (e) => ci.width - e, pi = `C ${String(di + 51)} ${String(J.y)} ${String(X - 46)} ${String(Y.y)} ${String(X)} ${String(Y.y)}`, mi = `C ${String(di + 20)} ${String(J.y)} ${String(di + 5)} 192 200 192 C ${String(X - 23)} 192 ${String(X - 18)} ${String(Y.y)} ${String(X)} ${String(Y.y)}`, hi = (e) => `M ${String(J.x)} ${String(J.y)} L ${String(di)} ${String(J.y)} ${e} L ${String(Y.x)} ${String(Y.y)}`, gi = {
	supply: hi(pi),
	exhaust: `M ${String(fi(J.x))} ${String(J.y)} L ${String(fi(di))} ${String(J.y)} C ${String(fi(di + 51))} ${String(J.y)} ${String(fi(X - 46))} ${String(Y.y)} ${String(fi(X))} ${String(Y.y)} L ${String(fi(Y.x))} ${String(Y.y)}`,
	bypass: hi(mi)
}, Z = (e, t) => Math.round(e * 10 ** t) / 10 ** t, _i = {
	supply: "306,124 326,138 306,152",
	exhaust: "94,124 74,138 94,152"
}, vi = "175.8,26 224.2,26 255,100 224.2,174 175.8,174 145,100", yi = "181.3,38 218.7,38 240.7,100 218.7,162 181.3,162 159.3,100", bi = {
	d: "M 200 32 L 221.45 32 L 247.85 100 L 221.45 168 L 178.55 168 L 152.15 100 L 178.55 32 Z",
	width: 14
}, xi = {
	d: "M 200 38 L 218.7 38 L 240.7 100 L 218.7 162 L 181.3 162 L 159.3 100 L 181.3 38 Z",
	width: 3
}, Si = "M 175.8 26 L 224.2 26 L 255 100 L 224.2 174 L 175.8 174 L 145 100 Z M 181.3 38 L 218.7 38 L 240.7 100 L 218.7 162 L 181.3 162 L 159.3 100 Z", Ci = 45, wi = {
	from: J.x + 11.600000000000001 / 2,
	to: di - 11.600000000000001 / 2
}, Ti = 5, Ei = 48, Di = 3, Oi = Di * 1.5, ki = 1.5;
function Ai() {
	return Array.from({ length: 49 }, (e, t) => {
		let n = t / Ei, r = li / 2 * -Math.cos(Ti * Math.PI * n);
		return {
			x: Z(wi.from + (wi.to - wi.from) * n, 2),
			y: Z(J.y + r, 2)
		};
	});
}
var ji = Ai().map(({ x: e, y: t }, n) => `${n === 0 ? "M" : "L"} ${String(e)} ${String(t)}`).join(" ");
function Mi() {
	let e = Ai(), [t, n] = [e.map((e) => e.x), e.map((e) => e.y)], r = 6.75, [i, a] = [Math.min(...t) - r, Math.min(...n) - r];
	return {
		x: i,
		y: a,
		width: Math.max(...t) + r - i,
		height: Math.max(...n) + r - a
	};
}
function Ni() {
	let e = Mi(), t = (e, t) => `${String(Z(e / t * 100, 2))}%`;
	return {
		left: t(e.x, ci.width),
		top: t(e.y, ci.height),
		width: t(e.width, ci.width),
		height: t(e.height, ci.height)
	};
}
var Pi = 45, Fi = "M 6.5 18 A 4.5 4.5 0 0 1 6 9.05 A 6 6 0 0 1 17.5 10 A 4 4 0 0 1 17.5 18 Z", Ii = "M 12 4 L 21 12 L 18 12 L 18 20 L 14 20 L 14 15 L 10 15 L 10 20 L 6 20 L 6 12 L 3 12 Z", Li = 0;
function Ri() {
	Li += 1;
	let e = String(Li);
	return {
		supply: `hrv-supply-${e}`,
		exhaust: `hrv-exhaust-${e}`,
		rim: `hrv-rim-${e}`,
		blur: `hrv-blur-${e}`
	};
}
var zi = 1.5;
function Bi(e, t) {
	let n = t > 0 ? Z(zi / t, 3) : zi;
	return {
		[`--${e}-duration`]: `${String(n)}s`,
		[`--${e}-state`]: t > 0 ? "running" : "paused"
	};
}
function Vi(e, t, n) {
	if (n <= 0) return null;
	let r = e === "exhaust" ? "exhaust" : "supply";
	return D`<path class="stream ${e}" d=${gi[e]} stroke=${t} stroke-width=${li}
      opacity=${n}></path>
    <path class="flow ${r}-air" d=${gi[e]} opacity=${n}></path>`;
}
var Hi = (e, t) => D`<stop offset=${e} style=${k({ "stop-color": t })}></stop>`, Ui = (e, t, n) => D`<g class="symbol">
    <circle cx=${e} cy="100" r="20" style=${k({ fill: t })}></circle>
    <path d=${n} transform="translate(${String(e - 12)} ${"88"})"></path>
  </g>`, Wi = (e) => `${String(Z(e ?? 0, 2))} 100`;
function Gi(e, t) {
	return D`<path class="ring moisture" d=${bi.d} fill="none" stroke-width=${bi.width}
    pathLength="100" stroke-dasharray=${Wi(t)} clip-path="url(#${e})"></path>`;
}
function Ki(e, t) {
	let { d: n, width: r } = xi, i = `color-mix(in srgb, ${e} ${String(Ci)}%, var(--primary-text-color))`;
	return D`<path class="ring-track total" d=${n} fill="none" stroke-width=${r}
      style=${k({ stroke: `color-mix(in srgb, ${i} 25%, var(--secondary-background-color))` })}></path>
    <path class="ring total" d=${n} fill="none" stroke-width=${r} pathLength="100" stroke-dasharray=${Wi(t)}
      style=${k({ stroke: i })}></path>`;
}
var qi = (e) => 30 + 70 * e, Ji = 1, Yi = .9, Xi = "--coil-core-base", Zi = (e) => `oklch(from ${e} calc(l * ${String(Yi)}) c h)`, Qi = 80, $i = (e) => `color-mix(in srgb, ${e} ${String(Qi)}%, black)`;
function ea({ level: e, color: t }, n) {
	if (e <= 0) return D`<g class="coil off">
      <path class="coil" d=${ji} fill="none" stroke-width=${Di} stroke-linejoin="round"></path>
      <path class="coil-core" d=${ji} fill="none" stroke-width=${Ji} stroke-linejoin="round"></path>
    </g>`;
	let r = qi(e), i = `color-mix(in srgb, ${t} ${String(Z(r, 1))}%, var(--secondary-text-color))`, a = `color-mix(in srgb, ${i} ${String(Z(100 - Pi * e, 1))}%, white)`, o = String(Z(r / 100, 3));
	return D`<path class="coil-glow" d=${ji} fill="none" stroke-width=${Oi} stroke-linejoin="round"
      filter="url(#${n})" opacity=${o}
      style=${k({
		stroke: t,
		"--glow-opacity": o
	})}></path>
    <path class="coil on" d=${ji} fill="none" stroke-width=${Di} stroke-linejoin="round"
      style=${k({ stroke: a })}></path>
    <path class="coil-core" d=${ji} fill="none" stroke-width=${Ji} stroke-linejoin="round"
      style=${k({ [Xi]: i })}></path>`;
}
function ta(e) {
	let { x: t, y: n, width: r, height: i } = Mi();
	return D`<filter id=${e} filterUnits="userSpaceOnUse" x=${t} y=${n} width=${r} height=${i}>
    <feGaussianBlur stdDeviation=${ki}></feGaussianBlur>
  </filter>`;
}
function na({ ids: e, exchanger: t, colors: n, bypass: r, speeds: i, rings: a, coil: o }) {
	let [s, c] = [Z(r, 3), Z(1 - r, 3)], l = `url(#${e.supply})`, u = `url(#${e.exhaust})`;
	return D`<svg
    class="art"
    viewBox="0 0 ${String(ci.width)} ${String(ci.height)}"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    style=${k({
		...Bi("supply", i.supply),
		...Bi("exhaust", i.exhaust)
	})}
  >
    <defs>
      <linearGradient id=${e.supply} gradientUnits="userSpaceOnUse" x1="86" y1="62" x2="326" y2="138">
        ${Hi("0", n.outdoor)}${Hi("1", n.supply)}
      </linearGradient>
      <linearGradient id=${e.exhaust} gradientUnits="userSpaceOnUse" x1="314" y1="62" x2="74" y2="138">
        ${Hi("0", n.extract)}${Hi("1", n.exhaust)}
      </linearGradient>
      <clipPath id=${e.rim}><path d=${Si} clip-rule="evenodd"></path></clipPath>
      ${o ? ta(e.blur) : null}
    </defs>
    ${Ui(36, n.outdoor, Fi)}
    ${Ui(364, n.extract, Ii)}
    <polygon class="exchanger ${t}" points=${vi}></polygon>
    ${a?.moisture ? Gi(e.rim, a.moisture.figure) : null}
    <polygon class="outline" points=${vi}></polygon>
    <polygon class="exchanger-inner" points=${yi}></polygon>
    ${a ? Ki(a.color, a.total) : null}
    ${Vi("bypass", l, s)}
    ${Vi("supply", l, c)}
    ${o ? ea(o, e.blur) : null}
    <polygon class="head" points=${_i.supply} style=${k({ fill: n.supply })}></polygon>
    ${Vi("exhaust", u, 1)}
    <polygon class="head" points=${_i.exhaust} style=${k({ fill: n.exhaust })}></polygon>
  </svg>`;
}
//#endregion
//#region src/diagram/flow.ts
var ra = .25;
function ia(e, t) {
	let n = Pt(e);
	return n === void 0 ? 1 : n <= 0 ? 0 : t === void 0 || t <= 0 ? 1 : Math.min(Math.max(n / t, ra), 2);
}
var aa = (e) => e.trim().toLowerCase();
function oa(e, t) {
	if (e === void 0 || Mt(e)) return !1;
	let n = aa(e.state);
	return t.some((e) => aa(e) === n);
}
//#endregion
//#region src/diagram/preheater.ts
var sa = .1;
function ca(e, t) {
	if (!bn(e)) return 0;
	let n = z(e && {
		state: e.state,
		attributes: e.attributes ?? {}
	}, "power");
	return n === void 0 || t === void 0 ? 1 : Math.min(Math.max(n / t, sa), 1);
}
function la(e) {
	return ca(e, void 0) > 0;
}
function ua(e, t) {
	return e === "auto" ? t !== void 0 && t > 0 && t < 340 : e === "compact";
}
var da = ["status.power", "status.rmot"], fa = ["seasons.heating", "seasons.cooling"], pa = ["fans.supply_flow", "fans.exhaust_flow"], ma = [
	"fans.level",
	"bypass.mode",
	"bypass.next_change",
	"status.operating_mode",
	"status.target_temperature",
	"status.temperature_profile",
	"status.next_fan_change",
	"status.filter_days",
	"pre_heater.energy"
], ha = {
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
	"pre_heater.energy": {
		column: 2,
		row: 3
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
}, ga = { "status.rmot": I.prefixes.rmot }, _a = {
	"status.power": "mdi:lightning-bolt",
	"status.rmot": "mdi:thermometer-lines",
	"fans.level": "mdi:fan",
	"bypass.mode": "mdi:shuffle-variant",
	"bypass.next_change": "mdi:timer-outline",
	"status.operating_mode": "mdi:cog-outline",
	"status.target_temperature": "mdi:thermometer",
	"status.temperature_profile": "mdi:thermostat",
	"status.next_fan_change": "mdi:timer-outline",
	"status.filter_days": "mdi:air-filter",
	"pre_heater.power": "mdi:heat-wave",
	"pre_heater.energy": "mdi:heat-wave"
}, va = /* @__PURE__ */ new Set(["bypass.next_change", "status.next_fan_change"]), ya = (e) => e.trim().toLowerCase() === "n/a";
function ba(e, t) {
	return va.has(e) && (ya(t?.state ?? "") || t?.state === "unknown");
}
function xa(e, t, n) {
	return ba(e, t) ? !0 : e === "bypass.position" && Pt(t) === 0 ? !1 : n || !Mt(t);
}
function Sa(e, t, { showUnavailable: n, compact: r }) {
	let i = (r) => r.flatMap((r) => {
		let i = M(e, r);
		if (i === void 0) return [];
		let a = t[i], o = xa(r, a, n), s = _a[r];
		return [{
			role: r,
			entityId: i,
			...s === void 0 ? {} : { icon: s },
			prefix: ga[r] ?? "",
			visible: o,
			...ba(r, a) ? { notPlanned: !0 } : {}
		}];
	}), a = (t) => t.some((t) => M(e, t) !== void 0), o = {
		corners: ft((e) => i(r ? [`${e}.temperature`, `${e}.humidity`] : [
			`${e}.temperature`,
			`${e}.humidity`,
			`${e}.absolute_humidity`
		])),
		centre: i(["bypass.position"]),
		flows: r ? [] : i(pa)
	};
	if (a([
		...da,
		...fa,
		"pre_heater.power"
	])) {
		let n = M(e, "pre_heater.power");
		o.top = i(n !== void 0 && la(t[n]) ? [
			"status.power",
			"pre_heater.power",
			"status.rmot"
		] : da);
	}
	return r || a(ma) && (o.status = i(ma)), o;
}
//#endregion
//#region src/diagram/options.ts
var Ca = { paths: [
	"outdoor.temperature",
	"supply.temperature",
	"extract.temperature",
	"exhaust.temperature"
] }, wa = [
	"auto",
	"full",
	"compact"
], Ta = ["hrv", "erv"], Q = {
	...Pn,
	exchangerType: {
		kind: "choice",
		path: "exchanger_type",
		choices: Ta,
		default: "hrv"
	},
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
	showEffectiveness: {
		kind: "boolean",
		path: "show_effectiveness",
		default: !1
	},
	nominalFlow: {
		kind: "number",
		path: "animation.nominal_flow",
		min: 1,
		max: 1e5,
		default: void 0
	},
	preHeaterMaxPower: {
		kind: "number",
		path: "pre_heater.max_power",
		min: 1,
		max: 4e3,
		default: void 0
	},
	preHeaterGlowColor: {
		kind: "color",
		path: "pre_heater.glow_color",
		default: "#ff9800"
	},
	stoppedStates: {
		kind: "list",
		path: "fans.stopped_states",
		default: ["Disabled"]
	},
	layout: {
		kind: "choice",
		path: "layout",
		choices: wa,
		default: "auto"
	},
	showUnavailable: {
		kind: "boolean",
		path: "show_unavailable",
		default: !1
	}
}, Ea = Object.values(Q), Da = {
	heating: "mdi:sun-thermometer",
	cooling: "mdi:snowflake-thermometer",
	between: "mdi:sun-snowflake-variant"
};
function Oa(e, t, n) {
	let r = M(e, "seasons.heating"), i = M(e, "seasons.cooling"), a = (e) => t[e]?.state, o = (e, t, n) => ({
		season: e,
		icon: Da[e],
		color: t,
		title: I.seasons[e],
		entityId: n
	});
	if (r !== void 0 && a(r) === "on") return o("heating", n.warm, r);
	if (i !== void 0 && a(i) === "on") return o("cooling", n.cold, i);
	if (r !== void 0 && i !== void 0 && a(r) === "off" && a(i) === "off") return o("between", "var(--secondary-text-color)", r);
}
//#endregion
//#region src/diagram/streams.ts
var ka = "var(--disabled-text-color, #9e9e9e)", Aa = 10;
function ja(e) {
	let t = Pt(e);
	return t === void 0 ? 0 : Math.min(Math.max(t / 100, 0), 1);
}
function Ma(e) {
	let t = ft((t) => z(e[t], "temperature")), n = Object.values(t).filter((e) => e !== void 0), r = Math.min(...n), i = Math.max(...n), a = Math.max(i - r, Aa), o = (r + i) / 2 - a / 2, s = (e) => e === void 0 ? void 0 : Math.min(Math.max((e - o) / a, 0), 1);
	return ft((e) => s(t[e]));
}
function Na(e, t) {
	if (e === void 0) return ka;
	let n = Math.round(e * 1e3) / 10;
	return n <= 0 ? t.cold : n >= 100 ? t.warm : `color-mix(in srgb, ${t.warm} ${String(n)}%, ${t.cold})`;
}
function Pa(e, t) {
	let n = Ma(e);
	return ft((e) => Na(n[e], t));
}
//#endregion
//#region src/editor/diagram-schema.ts
var $ = { advanced: !0 }, Fa = [
	yr("exchanger_type", Q.exchangerType, Ot.exchangerTypes, { advanced: !1 }),
	U("outdoor", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	U("supply", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	U("extract", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	U("exhaust", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	{
		type: "expandable",
		name: "fans",
		schema: [
			mr("level"),
			hr("ventilation_mode"),
			gr("stopped_states", Q.stoppedStates),
			H("supply_flow"),
			H("exhaust_flow")
		]
	},
	{
		type: "expandable",
		name: "bypass",
		schema: [
			H("position"),
			H("mode"),
			H("next_change", $)
		]
	},
	{
		type: "expandable",
		name: "status",
		schema: [
			H("operating_mode"),
			H("target_temperature", $),
			H("temperature_profile", $),
			H("next_fan_change", $),
			H("filter_days"),
			H("power"),
			H("rmot"),
			H("heating_saving", $),
			H("cooling_saving", $),
			H("moisture_recovery", $),
			H("moisture_outside", $)
		]
	},
	{
		type: "expandable",
		name: "pre_heater",
		schema: [
			pr("power"),
			H("energy"),
			H("temperature_after"),
			H("humidity_after"),
			_r("max_power", Q.preHeaterMaxPower, 1, "W"),
			W("glow_color", Q.preHeaterGlowColor.default)
		]
	},
	{
		type: "expandable",
		name: "seasons",
		schema: [fr("heating"), fr("cooling")]
	},
	{
		type: "expandable",
		name: "animation",
		schema: [vr("enabled", Q.animation), _r("nominal_flow", Q.nominalFlow, 1)]
	},
	vr("show_effectiveness", Q.showEffectiveness),
	Sr,
	{
		type: "expandable",
		name: "colors",
		schema: [W("cold", Q.cold.default), W("warm", Q.warm.default)]
	},
	yr("layout", Q.layout, Ot.layouts),
	vr("show_unavailable", Q.showUnavailable, $)
], Ia = (e, t) => t === void 0 ? void 0 : e[t];
function La(e, t) {
	let n = e.states[t];
	if (n === void 0) return "n/a";
	if (typeof e.formatEntityState == "function") return e.formatEntityState(n);
	let r = n.attributes.unit_of_measurement;
	return r && !Mt(n) ? `${n.state} ${r}` : n.state;
}
function Ra(e) {
	if (e === void 0 || !e.entity_id.startsWith("fan.") || Mt(e)) return;
	let { percentage: t, percentage_step: n } = e.attributes;
	return typeof t != "number" || !Number.isFinite(t) || typeof n != "number" || !Number.isFinite(n) || n <= 0 ? void 0 : Math.round(100 / n) === 3 ? St[Math.min(3, Math.max(+(t > 0), Math.round(t / n)))] : `${String(Math.round(t))} %`;
}
//#endregion
//#region src/cards/ventilation-card.ts
var za = "hrv-ventilation-card";
function Ba(e) {
	Rr(e, Ca, Ea);
}
var Va = 400, Ha = 500, Ua = (e, t) => o`
  @container (max-width: ${a(String(t))}px) {
    ${a(e)} .figure .value {
      display: flex;
      flex-direction: column;
    }
    ${a(e)} .unit {
      margin-left: 0;
    }
  }
`, Wa = (e, t) => {
	let n = wt[e];
	return `${n.charAt(0).toUpperCase()}${n.slice(1)}: ${t}`;
}, Ga = class extends Br {
	constructor(...e) {
		super(...e), this.compact = !1, this.observer = new ResizeObserver((e) => {
			this.width = e[0]?.contentRect.width, this.updateCompact();
		}), this.ids = Ri(), this.activate = (e) => {
			if (this.sample) return;
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
		}, this.stopped = !1;
	}
	static {
		this.styles = o`
    /* The host is the container the label sizes follow: cqi units resolve against an ancestor container. */
    :host {
      display: block;
      container-type: inline-size;
      /* The space between the separator under the top row and the drawing. */
      --top-gap: 6px;
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
      margin-bottom: var(--top-gap);
      padding-bottom: 4px;
      border-bottom: 1px solid var(--divider-color);
    }
    /* Each cell centres its content on the row: a label's baseline would leave it above the season icon. */
    .top > * {
      display: flex;
      align-items: center;
    }
    /* Power, then the pre-heater while it is on: the pair widens around the middle. */
    .top > .centre {
      justify-content: center;
      gap: 8px;
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
    /* Each value centred in its column; a label too wide for it ends its value in an ellipsis. */
    .status .cell {
      display: flex;
      justify-content: center;
      min-width: 0;
    }
    .not-planned .value {
      opacity: 0.6;
    }
    .drawing {
      --erv-fill: color-mix(in srgb, var(--secondary-background-color) 75%, #4f86b8);
      --erv-ring: color-mix(in srgb, var(--secondary-background-color) 44%, #3d78ae);
      position: relative;
      aspect-ratio: 2 / 1;
    }
    /* Without a top row there is no separator or gap above the drawing. */
    .drawing.no-top {
      --top-gap: 0px;
    }
    .art {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    /* The fill only: the outlines are drawn over the moisture ring (see drawing.ts). */
    .exchanger {
      fill: var(--secondary-background-color);
    }
    .outline {
      fill: none;
      stroke: var(--divider-color);
      stroke-width: 2;
    }
    /* An energy recovery exchanger: blue-grey, mixed from the theme's colour so it stays light or dark with it. */
    .exchanger.erv {
      fill: var(--erv-fill);
    }
    .ring.moisture {
      stroke: var(--erv-ring);
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
    .bypass-position {
      left: 50%;
      transform: translateX(-50%);
    }
    /*
     * Over the exchanger (x 145 to 255, y 26 to 174 of 400 by 200), in its hexagon: only a tooltip and a name for the
     * rings, so it is first in the DOM and everything else on the exchanger stays on top of it.
     */
    .effectiveness {
      top: 13%;
      left: 36.25%;
      width: 27.5%;
      height: 74%;
      clip-path: polygon(28% 0, 72% 0, 100% 50%, 72% 100%, 28% 100%, 0 50%);
    }
    /* The pre-heater coil's tap box: its position and size are set inline from the coil's bounds (see coilBox in drawing.ts). */
    .coil,
    .coil-core {
      stroke-linecap: round;
    }
    /* The off coil: the group dims the wire and its centreline together, so the centreline is darker than the wire as drawn. */
    .coil.off {
      stroke: var(--secondary-text-color);
      opacity: 0.5;
      ${a(Xi)}: var(--secondary-text-color);
    }
    /* The centreline: a color-mix fallback, replaced by the relative colour only where the browser parses it. */
    .coil-core {
      stroke: ${a($i(`var(${Xi})`))};
    }
    @supports (color: oklch(from red l c h)) {
      .coil-core {
        stroke: ${a(Zi(`var(${Xi})`))};
      }
    }
    .coil-glow {
      animation: hrv-glow 2.5s ease-in-out infinite;
    }
    /* A gentle pulse of the glow around its level (--glow-opacity), between 60 % and 100 % of it. */
    @keyframes hrv-glow {
      50% {
        opacity: calc(var(--glow-opacity) * 0.6);
      }
    }
    .still .coil-glow {
      animation: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .coil-glow {
        animation: none;
      }
    }
    /*
     * The ventilation alert: centred over the exchanger, and vertically halfway between the separator under the top
     * row (--top-gap above the drawing) and the exchanger's top edge (y 26 of 200, 13 %), in the strip between the
     * outdoor and extract corner stacks.
     */
    .alert {
      top: calc((13% - var(--top-gap)) / 2);
      left: 50%;
      transform: translate(-50%, -50%);
      flex-direction: row;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      font-size: max(11px, 0.9em);
      color: var(--warning-color, #ffa600);
    }
    .alert ha-icon {
      --mdc-icon-size: 1.3em;
      display: flex;
      flex: none;
      width: var(--mdc-icon-size);
      height: var(--mdc-icon-size);
    }
    /* Just below the exchanger's inner outline (y 38). */
    .bypass-position {
      top: 21.5%;
    }
    /*
     * Right of the exchanger, centred at y 100 (the height of the exchanger's centre and the house symbol's) and at
     * x 299.5, halfway between the exchanger's right vertex (x 255) and the house symbol (x 344), in the wedge the
     * streams leave there. Where the number and its unit do not fit one line, the unit goes under the number.
     */
    .moisture-recovery,
    .moisture-outside {
      top: 50%;
      transform: translate(-50%, -50%);
      /* Two lines of 11 px have to fit the wedge at 280 px (about 40 units high at its left end). */
      line-height: 1.1;
    }
    /* More specific than the label value rule below, whose ellipsis would clip a long figure. */
    .moisture-recovery .figure .value,
    .moisture-outside .figure .value {
      overflow: visible;
      text-align: center;
    }
    /* The width of a space between the number and its unit; none where the unit goes under the number. */
    .moisture-recovery .unit,
    .moisture-outside .unit {
      margin-left: 0.25em;
    }
    .moisture-recovery {
      left: 74.9%;
    }
    /*
     * Left of the exchanger, centred at x 91 and y 100 (the exchanger's centre height, as the recovered figure) in
     * the free box between the outdoor symbol (right edge x 56), the bypass path (left edge about x 127 at y 100), the
     * outdoor lead and coil (to y 75) and the exhaust lead (from y 131): about 34 units each way, where the mirror of
     * the recovered figure (x 100.5) would leave 26.
     * The same two-line layout as the recovered figure, up to a wider card because the box is narrower.
     */
    .moisture-outside {
      left: 22.75%;
    }
    ${Ua(".moisture-recovery", Va)}
    ${Ua(".moisture-outside", Ha)}
    /* On the exchanger's centre. */
    .saving {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    /*
     * Below the arrowheads (bottom at y 152), from y 158: the supply flow ends at x 340, under its head (x 306 to 326)
     * and right of the bypass path (left of x 280 there, with its stroke), clear of the corner labels (from x 346); the
     * exhaust flow starts under its head (x 74). Clear of the wedge with the moisture figure; a little smaller.
     */
    .exhaust-flow,
    .supply-flow {
      top: 79%;
      font-size: max(11px, 0.9em);
    }
    .exhaust-flow {
      left: 18.5%;
    }
    .supply-flow {
      right: 15%;
    }
    /* Narrow cards: lower, so the label clears the bypass path as it rises to the supply arrow (forced full layout). */
    @container (max-width: ${339}px) {
      .supply-flow {
        top: 82%;
      }
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
    /*
     * A label: its icon centred vertically on its value. A flex box applies no text-overflow to its children, so the
     * value carries the ellipsis of a value too long for its cell.
     */
    .label {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      max-width: 100%;
      white-space: nowrap;
    }
    .label .value {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* A label's icon: a box as high as its text. Home Assistant's icon sizes its own svg from --mdc-icon-size. */
    .label ha-icon {
      --mdc-icon-size: 1.15em;
      display: flex;
      flex: none;
      width: var(--mdc-icon-size);
      height: var(--mdc-icon-size);
    }
    /* Whatever opens a more-info dialog, and only that. */
    [data-entity] {
      cursor: pointer;
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
    /* A box of the icon's size, so its focus ring and its place in the row are those of the icon. */
    ha-icon.season {
      --mdc-icon-size: 22px;
      display: flex;
      width: var(--mdc-icon-size);
      height: var(--mdc-icon-size);
    }
    ${zr}
  `;
	}
	static getConfigElement() {
		let e = document.createElement(Yt);
		return e.schema = Fa, e;
	}
	contentSize() {
		return 6;
	}
	getGridOptions() {
		return {
			columns: 12,
			min_columns: 9
		};
	}
	check(e) {
		Ba(e);
	}
	configure(e) {
		let t = M(e, "pre_heater.power");
		this.settings = {
			exchanger: R(e, Q.exchangerType),
			colors: {
				cold: R(e, Q.cold),
				warm: R(e, Q.warm)
			},
			layout: R(e, Q.layout),
			showUnavailable: R(e, Q.showUnavailable),
			badge: $r(e),
			savings: {
				heating: M(e, "status.heating_saving"),
				cooling: M(e, "status.cooling_saving")
			},
			moistureRecovery: M(e, "status.moisture_recovery"),
			moistureOutside: M(e, "status.moisture_outside"),
			preHeater: t ? {
				entityId: t,
				maxPower: R(e, Q.preHeaterMaxPower),
				glowColor: R(e, Q.preHeaterGlowColor)
			} : void 0,
			rings: R(e, Q.showEffectiveness) && ei(e) ? { moisture: R(e, Q.exchangerType) === "erv" && vt(e, [
				"outdoor",
				"supply",
				"extract"
			]) } : void 0,
			temperatures: ft((t) => M(e, `${t}.temperature`)),
			bypass: M(e, "bypass.position"),
			flows: {
				supply: M(e, "fans.supply_flow"),
				exhaust: M(e, "fans.exhaust_flow")
			},
			ventilationMode: M(e, "fans.ventilation_mode"),
			stoppedStates: R(e, Q.stoppedStates),
			animate: R(e, Q.animation),
			nominalFlow: R(e, Q.nominalFlow)
		}, this.updateCompact();
	}
	updateCompact() {
		if (!this.settings) return;
		let e = ua(this.settings.layout, this.width);
		e !== this.compact && (this.compact = e);
	}
	connectedCallback() {
		super.connectedCallback(), this.observer.observe(this);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.observer.disconnect();
	}
	tap(e, t) {
		let n = this.sample ? void 0 : e;
		return {
			role: n ? "button" : t,
			tabindex: n ? "0" : void 0,
			entity: n
		};
	}
	label(e) {
		let t = this.shownHass, n = (t && e.role === "fans.level" ? this.stopped ? "Stopped" : Ra(t.states[e.entityId]) : void 0) ?? (t ? La(t, e.entityId) : ""), r = this.tap(e.entityId, "img"), [i = "", a = ""] = e.role.split("."), o = i === "pre_heater" ? `pre-heater-${a}` : a, s = e.icon ? E`<ha-icon .icon=${e.icon} aria-hidden="true"></ha-icon>` : O, c = E`<span class="value">${e.prefix}${e.notPlanned ? I.notPlanned : n}</span>`;
		return e.visible ? E`<span
      class="label ${o} ${e.notPlanned ? "not-planned" : ""}"
      role=${q(r.role)}
      tabindex=${q(r.tabindex)}
      aria-label="${wt[e.role]}: ${n}"
      title=${Wa(e.role, n)}
      data-entity=${q(r.entity)}
      >${s}${c}</span
    >` : E`<span class="label ${o} hidden" aria-hidden="true">${s}${c}</span>`;
	}
	disabled(e) {
		let { ventilationMode: t, stoppedStates: n } = this.settings ?? { stoppedStates: [] };
		return t !== void 0 && oa(e[t], n);
	}
	alert(e, t) {
		let n = this.tap(e, "img"), r = `${Ct}: ${t}`;
		return E`<div
      class="on-drawing alert"
      role=${q(n.role)}
      tabindex=${q(n.tabindex)}
      aria-label=${r}
      title=${r}
      data-entity=${q(n.entity)}
    >
      <ha-icon icon="mdi:alert" aria-hidden="true"></ha-icon><span>${Ct}</span>
    </div>`;
	}
	topRow(e, t) {
		let n = (t) => {
			let n = e.find((e) => e.role === t);
			return n ? this.label(n) : O;
		}, r = e.some((e) => e.role === "pre_heater.power"), i = e.find((e) => e.role === "status.power"), a = r && i && !i.visible ? O : n("status.power");
		return E`<div class="row top">
      <span>${this.season(t)}</span><span class="centre">${a}${n("pre_heater.power")}</span
      ><span>${n("status.rmot")}</span>
    </div>`;
	}
	statusGrid(e) {
		return E`<div class="status">
      ${e.map((e) => {
			let t = ha[e.role];
			return E`<div
          class="cell"
          style=${k({
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
		if (!e) return O;
		let t = this.tap(e.entityId, "img");
		return E`<ha-icon
      class="season"
      .icon=${e.icon}
      title=${e.title}
      aria-label=${e.title}
      role=${q(t.role)}
      tabindex=${q(t.tabindex)}
      data-entity=${q(t.entity)}
      style=${k({ color: e.color })}
    ></ha-icon>`;
	}
	badge(e, t) {
		if (!e) return O;
		let n = e.tint === void 0 ? {} : {
			"--badge-fill": `color-mix(in srgb, ${e.tint} 25%, var(--card-background-color, #fff))`,
			"--badge-border": e.tint
		}, r = this.tap(t);
		return E`<span
      class="badge ${e.kind}"
      role=${q(r.role)}
      tabindex=${q(r.tabindex)}
      data-entity=${q(r.entity)}
      style=${k(n)}
      >${e.text}</span
    >`;
	}
	moistureFigure(e, t, n) {
		if (!e) return O;
		let r = this.tap(t, "img");
		return E`<div class="on-drawing moisture-${n}">
      <span
        class="label figure"
        title=${e.title}
        aria-label=${e.title}
        role=${q(r.role)}
        tabindex=${q(r.tabindex)}
        data-entity=${q(r.entity)}
        >${e.icon ? E`<ha-icon .icon=${e.icon} aria-hidden="true"></ha-icon>` : O}<span class="value"
          ><span class="number">${e.text}</span>${e.unit ? E`<span class="unit">${e.unit}</span>` : O}</span
        ></span
      >
    </div>`;
	}
	coilBox(e, t) {
		let n = this.tap(e, "img"), r = Wa("pre_heater.power", t);
		return E`<div
      class="on-drawing pre-heater"
      role=${q(n.role)}
      tabindex=${q(n.tabindex)}
      aria-label=${r}
      title=${r}
      data-entity=${q(n.entity)}
      style=${k(Ni())}
    ></div>`;
	}
	render() {
		let e = this.shownHass;
		if (!this.config || !e || !this.settings) return O;
		let { settings: t } = this, { compact: n } = this, r = Sa(this.config, e.states, {
			showUnavailable: t.showUnavailable,
			compact: n
		}), i = Oa(this.config, e.states, t.colors), a = this.disabled(e.states);
		this.stopped = a;
		let o = (t.badge || t.rings) && this.calculator ? this.calculator(e, { noAirflow: a }) : void 0, s = o?.result, c = Kn(e), l = t.badge ? ni(s, t, c) : void 0, u = ai(s, t, c), d = oi(s, t, c), { states: f } = e, { temperatures: p, flows: m } = t, { rings: h } = t, g = h ? si(s, o?.inputs.bypass, h.moisture, c) : void 0, { preHeater: _, ventilationMode: v } = t, y = na({
			ids: this.ids,
			exchanger: t.exchanger,
			colors: Pa(ft((e) => Ia(f, p[e])), t.colors),
			bypass: ja(Ia(f, t.bypass)),
			speeds: {
				supply: a ? 0 : ia(Ia(f, m.supply), t.nominalFlow),
				exhaust: a ? 0 : ia(Ia(f, m.exhaust), t.nominalFlow)
			},
			rings: h ? {
				total: s?.effectiveness.total,
				moisture: h.moisture ? { figure: s?.effectiveness.moisture } : void 0,
				color: ti(s?.mode, t.colors)
			} : void 0,
			coil: _ ? {
				level: ca(Ia(f, _.entityId), _.maxPower),
				color: _.glowColor
			} : void 0
		});
		return E`<ha-card @click=${this.activate} @keydown=${this.activate}>
      ${r.top ? this.topRow(r.top, i) : O}
      <div class="drawing ${t.animate ? "" : "still"} ${r.top ? "" : "no-top"}">
        ${y}
        ${dt.map((e) => E`<div class="corner ${e}">${r.corners[e].map((e) => this.label(e))}</div>`)}
        ${g === void 0 ? O : E`<div class="on-drawing effectiveness" role="img" aria-label=${g} title=${g}></div>`}
        ${_ ? this.coilBox(_.entityId, La(e, _.entityId)) : O}
        ${a && v ? this.alert(v, La(e, v)) : O}
        <div class="on-drawing bypass-position">${r.centre.map((e) => this.label(e))}</div>
        ${l ? E`<div class="on-drawing saving">${this.badge(l, ri(s, t.savings, f))}</div>` : O}
        ${this.moistureFigure(u, t.moistureRecovery, "recovery")}
        ${this.moistureFigure(d, t.moistureOutside, "outside")}
        ${r.flows.map((e) => E`<div class="on-drawing ${e.role === "fans.supply_flow" ? "supply-flow" : "exhaust-flow"}">
              ${this.label(e)}
            </div>`)}
      </div>
      ${r.status ? this.statusGrid(r.status) : O} ${this.sampleNote()}
    </ha-card>`;
	}
};
L([ut()], Ga.prototype, "compact", void 0), xt(za, Ga);
//#endregion
//#region src/index.ts
var Ka = [
	{
		type: za,
		...Dt.diagram,
		preview: !0
	},
	{
		type: Yr,
		...Dt.recovery,
		preview: !0
	},
	{
		type: Hr,
		...Dt.moisture,
		preview: !0
	}
];
function qa(e = window) {
	let t = e.customCards ??= [];
	for (let e of Ka) t.some((t) => t.type === e.type) || t.push({ ...e });
}
qa();
//#endregion
export { Ka as CARD_ENTRIES, qa as registerCardPicker };

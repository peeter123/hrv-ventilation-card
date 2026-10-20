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
var re = class extends HTMLElement {
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
re.elementStyles = [], re.shadowRootOptions = { mode: "open" }, re[v("elementProperties")] = /* @__PURE__ */ new Map(), re[v("finalized")] = /* @__PURE__ */ new Map(), ee?.({ ReactiveElement: re }), (h.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var ie = globalThis, ae = (e) => e, oe = ie.trustedTypes, se = oe ? oe.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ce = "$lit$", b = `lit$${Math.random().toFixed(9).slice(2)}$`, le = "?" + b, ue = `<${le}>`, x = document, de = () => x.createComment(""), fe = (e) => e === null || typeof e != "object" && typeof e != "function", pe = Array.isArray, me = (e) => pe(e) || typeof e?.[Symbol.iterator] == "function", he = "[ 	\n\f\r]", ge = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _e = /-->/g, ve = />/g, S = RegExp(`>|${he}(?:([^\\s"'>=/]+)(${he}*=${he}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ye = /'/g, be = /"/g, xe = /^(?:script|style|textarea|title)$/i, Se = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), C = Se(1), w = Se(2), T = Symbol.for("lit-noChange"), E = Symbol.for("lit-nothing"), Ce = /* @__PURE__ */ new WeakMap(), we = x.createTreeWalker(x, 129);
function Te(e, t) {
	if (!pe(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return se === void 0 ? t : se.createHTML(t);
}
var Ee = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = ge;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === ge ? c[1] === "!--" ? o = _e : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = S) : (xe.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = S) : o = ve : o === S ? c[0] === ">" ? (o = i ?? ge, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? S : c[3] === "\"" ? be : ye) : o === be || o === ye ? o = S : o === _e || o === ve ? o = ge : (o = S, i = void 0);
		let d = o === S && e[t + 1].startsWith("/>") ? " " : "";
		a += o === ge ? n + ue : l >= 0 ? (r.push(s), n.slice(0, l) + ce + n.slice(l) + b + d) : n + b + (l === -2 ? t : d);
	}
	return [Te(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, De = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Ee(t, n);
		if (this.el = e.createElement(l, r), we.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = we.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(ce)) {
					let t = u[o++], n = i.getAttribute(e).split(b), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Me : r[1] === "?" ? Ne : r[1] === "@" ? Pe : je
					}), i.removeAttribute(e);
				} else e.startsWith(b) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (xe.test(i.tagName)) {
					let e = i.textContent.split(b), t = e.length - 1;
					if (t > 0) {
						i.textContent = oe ? oe.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], de()), we.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], de());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === le) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(b, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += b.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = x.createElement("template");
		return n.innerHTML = e, n;
	}
};
function Oe(e, t, n = e, r) {
	if (t === T) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = fe(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = Oe(e, i._$AS(e, t.values), i, r)), t;
}
var ke = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? x).importNode(t, !0);
		we.currentNode = r;
		let i = we.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Ae(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Fe(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = we.nextNode(), a++);
		}
		return we.currentNode = x, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Ae = class e {
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
		e = Oe(this, e, t), fe(e) ? e === E || e == null || e === "" ? (this._$AH !== E && this._$AR(), this._$AH = E) : e !== this._$AH && e !== T && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? me(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== E && fe(this._$AH) ? this._$AA.nextSibling.data = e : this.T(x.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = De.createElement(Te(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new ke(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = Ce.get(e.strings);
		return t === void 0 && Ce.set(e.strings, t = new De(e)), t;
	}
	k(t) {
		pe(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(de()), this.O(de()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ae(e).nextSibling;
			ae(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, je = class {
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
		if (i === void 0) e = Oe(this, e, t, 0), a = !fe(e) || e !== this._$AH && e !== T, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = Oe(this, r[n + o], t, o), s === T && (s = this._$AH[o]), a ||= !fe(s) || s !== this._$AH[o], s === E ? e = E : e !== E && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === E ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Me = class extends je {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === E ? void 0 : e;
	}
}, Ne = class extends je {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== E);
	}
}, Pe = class extends je {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = Oe(this, e, t, 0) ?? E) === T) return;
		let n = this._$AH, r = e === E && n !== E || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== E && (n === E || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Fe = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		Oe(this, e);
	}
}, Ie = ie.litHtmlPolyfillSupport;
Ie?.(De, Ae), (ie.litHtmlVersions ??= []).push("3.3.3");
var Le = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Ae(t.insertBefore(de(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Re = globalThis, ze = class extends re {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Le(t, this.renderRoot, this.renderOptions);
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
ze._$litElement$ = !0, ze.finalized = !0, Re.litElementHydrateSupport?.({ LitElement: ze });
var Be = Re.litElementPolyfillSupport;
Be?.({ LitElement: ze }), (Re.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region node_modules/lit-html/directive.js
var Ve = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, He = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), Ue = class {
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
}, We = "important", Ge = " !" + We, D = He(class extends Ue {
	constructor(e) {
		if (super(e), e.type !== Ve.ATTRIBUTE || e.name !== "style" || e.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
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
				let t = typeof r == "string" && r.endsWith(Ge);
				e.includes("-") || t ? n.setProperty(e, t ? r.slice(0, -11) : r, t ? We : "") : n[e] = r;
			}
		}
		return T;
	}
}), Ke = 1.2, qe = 1006, Je = 2501, Ye = 1.86, Xe = 3600, Ze = 3, Qe = 1.5, $e = (e) => e.freeCooling ? "freeCooling" : e.mode === "cooling" ? "cooling" : "heat";
function et(e) {
	let t = ({ sensible: e, latent: t }) => ({
		sensible: Math.round(e),
		latent: Math.round(t)
	}), n = {
		recovered: t(e.recovered),
		lost: t(e.lost)
	}, r = n.recovered.sensible + n.recovered.latent;
	return {
		recovered: r,
		potential: r + n.lost.sensible + n.lost.latent,
		parts: n
	};
}
var tt = (e, t) => e >= t * (1 - 1e-9), nt = (e, t) => Math.min(Math.max(e / t * 100, 0), 100), rt = (e, t, n, r) => {
	let i = Math.abs(t);
	if (!(Math.round(i * r) <= 0 || !tt(i, n * qe * Ze))) return nt(e, i);
}, it = ({ outdoor: e, supply: t, extract: n }, r) => {
	let i = n - e;
	if (!(Math.round(Math.abs(r)) <= 0 || !tt(Math.abs(i), Qe))) return nt(t - e, i);
}, O = (e) => e !== void 0 && Number.isFinite(e), at = (e, t) => ({
	total: e.h - t.h,
	latent: Je * (e.A - t.A)
});
function ot(e) {
	let { temperature: t, absoluteHumidity: n, supplyFlow: r, bypass: i, airDensity: a } = e, o = [
		t.outdoor,
		t.supply,
		t.extract
	].filter(O), s = n && [
		n.outdoor,
		n.supply,
		n.extract
	].filter(O);
	if (o.length !== 3 || !O(r) || !O(i) || s !== void 0 && s.length !== 3 || !(Number.isFinite(a) && a > 0)) return;
	let c = (e, t) => ({
		h: a * qe * e + t * (Je + Ye * e),
		A: t
	}), [l, u, d] = o.map((e, t) => c(e, s?.[t] ?? 0)), f = r / Xe, p = i > 0 || l.h > d.h, m = d.h >= l.h, h, g;
	if (p) {
		let [e, t] = m ? [d, l] : [l, d];
		h = at(e, u), g = at(u, t);
	} else h = at(u, l), g = at(d, u);
	let _ = n && st(n, r), ee = rt(h.total, d.h - l.h, a, f), v = _ && it(n, _.extracted);
	return {
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
		latentKnown: s !== void 0,
		..._ ? { moisture: _ } : {},
		effectiveness: {
			...ee === void 0 ? {} : { total: ee },
			...v === void 0 ? {} : { moisture: v }
		}
	};
}
function st(e, t) {
	if (e === void 0 || !O(t)) return;
	let { outdoor: n, supply: r, extract: i } = e;
	if (O(n) && O(r) && O(i)) return {
		extracted: t * (i - n),
		recovered: t * (r - n),
		outside: t * (i - r)
	};
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/property.js
var ct = {
	attribute: !0,
	type: String,
	converter: y,
	reflect: !1,
	hasChanged: te
}, lt = (e = ct, t, n) => {
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
function ut(e) {
	return (t, n) => typeof n == "object" ? lt(e, t, n) : ((e, t, n) => {
		let r = t.hasOwnProperty(n);
		return t.constructor.createProperty(n, e), r ? Object.getOwnPropertyDescriptor(t, n) : void 0;
	})(e, t, n);
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/state.js
function dt(e) {
	return ut({
		...e,
		state: !0,
		attribute: !1
	});
}
//#endregion
//#region src/lib/config.ts
var ft = [
	"outdoor",
	"supply",
	"extract",
	"exhaust"
], pt = (e) => ({
	outdoor: e("outdoor"),
	supply: e("supply"),
	extract: e("extract"),
	exhaust: e("exhaust")
}), mt = /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/;
function k(e, t) {
	let n = e;
	for (let e of t.split(".")) {
		if (typeof n != "object" || !n || !Object.hasOwn(n, e)) return;
		n = n[e];
	}
	return n;
}
function ht(e) {
	if (typeof e != "string") return;
	let t = e.trim();
	return mt.test(t) ? t : void 0;
}
function A(e, t) {
	return ht(k(e, t));
}
function gt(e, t) {
	return A(e, t) !== void 0;
}
function _t(e, t) {
	let n = A(e, `${t}.absolute_humidity`);
	if (n !== void 0) return { absolute: n };
	let r = A(e, `${t}.humidity`), i = A(e, `${t}.temperature`);
	return r !== void 0 && i !== void 0 ? {
		relative: r,
		temperature: i
	} : void 0;
}
var vt = (e, t) => _t(e, t) !== void 0;
function yt(e, t) {
	return t.every((t) => vt(e, t));
}
function bt(e, t, n) {
	let r = (t) => gt(e, `${t}.absolute_humidity`) || gt(e, `${t}.humidity`);
	return n === "all_or_none" && !t.some(r) ? [] : t.flatMap((t) => r(t) ? vt(e, t) ? [] : [`${t}.temperature`] : [`${t}.humidity`]);
}
function xt(e, t) {
	let n = t.paths.filter((t) => !gt(e, t)), { humidity: r } = t;
	return r && n.push(...bt(e, r.streams, r.rule)), [...new Set(n)];
}
//#endregion
//#region src/lib/define.ts
function St(e, t) {
	let n = customElements.get(e);
	n === void 0 ? customElements.define(e, t) : n !== t && console.warn(`${e} is already defined by another copy of the module; that copy stays in use.`);
}
var Ct = {
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
	"status.heating_saving": "saved heating power",
	"status.cooling_saving": "saved cooling power",
	"status.moisture_recovery": "moisture recovery rate",
	"pre_heater.power": "pre-heater",
	"pre_heater.energy": "pre-heater energy",
	"seasons.heating": "heating season",
	"seasons.cooling": "cooling season"
}, wt = (e) => `Missing required entities: ${e.map((e) => Ct[e]).join(", ")}`, j = {
	invalid: (e, t) => `Invalid option ${e}: expected ${t}`,
	number: (e, t) => `a number from ${e} to ${t}`,
	color: "a CSS colour such as #db4437 or rgb(219, 68, 55)",
	boolean: "true or false",
	object: "a group of options",
	choice: (e) => `one of ${e.join(", ")}`
}, Tt = "Sample values", Et = {
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
}, Dt = {
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
		energy: "Energy",
		max_power: "Maximum power (W)",
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
}, Ot = "g/h", M = {
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
	scale: (e) => `Scale ±${e} W`
}, N = {
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
}, P = {
	prefixes: { rmot: "RMOT " },
	notPlanned: "—",
	seasons: {
		heating: "Heating season",
		cooling: "Cooling season",
		between: "Between seasons"
	},
	saving: (e) => `${e} W`,
	moisture: (e) => `${e} ${Ot}`,
	moistureUnit: Ot,
	powerUnit: "W",
	moistureRecoveredIcon: "mdi:water-sync",
	moistureKeptOutIcon: "mdi:water-remove",
	moistureRecovered: (e) => `Moisture recovered: ${e}`,
	moistureKeptOut: (e) => `Moisture kept out: ${e}`,
	moistureNoValue: "Moisture recovery: n/a",
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
}, kt = /* @__PURE__ */ new Set(["unknown", "unavailable"]), At = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
function jt(e) {
	return e === void 0 || kt.has(e.state);
}
function Mt(e) {
	if (!At.test(e)) return;
	let t = Number(e);
	return Number.isFinite(t) ? t + 0 : void 0;
}
function Nt(e) {
	return e === void 0 ? void 0 : Mt(e.state);
}
//#endregion
//#region src/editor/schema.ts
function Pt(e) {
	return "type" in e;
}
function Ft(e) {
	let { advanced: t, ...n } = e;
	return n;
}
function It(e) {
	return e.flatMap((e) => Pt(e) ? e.schema.map((t) => ({
		field: t,
		path: e.flatten ? t.name : `${e.name}.${t.name}`
	})) : [{
		field: e,
		path: e.name
	}]);
}
function Lt(e, t) {
	let n = (e) => t || e.advanced !== !0;
	return e.flatMap((e) => {
		if (!Pt(e)) return n(e) ? [Ft(e)] : [];
		let t = e.schema.filter(n).map(Ft);
		return t.length > 0 ? [{
			...e,
			schema: t
		}] : [];
	});
}
function Rt(e, t) {
	if (e == null || e === "") return !1;
	if (t.default === void 0) return !0;
	if (typeof t.default == "number") {
		let n = typeof e == "number" ? e : typeof e == "string" ? Mt(e) : void 0;
		if (n !== void 0) return n !== t.default;
	}
	return zt(e) !== zt(t.default);
}
function zt(e) {
	return (typeof e == "string" || typeof e == "number" || typeof e == "boolean" ? String(e) : JSON.stringify(e)).toLowerCase();
}
function Bt(e, t) {
	return It(e).some(({ field: e, path: n }) => e.advanced === !0 && Rt(k(t, n), e));
}
function Vt(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Ht(e, t, n, r, i = "") {
	let [a, ...o] = t.split("."), s = e, { [a]: c, ...l } = s;
	if (o.length === 0) return n === void 0 ? l : {
		...l,
		[a]: n
	};
	let u = Ht(Vt(c) ? c : {}, o.join("."), n, r, `${i}${a}.`), d = r !== void 0 && k(r, `${i}${a}`) !== void 0;
	return n === void 0 && Object.keys(u).length === 0 && !d ? l : {
		...s,
		[a]: u
	};
}
function Ut(e, t, n = /* @__PURE__ */ new Set()) {
	return It(e).reduce((e, { field: r, path: i }) => r.default !== void 0 && k(t, i) === void 0 && !n.has(i) ? Ht(e, i, r.default) : e, t);
}
function Wt(e, t, n) {
	return It(e).map(({ path: e }) => e).filter((e) => k(t, e) !== void 0 && k(n, e) === void 0);
}
function Gt(e) {
	if (!Vt(e)) return e;
	let t = Object.entries(e).filter(([, e]) => e !== void 0).map(([e, t]) => [e, Gt(t)]);
	return t.length !== Object.keys(e).length || t.some(([t, n]) => n !== e[t]) ? Object.fromEntries(t) : e;
}
function Kt(e, t, n) {
	return It(e).reduce((e, { field: n, path: r }) => n.default !== void 0 && k(t, r) === void 0 && k(e, r) !== void 0 && !Rt(k(e, r), n) ? Ht(e, r, void 0, t) : e, n);
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/decorate.js
function F(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
//#endregion
//#region src/editor/hrv-card-editor.ts
var qt = "hrv-card-editor", Jt = [{
	name: "advanced",
	selector: { boolean: {} }
}], Yt = () => Dt.advanced, Xt = Dt.sections, Zt = Dt.fields;
function Qt(e) {
	return Pt(e) ? e.title ?? Xt[e.name] ?? e.name : Zt[e.name] ?? e.name;
}
var $t = class extends ze {
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
			let t = Gt(e.detail.value), n = Wt(this.schema, this._shown, t);
			this._emptied = new Set([...this._emptied, ...n].filter((e) => k(t, e) === void 0));
			let r = this._config ? Kt(this.schema, this._config, t) : t;
			this._config = r, this.dispatchEvent(new CustomEvent("config-changed", {
				detail: { config: r },
				bubbles: !0,
				composed: !0
			}));
		}, this._formDefined || customElements.whenDefined("ha-form").then(() => {
			this._formDefined = !0;
		});
	}
	get _locked() {
		return this._config !== void 0 && Bt(this.schema, this._config);
	}
	setConfig(e) {
		this._emptied.size > 0 && JSON.stringify(e) !== JSON.stringify(this._config) && (this._emptied = /* @__PURE__ */ new Set()), this._config = e, this._locked && !this._switch.advanced && (this._switch = { advanced: !0 });
	}
	willUpdate(e) {
		e.has("schema") && this._locked && !this._switch.advanced && (this._switch = { advanced: !0 }), (e.has("schema") || e.has("_switch")) && (this._formSchema = Lt(this.schema, this._switch.advanced)), this._config && (e.has("schema") || e.has("_config") || e.has("_switch")) && (this._shown = Ut(this._formSchema, this._config, this._emptied));
	}
	render() {
		return this._config ? this._formDefined ? C`
      <ha-form
        class="switch"
        .hass=${this.hass}
        .data=${this._switch}
        .schema=${Jt}
        .computeLabel=${Yt}
        @value-changed=${this._toggleAdvanced}
      ></ha-form>
      <ha-form
        .hass=${this.hass}
        .data=${this._shown}
        .schema=${this._formSchema}
        .computeLabel=${Qt}
        @value-changed=${this._configChanged}
      ></ha-form>
    ` : C`<p class="hint">${Dt.noForm}</p>` : E;
	}
};
F([ut({ attribute: !1 })], $t.prototype, "hass", void 0), F([ut({ attribute: !1 })], $t.prototype, "schema", void 0), F([dt()], $t.prototype, "_config", void 0), F([dt()], $t.prototype, "_switch", void 0), F([dt()], $t.prototype, "_formDefined", void 0), St(qt, $t);
//#endregion
//#region src/lib/options.ts
var en = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, tn = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|var)\((.*)\)$/i, nn = /^[#a-zA-Z0-9(),.%\s/+-]+$/, rn = /* @__PURE__ */ new Set(/* @__PURE__ */ "aliceblue.antiquewhite.aqua.aquamarine.azure.beige.bisque.black.blanchedalmond.blue.blueviolet.brown.burlywood.cadetblue.chartreuse.chocolate.coral.cornflowerblue.cornsilk.crimson.cyan.darkblue.darkcyan.darkgoldenrod.darkgray.darkgreen.darkgrey.darkkhaki.darkmagenta.darkolivegreen.darkorange.darkorchid.darkred.darksalmon.darkseagreen.darkslateblue.darkslategray.darkslategrey.darkturquoise.darkviolet.deeppink.deepskyblue.dimgray.dimgrey.dodgerblue.firebrick.floralwhite.forestgreen.fuchsia.gainsboro.ghostwhite.gold.goldenrod.gray.green.greenyellow.grey.honeydew.hotpink.indianred.indigo.ivory.khaki.lavender.lavenderblush.lawngreen.lemonchiffon.lightblue.lightcoral.lightcyan.lightgoldenrodyellow.lightgray.lightgreen.lightgrey.lightpink.lightsalmon.lightseagreen.lightskyblue.lightslategray.lightslategrey.lightsteelblue.lightyellow.lime.limegreen.linen.magenta.maroon.mediumaquamarine.mediumblue.mediumorchid.mediumpurple.mediumseagreen.mediumslateblue.mediumspringgreen.mediumturquoise.mediumvioletred.midnightblue.mintcream.mistyrose.moccasin.navajowhite.navy.oldlace.olive.olivedrab.orange.orangered.orchid.palegoldenrod.palegreen.paleturquoise.palevioletred.papayawhip.peachpuff.peru.pink.plum.powderblue.purple.rebeccapurple.red.rosybrown.royalblue.saddlebrown.salmon.sandybrown.seagreen.seashell.sienna.silver.skyblue.slateblue.slategray.slategrey.snow.springgreen.steelblue.tan.teal.thistle.tomato.turquoise.violet.wheat.white.whitesmoke.yellow.yellowgreen.transparent.currentcolor".split("."));
function an(e) {
	let t = 0;
	for (let n = 0; n < e.length; n++) if (e[n] === "(" && t++, e[n] === ")" && (t--, t < 0 || t === 0 && n !== e.length - 1)) return !1;
	return t === 0;
}
function on(e) {
	let t = e.trim();
	if (t.length === 0 || t.length > 100 || !nn.test(t)) return !1;
	if (en.test(t) || rn.has(t.toLowerCase())) return !0;
	let n = tn.exec(t);
	if (n === null || !an(t)) return !1;
	if (n[1]?.toLowerCase() !== "var") return !0;
	let [r, ...i] = (n[2] ?? "").split(",");
	return /^\s*--[a-zA-Z0-9-]+\s*$/.test(r ?? "") && (i.length === 0 || on(i.join(",")));
}
var sn = (e) => e == null;
function cn(e) {
	switch (e.kind) {
		case "number": return j.number(String(e.min), String(e.max));
		case "color": return j.color;
		case "boolean": return j.boolean;
		case "choice": return j.choice(e.choices);
	}
}
function ln(e, t) {
	switch (e.kind) {
		case "number": return typeof t == "number" && Number.isFinite(t) && t >= e.min && t <= e.max;
		case "color": return typeof t == "string" && on(t);
		case "boolean": return typeof t == "boolean";
		case "choice": return typeof t == "string" && e.choices.includes(t);
	}
}
function un(e, t) {
	let n = t.split(".").slice(0, -1);
	for (let t = 1; t <= n.length; t++) {
		let r = n.slice(0, t).join("."), i = k(e, r);
		if (!sn(i) && (typeof i != "object" || Array.isArray(i))) return r;
	}
}
function dn(e, t) {
	let n = t.flatMap((t) => {
		let n = un(e, t.path);
		if (n !== void 0) return [j.invalid(n, j.object)];
		let r = k(e, t.path);
		return sn(r) || ln(t, r) ? [] : [j.invalid(t.path, cn(t))];
	});
	return [...new Set(n)];
}
function I(e, t) {
	let n = k(e, t.path);
	return sn(n) || !ln(t, n) ? t.default : n;
}
//#endregion
//#region src/lib/units.ts
var fn = { scale: 1 }, pn = {
	temperature: /* @__PURE__ */ new Map([["°c", fn], ["°f", {
		scale: 5 / 9,
		offset: -32
	}]]),
	flow: /* @__PURE__ */ new Map([
		["m3/h", fn],
		["l/s", { scale: 3.6 }],
		["ft3/min", { scale: 1.69901079552 }]
	]),
	absolute_humidity: /* @__PURE__ */ new Map([["g/m3", fn]]),
	relative_humidity: /* @__PURE__ */ new Map([["%", fn]]),
	percentage: /* @__PURE__ */ new Map([["%", fn]]),
	power: /* @__PURE__ */ new Map([["w", fn], ["kw", { scale: 1e3 }]])
};
function mn(e) {
	return e.trim().replaceAll("º", "°").normalize("NFKC").toLowerCase();
}
function L(e, t) {
	let n = Nt(e);
	return n === void 0 ? void 0 : hn(t, n, e?.attributes.unit_of_measurement);
}
function hn(e, t, n) {
	if (!Number.isFinite(t) || n === void 0) return;
	let r = pn[e].get(mn(n));
	return r ? (t + (r.offset ?? 0)) * r.scale : void 0;
}
//#endregion
//#region src/calc/humidity.ts
var gn = -100, _n = 100;
function vn(e, t) {
	if (!(!Number.isFinite(e) || e < gn || e > _n) && !(!Number.isFinite(t) || t < 0 || t > 100)) return 6.112 * Math.exp(17.67 * e / (e + 243.5)) * t * 2.1674 / (273.15 + e);
}
//#endregion
//#region src/calc/smoothing.ts
var yn = 6e4, bn = 1440, xn = 5 * yn;
function Sn(e) {
	let t = e.map((e) => Date.parse(e?.last_updated ?? "")).filter(Number.isFinite);
	return t.length > 0 ? Math.max(...t) : void 0;
}
function Cn(e, t, n) {
	let r = t - n, i = 0, a = 0;
	for (let n = 0; n < e.length; n++) {
		let o = e[n];
		if (o === void 0 || o.time > t) break;
		let s = e[n + 1], c = n === 0 ? r : Math.max(o.time, r), l = s === void 0 || s.time > t ? t : s.time;
		l <= c || o.value === void 0 || (i += o.value * (l - c), a += l - c);
	}
	return a > 0 ? i / a : void 0;
}
function wn(e, t, n) {
	let r = e.at(-1);
	if (r !== void 0) return !(t > 0) || e.length === 1 ? r.value : Cn(e, Math.max(n ?? r.time, r.time), t * yn);
}
function Tn(e, t) {
	let n = e.length;
	for (; n > 0 && (e[n - 1]?.time ?? -Infinity) > t.time;) n--;
	e[n - 1]?.time === t.time ? e[n - 1] = t : e.splice(n, 0, t);
}
var En = class {
	constructor() {
		this.series = /* @__PURE__ */ new Map(), this.listeners = /* @__PURE__ */ new Set();
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	smoothed(e, t, n, r) {
		let i = Number.isFinite(n) ? Math.min(Math.max(0, n), bn) : 0, a = i * yn, o = this.series.get(t.key);
		o === void 0 && (o = {
			samples: [],
			windowMs: a,
			history: { state: "none" }
		}, this.series.set(t.key, o)), o.windowMs = Math.max(o.windowMs, a);
		let s = this.add(o, e, t);
		if (a > 0 && this.needsHistory(o) && this.loadHistory(o, e, t), s !== void 0) return o.history.state === "loading" && o.history.first ? s : wn(o.samples, i, r);
	}
	needsHistory(e) {
		let { history: t, samples: n, windowMs: r } = e;
		switch (t.state) {
			case "none": return !0;
			case "loading": return !1;
			case "loaded": return r > t.windowMs;
			case "failed": {
				let [e, i] = [n[0], n.at(-1)];
				return !(e !== void 0 && i !== void 0 && e.time <= i.time - r) && Date.now() - t.at >= xn;
			}
		}
	}
	add(e, t, n) {
		let r = n.entityIds.map((e) => t.states[e]), i = Sn(r);
		if (i === void 0) return;
		let a = n.value(r);
		return Tn(e.samples, {
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
			a = Dn(await t.callWS({
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
			for (let t of a) Tn(e.samples, t);
			this.prune(e), this.listeners.forEach((e) => {
				e();
			});
		}
	}
};
function Dn(e, t, n) {
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
	}, Tn(o, {
		time: e.time,
		value: n.value(a)
	});
	return o;
}
var On = new En(), R = {
	smoothing: {
		kind: "number",
		path: "smoothing",
		min: 0,
		max: bn,
		default: 10
	},
	airDensity: {
		kind: "number",
		path: "air_density",
		min: .5,
		max: 1.5,
		default: Ke
	}
}, kn = [
	"outdoor",
	"supply",
	"extract"
];
function An(e, t) {
	let n = _t(e, t);
	if (n !== void 0) return "absolute" in n ? {
		key: n.absolute,
		entityIds: [n.absolute],
		value: ([e]) => L(e, "absolute_humidity")
	} : {
		key: `derived:${n.relative}|${n.temperature}`,
		entityIds: [n.relative, n.temperature],
		value: ([e, t]) => {
			let [n, r] = [L(e, "relative_humidity"), L(t, "temperature")];
			return n === void 0 || r === void 0 ? void 0 : vn(r, n);
		}
	};
}
function jn(e, t = On) {
	let n = I(e, R.smoothing), r = I(e, R.airDensity), i = kn.map((t) => A(e, `${t}.temperature`)), a = kn.map((t) => An(e, t)), o = a.every((e) => e !== void 0) ? a : void 0, s = A(e, "fans.supply_flow"), c = A(e, "bypass.position"), l = [
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
		let a = (t, n) => t === void 0 ? void 0 : L(e.states[t], n), d = Sn(l.map((t) => e.states[t])), f = {
			temperature: u(i.map((e) => a(e, "temperature"))),
			supplyFlow: a(s, "flow"),
			bypass: c === void 0 ? 0 : a(c, "percentage"),
			airDensity: r
		};
		o !== void 0 && (f.absoluteHumidity = u(o.map((r) => t.smoothed(e, r, n, d))));
		let p = ot(f);
		return p === void 0 ? { inputs: f } : {
			inputs: f,
			result: p
		};
	};
}
//#endregion
//#region src/lib/bar.ts
var Mn = 250, Nn = (e) => Math.round(e * 1e6) / 1e6, Pn = (e) => Number.isFinite(e) ? e : 0;
function Fn(e, t) {
	let n = Nn(e.reduce((e, t) => e + Math.abs(Pn(t)), 0));
	return Math.max(Pn(t), Math.ceil(n / Mn) * Mn);
}
function In(e, t) {
	let n = (e) => t > 0 ? Math.min(e, t) / t * 50 : 0, r = 0, i = 0;
	return e.map((e) => {
		let t = Pn(e);
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
var Ln = "#00897b", Rn = "−";
function zn(e) {
	let t = e?.locale;
	return typeof t == "object" && t ? t : e?.language === void 0 ? {} : { language: e.language };
}
function Bn(e) {
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
var Vn = /* @__PURE__ */ new Map();
function Hn(e, t) {
	let n = Bn(e), r = e.number_format !== "none", i = `${n?.join(",") ?? ""}|${String(t)}|${String(r)}`, a = Vn.get(i);
	return a === void 0 && (a = new Intl.NumberFormat(n, {
		minimumFractionDigits: t,
		maximumFractionDigits: t,
		useGrouping: r
	}), Vn.set(i, a)), a;
}
function z(e, t, n = 0) {
	if (!Number.isFinite(e)) return "n/a";
	let r = Number.isFinite(n) ? Math.min(20, Math.max(0, Math.trunc(n))) : 0, i = Math.abs(e) < .5 / 10 ** r ? 0 : e;
	return Hn(t ?? {}, r).formatToParts(i).map((e) => e.type === "minusSign" ? Rn : e.value).join("");
}
//#endregion
//#region src/cards/bar.ts
var Un = (e) => `repeating-linear-gradient(135deg, ${e} 0 3px, transparent 3px 6px)`, Wn = o`
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
function Gn({ left: e, width: t }) {
	if (!(t <= 0)) return {
		left: `${String(-e / t * 100)}%`,
		width: `${String(100 / t * 100)}%`
	};
}
function Kn(e) {
	return C`<div class="bar ${e.length > 1 ? "lanes" : ""}">
    ${e.map((e, t) => C`${t > 0 ? C`<div class="divider"></div>` : E}
          <div class="lane">
            ${e.map((e) => {
		let t = Gn(e);
		return C`<div
                class="seg"
                style=${D({
			left: `${String(e.left)}%`,
			width: `${String(e.width)}%`
		})}
              >
                ${t ? C`<div class="fill" style=${D({
			...t,
			background: e.background
		})}></div>` : E}
              </div>`;
	})}
          </div>`)}
    <div class="zero"></div>
  </div>`;
}
function qn(e) {
	return C`<span class="swatch" style=${D({ background: e })}></span>`;
}
//#endregion
//#region src/cards/moisture-view.ts
var Jn = {
	paths: ["fans.supply_flow"],
	humidity: {
		streams: [
			"outdoor",
			"supply",
			"extract"
		],
		rule: "required"
	}
}, B = {
	...R,
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
		default: Ln
	},
	gainingColor: {
		kind: "color",
		path: "gaining_color",
		default: "#8e24aa"
	}
}, Yn = Object.values(B), Xn = "#fdd835", Zn = (e) => e.extracted < 0, Qn = (e, t) => Math.abs(e.indoor - e.outdoor) < t, $n = (e) => e === void 0 ? 0 : Math.round(Math.min(Math.max(e, 0), 100));
function er(e) {
	let t = Zn(e), n = t ? -1 : 1, r = (e) => Math.round(e * n);
	return {
		gaining: t,
		extracted: r(e.extracted),
		recovered: r(e.recovered),
		outside: r(e.outside)
	};
}
var tr = (e, t) => ({
	gaining: e.gaining,
	extracted: z(e.extracted, t),
	recovered: z(e.recovered, t),
	outside: z(e.outside, t)
});
function nr(e, t, n, r) {
	if (t) return {
		subtitle: N.subtitles.neutral,
		header: N.neutral
	};
	let i = N.header(tr(e, r));
	if (e.extracted > 0) {
		let t = z(e.recovered / e.extracted * 100, r);
		i += N.percent(t, n > 0 ? z(n, r) : void 0);
	}
	return {
		subtitle: e.gaining ? N.subtitles.gaining : N.subtitles.drying,
		header: i
	};
}
function rr(e, t, n, r, i) {
	if (e === void 0 || t === void 0) return {
		title: N.title,
		header: "n/a",
		segments: [],
		swatches: void 0,
		lines: []
	};
	let a = Zn(e), o = Qn(t, r.neutralThreshold), s = a ? r.gainingColor : r.dryingColor, c = $n(n), l = [e.recovered, e.outside], u = Fn(l, r.minScale), d = [s, Un(s)], f = In(l, u).map((e, t) => ({
		...e,
		background: d[t] ?? s
	})), p = er(e), { subtitle: m, header: h } = nr(p, o, c, i), g = (e) => z(e, i, 1), _ = {
		title: N.title,
		subtitle: m,
		header: h,
		segments: f,
		swatches: {
			recovered: N.swatchRecovered(a),
			outside: N.swatchOutside(a),
			color: s
		},
		lines: [
			N.flow(tr(p, i)),
			N.humidities(g(t.indoor), g(t.outdoor)),
			N.scale(z(u, i))
		]
	};
	return o || (_.headerColor = s), c > 0 && (_.bypass = {
		position: c,
		text: N.bypass(z(c, i))
	}), _;
}
//#endregion
//#region src/editor/fields.ts
var ir = { entity: { domain: "sensor" } }, V = (e, { advanced: t = !1, required: n = !1 } = {}) => ({
	name: e,
	selector: ir,
	...t ? { advanced: t } : {},
	...n ? { required: n } : {}
}), ar = (e) => ({
	name: e,
	selector: { entity: { domain: "binary_sensor" } }
}), or = (e) => ({
	name: e,
	selector: { entity: { domain: [
		"sensor",
		"binary_sensor",
		"switch"
	] } }
}), H = (e, { requiredTemperature: t, advancedAbsolute: n = !0 }) => ({
	type: "expandable",
	name: e,
	schema: [
		V("temperature", { required: t }),
		V("humidity"),
		V("absolute_humidity", { advanced: n })
	]
}), U = (e, t, n, r) => ({
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
}), sr = (e, t, { advanced: n = !1 } = {}) => ({
	name: e,
	default: t.default,
	selector: { boolean: {} },
	...n ? { advanced: n } : {}
}), cr = (e, t, n, { advanced: r = !0 } = {}) => ({
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
}), lr = {
	type: "expandable",
	name: "fans",
	schema: [V("supply_flow", { required: !0 })]
}, ur = {
	type: "expandable",
	name: "bypass",
	schema: [V("position")]
}, dr = {
	type: "expandable",
	name: "calculation",
	flatten: !0,
	schema: [U("smoothing", R.smoothing, 1, "min"), U("air_density", R.airDensity, .01, "kg/m³")]
}, fr = [
	H("outdoor", { requiredTemperature: !1 }),
	H("supply", { requiredTemperature: !1 }),
	H("extract", { requiredTemperature: !1 }),
	lr,
	ur,
	dr,
	U("neutral_threshold", B.neutralThreshold, .1, "g/m³"),
	U("min_scale", B.minScale, 50, "g/h"),
	{
		type: "expandable",
		name: "colors",
		flatten: !0,
		schema: [W("drying_color", B.dryingColor.default), W("gaining_color", B.gainingColor.default)]
	}
];
//#endregion
//#region src/lib/render.ts
function pr(e) {
	let t = /* @__PURE__ */ new Set(), n = (e) => {
		for (let r of Object.values(e)) if (typeof r == "object" && r && !Array.isArray(r)) n(r);
		else {
			let e = ht(r);
			e !== void 0 && t.add(e);
		}
	};
	return n(e), [...t];
}
function mr(e, t) {
	return e === t || Array.isArray(e) && Array.isArray(t) && e.length === t.length && e.every((e, n) => e === t[n]);
}
function hr(e, t) {
	if (e === t) return !0;
	if (typeof e != "object" || typeof t != "object" || e === null || t === null) return !1;
	let n = Object.keys(e), r = Object.keys(t);
	return n.length === r.length && n.every((n) => Object.hasOwn(t, n) && mr(e[n], t[n]));
}
function gr(e, t, n) {
	return e === void 0 || e.locale !== t.locale || e.language !== t.language || e.localize !== t.localize || e.formatEntityState !== t.formatEntityState || e.themes?.darkMode !== t.themes?.darkMode || n.some((n) => e.states[n] !== t.states[n] || !hr(e.entities?.[n], t.entities?.[n]));
}
function _r(e, t, n, r) {
	return e.size === 1 && e.has("hass") ? t !== void 0 && gr(n, t, r) : !0;
}
//#endregion
//#region src/lib/sample.ts
var G = (e) => `hrv_sample.${e.replace(".", "_")}`, vr = {
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
		moisture_recovery: G("status.moisture_recovery")
	},
	pre_heater: {
		power: G("pre_heater.power"),
		energy: G("pre_heater.energy")
	},
	seasons: {
		heating: G("seasons.heating"),
		cooling: G("seasons.cooling")
	}
}, yr = (e) => typeof e == "object" && !!e && !Array.isArray(e), br = (e) => e == null || typeof e == "string" && e.trim() === "", xr = (e, t) => ({
	...e,
	...Object.fromEntries(Object.entries(t).flatMap(([t, n]) => {
		let r = e[t];
		return br(n) || yr(r) && !yr(n) ? [] : [[t, yr(n) && yr(r) ? xr(r, n) : n]];
	}))
}), Sr = (e) => Object.keys(Ct).some((t) => !br(k(e, t))), Cr = (e) => xr(vr, e), wr = [
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
		"pre_heater.power",
		"0",
		"W"
	],
	[
		"pre_heater.energy",
		"8",
		"kWh"
	],
	["seasons.heating", "on"],
	["seasons.cooling", "off"]
], Tr = "2026-01-01T12:00:00Z", Er = Object.fromEntries(wr.map(([e, t, n]) => [G(e), {
	entity_id: G(e),
	state: t,
	last_updated: Tr,
	attributes: n === void 0 ? {} : { unit_of_measurement: n }
}]));
//#endregion
//#region src/cards/base-card.ts
function Dr(e, t, n) {
	let r = xt(e, t);
	if (r.length > 0) throw Error(wt(r));
	let i = dn(e, n);
	if (i.length > 0) throw Error(i.join("; "));
}
var Or = o`
  .sample-note {
    margin-top: 4px;
    text-align: right;
    font-size: 12px;
    color: var(--secondary-text-color);
  }
`, kr = class extends ze {
	constructor(...e) {
		super(...e), this.sample = !1, this.entityIds = [];
	}
	static getStubConfig() {
		return {};
	}
	setConfig(e) {
		let t = !Sr(e), n = t ? Cr(e) : e;
		this.check(n);
		let r = t ? {
			...n,
			smoothing: 0
		} : e;
		this.configure(r), this.calculator = jn(r), this.entityIds = pr(r), this.sample = t, this.shown = void 0, this.config = r;
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
					...Er
				}
			}
		}), this.shown.hass);
	}
	sampleNote() {
		return this.sample ? C`<div class="sample-note">${Tt}</div>` : E;
	}
	connectedCallback() {
		super.connectedCallback(), this.unsubscribe = On.subscribe(() => {
			this.requestUpdate();
		});
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.unsubscribe?.(), this.unsubscribe = void 0;
	}
	shouldUpdate(e) {
		return _r(e, this.hass, this.rendered, this.entityIds);
	}
	updated() {
		this.rendered = this.hass;
	}
};
F([ut({ attribute: !1 })], kr.prototype, "hass", void 0), F([dt()], kr.prototype, "config", void 0);
//#endregion
//#region src/cards/bar-card.ts
var Ar = class extends kr {
	static {
		this.styles = [Wn, Or];
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
}, jr = "hrv-moisture-balance-card";
function Mr(e) {
	Dr(e, Jn, Yn);
}
St(jr, class extends Ar {
	static {
		this.styles = [Ar.styles, o`
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
		let e = document.createElement(qt);
		return e.schema = fr, e;
	}
	contentSize() {
		return 5;
	}
	check(e) {
		Mr(e);
	}
	configure(e) {
		this.settings = {
			dryingColor: I(e, B.dryingColor),
			gainingColor: I(e, B.gainingColor),
			neutralThreshold: I(e, B.neutralThreshold),
			minScale: I(e, B.minScale)
		};
	}
	render() {
		let e = this.shownHass;
		if (!this.config || !e || !this.calculator || !this.settings) return E;
		let { inputs: t } = this.calculator(e), n = t.absoluteHumidity, r = t.bypass === void 0 ? void 0 : st(n, t.supplyFlow), i = rr(r, r && n?.extract !== void 0 && n.outdoor !== void 0 ? {
			indoor: n.extract,
			outdoor: n.outdoor
		} : void 0, t.bypass, this.settings, zn(e));
		return C`<ha-card>
      <div class="head">
        <span class="title-block">
          <span class="title">${i.title}</span>
          ${i.subtitle ? C`<span class="subtitle">${i.subtitle}</span>` : E}
        </span>
        <span class="net" style=${D({ color: i.headerColor ?? "var(--secondary-text-color)" })}
          >${i.header}</span
        >
      </div>
      ${Kn([i.segments])}
      ${i.bypass ? C`<div class="bypass">
              <div class="bypass-strip">
                <div
                  class="bypass-fill"
                  style=${D({
			width: `${String(i.bypass.position)}%`,
			background: Xn
		})}
                ></div>
              </div>
              <span>${i.bypass.text}</span>
            </div>` : E}
      <div class="legend">
        ${i.swatches ? C`<span class="swatches">
                <span class="item">${qn(i.swatches.color)}${i.swatches.recovered}</span>
                <span class="item">${qn(Un(i.swatches.color))}${i.swatches.outside}</span>
              </span>` : E}
        ${i.lines.map((e) => C`<span>${e}</span>`)}
      </div>
      ${this.sampleNote()}
    </ha-card>`;
	}
});
//#endregion
//#region src/cards/recovery-view.ts
var Nr = {
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
}, Pr = (e, t) => ({
	kind: "color",
	path: e,
	default: t
}), K = {
	...R,
	minScale: {
		kind: "number",
		path: "min_scale",
		min: 50,
		max: 1e5,
		default: 500
	},
	heatingColor: Pr("heating.color", "#db4437"),
	heatingLatent: Pr("heating.color_latent", "#f4a09a"),
	coolingColor: Pr("cooling.color", "#039be5"),
	coolingLatent: Pr("cooling.color_latent", "#8fd3f7")
}, Fr = Object.values(K);
function Ir(e, t, n) {
	if (e === void 0) return {
		title: M.titleNoValue,
		header: "n/a",
		lanes: [],
		legend: []
	};
	let { color: r, latent: i } = t.colors[e.mode], a = (e) => z(e, n), { recovered: o, potential: s, parts: c } = et(e), { recovered: l, lost: u } = c, d = (e, t, n) => ({
		values: [e, t],
		backgrounds: [n, Un(n)]
	}), f = [d(l.sensible, u.sensible, r)];
	e.latentKnown && f.push(d(l.latent, u.latent, i));
	let p = Math.max(...f.map(({ values: e }) => Fn(e, t.minScale))), m = f.map(({ values: e, backgrounds: t }) => In(e, p).map((e, n) => ({
		...e,
		background: t[n] ?? r
	}))), [h, g] = e.freeCooling ? [M.headerFreeCooling, M.headerFreeCoolingNoPotential] : [M.header, M.headerNoPotential], _ = s > 0 ? h(a(o), a(s), z(o / s * 100, n)) : g(a(o)), [ee, v] = e.freeCooling ? [M.cooling, M.missed] : [M.recovered, M.lost], y = [{
		kind: "part",
		color: r,
		label: M.laneSensible,
		recovered: ee(a(l.sensible)),
		lost: v(a(u.sensible))
	}];
	return e.latentKnown && y.push({
		kind: "part",
		color: i,
		label: M.laneLatent,
		recovered: ee(a(l.latent)),
		lost: v(a(u.latent))
	}), y.push({
		kind: "text",
		text: M.scale(a(p))
	}), {
		title: M.titles[$e(e)],
		header: _,
		headerColor: r,
		lanes: m,
		legend: y
	};
}
//#endregion
//#region src/editor/recovery-schema.ts
var Lr = [
	H("outdoor", { requiredTemperature: !0 }),
	H("supply", { requiredTemperature: !0 }),
	H("extract", { requiredTemperature: !0 }),
	lr,
	ur,
	dr,
	U("min_scale", K.minScale, 50, "W"),
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
], Rr = "hrv-recovery-balance-card";
function zr(e) {
	Dr(e, Nr, Fr);
}
St(Rr, class extends Ar {
	constructor(...e) {
		super(...e), this.minScale = K.minScale.default;
	}
	static {
		this.styles = [Ar.styles, o`
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
		return 4;
	}
	static getConfigElement() {
		let e = document.createElement(qt);
		return e.schema = Lr, e;
	}
	check(e) {
		zr(e);
	}
	configure(e) {
		this.colors = {
			heating: {
				color: I(e, K.heatingColor),
				latent: I(e, K.heatingLatent)
			},
			cooling: {
				color: I(e, K.coolingColor),
				latent: I(e, K.coolingLatent)
			}
		}, this.minScale = I(e, K.minScale);
	}
	render() {
		let e = this.shownHass;
		if (!this.config || !e || !this.calculator || !this.colors) return E;
		let { result: t } = this.calculator(e), n = Ir(t, {
			colors: this.colors,
			minScale: this.minScale
		}, zn(e)), r = n.legend.filter((e) => e.kind === "part"), i = n.legend.filter((e) => e.kind === "text");
		return C`<ha-card>
      <div class="head">
        <span class="title">${n.title}</span>
        <span class="net" style=${D({ color: n.headerColor ?? "var(--secondary-text-color)" })}
          >${n.header}</span
        >
      </div>
      ${Kn(n.lanes)}
      <div class="legend">
        <div class="parts">
          ${r.map((e) => C`<div class="part">
                <span class="lane-name">${e.label}</span>
                <span class="item">${qn(e.color)}${e.recovered}</span>
                <span class="item">${qn(Un(e.color))}${e.lost}</span>
              </div>`)}
        </div>
        ${i.map((e) => C`<span>${e.text}</span>`)}
      </div>
      ${this.sampleNote()}
    </ha-card>`;
	}
});
//#endregion
//#region node_modules/lit-html/directives/if-defined.js
var q = (e) => e ?? E, Br = {
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
}, Vr = { paths: Br.paths }, Hr = (e) => xt(e, Br).length === 0, Ur = (e) => xt(e, Vr).length === 0, Wr = (e, t) => e === "cooling" ? t.cold : t.warm;
function Gr(e, t, n) {
	if (e === void 0) return t.showUnavailable ? {
		kind: "grey",
		text: "n/a"
	} : void 0;
	let r = P.saving(z(e.saving, n));
	return e.saving <= .5 ? {
		kind: "grey",
		text: r
	} : {
		kind: e.mode === "heating" ? "warm" : "cold",
		text: r,
		tint: Wr(e.mode, t.colors)
	};
}
function Kr(e, t, n) {
	if (e === void 0) return;
	let { heating: r, cooling: i } = t;
	if (r !== void 0 && i !== void 0) {
		let [e, t] = [r, i].map((e) => L(n[e], "power"));
		if (e !== void 0 && t !== void 0 && e !== t) return e > t ? r : i;
	}
	return t[e.mode];
}
function qr(e, t, n) {
	if (t.exchanger !== "erv" || !t.badge) return;
	let r = e?.moisture?.recovered;
	if (r === void 0) return t.showUnavailable ? {
		text: "n/a",
		title: P.moistureNoValue
	} : void 0;
	let i = z(Math.abs(r), n), a = Math.round(r) < 0, o = P.moisture(i);
	return {
		text: i,
		unit: P.moistureUnit,
		icon: a ? P.moistureKeptOutIcon : P.moistureRecoveredIcon,
		title: a ? P.moistureKeptOut(o) : P.moistureRecovered(o)
	};
}
function Jr(e, t, n, r) {
	let i = (e) => e === void 0 ? P.effectivenessNoValue : P.effectivenessPercent(z(e, r)), a = (e, t = !1) => z(t && Math.round(e) !== 0 ? -Math.abs(e) : Math.abs(e), r), o = e?.effectiveness.total, s = e && o !== void 0 ? et(e) : void 0, c = e?.effectiveness.moisture === void 0 ? void 0 : e.moisture, l = e && P.effectivenessKinds[$e(e)], u = t !== void 0 && t > 0;
	return P.effectiveness(P.effectivenessFigure(l, i(o), s && P.effectivenessAbsolute(a(s.recovered, s.recovered < 0), a(s.potential), P.powerUnit)), n ? P.effectivenessFigure(void 0, i(e?.effectiveness.moisture), c && P.effectivenessAbsolute(a(c.recovered, c.recovered * c.extracted < 0), a(c.extracted), P.moistureUnit)) : void 0, u ? t >= 1 ? z(t, r) : z(Math.max(t, .1), r, 1) : void 0);
}
//#endregion
//#region src/diagram/drawing.ts
var Yr = {
	width: 400,
	height: 200
}, Xr = 14, J = {
	x: 86,
	y: 62
}, Y = {
	x: 306,
	y: 138
}, Zr = 34, Qr = J.x + Zr, X = Y.x - Zr, $r = (e) => Yr.width - e, ei = `C ${String(Qr + 51)} ${String(J.y)} ${String(X - 46)} ${String(Y.y)} ${String(X)} ${String(Y.y)}`, ti = `C ${String(Qr + 20)} ${String(J.y)} ${String(Qr + 5)} 192 200 192 C ${String(X - 23)} 192 ${String(X - 18)} ${String(Y.y)} ${String(X)} ${String(Y.y)}`, ni = (e) => `M ${String(J.x)} ${String(J.y)} L ${String(Qr)} ${String(J.y)} ${e} L ${String(Y.x)} ${String(Y.y)}`, ri = {
	supply: ni(ei),
	exhaust: `M ${String($r(J.x))} ${String(J.y)} L ${String($r(Qr))} ${String(J.y)} C ${String($r(Qr + 51))} ${String(J.y)} ${String($r(X - 46))} ${String(Y.y)} ${String($r(X))} ${String(Y.y)} L ${String($r(Y.x))} ${String(Y.y)}`,
	bypass: ni(ti)
}, Z = (e, t) => Math.round(e * 10 ** t) / 10 ** t, ii = {
	supply: "306,124 326,138 306,152",
	exhaust: "94,124 74,138 94,152"
}, ai = "175.8,26 224.2,26 255,100 224.2,174 175.8,174 145,100", oi = "181.3,38 218.7,38 240.7,100 218.7,162 181.3,162 159.3,100", si = {
	d: "M 200 32 L 221.45 32 L 247.85 100 L 221.45 168 L 178.55 168 L 152.15 100 L 178.55 32 Z",
	width: 14
}, ci = {
	d: "M 200 38 L 218.7 38 L 240.7 100 L 218.7 162 L 181.3 162 L 159.3 100 L 181.3 38 Z",
	width: 3
}, li = "M 175.8 26 L 224.2 26 L 255 100 L 224.2 174 L 175.8 174 L 145 100 Z M 181.3 38 L 218.7 38 L 240.7 100 L 218.7 162 L 181.3 162 L 159.3 100 Z", ui = 45, di = {
	from: J.x + 11.600000000000001 / 2,
	to: Qr - 11.600000000000001 / 2
}, fi = 5, pi = 48, mi = 3, hi = mi * 1.5, gi = 1.5;
function _i() {
	return Array.from({ length: 49 }, (e, t) => {
		let n = t / pi, r = Xr / 2 * -Math.cos(fi * Math.PI * n);
		return {
			x: Z(di.from + (di.to - di.from) * n, 2),
			y: Z(J.y + r, 2)
		};
	});
}
var vi = _i().map(({ x: e, y: t }, n) => `${n === 0 ? "M" : "L"} ${String(e)} ${String(t)}`).join(" ");
function yi() {
	let e = _i(), [t, n] = [e.map((e) => e.x), e.map((e) => e.y)], r = 6.75, [i, a] = [Math.min(...t) - r, Math.min(...n) - r];
	return {
		x: i,
		y: a,
		width: Math.max(...t) + r - i,
		height: Math.max(...n) + r - a
	};
}
function bi() {
	let e = yi(), t = (e, t) => `${String(Z(e / t * 100, 2))}%`;
	return {
		left: t(e.x, Yr.width),
		top: t(e.y, Yr.height),
		width: t(e.width, Yr.width),
		height: t(e.height, Yr.height)
	};
}
var xi = 45, Si = "M 6.5 18 A 4.5 4.5 0 0 1 6 9.05 A 6 6 0 0 1 17.5 10 A 4 4 0 0 1 17.5 18 Z", Ci = "M 12 4 L 21 12 L 18 12 L 18 20 L 14 20 L 14 15 L 10 15 L 10 20 L 6 20 L 6 12 L 3 12 Z", wi = 0;
function Ti() {
	wi += 1;
	let e = String(wi);
	return {
		supply: `hrv-supply-${e}`,
		exhaust: `hrv-exhaust-${e}`,
		rim: `hrv-rim-${e}`,
		blur: `hrv-blur-${e}`
	};
}
var Ei = 1.5;
function Di(e, t) {
	let n = t > 0 ? Z(Ei / t, 3) : Ei;
	return {
		[`--${e}-duration`]: `${String(n)}s`,
		[`--${e}-state`]: t > 0 ? "running" : "paused"
	};
}
function Oi(e, t, n) {
	if (n <= 0) return null;
	let r = e === "exhaust" ? "exhaust" : "supply";
	return w`<path class="stream ${e}" d=${ri[e]} stroke=${t} stroke-width=${Xr}
      opacity=${n}></path>
    <path class="flow ${r}-air" d=${ri[e]} opacity=${n}></path>`;
}
var ki = (e, t) => w`<stop offset=${e} style=${D({ "stop-color": t })}></stop>`, Ai = (e, t, n) => w`<g class="symbol">
    <circle cx=${e} cy="100" r="20" style=${D({ fill: t })}></circle>
    <path d=${n} transform="translate(${String(e - 12)} ${"88"})"></path>
  </g>`, ji = (e) => `${String(Z(e ?? 0, 2))} 100`;
function Mi(e, t) {
	return w`<path class="ring moisture" d=${si.d} fill="none" stroke-width=${si.width}
    pathLength="100" stroke-dasharray=${ji(t)} clip-path="url(#${e})"></path>`;
}
function Ni(e, t) {
	let { d: n, width: r } = ci, i = `color-mix(in srgb, ${e} ${String(ui)}%, var(--primary-text-color))`;
	return w`<path class="ring-track total" d=${n} fill="none" stroke-width=${r}
      style=${D({ stroke: `color-mix(in srgb, ${i} 25%, var(--secondary-background-color))` })}></path>
    <path class="ring total" d=${n} fill="none" stroke-width=${r} pathLength="100" stroke-dasharray=${ji(t)}
      style=${D({ stroke: i })}></path>`;
}
var Pi = (e) => 30 + 70 * e;
function Fi({ level: e, color: t }, n) {
	if (e <= 0) return w`<path class="coil off" d=${vi} fill="none" stroke-width=${mi} stroke-linejoin="round"></path>`;
	let r = Pi(e), i = `color-mix(in srgb, ${`color-mix(in srgb, ${t} ${String(Z(r, 1))}%, var(--secondary-text-color))`} ${String(Z(100 - xi * e, 1))}%, white)`, a = String(Z(r / 100, 3));
	return w`<path class="coil-glow" d=${vi} fill="none" stroke-width=${hi} stroke-linejoin="round"
      filter="url(#${n})" opacity=${a}
      style=${D({
		stroke: t,
		"--glow-opacity": a
	})}></path>
    <path class="coil on" d=${vi} fill="none" stroke-width=${mi} stroke-linejoin="round"
      style=${D({ stroke: i })}></path>`;
}
function Ii(e) {
	let { x: t, y: n, width: r, height: i } = yi();
	return w`<filter id=${e} filterUnits="userSpaceOnUse" x=${t} y=${n} width=${r} height=${i}>
    <feGaussianBlur stdDeviation=${gi}></feGaussianBlur>
  </filter>`;
}
function Li({ ids: e, exchanger: t, colors: n, bypass: r, speeds: i, rings: a, coil: o }) {
	let [s, c] = [Z(r, 3), Z(1 - r, 3)], l = `url(#${e.supply})`, u = `url(#${e.exhaust})`;
	return w`<svg
    class="art"
    viewBox="0 0 ${String(Yr.width)} ${String(Yr.height)}"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    style=${D({
		...Di("supply", i.supply),
		...Di("exhaust", i.exhaust)
	})}
  >
    <defs>
      <linearGradient id=${e.supply} gradientUnits="userSpaceOnUse" x1="86" y1="62" x2="326" y2="138">
        ${ki("0", n.outdoor)}${ki("1", n.supply)}
      </linearGradient>
      <linearGradient id=${e.exhaust} gradientUnits="userSpaceOnUse" x1="314" y1="62" x2="74" y2="138">
        ${ki("0", n.extract)}${ki("1", n.exhaust)}
      </linearGradient>
      <clipPath id=${e.rim}><path d=${li} clip-rule="evenodd"></path></clipPath>
      ${o ? Ii(e.blur) : null}
    </defs>
    ${Ai(36, n.outdoor, Si)}
    ${Ai(364, n.extract, Ci)}
    <polygon class="exchanger ${t}" points=${ai}></polygon>
    ${a?.moisture ? Mi(e.rim, a.moisture.figure) : null}
    <polygon class="outline" points=${ai}></polygon>
    <polygon class="exchanger-inner" points=${oi}></polygon>
    ${a ? Ni(a.color, a.total) : null}
    ${Oi("bypass", l, s)}
    ${Oi("supply", l, c)}
    ${o ? Fi(o, e.blur) : null}
    <polygon class="head" points=${ii.supply} style=${D({ fill: n.supply })}></polygon>
    ${Oi("exhaust", u, 1)}
    <polygon class="head" points=${ii.exhaust} style=${D({ fill: n.exhaust })}></polygon>
  </svg>`;
}
//#endregion
//#region src/diagram/flow.ts
var Ri = .25;
function zi(e, t) {
	let n = Nt(e);
	return n === void 0 ? 1 : n <= 0 ? 0 : t === void 0 || t <= 0 ? 1 : Math.min(Math.max(n / t, Ri), 2);
}
//#endregion
//#region src/diagram/preheater.ts
var Bi = .1;
function Vi(e, t) {
	let n = L(e && {
		state: e.state,
		attributes: e.attributes ?? {}
	}, "power");
	return n === void 0 ? +(e?.state === "on") : n <= 0 ? 0 : t === void 0 ? 1 : Math.min(Math.max(n / t, Bi), 1);
}
function Hi(e) {
	return Vi(e, void 0) > 0;
}
function Ui(e, t) {
	return e === "auto" ? t !== void 0 && t > 0 && t < 340 : e === "compact";
}
var Wi = ["status.power", "status.rmot"], Gi = ["seasons.heating", "seasons.cooling"], Ki = ["fans.supply_flow", "fans.exhaust_flow"], qi = [
	"fans.level",
	"bypass.mode",
	"bypass.next_change",
	"status.operating_mode",
	"status.target_temperature",
	"status.temperature_profile",
	"status.next_fan_change",
	"status.filter_days",
	"pre_heater.energy"
], Ji = {
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
}, Yi = { "status.rmot": P.prefixes.rmot }, Xi = {
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
}, Zi = /* @__PURE__ */ new Set(["bypass.next_change", "status.next_fan_change"]), Qi = (e) => e.trim().toLowerCase() === "n/a";
function $i(e, t) {
	return Zi.has(e) && (Qi(t?.state ?? "") || t?.state === "unknown");
}
function ea(e, t, n) {
	return $i(e, t) ? !0 : e === "bypass.position" && Nt(t) === 0 ? !1 : n || !jt(t);
}
function ta(e, t, { showUnavailable: n, compact: r }) {
	let i = (r) => r.flatMap((r) => {
		let i = A(e, r);
		if (i === void 0) return [];
		let a = t[i], o = ea(r, a, n), s = Xi[r];
		return [{
			role: r,
			entityId: i,
			...s === void 0 ? {} : { icon: s },
			prefix: Yi[r] ?? "",
			visible: o,
			...$i(r, a) ? { notPlanned: !0 } : {}
		}];
	}), a = (t) => t.some((t) => A(e, t) !== void 0), o = {
		corners: pt((e) => i(r ? [`${e}.temperature`, `${e}.humidity`] : [
			`${e}.temperature`,
			`${e}.humidity`,
			`${e}.absolute_humidity`
		])),
		centre: i(["bypass.position"]),
		flows: r ? [] : i(Ki)
	};
	if (a([
		...Wi,
		...Gi,
		"pre_heater.power"
	])) {
		let n = A(e, "pre_heater.power");
		o.top = i(n !== void 0 && Hi(t[n]) ? [
			"status.power",
			"pre_heater.power",
			"status.rmot"
		] : Wi);
	}
	return r || a(qi) && (o.status = i(qi)), o;
}
//#endregion
//#region src/diagram/options.ts
var na = { paths: [
	"outdoor.temperature",
	"supply.temperature",
	"extract.temperature",
	"exhaust.temperature"
] }, ra = [
	"auto",
	"full",
	"compact"
], ia = ["hrv", "erv"], Q = {
	...R,
	exchangerType: {
		kind: "choice",
		path: "exchanger_type",
		choices: ia,
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
	layout: {
		kind: "choice",
		path: "layout",
		choices: ra,
		default: "auto"
	},
	showUnavailable: {
		kind: "boolean",
		path: "show_unavailable",
		default: !1
	}
}, aa = Object.values(Q), oa = {
	heating: "mdi:sun-thermometer",
	cooling: "mdi:snowflake-thermometer",
	between: "mdi:sun-snowflake-variant"
};
function sa(e, t, n) {
	let r = A(e, "seasons.heating"), i = A(e, "seasons.cooling"), a = (e) => t[e]?.state, o = (e, t, n) => ({
		season: e,
		icon: oa[e],
		color: t,
		title: P.seasons[e],
		entityId: n
	});
	if (r !== void 0 && a(r) === "on") return o("heating", n.warm, r);
	if (i !== void 0 && a(i) === "on") return o("cooling", n.cold, i);
	if (r !== void 0 && i !== void 0 && a(r) === "off" && a(i) === "off") return o("between", "var(--secondary-text-color)", r);
}
//#endregion
//#region src/diagram/streams.ts
var ca = "var(--disabled-text-color, #9e9e9e)", la = 10;
function ua(e) {
	let t = Nt(e);
	return t === void 0 ? 0 : Math.min(Math.max(t / 100, 0), 1);
}
function da(e) {
	let t = pt((t) => L(e[t], "temperature")), n = Object.values(t).filter((e) => e !== void 0), r = Math.min(...n), i = Math.max(...n), a = Math.max(i - r, la), o = (r + i) / 2 - a / 2, s = (e) => e === void 0 ? void 0 : Math.min(Math.max((e - o) / a, 0), 1);
	return pt((e) => s(t[e]));
}
function fa(e, t) {
	if (e === void 0) return ca;
	let n = Math.round(e * 1e3) / 10;
	return n <= 0 ? t.cold : n >= 100 ? t.warm : `color-mix(in srgb, ${t.warm} ${String(n)}%, ${t.cold})`;
}
function pa(e, t) {
	let n = da(e);
	return pt((e) => fa(n[e], t));
}
//#endregion
//#region src/editor/diagram-schema.ts
var $ = { advanced: !0 }, ma = [
	cr("exchanger_type", Q.exchangerType, Dt.exchangerTypes, { advanced: !1 }),
	H("outdoor", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	H("supply", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	H("extract", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	H("exhaust", {
		requiredTemperature: !0,
		advancedAbsolute: !1
	}),
	{
		type: "expandable",
		name: "fans",
		schema: [
			V("level"),
			V("supply_flow"),
			V("exhaust_flow")
		]
	},
	{
		type: "expandable",
		name: "bypass",
		schema: [
			V("position"),
			V("mode"),
			V("next_change", $)
		]
	},
	{
		type: "expandable",
		name: "status",
		schema: [
			V("operating_mode"),
			V("target_temperature", $),
			V("temperature_profile", $),
			V("next_fan_change", $),
			V("filter_days"),
			V("power"),
			V("rmot"),
			V("heating_saving", $),
			V("cooling_saving", $),
			V("moisture_recovery", $)
		]
	},
	{
		type: "expandable",
		name: "pre_heater",
		schema: [
			or("power"),
			V("energy"),
			U("max_power", Q.preHeaterMaxPower, 1, "W"),
			W("glow_color", Q.preHeaterGlowColor.default)
		]
	},
	{
		type: "expandable",
		name: "seasons",
		schema: [ar("heating"), ar("cooling")]
	},
	{
		type: "expandable",
		name: "animation",
		schema: [sr("enabled", Q.animation), U("nominal_flow", Q.nominalFlow, 1)]
	},
	sr("show_effectiveness", Q.showEffectiveness),
	dr,
	{
		type: "expandable",
		name: "colors",
		schema: [W("cold", Q.cold.default), W("warm", Q.warm.default)]
	},
	cr("layout", Q.layout, Dt.layouts),
	sr("show_unavailable", Q.showUnavailable, $)
], ha = (e, t) => t === void 0 ? void 0 : e[t];
function ga(e, t) {
	let n = e.states[t];
	if (n === void 0) return "n/a";
	if (typeof e.formatEntityState == "function") return e.formatEntityState(n);
	let r = n.attributes.unit_of_measurement;
	return r && !jt(n) ? `${n.state} ${r}` : n.state;
}
//#endregion
//#region src/cards/ventilation-card.ts
var _a = "hrv-ventilation-card";
function va(e) {
	Dr(e, na, aa);
}
var ya = 400, ba = (e, t) => {
	let n = Ct[e];
	return `${n.charAt(0).toUpperCase()}${n.slice(1)}: ${t}`;
}, xa = class extends kr {
	constructor(...e) {
		super(...e), this.compact = !1, this.observer = new ResizeObserver((e) => {
			this.width = e[0]?.contentRect.width, this.updateCompact();
		}), this.ids = Ti(), this.activate = (e) => {
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
    .coil {
      stroke-linecap: round;
    }
    .coil.off {
      stroke: var(--secondary-text-color);
      opacity: 0.5;
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
    /* Just below the exchanger's inner outline (y 38). */
    .bypass-position {
      top: 21.5%;
    }
    /*
     * Right of the exchanger, centred at y 100 (the height of the exchanger's centre and the house symbol's) and at
     * x 299.5, halfway between the exchanger's right vertex (x 255) and the house symbol (x 344), in the wedge the
     * streams leave there. Where the number and its unit do not fit one line, the unit goes under the number.
     */
    .moisture-recovery {
      top: 50%;
      left: 74.9%;
      transform: translate(-50%, -50%);
      /* Two lines of 11 px have to fit the wedge at 280 px (about 40 units high at its left end). */
      line-height: 1.1;
    }
    /* More specific than the label value rule below, whose ellipsis would clip a long figure. */
    .moisture-recovery .figure .value {
      overflow: visible;
      text-align: center;
    }
    /* The width of a space between the number and its unit; none where the unit goes under the number. */
    .moisture-recovery .unit {
      margin-left: 0.25em;
    }
    @container (max-width: ${ya}px) {
      .moisture-recovery .figure .value {
        display: flex;
        flex-direction: column;
      }
      .moisture-recovery .unit {
        margin-left: 0;
      }
    }
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
    ${Or}
  `;
	}
	static getConfigElement() {
		let e = document.createElement(qt);
		return e.schema = ma, e;
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
		va(e);
	}
	configure(e) {
		let t = A(e, "pre_heater.power");
		this.settings = {
			exchanger: I(e, Q.exchangerType),
			colors: {
				cold: I(e, Q.cold),
				warm: I(e, Q.warm)
			},
			layout: I(e, Q.layout),
			showUnavailable: I(e, Q.showUnavailable),
			badge: Hr(e),
			savings: {
				heating: A(e, "status.heating_saving"),
				cooling: A(e, "status.cooling_saving")
			},
			moistureRecovery: A(e, "status.moisture_recovery"),
			preHeater: t ? {
				entityId: t,
				maxPower: I(e, Q.preHeaterMaxPower),
				glowColor: I(e, Q.preHeaterGlowColor)
			} : void 0,
			rings: I(e, Q.showEffectiveness) && Ur(e) ? { moisture: I(e, Q.exchangerType) === "erv" && yt(e, [
				"outdoor",
				"supply",
				"extract"
			]) } : void 0,
			temperatures: pt((t) => A(e, `${t}.temperature`)),
			bypass: A(e, "bypass.position"),
			flows: {
				supply: A(e, "fans.supply_flow"),
				exhaust: A(e, "fans.exhaust_flow")
			},
			animate: I(e, Q.animation),
			nominalFlow: I(e, Q.nominalFlow)
		}, this.updateCompact();
	}
	updateCompact() {
		if (!this.settings) return;
		let e = Ui(this.settings.layout, this.width);
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
		let t = this.shownHass, n = t ? ga(t, e.entityId) : "", r = this.tap(e.entityId, "img"), [i = "", a = ""] = e.role.split("."), o = i === "pre_heater" ? `pre-heater-${a}` : a, s = e.icon ? C`<ha-icon .icon=${e.icon} aria-hidden="true"></ha-icon>` : E, c = C`<span class="value">${e.prefix}${e.notPlanned ? P.notPlanned : n}</span>`;
		return e.visible ? C`<span
      class="label ${o} ${e.notPlanned ? "not-planned" : ""}"
      role=${q(r.role)}
      tabindex=${q(r.tabindex)}
      aria-label="${Ct[e.role]}: ${n}"
      title=${ba(e.role, n)}
      data-entity=${q(r.entity)}
      >${s}${c}</span
    >` : C`<span class="label ${o} hidden" aria-hidden="true">${s}${c}</span>`;
	}
	topRow(e, t) {
		let n = (t) => {
			let n = e.find((e) => e.role === t);
			return n ? this.label(n) : E;
		}, r = e.some((e) => e.role === "pre_heater.power"), i = e.find((e) => e.role === "status.power"), a = r && i && !i.visible ? E : n("status.power");
		return C`<div class="row top">
      <span>${this.season(t)}</span><span class="centre">${a}${n("pre_heater.power")}</span
      ><span>${n("status.rmot")}</span>
    </div>`;
	}
	statusGrid(e) {
		return C`<div class="status">
      ${e.map((e) => {
			let t = Ji[e.role];
			return C`<div
          class="cell"
          style=${D({
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
		if (!e) return E;
		let t = this.tap(e.entityId, "img");
		return C`<ha-icon
      class="season"
      .icon=${e.icon}
      title=${e.title}
      aria-label=${e.title}
      role=${q(t.role)}
      tabindex=${q(t.tabindex)}
      data-entity=${q(t.entity)}
      style=${D({ color: e.color })}
    ></ha-icon>`;
	}
	badge(e, t) {
		if (!e) return E;
		let n = e.tint === void 0 ? {} : {
			"--badge-fill": `color-mix(in srgb, ${e.tint} 25%, var(--card-background-color, #fff))`,
			"--badge-border": e.tint
		}, r = this.tap(t);
		return C`<span
      class="badge ${e.kind}"
      role=${q(r.role)}
      tabindex=${q(r.tabindex)}
      data-entity=${q(r.entity)}
      style=${D(n)}
      >${e.text}</span
    >`;
	}
	moistureFigure(e) {
		if (!e) return E;
		let t = this.tap(this.settings?.moistureRecovery, "img");
		return C`<div class="on-drawing moisture-recovery">
      <span
        class="label figure"
        title=${e.title}
        aria-label=${e.title}
        role=${q(t.role)}
        tabindex=${q(t.tabindex)}
        data-entity=${q(t.entity)}
        >${e.icon ? C`<ha-icon .icon=${e.icon} aria-hidden="true"></ha-icon>` : E}<span class="value"
          ><span class="number">${e.text}</span>${e.unit ? C`<span class="unit">${e.unit}</span>` : E}</span
        ></span
      >
    </div>`;
	}
	coilBox(e, t) {
		let n = this.tap(e, "img"), r = ba("pre_heater.power", t);
		return C`<div
      class="on-drawing pre-heater"
      role=${q(n.role)}
      tabindex=${q(n.tabindex)}
      aria-label=${r}
      title=${r}
      data-entity=${q(n.entity)}
      style=${D(bi())}
    ></div>`;
	}
	render() {
		let e = this.shownHass;
		if (!this.config || !e || !this.settings) return E;
		let { settings: t } = this, { compact: n } = this, r = ta(this.config, e.states, {
			showUnavailable: t.showUnavailable,
			compact: n
		}), i = sa(this.config, e.states, t.colors), a = (t.badge || t.rings) && this.calculator ? this.calculator(e) : void 0, o = a?.result, s = zn(e), c = t.badge ? Gr(o, t, s) : void 0, l = qr(o, t, s), { states: u } = e, { temperatures: d, flows: f } = t, { rings: p } = t, m = p ? Jr(o, a?.inputs.bypass, p.moisture, s) : void 0, { preHeater: h } = t, g = Li({
			ids: this.ids,
			exchanger: t.exchanger,
			colors: pa(pt((e) => ha(u, d[e])), t.colors),
			bypass: ua(ha(u, t.bypass)),
			speeds: {
				supply: zi(ha(u, f.supply), t.nominalFlow),
				exhaust: zi(ha(u, f.exhaust), t.nominalFlow)
			},
			rings: p ? {
				total: o?.effectiveness.total,
				moisture: p.moisture ? { figure: o?.effectiveness.moisture } : void 0,
				color: Wr(o?.mode, t.colors)
			} : void 0,
			coil: h ? {
				level: Vi(ha(u, h.entityId), h.maxPower),
				color: h.glowColor
			} : void 0
		});
		return C`<ha-card @click=${this.activate} @keydown=${this.activate}>
      ${r.top ? this.topRow(r.top, i) : E}
      <div class="drawing ${t.animate ? "" : "still"}">
        ${g}
        ${ft.map((e) => C`<div class="corner ${e}">${r.corners[e].map((e) => this.label(e))}</div>`)}
        ${m === void 0 ? E : C`<div class="on-drawing effectiveness" role="img" aria-label=${m} title=${m}></div>`}
        ${h ? this.coilBox(h.entityId, ga(e, h.entityId)) : E}
        <div class="on-drawing bypass-position">${r.centre.map((e) => this.label(e))}</div>
        ${c ? C`<div class="on-drawing saving">${this.badge(c, Kr(o, t.savings, u))}</div>` : E}
        ${this.moistureFigure(l)}
        ${r.flows.map((e) => C`<div class="on-drawing ${e.role === "fans.supply_flow" ? "supply-flow" : "exhaust-flow"}">
              ${this.label(e)}
            </div>`)}
      </div>
      ${r.status ? this.statusGrid(r.status) : E} ${this.sampleNote()}
    </ha-card>`;
	}
};
F([dt()], xa.prototype, "compact", void 0), St(_a, xa);
//#endregion
//#region src/index.ts
var Sa = [
	{
		type: _a,
		...Et.diagram,
		preview: !0
	},
	{
		type: Rr,
		...Et.recovery,
		preview: !0
	},
	{
		type: jr,
		...Et.moisture,
		preview: !0
	}
];
function Ca(e = window) {
	let t = e.customCards ??= [];
	for (let e of Sa) t.some((t) => t.type === e.type) || t.push({ ...e });
}
Ca();
//#endregion
export { Sa as CARD_ENTRIES, Ca as registerCardPicker };

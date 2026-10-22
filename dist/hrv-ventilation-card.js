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
var ie = globalThis, ae = (e) => e, oe = ie.trustedTypes, se = oe ? oe.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ce = "$lit$", b = `lit$${Math.random().toFixed(9).slice(2)}$`, le = "?" + b, ue = `<${le}>`, x = document, de = () => x.createComment(""), fe = (e) => e === null || typeof e != "object" && typeof e != "function", pe = Array.isArray, me = (e) => pe(e) || typeof e?.[Symbol.iterator] == "function", he = "[ 	\n\f\r]", ge = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _e = /-->/g, ve = />/g, ye = RegExp(`>|${he}(?:([^\\s"'>=/]+)(${he}*=${he}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), be = /'/g, xe = /"/g, Se = /^(?:script|style|textarea|title)$/i, Ce = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), S = Ce(1), C = Ce(2), we = Symbol.for("lit-noChange"), w = Symbol.for("lit-nothing"), Te = /* @__PURE__ */ new WeakMap(), T = x.createTreeWalker(x, 129);
function Ee(e, t) {
	if (!pe(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return se === void 0 ? t : se.createHTML(t);
}
var De = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = ge;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === ge ? c[1] === "!--" ? o = _e : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = ye) : (Se.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = ye) : o = ve : o === ye ? c[0] === ">" ? (o = i ?? ge, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? ye : c[3] === "\"" ? xe : be) : o === xe || o === be ? o = ye : o === _e || o === ve ? o = ge : (o = ye, i = void 0);
		let d = o === ye && e[t + 1].startsWith("/>") ? " " : "";
		a += o === ge ? n + ue : l >= 0 ? (r.push(s), n.slice(0, l) + ce + n.slice(l) + b + d) : n + b + (l === -2 ? t : d);
	}
	return [Ee(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, Oe = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = De(t, n);
		if (this.el = e.createElement(l, r), T.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = T.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(ce)) {
					let t = u[o++], n = i.getAttribute(e).split(b), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ne : r[1] === "?" ? Pe : r[1] === "@" ? Fe : Me
					}), i.removeAttribute(e);
				} else e.startsWith(b) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (Se.test(i.tagName)) {
					let e = i.textContent.split(b), t = e.length - 1;
					if (t > 0) {
						i.textContent = oe ? oe.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], de()), T.nextNode(), c.push({
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
function ke(e, t, n = e, r) {
	if (t === we) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = fe(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = ke(e, i._$AS(e, t.values), i, r)), t;
}
var Ae = class {
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
		T.currentNode = r;
		let i = T.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new je(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Ie(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = T.nextNode(), a++);
		}
		return T.currentNode = x, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, je = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = w, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = ke(this, e, t), fe(e) ? e === w || e == null || e === "" ? (this._$AH !== w && this._$AR(), this._$AH = w) : e !== this._$AH && e !== we && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? me(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== w && fe(this._$AH) ? this._$AA.nextSibling.data = e : this.T(x.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Oe.createElement(Ee(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Ae(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = Te.get(e.strings);
		return t === void 0 && Te.set(e.strings, t = new Oe(e)), t;
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
}, Me = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = w, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = w;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = ke(this, e, t, 0), a = !fe(e) || e !== this._$AH && e !== we, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = ke(this, r[n + o], t, o), s === we && (s = this._$AH[o]), a ||= !fe(s) || s !== this._$AH[o], s === w ? e = w : e !== w && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === w ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ne = class extends Me {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === w ? void 0 : e;
	}
}, Pe = class extends Me {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== w);
	}
}, Fe = class extends Me {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = ke(this, e, t, 0) ?? w) === we) return;
		let n = this._$AH, r = e === w && n !== w || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== w && (n === w || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Ie = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		ke(this, e);
	}
}, Le = ie.litHtmlPolyfillSupport;
Le?.(Oe, je), (ie.litHtmlVersions ??= []).push("3.3.3");
var Re = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new je(t.insertBefore(de(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, ze = globalThis, Be = class extends re {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Re(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return we;
	}
};
Be._$litElement$ = !0, Be.finalized = !0, ze.litElementHydrateSupport?.({ LitElement: Be });
var Ve = ze.litElementPolyfillSupport;
Ve?.({ LitElement: Be }), (ze.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region node_modules/lit-html/directive.js
var He = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, Ue = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), We = class {
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
}, Ge = "important", Ke = " !" + Ge, E = Ue(class extends We {
	constructor(e) {
		if (super(e), e.type !== He.ATTRIBUTE || e.name !== "style" || e.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
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
				let t = typeof r == "string" && r.endsWith(Ke);
				e.includes("-") || t ? n.setProperty(e, t ? r.slice(0, -11) : r, t ? Ge : "") : n[e] = r;
			}
		}
		return we;
	}
}), qe = 1.2, Je = 1006, Ye = 2501, Xe = 1.86, Ze = 3600, Qe = 3, $e = 1.5, et = (e) => e.freeCooling ? "freeCooling" : e.mode === "cooling" ? "cooling" : "heat";
function tt(e) {
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
var nt = (e, t) => e >= t * (1 - 1e-9), rt = (e, t) => Math.min(Math.max(e / t * 100, 0), 100), it = (e, t, n, r) => {
	let i = Math.abs(t);
	if (!(Math.round(i * r) <= 0 || !nt(i, n * Je * Qe))) return rt(e, i);
}, at = ({ outdoor: e, supply: t, extract: n }, r) => {
	let i = n - e;
	if (!(Math.round(Math.abs(r)) <= 0 || !nt(Math.abs(i), $e))) return rt(t - e, i);
}, D = (e) => e !== void 0 && Number.isFinite(e), ot = (e, t) => ({
	total: e.h - t.h,
	latent: Ye * (e.A - t.A)
});
function st(e) {
	let { temperature: t, absoluteHumidity: n, supplyFlow: r, bypass: i, airDensity: a } = e, o = [
		t.outdoor,
		t.supply,
		t.extract
	].filter(D), s = n && [
		n.outdoor,
		n.supply,
		n.extract
	].filter(D);
	if (o.length !== 3 || !D(r) || !D(i) || s !== void 0 && s.length !== 3 || !(Number.isFinite(a) && a > 0)) return;
	let c = (e, t) => ({
		h: a * Je * e + t * (Ye + Xe * e),
		A: t
	}), [l, u, d] = o.map((e, t) => c(e, s?.[t] ?? 0)), f = r / Ze, p = i > 0 || l.h > d.h, m = d.h >= l.h, h, g;
	if (p) {
		let [e, t] = m ? [d, l] : [l, d];
		h = ot(e, u), g = ot(u, t);
	} else h = ot(u, l), g = ot(d, u);
	let _ = n && ct(n, r), ee = it(h.total, d.h - l.h, a, f), v = _ && at(n, _.extracted);
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
function ct(e, t) {
	if (e === void 0 || !D(t)) return;
	let { outdoor: n, supply: r, extract: i } = e;
	if (D(n) && D(r) && D(i)) return {
		extracted: t * (i - n),
		recovered: t * (r - n),
		outside: t * (i - r)
	};
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/property.js
var lt = {
	attribute: !0,
	type: String,
	converter: y,
	reflect: !1,
	hasChanged: te
}, ut = (e = lt, t, n) => {
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
function dt(e) {
	return (t, n) => typeof n == "object" ? ut(e, t, n) : ((e, t, n) => {
		let r = t.hasOwnProperty(n);
		return t.constructor.createProperty(n, e), r ? Object.getOwnPropertyDescriptor(t, n) : void 0;
	})(e, t, n);
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/state.js
function ft(e) {
	return dt({
		...e,
		state: !0,
		attribute: !1
	});
}
//#endregion
//#region src/lib/config.ts
var pt = [
	"outdoor",
	"supply",
	"extract",
	"exhaust"
], mt = (e) => ({
	outdoor: e("outdoor"),
	supply: e("supply"),
	extract: e("extract"),
	exhaust: e("exhaust")
}), ht = /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/;
function O(e, t) {
	let n = e;
	for (let e of t.split(".")) {
		if (typeof n != "object" || !n || !Object.hasOwn(n, e)) return;
		n = n[e];
	}
	return n;
}
function gt(e) {
	if (typeof e != "string") return;
	let t = e.trim();
	return ht.test(t) ? t : void 0;
}
function k(e, t) {
	return gt(O(e, t));
}
function _t(e, t) {
	return k(e, t) !== void 0;
}
function vt(e, t) {
	let n = k(e, `${t}.absolute_humidity`);
	if (n !== void 0) return { absolute: n };
	let r = k(e, `${t}.humidity`), i = k(e, `${t}.temperature`);
	return r !== void 0 && i !== void 0 ? {
		relative: r,
		temperature: i
	} : void 0;
}
var yt = (e, t) => vt(e, t) !== void 0;
function bt(e, t) {
	return t.every((t) => yt(e, t));
}
function xt(e, t, n) {
	let r = (t) => _t(e, `${t}.absolute_humidity`) || _t(e, `${t}.humidity`);
	return n === "all_or_none" && !t.some(r) ? [] : t.flatMap((t) => r(t) ? yt(e, t) ? [] : [`${t}.temperature`] : [`${t}.humidity`]);
}
function St(e, t) {
	let n = t.paths.filter((t) => !_t(e, t)), { humidity: r } = t;
	return r && n.push(...xt(e, r.streams, r.rule)), [...new Set(n)];
}
//#endregion
//#region src/lib/define.ts
function Ct(e, t) {
	let n = customElements.get(e);
	n === void 0 ? customElements.define(e, t) : n !== t && console.warn(`${e} is already defined by another copy of the module; that copy stays in use.`);
}
var wt = [
	"Away",
	"Low",
	"Medium",
	"High"
], Tt = "Ventilation disabled", Et = {
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
	"pre_heater.power": "pre-heater",
	"pre_heater.energy": "pre-heater energy",
	"seasons.heating": "heating season",
	"seasons.cooling": "cooling season"
}, Dt = (e) => `Missing required entities: ${e.map((e) => Et[e]).join(", ")}`, A = {
	invalid: (e, t) => `Invalid option ${e}: expected ${t}`,
	number: (e, t) => `a number from ${e} to ${t}`,
	color: "a CSS colour such as #db4437 or rgb(219, 68, 55)",
	boolean: "true or false",
	object: "a group of options",
	choice: (e) => `one of ${e.join(", ")}`,
	list: "a list of texts"
}, Ot = "Sample values", kt = {
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
}, At = {
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
}, jt = "g/h", j = {
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
}, M = {
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
}, N = {
	prefixes: { rmot: "RMOT " },
	notPlanned: "—",
	seasons: {
		heating: "Heating season",
		cooling: "Cooling season",
		between: "Between seasons"
	},
	saving: (e) => `${e} W`,
	moisture: (e) => `${e} ${jt}`,
	moistureUnit: jt,
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
}, Mt = /* @__PURE__ */ new Set(["unknown", "unavailable"]), Nt = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
function Pt(e) {
	return e === void 0 || Mt.has(e.state);
}
function Ft(e) {
	if (!Nt.test(e)) return;
	let t = Number(e);
	return Number.isFinite(t) ? t + 0 : void 0;
}
function It(e) {
	return e === void 0 ? void 0 : Ft(e.state);
}
//#endregion
//#region src/editor/schema.ts
function Lt(e) {
	return "type" in e;
}
function Rt(e) {
	let { advanced: t, ...n } = e;
	return n;
}
function zt(e) {
	return e.flatMap((e) => Lt(e) ? e.schema.map((t) => ({
		field: t,
		path: e.flatten ? t.name : `${e.name}.${t.name}`
	})) : [{
		field: e,
		path: e.name
	}]);
}
function Bt(e, t) {
	let n = (e) => t || e.advanced !== !0;
	return e.flatMap((e) => {
		if (!Lt(e)) return n(e) ? [Rt(e)] : [];
		let t = e.schema.filter(n).map(Rt);
		return t.length > 0 ? [{
			...e,
			schema: t
		}] : [];
	});
}
function Vt(e, t) {
	if (e == null || e === "") return !1;
	if (t.default === void 0) return !0;
	if (typeof t.default == "number") {
		let n = typeof e == "number" ? e : typeof e == "string" ? Ft(e) : void 0;
		if (n !== void 0) return n !== t.default;
	}
	return Ht(e) !== Ht(t.default);
}
function Ht(e) {
	return (typeof e == "string" || typeof e == "number" || typeof e == "boolean" ? String(e) : JSON.stringify(e)).toLowerCase();
}
function Ut(e, t) {
	return zt(e).some(({ field: e, path: n }) => e.advanced === !0 && Vt(O(t, n), e));
}
function Wt(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Gt(e, t, n, r, i = "") {
	let [a, ...o] = t.split("."), s = e, { [a]: c, ...l } = s;
	if (o.length === 0) return n === void 0 ? l : {
		...l,
		[a]: n
	};
	let u = Gt(Wt(c) ? c : {}, o.join("."), n, r, `${i}${a}.`), d = r !== void 0 && O(r, `${i}${a}`) !== void 0;
	return n === void 0 && Object.keys(u).length === 0 && !d ? l : {
		...s,
		[a]: u
	};
}
function Kt(e, t, n = /* @__PURE__ */ new Set()) {
	return zt(e).reduce((e, { field: r, path: i }) => r.default !== void 0 && O(t, i) === void 0 && !n.has(i) ? Gt(e, i, r.default) : e, t);
}
function qt(e, t, n) {
	return zt(e).map(({ path: e }) => e).filter((e) => O(t, e) !== void 0 && O(n, e) === void 0);
}
function Jt(e) {
	if (!Wt(e)) return e;
	let t = Object.entries(e).filter(([, e]) => e !== void 0).map(([e, t]) => [e, Jt(t)]);
	return t.length !== Object.keys(e).length || t.some(([t, n]) => n !== e[t]) ? Object.fromEntries(t) : e;
}
function Yt(e, t) {
	return zt(e).reduce((e, { field: n, path: r }) => {
		let i = n.selector.text, a = O(e, r);
		if (!Wt(i) || i.multiple !== !0 || !Array.isArray(a)) return e;
		let o = a.filter((e) => typeof e != "string" || e.trim() !== "");
		return o.length === a.length ? e : Gt(e, r, o.length > 0 ? o : void 0, t);
	}, t);
}
function Xt(e, t, n) {
	return zt(e).reduce((e, { field: n, path: r }) => n.default !== void 0 && O(t, r) === void 0 && O(e, r) !== void 0 && !Vt(O(e, r), n) ? Gt(e, r, void 0, t) : e, n);
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/decorate.js
function P(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
//#endregion
//#region src/editor/hrv-card-editor.ts
var Zt = "hrv-card-editor", Qt = [{
	name: "advanced",
	selector: { boolean: {} }
}], $t = () => At.advanced, en = At.sections, tn = At.fields;
function nn(e) {
	return Lt(e) ? e.title ?? en[e.name] ?? e.name : tn[e.name] ?? e.name;
}
var F = class extends Be {
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
			let t = Jt(e.detail.value), n = Yt(this.schema, t);
			this._draft = n === t ? void 0 : t;
			let r = qt(this.schema, this._shown, n);
			this._emptied = new Set([...this._emptied, ...r].filter((e) => O(n, e) === void 0));
			let i = this._config ? Xt(this.schema, this._config, n) : n;
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
		return this._config !== void 0 && Ut(this.schema, this._config);
	}
	setConfig(e) {
		let t = JSON.stringify(e) !== JSON.stringify(this._config);
		this._emptied.size > 0 && t && (this._emptied = /* @__PURE__ */ new Set()), t && (this._draft = void 0), this._config = e, this._locked && !this._switch.advanced && (this._switch = { advanced: !0 });
	}
	willUpdate(e) {
		e.has("schema") && this._locked && !this._switch.advanced && (this._switch = { advanced: !0 }), (e.has("schema") || e.has("_switch")) && (this._formSchema = Bt(this.schema, this._switch.advanced)), this._config && (e.has("schema") || e.has("_config") || e.has("_switch") || e.has("_draft")) && (this._shown = Kt(this._formSchema, this._draft ?? this._config, this._emptied));
	}
	render() {
		return this._config ? this._formDefined ? S`
      <ha-form
        class="switch"
        .hass=${this.hass}
        .data=${this._switch}
        .schema=${Qt}
        .computeLabel=${$t}
        @value-changed=${this._toggleAdvanced}
      ></ha-form>
      <ha-form
        .hass=${this.hass}
        .data=${this._shown}
        .schema=${this._formSchema}
        .computeLabel=${nn}
        @value-changed=${this._configChanged}
      ></ha-form>
    ` : S`<p class="hint">${At.noForm}</p>` : w;
	}
};
P([dt({ attribute: !1 })], F.prototype, "hass", void 0), P([dt({ attribute: !1 })], F.prototype, "schema", void 0), P([ft()], F.prototype, "_config", void 0), P([ft()], F.prototype, "_switch", void 0), P([ft()], F.prototype, "_formDefined", void 0), P([ft()], F.prototype, "_draft", void 0), Ct(Zt, F);
//#endregion
//#region src/lib/options.ts
var rn = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, an = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|var)\((.*)\)$/i, on = /^[#a-zA-Z0-9(),.%\s/+-]+$/, sn = /* @__PURE__ */ new Set(/* @__PURE__ */ "aliceblue.antiquewhite.aqua.aquamarine.azure.beige.bisque.black.blanchedalmond.blue.blueviolet.brown.burlywood.cadetblue.chartreuse.chocolate.coral.cornflowerblue.cornsilk.crimson.cyan.darkblue.darkcyan.darkgoldenrod.darkgray.darkgreen.darkgrey.darkkhaki.darkmagenta.darkolivegreen.darkorange.darkorchid.darkred.darksalmon.darkseagreen.darkslateblue.darkslategray.darkslategrey.darkturquoise.darkviolet.deeppink.deepskyblue.dimgray.dimgrey.dodgerblue.firebrick.floralwhite.forestgreen.fuchsia.gainsboro.ghostwhite.gold.goldenrod.gray.green.greenyellow.grey.honeydew.hotpink.indianred.indigo.ivory.khaki.lavender.lavenderblush.lawngreen.lemonchiffon.lightblue.lightcoral.lightcyan.lightgoldenrodyellow.lightgray.lightgreen.lightgrey.lightpink.lightsalmon.lightseagreen.lightskyblue.lightslategray.lightslategrey.lightsteelblue.lightyellow.lime.limegreen.linen.magenta.maroon.mediumaquamarine.mediumblue.mediumorchid.mediumpurple.mediumseagreen.mediumslateblue.mediumspringgreen.mediumturquoise.mediumvioletred.midnightblue.mintcream.mistyrose.moccasin.navajowhite.navy.oldlace.olive.olivedrab.orange.orangered.orchid.palegoldenrod.palegreen.paleturquoise.palevioletred.papayawhip.peachpuff.peru.pink.plum.powderblue.purple.rebeccapurple.red.rosybrown.royalblue.saddlebrown.salmon.sandybrown.seagreen.seashell.sienna.silver.skyblue.slateblue.slategray.slategrey.snow.springgreen.steelblue.tan.teal.thistle.tomato.turquoise.violet.wheat.white.whitesmoke.yellow.yellowgreen.transparent.currentcolor".split("."));
function cn(e) {
	let t = 0;
	for (let n = 0; n < e.length; n++) if (e[n] === "(" && t++, e[n] === ")" && (t--, t < 0 || t === 0 && n !== e.length - 1)) return !1;
	return t === 0;
}
function ln(e) {
	let t = e.trim();
	if (t.length === 0 || t.length > 100 || !on.test(t)) return !1;
	if (rn.test(t) || sn.has(t.toLowerCase())) return !0;
	let n = an.exec(t);
	if (n === null || !cn(t)) return !1;
	if (n[1]?.toLowerCase() !== "var") return !0;
	let [r, ...i] = (n[2] ?? "").split(",");
	return /^\s*--[a-zA-Z0-9-]+\s*$/.test(r ?? "") && (i.length === 0 || ln(i.join(",")));
}
var un = (e) => e == null;
function dn(e) {
	switch (e.kind) {
		case "number": return A.number(String(e.min), String(e.max));
		case "color": return A.color;
		case "boolean": return A.boolean;
		case "choice": return A.choice(e.choices);
		case "list": return A.list;
	}
}
function fn(e, t) {
	switch (e.kind) {
		case "number": return typeof t == "number" && Number.isFinite(t) && t >= e.min && t <= e.max;
		case "color": return typeof t == "string" && ln(t);
		case "boolean": return typeof t == "boolean";
		case "choice": return typeof t == "string" && e.choices.includes(t);
		case "list": return Array.isArray(t) && t.every((e) => typeof e == "string");
	}
}
function pn(e, t) {
	let n = t.split(".").slice(0, -1);
	for (let t = 1; t <= n.length; t++) {
		let r = n.slice(0, t).join("."), i = O(e, r);
		if (!un(i) && (typeof i != "object" || Array.isArray(i))) return r;
	}
}
function mn(e, t) {
	let n = t.flatMap((t) => {
		let n = pn(e, t.path);
		if (n !== void 0) return [A.invalid(n, A.object)];
		let r = O(e, t.path);
		return un(r) || fn(t, r) ? [] : [A.invalid(t.path, dn(t))];
	});
	return [...new Set(n)];
}
function I(e, t) {
	let n = O(e, t.path);
	if (t.kind === "list" && Array.isArray(n) && fn(t, n)) {
		let e = n.filter((e) => e.trim() !== "");
		return e.length > 0 ? e : t.default;
	}
	return un(n) || !fn(t, n) ? t.default : n;
}
//#endregion
//#region src/lib/units.ts
var hn = { scale: 1 }, gn = {
	temperature: /* @__PURE__ */ new Map([["°c", hn], ["°f", {
		scale: 5 / 9,
		offset: -32
	}]]),
	flow: /* @__PURE__ */ new Map([
		["m3/h", hn],
		["l/s", { scale: 3.6 }],
		["ft3/min", { scale: 1.69901079552 }]
	]),
	absolute_humidity: /* @__PURE__ */ new Map([["g/m3", hn]]),
	relative_humidity: /* @__PURE__ */ new Map([["%", hn]]),
	percentage: /* @__PURE__ */ new Map([["%", hn]]),
	power: /* @__PURE__ */ new Map([["w", hn], ["kw", { scale: 1e3 }]])
};
function _n(e) {
	return e.trim().replaceAll("º", "°").normalize("NFKC").toLowerCase();
}
function L(e, t) {
	let n = It(e);
	return n === void 0 ? void 0 : vn(t, n, e?.attributes.unit_of_measurement);
}
function vn(e, t, n) {
	if (!Number.isFinite(t) || n === void 0) return;
	let r = gn[e].get(_n(n));
	return r ? (t + (r.offset ?? 0)) * r.scale : void 0;
}
//#endregion
//#region src/calc/humidity.ts
var yn = -100, bn = 100;
function xn(e, t) {
	if (!(!Number.isFinite(e) || e < yn || e > bn) && !(!Number.isFinite(t) || t < 0 || t > 100)) return 6.112 * Math.exp(17.67 * e / (e + 243.5)) * t * 2.1674 / (273.15 + e);
}
//#endregion
//#region src/calc/smoothing.ts
var Sn = 6e4, Cn = 1440, wn = 5 * Sn;
function Tn(e) {
	let t = e.map((e) => Date.parse(e?.last_updated ?? "")).filter(Number.isFinite);
	return t.length > 0 ? Math.max(...t) : void 0;
}
function En(e, t, n) {
	let r = t - n, i = 0, a = 0;
	for (let n = 0; n < e.length; n++) {
		let o = e[n];
		if (o === void 0 || o.time > t) break;
		let s = e[n + 1], c = n === 0 ? r : Math.max(o.time, r), l = s === void 0 || s.time > t ? t : s.time;
		l <= c || o.value === void 0 || (i += o.value * (l - c), a += l - c);
	}
	return a > 0 ? i / a : void 0;
}
function Dn(e, t, n) {
	let r = e.at(-1);
	if (r !== void 0) return !(t > 0) || e.length === 1 ? r.value : En(e, Math.max(n ?? r.time, r.time), t * Sn);
}
function On(e, t) {
	let n = e.length;
	for (; n > 0 && (e[n - 1]?.time ?? -Infinity) > t.time;) n--;
	e[n - 1]?.time === t.time ? e[n - 1] = t : e.splice(n, 0, t);
}
var kn = class {
	constructor() {
		this.series = /* @__PURE__ */ new Map(), this.listeners = /* @__PURE__ */ new Set();
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	smoothed(e, t, n, r) {
		let i = Number.isFinite(n) ? Math.min(Math.max(0, n), Cn) : 0, a = i * Sn, o = this.series.get(t.key);
		o === void 0 && (o = {
			samples: [],
			windowMs: a,
			history: { state: "none" }
		}, this.series.set(t.key, o)), o.windowMs = Math.max(o.windowMs, a);
		let s = this.add(o, e, t);
		if (a > 0 && this.needsHistory(o) && this.loadHistory(o, e, t), s !== void 0) return o.history.state === "loading" && o.history.first ? s : Dn(o.samples, i, r);
	}
	needsHistory(e) {
		let { history: t, samples: n, windowMs: r } = e;
		switch (t.state) {
			case "none": return !0;
			case "loading": return !1;
			case "loaded": return r > t.windowMs;
			case "failed": {
				let [e, i] = [n[0], n.at(-1)];
				return !(e !== void 0 && i !== void 0 && e.time <= i.time - r) && Date.now() - t.at >= wn;
			}
		}
	}
	add(e, t, n) {
		let r = n.entityIds.map((e) => t.states[e]), i = Tn(r);
		if (i === void 0) return;
		let a = n.value(r);
		return On(e.samples, {
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
			a = An(await t.callWS({
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
			for (let t of a) On(e.samples, t);
			this.prune(e), this.listeners.forEach((e) => {
				e();
			});
		}
	}
};
function An(e, t, n) {
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
	}, On(o, {
		time: e.time,
		value: n.value(a)
	});
	return o;
}
var jn = new kn(), R = {
	smoothing: {
		kind: "number",
		path: "smoothing",
		min: 0,
		max: Cn,
		default: 10
	},
	airDensity: {
		kind: "number",
		path: "air_density",
		min: .5,
		max: 1.5,
		default: qe
	}
}, Mn = [
	"outdoor",
	"supply",
	"extract"
];
function Nn(e, t) {
	let n = vt(e, t);
	if (n !== void 0) return "absolute" in n ? {
		key: n.absolute,
		entityIds: [n.absolute],
		value: ([e]) => L(e, "absolute_humidity")
	} : {
		key: `derived:${n.relative}|${n.temperature}`,
		entityIds: [n.relative, n.temperature],
		value: ([e, t]) => {
			let [n, r] = [L(e, "relative_humidity"), L(t, "temperature")];
			return n === void 0 || r === void 0 ? void 0 : xn(r, n);
		}
	};
}
function Pn(e, t = jn) {
	let n = I(e, R.smoothing), r = I(e, R.airDensity), i = Mn.map((t) => k(e, `${t}.temperature`)), a = Mn.map((t) => Nn(e, t)), o = a.every((e) => e !== void 0) ? a : void 0, s = k(e, "fans.supply_flow"), c = k(e, "bypass.position"), l = [
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
		let a = (t, n) => t === void 0 ? void 0 : L(e.states[t], n), d = Tn(l.map((t) => e.states[t])), f = {
			temperature: u(i.map((e) => a(e, "temperature"))),
			supplyFlow: a(s, "flow"),
			bypass: c === void 0 ? 0 : a(c, "percentage"),
			airDensity: r
		};
		o !== void 0 && (f.absoluteHumidity = u(o.map((r) => t.smoothed(e, r, n, d))));
		let p = st(f);
		return p === void 0 ? { inputs: f } : {
			inputs: f,
			result: p
		};
	};
}
//#endregion
//#region src/lib/bar.ts
var Fn = 250, In = (e) => Math.round(e * 1e6) / 1e6, Ln = (e) => Number.isFinite(e) ? e : 0;
function Rn(e, t) {
	let n = In(e.reduce((e, t) => e + Math.abs(Ln(t)), 0));
	return Math.max(Ln(t), Math.ceil(n / Fn) * Fn);
}
function zn(e, t) {
	let n = (e) => t > 0 ? Math.min(e, t) / t * 50 : 0, r = 0, i = 0;
	return e.map((e) => {
		let t = Ln(e);
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
var Bn = "#00897b", Vn = "−";
function Hn(e) {
	let t = e?.locale;
	return typeof t == "object" && t ? t : e?.language === void 0 ? {} : { language: e.language };
}
function Un(e) {
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
var Wn = /* @__PURE__ */ new Map();
function Gn(e, t) {
	let n = Un(e), r = e.number_format !== "none", i = `${n?.join(",") ?? ""}|${String(t)}|${String(r)}`, a = Wn.get(i);
	return a === void 0 && (a = new Intl.NumberFormat(n, {
		minimumFractionDigits: t,
		maximumFractionDigits: t,
		useGrouping: r
	}), Wn.set(i, a)), a;
}
function z(e, t, n = 0) {
	if (!Number.isFinite(e)) return "n/a";
	let r = Number.isFinite(n) ? Math.min(20, Math.max(0, Math.trunc(n))) : 0, i = Math.abs(e) < .5 / 10 ** r ? 0 : e;
	return Gn(t ?? {}, r).formatToParts(i).map((e) => e.type === "minusSign" ? Vn : e.value).join("");
}
//#endregion
//#region src/cards/bar.ts
var Kn = (e) => `repeating-linear-gradient(135deg, ${e} 0 3px, transparent 3px 6px)`, qn = o`
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
function Jn({ left: e, width: t }) {
	if (!(t <= 0)) return {
		left: `${String(-e / t * 100)}%`,
		width: `${String(100 / t * 100)}%`
	};
}
function Yn(e) {
	return S`<div class="bar ${e.length > 1 ? "lanes" : ""}">
    ${e.map((e, t) => S`${t > 0 ? S`<div class="divider"></div>` : w}
          <div class="lane">
            ${e.map((e) => {
		let t = Jn(e);
		return S`<div
                class="seg"
                style=${E({
			left: `${String(e.left)}%`,
			width: `${String(e.width)}%`
		})}
              >
                ${t ? S`<div class="fill" style=${E({
			...t,
			background: e.background
		})}></div>` : w}
              </div>`;
	})}
          </div>`)}
    <div class="zero"></div>
  </div>`;
}
function Xn(e) {
	return S`<span class="swatch" style=${E({ background: e })}></span>`;
}
//#endregion
//#region src/cards/moisture-view.ts
var Zn = {
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
		default: Bn
	},
	gainingColor: {
		kind: "color",
		path: "gaining_color",
		default: "#8e24aa"
	}
}, Qn = Object.values(B), $n = "#fdd835", er = (e) => e.extracted < 0, tr = (e, t) => Math.abs(e.indoor - e.outdoor) < t, nr = (e) => e === void 0 ? 0 : Math.round(Math.min(Math.max(e, 0), 100));
function rr(e) {
	let t = er(e), n = t ? -1 : 1, r = (e) => Math.round(e * n);
	return {
		gaining: t,
		extracted: r(e.extracted),
		recovered: r(e.recovered),
		outside: r(e.outside)
	};
}
var ir = (e, t) => ({
	gaining: e.gaining,
	extracted: z(e.extracted, t),
	recovered: z(e.recovered, t),
	outside: z(e.outside, t)
});
function ar(e, t, n, r) {
	if (t) return {
		subtitle: M.subtitles.neutral,
		header: M.neutral
	};
	let i = M.header(ir(e, r));
	if (e.extracted > 0) {
		let t = z(e.recovered / e.extracted * 100, r);
		i += M.percent(t, n > 0 ? z(n, r) : void 0);
	}
	return {
		subtitle: e.gaining ? M.subtitles.gaining : M.subtitles.drying,
		header: i
	};
}
function or(e, t, n, r, i) {
	if (e === void 0 || t === void 0) return {
		title: M.title,
		header: "n/a",
		segments: [],
		swatches: void 0,
		lines: []
	};
	let a = er(e), o = tr(t, r.neutralThreshold), s = a ? r.gainingColor : r.dryingColor, c = nr(n), l = [e.recovered, e.outside], u = Rn(l, r.minScale), d = [s, Kn(s)], f = zn(l, u).map((e, t) => ({
		...e,
		background: d[t] ?? s
	})), p = rr(e), { subtitle: m, header: h } = ar(p, o, c, i), g = (e) => z(e, i, 1), _ = {
		title: M.title,
		subtitle: m,
		header: h,
		segments: f,
		swatches: {
			recovered: M.swatchRecovered(a),
			outside: M.swatchOutside(a),
			color: s
		},
		lines: [
			M.flow(ir(p, i)),
			M.humidities(g(t.indoor), g(t.outdoor)),
			M.scale(z(u, i))
		]
	};
	return o || (_.headerColor = s), c > 0 && (_.bypass = {
		position: c,
		text: M.bypass(z(c, i))
	}), _;
}
//#endregion
//#region src/editor/fields.ts
var sr = { entity: { domain: "sensor" } }, V = (e, { advanced: t = !1, required: n = !1 } = {}) => ({
	name: e,
	selector: sr,
	...t ? { advanced: t } : {},
	...n ? { required: n } : {}
}), cr = (e) => ({
	name: e,
	selector: { entity: { domain: "binary_sensor" } }
}), lr = (e) => ({
	name: e,
	selector: { entity: { domain: [
		"sensor",
		"binary_sensor",
		"switch"
	] } }
}), ur = (e) => ({
	name: e,
	selector: { entity: { domain: [
		"sensor",
		"fan",
		"select"
	] } }
}), dr = (e) => ({
	name: e,
	selector: { entity: { domain: [
		"sensor",
		"binary_sensor",
		"select"
	] } }
}), fr = (e, t) => ({
	name: e,
	advanced: !0,
	default: t.default,
	selector: { text: { multiple: !0 } }
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
}), pr = (e, t, { advanced: n = !1 } = {}) => ({
	name: e,
	default: t.default,
	selector: { boolean: {} },
	...n ? { advanced: n } : {}
}), mr = (e, t, n, { advanced: r = !0 } = {}) => ({
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
}), hr = {
	type: "expandable",
	name: "fans",
	schema: [V("supply_flow", { required: !0 })]
}, gr = {
	type: "expandable",
	name: "bypass",
	schema: [V("position")]
}, _r = {
	type: "expandable",
	name: "calculation",
	flatten: !0,
	schema: [U("smoothing", R.smoothing, 1, "min"), U("air_density", R.airDensity, .01, "kg/m³")]
}, vr = [
	H("outdoor", { requiredTemperature: !1 }),
	H("supply", { requiredTemperature: !1 }),
	H("extract", { requiredTemperature: !1 }),
	hr,
	gr,
	_r,
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
function yr(e) {
	let t = /* @__PURE__ */ new Set(), n = (e) => {
		for (let r of Object.values(e)) if (typeof r == "object" && r && !Array.isArray(r)) n(r);
		else {
			let e = gt(r);
			e !== void 0 && t.add(e);
		}
	};
	return n(e), [...t];
}
function br(e, t) {
	return e === t || Array.isArray(e) && Array.isArray(t) && e.length === t.length && e.every((e, n) => e === t[n]);
}
function xr(e, t) {
	if (e === t) return !0;
	if (typeof e != "object" || typeof t != "object" || e === null || t === null) return !1;
	let n = Object.keys(e), r = Object.keys(t);
	return n.length === r.length && n.every((n) => Object.hasOwn(t, n) && br(e[n], t[n]));
}
function Sr(e, t, n) {
	return e === void 0 || e.locale !== t.locale || e.language !== t.language || e.localize !== t.localize || e.formatEntityState !== t.formatEntityState || e.themes?.darkMode !== t.themes?.darkMode || n.some((n) => e.states[n] !== t.states[n] || !xr(e.entities?.[n], t.entities?.[n]));
}
function Cr(e, t, n, r) {
	return e.size === 1 && e.has("hass") ? t !== void 0 && Sr(n, t, r) : !0;
}
//#endregion
//#region src/lib/sample.ts
var G = (e) => `hrv_sample.${e.replace(".", "_")}`, wr = {
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
}, Tr = (e) => typeof e == "object" && !!e && !Array.isArray(e), Er = (e) => e == null || typeof e == "string" && e.trim() === "", Dr = (e, t) => ({
	...e,
	...Object.fromEntries(Object.entries(t).flatMap(([t, n]) => {
		let r = e[t];
		return Er(n) || Tr(r) && !Tr(n) ? [] : [[t, Tr(n) && Tr(r) ? Dr(r, n) : n]];
	}))
}), Or = (e) => Object.keys(Et).some((t) => !Er(O(e, t))), kr = (e) => Dr(wr, e), Ar = [
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
], jr = "2026-01-01T12:00:00Z", Mr = Object.fromEntries(Ar.map(([e, t, n]) => [G(e), {
	entity_id: G(e),
	state: t,
	last_updated: jr,
	attributes: n === void 0 ? {} : { unit_of_measurement: n }
}]));
//#endregion
//#region src/cards/base-card.ts
function Nr(e, t, n) {
	let r = St(e, t);
	if (r.length > 0) throw Error(Dt(r));
	let i = mn(e, n);
	if (i.length > 0) throw Error(i.join("; "));
}
var Pr = o`
  .sample-note {
    margin-top: 4px;
    text-align: right;
    font-size: 12px;
    color: var(--secondary-text-color);
  }
`, Fr = class extends Be {
	constructor(...e) {
		super(...e), this.sample = !1, this.entityIds = [];
	}
	static getStubConfig() {
		return {};
	}
	setConfig(e) {
		let t = !Or(e), n = t ? kr(e) : e;
		this.check(n);
		let r = t ? {
			...n,
			smoothing: 0
		} : e;
		this.configure(r), this.calculator = Pn(r), this.entityIds = yr(r), this.sample = t, this.shown = void 0, this.config = r;
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
					...Mr
				}
			}
		}), this.shown.hass);
	}
	sampleNote() {
		return this.sample ? S`<div class="sample-note">${Ot}</div>` : w;
	}
	connectedCallback() {
		super.connectedCallback(), this.unsubscribe = jn.subscribe(() => {
			this.requestUpdate();
		});
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.unsubscribe?.(), this.unsubscribe = void 0;
	}
	shouldUpdate(e) {
		return Cr(e, this.hass, this.rendered, this.entityIds);
	}
	updated() {
		this.rendered = this.hass;
	}
};
P([dt({ attribute: !1 })], Fr.prototype, "hass", void 0), P([ft()], Fr.prototype, "config", void 0);
//#endregion
//#region src/cards/bar-card.ts
var Ir = class extends Fr {
	static {
		this.styles = [qn, Pr];
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
}, Lr = "hrv-moisture-balance-card";
function Rr(e) {
	Nr(e, Zn, Qn);
}
Ct(Lr, class extends Ir {
	static {
		this.styles = [Ir.styles, o`
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
		let e = document.createElement(Zt);
		return e.schema = vr, e;
	}
	contentSize() {
		return 5;
	}
	check(e) {
		Rr(e);
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
		if (!this.config || !e || !this.calculator || !this.settings) return w;
		let { inputs: t } = this.calculator(e), n = t.absoluteHumidity, r = t.bypass === void 0 ? void 0 : ct(n, t.supplyFlow), i = or(r, r && n?.extract !== void 0 && n.outdoor !== void 0 ? {
			indoor: n.extract,
			outdoor: n.outdoor
		} : void 0, t.bypass, this.settings, Hn(e));
		return S`<ha-card>
      <div class="head">
        <span class="title-block">
          <span class="title">${i.title}</span>
          ${i.subtitle ? S`<span class="subtitle">${i.subtitle}</span>` : w}
        </span>
        <span class="net" style=${E({ color: i.headerColor ?? "var(--secondary-text-color)" })}
          >${i.header}</span
        >
      </div>
      ${Yn([i.segments])}
      ${i.bypass ? S`<div class="bypass">
              <div class="bypass-strip">
                <div
                  class="bypass-fill"
                  style=${E({
			width: `${String(i.bypass.position)}%`,
			background: $n
		})}
                ></div>
              </div>
              <span>${i.bypass.text}</span>
            </div>` : w}
      <div class="legend">
        ${i.swatches ? S`<span class="swatches">
                <span class="item">${Xn(i.swatches.color)}${i.swatches.recovered}</span>
                <span class="item">${Xn(Kn(i.swatches.color))}${i.swatches.outside}</span>
              </span>` : w}
        ${i.lines.map((e) => S`<span>${e}</span>`)}
      </div>
      ${this.sampleNote()}
    </ha-card>`;
	}
});
//#endregion
//#region src/cards/recovery-view.ts
var zr = {
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
}, Br = (e, t) => ({
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
	heatingColor: Br("heating.color", "#db4437"),
	heatingLatent: Br("heating.color_latent", "#f4a09a"),
	coolingColor: Br("cooling.color", "#039be5"),
	coolingLatent: Br("cooling.color_latent", "#8fd3f7")
}, Vr = Object.values(K);
function Hr(e, t, n) {
	if (e === void 0) return {
		title: j.titleNoValue,
		header: "n/a",
		lanes: [],
		legend: []
	};
	let { color: r, latent: i } = t.colors[e.mode], a = (e) => z(e, n), { recovered: o, potential: s, parts: c } = tt(e), { recovered: l, lost: u } = c, d = (e, t, n) => ({
		values: [e, t],
		backgrounds: [n, Kn(n)]
	}), f = [d(l.sensible, u.sensible, r)];
	e.latentKnown && f.push(d(l.latent, u.latent, i));
	let p = Math.max(...f.map(({ values: e }) => Rn(e, t.minScale))), m = f.map(({ values: e, backgrounds: t }) => zn(e, p).map((e, n) => ({
		...e,
		background: t[n] ?? r
	}))), [h, g] = e.freeCooling ? [j.headerFreeCooling, j.headerFreeCoolingNoPotential] : [j.header, j.headerNoPotential], _ = s > 0 ? h(a(o), a(s), z(o / s * 100, n)) : g(a(o)), [ee, v] = e.freeCooling ? [j.cooling, j.missed] : [j.recovered, j.lost], y = [{
		kind: "part",
		color: r,
		label: j.laneSensible,
		recovered: ee(a(l.sensible)),
		lost: v(a(u.sensible))
	}];
	return e.latentKnown && y.push({
		kind: "part",
		color: i,
		label: j.laneLatent,
		recovered: ee(a(l.latent)),
		lost: v(a(u.latent))
	}), y.push({
		kind: "text",
		text: j.scale(a(p))
	}), {
		title: j.titles[et(e)],
		header: _,
		headerColor: r,
		lanes: m,
		legend: y
	};
}
//#endregion
//#region src/editor/recovery-schema.ts
var Ur = [
	H("outdoor", { requiredTemperature: !0 }),
	H("supply", { requiredTemperature: !0 }),
	H("extract", { requiredTemperature: !0 }),
	hr,
	gr,
	_r,
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
], Wr = "hrv-recovery-balance-card";
function Gr(e) {
	Nr(e, zr, Vr);
}
Ct(Wr, class extends Ir {
	constructor(...e) {
		super(...e), this.minScale = K.minScale.default;
	}
	static {
		this.styles = [Ir.styles, o`
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
		let e = document.createElement(Zt);
		return e.schema = Ur, e;
	}
	check(e) {
		Gr(e);
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
		if (!this.config || !e || !this.calculator || !this.colors) return w;
		let { result: t } = this.calculator(e), n = Hr(t, {
			colors: this.colors,
			minScale: this.minScale
		}, Hn(e)), r = n.legend.filter((e) => e.kind === "part"), i = n.legend.filter((e) => e.kind === "text");
		return S`<ha-card>
      <div class="head">
        <span class="title">${n.title}</span>
        <span class="net" style=${E({ color: n.headerColor ?? "var(--secondary-text-color)" })}
          >${n.header}</span
        >
      </div>
      ${Yn(n.lanes)}
      <div class="legend">
        <div class="parts">
          ${r.map((e) => S`<div class="part">
                <span class="lane-name">${e.label}</span>
                <span class="item">${Xn(e.color)}${e.recovered}</span>
                <span class="item">${Xn(Kn(e.color))}${e.lost}</span>
              </div>`)}
        </div>
        ${i.map((e) => S`<span>${e.text}</span>`)}
      </div>
      ${this.sampleNote()}
    </ha-card>`;
	}
});
//#endregion
//#region node_modules/lit-html/directives/if-defined.js
var q = (e) => e ?? w, Kr = {
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
}, qr = { paths: Kr.paths }, Jr = (e) => St(e, Kr).length === 0, Yr = (e) => St(e, qr).length === 0, Xr = (e, t) => e === "cooling" ? t.cold : t.warm;
function Zr(e, t, n) {
	if (e === void 0) return t.showUnavailable ? {
		kind: "grey",
		text: "n/a"
	} : void 0;
	let r = N.saving(z(e.saving, n));
	return e.saving <= .5 ? {
		kind: "grey",
		text: r
	} : {
		kind: e.mode === "heating" ? "warm" : "cold",
		text: r,
		tint: Xr(e.mode, t.colors)
	};
}
function Qr(e, t, n) {
	if (e === void 0) return;
	let { heating: r, cooling: i } = t;
	if (r !== void 0 && i !== void 0) {
		let [e, t] = [r, i].map((e) => L(n[e], "power"));
		if (e !== void 0 && t !== void 0 && e !== t) return e > t ? r : i;
	}
	return t[e.mode];
}
function $r(e, t, n) {
	if (t.exchanger !== "erv" || !t.badge) return;
	let r = e?.moisture?.recovered;
	if (r === void 0) return t.showUnavailable ? {
		text: "n/a",
		title: N.moistureNoValue
	} : void 0;
	let i = z(Math.abs(r), n), a = Math.round(r) < 0, o = N.moisture(i);
	return {
		text: i,
		unit: N.moistureUnit,
		icon: a ? N.moistureKeptOutIcon : N.moistureRecoveredIcon,
		title: a ? N.moistureKeptOut(o) : N.moistureRecovered(o)
	};
}
function ei(e, t, n, r) {
	let i = (e) => e === void 0 ? N.effectivenessNoValue : N.effectivenessPercent(z(e, r)), a = (e, t = !1) => z(t && Math.round(e) !== 0 ? -Math.abs(e) : Math.abs(e), r), o = e?.effectiveness.total, s = e && o !== void 0 ? tt(e) : void 0, c = e?.effectiveness.moisture === void 0 ? void 0 : e.moisture, l = e && N.effectivenessKinds[et(e)], u = t !== void 0 && t > 0;
	return N.effectiveness(N.effectivenessFigure(l, i(o), s && N.effectivenessAbsolute(a(s.recovered, s.recovered < 0), a(s.potential), N.powerUnit)), n ? N.effectivenessFigure(void 0, i(e?.effectiveness.moisture), c && N.effectivenessAbsolute(a(c.recovered, c.recovered * c.extracted < 0), a(c.extracted), N.moistureUnit)) : void 0, u ? t >= 1 ? z(t, r) : z(Math.max(t, .1), r, 1) : void 0);
}
//#endregion
//#region src/diagram/drawing.ts
var J = {
	width: 400,
	height: 200
}, ti = 14, Y = {
	x: 86,
	y: 62
}, X = {
	x: 306,
	y: 138
}, ni = 34, ri = Y.x + ni, ii = X.x - ni, ai = (e) => J.width - e, oi = `C ${String(ri + 51)} ${String(Y.y)} ${String(ii - 46)} ${String(X.y)} ${String(ii)} ${String(X.y)}`, si = `C ${String(ri + 20)} ${String(Y.y)} ${String(ri + 5)} 192 200 192 C ${String(ii - 23)} 192 ${String(ii - 18)} ${String(X.y)} ${String(ii)} ${String(X.y)}`, ci = (e) => `M ${String(Y.x)} ${String(Y.y)} L ${String(ri)} ${String(Y.y)} ${e} L ${String(X.x)} ${String(X.y)}`, li = {
	supply: ci(oi),
	exhaust: `M ${String(ai(Y.x))} ${String(Y.y)} L ${String(ai(ri))} ${String(Y.y)} C ${String(ai(ri + 51))} ${String(Y.y)} ${String(ai(ii - 46))} ${String(X.y)} ${String(ai(ii))} ${String(X.y)} L ${String(ai(X.x))} ${String(X.y)}`,
	bypass: ci(si)
}, Z = (e, t) => Math.round(e * 10 ** t) / 10 ** t, ui = {
	supply: "306,124 326,138 306,152",
	exhaust: "94,124 74,138 94,152"
}, di = "175.8,26 224.2,26 255,100 224.2,174 175.8,174 145,100", fi = "181.3,38 218.7,38 240.7,100 218.7,162 181.3,162 159.3,100", pi = {
	d: "M 200 32 L 221.45 32 L 247.85 100 L 221.45 168 L 178.55 168 L 152.15 100 L 178.55 32 Z",
	width: 14
}, mi = {
	d: "M 200 38 L 218.7 38 L 240.7 100 L 218.7 162 L 181.3 162 L 159.3 100 L 181.3 38 Z",
	width: 3
}, hi = "M 175.8 26 L 224.2 26 L 255 100 L 224.2 174 L 175.8 174 L 145 100 Z M 181.3 38 L 218.7 38 L 240.7 100 L 218.7 162 L 181.3 162 L 159.3 100 Z", gi = 45, _i = {
	from: Y.x + 11.600000000000001 / 2,
	to: ri - 11.600000000000001 / 2
}, vi = 5, yi = 48, bi = 3, xi = bi * 1.5, Si = 1.5;
function Ci() {
	return Array.from({ length: 49 }, (e, t) => {
		let n = t / yi, r = ti / 2 * -Math.cos(vi * Math.PI * n);
		return {
			x: Z(_i.from + (_i.to - _i.from) * n, 2),
			y: Z(Y.y + r, 2)
		};
	});
}
var wi = Ci().map(({ x: e, y: t }, n) => `${n === 0 ? "M" : "L"} ${String(e)} ${String(t)}`).join(" ");
function Ti() {
	let e = Ci(), [t, n] = [e.map((e) => e.x), e.map((e) => e.y)], r = 6.75, [i, a] = [Math.min(...t) - r, Math.min(...n) - r];
	return {
		x: i,
		y: a,
		width: Math.max(...t) + r - i,
		height: Math.max(...n) + r - a
	};
}
function Ei() {
	let e = Ti(), t = (e, t) => `${String(Z(e / t * 100, 2))}%`;
	return {
		left: t(e.x, J.width),
		top: t(e.y, J.height),
		width: t(e.width, J.width),
		height: t(e.height, J.height)
	};
}
var Di = 45, Oi = "M 6.5 18 A 4.5 4.5 0 0 1 6 9.05 A 6 6 0 0 1 17.5 10 A 4 4 0 0 1 17.5 18 Z", ki = "M 12 4 L 21 12 L 18 12 L 18 20 L 14 20 L 14 15 L 10 15 L 10 20 L 6 20 L 6 12 L 3 12 Z", Ai = 0;
function ji() {
	Ai += 1;
	let e = String(Ai);
	return {
		supply: `hrv-supply-${e}`,
		exhaust: `hrv-exhaust-${e}`,
		rim: `hrv-rim-${e}`,
		blur: `hrv-blur-${e}`
	};
}
var Mi = 1.5;
function Ni(e, t) {
	let n = t > 0 ? Z(Mi / t, 3) : Mi;
	return {
		[`--${e}-duration`]: `${String(n)}s`,
		[`--${e}-state`]: t > 0 ? "running" : "paused"
	};
}
function Pi(e, t, n) {
	if (n <= 0) return null;
	let r = e === "exhaust" ? "exhaust" : "supply";
	return C`<path class="stream ${e}" d=${li[e]} stroke=${t} stroke-width=${ti}
      opacity=${n}></path>
    <path class="flow ${r}-air" d=${li[e]} opacity=${n}></path>`;
}
var Fi = (e, t) => C`<stop offset=${e} style=${E({ "stop-color": t })}></stop>`, Ii = (e, t, n) => C`<g class="symbol">
    <circle cx=${e} cy="100" r="20" style=${E({ fill: t })}></circle>
    <path d=${n} transform="translate(${String(e - 12)} ${"88"})"></path>
  </g>`, Li = (e) => `${String(Z(e ?? 0, 2))} 100`;
function Ri(e, t) {
	return C`<path class="ring moisture" d=${pi.d} fill="none" stroke-width=${pi.width}
    pathLength="100" stroke-dasharray=${Li(t)} clip-path="url(#${e})"></path>`;
}
function zi(e, t) {
	let { d: n, width: r } = mi, i = `color-mix(in srgb, ${e} ${String(gi)}%, var(--primary-text-color))`;
	return C`<path class="ring-track total" d=${n} fill="none" stroke-width=${r}
      style=${E({ stroke: `color-mix(in srgb, ${i} 25%, var(--secondary-background-color))` })}></path>
    <path class="ring total" d=${n} fill="none" stroke-width=${r} pathLength="100" stroke-dasharray=${Li(t)}
      style=${E({ stroke: i })}></path>`;
}
var Bi = (e) => 30 + 70 * e;
function Vi({ level: e, color: t }, n) {
	if (e <= 0) return C`<path class="coil off" d=${wi} fill="none" stroke-width=${bi} stroke-linejoin="round"></path>`;
	let r = Bi(e), i = `color-mix(in srgb, ${`color-mix(in srgb, ${t} ${String(Z(r, 1))}%, var(--secondary-text-color))`} ${String(Z(100 - Di * e, 1))}%, white)`, a = String(Z(r / 100, 3));
	return C`<path class="coil-glow" d=${wi} fill="none" stroke-width=${xi} stroke-linejoin="round"
      filter="url(#${n})" opacity=${a}
      style=${E({
		stroke: t,
		"--glow-opacity": a
	})}></path>
    <path class="coil on" d=${wi} fill="none" stroke-width=${bi} stroke-linejoin="round"
      style=${E({ stroke: i })}></path>`;
}
function Hi(e) {
	let { x: t, y: n, width: r, height: i } = Ti();
	return C`<filter id=${e} filterUnits="userSpaceOnUse" x=${t} y=${n} width=${r} height=${i}>
    <feGaussianBlur stdDeviation=${Si}></feGaussianBlur>
  </filter>`;
}
function Ui({ ids: e, exchanger: t, colors: n, bypass: r, speeds: i, rings: a, coil: o }) {
	let [s, c] = [Z(r, 3), Z(1 - r, 3)], l = `url(#${e.supply})`, u = `url(#${e.exhaust})`;
	return C`<svg
    class="art"
    viewBox="0 0 ${String(J.width)} ${String(J.height)}"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    style=${E({
		...Ni("supply", i.supply),
		...Ni("exhaust", i.exhaust)
	})}
  >
    <defs>
      <linearGradient id=${e.supply} gradientUnits="userSpaceOnUse" x1="86" y1="62" x2="326" y2="138">
        ${Fi("0", n.outdoor)}${Fi("1", n.supply)}
      </linearGradient>
      <linearGradient id=${e.exhaust} gradientUnits="userSpaceOnUse" x1="314" y1="62" x2="74" y2="138">
        ${Fi("0", n.extract)}${Fi("1", n.exhaust)}
      </linearGradient>
      <clipPath id=${e.rim}><path d=${hi} clip-rule="evenodd"></path></clipPath>
      ${o ? Hi(e.blur) : null}
    </defs>
    ${Ii(36, n.outdoor, Oi)}
    ${Ii(364, n.extract, ki)}
    <polygon class="exchanger ${t}" points=${di}></polygon>
    ${a?.moisture ? Ri(e.rim, a.moisture.figure) : null}
    <polygon class="outline" points=${di}></polygon>
    <polygon class="exchanger-inner" points=${fi}></polygon>
    ${a ? zi(a.color, a.total) : null}
    ${Pi("bypass", l, s)}
    ${Pi("supply", l, c)}
    ${o ? Vi(o, e.blur) : null}
    <polygon class="head" points=${ui.supply} style=${E({ fill: n.supply })}></polygon>
    ${Pi("exhaust", u, 1)}
    <polygon class="head" points=${ui.exhaust} style=${E({ fill: n.exhaust })}></polygon>
  </svg>`;
}
//#endregion
//#region src/diagram/flow.ts
var Wi = .25;
function Gi(e, t) {
	let n = It(e);
	return n === void 0 ? 1 : n <= 0 ? 0 : t === void 0 || t <= 0 ? 1 : Math.min(Math.max(n / t, Wi), 2);
}
function Ki(e, t) {
	if (e === void 0 || Pt(e)) return !1;
	let n = e.state.trim().toLowerCase();
	return t.some((e) => e.trim().toLowerCase() === n);
}
//#endregion
//#region src/diagram/preheater.ts
var qi = .1;
function Ji(e, t) {
	let n = L(e && {
		state: e.state,
		attributes: e.attributes ?? {}
	}, "power");
	return n === void 0 ? +(e?.state === "on") : n <= 0 ? 0 : t === void 0 ? 1 : Math.min(Math.max(n / t, qi), 1);
}
function Yi(e) {
	return Ji(e, void 0) > 0;
}
function Xi(e, t) {
	return e === "auto" ? t !== void 0 && t > 0 && t < 340 : e === "compact";
}
var Zi = ["status.power", "status.rmot"], Qi = ["seasons.heating", "seasons.cooling"], $i = ["fans.supply_flow", "fans.exhaust_flow"], ea = [
	"fans.level",
	"bypass.mode",
	"bypass.next_change",
	"status.operating_mode",
	"status.target_temperature",
	"status.temperature_profile",
	"status.next_fan_change",
	"status.filter_days",
	"pre_heater.energy"
], ta = {
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
}, na = { "status.rmot": N.prefixes.rmot }, ra = {
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
}, ia = /* @__PURE__ */ new Set(["bypass.next_change", "status.next_fan_change"]), aa = (e) => e.trim().toLowerCase() === "n/a";
function oa(e, t) {
	return ia.has(e) && (aa(t?.state ?? "") || t?.state === "unknown");
}
function sa(e, t, n) {
	return oa(e, t) ? !0 : e === "bypass.position" && It(t) === 0 ? !1 : n || !Pt(t);
}
function ca(e, t, { showUnavailable: n, compact: r }) {
	let i = (r) => r.flatMap((r) => {
		let i = k(e, r);
		if (i === void 0) return [];
		let a = t[i], o = sa(r, a, n), s = ra[r];
		return [{
			role: r,
			entityId: i,
			...s === void 0 ? {} : { icon: s },
			prefix: na[r] ?? "",
			visible: o,
			...oa(r, a) ? { notPlanned: !0 } : {}
		}];
	}), a = (t) => t.some((t) => k(e, t) !== void 0), o = {
		corners: mt((e) => i(r ? [`${e}.temperature`, `${e}.humidity`] : [
			`${e}.temperature`,
			`${e}.humidity`,
			`${e}.absolute_humidity`
		])),
		centre: i(["bypass.position"]),
		flows: r ? [] : i($i)
	};
	if (a([
		...Zi,
		...Qi,
		"pre_heater.power"
	])) {
		let n = k(e, "pre_heater.power");
		o.top = i(n !== void 0 && Yi(t[n]) ? [
			"status.power",
			"pre_heater.power",
			"status.rmot"
		] : Zi);
	}
	return r || a(ea) && (o.status = i(ea)), o;
}
//#endregion
//#region src/diagram/options.ts
var la = { paths: [
	"outdoor.temperature",
	"supply.temperature",
	"extract.temperature",
	"exhaust.temperature"
] }, ua = [
	"auto",
	"full",
	"compact"
], da = ["hrv", "erv"], Q = {
	...R,
	exchangerType: {
		kind: "choice",
		path: "exchanger_type",
		choices: da,
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
		choices: ua,
		default: "auto"
	},
	showUnavailable: {
		kind: "boolean",
		path: "show_unavailable",
		default: !1
	}
}, fa = Object.values(Q), pa = {
	heating: "mdi:sun-thermometer",
	cooling: "mdi:snowflake-thermometer",
	between: "mdi:sun-snowflake-variant"
};
function ma(e, t, n) {
	let r = k(e, "seasons.heating"), i = k(e, "seasons.cooling"), a = (e) => t[e]?.state, o = (e, t, n) => ({
		season: e,
		icon: pa[e],
		color: t,
		title: N.seasons[e],
		entityId: n
	});
	if (r !== void 0 && a(r) === "on") return o("heating", n.warm, r);
	if (i !== void 0 && a(i) === "on") return o("cooling", n.cold, i);
	if (r !== void 0 && i !== void 0 && a(r) === "off" && a(i) === "off") return o("between", "var(--secondary-text-color)", r);
}
//#endregion
//#region src/diagram/streams.ts
var ha = "var(--disabled-text-color, #9e9e9e)", ga = 10;
function _a(e) {
	let t = It(e);
	return t === void 0 ? 0 : Math.min(Math.max(t / 100, 0), 1);
}
function va(e) {
	let t = mt((t) => L(e[t], "temperature")), n = Object.values(t).filter((e) => e !== void 0), r = Math.min(...n), i = Math.max(...n), a = Math.max(i - r, ga), o = (r + i) / 2 - a / 2, s = (e) => e === void 0 ? void 0 : Math.min(Math.max((e - o) / a, 0), 1);
	return mt((e) => s(t[e]));
}
function ya(e, t) {
	if (e === void 0) return ha;
	let n = Math.round(e * 1e3) / 10;
	return n <= 0 ? t.cold : n >= 100 ? t.warm : `color-mix(in srgb, ${t.warm} ${String(n)}%, ${t.cold})`;
}
function ba(e, t) {
	let n = va(e);
	return mt((e) => ya(n[e], t));
}
//#endregion
//#region src/editor/diagram-schema.ts
var $ = { advanced: !0 }, xa = [
	mr("exchanger_type", Q.exchangerType, At.exchangerTypes, { advanced: !1 }),
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
			ur("level"),
			dr("ventilation_mode"),
			fr("stopped_states", Q.stoppedStates),
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
			lr("power"),
			V("energy"),
			U("max_power", Q.preHeaterMaxPower, 1, "W"),
			W("glow_color", Q.preHeaterGlowColor.default)
		]
	},
	{
		type: "expandable",
		name: "seasons",
		schema: [cr("heating"), cr("cooling")]
	},
	{
		type: "expandable",
		name: "animation",
		schema: [pr("enabled", Q.animation), U("nominal_flow", Q.nominalFlow, 1)]
	},
	pr("show_effectiveness", Q.showEffectiveness),
	_r,
	{
		type: "expandable",
		name: "colors",
		schema: [W("cold", Q.cold.default), W("warm", Q.warm.default)]
	},
	mr("layout", Q.layout, At.layouts),
	pr("show_unavailable", Q.showUnavailable, $)
], Sa = (e, t) => t === void 0 ? void 0 : e[t];
function Ca(e, t) {
	let n = e.states[t];
	if (n === void 0) return "n/a";
	if (typeof e.formatEntityState == "function") return e.formatEntityState(n);
	let r = n.attributes.unit_of_measurement;
	return r && !Pt(n) ? `${n.state} ${r}` : n.state;
}
function wa(e) {
	if (e === void 0 || !e.entity_id.startsWith("fan.") || Pt(e)) return;
	let { percentage: t, percentage_step: n } = e.attributes;
	return typeof t != "number" || !Number.isFinite(t) || typeof n != "number" || !Number.isFinite(n) || n <= 0 ? void 0 : Math.round(100 / n) === 3 ? wt[Math.min(3, Math.max(+(t > 0), Math.round(t / n)))] : `${String(Math.round(t))} %`;
}
//#endregion
//#region src/cards/ventilation-card.ts
var Ta = "hrv-ventilation-card";
function Ea(e) {
	Nr(e, la, fa);
}
var Da = 400, Oa = (e, t) => {
	let n = Et[e];
	return `${n.charAt(0).toUpperCase()}${n.slice(1)}: ${t}`;
}, ka = class extends Fr {
	constructor(...e) {
		super(...e), this.compact = !1, this.observer = new ResizeObserver((e) => {
			this.width = e[0]?.contentRect.width, this.updateCompact();
		}), this.ids = ji(), this.activate = (e) => {
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
    @container (max-width: ${Da}px) {
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
    ${Pr}
  `;
	}
	static getConfigElement() {
		let e = document.createElement(Zt);
		return e.schema = xa, e;
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
		Ea(e);
	}
	configure(e) {
		let t = k(e, "pre_heater.power");
		this.settings = {
			exchanger: I(e, Q.exchangerType),
			colors: {
				cold: I(e, Q.cold),
				warm: I(e, Q.warm)
			},
			layout: I(e, Q.layout),
			showUnavailable: I(e, Q.showUnavailable),
			badge: Jr(e),
			savings: {
				heating: k(e, "status.heating_saving"),
				cooling: k(e, "status.cooling_saving")
			},
			moistureRecovery: k(e, "status.moisture_recovery"),
			preHeater: t ? {
				entityId: t,
				maxPower: I(e, Q.preHeaterMaxPower),
				glowColor: I(e, Q.preHeaterGlowColor)
			} : void 0,
			rings: I(e, Q.showEffectiveness) && Yr(e) ? { moisture: I(e, Q.exchangerType) === "erv" && bt(e, [
				"outdoor",
				"supply",
				"extract"
			]) } : void 0,
			temperatures: mt((t) => k(e, `${t}.temperature`)),
			bypass: k(e, "bypass.position"),
			flows: {
				supply: k(e, "fans.supply_flow"),
				exhaust: k(e, "fans.exhaust_flow")
			},
			ventilationMode: k(e, "fans.ventilation_mode"),
			stoppedStates: I(e, Q.stoppedStates),
			animate: I(e, Q.animation),
			nominalFlow: I(e, Q.nominalFlow)
		}, this.updateCompact();
	}
	updateCompact() {
		if (!this.settings) return;
		let e = Xi(this.settings.layout, this.width);
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
		let t = this.shownHass, n = (t && e.role === "fans.level" ? this.disabled(t.states) ? "Stopped" : wa(t.states[e.entityId]) : void 0) ?? (t ? Ca(t, e.entityId) : ""), r = this.tap(e.entityId, "img"), [i = "", a = ""] = e.role.split("."), o = i === "pre_heater" ? `pre-heater-${a}` : a, s = e.icon ? S`<ha-icon .icon=${e.icon} aria-hidden="true"></ha-icon>` : w, c = S`<span class="value">${e.prefix}${e.notPlanned ? N.notPlanned : n}</span>`;
		return e.visible ? S`<span
      class="label ${o} ${e.notPlanned ? "not-planned" : ""}"
      role=${q(r.role)}
      tabindex=${q(r.tabindex)}
      aria-label="${Et[e.role]}: ${n}"
      title=${Oa(e.role, n)}
      data-entity=${q(r.entity)}
      >${s}${c}</span
    >` : S`<span class="label ${o} hidden" aria-hidden="true">${s}${c}</span>`;
	}
	disabled(e) {
		let { ventilationMode: t, stoppedStates: n } = this.settings ?? { stoppedStates: [] };
		return t !== void 0 && Ki(e[t], n);
	}
	alert(e, t) {
		let n = this.tap(e, "img"), r = `${Tt}: ${t}`;
		return S`<div
      class="on-drawing alert"
      role=${q(n.role)}
      tabindex=${q(n.tabindex)}
      aria-label=${r}
      title=${r}
      data-entity=${q(n.entity)}
    >
      <ha-icon icon="mdi:alert" aria-hidden="true"></ha-icon><span>${Tt}</span>
    </div>`;
	}
	topRow(e, t) {
		let n = (t) => {
			let n = e.find((e) => e.role === t);
			return n ? this.label(n) : w;
		}, r = e.some((e) => e.role === "pre_heater.power"), i = e.find((e) => e.role === "status.power"), a = r && i && !i.visible ? w : n("status.power");
		return S`<div class="row top">
      <span>${this.season(t)}</span><span class="centre">${a}${n("pre_heater.power")}</span
      ><span>${n("status.rmot")}</span>
    </div>`;
	}
	statusGrid(e) {
		return S`<div class="status">
      ${e.map((e) => {
			let t = ta[e.role];
			return S`<div
          class="cell"
          style=${E({
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
		if (!e) return w;
		let t = this.tap(e.entityId, "img");
		return S`<ha-icon
      class="season"
      .icon=${e.icon}
      title=${e.title}
      aria-label=${e.title}
      role=${q(t.role)}
      tabindex=${q(t.tabindex)}
      data-entity=${q(t.entity)}
      style=${E({ color: e.color })}
    ></ha-icon>`;
	}
	badge(e, t) {
		if (!e) return w;
		let n = e.tint === void 0 ? {} : {
			"--badge-fill": `color-mix(in srgb, ${e.tint} 25%, var(--card-background-color, #fff))`,
			"--badge-border": e.tint
		}, r = this.tap(t);
		return S`<span
      class="badge ${e.kind}"
      role=${q(r.role)}
      tabindex=${q(r.tabindex)}
      data-entity=${q(r.entity)}
      style=${E(n)}
      >${e.text}</span
    >`;
	}
	moistureFigure(e) {
		if (!e) return w;
		let t = this.tap(this.settings?.moistureRecovery, "img");
		return S`<div class="on-drawing moisture-recovery">
      <span
        class="label figure"
        title=${e.title}
        aria-label=${e.title}
        role=${q(t.role)}
        tabindex=${q(t.tabindex)}
        data-entity=${q(t.entity)}
        >${e.icon ? S`<ha-icon .icon=${e.icon} aria-hidden="true"></ha-icon>` : w}<span class="value"
          ><span class="number">${e.text}</span>${e.unit ? S`<span class="unit">${e.unit}</span>` : w}</span
        ></span
      >
    </div>`;
	}
	coilBox(e, t) {
		let n = this.tap(e, "img"), r = Oa("pre_heater.power", t);
		return S`<div
      class="on-drawing pre-heater"
      role=${q(n.role)}
      tabindex=${q(n.tabindex)}
      aria-label=${r}
      title=${r}
      data-entity=${q(n.entity)}
      style=${E(Ei())}
    ></div>`;
	}
	render() {
		let e = this.shownHass;
		if (!this.config || !e || !this.settings) return w;
		let { settings: t } = this, { compact: n } = this, r = ca(this.config, e.states, {
			showUnavailable: t.showUnavailable,
			compact: n
		}), i = ma(this.config, e.states, t.colors), a = (t.badge || t.rings) && this.calculator ? this.calculator(e) : void 0, o = a?.result, s = Hn(e), c = t.badge ? Zr(o, t, s) : void 0, l = $r(o, t, s), { states: u } = e, { temperatures: d, flows: f } = t, { rings: p } = t, m = p ? ei(o, a?.inputs.bypass, p.moisture, s) : void 0, { preHeater: h, ventilationMode: g } = t, _ = this.disabled(u), ee = Ui({
			ids: this.ids,
			exchanger: t.exchanger,
			colors: ba(mt((e) => Sa(u, d[e])), t.colors),
			bypass: _a(Sa(u, t.bypass)),
			speeds: {
				supply: _ ? 0 : Gi(Sa(u, f.supply), t.nominalFlow),
				exhaust: _ ? 0 : Gi(Sa(u, f.exhaust), t.nominalFlow)
			},
			rings: p ? {
				total: o?.effectiveness.total,
				moisture: p.moisture ? { figure: o?.effectiveness.moisture } : void 0,
				color: Xr(o?.mode, t.colors)
			} : void 0,
			coil: h ? {
				level: Ji(Sa(u, h.entityId), h.maxPower),
				color: h.glowColor
			} : void 0
		});
		return S`<ha-card @click=${this.activate} @keydown=${this.activate}>
      ${r.top ? this.topRow(r.top, i) : w}
      <div class="drawing ${t.animate ? "" : "still"} ${r.top ? "" : "no-top"}">
        ${ee}
        ${pt.map((e) => S`<div class="corner ${e}">${r.corners[e].map((e) => this.label(e))}</div>`)}
        ${m === void 0 ? w : S`<div class="on-drawing effectiveness" role="img" aria-label=${m} title=${m}></div>`}
        ${h ? this.coilBox(h.entityId, Ca(e, h.entityId)) : w}
        ${_ && g ? this.alert(g, Ca(e, g)) : w}
        <div class="on-drawing bypass-position">${r.centre.map((e) => this.label(e))}</div>
        ${c ? S`<div class="on-drawing saving">${this.badge(c, Qr(o, t.savings, u))}</div>` : w}
        ${this.moistureFigure(l)}
        ${r.flows.map((e) => S`<div class="on-drawing ${e.role === "fans.supply_flow" ? "supply-flow" : "exhaust-flow"}">
              ${this.label(e)}
            </div>`)}
      </div>
      ${r.status ? this.statusGrid(r.status) : w} ${this.sampleNote()}
    </ha-card>`;
	}
};
P([ft()], ka.prototype, "compact", void 0), Ct(Ta, ka);
//#endregion
//#region src/index.ts
var Aa = [
	{
		type: Ta,
		...kt.diagram,
		preview: !0
	},
	{
		type: Wr,
		...kt.recovery,
		preview: !0
	},
	{
		type: Lr,
		...kt.moisture,
		preview: !0
	}
];
function ja(e = window) {
	let t = e.customCards ??= [];
	for (let e of Aa) t.some((t) => t.type === e.type) || t.push({ ...e });
}
ja();
//#endregion
export { Aa as CARD_ENTRIES, ja as registerCardPicker };

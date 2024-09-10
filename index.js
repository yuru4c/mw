(function (global, $) {
'use strict';

var Pager = (function () {
	
	var RE_NAME = /^page-(.*)$/;
	var RE_HASH = /^#?(.*?)(?:&(.*))?$/;
	var RE_PARAM = /^(.*?)(?:=(.*))?$/;
	var RE_LIST = /\[\]$/;
	
	function Pager() {
		this.element = $.getElementById('pages');
		var styles = {};
		var children = this.element.children;
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
			var n = RE_NAME.exec(child.id);
			if (n != null) {
				styles[n[1]] = child.style;
			}
		}
		this._styles = styles;
		this._handlers = {};
		this.active = null;
	}
	var prototype = Pager.prototype;
	
	prototype.init = function () {
		var self = this;
		this.element.className = '';
		this._onchange();
		window.onhashchange = function () {
			return self._onchange();
		};
	};
	
	prototype.on = function (name, handler) {
		if (name in this._styles) {
			this._handlers[name] = handler;
		}
	};
	
	prototype.select = function (name, param) {
		var active = name || 'index';
		if (active in this._styles) {
			this.active = active;
			for (var key in this._styles) {
				this._styles[key].display = 'none';
			}
			this._styles[active].display = '';
			this._call(active, param);
			return true;
		}
		return false;
	};
	
	prototype.load = function (name, params) {
		var hash = name;
		if (params != null) {
			for (var key in params) {
				var value = params[key];
				if (RE_LIST.test(key)) {
					for (var i = 0; i < value.length; i++) {
						var item = value[i];
						hash += '&' + encode(key);
						if (item != null) {
							hash += '=' + encode(item);
						}
					}
				} else {
					hash += '&' + encode(key);
					if (value != null) {
						hash += '=' + encode(value);
					}
				}
			}
		}
		window.location.hash = hash;
	};
	
	prototype._call = function (name, param) {
		if (!(name in this._handlers)) return;
		var handler = this._handlers[name];
		var params = {};
		if (param != null) {
			var array = param.split('&');
			for (var i = 0; i < array.length; i++) {
				var p = RE_PARAM.exec(array[i]);
				if (p == null) continue;
				
				var key = decode(p[1]), value = decode(p[2]);
				if (RE_LIST.test(key)) {
					var list = key in params ?
						params[key] :
						params[key] = [];
					list.push(value);
				} else {
					params[key] = value;
				}
			}
		}
		handler(params);
	};
	
	prototype._onchange = function () {
		var h = RE_HASH.exec(window.location.hash);
		if (h != null) {
			return !this.select(h[1], h[2]);
		}
	};
	
	function encode(str) {
		return global.encodeURIComponent(str);
	}
	function decode(str) {
		return global.decodeURIComponent(str);
	}
	
	return Pager;
})();

var pager;

function init() {
	pager = new Pager();
	
	/* var onfocus = delay(function () {
		this.select();
	}, 1);
	var onblur = function () {
		this.type = 'text';
		this.setSelectionRange(0, 0);
		this.type = 'number';
	};
	var matches = $.querySelectorAll('input[type="number"]');
	for (var i = 0; i < matches.length; i++) {
		var input = matches[i];
		input.onfocus = onfocus;
		input.onblur = onblur;
	} */
}

function delay(handler, timeout) {
	var self;
	var id;
	var call = function () {
		if (id != null) {
			id = null;
			handler.call(self);
			self = null;
		}
	};
	return function () {
		self = this;
		if (id != null) {
			global.clearTimeout(id);
		}
		id = global.setTimeout(call, timeout);
	};
}

function parseInt(str) {
	return global.parseInt(str, 10);
}
function parseFloat(str) {
	return global.parseFloat(str);
}

var RE_PT = /^[^\.]*(\.\d{0,2})?/;
function pt(num, i) {
	var p = RE_PT.exec(num);
	if (p != null) {
		var s = p[i];
		if (s != null) return s;
	}
	return '';
}

function span(className) {
	var element = $.createElement('span');
	if (className != null) {
		element.className = className;
	}
	return element;
}

function write(min, sec, time) {
	var m = Math.floor(time / 60);
	var s = Math.floor(time % 60);
	min.textContent = m.toString();
	sec.textContent = (s < 10 ? '0' : '') + s + pt(time, 1);
}

function create(time) {
	var element = span('time');
	var min = element.appendChild(span('unit-min'));
	var sec = element.appendChild(span('unit-sec'));
	if (time == null) {
		element.className += ' time-zero';
	} else {
		write(min, sec, time);
	}
	return element;
}

var TimeInput = (function () {
	
	var LENGTH = 4;
	var RESET = function () { this.value = ''; };
	
	function TimeInput(labelId) {
		var self = this;
		var label = $.getElementById(labelId);
		label.className += ' timeinput';
		
		var input = $.createElement('input');
		input.type = 'number';
		input.oninput = RESET;
		input.onchange = RESET;
		input.onkeydown = function (event) {
			return self._onkeydown(event);
		};
		this._input = input;
		
		var clear = $.createElement('a');
		clear.className = 'timeinput-clear';
		clear.onclick = function () {
			return self._clear();
		};
		
		var min = span('timeinput-min');
		var sec = span('timeinput-sec');
		this._span = [
			min.appendChild(span()),
			min.appendChild(span()),
			sec.appendChild(span()),
			sec.appendChild(span())
		];
		this._setValue('');
		
		label.appendChild(input);
		label.appendChild(clear);
		label.appendChild(min);
		label.appendChild(sec);
	}
	var prototype = TimeInput.prototype;
	
	prototype.onInput = null;
	prototype.onReturn = null;
	
	prototype.set = function (sec) {
		if (sec == null) {
			this._setValue('');
		} else {
			var i = ~~sec, s = i % 60;
			this._setValue((i - s) / 60 + (s < 10 ? '0' : '') + s);
		}
	};
	prototype.get = function () {
		return this._value.valueOf();
	};
	
	prototype.focus = function () {
		this._input.focus();
	};
	
	prototype._setValue = function (str) {
		if (str.length <= 4) {
			this._value = new Value(str);
			var v = this._value.str;
			var l = v.length - LENGTH;
			
			this._span[0].textContent = v.substr(0, l + 1);
			for (var i = 1; i < LENGTH; i++) {
				var span = this._span[i];
				var c = v.charAt(l + i);
				span.textContent = c;
				span.className = c ? '' : 'timeinput-zero';
			}
		}
		if (this.onInput != null) {
			this.onInput();
		}
	};
	
	prototype._onkeydown = function (event) {
		var keyCode = event.keyCode;
		switch (keyCode) {
			case 0x08:
			this._setValue(this._value.str.slice(0, -1));
			return;
			
			case 0x0c: case 0x1b:
			this._setValue('');
			return;
			
			case 0x0d:
			if (this.onReturn != null) {
				this.onReturn();
			}
			return false;
		}
		switch (keyCode >>> 4) {
			case 0x3: case 0x6:
			var n = keyCode & 0x0f;
			if (n < 10) {
				this._setValue(this._value.str + n);
			}
			return;
		}
	};
	
	prototype._clear = function () {
		this._setValue('');
		this.focus();
		return false;
	};
	
	function Value(str) {
		this.min = ~~str.slice(0, -2);
		this.sec = ~~str.slice(-2);
		this.str = str.length == 0 ? '' :
			(100 * this.min + this.sec).toString();
	}
	Value.prototype.valueOf = function () {
		return this.str ? 60 * this.min + this.sec : null;
	};
	
	return TimeInput;
})();

var Game = (function () {
	
	function Game(num, step, max) {
		this.index = -1;
		this.results = [];
		this.results.length = num;
		this.time = null;
		
		this._s = step;
		this._t = max / step;
	}
	var prototype = Game.prototype;
	
	prototype.onProgress = null;
	
	prototype._round = null;
	prototype._started = null;
	
	prototype.start = function (from, to, round) {
		for (var i = 0; i < this.results.length; i++) {
			var r = 1 - Math.random();
			var q = this._s * Math.ceil(this._t * r);
			this.results[i] = new Result(q, from, to);
		}
		this._round = round;
		this._started = +new Date();
		this._next();
	};
	
	prototype.answer = function (time) {
		this.results[this.index].a = time;
		this._next();
	};
	
	prototype.abort = function () {
		this.index = this.results.length - 1;
		this._next();
	};
	
	prototype._next = function () {
		var r;
		this.index++;
		if (this.index < this.results.length) {
			r = this.results[this.index];
		} else {
			var t = new Date() - this._started;
			this.time = t > 0 ? t / 1000 : 0;
		}
		if (this.onProgress != null) {
			this.onProgress(r);
		}
	};
	
	function Result(q, from, to) {
		this.q = q;
		this.a = null;
		this.time = from * q / to;
	}
	Result.prototype.test = function (game) {
		switch (game._round) {
			case 0: return this.a == Math.ceil(this.time);
			case 1: return this.a == Math.round(this.time);
			case 2: return this.a == Math.floor(this.time);
		}
	};
	
	return Game;
})();

function initCalc() {
	var MAX = 10000;
	
	var calcDefWatt = $.getElementById('calc-def-watt');
	var calcDefTime = new TimeInput('calc-def-time');
	var calcWatt = $.getElementById('calc-watt');
	
	var calcResult = $.getElementById('calc-result');
	var calcTime = $.getElementById('calc-time');
	var calcM = $.getElementById('calc-m');
	var calcS = $.getElementById('calc-s');
	var calcDiffParent = $.getElementById('calc-diff-parent');
	var calcDiff = $.getElementById('calc-diff');
	var calcKj = $.getElementById('calc-kj');
	
	var className = calcResult.className;
	
	var onInput = function () {
		var defTime = calcDefTime.get();
		var defWatt = parseInt(calcDefWatt.value);
		var watt = parseInt(calcWatt.value);
		
		var valid = defWatt > 0 && watt > 0 && defWatt < MAX && watt < MAX;
		calcResult.className = defTime != null && valid ?
			className : className + ' calc-result-invalid'
		if (valid) {
			var joule = defWatt * defTime;
			var time = joule / watt;
			var diff = time - defTime;
			var s = diff > 0 ? '+' : '';
			
			calcTime.title = time + ' 秒';
			write(calcM, calcS, time);
			calcDiffParent.title = s + diff + ' 秒';
			calcDiff.textContent = s + pt(diff, 0);
			calcKj.textContent = (joule / 1000).toString();
		}
	};
	
	var watts;
	var ignore;
	var onchange = delay(function () {
		if (pager.active == 'index') {
			var values = [calcDefWatt.value, calcWatt.value];
			if (watts != null) {
				eq: if (values.length <= watts.length) {
					for (var i = 0; i < values.length; i++) {
						if (values[i] != watts[i]) break eq;
					}
					return;
				}
			}
			ignore = true;
			pager.load('index', {"watt[]": values});
		}
	}, 500);
	
	pager.on('index', function (params) {
		watts = params['watt[]'];
		if (ignore) {
			ignore = false;
			return;
		}
		if (watts != null) {
			if (watts.length > 0) {
				calcDefWatt.value = watts[0];
			}
			if (watts.length > 1) {
				calcWatt.value = watts[1];
			}
		}
		calcDefTime.set();
		calcDefTime.focus();
		onInput();
	});
	
	calcDefWatt.oninput = onInput;
	calcDefWatt.onchange = onchange;
	calcWatt.oninput = onInput;
	calcWatt.onchange = onchange;
	calcDefTime.onInput = onInput;
}

function initTable() {
	var tableContainer = $.getElementById('table-container');
	
	function range(step, m, watts) {
		var obj = {};
		var max = watts[0] * m;
		for (var i = 0; i < watts.length; i++) {
			var watt = watts[i];
			for (var j = step; watt * j <= max; j += step) {
				obj[watt * j] = true;
			}
		}
		var array = [];
		for (var key in obj) {
			array.push(+key);
		}
		return array.sort(function (w0, w1) {
			return w0 - w1;
		});
	}
	
	function widthOf(st) {
		return st.firstChild.getBoundingClientRect().width;
	}
	function align(st, width) {
		var child = st.firstChild;
		child.style.marginLeft =
			width - child.getBoundingClientRect().width + 'px';
	}
	function margin(joules, table) {
		var rows = table.rows;
		var i, jd, td;
		var minJd, minTd;
		for (i = 1; i < joules.length; i++) {
			jd = joules[i] - joules[i - 1];
			td = (
				rows[i].getBoundingClientRect().top -
				rows[i - 1].getBoundingClientRect().top
			);
			if (!(jd >= minJd)) {
				minJd = jd;
			}
			if (!(td >= minTd)) {
				minTd = td;
			}
		}
		var k = minTd / minJd;
		for (i = 0; i < joules.length; i++) {
			jd = i ? joules[i] - joules[i - 1] : joules[i] / 2;
			var ts = rows[i].getElementsByClassName('time');
			for (var j = 0; j < ts.length; j++) {
				ts[j].style.marginTop = k * jd - minTd + 'px';
			}
		}
	}
	
	pager.on('table', function (params) {
		var step = parseInt(params['step']);
		var max = parseFloat(params['max']);
		var pw = params['watt[]'];
		var watts = [parseInt(pw[0]), parseInt(pw[1])];
		var w2 = pw[2];
		if (w2) {
			watts.push(parseInt(w2));
		}
		var i, m;
		switch (+params['mode']) {
			case 0: m = 60 * max; break;
			case 1: m = 60 * max - step; break;
		}
		var joules = range(step, m, watts);
		
		var table = $.createElement('table');
		table.border = '0';
		tableContainer.textContent = '';
		tableContainer.appendChild(table);
		
		var ws = [];
		for (var j = joules.length - 1; j >= 0; j--) {
			var joule = joules[j];
			var row = table.insertRow(0);
			// var flag = true;
			for (i = 0; i < watts.length; i++) {
				var time = joule / watts[i];
				var cell = row.insertCell(i);
				if (j == joules.length - 1) {
					ws[i] = widthOf(cell.appendChild(create(time)));
				} else {
					align(cell.appendChild(create(time)), ws[i]);
				}
				// if (flag = flag && time % step != 0) {
				if (i < watts.length && time % step) {
					cell.className = 'table-hidden'
				}
			}
		}
		margin(joules, table);
		
		var tHead = table.createTHead();
		for (i = 0; i < watts.length; i++) {
			var th = $.createElement('th');
			var sh = span('unit-w');
			sh.textContent = watts[i].toString();
			th.appendChild(sh);
			tHead.appendChild(th);
		}
	});
	
	$.forms['table-config'].onsubmit = function () {
		var tw = this['watt[]'];
		pager.load('table', {
			max: this['max'].value,
			mode: this['mode'].selectedIndex,
			step: this['step'].value,
			"watt[]": [tw[0].value, tw[1].value, tw[2].value]
		});
		return false;
	};
}

function initGame() {
	var game;
	
	var gamePlayQi = $.getElementById('game-play-qi');
	var gamePlayQn = $.getElementById('game-play-qn');
	var gamePlayFrom = $.getElementById('game-play-from');
	var gamePlayTo = $.getElementById('game-play-to');
	var gamePlayRound = $.getElementById('game-play-round');
	
	var gamePlayM = $.getElementById('game-play-m');
	var gamePlayS = $.getElementById('game-play-s');
	var gamePlayAnswer = new TimeInput('game-play-answer');
	
	var gamePlayAbort = $.getElementById('game-play-abort');
	var gamePlayNext = $.getElementById('game-play-next');
	
	var gameResultFrom = $.getElementById('game-result-from');
	var gameResultTo = $.getElementById('game-result-to');
	var gameResultRound = $.getElementById('game-result-round');
	
	var gameResultList = $.getElementById('game-result-list');
	var gameResultM = $.getElementById('game-result-m');
	var gameResultS = $.getElementById('game-result-s');
	var gameResultBack = $.getElementById('game-result-back');
	
	function end() {
		gameResultList.textContent = '';
		var fragment = $.createDocumentFragment();
		var rs = game.results;
		for (var i = 0; i < rs.length; i++) {
			var r = rs[i];
			var li = $.createElement('li');
			li.appendChild(create(r.q));
			li.appendChild($.createTextNode('\u2003\u2192'));
			li.appendChild(create(r.a));
			li.appendChild($.createTextNode('\u2003'));
			
			var test = span('game-result-' + r.test(game));
			test.appendChild(create(r.time));
			li.appendChild(test);
			
			fragment.appendChild(li);
		}
		gameResultList.appendChild(fragment);
		
		write(gameResultM, gameResultS, game.time);
		game = null;
		pager.select('game-result');
	};
	var onProgress = function (r) {
		if (this == game) {
			if (r == null) {
				end();
			} else {
				gamePlayQi.textContent = this.index + 1;
				write(gamePlayM, gamePlayS, r.q);
				gamePlayAnswer.set();
				gamePlayAnswer.focus();
			}
		}
	};
	
	$.forms['game-config'].onsubmit = function () {
		var num  = parseInt(this['num'].value);
		var max  = parseInt(this['max'].value);
		var from = parseInt(this['from'].value);
		var to   = parseInt(this['to'].value);
		var round = this['round'];
		var step  = this['step'];
		var fromText = from.toString();
		var toText = to.toString();
		
		gamePlayQn.textContent = num.toString();
		gamePlayFrom.textContent = fromText;
		gamePlayTo.textContent = toText;
		gamePlayRound.textContent = round.value;
		
		gameResultFrom.textContent = fromText;
		gameResultTo.textContent = toText;
		gameResultRound.textContent = round.value;
		
		game = new Game(num, +step.value, max * 60);
		game.onProgress = onProgress;
		
		pager.select('game-play');
		game.start(from, to, round.selectedIndex);
		return false;
	};
	
	gamePlayAnswer.onReturn = function () {
		game.answer(this.get());
	};
	
	gamePlayAbort.onclick = function () {
		game.abort();
	};
	gamePlayNext.onclick = function () {
		game.answer(gamePlayAnswer.get());
	};
	
	gameResultBack.onclick = function () {
		pager.select('game');
	};
}

$.onreadystatechange = function () {
	this.onreadystatechange = null;
	init();
	initCalc();
	initTable();
	initGame();
	pager.init();
};

})(this, document);

define([
	"intern!object",
	"intern/chai!assert",
	"dcl/advise",
	"dcl/dcl",
	"lie/dist/lie",
	"decor/Destroyable",
	"decor/Stateful",
	"decor/features"
], function (registerSuite, assert, advise, dcl, Promise, Destroyable, Stateful, has) {
	var container;

	function on(node, type, callback) {
		node.addEventListener(type, callback);
		return {
			remove: function () {
				node.removeEventListener(type, callback);
			}
		};
	}

	registerSuite({
		name: "Destroyable",

		setup: function () {
			if (has("host-browser")) {
				container = document.createElement("div");
				document.body.appendChild(container);
			}
		},

		general: function () {
			var d = this.async(1000);

			var SupportingWidget = dcl(null, {
				destroyCalls: 0,
				constructor: function (name) {
					this.name = name;
				},
				destroy: function () {
					this.destroyCalls++;
				}
			});

			var StatefulSubclass = dcl(Stateful, {
				name: "observeMe",
				x: 0
			});
			var observeMe = new StatefulSubclass();

			var DestroyableSubClass = dcl(Destroyable, {
				// number of times my button was clicked
				clicks: 0,

				// number of times observeMe changed value of x
				observes: 0,

				constructor: function () {
					var self = this;
					if (has("host-browser")) {
						this.button = document.createElement("button");
						this.own(
							// setup an event handler (to be destroyed when I'm destroyed)
							on(this.button, "click", function () {
								self.clicks++;
							})
						);
					}

					// observe external observeMe class (to be unobserved when I'm destroyed)
					this.own(
						observeMe.observe(function () {
							self.observes++;
						})
					);

					// setup two supporting widgets, to be destroyed when I'm destroyed
					this.own(
						this.sw1 = new SupportingWidget("sw1"),
						this.sw2 = new SupportingWidget("sw2")
					);
				}
			});

			var destroyable1 = new DestroyableSubClass();

			if (has("host-browser")) {
				container.appendChild(destroyable1.button);

				// make sure click handler was set up
				destroyable1.button.click();
				assert.strictEqual(destroyable1.clicks, 1, "click handler connected");
			}

			// make sure observer was set up
			observeMe.x = 1;

			setTimeout(d.rejectOnError(function () {
				assert.strictEqual(destroyable1.observes, 1, "observer connected");

				// manually destroy one of the supporting widgets
				destroyable1.sw1.destroy();
				assert.strictEqual(destroyable1.sw1.destroyCalls, 1, "destroyable1.sw1.destroyCalls");

				// Destroy the Destroyable instance itself.   destroyable1 should:
				// 		- destroy the sw2 supporting widget, but not try to re-destroy sw1
				//		- disconnect the observe() listener on observeMe
				//		- disconnect the click event handler on destroyable1.button
				destroyable1.destroy();
				assert.strictEqual(destroyable1.sw1.destroyCalls, 1, "destroyable1.sw1.destroyCalls #2");

				assert.strictEqual(destroyable1.sw2.destroyCalls, 1, "destroyable1.sw2.destroyCalls");

				if (has("host-browser")) {
					destroyable1.button.click();
					assert.strictEqual(destroyable1.clicks, 1, "destroyable1.clicks #2");
				}

				observeMe.x = 2;
				setTimeout(d.callback(function () {
					assert.strictEqual(destroyable1.observes, 1, "observer disconnected");
				}), 100);
			}), 100);

			return d;
		},

		multipleDestroyFunctions: function () {
			var removeCount = 0;
			var destroyCount = 0;

			var W1 = dcl(Destroyable, {
				remove: function () {
					removeCount++;
					this.destroy();
				},
				destroy: function () {
					destroyCount++;
				}
			});

			var W2 = dcl(Destroyable, {
				test: function () {
					var w1 = new W1();
					this.own(w1);
					w1.destroy();
				}
			});

			var W3 = dcl(Destroyable, {
				test: function () {
					var w1 = new W1();
					this.own(w1);
					w1.remove();
				}
			});

			var w2 = new W2();
			w2.test();
			w2.destroy();
			assert.strictEqual(removeCount, 0, "remove #1");
			assert.strictEqual(destroyCount, 1, "destroy #1");

			removeCount = 0;
			destroyCount = 0;
			var w3 = new W3();
			w3.test();
			w3.destroy();
			assert.strictEqual(removeCount, 1, "remove #2");
			assert.strictEqual(destroyCount, 1, "destroy #2");
		},

		owningPromises: function () {
			var cancels = [];

			// own() can only handle Promises w/additional destroy() or cancel() method.
			function Deferred() {
				var p = new Promise(function (resolve, reject) {
					this.res = resolve;
					this.cancel = reject;
				}.bind(this));
				this.then = p.then;
			}
			var W1 = dcl(Destroyable, {
				constructor: function () {
					this.p1 = new Deferred();
					this.p2 = new Deferred();
					this.p3 = new Deferred();
					this.own(this.p1, this.p2, this.p3);
				}
			});

			var w1 = new W1();

			w1.p1.res(true);
			w1.p2.cancel();
			Promise.all(w1.p1, w1.p2).then(function () {
				advise.after(w1.p1, "cancel", function () {
					cancels.push("p1");
				});
				advise.after(w1.p2, "cancel", function () {
					cancels.push("p2");
				});
				advise.after(w1.p3, "cancel", function () {
					cancels.push("p31");
				});
				w1.destroy();

				return new Promise(function (resolve) { setTimeout(resolve, 100); });
			}).then(function () {
				assert.deepEqual(cancels, ["p3"], "only p3 canceled on widget destroy");
			});
		},

		teardown: function () {
			if (container) {
				container.parentNode.removeChild(container);
			}
		}
	});
});

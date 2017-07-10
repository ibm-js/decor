/** @module decor/Destroyable */
define([
	"dcl/advise",
	"dcl/dcl"
], function (advise, dcl) {
	/**
	 * Mixin to track handles and release them when instance is destroyed.
	 *
	 * Call `this.own(...)` on list of handles (returned from dcl/advise, dojo/on,
	 * decor/Stateful#observe, or any class (including widgets) with a destroy() or remove() method.
	 * Then call `destroy()` later to destroy this instance and release the resources.
	 * @mixin module:decor/Destroyable
	 */
	var Destroyable = dcl(null, /** @lends module:decor/Destroyable# */ {
		/**
		 * Destroy this class, releasing any resources registered via `own()`.
		 * @method
		 */
		destroy: dcl.advise({
			before: function () {
				this._beingDestroyed = true;
				if (this._releaseHandles) {
					this._releaseHandles();
					delete this._releaseHandles;
				}
			},
			after: function () {
				this._destroyed = true;
			}
		}),

		/**
		 * Track specified handles and remove/destroy them when this instance is destroyed, unless they were
		 * already removed/destroyed manually.
		 * @returns {Object[]} The array of specified handles, so you can do for example:
		 * `var handle = this.own(on(...))[0];`
		 * @protected
		 */
		own: function () {
			var cleanupMethods = [
				"destroy",
				"remove",
				"cancel"
			];

			// transform arguments into an Array
			var ary = Array.prototype.slice.call(arguments);
			ary.forEach(function (handle) {
				// Register handle to be destroyed/released when this.destroy() is called.
				var destroyMethodName;
				var odh = advise.after(this, "_releaseHandles", function () {
					handle[destroyMethodName]();
				});

				// Callback for when handle is manually destroyed.
				var hdhs = [];

				function onManualDestroy() {
					odh.destroy();
					hdhs.forEach(function (hdh) {
						hdh.destroy();
					});
				}

				// Setup listeners for manual destroy of handle.
				// Also compute destroyMethodName, used in listener above.
				if (handle.then) {
					// Special path for Promises.  Detect when Promise is settled.
					handle.then(onManualDestroy, onManualDestroy);
				}
				cleanupMethods.forEach(function (cleanupMethod) {
					if (typeof handle[cleanupMethod] === "function") {
						if (!destroyMethodName) {
							// Use first matching method name in above listener.
							destroyMethodName = cleanupMethod;
						}
						if (!handle.then) {
							// Path for non-promises.  Use AOP to detect when handle is manually destroyed.
							hdhs.push(advise.after(handle, cleanupMethod, onManualDestroy));
						}
					}
				});
			}, this);

			return ary;
		},

		/**
		 * Wrapper to setTimeout to avoid deferred functions executing
		 * after the originating widget has been destroyed.
		 * @param {Function} fcn - Function to be executed after specified delay (or 0ms if no delay specified).
		 * @param {number} delay - Delay in ms, defaults to 0.
		 * @returns {Object} Handle with a remove method that deschedules the callback from being called.
		 * @protected
		 */
		defer: function (fcn, delay) {
			// TODO: if delay unspecified, use schedule?
			var timer = setTimeout(
				function () {
					if (!timer) {
						return;
					}
					timer = null;
					if (!this._destroyed) {
						fcn.call(this);
					}
				}.bind(this),
					delay || 0
			);
			return {
				remove: function () {
					if (timer) {
						clearTimeout(timer);
						timer = null;
					}
					return null; // so this works well: handle = handle.remove();
				}
			};
		}
	});

	dcl.chainBefore(Destroyable, "destroy");

	return Destroyable;
});

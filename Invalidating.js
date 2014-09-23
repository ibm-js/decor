/** @module decor/Invalidating */
define([
	"dcl/dcl",
	"./Stateful",
	"./Destroyable"
], function (dcl, Stateful, Destroyable) {
	/**
	 * Mixin class for widgets
	 * that want to calculate computed properties at once and/or to render UI at once upon multiple property changes.
	 * @class module:decor/Invalidating
	 */
	var Invalidating = dcl([Stateful, Destroyable], /** @lends module:decor/Invalidating# */ {
		constructor: dcl.after(function () {
			this.initializeInvalidating();
		}),

		/**
		 * Sets up observers, one for computed properties, one for UI rendering.
		 * Normally this method is called automatically by the constructor, and should not be called manually,
		 * but the method is exposed for custom elements since they do not call the `constructor()` method.
		 * @protected
		 */
		initializeInvalidating: function () {
			this.own(
				this._hComputing = this.observe(function (oldValues) {
					this.computeProperties(oldValues);
					this.deliverComputing();
				}),
				this._hRendering = this.observe(function (oldValues) {
					this.refreshRendering(oldValues);
				})
			);
			// Discard changes made by this function itself (to ._hComputing and _hRendering)
			this.discardChanges();
		},

		/**
		 * Synchronously deliver change records for computed properties
		 * so that `refreshingComputing()` is called if there are pending change records.
		 */
		deliverComputing: function () {
			this._hComputing && this._hComputing.deliver();
			return this._hComputing;
		},

		/**
		 * Discard change records for computed properties.
		 */
		discardComputing: function () {
			this._hComputing && this._hComputing.discardChanges();
			return this._hComputing;
		},

		/**
		 * Synchronously deliver change records for computed properties and then UI rendering
		 * so that `refreshingRendering()` is called if there are pending change records.
		 */
		deliver: function () {
			this._hComputing && this._hComputing.deliver();
			this._hRendering && this._hRendering.deliver();
			return this._hComputing;
		},

		/**
		 * Discard change records.
		 */
		discardChanges: function () {
			this._hComputing && this._hComputing.discardChanges();
			this._hRendering && this._hRendering.discardChanges();
			return this._hComputing;
		},

		/**
		 * Callback function to calculate computed properties upon property changes.
		 * @param {Object} newValues The hash table of new property values, keyed by property names.
		 * @param {Object} oldValues The hash table of old property values, keyed by property names.
		 */
		computeProperties: function () {},

		/**
		 * Callback function to render UI upon property changes.
		 * @param {Object} newValues The hash table of new property values, keyed by property names.
		 * @param {Object} oldValues The hash table of old property values, keyed by property names.
		 */
		refreshRendering: function () {}
	});

	dcl.chainAfter(Invalidating, "computeProperties");
	dcl.chainAfter(Invalidating, "refreshRendering");

	return Invalidating;
});

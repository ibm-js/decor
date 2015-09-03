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
			if (!this._hComputing && !this._hRendering) {
				this.computeProperties(this, true);
				var shouldInitializeRendering = this.shouldInitializeRendering(this, true);
				if (shouldInitializeRendering) {
					this.initializeRendering(this);
				}
				this.refreshRendering(this, shouldInitializeRendering);
				this.own(
					this._hComputing = this.observe(function (oldValues) {
						this.computeProperties(oldValues);
						this.deliverComputing();
					}),
					this._hRendering = this.observe(function (oldValues) {
						var shouldInitializeRendering = this.shouldInitializeRendering(oldValues);
						if (shouldInitializeRendering) {
							this.initializeRendering(oldValues);
						}
						this.refreshRendering(oldValues, shouldInitializeRendering);
					})
				);
				// Discard changes made by this function itself (to ._hComputing and _hRendering)
				this.discardChanges();
			}
		},

		/**
		 * Synchronously deliver change records for computed properties
		 * so that `computeProperties()` is called if there are pending change records.
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
		 * Synchronously deliver change records to render UI changes
		 * so that `refreshingRendering()` is called if there are pending change records.
		 */
		deliverRendering: function () {
			this._hRendering && this._hRendering.deliver();
			return this._hRendering;
		},

		/**
		 * Discard change records to render UI changes.
		 */
		discardRendering: function () {
			this._hRendering && this._hRendering.discardChanges();
			return this._hRendering;
		},

		/**
		 * Function to return if rendering should be initialized.
		 * (Instead of making partial changes for post-initialization)
		 * @param {Object} oldValues The hash table of old property values, keyed by property names.
		 * @param {boolean} isAfterCreation True if this call is right after instantiation.
		 * @return {boolean} True if rendering should be initialized.
		 */
		shouldInitializeRendering: function () {},

		/**
		 * Callback function to calculate computed properties upon property changes.
		 * @param {Object} oldValues The hash table of old property values, keyed by property names.
		 * @param {boolean} isAfterCreation True if this call is right after instantiation.
		 */
		computeProperties: function () {},

		/**
		 * Callback function to initialize rendering.
		 * @param {Object} oldValues The hash table of old property values, keyed by property names.
		 */
		initializeRendering: function () {},

		/**
		 * Callback function to render UI upon property changes.
		 * @param {Object} oldValues The hash table of old property values, keyed by property names.
		 * @param {boolean} isAfterInitialRendering True if this call is right after `initializeRendering()`.
		 */
		refreshRendering: function () {}
	});

	dcl.chainAfter(Invalidating, "computeProperties");
	dcl.chainAfter(Invalidating, "refreshRendering");

	return Invalidating;
});

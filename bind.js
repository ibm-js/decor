/** @module decor/bind */
define([
	"./observe"
], function (observe) {

	// Function to set or get a [nested] property.
	// @example
	// 	prop(obj, "a.b.c", 10)  --> sets obj.a.b.c = 10;
	//	prop(obj, "a.b.c") --> returns obj.a.b.c
	function prop(obj, path, value) {
		var set = arguments.length >= 3;
		path.split(".").forEach(function (prop, idx, ary) {
			if (idx === ary.length - 1) {
				if (set) {
					obj[prop] = value;
				} else {
					value = obj[prop];
				}
			} else {
				if (!obj[prop]) {
					obj[prop] = {};
				}
				obj = obj[prop];
			}
		});

		return value;
	}

	/**
	 * Bind object `view` to object `model`, so that changes to `model` are reflected to `view`.
	 * Can also dual reflection from view back to model.
	 *
	 * @example
	 *		One way bind example:
	 *
	 *		var model = {store: 12345, revenue: 1000, cost: 500};
	 *		var view = {store: 0, revenue: 0, cost: 0, profit: 0}
	 *		bind(model, view, {
	 *			store: "store",
	 *			revenue: "revenue",
	 *			profit: function(model){ return model.revenue - model.cost; }
	 *		});
	 *
	 * @example
	 *		Two way bind example:
	 *
	 *		var model = {foo: 2};
	 *		var view = {bar: 1};
	 *		bind(model, view, [
	 *			{
	 *				// Names of properties in model and view objects.
	 *				model: "foo",
	 *				view: "bar",
	 *
	 *				// Optional transform functions to convert model prop to view prop and vice-versa.
	 *				modelToView: function(model) { return model.foo - 1; },
	 *				viewToModel: function(view) { return view.bar + 1; },
	 *
	 *				// True if target changes should be reflected to source.
	 *				twoWay: true
	 *			},
	 *			...
	 *		]);
	 *
	 * @param {Object|decor/Stateful} model
	 * @param {Object|decor/Stateful} view
	 * @param {Object} mapping
	 *		Hash or array specifying mapping from model to view [and view back to model].
	 *
	 *		Hash keys corresponding to keys in the `view` object.  Each key maps to either:
	 *
	 *		* a function that takes the model object and returns a value
	 *		* a string referring to the name of a property in the model
	 *
	 *		If mapping is an array, then each entry in the array has:
	 *
	 *		* model: name of property in model
	 *		* view: name of property in view
	 *		* modelToView: optional function to compute view's property's value based on model object
	 *		* viewToModel: optional function to compute model's property's value based on view object
	 */
	return function (model, view, mapping) {
		if (Array.isArray(mapping)) {
			// Copy from model to view.
			var handle1 = observe(model, function (props) {
				mapping.forEach(function (map) {
					if (map.modelToView) {
						prop(view, map.view, map.modelToView(model));
					} else if (map.model in props || /\./.test(map.model)) {
						prop(view, map.view, prop(model, map.model));
					}
				});
			});

			// Copy from view to model.
			var handle2 = observe(view, function (props) {
				mapping.forEach(function (map) {
					if (map.twoWay) {
						if (map.viewToModel) {
							prop(model, map.model, map.viewToModel(view));
						} else if (map.view in props || /\./.test(map.view)) {
							prop(model, map.model, prop(view, map.view));
						}
					}
				});
			});

			return {
				remove: function () {
					handle1.remove();
					handle2.remove();
				}
			};
		} else {
			return observe(model, function () {
				Object.keys(mapping).forEach(function (key) {
					var map = mapping[key];
					prop(view, key, typeof map === "function" ? map(model) : prop(model, map));
				});
			});
		}
	};
});

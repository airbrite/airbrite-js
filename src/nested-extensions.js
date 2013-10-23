// From https://gist.github.com/badave/6997681
_.extend(_, {
  flattenObject: function(obj) {
    var ret = {},
        separator = ".";

    if(_.isArray(obj)) {
      ret = [];
    }

    for (var key in obj) {
      if(!_.isNaN(Number(key))) {
        key = Number(key);
      }
      var val = obj[key];

      if(!_.isEmpty(val) && _.isArray(val)) {
        //Recursion for embedded objects
        var obj2 = _.flattenObject(val);

        ret[key] = obj2;
      } else if (!_.isEmpty(val) && _.get(val, "constructor") === Object) {
        //Recursion for embedded objects
        var obj2 = _.flattenObject(val);

        for (var key2 in obj2) {
          var val2 = obj2[key2];

          ret[key + separator + key2] = val2;
        }
      } else {
        ret[key] = val;
      }
    }

    return ret;
  },

  get: function(object, string, defaultReturnObj) { 
    if(_.isEmpty(object) || _.isEmpty(string)) {
      return defaultReturnObj;
    }

    if(!_.isString(string)) {
      string = string.toString();
    }

    string = string.replace(/\[(\w+)\]/g, '.$1');  // convert indexes to properties
    string = string.replace(/^\./, ''); // strip leading dot

    var keys = string.split('.');
    var key;

    while (keys.length > 0) {
      key = keys.shift();

      if(_.has(object, key)) {
        object = object[key];
      } else {
        return defaultReturnObj;
      }
    }

    return object;
  },

  set: function(object, string, value) {
    if(_.isUndefined(object)) {
      object = {};
    }

    if(!_.isString(string)) {
      // try anyway
      string = string.toString();
    }

    string = string.replace(/\[(\w+)\]/g, '.$1');  // convert indexes to properties
    string = string.replace(/^\./, ''); // strip leading dot

    var keys = string.split('.');
    var key, val, ptr;

    ptr = object;
    while (keys.length > 0) {
      // Pop first key
      key = keys.shift();

      // This is much cleaner for arrays
      if(!_.isNaN(Number(key))) {
        key = Number(key);
      }

      if (keys.length === 0) {
        // If no more keys left, this is the final key
        ptr[key] = value;
      } else if (ptr[key] && _.isObject(ptr[key])) {
        // Found an object or array at key, keep digging
        ptr = ptr[key];
      } else if(!ptr[key] || !_.isObject(ptr[key])) {
        // undefined or not an object, create an object to have prop
        if(!_.isNaN(Number(key))) {
          ptr[key] = [];
        } else {
          ptr[key] = {};
        }
        ptr = ptr[key];
      } else {
        break;
      }
    }
  }
});

// From https://gist.github.com/badave/6997710

// Getters and setters for backbone model
// Set a hash of model attributes on the object, firing `"change"`. This is
// the core primitive operation of a model, updating the data and notifying
// anyone who needs to know about the change in state. The heart of the beast.
_.extend(Backbone.Model.prototype, {
  get: function(attr, returnObject) {
    return _.get(this.attributes, attr, returnObject);
  },
  set: function(key, val, options) {
    var attr, attrs, unset, changes, silent, changing, prev, current;
    if (key == null) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      _.set((attrs = {}), key, val);
    }

    options || (options = {});

    // Run validation.
    if (!this._validate(attrs, options)) return false;

    // Extract attributes and options.
    unset           = options.unset;
    silent          = options.silent;
    changes         = [];
    changing        = this._changing;
    this._changing  = true;

    if (!changing) {
      this._previousAttributes = _.clone(this.attributes);
      this.changed = {};
    }

    current = this.attributes, prev = this._previousAttributes;

    // Check for changes of `id`.
    if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

    attrs = _.flattenObject(attrs);

    // For each `set` attribute, update or delete the current value.
    for (attr in attrs) {
      val = attrs[attr];

      if (!_.isEqual(current[attr], val)) changes.push(attr);
      if (!_.isEqual(prev[attr], val)) {
        this.changed[attr] = val;
      } else {
        delete this.changed[attr];
      }

      unset ? delete current[attr] : _.set(current, attr, val);
    }

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = true;
      for (var i = 0, l = changes.length; i < l; i++) {
        this.trigger('change:' + changes[i], this, current[changes[i]], options);
      }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return this;
    if (!silent) {
      while (this._pending) {
        this._pending = false;
        this.trigger('change', this, options);
      }
    }
    this._pending = false;
    this._changing = false;
    return this;
  }
});

/**
 * @namespace
 *
 * @description
 * A small micro library for assisting with the creation of web workers. No need for separate scripts for the worker itself and
 * no separate file for scripts you want to include in the worker. Have 15 workers defined and you want to change a property on all of them?
 * No problem. All workers inherit from the same object so you can make changes across the board;
 *
 * @type {{create: Function, extend: Function}}
 */
var $worker = (function() {

  var urlBuilder = window.URL.createObjectURL,
      workers = [];

  var proto = {
    /**
     * @name postMessage
     *
     * @memberof $worker#
     *
     * @description
     * send data tp the worker and assign the onmessage and on error listeners
     *
     * @example
     * myWorker.postMessage(1988);
     *
     * @param data
     */
    postMessage: function postMessage(data) {
      this.shell.postMessage(data);
      this.shell.onmessage = this.onmessage;
      this.shell.onerror = this.onerror;
    },

    /**
     * @name terminate
     *
     * @memberof $worker#
     *
     * @description
     * terminate the worker. (all stop does not finish or allow cleanup)
     *
     * @example
     * myWorker.terminate();
     */
    terminate: function terminate() {
      workers.splice(workers.indexOf(this), 1); // remove the worker for the list

      this.shell.terminate(); // terminate the actuall worker
    },

    /**
     * @name loadScripts
     *
     * @memberof $worker#
     *
     * @description
     * Allows the loading of scripts into the worker for use.
     * NOTE: this will rebuild the worker. should not be done while the worker is running
     *
     * @example
     * myWorker.loadScripts({
     *   hello: function() { return 'hello'; },
     *   world: function() { return 'world' }
     * })
     */
    loadScripts: function loadScripts(scripts) {
      var key, val;

      for(var name in scripts) {
        if(scripts.hasOwnProperty(name)) {
          key = name;
          val = scripts[name];

          this.blobArray.unshift(';');
          this.blobArray.unshift(val.toString());
          this.blobArray.unshift(_makeVarName(key));
        }
      }

      this.blob = new Blob(this.blobArray, { type: 'text/javascript' });

      this.shell = new Worker(urlBuilder(this.blob));
    },

    /**
     * @name removeScripts
     *
     * @memberof $worker#
     *
     * @description
     * remove scripts that have been loaded into the worker.
     * NOTE: this will rebuild the worker. should not be done while the worker is running
     *
     * @example
     * myWorker.removeScripts('hello', 'world');
     */
    removeScripts: function removeScripts() {
      var index;

      for(var i = 0, len = arguments.length; i < len; i++) {
        index = this.blobArray.indexOf(_makeVarName(arguments[i]));

        blobArray.splice(index, 3);
      }

      this.blob = new Blob(this.blobArray, { type: 'text/javascript' });

      this.shell = new Worker(urlBuilder(this.blob));
    }
  };

  var protectedMethods = Object.keys(proto);

  /**
   * @name create
   *
   * @memberof $worker#
   *
   * @param method
   *
   * @example
   * var myWorker = $worker.create(function(e.data) {
   *   self.postMessage(e.data + 1);
   * });
   *
   * @return {proto}
   *
   * @public
   */
   function create(method) {
    var createdWorker = Object.create(proto);

    createdWorker.blobArray = ['self.onmessage = ', method.toString(), ';']; // array to be used for blob
    createdWorker.blob = new Blob(createdWorker.blobArray, { type: 'text/javascript' });
    createdWorker.shell = new Worker(urlBuilder(createdWorker.blob));

    workers.push(createdWorker);

    return createdWorker;
  }

  /**
   * @name extend
   *
   * @memberof $worker
   *
   * @description
   * Extend the base prototype. Properties will be inherited by ALL currently created and new workers. The base prototype methods cannot be overridden.
   *
   * @example
   * $worker.extend({
   *   newProp1: function() {
   *     return 'I am a new prototype property'
   *   },
   *   newProp2: 'We are workers'
   * });
   *
   * @public
   */
  function extend(obj) {
    for(var key in obj) {
      if(obj.hasOwnProperty(key)) {
        if(protectedMethods.indexOf(key) < 0) {
          proto[key] = obj[key]
        }
      }
    }
  }

  /**
   * @name viewAll
   *
   * @memberof $worker
   * 
   * @description
   * return the current list of active workers
   */
  function viewAll() {
    return workers;
  }

  /* @private */
  function _makeVarName(name) {
    return 'var ' + name + ' = ';
  }

  /**
   * Expose public methods
   * 
   * @param create
   * @param extend
   * @param viewAll
   */
  return {
    create: create,
    extend: extend,
    viewAll: viewAll
  }

}());
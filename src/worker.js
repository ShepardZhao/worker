(function () {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = $worker;
    } else {
        window.$worker = $worker;
    }

    function $worker() {
        var workers = [];

        // PUBLIC_API
        return {
            create: create,
            runAll: runAll,
            terminateAll: terminateAll,
            list: list
        }

        /**
         * create a new worker instance and saves it to the list
         *
         * @param {Function} fn - the function to run in the worker
         */
        function create(fn) {
            var newWorker = _createWorker.apply(null, arguments);

            workers.push(newWorker);

            return newWorker;
        }

        /**
         * run all of the workers in the array and resolve all
         */
        function runAll(data) {
            var promises = workers.map(function (worker) {
                return worker.run(data);
            });

            return Promise.all(promises);
        }

        /**
         * terminate all workers
         */
        function terminateAll() {
            workers.forEach(function (worker) {
                worker._shell.terminate();
            });

            workers.length = 0;
        }

        /**
         * returns the list of current workers
         */
        function list() {
            return workers;
        }

        /**
         * Create an actual web worker from an object url from a blob
         *
         * @param {Function} fn - the function to be put into the blog array.
         */
        function _createWorker(fn) {
            var blob = new Blob(['self.onmessage = ', fn], { type: 'text/javascript' });

            return {
                // the web worker instance
                _shell: new Worker(window.URL.createObjectURL(blob)),

                // run the web worker
                run: function (data) {
                    return __run(this._shell, data);
                },

                // terminate the web worker
                terminate: function () {
                    return __terminate(this);
                }
            };
        }

        /**
         * run the passed in web worker
         */
        function __run(worker, data) {
            data = data || {};

            worker.postMessage(data);

            var promise = new Promise(function (resolve, reject) {
                worker.onmessage = resolve;
                worker.onerror = reject;
            });

            return promise;
        }

        /**
         * terminate the web worker;
         */
        function __terminate(ref) {
            workers.splice(workers.indexOf(ref), 1);

            return ref._shell.terminate();
        }
    }
})();
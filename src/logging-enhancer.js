/*
	LoggingEnhancer can be used to enhance any logging function and can be tested without angular
*/
(function() {
	var LoggingEnhancer = function(sprintf, moment) {
		var self = this;
		
		this.LEVEL = { TRACE: 4, DEBUG: 3, INFO: 2, WARN: 1, ERROR: 0, OFF: -1 };

		// returns a value for testing purposes only
		this.enhanceLogging = function(loggingFunc, level, context, config, datetimePattern, loggingPattern) {
			config.logLevels = config.logLevels || [];
			return function() {
				if (levelPassesThreshold(context, level, config)) {
					var enhancedArguments = enhanceLogline(arguments, context, datetimePattern, loggingPattern);
					loggingFunc.apply(null, enhancedArguments);
					return enhancedArguments;
				}
				else {
					return null; // no log produced
				}
			};

			function levelPassesThreshold(context, level, config) {
				return level > self.LEVEL.OFF && level <= getLogLevelThreshold(context, config);

				function getLogLevelThreshold(context, config) {
					if (context) {
						if (config.logLevels[context] !== undefined) {
							return config.logLevels[context];
						}
						else if (context.indexOf('.') != -1) {
							return getLogLevelThreshold(context.substring(0, context.lastIndexOf('.')), config);
						}
					}
					return config.logLevels['*'] !== undefined ? config.logLevels['*'] : self.LEVEL.TRACE;
				}
			}

			function enhanceLogline(args, context, datetimePattern, loggingPattern) {
				var prefix = generatePrefix(context, datetimePattern, loggingPattern);
				var processedArgs = maybeApplySprintf([].slice.call(args));
				return [prefix].concat([].slice.call(processedArgs));

				function maybeApplySprintf(args) {
					var sprintfAvailable = typeof sprintf !== 'undefined';
					var sprintfCandidate = sprintfAvailable && args.length >= 2 && typeof args[0] === 'string' && args[0].indexOf('%') !== -1;
					if (sprintfCandidate) {
						try {
							// count placeholders
							var placeholderCount = 0;
							var f = function() {
								return placeholderCount++;
							};
							sprintf(args[0], f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f, f);
							// apply sprintf with the proper arguments
							if (placeholderCount > 0) {
								args[0] = sprintf.apply(null, args);
							}
							// remove arguments consumed by sprintf
							args.splice(1, placeholderCount);
						}
						catch (e) {
							// invalid arguments passed into sprintf, continue without applying
						}
					}
					return args;
				}
			}

			function generatePrefix(context, datetimePattern, loggingPattern) {
				var dateStr = '';
				if (typeof moment !== 'undefined') {
					dateStr = moment().format(datetimePattern);
				}
				else {
					var d = new Date();
					var timeStr = new Date().toTimeString().match(/^([0-9]{2}:[0-9]{2}:[0-9]{2})/)[0];
					dateStr = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear() + " " + timeStr;
				}

				if (typeof sprintf !== 'undefined') {
					return sprintf(loggingPattern, dateStr, context);
				}
				else {
					// use fixed layout: '%s::[%s]> '
					return dateStr + '::[' + context + ']> ';
				}
			}
		};
	};

	if (typeof window !== "undefined") {
		window.loggingEnhancer = new LoggingEnhancer(window.sprintf, window.moment);
	}
	
	if (typeof exports !== "undefined" ) {
		exports.LoggingEnhancer = LoggingEnhancer;
	}
})();
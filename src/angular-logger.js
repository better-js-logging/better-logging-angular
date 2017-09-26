/* global require */
var LoggingEnhancer = require('better-logging-base').LoggingEnhancer;
var sprintf = require('sprintf-js');
var moment = require('moment');

// depending on sprintf availability *and* version if available
sprintf = (sprintf && sprintf.sprintf) || (window.sprintf && window.sprintf.sprintf) || window.sprintf;
moment = moment || window.moment;
var angular = window.angular;

(function (logEnhancer, angular, sprintf, moment) {
	'use strict';

	angular.module('angular-logger', []).
	provider('logEnhancer', function() {
		var provider = this;
		var logs = {};
        this.datetimePattern = 'LLL'; 	// default datetime stamp pattern, overwrite in config phase
        this.datetimeLocale = window.navigator.userLanguage || window.navigator.language || 'en';
        this.prefixPattern = '%s::[%s]> '; 		    // default prefix pattern, overwrite in config phase
        this.LEVEL = logEnhancer.LEVEL;             // with these configure loglevels in config fase
        this.logLevels = {'*': this.LEVEL.TRACE}; 	// everything by everyone should be visible by default

		// instanceFactoryFactory moved here for modding purposes; now you can repurpose all the logging functions after they are enhanced
		this.instanceFactoryFactory = function($log) {
			return function(context) {
				if (logs[context]) {
					return logs[context];
				}
				var newLogs = {
					trace	: logEnhancer.enhanceLogging($log.$$orig$log.debug, $log.LEVEL.TRACE, context, $log, provider.datetimePattern, provider.datetimeLocale, provider.prefixPattern),
					debug	: logEnhancer.enhanceLogging($log.$$orig$log.debug, $log.LEVEL.DEBUG, context, $log, provider.datetimePattern, provider.datetimeLocale, provider.prefixPattern),
					log		: logEnhancer.enhanceLogging($log.$$orig$log.log,   $log.LEVEL.INFO,  context, $log, provider.datetimePattern, provider.datetimeLocale, provider.prefixPattern),
					info	: logEnhancer.enhanceLogging($log.$$orig$log.info,  $log.LEVEL.INFO,  context, $log, provider.datetimePattern, provider.datetimeLocale, provider.prefixPattern),
					warn	: logEnhancer.enhanceLogging($log.$$orig$log.warn,  $log.LEVEL.WARN,  context, $log, provider.datetimePattern, provider.datetimeLocale, provider.prefixPattern),
					error	: logEnhancer.enhanceLogging($log.$$orig$log.error, $log.LEVEL.ERROR, context, $log, provider.datetimePattern, provider.datetimeLocale, provider.prefixPattern)
				};
				logs[context] = newLogs;
				return newLogs;
			};
		};

		this.$get = function() {
			return {

                // Actually modifies $log. Without calling this in the run phase, $log remains untouched
				enhanceAngularLog : function($log) {
					$log.LEVEL = provider.LEVEL; // assign to $log, so the user can change them after config phase
					$log.logLevels = provider.logLevels; // assign to $log, so the user can change them after config phase

					$log.getInstance = provider.instanceFactoryFactory($log);
				}
			};
		};
	}).

	/*
		Default config and example config as well.
		Overrides default logging pattern and global logLevel
	*/
    config(['logEnhancerProvider', function (logEnhancerProvider) {
        logEnhancerProvider.datetimePattern = 'LLL';
        logEnhancerProvider.datetimeLocale = window.navigator.userLanguage || window.navigator.language || 'en';
        logEnhancerProvider.prefixPattern = '%s::[%s]> ';
        logEnhancerProvider.logLevels = {'*': logEnhancerProvider.LEVEL.TRACE};
        /*
            // example structure:
            logEnhancerProvider.logLevels = {
                'a.b.c': logEnhancerProvider.LEVEL.TRACE, // trace + debug + info + warn + error
                'a.b.d': logEnhancerProvider.LEVEL.ERROR, // error
                'a.b': logEnhancerProvider.LEVEL.DEBUG, // debug + info + warn + error
                'a': logEnhancerProvider.LEVEL.WARN, // warn + error
                '*': logEnhancerProvider.LEVEL.INFO // info + warn + error
            };
        */
    }]).

    config(['$provide', 'logEnhancerProvider', function ($provide, p) {
		$provide.decorator('$log', ['$delegate', function ($delegate) {
			$delegate.logLevels = p.logLevels; // copy the initial loglevel config
			return {
			    // keep original methods, otherwise the enhanced functions on .getInstance() will have a double (global context) prefix
			    $$orig$log: angular.extend({}, $delegate),
    			trace	: logEnhancer.enhanceLogging($delegate.debug, p.LEVEL.TRACE, 'global', $delegate, p.datetimePattern, p.datetimeLocale, p.prefixPattern),
    			debug	: logEnhancer.enhanceLogging($delegate.debug, p.LEVEL.DEBUG, 'global', $delegate, p.datetimePattern, p.datetimeLocale, p.prefixPattern),
    			log		: logEnhancer.enhanceLogging($delegate.log,   p.LEVEL.INFO,  'global', $delegate, p.datetimePattern, p.datetimeLocale, p.prefixPattern),
    			info	: logEnhancer.enhanceLogging($delegate.info,  p.LEVEL.INFO,  'global', $delegate, p.datetimePattern, p.datetimeLocale, p.prefixPattern),
    			warn	: logEnhancer.enhanceLogging($delegate.warn,  p.LEVEL.WARN,  'global', $delegate, p.datetimePattern, p.datetimeLocale, p.prefixPattern),
    			error	: logEnhancer.enhanceLogging($delegate.error, p.LEVEL.ERROR, 'global', $delegate, p.datetimePattern, p.datetimeLocale, p.prefixPattern)
			};
		}]);
	}]).

    run(['$log', 'logEnhancer', function ($log, logEnhancer) {
        logEnhancer.enhanceAngularLog($log);
        if (!sprintf) {
            $log.warn('sprintf.js not found: https://github.com/alexei/sprintf.js, using fixed layout pattern "%s::[%s]> "');
        }
        if (!moment) {
            $log.warn('moment.js not found: http://momentjs.com, using non-localized simple Date format');
        }
    }]);
}(new LoggingEnhancer(sprintf, moment), angular, sprintf, moment));

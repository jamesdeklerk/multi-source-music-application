var ParameterDefinition = (function () {
    function ParameterDefinition(name, type, optional, description) {
        this.validTypes = ["boolean", "number", "string", "symbol", "function", "object"];
        this.name = name;
        this.type = type;
        if (optional) {
            this.optional = true;
        }
        else {
            this.optional = false;
        }
        this.description = description || "";
        this.performValidParameterDefinitionCheck(this);
    }
    ParameterDefinition.prototype.validType = function (type) {
        for (var _i = 0, _a = this.validTypes; _i < _a.length; _i++) {
            var validType = _a[_i];
            if (type === validType) {
                return true;
            }
        }
        return false;
    };
    ParameterDefinition.prototype.performValidParameterDefinitionCheck = function (parameter) {
        if (typeof parameter.name !== "string" || parameter.name.length <= 0) {
            throw new Error("Expected the parameter name to be a string with at least 1 character.");
        }
        if (typeof parameter.optional !== "boolean") {
            throw new Error("Expected optional of parameter " + parameter.name + " to be a boolean.");
        }
        if (!this.validType(parameter.type)) {
            throw new Error(("The type \"" + parameter.type + "\" of parameter " + parameter.name + " is not ") +
                "a valid JavaScript type. Expected type to be \"boolean\" or \"number\" or \"string\" etc.\n" +
                "Note: Arrays and instantiations of custom classes have type \"object\", " +
                "and classes have type \"function\".");
        }
        if (typeof parameter.description !== "string") {
            throw new Error("Expected description of parameter " + parameter.name + " to be a string.");
        }
    };
    return ParameterDefinition;
}());
var PublisherEvent = (function () {
    function PublisherEvent(eventName, parameters, description, registrant) {
        this.handlers = [];
        this.name = eventName;
        this.description = description || "";
        this.registrant = registrant;
        this.parameters = (parameters || []);
        if (!this.validParameterDefinitionArray(this.parameters)) {
            this.parameters = this.convertToParameterDefinitionArray(this.parameters);
        }
        this.performValidPublisherEventCheck(this);
    }
    PublisherEvent.prototype.convertToParameterDefinitionArray = function (parameters) {
        if (parameters instanceof Array) {
            for (var i = 0, parameter = void 0; parameter = parameters[i]; i = i + 1) {
                if (typeof parameter !== "object") {
                    throw new Error("Unexpected parameter definition.");
                }
                parameters[i] = new ParameterDefinition(parameter.name, parameter.type, parameter.optional, parameter.description);
            }
        }
        else {
            throw new Error("Expected parameters to be an array of parameter definitions (the array can be empty).");
        }
        return parameters;
    };
    PublisherEvent.prototype.validParameterOrder = function (parameters) {
        var optionalParameterFound = false;
        for (var _i = 0, parameters_1 = parameters; _i < parameters_1.length; _i++) {
            var parameter = parameters_1[_i];
            if (parameter.optional) {
                optionalParameterFound = true;
            }
            if (optionalParameterFound && !parameter.optional) {
                return false;
            }
        }
        return true;
    };
    PublisherEvent.prototype.checkForDuplicateParameters = function (parameters) {
        var parametersAlreadyFound = {};
        for (var i = 0, parameter = void 0; parameter = parameters[i]; i = i + 1) {
            if (parametersAlreadyFound[parameter.name]) {
                return i;
            }
            parametersAlreadyFound[parameter.name] = true;
        }
        return -1;
    };
    PublisherEvent.prototype.validParameterDefinitionArray = function (parameters) {
        if (parameters instanceof Array) {
            for (var _i = 0, parameters_2 = parameters; _i < parameters_2.length; _i++) {
                var parameter = parameters_2[_i];
                if (!(parameter instanceof ParameterDefinition)) {
                    return false;
                }
            }
        }
        else {
            return false;
        }
        return true;
    };
    PublisherEvent.prototype.performValidPublisherEventCheck = function (event) {
        if (typeof event.name !== "string" || event.name.length <= 0) {
            throw new Error("Expected the event name to be a string with at least 1 character.");
        }
        var duplicateParameterPosition = event.checkForDuplicateParameters(event.parameters);
        if (duplicateParameterPosition > -1) {
            throw new Error("Parameter " + duplicateParameterPosition + " of the event parameters is already defined.");
        }
        if (!this.validParameterOrder(event.parameters)) {
            throw new Error("A required parameter cannot follow an optional parameter.");
        }
        if (typeof event.description !== "string") {
            throw new Error("Expected description of event " + event.name + " to be a string.");
        }
    };
    PublisherEvent.prototype.checkHandlersArgumentsMatchParametersDefined = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        for (var i = 0, parameter = void 0; parameter = this.parameters[i]; i = i + 1) {
            if (typeof args[i] !== parameter.type) {
                if (!parameter.optional) {
                    throw new Error("The handler parameters given don't match those defined for " +
                        ("event " + this.name + ". Expected argument " + i + " to be of type \"" + parameter.type + "\" ") +
                        ("but found type \"" + typeof args[i] + "\"."));
                }
                else {
                    if (!(typeof args[i] === "undefined")) {
                        throw new Error("The handler parameters given don't match those defined for " +
                            ("event " + this.name + ". Expected argument " + i + " to be of type \"" + parameter.type + "\" ") +
                            ("but found type \"" + typeof args[i] + "\"."));
                    }
                }
            }
        }
    };
    return PublisherEvent;
}());
var Publisher = (function () {
    function Publisher(checkEventAndArgumentsOnPublish) {
        this.subscriptions = {};
        this.registeredEvents = [];
        if (checkEventAndArgumentsOnPublish) {
            this.checkEventAndArgumentsOnPublish = true;
        }
        else {
            this.checkEventAndArgumentsOnPublish = false;
        }
    }
    Publisher.prototype.eventIndex = function (eventName) {
        for (var i = 0, event_1; event_1 = this.registeredEvents[i]; i = i + 1) {
            if (event_1.name === eventName) {
                return i;
            }
        }
        return -1;
    };
    Publisher.prototype.getEvent = function (eventName) {
        if (!eventName) {
            throw new Error("Expected an event name.");
        }
        var eventIndex = this.eventIndex(eventName);
        if (eventIndex > -1) {
            var event_2 = this.registeredEvents[eventIndex];
            event_2.handlers = this.subscriptions[eventName] || [];
            return event_2;
        }
        else {
            throw new Error("Event " + eventName + " is not registered. Cannot get an event that isn't registered.");
        }
    };
    Publisher.prototype.getAllEvents = function () {
        var events = [];
        for (var _i = 0, _a = this.registeredEvents; _i < _a.length; _i++) {
            var event_3 = _a[_i];
            events.push(this.getEvent(event_3.name));
        }
        return events;
    };
    Publisher.prototype.getEventDescription = function (eventName) {
        return this.getEvent(eventName).description;
    };
    Publisher.prototype.getEventHandlers = function (eventName) {
        return this.getEvent(eventName).handlers;
    };
    Publisher.prototype.getEventParameters = function (eventName) {
        return this.getEvent(eventName).parameters;
    };
    Publisher.prototype.getEventRegistrant = function (eventName) {
        return this.getEvent(eventName).registrant;
    };
    Publisher.prototype.isRegistered = function (eventName) {
        if (this.eventIndex(eventName) > -1) {
            return true;
        }
        else {
            return false;
        }
    };
    Publisher.prototype.register = function (eventName, parameters, description, registrant) {
        if (!eventName || eventName.length <= 0) {
            throw new Error("Expected an event name with at least 1 character in order to register an event.");
        }
        if (this.isRegistered(eventName)) {
            throw new Error("Event " + eventName + " is already registered.");
        }
        var newEvent = new PublisherEvent(eventName, parameters, description, registrant);
        this.registeredEvents.push(newEvent);
    };
    Publisher.prototype.deregister = function (eventName) {
        if (!eventName) {
            throw new Error("Expected an event name to deregister.");
        }
        var eventIndex = this.eventIndex(eventName);
        if (eventIndex > -1) {
            this.unsubscribe(eventName);
            this.registeredEvents.splice(eventIndex, 1);
        }
        else {
            throw new Error("Event " + eventName + " is not registered. Cannot deregister and event that isn't registered.");
        }
    };
    Publisher.prototype.deregisterAll = function () {
        this.subscriptions = {};
        this.registeredEvents = [];
    };
    Publisher.prototype.subscribe = function (eventName, handler) {
        if (!eventName) {
            throw new Error("Expected an event name to subscribe.");
        }
        if (!this.isRegistered(eventName)) {
            throw new Error(("Event " + eventName + " is not registered. ") +
                "Cannot subscribe to an event that isn't registered.");
        }
        if (!handler) {
            throw new Error("Expected an event handler.");
        }
        var event = this.getEvent(eventName);
        var requiredParameterCount = 0;
        for (var _i = 0, _a = event.parameters; _i < _a.length; _i++) {
            var parameter = _a[_i];
            if (!parameter.optional) {
                requiredParameterCount = requiredParameterCount + 1;
            }
            else {
                break;
            }
        }
        if (requiredParameterCount > handler.length) {
            var parameterString = "";
            for (var i = 0, parameter = void 0; parameter = event.parameters[i]; i = i + 1) {
                if (i > 0 && i < event.parameters.length) {
                    parameterString = parameterString + ", ";
                }
                parameterString = parameterString +
                    ((parameter.name + (parameter.optional ? "?" : "")) + ": " + parameter.type);
            }
            throw new Error(("Expected (" + parameterString + ") parameters for the event " + eventName + " handlers. ") +
                "Make sure the handlers cater for the correct parameters and their corresponding types.");
        }
        if (!this.subscriptions.hasOwnProperty(eventName)) {
            this.subscriptions[eventName] = [];
        }
        this.subscriptions[eventName].push(handler);
        return handler;
    };
    Publisher.prototype.unsubscribe = function (eventName, handler) {
        if (!eventName) {
            throw new Error("Expected an event name to unsubscribe.");
        }
        if (!this.isRegistered(eventName)) {
            throw new Error(("Event " + eventName + " is not registered. ") +
                "Cannot unsubscribe from an event that isn't registered.");
        }
        if (!this.subscriptions.hasOwnProperty(eventName)) {
            return false;
        }
        if (!handler) {
            delete this.subscriptions[eventName];
        }
        else {
            var index = this.subscriptions[eventName].indexOf(handler);
            if (index > -1) {
                this.subscriptions[eventName].splice(index, 1);
                if (this.subscriptions[eventName].length <= 0) {
                    delete this.subscriptions[eventName];
                }
            }
        }
        return true;
    };
    Publisher.prototype.publish = function (eventName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!eventName) {
            throw new Error("Expected an event name to publish.");
        }
        var eventHandlers = this.subscriptions[eventName] || [];
        if (this.checkEventAndArgumentsOnPublish) {
            var event_4 = this.getEvent(eventName);
            for (var i = 0, handler = void 0; handler = eventHandlers[i]; i = i + 1) {
                event_4.checkHandlersArgumentsMatchParametersDefined.apply(event_4, args);
            }
        }
        for (var i = 0, handler = void 0; handler = eventHandlers[i]; i = i + 1) {
            handler.apply(void 0, args);
        }
    };
    return Publisher;
}());
var publisher = new Publisher(true);
var DeezerAdapter = (function () {
    function DeezerAdapter() {
        this.name = "Deezer";
        this.currentPosition = 0;
        this.currentDuration = 0;
        this.percentageLoaded = 0;
        this.trackEnd = false;
        this.unloaded = true;
    }
    DeezerAdapter.prototype.initialize = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var currentContext = _this;
            window.dzAsyncInit = function () {
                window.DZ.init({
                    appId: "190142",
                    channelUrl: "http://developers.deezer.com/examples/channel.php",
                    player: {
                        onload: function () {
                            window.DZ.Event.subscribe("player_position", function (array) {
                                if (!currentContext.trackEnd) {
                                    currentContext.currentPosition = array[0];
                                }
                            });
                            window.DZ.Event.subscribe("player_buffering", function (percentageLoaded) {
                                currentContext.percentageLoaded = percentageLoaded;
                            });
                            window.DZ.Event.subscribe("track_end", function () {
                                currentContext.trackEnd = true;
                                currentContext.currentPosition = currentContext.currentDuration;
                            });
                            resolve();
                        },
                    },
                });
            };
            var e = document.createElement("script");
            e.src = "https://cdns-files.dzcdn.net/js/min/dz.js";
            e.async = true;
            document.getElementById("dz-root").appendChild(e);
            function keepTrying() {
                if (currentContext.unloaded) {
                    if (window.DZ.player.isPlaying()) {
                        window.DZ.player.pause();
                    }
                }
                setTimeout(keepTrying, 500);
            }
            keepTrying();
        });
    };
    DeezerAdapter.prototype.unload = function () {
        this.pause();
        this.currentPosition = 0;
        this.currentDuration = 0;
        this.percentageLoaded = 0;
        this.trackEnd = false;
        window.DZ.player.playTracks([]);
        this.unloaded = true;
        this.currentPlayer = undefined;
    };
    DeezerAdapter.prototype.load = function (track) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var currentContext = _this;
            currentContext.unloaded = false;
            _this.currentPosition = 0;
            _this.currentDuration = 0;
            _this.percentageLoaded = 0;
            _this.trackEnd = false;
            var trackId;
            if (track.services[_this.name]) {
                trackId = track.services[_this.name].trackId;
            }
            if (trackId) {
                window.DZ.player.playTracks([trackId], function (response) {
                    if (response.tracks.length <= 0) {
                        reject();
                    }
                    else {
                        currentContext.currentDuration = response.tracks[0].duration;
                        function keepTrying() {
                            if (window.DZ.player.play() === false) {
                                window.DZ.player.pause();
                                setTimeout(keepTrying, 150);
                            }
                            else {
                                currentContext.currentPlayer = window.DZ.player;
                                resolve();
                            }
                        }
                        keepTrying();
                    }
                });
            }
            else {
                reject();
            }
        });
    };
    DeezerAdapter.prototype.play = function () {
        if (this.currentPlayer) {
            this.trackEnd = false;
            this.currentPlayer.play();
        }
    };
    DeezerAdapter.prototype.pause = function () {
        if (this.currentPlayer) {
            this.currentPlayer.pause();
        }
    };
    DeezerAdapter.prototype.getPaused = function () {
        if (this.currentPlayer) {
            return !(this.currentPlayer.isPlaying());
        }
        else {
            return true;
        }
    };
    DeezerAdapter.prototype.setVolume = function (volume) {
        if (this.currentPlayer) {
            this.currentPlayer.setVolume(volume * 100);
        }
    };
    DeezerAdapter.prototype.seekToPercentage = function (percentage) {
        if (this.currentPlayer) {
            this.currentPlayer.seek(percentage * 100);
        }
    };
    DeezerAdapter.prototype.getCurrentTime = function () {
        if (this.currentPlayer) {
            return this.currentPosition * 1000;
        }
        else {
            return 0;
        }
    };
    DeezerAdapter.prototype.getDuration = function () {
        if (this.currentPlayer) {
            return this.currentDuration * 1000;
        }
        else {
            return 0;
        }
    };
    DeezerAdapter.prototype.getPercentageLoaded = function () {
        if (this.currentPlayer) {
            return this.percentageLoaded / 100;
        }
        else {
            return 0;
        }
    };
    return DeezerAdapter;
}());
var SoundCloudAdapter = (function () {
    function SoundCloudAdapter() {
        this.name = "SoundCloud";
        this.CLIENT_ID = "557c90822ab6395bc8da3b9f62d86ab8";
        this.players = {};
    }
    SoundCloudAdapter.prototype.initialize = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            window.SC.initialize({
                client_id: _this.CLIENT_ID,
                redirect_uri: window.location.origin,
            });
            resolve();
        });
    };
    SoundCloudAdapter.prototype.unload = function () {
        this.pause();
        if (this.currentPlayer) {
            this.currentPlayer = undefined;
        }
    };
    SoundCloudAdapter.prototype.load = function (track) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var trackPath;
            if (track.services[_this.name]) {
                trackPath = track.services[_this.name].trackPath;
            }
            if (trackPath) {
                if (_this.players[trackPath]) {
                    _this.currentPlayer = _this.players[trackPath];
                    _this.seekToPercentage(0);
                    _this.currentPlayer.play();
                    resolve();
                }
                else {
                    window.SC.stream(trackPath).then(function (streamPlayer) {
                        _this.players[trackPath] = streamPlayer;
                        _this.currentPlayer = _this.players[trackPath];
                        _this.currentPlayer.play();
                        resolve();
                    }).catch(function (error) {
                        this.unload();
                        reject();
                    });
                }
            }
            else {
                reject();
            }
        });
    };
    SoundCloudAdapter.prototype.play = function () {
        if (this.currentPlayer) {
            this.currentPlayer.play();
        }
    };
    SoundCloudAdapter.prototype.pause = function () {
        if (this.currentPlayer) {
            this.currentPlayer.pause();
        }
    };
    SoundCloudAdapter.prototype.getPaused = function () {
        if (this.currentPlayer) {
            return this.currentPlayer.isPaused();
        }
        else {
            return true;
        }
    };
    SoundCloudAdapter.prototype.setVolume = function (volume) {
        if (this.currentPlayer) {
            this.currentPlayer.setVolume(volume);
        }
    };
    SoundCloudAdapter.prototype.seekToPercentage = function (percentage) {
        if (this.currentPlayer) {
            this.currentPlayer.seek(this.getDuration() * percentage);
        }
    };
    SoundCloudAdapter.prototype.getCurrentTime = function () {
        if (this.currentPlayer) {
            return this.currentPlayer.currentTime();
        }
        else {
            return 0;
        }
    };
    SoundCloudAdapter.prototype.getDuration = function () {
        if (this.currentPlayer) {
            if (this.currentPlayer.streamInfo) {
                return this.currentPlayer.streamInfo.duration;
            }
            else {
                return 0;
            }
        }
        else {
            return 0;
        }
    };
    SoundCloudAdapter.prototype.getPercentageLoaded = function () {
        if (this.currentPlayer) {
            return (this.currentPlayer.buffered() / this.getDuration()) || 0;
        }
        else {
            return 0;
        }
    };
    return SoundCloudAdapter;
}());
var YouTubeAdapter = (function () {
    function YouTubeAdapter() {
        this.name = "YouTube";
        publisher.register("youtube-onStateChange");
        publisher.register("youtube-onError");
    }
    YouTubeAdapter.prototype.initialize = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            var thisContext = _this;
            window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
                thisContext.youtubePlayer = new YT.Player("youtube-player", {
                    events: {
                        "onReady": function () {
                            resolve();
                        },
                        "onStateChange": function (e) {
                            publisher.publish("youtube-onStateChange", e);
                        },
                        "onError": function (e) {
                            publisher.publish("youtube-onError", e);
                        },
                    },
                    height: "300",
                    playerVars: {
                        "controls": 0,
                    },
                    videoId: "",
                    width: "600",
                });
            };
        });
    };
    YouTubeAdapter.prototype.unload = function () {
        this.youtubePlayer.stopVideo();
    };
    YouTubeAdapter.prototype.load = function (track) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var videoId;
            if (track.services[_this.name]) {
                videoId = track.services[_this.name].videoId;
            }
            if (videoId) {
                function onStateChangeHandler(e) {
                    if (e.data === 1) {
                        publisher.unsubscribe("youtube-onStateChange", onStateChangeHandler);
                        publisher.unsubscribe("youtube-onError", onErrorHandler);
                        resolve();
                    }
                }
                function onErrorHandler(e) {
                    publisher.unsubscribe("youtube-onStateChange", onStateChangeHandler);
                    publisher.unsubscribe("youtube-onError", onErrorHandler);
                    reject(e);
                }
                publisher.subscribe("youtube-onStateChange", onStateChangeHandler);
                publisher.subscribe("youtube-onError", onErrorHandler);
                _this.youtubePlayer.loadVideoById(videoId);
            }
            else {
                reject();
            }
        });
    };
    YouTubeAdapter.prototype.play = function () {
        this.youtubePlayer.playVideo();
    };
    YouTubeAdapter.prototype.pause = function () {
        this.youtubePlayer.pauseVideo();
    };
    YouTubeAdapter.prototype.getPaused = function () {
        return this.youtubePlayer.getPlayerState() === 2;
    };
    YouTubeAdapter.prototype.setVolume = function (volume) {
        this.youtubePlayer.setVolume(volume * 100);
    };
    YouTubeAdapter.prototype.seekToPercentage = function (percentage) {
        this.youtubePlayer.seekTo(this.youtubePlayer.getDuration() * percentage, true);
    };
    YouTubeAdapter.prototype.getCurrentTime = function () {
        return this.youtubePlayer.getCurrentTime() * 1000;
    };
    YouTubeAdapter.prototype.getDuration = function () {
        return this.youtubePlayer.getDuration() * 1000;
    };
    YouTubeAdapter.prototype.getPercentageLoaded = function () {
        return this.youtubePlayer.getVideoLoadedFraction();
    };
    return YouTubeAdapter;
}());
var CONSTANTS = {
    PLAYER: {
        DEFAULTS: {
            MUTED: false,
            PAUSED: false,
            PAUSED_STATE_AFTER_PREVIOUS_OR_NEXT: "maintain-current",
            REPEAT: "repeat-all",
            SHUFFLE: false,
            TIME_AFTER_WHICH_TO_RESTART_TRACK: 3000,
            VOLUME: 1,
        },
        EVENTS: {},
        REGISTERED_SERVICES: [
            {
                adapter: SoundCloudAdapter,
                name: "SoundCloud",
            },
            {
                adapter: YouTubeAdapter,
                name: "YouTube",
            },
        ],
    },
};
var Verification = (function () {
    function Verification() {
    }
    Verification.prototype.getYouTubeVideoId = function (link) {
        var youtubeURLIdentifier = "v=";
        var index = link.indexOf(youtubeURLIdentifier);
        var YouTubeVideoIDLength = 11;
        if (index >= 0) {
            return link.slice(index + youtubeURLIdentifier.length, index + youtubeURLIdentifier.length + YouTubeVideoIDLength);
        }
        else {
            return undefined;
        }
    };
    Verification.prototype.youtubeVideoIdToLink = function (videoId) {
        if (!videoId) {
            return undefined;
        }
        var youtubeURL = "https://www.youtube.com/watch?v=";
        return youtubeURL + videoId;
    };
    Verification.prototype.getYouTubeVideoTitle = function (videoId) {
        return new Promise(function (resolve, reject) {
            var apiKey = "AIzaSyAN7vyNOXc_U-qWbxkLt6RPx-PAT2dl3qQ";
            $.ajax({
                dataType: "jsonp",
                error: function (jqXHR, textStatus, errorThrown) {
                    reject("Could not get title.");
                },
                success: function (data) {
                    if (data) {
                        if (data.items) {
                            if (data.items[0]) {
                                resolve(data.items[0].snippet.title);
                            }
                            else {
                                reject("Could not get title.");
                            }
                        }
                        else {
                            reject("Could not get title.");
                        }
                    }
                    else {
                        reject("Could not get title.");
                    }
                },
                url: "https://www.googleapis.com/youtube/v3/videos?id=" + videoId + "&key=" + apiKey + "&fields=items(snippet(title))&part=snippet",
            });
        });
    };
    Verification.prototype.getDeezerTrackId = function (link) {
        var deezerURLIdentifier = "deezer.com/track/";
        var index = link.indexOf(deezerURLIdentifier);
        var deezerTrackIdLength = 0;
        for (var i = (index + deezerURLIdentifier.length), character = void 0; character = link[i]; i = i + 1) {
            if (!isNaN(character)) {
                deezerTrackIdLength = deezerTrackIdLength + 1;
            }
            else {
                break;
            }
        }
        if (index >= 0) {
            return link.slice(index + deezerURLIdentifier.length, index + deezerURLIdentifier.length + deezerTrackIdLength);
        }
        else {
            return undefined;
        }
    };
    Verification.prototype.deezerTrackIdToLink = function (trackId) {
        if (!trackId) {
            return undefined;
        }
        var deezerURL = "http://www.deezer.com/track/";
        return deezerURL + trackId;
    };
    Verification.prototype.getDeezerTrackObject = function (trackId) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                dataType: "jsonp",
                error: function (jqXHR, textStatus, errorThrown) {
                    reject("Could not get track object.");
                },
                success: function (data) {
                    resolve(data);
                },
                url: "https://api.deezer.com/track/" + trackId + "?output=jsonp",
            });
        });
    };
    Verification.prototype.getSoundCloudObject = function (link) {
        return new Promise(function (resolve, reject) {
            SC.resolve(link).then(function (object) {
                if (object.kind === "track") {
                    resolve(object);
                }
                else {
                    reject();
                }
            }).catch(function () {
                reject();
            });
        });
    };
    Verification.prototype.soundcloudTrackPathToLink = function (trackPath) {
        return new Promise(function (resolve, reject) {
            if (!trackPath) {
                reject();
            }
            else {
                SC.resolve("https://api.soundcloud.com" + trackPath).then(function (object) {
                    if (object) {
                        resolve(object.permalink_url);
                    }
                    else {
                        reject();
                    }
                }).catch(function () {
                    reject();
                });
            }
        });
    };
    return Verification;
}());
var settings = {
    player: {
        muted: CONSTANTS.PLAYER.DEFAULTS.MUTED,
        repeat: CONSTANTS.PLAYER.DEFAULTS.REPEAT,
        shuffle: CONSTANTS.PLAYER.DEFAULTS.SHUFFLE,
        timeAfterWhichToRestartTrack: CONSTANTS.PLAYER.DEFAULTS.TIME_AFTER_WHICH_TO_RESTART_TRACK,
        volume: CONSTANTS.PLAYER.DEFAULTS.VOLUME,
    },
};
var Player = (function () {
    function Player() {
        this.REGISTERED_SERVICES = CONSTANTS.PLAYER.REGISTERED_SERVICES;
        this.REPEAT_STATES = {
            ALL: "repeat-all",
            OFF: "repeat-off",
            ONE: "repeat-one",
        };
        this.PAUSED_STATES = {
            MAINTAIN_CURRENT: "maintain-current",
            PAUSED: "paused",
            PLAY: "play",
        };
        this.DEFAULTS = {
            MUTED: CONSTANTS.PLAYER.DEFAULTS.MUTED,
            PAUSED: CONSTANTS.PLAYER.DEFAULTS.PAUSED,
            PAUSED_STATE_AFTER_PREVIOUS_OR_NEXT: CONSTANTS.PLAYER.DEFAULTS.PAUSED_STATE_AFTER_PREVIOUS_OR_NEXT,
            REPEAT: CONSTANTS.PLAYER.DEFAULTS.REPEAT,
            SHUFFLE: CONSTANTS.PLAYER.DEFAULTS.SHUFFLE,
            TIME_AFTER_WHICH_TO_RESTART_TRACK: CONSTANTS.PLAYER.DEFAULTS.TIME_AFTER_WHICH_TO_RESTART_TRACK,
            VOLUME: CONSTANTS.PLAYER.DEFAULTS.VOLUME,
        };
        this.EVENTS = {
            ON_ALL_TRACKS_DEQUEUED: "onAllTracksDequeued",
            ON_MUSIC_SERVICE_CHANGE: "onMusicServiceChange",
            ON_MUSIC_SERVICE_INITIALIZED: "onMusicServiceInitialized",
            ON_MUSIC_SERVICE_LOADING: "onMusicServiceLoading",
            ON_MUSIC_SERVICE_LOAD_FAILED: "onMusicServiceLoadFailed",
            ON_MUTED_CHANGE: "onMutedChange",
            ON_NEXT: "onNext",
            ON_PLAY_PAUSE: "onPlayPause",
            ON_PREVIOUS: "onPrevious",
            ON_REORDER_QUEUE: "onReorderQueue",
            ON_REPEAT_CHANGE: "onRepeatChange",
            ON_RESTART: "onRestart",
            ON_SHUFFLE_CHANGE: "onShuffleChange",
            ON_TIME_UPDATE: "onTimeUpdate",
            ON_TRACKS_QUEUED: "onTracksQueued",
            ON_TRACK_BUFFERING: "onTrackBuffering",
            ON_TRACK_DEQUEUED: "onTrackDequeued",
            ON_TRACK_FINISHED_BUFFERING: "onTrackFinishedBuffering",
            ON_TRACK_INDEX_UPDATED: "onTrackIndexUpdated",
            ON_TRACK_LOADED: "onTrackLoaded",
            ON_TRACK_LOADING: "onTrackLoading",
            ON_TRACK_LOAD_FAILED: "onTrackLoadFailed",
            ON_VOLUME_CHANGE: "onVolumeChange",
        };
        this.musicServices = [];
        this.currentlyDynamicallyChangingMusicServices = false;
        this.currentMusicServiceIndex = -1;
        this.currentlyLoadingMusicService = false;
        this.orderedQueue = [];
        this.shuffledQueue = [];
        this.currentTrackIndex = -1;
        this.waitingToLoadIndex = undefined;
        this.currentlyBusyWithLoad = false;
        this.currentlyBusyWithLoadTrack = false;
        this.isPaused = this.DEFAULTS.PAUSED;
        this.millisecondsSinceCorrectingToPlaying = 0;
        this.millisecondsSinceCorrectingToPaused = 0;
        this.pausedStateAfterPreviousOrNext = this.DEFAULTS.PAUSED_STATE_AFTER_PREVIOUS_OR_NEXT;
        this.currentlySeekingToPercentage = -1;
        this.millisecondsToTrySeekFor = 5000;
        this.seekUpdateTimeoutFrequency = 1000;
        this.millisecondsToTryFor = 8000;
        this.updateTimeoutFrequency = 300;
        this.automaticNextAllowed = true;
        this.volume = this.DEFAULTS.VOLUME;
        this.muted = this.DEFAULTS.MUTED;
        if (!CONSTANTS.PLAYER) {
            throw new Error("CONSTANTS.PLAYER is used throughout the Player class and needs to be defined.");
        }
        if (!publisher) {
            throw new Error("The publish-subscribe library is used through the Player class " +
                "and should be instantiated before the Player class is instantiated.");
        }
        this.registerPlayerEvents();
        this.setupPublishingEvents();
        this.subscribeToEvents();
        for (var i = 0, musicService = void 0; musicService = this.REGISTERED_SERVICES[i]; i = i + 1) {
            this.musicServices[i] = {
                adapter: new musicService.adapter(),
                initialized: false,
                name: musicService.name,
            };
        }
        if (this.musicServices[0]) {
            this.changeMusicService(this.musicServices[0].name);
        }
        else {
            throw new Error("No music service player adapters available.");
        }
        this.setRepeat(this.DEFAULTS.REPEAT);
        this.setShuffle(this.DEFAULTS.SHUFFLE);
        this.timeAfterWhichToRestartTrack = this.DEFAULTS.TIME_AFTER_WHICH_TO_RESTART_TRACK;
        this.verifyStates();
    }
    Player.prototype.registerPlayerEvents = function () {
        publisher.register(this.EVENTS.ON_ALL_TRACKS_DEQUEUED);
        publisher.register(this.EVENTS.ON_MUSIC_SERVICE_CHANGE, [
            {
                description: "The name of the music service that was being used.",
                name: "previousMusicServiceName",
                type: "string",
            },
            {
                description: "The name of the music service currently being used.",
                name: "currentMusicServiceName",
                type: "string",
            },
        ]);
        publisher.register(this.EVENTS.ON_MUSIC_SERVICE_INITIALIZED, [
            {
                description: "The name of the music service that was initialized used.",
                name: "musicServiceName",
                type: "string",
            },
        ]);
        publisher.register(this.EVENTS.ON_MUSIC_SERVICE_LOADING, [
            {
                description: "The name of the music service that is being loaded.",
                name: "musicServiceName",
                type: "string",
            },
        ]);
        publisher.register(this.EVENTS.ON_MUSIC_SERVICE_LOAD_FAILED, [
            {
                description: "The name of the music service that failed to load.",
                name: "musicServiceName",
                type: "string",
            },
        ]);
        publisher.register(this.EVENTS.ON_MUTED_CHANGE, [
            {
                name: "muted",
                type: "boolean",
            },
        ]);
        publisher.register(this.EVENTS.ON_NEXT);
        publisher.register(this.EVENTS.ON_PLAY_PAUSE, [
            {
                name: "paused",
                type: "boolean",
            },
        ]);
        publisher.register(this.EVENTS.ON_PREVIOUS);
        publisher.register(this.EVENTS.ON_REORDER_QUEUE);
        publisher.register(this.EVENTS.ON_REPEAT_CHANGE, [
            {
                name: "repeat",
                type: "string",
            },
        ]);
        publisher.register(this.EVENTS.ON_RESTART);
        publisher.register(this.EVENTS.ON_SHUFFLE_CHANGE, [
            {
                name: "shuffled",
                type: "boolean",
            },
        ]);
        publisher.register(this.EVENTS.ON_TIME_UPDATE, [
            {
                name: "time",
                type: "number",
            },
            {
                name: "duration",
                type: "number",
            },
            {
                name: "percentage",
                type: "number",
            },
            {
                name: "percentageLoaded",
                type: "number",
            },
        ]);
        publisher.register(this.EVENTS.ON_TRACKS_QUEUED);
        publisher.register(this.EVENTS.ON_TRACK_BUFFERING);
        publisher.register(this.EVENTS.ON_TRACK_DEQUEUED, [
            {
                name: "track",
                type: "object",
            },
        ]);
        publisher.register(this.EVENTS.ON_TRACK_FINISHED_BUFFERING);
        publisher.register(this.EVENTS.ON_TRACK_INDEX_UPDATED, [
            {
                name: "previousIndex",
                type: "number",
            },
            {
                name: "currentIndex",
                type: "number",
            },
        ]);
        publisher.register(this.EVENTS.ON_TRACK_LOADED, [
            {
                name: "track",
                type: "object",
            },
            {
                name: "musicServiceName",
                type: "string",
            },
        ]);
        publisher.register(this.EVENTS.ON_TRACK_LOADING, [
            {
                name: "track",
                type: "object",
            },
            {
                name: "musicServiceName",
                type: "string",
            },
        ]);
        publisher.register(this.EVENTS.ON_TRACK_LOAD_FAILED, [
            {
                name: "track",
                type: "object",
            },
            {
                name: "musicServiceName",
                type: "string",
            },
        ]);
        publisher.register(this.EVENTS.ON_VOLUME_CHANGE, [
            {
                name: "volume",
                type: "number",
            },
        ]);
    };
    Player.prototype.setupPublishingEvents = function () {
        var currentTime;
        var currentDuration;
        var currentPercentage;
        var currentPercentageLoaded;
        var publishedBufferingEvent = false;
        var publishedFinishedBufferingEvent = false;
        var lastTime = 0;
        var playerContext = this;
        function timeUpdated() {
            currentTime = playerContext.getCurrentTime();
            currentDuration = playerContext.getDuration();
            currentPercentage = (currentTime / currentDuration) || 0;
            currentPercentageLoaded = playerContext.getPercentageLoaded();
            if (currentPercentageLoaded <= currentPercentage) {
                publishedFinishedBufferingEvent = false;
                if (!publishedBufferingEvent) {
                    publisher.publish(playerContext.EVENTS.ON_TRACK_BUFFERING);
                    publishedBufferingEvent = true;
                }
            }
            else {
                publishedBufferingEvent = false;
                if (!publishedFinishedBufferingEvent) {
                    publisher.publish(playerContext.EVENTS.ON_TRACK_FINISHED_BUFFERING);
                    publishedFinishedBufferingEvent = true;
                }
            }
            if (currentTime !== lastTime) {
                lastTime = currentPercentage;
                if (playerContext.currentlySeekingToPercentage !== -1) {
                    publisher.publish(playerContext.EVENTS.ON_TIME_UPDATE, currentTime, currentDuration, playerContext.currentlySeekingToPercentage, currentPercentageLoaded);
                }
                else {
                    publisher.publish(playerContext.EVENTS.ON_TIME_UPDATE, currentTime, currentDuration, currentPercentage, currentPercentageLoaded);
                }
            }
            setTimeout(timeUpdated, playerContext.updateTimeoutFrequency);
        }
        timeUpdated();
    };
    Player.prototype.getCurrentMusicServiceIndex = function () {
        return this.currentMusicServiceIndex;
    };
    Player.prototype.setCurrentMusicServiceIndex = function (index) {
        if (index < this.musicServices.length && index >= 0) {
            this.currentMusicServiceIndex = index;
            return true;
        }
        else {
            return false;
        }
    };
    Player.prototype.changeMusicService = function (musicServiceName, recursiveCallAfterInitialization, previousMusicServiceName) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.currentlyLoadingMusicService = true;
            var millisecondsTried = 0;
            var previousTime = Date.now();
            var currentTime;
            var promiseResolvedOrRejected = false;
            var playerContext = _this;
            function isTimeOver() {
                currentTime = Date.now();
                millisecondsTried = millisecondsTried + (currentTime - previousTime);
                previousTime = currentTime;
                if (promiseResolvedOrRejected) {
                    console.log("Delt with the changeMusicService() promise already.");
                }
                if (millisecondsTried > playerContext.millisecondsToTryFor && (promiseResolvedOrRejected === false)) {
                    console.log("The changing music service timed out.");
                    publisher.publish(playerContext.EVENTS.ON_MUSIC_SERVICE_LOAD_FAILED, musicServiceName);
                    playerContext.currentlyLoadingMusicService = false;
                    promiseResolvedOrRejected = true;
                    reject("The changing music service timed out.");
                }
                else if (!promiseResolvedOrRejected) {
                    setTimeout(isTimeOver, playerContext.updateTimeoutFrequency);
                }
            }
            isTimeOver();
            var musicService;
            var musicServiceIndex;
            if (!recursiveCallAfterInitialization) {
                var previousMusicService = _this.musicServices[_this.getCurrentMusicServiceIndex()];
                if (previousMusicService) {
                    previousMusicServiceName = previousMusicService.name;
                }
                if (previousMusicServiceName !== musicServiceName) {
                    publisher.publish(_this.EVENTS.ON_MUSIC_SERVICE_LOADING, musicServiceName);
                }
                _this.unload(true);
            }
            for (var i = 0, currentMusicService = void 0; currentMusicService = _this.musicServices[i]; i = i + 1) {
                if (currentMusicService.name === musicServiceName) {
                    musicService = currentMusicService;
                    musicServiceIndex = i;
                    break;
                }
            }
            if (!musicService) {
                publisher.publish(_this.EVENTS.ON_MUSIC_SERVICE_LOAD_FAILED, musicServiceName);
                promiseResolvedOrRejected = true;
                _this.currentlyLoadingMusicService = false;
                reject("Music service " + musicServiceName + " not found in the list of registered music services (names are case-sensitive).");
            }
            else {
                _this.setCurrentMusicServiceIndex(musicServiceIndex);
                _this.currentPlayer = undefined;
                if (!musicService.initialized) {
                    musicService.adapter.initialize().then(function () {
                        publisher.publish(_this.EVENTS.ON_MUSIC_SERVICE_INITIALIZED, musicService.name);
                        musicService.initialized = true;
                        _this.changeMusicService(musicService.name, true, previousMusicServiceName).then(function () {
                            promiseResolvedOrRejected = true;
                            _this.currentlyLoadingMusicService = false;
                            resolve();
                        }).catch(function (error) {
                            promiseResolvedOrRejected = true;
                            _this.currentlyLoadingMusicService = false;
                            reject(error);
                        });
                    }).catch(function () {
                        publisher.publish(_this.EVENTS.ON_MUSIC_SERVICE_LOAD_FAILED, musicService.name);
                        promiseResolvedOrRejected = true;
                        _this.currentlyLoadingMusicService = false;
                        reject("Failed to initialize the new music service.");
                    });
                }
                else {
                    _this.currentPlayer = musicService.adapter;
                    _this.setVolume(_this.getVolume());
                    _this.setMuted(_this.getMuted());
                    if (previousMusicServiceName !== musicServiceName) {
                        var currentMusicServiceName = _this.musicServices[musicServiceIndex].name;
                        publisher.publish(_this.EVENTS.ON_MUSIC_SERVICE_CHANGE, previousMusicServiceName || "None", currentMusicServiceName);
                    }
                    promiseResolvedOrRejected = true;
                    _this.currentlyLoadingMusicService = false;
                    resolve();
                }
            }
        });
    };
    Player.prototype.seekToPercentageAfterDynamicChange = function (percentage) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.currentPlayer) {
                reject("Current player not set.");
            }
            else if ((percentage < 0) || (percentage > 1)) {
                reject("The percentage given is not between 0 and 1.");
            }
            else {
                _this.currentlySeekingToPercentage = percentage;
                var timeToSeekTo_1 = _this.getDuration() * percentage;
                var acceptableSeekErrorInMilliseconds_1 = 2000;
                var millisecondsTried_1 = 0;
                var previousTime_1 = Date.now();
                var currentTime_1;
                var playerContext_1 = _this;
                function isTimeOver() {
                    currentTime_1 = Date.now();
                    millisecondsTried_1 = millisecondsTried_1 + (currentTime_1 - previousTime_1);
                    previousTime_1 = currentTime_1;
                    if (millisecondsTried_1 <= playerContext_1.millisecondsToTrySeekFor && playerContext_1.currentlySeekingToPercentage === percentage) {
                        if (Math.abs(timeToSeekTo_1 - playerContext_1.getCurrentTime()) > acceptableSeekErrorInMilliseconds_1) {
                            playerContext_1.currentPlayer.seekToPercentage(playerContext_1.currentlySeekingToPercentage);
                            setTimeout(isTimeOver, playerContext_1.seekUpdateTimeoutFrequency);
                        }
                        else {
                            console.log("Has seeked to the correct position, now resuming play/pause state!!!!.");
                            playerContext_1.currentlySeekingToPercentage = -1;
                            resolve();
                        }
                    }
                    else {
                        playerContext_1.currentlySeekingToPercentage = -1;
                        reject("Failed to seek to the correct position.");
                    }
                }
                isTimeOver();
            }
        });
    };
    Player.prototype.dynamicallyChangeMusicService = function (musicServiceName, recursiveCall, progress, trackIndex, previousMusicServiceName) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if ((_this.currentlyDynamicallyChangingMusicServices && (recursiveCall !== undefined)) || _this.currentlyBusyWithLoad || _this.currentlyLoadingMusicService) {
                console.log("Already busy dynamically changing music services or loading a track.");
                reject("Already busy dynamically changing music services or busy loading a track into a music service.");
            }
            else {
                _this.currentlyDynamicallyChangingMusicServices = true;
                if (!recursiveCall) {
                    progress = _this.getCurrentPercentage();
                    trackIndex = _this.getCurrentIndex();
                    var previousMusicService = _this.musicServices[_this.getCurrentMusicServiceIndex()];
                    if (previousMusicService) {
                        previousMusicServiceName = previousMusicService.name;
                    }
                }
                if (musicServiceName === previousMusicServiceName && !recursiveCall) {
                    _this.currentlyDynamicallyChangingMusicServices = false;
                    resolve();
                }
                else {
                    _this.changeMusicService(musicServiceName).then(function () {
                        _this.currentlyDynamicallyChangingMusicServices = false;
                        _this.loadTrack(trackIndex, false).then(function () {
                            _this.seekToPercentageAfterDynamicChange(progress).then(function () {
                                resolve();
                            }).catch(function () {
                                resolve();
                            });
                        }).catch(function (error) {
                            reject(error);
                        });
                    }).catch(function (error) {
                        if (previousMusicServiceName) {
                            _this.dynamicallyChangeMusicService(previousMusicServiceName, true, progress, trackIndex, previousMusicServiceName).then(function () {
                                _this.currentlyDynamicallyChangingMusicServices = false;
                                resolve();
                            }).catch(function (e) {
                                _this.currentlyDynamicallyChangingMusicServices = false;
                                reject(e);
                            });
                        }
                        else {
                            _this.currentlyDynamicallyChangingMusicServices = false;
                            reject(error);
                        }
                    });
                }
            }
        });
    };
    Player.prototype.getShuffle = function () {
        return this.shuffle;
    };
    Player.prototype.shuffleTracks = function (tracks) {
        var shuffledTracks = tracks.slice(0);
        var currentIndex = shuffledTracks.length;
        var randomIndex;
        var temporaryValue;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex = currentIndex - 1;
            temporaryValue = shuffledTracks[currentIndex];
            shuffledTracks[currentIndex] = shuffledTracks[randomIndex];
            shuffledTracks[randomIndex] = temporaryValue;
        }
        return shuffledTracks;
    };
    Player.prototype.setShuffle = function (shuffle) {
        var currentTrack = this.getCurrentTrack();
        var currentTrackIndex;
        if (shuffle) {
            this.shuffledQueue = this.shuffleTracks(this.orderedQueue);
            currentTrackIndex = this.shuffledQueue.indexOf(currentTrack);
        }
        else {
            this.shuffledQueue = [];
            currentTrackIndex = this.orderedQueue.indexOf(currentTrack);
        }
        this.setCurrentIndex(currentTrackIndex);
        this.shuffle = shuffle;
        publisher.publish(this.EVENTS.ON_SHUFFLE_CHANGE, this.shuffle);
    };
    Player.prototype.toggleShuffle = function () {
        var shuffle = !this.getShuffle();
        this.setShuffle(shuffle);
        return shuffle;
    };
    Player.prototype.getRepeat = function () {
        return this.repeat;
    };
    Player.prototype.setRepeat = function (state) {
        if (state === this.REPEAT_STATES.OFF ||
            state === this.REPEAT_STATES.ONE ||
            state === this.REPEAT_STATES.ALL) {
            this.repeat = state;
        }
        else {
            this.repeat = this.REPEAT_STATES.ALL;
        }
        publisher.publish(this.EVENTS.ON_REPEAT_CHANGE, this.repeat);
    };
    Player.prototype.cycleRepeat = function () {
        var cycleOrder = [
            this.REPEAT_STATES.OFF,
            this.REPEAT_STATES.ALL,
            this.REPEAT_STATES.ONE,
        ];
        var currentIndex = cycleOrder.indexOf(this.getRepeat());
        this.setRepeat(cycleOrder[this.incrementIndex(currentIndex, 1, cycleOrder.length)]);
        return this.getRepeat();
    };
    Player.prototype.queue = function (trackOrTracks) {
        if (trackOrTracks instanceof Array) {
            for (var _i = 0, trackOrTracks_1 = trackOrTracks; _i < trackOrTracks_1.length; _i++) {
                var track = trackOrTracks_1[_i];
                this.orderedQueue.push(track);
            }
            if (this.getShuffle()) {
                for (var _a = 0, trackOrTracks_2 = trackOrTracks; _a < trackOrTracks_2.length; _a++) {
                    var track = trackOrTracks_2[_a];
                    this.shuffledQueue.push(track);
                }
            }
        }
        else {
            this.orderedQueue.push(trackOrTracks);
            if (this.getShuffle()) {
                this.shuffledQueue.push(trackOrTracks);
            }
        }
        publisher.publish(this.EVENTS.ON_TRACKS_QUEUED);
    };
    Player.prototype.dequeue = function (index) {
        if (!this.isIndexInQueue(index, this.getQueue())) {
            throw new Error("The dequeue index provided is not a valid index (i.e. isn't in the queue).");
        }
        if (this.waitingToLoadIndex === index) {
            this.waitingToLoadIndex = undefined;
        }
        var indexOfTrackToDequeue = index;
        var trackToBeDequeued;
        var shuffled = this.getShuffle();
        var repeat = this.getRepeat();
        var currentTrackIndex = this.currentTrackIndex;
        if (!shuffled) {
            trackToBeDequeued = this.orderedQueue[indexOfTrackToDequeue];
            this.orderedQueue.splice(indexOfTrackToDequeue, 1);
        }
        else {
            trackToBeDequeued = this.shuffledQueue[indexOfTrackToDequeue];
            var indexOfTrackToDequeueFromOrderedQueue = this.orderedQueue.indexOf(trackToBeDequeued);
            this.orderedQueue.splice(indexOfTrackToDequeueFromOrderedQueue, 1);
            this.shuffledQueue.splice(indexOfTrackToDequeue, 1);
        }
        var currentQueue = this.getQueue();
        if (currentQueue.length <= 0) {
            this.unload();
            publisher.publish(this.EVENTS.ON_TRACK_DEQUEUED, trackToBeDequeued);
            return;
        }
        if (currentTrackIndex === indexOfTrackToDequeue) {
            if (repeat === this.REPEAT_STATES.ONE) {
                this.unload();
                publisher.publish(this.EVENTS.ON_TRACK_DEQUEUED, trackToBeDequeued);
                return;
            }
            if (currentTrackIndex < currentQueue.length) {
                if (this.waitingToLoadIndex !== undefined) {
                    currentTrackIndex = this.waitingToLoadIndex;
                }
                this.loadTrack(currentTrackIndex, true);
            }
            else {
                if (repeat === this.REPEAT_STATES.ALL) {
                    if (this.waitingToLoadIndex !== undefined) {
                        currentTrackIndex = this.waitingToLoadIndex;
                    }
                    else {
                        currentTrackIndex = 0;
                    }
                    this.loadTrack(currentTrackIndex, true);
                }
                else {
                    this.setCurrentIndex(currentQueue.length - 1);
                    this.unload(true);
                }
            }
            publisher.publish(this.EVENTS.ON_TRACK_DEQUEUED, trackToBeDequeued);
            return;
        }
        if (indexOfTrackToDequeue < currentTrackIndex) {
            this.setCurrentIndex(currentTrackIndex - 1);
        }
        publisher.publish(this.EVENTS.ON_TRACK_DEQUEUED, trackToBeDequeued);
    };
    Player.prototype.dequeueAll = function () {
        this.orderedQueue = [];
        this.shuffledQueue = [];
        this.unload();
        publisher.publish(this.EVENTS.ON_ALL_TRACKS_DEQUEUED);
    };
    Player.prototype.getQueue = function () {
        if (this.getShuffle()) {
            return this.shuffledQueue || [];
        }
        else {
            return this.orderedQueue || [];
        }
    };
    Player.prototype.incrementIndex = function (index, increment, length) {
        if (length <= 0) {
            return -1;
        }
        var position = (index + increment) % length;
        position = position >= 0 ? position : (length + position);
        return Math.abs(position);
    };
    Player.prototype.getCurrentIndex = function () {
        if (this.waitingToLoadIndex !== undefined) {
            return this.waitingToLoadIndex;
        }
        else {
            return this.currentTrackIndex;
        }
    };
    Player.prototype.setCurrentIndex = function (index) {
        var currentQueue = this.getQueue();
        var previousIndex = this.currentTrackIndex;
        if (this.isIndexInQueue(index, currentQueue)) {
            this.currentTrackIndex = index;
            publisher.publish(this.EVENTS.ON_TRACK_INDEX_UPDATED, previousIndex, index);
            return true;
        }
        else {
            return false;
        }
    };
    Player.prototype.isIndexInQueue = function (index, queue) {
        if (index === undefined) {
            return false;
        }
        else {
            return (index >= 0) && (index <= (queue.length - 1));
        }
    };
    Player.prototype.reorderQueue = function (moves) {
        var currentQueue = this.getQueue();
        var track;
        for (var _i = 0, moves_1 = moves; _i < moves_1.length; _i++) {
            var move = moves_1[_i];
            if (this.isIndexInQueue(move.oldIndex, currentQueue) && this.isIndexInQueue(move.newIndex, currentQueue)) {
                if (move.oldIndex === this.getCurrentIndex()) {
                    this.currentTrackIndex = move.newIndex;
                }
                track = currentQueue.splice(move.oldIndex, 1)[0];
                currentQueue.splice(move.newIndex, 0, track);
            }
        }
        publisher.publish(this.EVENTS.ON_REORDER_QUEUE);
    };
    Player.prototype.getCurrentTrack = function () {
        var currentQueue = this.getQueue();
        var currentIndex = this.getCurrentIndex();
        if (this.isIndexInQueue(currentIndex, currentQueue)) {
            return currentQueue[currentIndex];
        }
        else {
            return undefined;
        }
    };
    Player.prototype.setPausedStateAfterPreviousOrNext = function (state) {
        if (state === this.PAUSED_STATES.PAUSED ||
            state === this.PAUSED_STATES.PLAY ||
            state === this.PAUSED_STATES.MAINTAIN_CURRENT) {
            this.repeat = state;
        }
        else {
            this.repeat = this.PAUSED_STATES.MAINTAIN_CURRENT;
        }
    };
    Player.prototype.maintainPlayOrPause = function () {
        if (this.pausedStateAfterPreviousOrNext === this.PAUSED_STATES.PAUSED) {
            this.pause();
        }
        else if (this.pausedStateAfterPreviousOrNext === this.PAUSED_STATES.PLAY) {
            this.play();
        }
    };
    Player.prototype.next = function (tracksTried) {
        var _this = this;
        if (this.currentPlayer) {
            this.currentPlayer.pause();
        }
        var currentQueue = this.getQueue();
        var currentIndex;
        if (this.waitingToLoadIndex !== undefined) {
            currentIndex = this.waitingToLoadIndex;
        }
        else {
            currentIndex = this.getCurrentIndex();
        }
        var repeat = this.getRepeat();
        if (!this.isIndexInQueue(currentIndex, currentQueue)) {
            throw new Error("Cannot get the next track in the queue if the current track isn't in the queue.");
        }
        publisher.publish(this.EVENTS.ON_NEXT);
        if (repeat === this.REPEAT_STATES.ONE) {
            this.restart().then(function () {
                _this.automaticNextAllowed = true;
            }).catch(function () {
                _this.automaticNextAllowed = true;
            });
            this.maintainPlayOrPause();
            return;
        }
        else if (repeat === this.REPEAT_STATES.OFF) {
            if (currentIndex >= (currentQueue.length - 1)) {
                this.waitingToLoadIndex = undefined;
                if (this.getCurrentIndex() !== (currentQueue.length - 1)) {
                    this.loadTrack((currentQueue.length - 1), true, tracksTried).then(function () {
                        _this.restart();
                        _this.pause();
                        _this.automaticNextAllowed = true;
                    }).catch(function () {
                        _this.automaticNextAllowed = true;
                    });
                }
                else {
                    this.restart();
                    this.pause();
                    this.automaticNextAllowed = true;
                }
            }
            else {
                this.loadTrack(currentIndex + 1, true, tracksTried).then(function () {
                    _this.automaticNextAllowed = true;
                }).catch(function () {
                    _this.automaticNextAllowed = true;
                });
                this.maintainPlayOrPause();
            }
        }
        else {
            this.loadTrack(this.incrementIndex(currentIndex, 1, currentQueue.length), true, tracksTried).then(function () {
                _this.automaticNextAllowed = true;
            }).catch(function () {
                _this.automaticNextAllowed = true;
            });
            this.maintainPlayOrPause();
        }
    };
    Player.prototype.previous = function () {
        var _this = this;
        if (this.currentPlayer) {
            this.currentPlayer.pause();
        }
        publisher.publish(this.EVENTS.ON_PREVIOUS);
        var currentQueue = this.getQueue();
        var currentIndex;
        if (this.waitingToLoadIndex !== undefined) {
            currentIndex = this.waitingToLoadIndex;
        }
        else {
            currentIndex = this.getCurrentIndex();
        }
        var repeat = this.getRepeat();
        if (!this.isIndexInQueue(currentIndex, currentQueue)) {
            throw new Error("Cannot get the previous track in the queue if the current track isn't in the queue.");
        }
        if ((repeat === this.REPEAT_STATES.ONE) ||
            (this.getCurrentTime() > this.timeAfterWhichToRestartTrack)) {
            this.restart();
            this.maintainPlayOrPause();
            return;
        }
        else if (repeat === this.REPEAT_STATES.OFF) {
            if (currentIndex === 0) {
                this.waitingToLoadIndex = undefined;
                if (this.getCurrentIndex() !== 0) {
                    this.loadTrack(0, true).then(function () {
                        _this.restart();
                        _this.pause();
                    });
                }
                else {
                    this.restart();
                    this.pause();
                }
            }
            else {
                this.loadTrack(currentIndex - 1, true);
                this.maintainPlayOrPause();
            }
        }
        else {
            this.loadTrack(this.incrementIndex(currentIndex, -1, currentQueue.length), true);
            this.maintainPlayOrPause();
        }
    };
    Player.prototype.unload = function (dontClearCurrentTrackIndex) {
        if (this.currentPlayer) {
            this.currentPlayer.unload();
            if (!dontClearCurrentTrackIndex) {
                this.currentTrackIndex = -1;
            }
        }
    };
    Player.prototype.load = function (index) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var millisecondsTried = 0;
            var previousTime = Date.now();
            var currentTime;
            var promiseResolvedOrRejected = false;
            var playerContext = _this;
            function isTimeOver() {
                currentTime = Date.now();
                millisecondsTried = millisecondsTried + (currentTime - previousTime);
                previousTime = currentTime;
                if (promiseResolvedOrRejected) {
                    console.log("Delt with the load() promise already.");
                }
                if (millisecondsTried > playerContext.millisecondsToTryFor && (promiseResolvedOrRejected === false)) {
                    console.log("Loading track timed out.");
                    publisher.publish(playerContext.EVENTS.ON_TRACK_LOAD_FAILED, trackBeingLoaded, currentMusicServiceName);
                    promiseResolvedOrRejected = false;
                    playerContext.currentlyBusyWithLoad = false;
                    reject("The loading of " + trackBeingLoaded.title + " timed out.");
                }
                else if (!promiseResolvedOrRejected) {
                    setTimeout(isTimeOver, playerContext.updateTimeoutFrequency);
                }
            }
            isTimeOver();
            var trackBeingLoaded = (_this.getQueue())[index];
            var currentMusicService = _this.musicServices[_this.getCurrentMusicServiceIndex()];
            var currentMusicServiceName;
            if (currentMusicService) {
                currentMusicServiceName = currentMusicService.name;
            }
            if (!_this.currentPlayer) {
                publisher.publish(_this.EVENTS.ON_TRACK_LOAD_FAILED, trackBeingLoaded, currentMusicServiceName);
                promiseResolvedOrRejected = true;
                _this.currentlyBusyWithLoad = false;
                reject("No music service specified to play the track with.");
            }
            else if (_this.currentlyBusyWithLoad) {
                publisher.publish(_this.EVENTS.ON_TRACK_LOAD_FAILED, trackBeingLoaded, currentMusicServiceName);
                promiseResolvedOrRejected = true;
                _this.currentlyBusyWithLoad = false;
                reject("The player hasn't finished loading the previous track.");
            }
            else if (_this.setCurrentIndex(index)) {
                publisher.publish(_this.EVENTS.ON_TRACK_LOADING, trackBeingLoaded, _this.currentPlayer.name);
                _this.currentlyBusyWithLoad = true;
                _this.currentPlayer.load(trackBeingLoaded).then(function () {
                    _this.currentPlayer.pause();
                    publisher.publish(_this.EVENTS.ON_TRACK_LOADED, trackBeingLoaded, _this.currentPlayer.name);
                    promiseResolvedOrRejected = true;
                    _this.currentlyBusyWithLoad = false;
                    resolve();
                }).catch(function (error) {
                    publisher.publish(_this.EVENTS.ON_TRACK_LOAD_FAILED, trackBeingLoaded, _this.currentPlayer.name);
                    promiseResolvedOrRejected = true;
                    _this.currentlyBusyWithLoad = false;
                    reject(error);
                });
            }
            else {
                promiseResolvedOrRejected = true;
                _this.currentlyBusyWithLoad = false;
                reject("Reject because it wasn't a valid index.");
            }
        });
    };
    Player.prototype.getNextUntriedMusicService = function (musicServicesTried) {
        if (!musicServicesTried) {
            musicServicesTried = {};
        }
        var currentMusicServiceIndex = this.getCurrentMusicServiceIndex();
        if ((currentMusicServiceIndex > (this.musicServices.length - 1)) || (currentMusicServiceIndex < 0)) {
            throw new Error("this.currentMusicServiceIndex is out of bounds.");
        }
        var currentMusicServiceName = this.musicServices[currentMusicServiceIndex].name;
        musicServicesTried[currentMusicServiceName] = true;
        var nextMusicServicesIndex = this.incrementIndex(this.currentMusicServiceIndex, 1, this.musicServices.length);
        var nextMusicServiceName = this.musicServices[nextMusicServicesIndex].name;
        if (!musicServicesTried[nextMusicServiceName]) {
            return {
                musicServicesTried: musicServicesTried,
                nextMusicServiceName: nextMusicServiceName,
            };
        }
        else {
            return {
                musicServicesTried: "Tried All",
                nextMusicServiceName: undefined,
            };
        }
    };
    Player.prototype.loadTrackOnSomeService = function (index, tryDefaultFirst, musicServicesTried) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.currentlyBusyWithLoad) {
                reject("The player hasn't finished loading the previous track.");
            }
            else if (!_this.setCurrentIndex(index)) {
                reject("The given index isn't in the queue.");
            }
            else if (musicServicesTried === "Tried All") {
                reject("All the music services have been tried, and none could load the track.");
            }
            else if (tryDefaultFirst && (_this.currentMusicServiceIndex !== 0)) {
                var defaultMusicServiceName = _this.musicServices[0].name;
                _this.changeMusicService(defaultMusicServiceName).then(function () {
                    _this.loadTrackOnSomeService(index, tryDefaultFirst, musicServicesTried).then(function () {
                        resolve();
                    }).catch(function (error) {
                        reject(error);
                    });
                }).catch(function () {
                    _this.loadTrackOnSomeService(index, false, musicServicesTried).then(function () {
                        resolve();
                    }).catch(function (error) {
                        reject(error);
                    });
                });
            }
            else if (!_this.currentPlayer) {
                reject("There isn't a player loaded.");
            }
            else {
                _this.load(index).then(function () {
                    if (_this.waitingToLoadIndex !== undefined && _this.waitingToLoadIndex !== _this.getCurrentIndex()) {
                        var waitingToLoadIndex = _this.waitingToLoadIndex;
                        _this.waitingToLoadIndex = undefined;
                        _this.loadTrack(waitingToLoadIndex, true).then(function () {
                            resolve();
                        }).catch(function (error) {
                            reject(error);
                        });
                    }
                    else {
                        resolve();
                    }
                }).catch(function () {
                    if (_this.waitingToLoadIndex !== undefined && _this.waitingToLoadIndex !== _this.getCurrentIndex()) {
                        var waitingToLoadIndex = _this.waitingToLoadIndex;
                        _this.waitingToLoadIndex = undefined;
                        _this.loadTrack(waitingToLoadIndex, true).then(function () {
                            resolve();
                        }).catch(function (error) {
                            reject(error);
                        });
                    }
                    else {
                        var temp = _this.getNextUntriedMusicService(musicServicesTried);
                        var nextMusicServiceNameToTry = temp.nextMusicServiceName;
                        musicServicesTried = temp.musicServicesTried;
                        if (nextMusicServiceNameToTry) {
                            _this.changeMusicService(nextMusicServiceNameToTry).then(function () {
                                _this.loadTrackOnSomeService(index, false, musicServicesTried).then(function () {
                                    resolve();
                                }).catch(function (error) {
                                    reject(error);
                                });
                            }).catch(function (error) {
                                reject(error);
                            });
                        }
                        else {
                            reject("The track failed to load on all the different music services.");
                        }
                    }
                });
            }
        });
    };
    Player.prototype.checkIfAllTracksHaveBeenTried = function (tracksTried) {
        if (!tracksTried) {
            return false;
        }
        var currentQueue = this.getQueue();
        for (var i = 0, track = void 0; track = currentQueue[i]; i = i + 1) {
            if (tracksTried[track.uuid] !== true) {
                return false;
            }
        }
        return true;
    };
    Player.prototype.loadTrack = function (index, tryDefaultFirst, tracksTried) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.currentlyBusyWithLoadTrack = true;
            var currentQueue = _this.getQueue();
            if (!_this.isIndexInQueue(index, currentQueue)) {
                _this.currentlyBusyWithLoadTrack = false;
                reject("The track requested isn't in the queue.");
            }
            else if (_this.currentlyBusyWithLoad) {
                _this.waitingToLoadIndex = index;
                console.log("WAITING TO LOAD: " + (_this.getQueue())[_this.waitingToLoadIndex].title);
                _this.currentlyBusyWithLoadTrack = false;
                reject("The player hasn't finished loading the previous track, the waitingToLoadIndex was updated though.");
            }
            else if (_this.checkIfAllTracksHaveBeenTried(tracksTried) || (currentQueue.length <= 0)) {
                _this.currentlyBusyWithLoadTrack = false;
                reject("None of the tracks in the queue are available on any of the music services.");
            }
            else {
                if (tracksTried === undefined) {
                    tracksTried = {};
                }
                var trackToLoad = currentQueue[index];
                var trackToLoadUUID_1;
                if (trackToLoad) {
                    trackToLoadUUID_1 = trackToLoad.uuid;
                }
                if (tryDefaultFirst === undefined) {
                    tryDefaultFirst = true;
                }
                _this.loadTrackOnSomeService(index, tryDefaultFirst).then(function () {
                    if (_this.waitingToLoadIndex !== undefined) {
                        var waitingToLoadIndex = _this.waitingToLoadIndex;
                        _this.waitingToLoadIndex = undefined;
                        _this.loadTrack(waitingToLoadIndex, true).then(function () {
                            _this.currentlyBusyWithLoadTrack = false;
                            resolve();
                        }).catch(function (error) {
                            _this.currentlyBusyWithLoadTrack = false;
                            reject(error);
                        });
                    }
                    else {
                        _this.currentlyBusyWithLoadTrack = false;
                        resolve();
                    }
                }).catch(function (error) {
                    tracksTried[trackToLoadUUID_1] = true;
                    if (_this.waitingToLoadIndex !== undefined) {
                        var waitingToLoadIndex = _this.waitingToLoadIndex;
                        _this.waitingToLoadIndex = undefined;
                        _this.loadTrack(waitingToLoadIndex, true, tracksTried).then(function () {
                            _this.currentlyBusyWithLoadTrack = false;
                            resolve();
                        }).catch(function (e) {
                            _this.currentlyBusyWithLoadTrack = false;
                            reject(e);
                        });
                    }
                    else {
                        _this.currentlyBusyWithLoadTrack = false;
                        _this.next(tracksTried);
                    }
                });
            }
        });
    };
    Player.prototype.playTrack = function (index) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.loadTrack(index, true).then(function () {
                _this.play();
                resolve();
            }).catch(function (error) {
                reject(error);
            });
        });
    };
    Player.prototype.getPaused = function () {
        return this.isPaused;
    };
    Player.prototype.play = function () {
        if (this.currentPlayer && (this.currentTrackIndex >= 0)) {
            this.millisecondsSinceCorrectingToPaused = Number.MAX_VALUE;
            this.millisecondsSinceCorrectingToPlaying = 0;
            this.isPaused = false;
            this.currentPlayer.play();
            publisher.publish(this.EVENTS.ON_PLAY_PAUSE, this.isPaused);
        }
    };
    Player.prototype.pause = function () {
        if (this.currentPlayer && (this.currentTrackIndex >= 0)) {
            this.millisecondsSinceCorrectingToPlaying = Number.MAX_VALUE;
            this.millisecondsSinceCorrectingToPaused = 0;
            this.isPaused = true;
            this.currentPlayer.pause();
            publisher.publish(this.EVENTS.ON_PLAY_PAUSE, this.isPaused);
        }
    };
    Player.prototype.playPause = function () {
        this.isPaused ? this.play() : this.pause();
    };
    Player.prototype.restart = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            publisher.publish(_this.EVENTS.ON_RESTART);
            _this.seekToPercentage(0).then(function () {
                resolve();
            }).catch(function () {
                resolve();
            });
        });
    };
    Player.prototype.getVolume = function () {
        return this.volume;
    };
    Player.prototype.setVolume = function (volume, unmute) {
        var muted = this.getMuted();
        this.volume = volume;
        publisher.publish(this.EVENTS.ON_VOLUME_CHANGE, this.volume);
        if (!muted) {
            if (this.currentPlayer) {
                this.currentPlayer.setVolume(volume);
            }
        }
        else if (muted && unmute) {
            this.setMuted(false);
        }
    };
    Player.prototype.getMuted = function () {
        return this.muted;
    };
    Player.prototype.setMuted = function (mute) {
        this.muted = mute;
        publisher.publish(this.EVENTS.ON_MUTED_CHANGE, this.muted);
        if (this.muted) {
            if (this.currentPlayer) {
                this.currentPlayer.setVolume(0);
            }
        }
        else {
            if (this.currentPlayer) {
                this.currentPlayer.setVolume(this.getVolume());
            }
        }
    };
    Player.prototype.toggleMuted = function () {
        var mute = !this.getMuted();
        this.setMuted(mute);
        return mute;
    };
    Player.prototype.getDuration = function () {
        if (this.currentPlayer) {
            return this.currentPlayer.getDuration();
        }
        else {
            return 0;
        }
    };
    Player.prototype.seekTo = function (milliseconds) {
        this.seekToPercentage((milliseconds / this.getDuration()) || 0);
    };
    Player.prototype.seekToPercentage = function (percentage) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if ((percentage < 0) || (percentage > 1)) {
                reject("The percentage given was not between 0 and 1.");
            }
            else if (_this.currentPlayer && (_this.currentTrackIndex >= 0)) {
                _this.currentPlayer.seekToPercentage(percentage);
                _this.currentlySeekingToPercentage = -1;
                resolve();
            }
        });
    };
    Player.prototype.getCurrentTime = function () {
        if (this.currentPlayer) {
            return this.currentPlayer.getCurrentTime();
        }
        else {
            return 0;
        }
    };
    Player.prototype.getCurrentPercentage = function () {
        if (this.currentPlayer) {
            return this.getCurrentTime() / this.getDuration();
        }
        else {
            return 0;
        }
    };
    Player.prototype.getPercentageLoaded = function () {
        if (this.currentPlayer) {
            return this.currentPlayer.getPercentageLoaded() || 0;
        }
        else {
            return 0;
        }
    };
    Player.prototype.verifyStates = function () {
        var frequencyToVerifyPausedState = 150;
        var frequencyToTryGetIntoTheSameState = 2000;
        var previousTime = Date.now();
        var currentTime;
        var timeTillTrackEnds;
        var boundToNotChangeToPlaying = 1500;
        var playerContext = this;
        function verifyPausedState() {
            currentTime = Date.now();
            timeTillTrackEnds = playerContext.getDuration() - playerContext.getCurrentTime();
            if (playerContext.currentPlayer
                && !playerContext.currentlyBusyWithLoadTrack && !playerContext.currentlyBusyWithLoad
                && !playerContext.currentlyLoadingMusicService && !playerContext.currentlyDynamicallyChangingMusicServices
                && (timeTillTrackEnds > boundToNotChangeToPlaying)) {
                if ((!playerContext.isPaused) && playerContext.currentPlayer.getPaused()) {
                    playerContext.millisecondsSinceCorrectingToPaused = Number.MAX_VALUE;
                    if (playerContext.millisecondsSinceCorrectingToPlaying >= frequencyToTryGetIntoTheSameState) {
                        console.log("Trying to correct the current state to playing!");
                        playerContext.millisecondsSinceCorrectingToPlaying = 0;
                        playerContext.currentPlayer.play();
                    }
                    else {
                        console.log("Waiting to try play again...");
                        playerContext.millisecondsSinceCorrectingToPlaying = playerContext.millisecondsSinceCorrectingToPlaying + (currentTime - previousTime);
                    }
                }
                else if (playerContext.isPaused && (!playerContext.currentPlayer.getPaused())) {
                    playerContext.millisecondsSinceCorrectingToPlaying = Number.MAX_VALUE;
                    if (playerContext.millisecondsSinceCorrectingToPaused >= frequencyToTryGetIntoTheSameState) {
                        console.log("Trying to correct the current state to pause!");
                        playerContext.millisecondsSinceCorrectingToPaused = 0;
                        playerContext.currentPlayer.pause();
                    }
                    else {
                        console.log("Waiting to try pause again...");
                        playerContext.millisecondsSinceCorrectingToPaused = playerContext.millisecondsSinceCorrectingToPaused + (currentTime - previousTime);
                    }
                }
                else {
                    playerContext.millisecondsSinceCorrectingToPlaying = Number.MAX_VALUE;
                    playerContext.millisecondsSinceCorrectingToPaused = Number.MAX_VALUE;
                }
            }
            else {
                playerContext.millisecondsSinceCorrectingToPlaying = Number.MAX_VALUE;
                playerContext.millisecondsSinceCorrectingToPaused = Number.MAX_VALUE;
            }
            previousTime = currentTime;
            setTimeout(verifyPausedState, frequencyToVerifyPausedState);
        }
        verifyPausedState();
    };
    Player.prototype.subscribeToEvents = function () {
        var playerContext = this;
        publisher.subscribe(this.EVENTS.ON_TIME_UPDATE, function (time, duration, percentage, percentageLoaded) {
            if ((percentage >= 1) && !playerContext.currentlyBusyWithLoadTrack && !playerContext.currentlyBusyWithLoad
                && !playerContext.currentlyLoadingMusicService && !playerContext.currentlyDynamicallyChangingMusicServices
                && playerContext.automaticNextAllowed) {
                playerContext.automaticNextAllowed = false;
                playerContext.next();
            }
        });
    };
    return Player;
}());
var Main = (function () {
    function Main() {
        this.appLoaded = false;
        this.player = new Player();
        window.AP = this.player;
        this.registerEvents();
        this.setupAngularApp();
        this.setupAngularRouting();
        this.setupAngularFactories();
        this.setupAngularControllers();
    }
    Main.prototype.registerEvents = function () {
        publisher.register("page-changed", []);
        publisher.register("user-ready", []);
        publisher.register("library-created", []);
        publisher.register("playlist-created", []);
        publisher.register("playlist-updated", []);
        publisher.register("playlist-deleted", [
            {
                name: "playlistUUID",
                type: "string",
            },
        ]);
        publisher.register("track-added", [
            {
                name: "playlistUUID",
                type: "string",
            },
        ]);
        publisher.register("track-deleted", [
            {
                name: "playlistUUID",
                type: "string",
            },
        ]);
    };
    Main.prototype.setupAngularApp = function () {
        this.app = angular.module("music-application", ["ngMaterial", "ngRoute", "firebase", "ngAnimate"])
            .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme("default")
                .primaryPalette("red")
                .accentPalette("deep-orange");
            $mdThemingProvider.enableBrowserColor("default");
        });
    };
    Main.prototype.setupAngularRouting = function () {
        this.app.config(function ($routeProvider) {
            var viewsDirectory = "src/html/views/";
            var resolve = {
                database: function () {
                    return firebase.database().ref();
                },
                user: function (auth, stateCorrector) {
                    publisher.publish("page-changed");
                    stateCorrector.correctState(auth.getUserUid());
                    return auth.getUser();
                },
            };
            $routeProvider
                .when("/", {
                controller: "library",
                resolve: resolve,
                templateUrl: viewsDirectory + "library.html",
            })
                .when("/loading", {
                controller: "loading",
                resolve: resolve,
                templateUrl: viewsDirectory + "loading.html",
            })
                .when("/sign-up", {
                controller: "signUp",
                resolve: resolve,
                templateUrl: viewsDirectory + "sign-up.html",
            })
                .when("/sign-in", {
                controller: "signIn",
                resolve: resolve,
                templateUrl: viewsDirectory + "sign-in.html",
            })
                .when("/playlist/:playlistUUID", {
                controller: "playlist",
                resolve: resolve,
                templateUrl: viewsDirectory + "playlist.html",
            })
                .otherwise({
                redirectTo: "/",
            });
        });
    };
    Main.prototype.setupAngularFactories = function () {
        var _this = this;
        this.app.factory("stateCorrector", function ($location) {
            var firstPageLoad = true;
            var routeRestored = false;
            var pathsNotAllowedForRestore = ["/loading", "/sign-in", "/sign-up"];
            var defaultRoute = "/";
            var route = defaultRoute;
            function isValidRestorePath(path) {
                return (pathsNotAllowedForRestore.indexOf(path) === -1);
            }
            function restoreRoute() {
                if (!routeRestored) {
                    routeRestored = true;
                    if ($location.path() !== route) {
                        $location.path(route);
                    }
                }
            }
            var correctState = function (userUUID) {
                if (firstPageLoad) {
                    route = $location.path();
                    if (!isValidRestorePath(route)) {
                        route = defaultRoute;
                        console.log("NOT AN ALLOWED RESTORE ROUTE!");
                    }
                    firstPageLoad = false;
                }
                if (!_this.appLoaded) {
                    $location.path("/loading");
                }
                else if ($location.path() === "/loading") {
                    if (userUUID) {
                        if (routeRestored) {
                            $location.path(defaultRoute);
                        }
                        else {
                            restoreRoute();
                        }
                    }
                    else {
                        $location.path("/sign-in");
                    }
                }
                else if (($location.path() === "/sign-in") || ($location.path() === "/sign-up")) {
                    if (userUUID) {
                        if (routeRestored) {
                            $location.path(defaultRoute);
                        }
                        else {
                            restoreRoute();
                        }
                    }
                }
                else {
                    if (!userUUID) {
                        $location.path("/sign-in");
                    }
                    else {
                        restoreRoute();
                    }
                }
            };
            return {
                correctState: correctState,
            };
        });
        this.app.factory("auth", function ($firebaseObject, $location, $rootScope, stateCorrector) {
            var USERS_REF = firebase.database().ref().child("users");
            var PLAYLISTS_DETAILS_REF = firebase.database().ref().child("playlists-details");
            var user;
            firebase.auth().onAuthStateChanged(function (result) {
                _this.appLoaded = true;
                user = result;
                if (user) {
                    stateCorrector.correctState(user.uid);
                    publisher.publish("user-ready");
                }
                else {
                    stateCorrector.correctState(undefined);
                    publisher.publish("user-ready");
                }
                $rootScope.$apply();
            });
            function createLibrary(owner) {
                return new Promise(function (resolve, reject) {
                    var library = {
                        name: "Library",
                        owner: owner,
                        tracks: [],
                        uuid: "This will be autogenerated.",
                    };
                    PLAYLISTS_DETAILS_REF.push(library).then(function (data) {
                        var libraryUUID = data.key;
                        PLAYLISTS_DETAILS_REF.child(libraryUUID).update({ uuid: libraryUUID }).then(function () {
                            USERS_REF.child(owner).child("library").set(libraryUUID).then(function () {
                                publisher.publish("library-created");
                                resolve("Library created successfully.");
                            }).catch(function () {
                                reject("Failed to create library.");
                            });
                        }).catch(function () {
                            reject("Failed to create library.");
                        });
                    }).catch(function () {
                        reject("Failed to create library.");
                    });
                });
            }
            return {
                getUser: function () {
                    return user;
                },
                getUserUid: function () {
                    if (user) {
                        return user.uid;
                    }
                    else {
                        return;
                    }
                },
                signIn: function (email, password) {
                    return new Promise(function (resolve, reject) {
                        firebase.auth().signInWithEmailAndPassword(email, password).then(function (data) {
                            resolve(data.uid);
                        }).catch(function (error) {
                            reject(error.message);
                        });
                    });
                },
                signOut: function () {
                    return new Promise(function (resolve, reject) {
                        firebase.auth().signOut().then(function () {
                            _this.player.dequeueAll();
                            resolve("Signed out.");
                        }).catch(function (error) {
                            reject(error.message);
                        });
                    });
                },
                signUp: function (email, password) {
                    return new Promise(function (resolve, reject) {
                        firebase.auth().createUserWithEmailAndPassword(email, password).then(function (data) {
                            USERS_REF.child(data.uid).set({
                                details: {
                                    email: data.email,
                                },
                            }).then(function () {
                                createLibrary(data.uid).then(function () {
                                    resolve(data.uid);
                                }).catch(function () {
                                    reject("Failed to sign up.");
                                });
                            }).catch(function () {
                                reject("Failed to sign up.");
                            });
                        }).catch(function (error) {
                            reject(error.message);
                        });
                    });
                },
            };
        });
        this.app.factory("dataManager", function (auth, $firebaseObject, $firebaseArray) {
            var playlistsTracks = {};
            var playlistsDetails = {};
            var playlists = {};
            var tracks = {};
            var usersLibraryUUID;
            var currentUserUUID;
            var usersPlaylists;
            var signInUpPageDetails = {
                email: "",
                password: "",
            };
            function setSignInUpPageDetails(email, password) {
                signInUpPageDetails.email = email;
                signInUpPageDetails.password = password;
            }
            function getSignInUpPageDetails() {
                return signInUpPageDetails;
            }
            var USERS_REF = firebase.database().ref().child("users");
            var TRACKS_REF = firebase.database().ref().child("tracks");
            var PLAYLISTS_DETAILS_REF = firebase.database().ref().child("playlists-details");
            var PLAYLISTS_TRACKS_REF = firebase.database().ref().child("playlists-tracks");
            function clone(object) {
                return JSON.parse(JSON.stringify(object));
            }
            function getUsersDetails(userUUID) {
                return new Promise(function (resolve, reject) {
                    USERS_REF.child(userUUID).child("details").once("value").then(function (snapshot) {
                        resolve(snapshot.val());
                    }).catch(function () {
                        reject(undefined);
                    });
                });
            }
            function createTrack(track) {
                return new Promise(function (resolve, reject) {
                    console.log(track);
                    TRACKS_REF.push(track).then(function (data) {
                        var clonedTrack = clone(track);
                        clonedTrack.uuid = data.key;
                        clonedTrack.owner = auth.getUserUid();
                        TRACKS_REF.child(clonedTrack.uuid).update({ owner: clonedTrack.owner, uuid: clonedTrack.uuid }).then(function () {
                            tracks[clonedTrack.uuid] = clonedTrack;
                            resolve(data.key);
                        }).catch(function () {
                            reject("Failed to create track.");
                        });
                    }).catch(function () {
                        reject("Failed to create track.");
                    });
                });
            }
            function deleteTrack(trackUUID) {
                return new Promise(function (resolve, reject) {
                    TRACKS_REF.child(trackUUID).remove().then(function () {
                        resolve("Track removed.");
                    }).catch(function () {
                        reject("Failed to remove track.");
                    });
                });
            }
            function getTrack(trackUUID, uuidInPlaylist) {
                return new Promise(function (resolve, reject) {
                    if (!tracks[trackUUID]) {
                        TRACKS_REF.child(trackUUID).once("value").then(function (snapshot) {
                            tracks[trackUUID] = snapshot.val();
                            if (!tracks[trackUUID]) {
                                reject(undefined);
                            }
                            else if (uuidInPlaylist) {
                                var clonedTrack = clone(tracks[trackUUID]);
                                clonedTrack.uuidInPlaylist = uuidInPlaylist;
                                resolve(clonedTrack);
                            }
                            else {
                                resolve(tracks[trackUUID]);
                            }
                        }).catch(function () {
                            reject(undefined);
                        });
                    }
                    else {
                        console.log("Got the local copy of the track.");
                        if (uuidInPlaylist) {
                            var clonedTrack = clone(tracks[trackUUID]);
                            clonedTrack.uuidInPlaylist = uuidInPlaylist;
                            resolve(clonedTrack);
                        }
                        else {
                            resolve(tracks[trackUUID]);
                        }
                    }
                });
            }
            function createPlaylist(playlist) {
                return new Promise(function (resolve, reject) {
                    playlist.owner = auth.getUserUid();
                    PLAYLISTS_DETAILS_REF.push(playlist).then(function (data) {
                        var playlistUUID = data.key;
                        PLAYLISTS_DETAILS_REF.child(playlistUUID).update({ uuid: playlistUUID }).then(function () {
                            USERS_REF.child(playlist.owner).child("playlists").push(playlistUUID).then(function (data) {
                                getUsersPlaylists().then(function () {
                                    playlist.uuid = playlistUUID;
                                    playlist.uuidInUsersPlaylists = data.key;
                                    playlists[playlistUUID] = playlist;
                                    usersPlaylists.push(playlist);
                                    publisher.publish("playlist-created");
                                    resolve(playlistUUID);
                                }).catch(function () {
                                    reject("Failed to create playlist.");
                                });
                            }).catch(function () {
                                reject("Failed to create playlist.");
                            });
                        }).catch(function () {
                            reject("Failed to create playlist.");
                        });
                    }).catch(function () {
                        reject("Failed to create playlist.");
                    });
                });
            }
            function isTrackInPlaylist(playlistUUID, trackUUID) {
                return new Promise(function (resolve, reject) {
                    getPlaylistTracksUUIDs(playlistUUID).then(function (playlistsTracksUUIDsResolved) {
                        var foundTrack = false;
                        for (var i = 0, resolvedTrack = void 0; resolvedTrack = playlistsTracksUUIDsResolved[i]; i = i + 1) {
                            if (resolvedTrack.trackUUID === trackUUID) {
                                foundTrack = true;
                                break;
                            }
                        }
                        resolve(foundTrack);
                    }).catch(function () {
                        resolve(false);
                    });
                });
            }
            function addTrackToPlaylist(playlistUUID, trackUUID) {
                return new Promise(function (resolve, reject) {
                    var userUid = auth.getUserUid();
                    var promisePlaylist = getPlaylist(playlistUUID);
                    var promiseTrack = getTrack(trackUUID);
                    Promise.all([promisePlaylist, promiseTrack]).then(function (values) {
                        var playlist = values[0];
                        var track = values[1];
                        if (playlist.owner === userUid) {
                            PLAYLISTS_TRACKS_REF.child(playlistUUID).push(trackUUID).then(function (data) {
                                var clonedTrack = clone(track);
                                clonedTrack.uuidInPlaylist = data.key;
                                if (!(playlists[playlistUUID].tracks instanceof Array)) {
                                    playlists[playlistUUID].tracks = [];
                                }
                                playlists[playlistUUID].tracks.push(clonedTrack);
                                if (playlistsTracks[playlistUUID] === undefined) {
                                    playlistsTracks[playlistUUID] = [];
                                }
                                playlistsTracks[playlistUUID].push({
                                    trackUUID: trackUUID,
                                    uuidInPlaylist: data.key,
                                });
                                getUsersLibraryUUID().then(function (libraryUUID) {
                                    if (playlistUUID !== libraryUUID) {
                                        isTrackInPlaylist(libraryUUID, trackUUID).then(function (itIs) {
                                            if (!itIs) {
                                                addTrackToPlaylist(libraryUUID, trackUUID);
                                            }
                                            publisher.publish("track-added", playlistUUID);
                                            resolve("Track added to playlist.");
                                        }).catch(function () {
                                            publisher.publish("track-added", playlistUUID);
                                            resolve("Track added to playlist. But failed to add to library.");
                                        });
                                    }
                                    else {
                                        publisher.publish("track-added", playlistUUID);
                                        resolve("Track added to library.");
                                    }
                                }).catch(function () {
                                    publisher.publish("track-added", playlistUUID);
                                    resolve("Track added to playlist.");
                                });
                            }).catch(function (error) {
                                reject(error);
                            });
                        }
                        else {
                            reject("Can't add track, you aren't the owner.");
                        }
                    }).catch(function () {
                        reject("Something went wrong, adding failed.");
                    });
                });
            }
            function deleteTrackFromPlaylist(playlistUUID, uuidInPlaylist) {
                return new Promise(function (resolve, reject) {
                    PLAYLISTS_TRACKS_REF.child(playlistUUID).child(uuidInPlaylist).remove().then(function () {
                        if (playlists[playlistUUID]) {
                            if (playlists[playlistUUID].tracks) {
                                for (var i = 0, track = void 0; track = playlists[playlistUUID].tracks[i]; i = i + 1) {
                                    if (track.uuidInPlaylist === uuidInPlaylist) {
                                        playlists[playlistUUID].tracks.splice(i, 1);
                                        break;
                                    }
                                }
                            }
                        }
                        if (playlistsTracks[playlistUUID]) {
                            for (var i = 0, track = void 0; track = playlistsTracks[playlistUUID][i]; i = i + 1) {
                                if (track.uuidInPlaylist === uuidInPlaylist) {
                                    playlistsTracks[playlistUUID].splice(i, 1);
                                    break;
                                }
                            }
                        }
                        publisher.publish("track-deleted", playlistUUID);
                        resolve("Track removed from playlist.");
                    }).catch(function () {
                        reject("Failed to remove track from playlist.");
                    });
                });
            }
            function getPlaylistDetails(playlistUUID, uuidInUsersPlaylists) {
                return new Promise(function (resolve, reject) {
                    if (!playlistsDetails[playlistUUID]) {
                        PLAYLISTS_DETAILS_REF.child(playlistUUID).once("value").then(function (snapshot) {
                            playlistsDetails[playlistUUID] = snapshot.val();
                            if (uuidInUsersPlaylists) {
                                var clonedPlaylistDetails = clone(playlistsDetails[playlistUUID]);
                                clonedPlaylistDetails.uuidInUsersPlaylists = uuidInUsersPlaylists;
                                resolve(clonedPlaylistDetails);
                            }
                            else {
                                resolve(playlistsDetails[playlistUUID]);
                            }
                        }).catch(function () {
                            reject(undefined);
                        });
                    }
                    else {
                        console.log("Got the local copy of the playlists details.");
                        if (uuidInUsersPlaylists) {
                            var clonedPlaylistDetails = clone(playlistsDetails[playlistUUID]);
                            clonedPlaylistDetails.uuidInUsersPlaylists = uuidInUsersPlaylists;
                            resolve(clonedPlaylistDetails);
                        }
                        else {
                            resolve(playlistsDetails[playlistUUID]);
                        }
                    }
                });
            }
            function getPlaylistTracksUUIDs(playlistUUID) {
                return new Promise(function (resolve, reject) {
                    if (!playlistsTracks[playlistUUID]) {
                        PLAYLISTS_TRACKS_REF.child(playlistUUID).once("value").then(function (snapshot) {
                            var playlistTracksUUIDs = snapshot.val();
                            var arrayOfTrackUUIDs = [];
                            if (playlistTracksUUIDs) {
                                for (var uuidInPlaylist in playlistTracksUUIDs) {
                                    if (playlistTracksUUIDs.hasOwnProperty(uuidInPlaylist)) {
                                        arrayOfTrackUUIDs.push({
                                            trackUUID: playlistTracksUUIDs[uuidInPlaylist],
                                            uuidInPlaylist: uuidInPlaylist,
                                        });
                                    }
                                }
                            }
                            playlistsTracks[playlistUUID] = arrayOfTrackUUIDs;
                            resolve(playlistsTracks[playlistUUID]);
                        }).catch(function () {
                            reject(undefined);
                        });
                    }
                    else {
                        console.log("Got the local copy of the playlists tracks.");
                        resolve(playlistsTracks[playlistUUID]);
                    }
                });
            }
            function getPlaylist(playlistUUID) {
                return new Promise(function (resolve, reject) {
                    if (!playlists[playlistUUID]) {
                        var promiseDetails = getPlaylistDetails(playlistUUID);
                        var promiseListOftrackUUIDs = getPlaylistTracksUUIDs(playlistUUID);
                        Promise.all([promiseDetails, promiseListOftrackUUIDs]).then(function (values) {
                            var details = values[0];
                            var arrayOfTrackUUIDs = values[1];
                            var promiseTracks = [];
                            for (var i = 0, track = void 0; track = arrayOfTrackUUIDs[i]; i = i + 1) {
                                promiseTracks.push(getTrack(track.trackUUID, track.uuidInPlaylist));
                            }
                            Promise.all(promiseTracks).then(function (tracksValues) {
                                var playlist = {
                                    name: details.name,
                                    owner: details.owner,
                                    tracks: [],
                                    uuid: details.uuid,
                                };
                                for (var i = 0, track = void 0; track = tracksValues[i]; i = i + 1) {
                                    playlist.tracks.push(track);
                                }
                                playlists[playlistUUID] = playlist;
                                resolve(playlists[playlistUUID]);
                            }).catch(function () {
                                reject("Failed to get playlist.");
                            });
                        }).catch(function () {
                            reject("Failed to get playlist.");
                        });
                    }
                    else {
                        console.log("Got the local copy of the playlist.");
                        resolve(playlists[playlistUUID]);
                    }
                });
            }
            function getUsersPlaylists() {
                return new Promise(function (resolve, reject) {
                    var userUUID = auth.getUserUid();
                    if (usersPlaylists === undefined) {
                        USERS_REF.child(userUUID).child("playlists").once("value").then(function (snapshot) {
                            var retrievedPlaylists = snapshot.val();
                            var promisePlaylistDetails = [];
                            for (var key in retrievedPlaylists) {
                                if (retrievedPlaylists.hasOwnProperty(key)) {
                                    promisePlaylistDetails.push(getPlaylistDetails(retrievedPlaylists[key], key));
                                }
                            }
                            Promise.all(promisePlaylistDetails).then(function (playlistsWithDetials) {
                                usersPlaylists = [];
                                for (var i = 0, playlist = void 0; playlist = playlistsWithDetials[i]; i = i + 1) {
                                    usersPlaylists.push(playlist);
                                }
                                resolve(usersPlaylists);
                            }).catch(function () {
                                reject("Failed to get users playlists.");
                            });
                        }).catch(function () {
                            reject("Failed to get users playlists.");
                        });
                    }
                    else {
                        console.log("Got the local copy of the users playlists.");
                        resolve(usersPlaylists);
                    }
                });
            }
            function updatePlaylist(playlistUUID, infoToUpdate) {
                return new Promise(function (resolve, reject) {
                    PLAYLISTS_DETAILS_REF.child(playlistUUID).update(infoToUpdate).then(function () {
                        for (var key in infoToUpdate) {
                            if (infoToUpdate.hasOwnProperty(key)) {
                                if (playlistsDetails[playlistUUID]) {
                                    playlistsDetails[playlistUUID][key] = infoToUpdate[key];
                                }
                                if (playlists[playlistUUID]) {
                                    playlists[playlistUUID][key] = infoToUpdate[key];
                                }
                                if (usersPlaylists instanceof Array) {
                                    for (var i = 0, playlist = void 0; playlist = usersPlaylists[i]; i = i + 1) {
                                        if (playlist.uuid === playlistUUID) {
                                            usersPlaylists[i][key] = infoToUpdate[key];
                                        }
                                    }
                                }
                            }
                        }
                        publisher.publish("playlist-updated");
                        resolve("Playlist updated.");
                    }).catch(function () {
                        reject("Failed to update playlist.");
                    });
                });
            }
            function deletePlaylist(playlistUUID, uuidInUsersPlaylists) {
                console.log(playlistUUID);
                console.log(uuidInUsersPlaylists);
                var userUUID = auth.getUserUid();
                return new Promise(function (resolve, reject) {
                    USERS_REF.child(userUUID).child("playlists").child(uuidInUsersPlaylists).remove().then(function () {
                        PLAYLISTS_DETAILS_REF.child(playlistUUID).remove();
                        PLAYLISTS_TRACKS_REF.child(playlistUUID).remove();
                        playlists[playlistUUID] = undefined;
                        playlistsTracks[playlistUUID] = undefined;
                        playlistsDetails[playlistUUID] = undefined;
                        if (usersPlaylists instanceof Array) {
                            for (var i = 0, playlist = void 0; playlist = usersPlaylists[i]; i = i + 1) {
                                if (playlist.uuid === playlistUUID) {
                                    usersPlaylists.splice(i, 1);
                                    break;
                                }
                            }
                        }
                        publisher.publish("playlist-deleted", playlistUUID);
                        resolve("Playlist removed.");
                    }).catch(function () {
                        reject("Failed to remove playlist.");
                    });
                });
            }
            function getUsersLibraryUUID() {
                return new Promise(function (resolve, reject) {
                    var userUUID = auth.getUserUid();
                    var correctUsersLibraryCached = true;
                    if (currentUserUUID !== userUUID) {
                        correctUsersLibraryCached = false;
                    }
                    if (!usersLibraryUUID || !correctUsersLibraryCached) {
                        USERS_REF.child(userUUID).child("library").once("value").then(function (snapshot) {
                            var libraryUUID = snapshot.val();
                            if (libraryUUID) {
                                currentUserUUID = userUUID;
                                usersLibraryUUID = libraryUUID;
                                resolve(usersLibraryUUID);
                            }
                            else {
                                reject("Error: The user doesn't have a library.");
                            }
                        }).catch(function () {
                            reject("Failed to find the users library.");
                        });
                    }
                    else {
                        console.log("Cached usersLibraryUUID");
                        resolve(usersLibraryUUID);
                    }
                });
            }
            function getUuidInUsersPlaylists(playlistUUID) {
                return new Promise(function (resolve, reject) {
                    getUsersPlaylists().then(function (resolvedUsersPlaylists) {
                        var uuidInUsersPlaylists;
                        for (var i = 0, playlist = void 0; playlist = resolvedUsersPlaylists[i]; i = i + 1) {
                            if (playlist.uuid === playlistUUID) {
                                uuidInUsersPlaylists = playlist.uuidInUsersPlaylists;
                                break;
                            }
                        }
                        if (uuidInUsersPlaylists) {
                            resolve(uuidInUsersPlaylists);
                        }
                        else {
                            reject("Could not find uuidInUsersPlaylists");
                        }
                    }).catch(function () {
                        reject("Could not find uuidInUsersPlaylists");
                    });
                });
            }
            return {
                addTrackToPlaylist: addTrackToPlaylist,
                createPlaylist: createPlaylist,
                createTrack: createTrack,
                deletePlaylist: deletePlaylist,
                deleteTrackFromPlaylist: deleteTrackFromPlaylist,
                getPlaylist: getPlaylist,
                getPlaylistDetails: getPlaylistDetails,
                getPlaylistTracksUUIDs: getPlaylistTracksUUIDs,
                getTrack: getTrack,
                getUsersDetails: getUsersDetails,
                getUsersLibraryUUID: getUsersLibraryUUID,
                getUsersPlaylists: getUsersPlaylists,
                getUuidInUsersPlaylists: getUuidInUsersPlaylists,
                getSignInUpPageDetails: getSignInUpPageDetails,
                isTrackInPlaylist: isTrackInPlaylist,
                setSignInUpPageDetails: setSignInUpPageDetails,
                updatePlaylist: updatePlaylist,
            };
        });
    };
    Main.prototype.setupAngularControllers = function () {
        var _this = this;
        this.app.controller("master", function ($scope, $mdSidenav, auth, dataManager, $mdToast, $mdDialog) {
            var controller = $scope;
            controller.master = {};
            controller.loadingLibrary = true;
            controller.loadingPlaylists = true;
            controller.toggleMenu = function () {
                $mdSidenav("left").toggle();
            };
            controller.showToast = function (message) {
                $mdToast.show($mdToast.simple()
                    .textContent(message)
                    .position("bottom right")
                    .hideDelay(1500));
            };
            controller.sharePlaylist = function (ev, playlistName, playlistUUID) {
                $mdDialog.show({
                    clickOutsideToClose: true,
                    controller: "sharePlaylist",
                    fullscreen: false,
                    parent: angular.element(document.body),
                    playlistName: playlistName,
                    playlistUUID: playlistUUID,
                    targetEvent: ev,
                    templateUrl: "src/html/dialogs/share-playlist.html",
                });
            };
            controller.editPlaylist = function (ev, playlistName, playlistUUID) {
                $mdDialog.show({
                    clickOutsideToClose: true,
                    controller: "editPlaylist",
                    fullscreen: false,
                    parent: angular.element(document.body),
                    playlistName: playlistName,
                    playlistUUID: playlistUUID,
                    targetEvent: ev,
                    templateUrl: "src/html/dialogs/edit-playlist.html",
                })
                    .then(function (message) {
                    controller.showToast(message);
                }, function () {
                    controller.showToast("Canceled.");
                });
            };
            controller.deletePlaylist = function (ev, playlistName, playlistUUID, uuidInUsersPlaylists) {
                var confirm = $mdDialog.confirm()
                    .title("Delete \"" + playlistName + "\" playlist")
                    .textContent("This will permanently delete the playlist.")
                    .ariaLabel("Delete " + playlistName + " playlist")
                    .targetEvent(ev)
                    .ok("Yes")
                    .cancel("Cancel");
                $mdDialog.show(confirm).then(function () {
                    dataManager.deletePlaylist(playlistUUID, uuidInUsersPlaylists).then(function (message) {
                        controller.showToast(message);
                    }).catch(function (message) {
                        controller.showToast(message);
                    });
                }, function () {
                    controller.showToast("Canceled.");
                });
            };
            publisher.subscribe("library-created", function () {
                dataManager.getUsersLibraryUUID().then(function (libraryUUID) {
                    dataManager.getPlaylistDetails(libraryUUID).then(function (libraryDetails) {
                        controller.loadingLibrary = false;
                        controller.library = libraryDetails;
                        controller.$digest();
                    }).catch(function () {
                        controller.loadingLibrary = false;
                        controller.$digest();
                    });
                });
            });
            var listOfPlaylistChangeHandler = function (playlistUUID) {
                controller.loadingPlaylists = true;
                dataManager.getUsersPlaylists().then(function (playlists) {
                    controller.loadingPlaylists = false;
                    controller.playlists = playlists;
                    controller.$digest();
                }).catch(function () {
                    controller.loadingPlaylists = false;
                    controller.$digest();
                });
            };
            window.playlistAreaDropHandler = function (ev, element) {
                ev.preventDefault();
                ev.stopPropagation();
                element.style.animation = "";
                var data = ev.dataTransfer.getData("track");
                var trackUUIDIdentifier = "trackUUID=";
                var index = data.indexOf(trackUUIDIdentifier);
                if (index >= 0) {
                    var trackUUID = data.slice(index + trackUUIDIdentifier.length, data.length);
                    dataManager.addTrackToPlaylist(element.getAttribute("data-uuid"), trackUUID).then(function (message) {
                        controller.showToast(message);
                    }).catch(function (message) {
                        controller.showToast(message);
                    });
                }
                return false;
            };
            window.playlistAreaDragOverHandler = function (ev, element) {
                var dragIcon = document.createElement("img");
                dragIcon.src = "src/assets/png/add-circle.png";
                dragIcon.width = 100;
                ev.dataTransfer.setDragImage(dragIcon, -10, -10);
                ev.preventDefault();
                var types = ev.dataTransfer.types;
                if (types) {
                    if (types.indexOf("track") >= 0) {
                        element.style.animation = "playlist-area-pulsate 2s infinite";
                    }
                }
            };
            window.playlistAreaDragLeaveHandler = function (ev, element) {
                element.style.animation = "";
            };
            controller.clearSearch = function () {
                controller.search.text = "";
            };
            publisher.subscribe("page-changed", function () {
                var searchBar = document.getElementById("search-bar");
                if (searchBar.value.trim() !== "") {
                    searchBar.classList.remove("pulse-search");
                    void searchBar.offsetWidth;
                    searchBar.classList.add("pulse-search");
                }
            });
            publisher.subscribe("playlist-created", listOfPlaylistChangeHandler);
            publisher.subscribe("playlist-updated", listOfPlaylistChangeHandler);
            publisher.subscribe("playlist-deleted", listOfPlaylistChangeHandler);
            publisher.subscribe("user-ready", function () {
                controller.user = auth.getUser();
                if (controller.user) {
                    dataManager.getUsersLibraryUUID().then(function (libraryUUID) {
                        dataManager.getPlaylistDetails(libraryUUID).then(function (libraryDetails) {
                            controller.loadingLibrary = false;
                            controller.library = libraryDetails;
                            controller.$digest();
                        });
                    }).catch(function () {
                        controller.loadingLibrary = true;
                        controller.$digest();
                    });
                    dataManager.getUsersPlaylists().then(function (playlists) {
                        controller.loadingPlaylists = false;
                        controller.playlists = playlists;
                        controller.$digest();
                    }).catch(function () {
                        controller.loadingPlaylists = false;
                        controller.$digest();
                    });
                }
            });
            controller.signOut = function () {
                dataManager.setSignInUpPageDetails("", "");
                auth.signOut();
            };
        });
        this.app.controller("editPlaylist", function ($scope, $mdDialog, $mdToast, playlistName, playlistUUID, dataManager, $location) {
            var controller = $scope;
            controller.playlistName = playlistName;
            controller.newPlaylistName = playlistName;
            controller.saving = false;
            if (playlistName === undefined) {
                controller.creatingPlaylist = true;
                controller.heading = "Creating playlist";
            }
            else {
                controller.creatingPlaylist = false;
                controller.heading = "Editing \"" + playlistName + "\" playlist";
            }
            controller.showToast = function (message) {
                $mdToast.show($mdToast.simple()
                    .textContent(message)
                    .position("bottom right")
                    .hideDelay(1500));
            };
            controller.hide = function () {
                $mdDialog.hide();
            };
            controller.cancel = function () {
                $mdDialog.cancel();
            };
            controller.save = function (infoToUpdate) {
                controller.saving = true;
                if (controller.creatingPlaylist) {
                    if (controller.newPlaylistName && (controller.newPlaylistName.trim() !== "")) {
                        dataManager.createPlaylist({ name: controller.newPlaylistName }).then(function (newPlaylistUUID) {
                            $location.path("/playlist/" + newPlaylistUUID);
                            $mdDialog.hide("Playlist created.");
                        }).catch(function () {
                            controller.saving = false;
                            controller.showToast("Failed to create playlist.");
                        });
                    }
                    else {
                        controller.saving = false;
                        controller.showToast("Invalid name.");
                    }
                }
                else {
                    if (infoToUpdate.name.trim() !== "") {
                        dataManager.updatePlaylist(playlistUUID, infoToUpdate).then(function () {
                            $mdDialog.hide("Playlist edited.");
                        }).catch(function () {
                            controller.saving = false;
                            controller.showToast("Something went wrong, try again.");
                        });
                    }
                    else {
                        controller.saving = false;
                        controller.showToast("Invalid name.");
                    }
                }
            };
        });
        this.app.controller("sharePlaylist", function ($scope, $mdDialog, $mdToast, playlistName, playlistUUID) {
            var controller = $scope;
            var currentURL = window.location.origin;
            controller.playlistName = playlistName;
            controller.playlistURL = currentURL + "/multi-source-music-application/#/playlist/" + playlistUUID;
            controller.showToast = function (message) {
                $mdToast.show($mdToast.simple()
                    .textContent(message)
                    .position("bottom right")
                    .hideDelay(1500));
            };
            controller.copy = function () {
                var textarea = document.getElementById("linkToShare");
                textarea.select();
                var success = false;
                try {
                    success = document.execCommand("copy");
                }
                catch (error) {
                    success = false;
                }
                if (success) {
                    controller.showToast("Link copied to clipboard.");
                }
                else {
                    controller.showToast("Failed to copy link, try manually copying.");
                }
                $mdDialog.hide();
            };
            controller.hide = function () {
                $mdDialog.hide();
            };
            controller.cancel = function () {
                $mdDialog.cancel();
            };
        });
        this.app.controller("editTrack", function ($scope, $mdDialog, $mdToast, playlistName, playlistUUID, trackUUID, url, dataManager) {
            var controller = $scope;
            var verifier = new Verification();
            controller.playlistName = playlistName;
            controller.playlistUUID = playlistUUID;
            controller.trackUUID = trackUUID;
            controller.saving = false;
            if (trackUUID === undefined) {
                controller.creatingTrack = true;
                controller.heading = "Creating track";
            }
            else {
                controller.creatingTrack = false;
                controller.heading = "Editing track";
            }
            controller.showToast = function (message) {
                $mdToast.show($mdToast.simple()
                    .textContent(message)
                    .position("bottom right")
                    .hideDelay(1500));
            };
            controller.youtubeURLChange = function (youtubeURL) {
                if (!controller.trackTitle) {
                    if (youtubeURL && (youtubeURL.trim() !== "")) {
                        var YouTubeVideoId = verifier.getYouTubeVideoId(youtubeURL);
                        if (YouTubeVideoId) {
                            verifier.getYouTubeVideoTitle(YouTubeVideoId).then(function (title) {
                                controller.trackTitle = title;
                                controller.$digest();
                            });
                        }
                    }
                }
            };
            controller.deezerURLChange = function (deezerURL) {
                if (deezerURL && (deezerURL.trim() !== "")) {
                    var DeezerTrackId = verifier.getDeezerTrackId(deezerURL);
                    if (DeezerTrackId) {
                        verifier.getDeezerTrackObject(DeezerTrackId).then(function (object) {
                            if (!controller.trackTitle) {
                                controller.trackTitle = object.title;
                            }
                            if (!controller.trackArtist) {
                                controller.trackArtist = object.artist.name;
                            }
                            controller.$digest();
                        });
                    }
                }
            };
            controller.soundcloudURLChange = function (soundcloudURL, object) {
                if (object) {
                    controller.soundcloudURL = object.permalink_url;
                    if (!controller.trackTitle) {
                        controller.trackTitle = object.title;
                    }
                    if (!controller.trackArtist) {
                        controller.trackArtist = object.user.username;
                    }
                    controller.$digest();
                }
                else if (soundcloudURL && (soundcloudURL.trim() !== "")) {
                    verifier.getSoundCloudObject(url).then(function (returnedObject) {
                        controller.soundcloudURL = returnedObject.permalink_url;
                        if (!controller.trackTitle) {
                            controller.trackTitle = returnedObject.title;
                        }
                        if (!controller.trackArtist) {
                            controller.trackArtist = returnedObject.user.username;
                        }
                        controller.$digest();
                    });
                }
            };
            if (url) {
                if (verifier.getYouTubeVideoId(url)) {
                    controller.youtubeURL = verifier.youtubeVideoIdToLink(verifier.getYouTubeVideoId(url));
                    controller.youtubeURLChange(controller.youtubeURL);
                }
                else if (verifier.getDeezerTrackId(url)) {
                    controller.deezerURL = verifier.deezerTrackIdToLink(verifier.getDeezerTrackId(url));
                    console.log(controller.deezerURL);
                }
                else {
                    verifier.getSoundCloudObject(url).then(function (object) {
                        controller.soundcloudURLChange(url, object);
                    }).catch(function () {
                        controller.showToast("The URL given wasn't valid.");
                    });
                }
            }
            var createTrackAndAddIt = function (newTrack) {
                dataManager.createTrack(newTrack).then(function (createdTrackUUID) {
                    dataManager.addTrackToPlaylist(playlistUUID, createdTrackUUID).then(function () {
                        $mdDialog.hide("Track added to playlist.");
                    }).catch(function (message) {
                        controller.saving = false;
                        controller.showToast(message);
                    });
                }).catch(function (message) {
                    controller.saving = false;
                    controller.showToast(message);
                });
            };
            controller.save = function () {
                controller.saving = true;
                if (controller.creatingTrack) {
                    if (controller.trackTitle && (controller.trackTitle.trim() !== "")) {
                        var validYouTubeUrl_1 = false;
                        var validDeezerUrl_1 = false;
                        var newTrack_1 = {};
                        newTrack_1.title = controller.trackTitle;
                        if (controller.trackArtist) {
                            newTrack_1.artist = controller.trackArtist;
                        }
                        newTrack_1.dateAdded = Date.now();
                        newTrack_1.services = {};
                        if (controller.youtubeURL && (controller.youtubeURL.trim() !== "")) {
                            var YouTubeVideoId = verifier.getYouTubeVideoId(controller.youtubeURL);
                            if (YouTubeVideoId) {
                                newTrack_1.services["YouTube"] = {
                                    videoId: YouTubeVideoId,
                                };
                                controller.youtubeURL = verifier.youtubeVideoIdToLink(YouTubeVideoId);
                                validYouTubeUrl_1 = true;
                            }
                            else {
                                controller.youtubeURL = undefined;
                            }
                        }
                        if (controller.deezerURL && (controller.deezerURL.trim() !== "")) {
                            var DeezerTrackId = verifier.getDeezerTrackId(controller.deezerURL);
                            if (DeezerTrackId) {
                                newTrack_1.services["Deezer"] = {
                                    trackId: DeezerTrackId,
                                };
                                controller.deezerURL = verifier.deezerTrackIdToLink(DeezerTrackId);
                                validDeezerUrl_1 = true;
                            }
                            else {
                                controller.deezerURL = undefined;
                            }
                        }
                        verifier.getSoundCloudObject(url).then(function (returnedObject) {
                            var trackPath = "/tracks/" + returnedObject.id;
                            newTrack_1.services["SoundCloud"] = {
                                trackPath: trackPath,
                            };
                            createTrackAndAddIt(newTrack_1);
                        }).catch(function () {
                            if (validYouTubeUrl_1 || validDeezerUrl_1) {
                                createTrackAndAddIt(newTrack_1);
                            }
                            else {
                                controller.saving = false;
                                controller.showToast("Invalid track URL.");
                            }
                        });
                    }
                    else {
                        controller.saving = false;
                        controller.showToast("Invalid title.");
                    }
                }
                else {
                }
            };
            controller.hide = function () {
                $mdDialog.hide();
            };
            controller.cancel = function () {
                $mdDialog.cancel();
            };
        });
        this.app.controller("player", function ($scope, $interval, $mdToast) {
            var controller = $scope;
            var UPDATE_SEEKBAR_FREQUENCY = 300;
            controller.loadingTrack = false;
            controller.paused = _this.player.getPaused();
            controller.volume = _this.player.getVolume() * 100;
            controller.repeatOne = _this.player.getRepeat() === _this.player.REPEAT_STATES.ONE;
            controller.repeatOff = _this.player.getRepeat() === _this.player.REPEAT_STATES.OFF;
            controller.shuffle = _this.player.getShuffle();
            controller.musicService = _this.player.musicServices[_this.player.getCurrentMusicServiceIndex()].name;
            controller.volumeOff = false;
            controller.seek = {
                percentage: 0,
                percentageLoaded: 0,
            };
            controller.showToast = function (message) {
                $mdToast.show($mdToast.simple()
                    .textContent(message)
                    .position("bottom right")
                    .hideDelay(1500));
            };
            controller.previous = function () {
                controller.bob = "previous";
                _this.player.previous();
            };
            controller.playPause = function () {
                if (_this.player.getPaused()) {
                    controller.paused = true;
                }
                else {
                    controller.paused = false;
                }
                _this.player.playPause();
            };
            controller.next = function () {
                controller.bob = "next";
                _this.player.next();
            };
            controller.setVolume = function (volume) {
                if (volume <= 0) {
                    controller.volumeOff = true;
                }
                else {
                    controller.volumeOff = false;
                }
                _this.player.setVolume(volume / 100);
            };
            controller.toggleRepeat = function () {
                _this.player.cycleRepeat();
                controller.repeatOne = _this.player.getRepeat() === _this.player.REPEAT_STATES.ONE;
                controller.repeatOff = _this.player.getRepeat() === _this.player.REPEAT_STATES.OFF;
            };
            controller.toggleShuffle = function () {
                _this.player.toggleShuffle();
                controller.shuffle = _this.player.getShuffle();
            };
            controller.dynamicallyChangeMusicService = function (musicService) {
                _this.player.dynamicallyChangeMusicService(musicService);
            };
            var seekbar = document.getElementById("seek-bar");
            var userMovingSeekBar = false;
            seekbar.addEventListener("mousedown", function () {
                userMovingSeekBar = true;
            });
            seekbar.addEventListener("touchstart", function () {
                userMovingSeekBar = true;
            });
            seekbar.addEventListener("change", function () {
                userMovingSeekBar = false;
                _this.player.seekToPercentage(parseFloat(seekbar.value));
            });
            publisher.subscribe(_this.player.EVENTS.ON_TRACK_LOADED, function (a, b) {
                controller.currentTrack = _this.player.getCurrentTrack();
                controller.$digest();
            });
            publisher.subscribe(_this.player.EVENTS.ON_PREVIOUS, function () {
                controller.currentTrack = _this.player.getCurrentTrack();
            });
            publisher.subscribe(_this.player.EVENTS.ON_NEXT, function () {
                controller.currentTrack = _this.player.getCurrentTrack();
            });
            publisher.subscribe(_this.player.EVENTS.ON_TRACK_LOADING, function (track, musicServiceName) {
                console.log("LOADING (" + musicServiceName + ") - " + track.title + ".");
            });
            publisher.subscribe(_this.player.EVENTS.ON_TRACK_LOADED, function (track, musicServiceName) {
                console.log("SUCCESS (" + musicServiceName + ") - " + track.title + ".");
            });
            publisher.subscribe(_this.player.EVENTS.ON_TRACK_LOAD_FAILED, function (track, musicServiceName) {
                console.log("FAILED (" + musicServiceName + ") - " + track.title + ".");
                controller.showToast(track.title + " not available on " + musicServiceName + ".");
            });
            $interval(function () {
                controller.paused = _this.player.getPaused();
                controller.musicService = _this.player.musicServices[_this.player.getCurrentMusicServiceIndex()].name;
                controller.seek.percentage = _this.player.getCurrentPercentage() * 100;
                controller.seek.percentageLoaded = _this.player.getPercentageLoaded() * 100;
                if (!userMovingSeekBar) {
                    seekbar.value = (controller.seek.percentage / 100).toString();
                }
                controller.$digest();
            }, 300, 0, false);
        });
        this.app.controller("library", function ($scope, $location, user, database, dataManager, $mdToast) {
            var controller = $scope;
            controller.showToast = function (message) {
                $mdToast.show($mdToast.simple()
                    .textContent(message)
                    .position("bottom right")
                    .hideDelay(1500));
            };
            var timesToTry = 10;
            var tryCount = 0;
            var everyHowManyMilliseconds = 1000;
            var tryGetLibrary = function () {
                dataManager.getUsersLibraryUUID().then(function (libraryUUID) {
                    console.log(libraryUUID);
                    $location.path("/playlist/" + libraryUUID);
                    controller.$apply();
                }).catch(function () {
                    if (tryCount < timesToTry) {
                        tryCount = tryCount + 1;
                        console.log("Try count = " + tryCount + ", library still not there, try again...");
                        setTimeout(tryGetLibrary, everyHowManyMilliseconds);
                    }
                    else {
                        controller.showToast("Couldn't find your library, try refreshing the page...");
                    }
                });
            };
            tryGetLibrary();
        });
        this.app.controller("playlist", function ($scope, $location, $routeParams, dataManager, $mdToast, $mdDialog, user) {
            var controller = $scope;
            dataManager.getUuidInUsersPlaylists($routeParams.playlistUUID).then(function (uuidInUsersPlaylists) {
                console.log(uuidInUsersPlaylists);
            }).catch(function (message) {
                console.log(message);
            });
            controller.loading = true;
            controller.playlist = {};
            controller.thisUsersPlaylist = true;
            controller.noTracks = false;
            controller.playlistUUID = $routeParams.playlistUUID;
            controller.showToast = function (message) {
                $mdToast.show($mdToast.simple()
                    .textContent(message)
                    .position("bottom right")
                    .hideDelay(1500));
            };
            var updateNoTracksFlag = function () {
                if (controller.playlist) {
                    if (controller.playlist.tracks instanceof Array) {
                        controller.noTracks = (controller.playlist.tracks.length <= 0);
                    }
                    else {
                        controller.noTracks = true;
                    }
                }
                else {
                    controller.noTracks = true;
                }
            };
            var updateTrackIndexs = function () {
                if (controller.playlist.tracks) {
                    for (var i = 0; i < controller.playlist.tracks.length; i = i + 1) {
                        controller.playlist.tracks[i].index = i;
                    }
                }
            };
            var updatePlaylist = function () {
                dataManager.getPlaylist(controller.playlistUUID).then(function (playlist) {
                    controller.playlist = playlist;
                    updateTrackIndexs();
                    updateNoTracksFlag();
                    controller.$digest();
                });
            };
            publisher.subscribe("track-added", function (playlistUUID) {
                if (controller.playlistUUID === playlistUUID) {
                    updatePlaylist();
                }
            });
            publisher.subscribe("track-deleted", function (playlistUUID) {
                if (controller.playlistUUID === playlistUUID) {
                    updatePlaylist();
                }
            });
            publisher.subscribe("playlist-deleted", function (playlistUUID) {
                if (controller.playlistUUID === playlistUUID) {
                    $location.path("/");
                }
            });
            controller.addTrack = function (ev, url) {
                $mdDialog.show({
                    clickOutsideToClose: true,
                    controller: "editTrack",
                    fullscreen: false,
                    parent: angular.element(document.body),
                    playlistName: controller.playlist.name,
                    playlistUUID: controller.playlist.uuid,
                    targetEvent: ev,
                    templateUrl: "src/html/dialogs/edit-track.html",
                    trackUUID: undefined,
                    url: url,
                })
                    .then(function (message) {
                    controller.showToast(message);
                }, function () {
                    controller.showToast("Canceled.");
                });
            };
            controller.deleteTrack = function (ev, trackTitle, trackUUIDInPlaylist, index) {
                console.log("uuidInPlaylist: " + trackUUIDInPlaylist);
                var confirm = $mdDialog.confirm()
                    .title("Delete \"" + trackTitle + "\"")
                    .textContent("This will permanently delete the track from this playlist.")
                    .ariaLabel("Delete " + trackTitle + " track")
                    .targetEvent(ev)
                    .ok("Yes")
                    .cancel("Cancel");
                $mdDialog.show(confirm).then(function () {
                    dataManager.deleteTrackFromPlaylist(controller.playlistUUID, trackUUIDInPlaylist).then(function (message) {
                        _this.player.dequeue(index);
                        controller.showToast(message);
                    }).catch(function (message) {
                        controller.showToast(message);
                    });
                }, function () {
                    controller.showToast("Canceled.");
                });
            };
            var lastTimePlayed = 0;
            var timeAfterWhichToAllowPlaying = 500;
            controller.playTrack = function (index) {
                if ((Date.now() - lastTimePlayed) > timeAfterWhichToAllowPlaying) {
                    lastTimePlayed = Date.now();
                    _this.player.dequeueAll();
                    for (var i = 0; i < controller.playlist.tracks.length; i = i + 1) {
                        _this.player.queue(controller.playlist.tracks[i]);
                    }
                    _this.player.playTrack(index);
                }
                else {
                    console.log("Too fast bro! Too fast!");
                }
            };
            controller.filter = function (track) {
                if (!(controller.search) || !(controller.search.text)) {
                    return true;
                }
                else if (track.title && (track.title.toLowerCase().indexOf(controller.search.text.toLowerCase()) !== -1)) {
                    return true;
                }
                else if (track.artist && (track.artist.toLowerCase().indexOf(controller.search.text.toLowerCase()) !== -1)) {
                    return true;
                }
                else {
                    return false;
                }
            };
            window.tracksAreaDropHandler = function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                var types = ev.dataTransfer.types;
                if (types) {
                    if (types.indexOf("track") < 0) {
                        var playlistTracksArea = document.getElementById("playlist-tracks-area-" + controller.playlistUUID);
                        playlistTracksArea.className = "playlist-tracks-area";
                        controller.addTrack(ev, ev.dataTransfer.getData("text"));
                    }
                }
                return false;
            };
            window.tracksAreaDragOverHandler = function (ev) {
                ev.preventDefault();
                var types = ev.dataTransfer.types;
                if (types) {
                    if (types.indexOf("track") < 0) {
                        var playlistTracksArea = document.getElementById("playlist-tracks-area-" + controller.playlistUUID);
                        playlistTracksArea.className = "can-be-dropped playlist-tracks-area";
                    }
                }
            };
            window.tracksAreaDragLeaveHandler = function (ev) {
                var playlistTracksArea = document.getElementById("playlist-tracks-area-" + controller.playlistUUID);
                playlistTracksArea.className = "playlist-tracks-area";
            };
            window.trackDragStartHandler = function (ev, element) {
                var dragIcon = document.createElement("img");
                dragIcon.src = "src/assets/png/add-circle.png";
                ev.dataTransfer.setDragImage(dragIcon, 20, 10);
                var trackUUID = element.getAttribute("data-uuid");
                ev.dataTransfer.setData("track", trackUUID);
            };
            dataManager.getPlaylist(controller.playlistUUID).then(function (playlist) {
                controller.playlist = playlist;
                controller.loading = false;
                updateTrackIndexs();
                updateNoTracksFlag();
                if (playlist.owner === user.uid) {
                    controller.thisUsersPlaylist = true;
                }
                else {
                    controller.thisUsersPlaylist = false;
                    dataManager.getUsersDetails(playlist.owner).then(function (owner) {
                        controller.owner = owner.email;
                        controller.$digest();
                    });
                }
                controller.$digest();
            }).catch(function (message) {
                controller.showToast(message);
                $location.path("/");
            });
        });
        this.app.controller("loading", function () { });
        this.app.controller("signUp", function ($scope, auth, $location, stateCorrector, $mdToast, dataManager) {
            var controller = $scope;
            controller.loading = false;
            controller.showToast = function (message) {
                $mdToast.show($mdToast.simple()
                    .textContent(message)
                    .position("bottom right")
                    .hideDelay(1500));
            };
            controller.user = dataManager.getSignInUpPageDetails();
            controller.signUp = function () {
                if (!(controller.user.email) || controller.user.email.trim() === "") {
                    controller.showToast("Invalid email.");
                }
                else if (!(controller.user.password) || (controller.user.password.trim() === "" || controller.user.password.length < 6)) {
                    controller.showToast("Invalid password (must be at least 6 characters).");
                }
                else {
                    controller.loading = true;
                    auth.signUp(controller.user.email, controller.user.password).then(function (userUUID) {
                        stateCorrector.correctState(userUUID);
                        controller.$apply();
                    }).catch(function (error) {
                        controller.loading = false;
                        controller.showToast(error);
                    });
                }
            };
            controller.signIn = function (email, password) {
                dataManager.setSignInUpPageDetails(email, password);
                $location.path("/sign-in");
            };
        });
        this.app.controller("signIn", function ($scope, auth, $location, stateCorrector, $mdToast, dataManager) {
            var controller = $scope;
            controller.loading = false;
            controller.showToast = function (message) {
                $mdToast.show($mdToast.simple()
                    .textContent(message)
                    .position("bottom right")
                    .hideDelay(1500));
            };
            controller.user = dataManager.getSignInUpPageDetails();
            controller.signIn = function () {
                if (!(controller.user.email) || controller.user.email.trim() === "") {
                    controller.showToast("Invalid email.");
                }
                else if (!(controller.user.password) || (controller.user.password.trim() === "" || controller.user.password.length < 6)) {
                    controller.showToast("Invalid password (must be at least 6 characters).");
                }
                else {
                    controller.loading = true;
                    auth.signIn(controller.user.email, controller.user.password).then(function (userUUID) {
                        stateCorrector.correctState(userUUID);
                        controller.$apply();
                    }).catch(function (error) {
                        controller.loading = false;
                        controller.showToast(error);
                    });
                }
            };
            controller.signUp = function (email, password) {
                console.log("email????? " + email);
                dataManager.setSignInUpPageDetails(email, password);
                $location.path("/sign-up");
            };
        });
    };
    return Main;
}());
var main = new Main();

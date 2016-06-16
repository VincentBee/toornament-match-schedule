;(function(window, undefined) {

    'use strict';

    /**
     * Toornament client Api
     *
     * @param options
     *
     * @constructor
     */
    function Toornament(options) {
        this.host           = options.host || 'https://api.toornament.com';
        this.version        = options.version || 'v1';

        this.apiKey         = options.apiKey || null;
        this.clientId       = options.clientId || null;
        this.clientSecret   = options.clientSecret || null;
        this.accessToken    = null;

        this.xhr            = new XMLHttpRequest();
        this.queue          = [];
    }

    /**
     * Build the target url
     *
     * @param targetResource String
     * @param attributes     Object
     *
     * @returns String|null
     */
    Toornament.prototype.getTargetUrl = function(targetResource, attributes) {
        switch (targetResource) {
            case 'my_tournament_list':
                return this.host + '/' + this.version + '/me/tournaments';
            case 'match_list':
                return this.host + '/' + this.version + '/tournaments/'+attributes.tournamentId+'/matches';
            case 'save_match':
                return this.host + '/' + this.version + '/tournaments/'+attributes.tournamentId+'/matches/'+attributes.matchId;
            case 'get_stage':
                return this.host + '/' + this.version + '/tournaments/'+attributes.tournamentId+'/stages/'+attributes.stageNumber;
            case 'get_stage_view':
                return this.host + '/' + this.version + '/tournaments/'+attributes.tournamentId+'/stages/'+attributes.stageNumber+'/view';
        }

        return null; // todo: throw exception
    };

    Toornament.prototype.getTargetMethod = function(targetResource) {
        switch (targetResource) {
            case 'my_tournament_list':
            case 'match_list':
            case 'get_stage':
            case 'get_stage_view':
                return 'GET';
            case 'save_match':
                return 'PATCH';
        }

        return null; // todo: throw exception
    };

    Toornament.prototype.isSecured = function(targetResource) {
        switch (targetResource) {
            case 'my_tournament_list':
            case 'match_list':
            case 'save_match':
            case 'get_stage':
            case 'get_stage_view':
                return true;
        }

        return null; // todo: throw exception
    };

    Toornament.prototype.getHeaders = function(targetResource) {
        var headers = {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
        };

        switch (targetResource) {
            case 'my_tournament_list':
            case 'match_list':
            case 'save_match':
            case 'get_stage':
            case 'get_stage_view':
                headers.Authorization = 'Bearer ' + this.accessToken;
        }

        return headers;
    };

    Toornament.prototype.getRequestContent = function(targetResource, attributes) {
        switch (targetResource) {
            case 'save_match':
                return {
                    date:      attributes.date,
                    timezone:  attributes.timezone
                };
        }

        return null;
    };

    Toornament.prototype.generateAccessToken = function(previousRequest) {
        var toornament = this;
        this.queue.unshift(previousRequest);
        this.queue.unshift({
            requireAuthentication: false,
            method: 'GET',
            targetUrl: this.host + '/oauth/v2/token?grant_type=client_credentials&client_id=' + this.clientId + '&client_secret=' + this.clientSecret,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': this.apiKey
            },
            successHandler: function (data) {
                toornament.accessToken = data.access_token;
                for (var i in toornament.queue) {
                    if (typeof toornament.queue[i].headers.Authorization === 'undefined') {
                        continue;
                    }
                    toornament.queue[i].headers.Authorization = 'Bearer ' + data.access_token;
                }
            },
            errorHandler: null
        });

        this.run();
    };

    Toornament.prototype.callApi = function(targetResource, attributes, successHandler, errorHandler) {
        this.queue.push({
            requireAuthentication:  this.isSecured(targetResource),
            method:                 this.getTargetMethod(targetResource),
            targetUrl:              this.getTargetUrl(targetResource, attributes),
            headers:                this.getHeaders(targetResource),
            content:                this.getRequestContent(targetResource, attributes),
            successHandler:         successHandler || null,
            errorHandler:           errorHandler || null
        });

        return this;
    };

    Toornament.prototype.sendRequest = function(request) {
        var toornament = this,
            xhr = this.xhr;

        if (request.requireAuthentication && toornament.accessToken === null) {
            return this.generateAccessToken(request);
        }

        xhr.open(request.method, request.targetUrl, true);
        for (var index in request.headers) {
            xhr.setRequestHeader(index, request.headers[index]);
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }

            if (request.successHandler !== null && xhr.status == 200) {
                request.successHandler(JSON.parse(xhr.responseText));
                toornament.run();

            } else if (request.errorHandler !== null) {
                request.errorHandler(xhr.status, xhr.responseText);
            }
        };

        xhr.send(request.content!== null ? JSON.stringify(request.content): null);
    };

    Toornament.prototype.run = function() {
        var request = this.queue.shift();

        if (typeof request === 'undefined') {
            return;
        }

        this.sendRequest(request);
    };

    window.Toornament = Toornament;

})(window);

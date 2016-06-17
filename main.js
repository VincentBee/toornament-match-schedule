document.addEventListener('DOMContentLoaded', function() {
    var apiKeyInput             = document.getElementById('api-key'),
        clientIdInput           = document.getElementById('api-client-id'),
        clientSecretInput       = document.getElementById('api-client-secret'),
        views                   = document.getElementsByClassName('view'),
        tournamentListContainer = document.getElementById('tournament-list-container'),
        tournamentList          = tournamentListContainer.getElementsByTagName('tbody')[0],
        matchListContainer      = document.getElementById('match-list-container'),
        matchList               = matchListContainer.getElementsByTagName('tbody')[0];

    var tournamentRowTemplate = null;
    var matchRowTemplate = null;

    moment.locale('fr');
    apiKeyInput.value = getParameterByName('api_key');
    clientIdInput.value = getParameterByName('client_id');
    clientSecretInput.value = getParameterByName('client_secret');
    
    var toornamentApi = new Toornament({
        apiKey: getParameterByName('api_key'),
        clientId: getParameterByName('client_id'),
        clientSecret: getParameterByName('client_secret')
    });

    get('views/tournament_row.html', function(template) {
        tournamentRowTemplate = template;
    });

    get('views/match_row.html', function(template) {
        matchRowTemplate = template;
    });

    var importMatchesAction = function(e){
        e.preventDefault();
        toornamentApi.callApi('match_list', {'tournamentId': e.target.dataset.id},
            function (data) {
                matchList.innerHTML = '';
                data.forEach(function (value) {
                    interpretedDate = moment(value.date, 'YYYY-MM-DDTHH:mm:ssZZ');
                    matchList.innerHTML += Mustache.render(matchRowTemplate, {
                        'match_id':       value.id,
                        'tournament_id':  value.tournament_id,
                        'stage_number':   value.stage_number,
                        'group_number':   value.group_number,
                        'round_number':   value.round_number,
                        'opponent1_name': value.opponents[0].participant !== null? value.opponents[0].participant.name: '',
                        'opponent2_name': value.opponents[1].participant !== null? value.opponents[1].participant.name: '',
                        'date':           interpretedDate.isValid()? interpretedDate.format('L'): '',
                        'time':           interpretedDate.isValid()? interpretedDate.format('LT'): ''
                    });
                });

                [].forEach.call(matchList.getElementsByClassName('button-save-match'), function(element) {
                    element.addEventListener('click', saveMatchAction);
                });

                for(i=0; i<views.length; i++) {
                    views[i].className = 'view hide';
                }
                matchListContainer.className = 'view';
            },
            function (status, data) {
                alert(data);
            }
        ).run();
    };

    var saveMatchAction = function(e) {
        e.preventDefault();
        date = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByClassName("date")[0].value;
        time = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByClassName("time")[0].value;

        toornamentApi.callApi('save_match', {
                'tournamentId': e.target.parentNode.dataset.tournament,
                'matchId': e.target.parentNode.dataset.match,
                'date': moment(date+' '+time, 'L LT').format('YYYY-MM-DDTHH:mm:ssZZ'),
                'timezone': document.getElementById('timezone').value
            },
            function (data) {
                console.log('save matches success', data);
            }, function (status, data) {
                alert(data);
            }
        ).run();
    };

    document.getElementById('button-import-tournament').addEventListener('click', function(e) {
        e.preventDefault();
        toornamentApi.callApi('my_tournament_list', {},
            function(data) {
                for(i=0; i<views.length; i++) {
                    views[i].className = 'view hide';
                }
                tournamentList.innerHTML = '';

                data.forEach(function (value) {
                    tournamentList.innerHTML += Mustache.render(tournamentRowTemplate, {
                        'id':         value.id,
                        'name':       value.name,
                        'discipline': value.discipline,
                        'size':       value.size,
                        'isPublic':   value.public?'public':'draft'
                    });
                });

                [].forEach.call(tournamentList.getElementsByClassName('button-import-matches'), function(element) {
                    element.addEventListener('click', importMatchesAction);
                });
                tournamentListContainer.className = 'view';
            },
            function (status, data) {
                alert(data);
            }
        ).run();
    });
}, false );

function getParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Load a resource through an ajax request.
 *
 * @param url
 * @param callback
 */
function get(url, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState != 4 || httpRequest.status != 200) return;
        callback(httpRequest.responseText);
    };
    httpRequest.open('GET', url);
    httpRequest.send();
}
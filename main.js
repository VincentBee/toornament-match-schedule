document.addEventListener('DOMContentLoaded', function() {
    var apiKeyInput             = document.getElementById('api-key'),
        clientIdInput           = document.getElementById('api-client-id'),
        clientSecretInput       = document.getElementById('api-client-secret'),
        views                   = document.getElementsByClassName('view'),
        tournamentListContainer = document.getElementById('tournament-list-container'),
        tournamentList          = tournamentListContainer.getElementsByTagName('tbody')[0],
        matchListContainer      = document.getElementById('match-list-container'),
        matchList               = matchListContainer.getElementsByTagName('tbody')[0];

    moment.locale('fr');
    apiKeyInput.value = getParameterByName('api_key');
    clientIdInput.value = getParameterByName('client_id');
    clientSecretInput.value = getParameterByName('client_secret');
    
    var toornamentApi = new Toornament({
        apiKey: getParameterByName('api_key'),
        clientId: getParameterByName('client_id'),
        clientSecret: getParameterByName('client_secret')
    });

    var importMatchesAction = function(e){
        e.preventDefault();
        toornamentApi.callApi('match_list', {'tournamentId': e.target.dataset.id},
            function (data) {
                for(i=0; i<views.length; i++) {
                    views[i].className = 'view hide';
                }
                matchList.innerHTML = '';

                for(i=0; i<data.length; i++) {
                    match_id = data[i].id;
                    tournament_id = data[i].tournament_id;
                    stage_number = data[i].stage_number;
                    group_number = data[i].group_number;
                    round_number = data[i].round_number;
                    opponent1_name = data[i].opponents[0].participant !== null? data[i].opponents[0].participant.name: '';
                    opponent2_name = data[i].opponents[1].participant !== null? data[i].opponents[1].participant.name: '';

                    date = '';
                    time = '';
                    interpretedDate = moment(data[i].date, 'YYYY-MM-DDTHH:mm:ssZZ');
                    if (interpretedDate.isValid()){
                        date = interpretedDate.format('L');
                        time = interpretedDate.format('LT');
                    }

                    row =   '<tr>' +
                        '<td class="data column-large">' +
                        '<div class="grid-flex vertical">' +
                        '<div><span style="font-size: 12px;">Stage ' + stage_number + ' / Group ' + group_number + ' / Round ' + round_number + '</span></div>' +
                        '<div><strong>' + opponent1_name + '</strong>' + ' vs ' + '<strong>' + opponent2_name + '</strong></div>' +
                        '</div>' +
                        '</td>' +
                        '<td class="data column-medium"><div class="form-row"><div class="form-field"><input type="text" class="date" value="' + date + '" placeholder="JJ/MM/AAAA" /></div></div></td>' +
                        '<td class="data column-medium"><div class="form-row"><div class="form-field"><input type="text" class="time" value="' + time + '" placeholder="HH:MM" /></div></div></td>' +
                        '<td class="actions column-small">' +
                        '<ul class="button-list layout-right collapsed">' +
                        '<li><a data-match="' + match_id + '" data-tournament="' + tournament_id + '" class="button button-save-match light"><i class="fa-pencil"></i></a></li>' +
                        '</ul>' +
                        '</td>' +
                        '</tr>'
                    ;
                    matchList.innerHTML += row;
                }


                var saveMatchButtons = matchList.getElementsByClassName('button-save-match');
                for (var i=0; i<saveMatchButtons.length; i++){
                    saveMatchButtons[i].addEventListener('click', saveMatchAction);
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

                for(i=0; i<data.length; i++) {
                    id = data[i].id;
                    name = data[i].name;
                    discipline = data[i].discipline;
                    size = data[i].size;
                    isPublic = data[i].public?'public':'draft';

                    row =   '<tr>' +
                        '<td>'+name+'</td>' +
                        '<td>'+discipline+'</td>' +
                        '<td>'+size+'</td>' +
                        '<td>'+isPublic+'</td>' +
                        '<td>' +
                        '<button data-id="'+id+'" class="button-import-matches pure-button pure-button-primary">Edit</button>' +
                        '</td>' +
                        '</tr>'
                    ;
                    tournamentList.innerHTML += row;
                }

                var importMatchButtons = tournamentList.getElementsByClassName('button-import-matches');
                for (var i=0; i<importMatchButtons.length; i++){
                    importMatchButtons[i].addEventListener('click', importMatchesAction);
                }
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

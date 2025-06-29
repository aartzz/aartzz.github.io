/*
 ________  ______________  _     
|_   _|  \/  |  _  \ ___ \(_)    
  | | | .  . | | | | |_/ / _ ___ 
  | | | |\/| | | | | ___ \| / __|
 _| |_| |  | | |/ /| |_/ /| \__ \
 \___/\_|  |_/___/ \____(_) |___/
                         _/ |    
                        |__/     
a Plugin for LAMPA/LAMPAC, that shows IMDB rating. Using imdbapi.dev REST API.
Made by aartzz (aartzz.pp.ua)
*/

(function () {
    'use strict';

    function rating_imdb(card) {
        if (!card || !card.imdb_id) {
            console.log('IMDB Plugin: imdb_id not found in card:', card);
            return;
        }

        var network = new Lampa.Reguest();
        var params = {
            id: card.id,
            cache_time: 60 * 60 * 24 * 1000
        };
        getRating();

        function getRating() {
            var movieRatingData = _getCache(params.id);
            if (movieRatingData) {
                return _showRating(movieRatingData);
            } else {
                searchRating();
            }
        }

        function searchRating() {
            const apiUrl = `https://rest.imdbapi.dev/v2/titles/${encodeURIComponent(card.imdb_id)}`;

            network.clear();
            network.timeout(8000);
            network.silent(apiUrl, function (json) {
                if (json && json.rating && json.rating.aggregate_rating !== undefined) {
                    const ratingValue = json.rating.aggregate_rating;
                    const movieRating = _setCache(params.id, {
                        imdb: ratingValue,
                        timestamp: new Date().getTime()
                    });
                    _showRating(movieRating);
                } else {
                    showError("IMDB: 404 Not found.");
                    console.log('IMDB Plugin: Rating not found in API response', json);
                }
            }, function (a, c) {
                showError("IMDB: " + network.errorDecode(a, c));
            });
        }

        function showError(error_message) {
            Lampa.Noty.show('IMDB: ' + error_message);
        }

        function _getCache(movie_id_key) {
            var timestamp = new Date().getTime();
            var cache = Lampa.Storage.cache('imdb_rating', 500, {});
            if (cache[movie_id_key]) {
                if ((timestamp - cache[movie_id_key].timestamp) > params.cache_time) {
                    delete cache[movie_id_key];
                    Lampa.Storage.set('imdb_rating', cache);
                    return false;
                }
                return cache[movie_id_key];
            }
            return false;
        }

        function _setCache(movie_id_key, data_to_cache) {
            var cache = Lampa.Storage.cache('imdb_rating', 500, {});
            cache[movie_id_key] = data_to_cache;
            Lampa.Storage.set('imdb_rating', cache);
            return data_to_cache;
        }

        function _showRating(data) {
            if (data && data.imdb !== undefined && data.imdb !== null) {
                var imdb_rating = !isNaN(parseFloat(data.imdb)) ? parseFloat(data.imdb).toFixed(1) : '0.0';
                var render = Lampa.Activity.active().activity.render();
                $('.wait_rating', render).remove();
                $('.rate--imdb', render).removeClass('hide').find('> div').eq(0).text(imdb_rating);
            } else {
                console.log('IMDB Plugin: _showRating called with invalid data or no imdb rating.', data);
            }
        }
    }

    function startPlugin() {
        window.rating_plugin = true;
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite' && e.data && e.data.movie) {
                var render = e.object.activity.render();
                if ($('.rate--imdb', render).hasClass('hide') && !$('.wait_rating', render).length) {
                    $('.info__rate', render).after('<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div><div>');
                    rating_imdb(e.data.movie);
                }
            }
        });
    }

    if (!window.rating_plugin) {
        startPlugin();
    }
})();

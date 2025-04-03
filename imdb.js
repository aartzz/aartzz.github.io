(function () {
    'use strict';

    function rating_imdb(card) {
        var network = new Lampa.Reguest();
        var params = {
            id: card.id,
            cache_time: 60 * 60 * 24 * 1000 // 1 день у мілісекундах
        };
        getRating();

        function getRating() {
            var movieRating = _getCache(params.id);
            if (movieRating) {
                return _showRating(movieRating[params.id]);
            } else {
                searchRating();
            }
        }

        function searchRating() {
            var url = 'https://imdb.pythonanywhere.com/rating?id=' + encodeURIComponent(card.imdb_id); // proxy URL
            network.clear();
            network.timeout(15000);
            network.silent(url, function (json) {
                if (json && json.rating !== undefined) {
                    var movieRating = _setCache(params.id, {
                        imdb: json.rating,
                        timestamp: new Date().getTime()
                    });
                    return _showRating(movieRating);
                } else {
                    showError("Рейтинг IMDB не знайдено.");
                }
            }, function (a, c) {
                showError(network.errorDecode(a, c));
            });
        }

        function showError(error) {
            Lampa.Noty.show('Рейтинг IMDB: ' + error);
        }

        function _getCache(movie) {
            var timestamp = new Date().getTime();
            var cache = Lampa.Storage.cache('imdb_rating', 500, {}); // 500 - ліміт ключів
            if (cache[movie]) {
                if ((timestamp - cache[movie].timestamp) > params.cache_time) {
                    delete cache[movie];
                    Lampa.Storage.set('imdb_rating', cache);
                    return false;
                }
            } else return false;
            return cache;
        }

        function _setCache(movie, data) {
            var timestamp = new Date().getTime();
            var cache = Lampa.Storage.cache('imdb_rating', 500, {});
            if (!cache[movie]) {
                cache[movie] = data;
                Lampa.Storage.set('imdb_rating', cache);
            } else {
                if ((timestamp - cache[movie].timestamp) > params.cache_time) {
                    data.timestamp = timestamp;
                    cache[movie] = data;
                    Lampa.Storage.set('imdb_rating', cache);
                } else data = cache[movie];
            }
            return data;
        }

        function _showRating(data) {
            if (data) {
                var imdb_rating = !isNaN(data.imdb) && data.imdb !== null ? parseFloat(data.imdb).toFixed(1) : '0.0';
                var render = Lampa.Activity.active().activity.render();
                $('.wait_rating', render).remove();
                $('.rate--imdb', render).removeClass('hide').find('> div').eq(0).text(imdb_rating);
            }
        }
    }

    function startPlugin() {
        window.rating_plugin = true;
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.activity.render();
                if ($('.rate--imdb', render).hasClass('hide') && !$('.wait_rating', render).length) {
                    $('.info__rate', render).after('<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div><div>');
                    rating_imdb(e.data.movie);
                }
            }
        });
    }

    if (!window.rating_plugin) startPlugin();
})();

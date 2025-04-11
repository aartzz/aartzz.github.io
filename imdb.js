// Just a IMDB Rating, that uses another API (useful for ukrainans)
// Maded on "KP + IMDB rating", that uses kinopoisk API (https://nb557.github.io/plugins/rating.js)
// Using for my Lampac instance (https://aartzz.github.io/lampac)

(function () {
    'use strict';

    const MDblistApiKey = 'v331ujfep6i6db0n785e5s6zh';

    function rating_imdb(card) {
        var network = new Lampa.Reguest();
        var params = {
            id: card.id,
            cache_time: 60 * 60 * 24 * 1000
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
            let mainUrl;
            if (card.imdb_id) {
                const type = card.type === 'movie' ? 'movie' : 'show';
                mainUrl = `https://api.mdblist.com/imdb/${type}/${encodeURIComponent(card.imdb_id)}?apikey=${MDblistApiKey}&append_to_response=keyword&format=json`;
            }

            const backupUrl = 'https://imdb.doladu.net.ua/rating?id=' + encodeURIComponent(card.imdb_id);

            function fetchRating(url, isMain) {
                network.clear();
                network.timeout(15000);
                network.silent(url, function (json) {
                    if (json) {
                        let ratingValue;
                        if (isMain && json.ratings && json.ratings[0] && json.ratings[0].value !== undefined) {
                            ratingValue = json.ratings[0].value;
                        } else if (!isMain && json.rating !== undefined) {
                            ratingValue = json.rating;
                        }

                        if (ratingValue !== undefined) {
                            const movieRating = _setCache(params.id, {
                                imdb: ratingValue,
                                timestamp: new Date().getTime()
                            });
                            return _showRating(movieRating);
                        } else if (isMain) {
                            // Якщо в основному API немає рейтингу, використовуємо резервний
                            fetchRating(backupUrl, false);
                        } else {
                            showError("IMDB: Рейтинг не знайдено.");
                        }
                    } else if (isMain) {
                        fetchRating(backupUrl, false);
                    } else {
                        showError("IMDB: Помилка отримання даних.");
                    }
                }, function (a, c) {
                    if (isMain) {
                        fetchRating(backupUrl, false);
                    } else {
                        showError(network.errorDecode(a, c));
                    }
                });
            }

            if (mainUrl) {
                fetchRating(mainUrl, true);
            } else {
                fetchRating(backupUrl, false);
            }
        }

        function showError(error) {
            Lampa.Noty.show('IMDB: ' + error);
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

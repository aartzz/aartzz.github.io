// Just a IMDB Rating, that uses another API (useful for ukrainans)
// Maded on "KP + IMDB rating", that uses kinopoisk API (https://nb557.github.io/plugins/rating.js)
// Using for my Lampac instance (https://aartzz.github.io/lampac)

(function () {
    'use strict';

    const MDblistApiKey = 'v331ujfep6i6db0n785e5s6zh'; // Переконайтеся, що цей ключ дійсний та активний

    function rating_imdb(card) {
        if (!card || !card.imdb_id) {
            // Lampa.Noty.show('IMDB: imdb_id не знайдено в картці фільму.'); // Розкоментуйте для відладки, якщо потрібно
            console.log('IMDB Plugin: imdb_id not found in card:', card);
            return; // Немає сенсу продовжувати без imdb_id
        }

        var network = new Lampa.Reguest();
        var params = {
            id: card.id, // Використовується як ключ для кешу (унікальний ID картки в LAMPA)
            cache_time: 60 * 60 * 24 * 1000 // 24 години
        };
        getRating();

        function getRating() {
            var movieRatingData = _getCache(params.id); // Отримуємо дані для конкретного фільму
            if (movieRatingData) {
                return _showRating(movieRatingData); // Передаємо дані фільму
            } else {
                searchRating();
            }
        }

        function searchRating() {
            let mainUrl;
            // card.imdb_id вже перевірено на вході в rating_imdb
            // і гарантовано існує на цей момент
            const type = card.type === 'movie' ? 'movie' : 'show';
            mainUrl = `https://api.mdblist.com/imdb/${type}/${encodeURIComponent(card.imdb_id)}?apikey=${MDblistApiKey}&append_to_response=keyword&format=json`;

            const backupUrl = 'https://imdb.aartzz.pp.ua/rating?id=' + encodeURIComponent(card.imdb_id);

            function fetchRating(url, isMain) {
                network.clear();
                network.timeout(5000); // Встановлено таймаут 5 секунд
                network.silent(url, function (json) {
                    if (json) {
                        let ratingValue;
                        if (isMain) { // Обробка відповіді від api.mdblist.com
                            if (json.ratings && Array.isArray(json.ratings)) {
                                const imdbRatingObject = json.ratings.find(rating => rating.source === 'imdb');
                                if (imdbRatingObject && imdbRatingObject.value !== undefined) {
                                    ratingValue = imdbRatingObject.value;
                                } else {
                                    // console.log('IMDB Plugin: IMDb source not found or value missing in main API ratings. JSON:', json);
                                }
                            } else {
                                // console.log('IMDB Plugin: json.ratings is missing or not an array in main API response. JSON:', json);
                            }
                        } else if (json.rating !== undefined) { // Обробка відповіді від резервного API (imdb.aartzz.pp.ua)
                            ratingValue = json.rating;
                        }

                        if (ratingValue !== undefined) {
                            const movieRating = _setCache(params.id, {
                                imdb: ratingValue,
                                timestamp: new Date().getTime()
                            });
                            return _showRating(movieRating);
                        } else if (isMain) {
                            // Якщо ratingValue не визначено після спроби основного API, перемикаємося на резервний
                            // console.log('IMDB Plugin: ratingValue is undefined after processing main API. Attempting backup.');
                            fetchRating(backupUrl, false);
                        } else {
                            showError("Рейтинг не знайдено на резервному API.");
                        }
                    } else if (isMain) { // json від основного API порожній (null або undefined)
                        // console.log('IMDB Plugin: Main API returned empty or null response. Attempting backup.');
                        fetchRating(backupUrl, false);
                    } else {
                        showError("Помилка отримання даних з резервного API (порожня відповідь).");
                    }
                }, function (a, c) { // Колбек помилки
                    if (isMain) {
                        // console.log('IMDB Plugin: Error fetching from main API. Status: ' + a + ', Error: ' + c + '. Attempting backup.');
                        fetchRating(backupUrl, false);
                    } else {
                        showError("Помилка запиту до резервного API: " + network.errorDecode(a, c));
                    }
                });
            }

            // Завжди намагаємося спочатку основний URL, оскільки imdb_id перевірено
            fetchRating(mainUrl, true);
        }

        function showError(error_message) {
            Lampa.Noty.show('IMDB: ' + error_message);
        }

        function _getCache(movie_id_key) {
            var timestamp = new Date().getTime();
            var cache = Lampa.Storage.cache('imdb_rating', 500, {}); // 500 - ліміт ключів
            if (cache[movie_id_key]) {
                if ((timestamp - cache[movie_id_key].timestamp) > params.cache_time) {
                    delete cache[movie_id_key];
                    Lampa.Storage.set('imdb_rating', cache);
                    return false; // Запис застарів
                }
                return cache[movie_id_key]; // Повертаємо дані для конкретного фільму
            }
            return false; // Запису немає
        }

        function _setCache(movie_id_key, data_to_cache) {
            var cache = Lampa.Storage.cache('imdb_rating', 500, {});
            // data_to_cache вже містить актуальний timestamp, встановлений при отриманні рейтингу
            cache[movie_id_key] = data_to_cache;
            Lampa.Storage.set('imdb_rating', cache);
            return data_to_cache; // Повертаємо дані, які щойно зберегли
        }

        function _showRating(data) {
            // Переконуємося, що 'data' існує і має властивість 'imdb'
            if (data && data.imdb !== undefined && data.imdb !== null) {
                var imdb_rating = !isNaN(parseFloat(data.imdb)) ? parseFloat(data.imdb).toFixed(1) : '0.0';
                var render = Lampa.Activity.active().activity.render();
                $('.wait_rating', render).remove();
                $('.rate--imdb', render).removeClass('hide').find('> div').eq(0).text(imdb_rating);
            } else {
                // console.log('IMDB Plugin: _showRating called with invalid data or no imdb rating.', data);
                // Якщо рейтингу немає, можливо, варто приховати блок або показати N/A
                // Поточна логіка просто нічого не оновить, якщо data.imdb недійсний
            }
        }
    }

    function startPlugin() {
        window.rating_plugin = true;
        Lampa.Listener.follow('full', function (e) {
            // Перевіряємо наявність e.data та e.data.movie перед використанням
            if (e.type == 'complite' && e.data && e.data.movie) {
                var render = e.object.activity.render();
                // Перевірка, чи вже є елемент рейтингу і чи не запущено очікування
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

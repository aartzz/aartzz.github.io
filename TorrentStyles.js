(function () {
  'use strict';

  var config = {
    version: '2.0.4-custom',
    name: 'Torrent Styles MOD (Final Solid)',
    pluginId: 'torrent_styles_mod'
  };

  var TH = {
    seeds: {
      danger_below: 6, // 0–5
      good_from: 21,   // 21+
      top_from: 21
    },
    bitrate: {
      warn_from: 46,   // 46–65
      danger_from: 66  // 66+
    },
    debounce_ms: 60
  };

  var styles = {
    /* BASE */
    '.torrent-item__bitrate > span.ts-bitrate, .torrent-item__seeds > span.ts-seeds, .torrent-item__grabs > span.ts-grabs, .torrent-item__size.ts-size': {
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'min-height': '1.7em',
      padding: '0.15em 0.45em',
      'border-radius': '0.5em',
      'font-weight': '700',
      'font-size': '0.9em',
      'white-space': 'nowrap'
    },

    /* SEEDS */
    '.torrent-item__seeds > span.ts-seeds': {
      color: '#ffc371', // обычные
      'background-color': 'rgba(255,195,113,0.15)',
      border: '0.15em solid rgba(255,195,113,0.9)'
    },
    '.torrent-item__seeds > span.low-seeds': {
      color: '#ff5f6d', // низкие
      'background-color': 'rgba(255,95,109,0.15)',
      border: '0.15em solid rgba(255,95,109,0.9)'
    },
    '.torrent-item__seeds > span.high-seeds': {
      color: '#43cea2', // высокие
      'background-color': 'rgba(67,206,162,0.15)',
      border: '0.15em solid rgba(67,206,162,0.9)'
    },

    /* BITRATE */
    '.torrent-item__bitrate > span.ts-bitrate': {
      color: '#43cea2', // обычный
      'background-color': 'rgba(67,206,162,0.12)',
      border: '0.15em solid rgba(67,206,162,0.85)'
    },
    '.torrent-item__bitrate > span.high-bitrate': {
      color: '#ffc371', // высокий
      'background-color': 'rgba(255,195,113,0.18)',
      border: '0.15em solid rgba(255,195,113,0.9)'
    },
    '.torrent-item__bitrate > span.very-high-bitrate': {
      color: '#ff5f6d', // очень высокий
      'background-color': 'rgba(255,95,109,0.18)',
      border: '0.15em solid rgba(255,95,109,0.9)'
    },

    /* SIZE */
    '.torrent-item__size.ts-size': {
      color: '#b983ff', // всегда фиолетовый
      'background-color': 'rgba(185,131,255,0.14)',
      border: '0.15em solid rgba(185,131,255,0.9)'
    },

    /* GRABS / PEERS */
    '.torrent-item__grabs > span.ts-grabs': {
      color: '#4db6ff', // всегда усиленный синий
      'background-color': 'rgba(77,182,255,0.18)',
      border: '0.15em solid rgba(77,182,255,0.92)'
    }
  };

  function injectStyles() {
    var style = document.createElement('style');
    style.innerHTML = Object.keys(styles).map(function (s) {
      return s + '{' + Object.keys(styles[s]).map(function (p) {
        return p + ':' + styles[s][p] + '!important';
      }).join(';') + '}';
    }).join('\n');
    document.head.appendChild(style);
  }

  function updateTorrentStyles() {
    document.querySelectorAll('.torrent-item__seeds span').forEach(function (s) {
      var v = parseInt(s.textContent) || 0;
      s.className = 'ts-seeds';
      if (v < TH.seeds.danger_below) s.classList.add('low-seeds');
      else if (v >= TH.seeds.top_from) s.classList.add('high-seeds');
    });

    document.querySelectorAll('.torrent-item__bitrate span').forEach(function (s) {
      var v = parseFloat(s.textContent) || 0;
      s.className = 'ts-bitrate';
      if (v >= TH.bitrate.danger_from) s.classList.add('very-high-bitrate');
      else if (v >= TH.bitrate.warn_from) s.classList.add('high-bitrate');
    });

    document.querySelectorAll('.torrent-item__grabs span').forEach(function (s) {
      s.className = 'ts-grabs'; // всегда усиленный синий
    });

    document.querySelectorAll('.torrent-item__size').forEach(function (s) {
      s.className = 'torrent-item__size ts-size'; // всегда фиолетовый
    });
  }

  injectStyles();
  new MutationObserver(updateTorrentStyles).observe(document.body, {
    childList: true,
    subtree: true
  });
  updateTorrentStyles();

})();
Lampa.Platform.tv()

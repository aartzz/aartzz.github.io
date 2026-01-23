(function () {
  "use strict";

  const API_URL = "https://bfilms.aartzz.pp.ua/api/comments?imdb_id=";
  let movieTitle = "";

  function buildCommentNode(item, isReply = false) {
    const avatar = item.author?.avatar || "https://uakino.best/templates/uakino/images/no-avatar.svg";
    const user = item.author?.name || "Гість";
    const date = item.date || "";
    const text = item.text || "";
    const rating = item.rating || 0;

    const wrapper = document.createElement("div");
    wrapper.className = "comments-tree-item";
    // Замість фіксованих px використовуємо rem для кращого масштабування
    if (isReply) wrapper.style.marginLeft = "2.5rem";

    wrapper.innerHTML = `
            <div class="comment-wrap">
                <div class="avatar-column">
                    <img src="${avatar}" class="avatar-img" alt="${user}" onerror="this.src='https://uakino.best/templates/uakino/images/no-avatar.svg'">
                </div>
                <div class="comment-card">
                    <div class="comment-header">
                        <span class="name">${user} <small class="group-label">(${item.author?.group || ''})</small></span>
                        <span class="date">${date}</span>
                    </div>
                    <div class="comment-text">
                        <div class="text">${text}</div>
                    </div>
                    <div class="comment-footer">
                        Рейтинг: ${rating}
                    </div>
                </div>
            </div>
        `;

    if (item.replies && item.replies.length > 0) {
      const repliesContainer = document.createElement("div");
      repliesContainer.className = "rc-children";
      item.replies.forEach(reply => {
        repliesContainer.appendChild(buildCommentNode(reply, true));
      });
      wrapper.appendChild(repliesContainer);
    }

    return wrapper;
  }

  async function getComments(imdb_id) {
    Lampa.Loading.start();
    
    try {
      const response = await fetch(API_URL + imdb_id);
      const data = await response.json();
      
      Lampa.Loading.stop();

      if (!data || data.length === 0) {
        Lampa.Noty.show("Коментарів поки немає");
        return;
      }

      const container = document.createElement("div");
      container.className = "comments-tree-list";
      
      data.forEach(item => {
        container.appendChild(buildCommentNode(item));
      });

      openModal(container);
    } catch (e) {
      console.error("Comments API error:", e);
      Lampa.Loading.stop();
      Lampa.Noty.show("Помилка завантаження коментарів");
    }
  }

  function openModal(content) {
    let modal = $(
      `<div class="bfilms-comments-container"><div class="broadcast__text" style="text-align:left;"><div class="comment-list"></div></div></div>`
    );
    modal.find(".comment-list").append(content);

    if (!document.getElementById("bfilms-comment-style")) {
      const styleEl = document.createElement("style");
      styleEl.id = "bfilms-comment-style";
      // Оптимізовані стилі під телевізори (збільшені розміри та контрастність)
      styleEl.textContent = `
        .bfilms-comments-container { padding: 1rem; }
        .comment-wrap { display: flex; margin-bottom: 1.5rem; }
        .avatar-column { margin-right: 1.2rem; flex-shrink: 0; }
        .avatar-img { width: 3.5rem; height: 3.5rem; border-radius: 50%; background: #2a2a2a; object-fit: cover; }
        .comment-card { background: rgba(255,255,255, 0.05); padding: 1.2rem 1.5rem; border-radius: 1rem; border: 1px solid rgba(255,255,255, 0.1); width: 100%; }
        .comment-header { display: flex; justify-content: space-between; margin-bottom: 0.8rem; align-items: baseline; }
        .comment-header .name { font-weight: bold; color: #fff; font-size: 1.5rem; }
        .comment-header .group-label { opacity: 0.5; font-weight: normal; font-size: 1.1rem; margin-left: 0.5rem; }
        .comment-header .date { opacity: 0.5; font-size: 1.2rem; }
        .comment-text .text { color: #eee; line-height: 1.6; font-size: 1.4rem; white-space: pre-wrap; word-break: break-word; }
        .comment-footer { margin-top: 1rem; font-size: 1.1rem; opacity: 0.6; color: #ffd700; }
        .rc-children { border-left: 3px solid #444; margin-top: 1rem; }
        
        /* Адаптація під модалку Lampa */
        .modal__content .comment-list { max-width: 100%; }
      `;
      document.head.appendChild(styleEl);
    }

    Lampa.Modal.open({
      title: "Коментарі",
      html: modal,
      size: "large",
      onBack: function () {
        Lampa.Modal.close();
        Lampa.Controller.toggle("content");
      }
    });

    // Назва фільму в заголовку також має бути читабельною
    document.querySelector(".modal__head")?.insertAdjacentHTML(
      "afterbegin",
      `<span style="font-size: 1.4rem; opacity: 0.6; margin-right: 1.5rem; vertical-align: middle;">${movieTitle}</span>`
    );
  }

  function startPlugin() {
    window.bfilms_comments_plugin = true;
    
    Lampa.Listener.follow("full", function (e) {
      if (e.type == "complite") {
        const movie = e.data.movie;
        movieTitle = movie.title || movie.name;
        
        $(".button--comment").remove();
        
        const btn = $(`<div class="full-start__button selector button--comment">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span>${Lampa.Lang.translate("title_comments")}</span>
        </div>`);

        btn.on("hover:enter", function () {
          const id = movie.external_ids?.imdb_id || movie.imdb_id;
          if (id) {
            getComments(id);
          } else {
            Lampa.Noty.show("IMDB ID не знайдено");
          }
        });

        // Додаємо кнопку. Перевіряємо обидва варіанти розміщення для сумісності з різними версіями Lampa
        if($(".full-start-new__buttons").length) {
            $(".full-start-new__buttons").append(btn);
        } else {
            $(".full-start__buttons").append(btn);
        }
      }
    });
  }

  // Чекаємо на повне завантаження Lampa
  if (window.Lampa) {
    if (!window.bfilms_comments_plugin) startPlugin();
  } else {
    document.addEventListener("lampa:ready", startPlugin);
  }
})();

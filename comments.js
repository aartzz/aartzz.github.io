(function () {
  "use strict";

  const API_URL = "https://bfilms.aartzz.pp.ua/api/comments?imdb_id=";
  let movieTitle = "";

  // Функція для створення вузла коментаря (включаючи відповіді)
  function buildCommentNode(item, isReply = false) {
    const avatar = item.author?.avatar || "https://uakino.best/templates/uakino/images/no-avatar.svg";
    const user = item.author?.name || "Гість";
    const date = item.date || "";
    const text = item.text || "";
    const rating = item.rating || 0;

    const wrapper = document.createElement("div");
    wrapper.className = "comments-tree-item";
    if (isReply) wrapper.style.marginLeft = "20px";

    wrapper.innerHTML = `
            <div class="comment-wrap">
                <div class="avatar-column">
                    <img src="${avatar}" class="avatar-img" alt="${user}" onerror="this.src='https://uakino.best/templates/uakino/images/no-avatar.svg'">
                </div>
                <div class="comment-card">
                    <div class="comment-header">
                        <span class="name">${user} <small style="opacity:0.5; font-weight:normal;">(${item.author?.group || ''})</small></span>
                        <span class="date">${date}</span>
                    </div>
                    <div class="comment-text">
                        <div class="text">${text}</div>
                    </div>
                    <div class="comment-footer" style="margin-top:5px; font-size:10px; opacity:0.6;">
                        Рейтинг: ${rating}
                    </div>
                </div>
            </div>
        `;

    // Якщо є відповіді, додаємо їх рекурсивно
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
      `<div><div class="broadcast__text" style="text-align:left;"><div class="comment"></div></div></div>`
    );
    modal.find(".comment").append(content);

    if (!document.getElementById("bfilms-comment-style")) {
      const styleEl = document.createElement("style");
      styleEl.id = "bfilms-comment-style";
      styleEl.textContent = `
        .comment-wrap{display:flex;margin-bottom:10px;}
        .avatar-column{margin-right:10px;}
        .avatar-img{width:40px;height:40px;border-radius:50%;background:#2a2a2a;}
        .comment-card{background:#1b1b1b;padding:8px 12px;border-radius:6px;border:1px solid #2a2a2a;width:100%;}
        .comment-header{display:flex;justify-content:space-between;margin-bottom:4px;}
        .comment-header .name{font-weight:600;color:#fff;font-size:14px;}
        .comment-header .date{opacity:.5;font-size:11px;}
        .comment-text .text{color:#ddd;line-height:1.4;font-size:14px;white-space: pre-wrap;}
        .rc-children{border-left:2px solid #333;margin-top:5px;}
        .modal-close-btn{background:#2a2a2a;border:1px solid #444;color:#ddd;border-radius:6px;padding:2px 8px;cursor:pointer;float:right;}
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

    document.querySelector(".modal__head")?.insertAdjacentHTML(
      "afterbegin",
      `<span style="font-size:14px; opacity:0.6; margin-right:10px;">${movieTitle}</span>`
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
          if (movie.external_ids?.imdb_id || movie.imdb_id) {
            getComments(movie.external_ids?.imdb_id || movie.imdb_id);
          } else {
            Lampa.Noty.show("IMDB ID не знайдено для цього контенту");
          }
        });

        $(".full-start-new__buttons").append(btn);
      }
    });
  }

  if (!window.bfilms_comments_plugin) startPlugin();
})();

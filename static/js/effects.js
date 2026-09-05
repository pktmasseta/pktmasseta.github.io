(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");

  if (!toggle || !nav) return;

  function openMenu() {
    nav.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
    document.body.classList.add("nav-open");

    var firstLink = nav.querySelector("a");
    if (firstLink) firstLink.focus();
  }

  function closeMenu(restoreFocus) {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    nav.hidden = true;
    document.body.classList.remove("nav-open");

    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener("click", function () {
    if (toggle.getAttribute("aria-expanded") === "true") {
      closeMenu(false);
    } else {
      openMenu();
    }
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) closeMenu(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !nav.hidden) {
      closeMenu(true);
    }

    if (event.key === "Tab" && !nav.hidden) {
      var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
      var lastLink = links[links.length - 1];

      if (event.shiftKey && document.activeElement === toggle && lastLink) {
        event.preventDefault();
        lastLink.focus();
      } else if (!event.shiftKey && document.activeElement === lastLink) {
        event.preventDefault();
        toggle.focus();
      }
    }
  });
})();

(function () {
  var root = document.querySelector("[data-composite]");
  if (!root) return;

  var stage = root.querySelector("[data-composite-stage]");
  var sets = Array.prototype.slice.call(
    root.querySelectorAll("[data-composite-set]"),
  );
  var yearLinks = Array.prototype.slice.call(
    root.querySelectorAll("[data-year]"),
  );
  var yearType = root.querySelector("[data-stage-year]");
  var yearLabel = root.querySelector("[data-current-count]");
  var status = root.querySelector("[data-composite-status]");
  var disrupt = root.querySelector("[data-composite-disrupt]");
  var disruptLabel = root.querySelector("[data-disrupt-label]");
  var card = root.querySelector("[data-person-card]");
  var closeCardButton = root.querySelector("[data-person-close]");
  var activeSet =
    root.querySelector("[data-composite-set].is-active") || sets[0];
  var pointerFrame = 0;
  var settleTimer = 0;
  var activeDrag = null;
  var lastPortrait = null;
  var isTossed = false;
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!stage || !activeSet) return;
  root.classList.add("is-enhanced");

  function activePortraits() {
    return Array.prototype.slice.call(
      activeSet.querySelectorAll("[data-person]"),
    );
  }

  function setMotion(portrait, x, y, rotation) {
    portrait.style.setProperty("--nudge-x", x.toFixed(2) + "px");
    portrait.style.setProperty("--nudge-y", y.toFixed(2) + "px");
    portrait.style.setProperty("--nudge-r", rotation.toFixed(2) + "deg");
  }

  function settlePortraits() {
    activePortraits().forEach(function (portrait) {
      if (!portrait.classList.contains("is-dragging"))
        setMotion(portrait, 0, 0, 0);
    });
    if (status && !isTossed) {
      status.textContent =
        "Class of " +
        activeSet.getAttribute("data-composite-set") +
        ", assembled.";
    }
  }

  function disturbPortraits(clientX, clientY) {
    if (reduceMotion) return;

    activePortraits().forEach(function (portrait) {
      if (portrait.classList.contains("is-dragging")) return;

      var rect = portrait.getBoundingClientRect();
      var dx = rect.left + rect.width / 2 - clientX;
      var dy = rect.top + rect.height / 2 - clientY;
      var distance = Math.sqrt(dx * dx + dy * dy) || 1;
      var force = Math.max(0, 1 - distance / 260);
      var x = (dx / distance) * force * 38;
      var y = (dy / distance) * force * 27;
      var rotation = (dx / distance) * force * 3.6;

      setMotion(portrait, x, y, rotation);
    });

    if (status) status.textContent = "The portrait is moving.";
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settlePortraits, 620);
  }

  stage.addEventListener("pointermove", function (event) {
    if (event.pointerType === "touch" || activeDrag) return;

    var x = event.clientX;
    var y = event.clientY;
    window.cancelAnimationFrame(pointerFrame);
    pointerFrame = window.requestAnimationFrame(function () {
      disturbPortraits(x, y);
    });
  });

  stage.addEventListener("pointerleave", function () {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settlePortraits, 180);
  });

  function resetToss() {
    isTossed = false;
    stage.classList.remove("is-tossed");
    if (disrupt) disrupt.setAttribute("aria-pressed", "false");
    if (disruptLabel) disruptLabel.textContent = "Break the pose";

    activePortraits().forEach(function (portrait) {
      portrait.style.setProperty("--toss-x", "0px");
      portrait.style.setProperty("--toss-y", "0px");
      portrait.style.setProperty("--toss-r", "0deg");
    });
  }

  function tossPortraits() {
    isTossed = true;
    stage.classList.add("is-tossed");
    disrupt.setAttribute("aria-pressed", "true");
    disruptLabel.textContent = "Take the picture";

    activePortraits().forEach(function (portrait, index) {
      var direction = index % 2 === 0 ? -1 : 1;
      var x = direction * (18 + ((index * 23) % 48));
      var y = -31 + ((index * 37) % 68);
      var rotation = direction * (2 + ((index * 11) % 9));
      portrait.style.setProperty("--toss-x", x + "px");
      portrait.style.setProperty("--toss-y", y + "px");
      portrait.style.setProperty("--toss-r", rotation + "deg");
    });

    if (status)
      status.textContent =
        "The class broke formation. Take the picture to reform it.";
  }

  if (disrupt) {
    disrupt.addEventListener("click", function () {
      if (isTossed) {
        resetToss();
        settlePortraits();
      } else {
        tossPortraits();
      }
    });
  }

  function selectYear(year, focusStage) {
    var nextSet = sets.filter(function (set) {
      return set.getAttribute("data-composite-set") === year;
    })[0];

    if (!nextSet || nextSet === activeSet) return;

    resetToss();
    settlePortraits();

    var oldSet = activeSet;
    oldSet.classList.remove("is-active");
    oldSet.classList.add("is-leaving");
    nextSet.classList.add("is-active", "is-arriving");
    activeSet = nextSet;

    window.setTimeout(function () {
      oldSet.classList.remove("is-leaving");
      nextSet.classList.remove("is-arriving");
    }, 720);

    yearLinks.forEach(function (link) {
      var current = link.getAttribute("data-year") === year;
      link.classList.toggle("is-active", current);
      if (current) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    yearType.textContent = year;
    yearLabel.textContent = "Class of " + year;
    status.textContent = "Class of " + year + ", assembled.";

    if (focusStage) stage.focus({ preventScroll: true });
  }

  yearLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      selectYear(link.getAttribute("data-year"), false);
    });

    link.addEventListener("keydown", function (event) {
      var index = yearLinks.indexOf(link);
      var nextIndex = index;
      if (event.key === "ArrowLeft") nextIndex = Math.max(0, index - 1);
      if (event.key === "ArrowRight")
        nextIndex = Math.min(yearLinks.length - 1, index + 1);
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = yearLinks.length - 1;

      if (nextIndex !== index) {
        event.preventDefault();
        yearLinks[nextIndex].focus();
        selectYear(yearLinks[nextIndex].getAttribute("data-year"), false);
      }
    });
  });

  function startDrag(event, portrait) {
    if (event.button !== 0) return;
    activeDrag = {
      portrait: portrait,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: 0,
      y: 0,
    };
    portrait.classList.add("is-dragging");
    portrait.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    activeDrag.x = event.clientX - activeDrag.startX;
    activeDrag.y = event.clientY - activeDrag.startY;
    activeDrag.portrait.style.setProperty("--drag-x", activeDrag.x + "px");
    activeDrag.portrait.style.setProperty("--drag-y", activeDrag.y + "px");
    activeDrag.portrait.style.setProperty(
      "--drag-r",
      activeDrag.x / 24 + "deg",
    );
  }

  function endDrag(event) {
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    var portrait = activeDrag.portrait;
    var distance = Math.sqrt(
      activeDrag.x * activeDrag.x + activeDrag.y * activeDrag.y,
    );
    portrait.classList.remove("is-dragging");
    portrait.style.setProperty("--drag-x", "0px");
    portrait.style.setProperty("--drag-y", "0px");
    portrait.style.setProperty("--drag-r", "0deg");

    if (distance > 7) portrait.setAttribute("data-was-dragged", "true");
    activeDrag = null;
  }

  root.addEventListener("pointerdown", function (event) {
    var portrait = event.target.closest("[data-person]");
    if (portrait && portrait.closest(".is-active")) startDrag(event, portrait);
  });

  root.addEventListener("pointermove", moveDrag);
  root.addEventListener("pointerup", endDrag);
  root.addEventListener("pointercancel", endDrag);

  function showPerson(portrait) {
    var image = portrait.querySelector("img");
    var nickname = portrait.getAttribute("data-person-nickname") || "";
    var major = portrait.getAttribute("data-person-major") || "";
    var hometown = portrait.getAttribute("data-person-hometown") || "";
    var imageTarget = card.querySelector("[data-person-image]");
    var nicknameTarget = card.querySelector("[data-person-nickname]");
    var majorRow = card.querySelector("[data-person-major-row]");
    var hometownRow = card.querySelector("[data-person-hometown-row]");

    card.querySelector("[data-person-title]").textContent =
      portrait.getAttribute("data-person-name");
    card.querySelector("[data-person-class]").textContent =
      "Class of " + portrait.getAttribute("data-person-year");
    card.querySelector("[data-person-major]").textContent = major;
    card.querySelector("[data-person-hometown]").textContent = hometown;
    card.querySelector("[data-person-link]").href = portrait.href;
    imageTarget.src = image.src;
    imageTarget.alt = portrait.getAttribute("data-person-name");

    nicknameTarget.textContent = nickname
      ? "Known around the house as “" + nickname + ".”"
      : "";
    nicknameTarget.hidden = !nickname;
    majorRow.hidden = !major;
    hometownRow.hidden = !hometown;
    card
      .querySelector(".person-card__portrait")
      .classList.toggle(
        "is-placeholder",
        Boolean(portrait.querySelector(".portrait__image--placeholder")),
      );

    lastPortrait = portrait;
    card.hidden = false;
    document.body.classList.add("person-open");
    closeCardButton.focus();
  }

  function closePerson(restoreFocus) {
    card.hidden = true;
    document.body.classList.remove("person-open");
    if (restoreFocus && lastPortrait) lastPortrait.focus();
  }

  root.addEventListener("click", function (event) {
    var portrait = event.target.closest("[data-person]");
    if (!portrait) return;

    if (portrait.getAttribute("data-was-dragged") === "true") {
      event.preventDefault();
      portrait.removeAttribute("data-was-dragged");
      return;
    }

    event.preventDefault();
    showPerson(portrait);
  });

  closeCardButton.addEventListener("click", function () {
    closePerson(true);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !card.hidden) closePerson(true);

    if (event.key === "Tab" && !card.hidden) {
      var focusable = Array.prototype.slice.call(
        card.querySelectorAll("button, a[href]"),
      );
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();

/* Homepage: 229, the house computer (macOS) */

(function () {
  var desktop = document.querySelector(".mac-desktop[data-desktop]");
  if (!desktop) return;

  var workspace = desktop.querySelector("[data-workspace]");
  var boot = desktop.querySelector("[data-boot]");
  var lock = desktop.querySelector("[data-lock]");
  var shutdown = desktop.querySelector("[data-shutdown]");
  var clocks = Array.prototype.slice.call(desktop.querySelectorAll("[data-clock]"));
  var menubar = desktop.querySelector("[data-menubar]");
  var menubarApp = desktop.querySelector("[data-menubar-app]");
  var appMenuSets = Array.prototype.slice.call(desktop.querySelectorAll("[data-app-menus]"));
  var dock = desktop.querySelector("[data-dock]");
  var status = desktop.querySelector("[data-desktop-status]");
  var spotlight = desktop.querySelector("[data-spotlight]");
  var notification = desktop.querySelector("[data-notification]");
  var dialog = desktop.querySelector("[data-dialog]");
  var controlCenter = desktop.querySelector("[data-control-center]");
  var controlCenterButton = desktop.querySelector('[data-action="control-center"]');
  var wallpaperChoices = Array.prototype.slice.call(desktop.querySelectorAll("[data-wallpaper-choice]"));
  var wallpaperBrightness = desktop.querySelector("[data-wallpaper-brightness]");
  var windows = Array.prototype.slice.call(desktop.querySelectorAll(".mac-window[data-window]"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var phone = window.matchMedia("(max-width: 700px), (max-height: 500px) and (pointer: coarse)");
  var finePointer = window.matchMedia("(pointer: fine)");
  var isApple = /Mac|iP(hone|ad|od)/.test(navigator.platform || "");
  var zCounter = 10;
  var focused = null;
  var openOrder = [];

  function announce(text) {
    if (status) status.textContent = text;
  }

  /* Sidebars become horizontal rails on a phone: keep the selected pill in view. */
  function railTo(item) {
    if (!item || !phone.matches) return;
    var rail = item.parentNode;
    if (!rail || rail.scrollWidth <= rail.clientWidth + 1) return;
    var left = item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2;
    if (rail.scrollTo) rail.scrollTo({ left: left, behavior: reduceMotion.matches ? "auto" : "smooth" });
    else rail.scrollLeft = left;
  }

  function titleOf(win) {
    var node = win.querySelector("[data-window-title]") || win.querySelector(".mac-window__title");
    return node ? node.textContent.replace(/\s+/g, " ").trim() : win.getAttribute("data-window");
  }

  function appOf(win) {
    return win.getAttribute("data-app") || "Finder";
  }

  function byZ(a, b) {
    return Number(b.style.getPropertyValue("--window-z") || 0) - Number(a.style.getPropertyValue("--window-z") || 0);
  }

  function store(kind, key, value) {
    try {
      var area = kind === "session" ? window.sessionStorage : window.localStorage;
      if (value === undefined) return area.getItem(key);
      area.setItem(key, value);
      return value;
    } catch (error) {
      return null;
    }
  }

  /* Control Center: wallpaper and house shortcuts */

  function setWallpaper(name, persist) {
    var allowed = wallpaperChoices.some(function (button) {
      return button.getAttribute("data-wallpaper-choice") === name;
    });
    if (!allowed) name = "roofdeck";
    desktop.setAttribute("data-wallpaper", name);
    wallpaperChoices.forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-wallpaper-choice") === name ? "true" : "false");
    });
    if (persist) {
      store("local", "pkt-229-wallpaper", name);
      announce("Wallpaper changed to " + name.replace("-", " ") + ".");
    }
  }

  function setWallpaperBrightness(value, persist) {
    var amount = Math.min(108, Math.max(68, Number(value) || 100));
    desktop.style.setProperty("--wallpaper-brightness", String(amount / 100));
    if (wallpaperBrightness) wallpaperBrightness.value = String(amount);
    if (persist) store("local", "pkt-229-wallpaper-brightness", String(amount));
  }

  function closeControlCenter() {
    if (!controlCenter || controlCenter.hidden) return;
    controlCenter.hidden = true;
    if (controlCenterButton) controlCenterButton.setAttribute("aria-expanded", "false");
  }

  function toggleControlCenter() {
    if (!controlCenter) return;
    var opening = controlCenter.hidden;
    closeMenus();
    if (spotlight && !spotlight.hidden) closeSpotlight();
    controlCenter.hidden = !opening;
    if (controlCenterButton) controlCenterButton.setAttribute("aria-expanded", opening ? "true" : "false");
    if (opening) announce("Control Center open.");
  }

  setWallpaper(store("local", "pkt-229-wallpaper") || desktop.getAttribute("data-wallpaper") || "magnolia", false);
  setWallpaperBrightness(store("local", "pkt-229-wallpaper-brightness") || 100, false);

  wallpaperChoices.forEach(function (button) {
    button.addEventListener("click", function () {
      setWallpaper(button.getAttribute("data-wallpaper-choice"), true);
    });
  });

  if (wallpaperBrightness) {
    wallpaperBrightness.addEventListener("input", function () {
      setWallpaperBrightness(wallpaperBrightness.value, true);
    });
  }

  desktop.addEventListener("pointerdown", function (event) {
    if (!controlCenter || controlCenter.hidden) return;
    if (event.target.closest("[data-control-center], [data-action=control-center]")) return;
    closeControlCenter();
  });

  /* Boot: crest and progress bar on black, once per session */

  var bootTimer = null;

  function finishBoot(callback) {
    if (!boot || boot.hidden) {
      if (callback) callback();
      return;
    }
    window.clearTimeout(bootTimer);
    boot.classList.add("is-done");
    var delay = reduceMotion.matches ? 0 : 380;
    window.setTimeout(function () {
      boot.hidden = true;
      boot.classList.remove("is-done");
      if (callback) callback();
    }, delay);
  }

  function runBoot(force, callback) {
    if (!boot) {
      if (callback) callback();
      return;
    }
    var seen = store("session", "pkt-229-mac-booted") === "1";
    store("session", "pkt-229-mac-booted", "1");
    if (!force && (seen || reduceMotion.matches)) {
      boot.hidden = true;
      if (callback) callback();
      return;
    }
    boot.hidden = false;
    boot.classList.remove("is-done");
    void boot.offsetWidth;
    boot.classList.add("is-running");
    var total = phone.matches ? 700 : 1050;
    bootTimer = window.setTimeout(function () {
      boot.classList.remove("is-running");
      finishBoot(callback);
    }, total);
  }

  if (boot) {
    boot.addEventListener("click", function () { finishBoot(); });
  }

  /* Clock, Boston time */

  function bostonParts(now) {
    try {
      var parts = {};
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).formatToParts(now).forEach(function (part) {
        parts[part.type] = part.value;
      });
      return parts;
    } catch (error) {
      return null;
    }
  }

  function tickClock() {
    var now = new Date();
    var parts = bostonParts(now);
    var menuText, timeText;
    if (parts) {
      timeText = parts.hour + ":" + parts.minute + " " + parts.dayPeriod;
      menuText = parts.weekday + " " + parts.month + " " + parts.day + " " + timeText;
    } else {
      timeText = now.getHours() + ":" + ("0" + now.getMinutes()).slice(-2);
      menuText = timeText;
    }
    var dateText = parts ? (function () {
      try { return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(now); } catch (error) { return menuText; }
    })() : menuText;
    clocks.forEach(function (node) {
      var kind = node.getAttribute("data-clock");
      node.textContent = kind === "time" ? timeText : kind === "date" ? dateText : (phone.matches && node.classList.contains("menubar__clock") ? timeText : menuText);
      node.setAttribute("datetime", now.toISOString());
    });
    var widgetDay = desktop.querySelector("[data-widget-day]");
    var widgetDate = desktop.querySelector("[data-widget-date]");
    if (widgetDay && parts) widgetDay.textContent = parts.weekday.toUpperCase();
    if (widgetDate && parts) widgetDate.textContent = parts.day;
  }
  tickClock();
  window.setInterval(tickClock, 15000);

  /* Menu bar ink follows the wallpaper: dark glyphs over a light sky */

  var wallpaperNode = desktop.querySelector(".wallpaper");

  function sampleMenubarInk() {
    if (!wallpaperNode) return;
    var url = (getComputedStyle(wallpaperNode).backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1];
    if (!url) return;
    desktop.style.setProperty("--wallpaper-image", 'url("' + url + '")');
    var img = new Image();
    img.onload = function () {
      try {
        var canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 8;
        var ctx = canvas.getContext("2d");
        var bandHeight = Math.max(1, Math.round(img.naturalHeight * (32 / Math.max(1, wallpaperNode.clientHeight))));
        ctx.drawImage(img, 0, 0, img.naturalWidth, bandHeight, 0, 0, 64, 8);
        var data = ctx.getImageData(0, 0, 64, 8).data;
        var lum = 0;
        for (var i = 0; i < data.length; i += 4) lum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        lum /= data.length / 4;
        desktop.setAttribute("data-menubar-ink", lum > 118 ? "dark" : "light");
      } catch (error) {}
    };
    img.src = url;
  }

  sampleMenubarInk();
  new MutationObserver(sampleMenubarInk).observe(desktop, { attributes: true, attributeFilter: ["data-wallpaper"] });

  /* Windows */

  function findWindow(name) {
    return windows.filter(function (win) {
      return win.getAttribute("data-window") === name;
    })[0];
  }

  function isOpen(win) {
    return !win.hidden && !win.classList.contains("is-minimized");
  }

  function isRunning(win) {
    return !win.hidden || win.classList.contains("is-minimized");
  }

  function setMenubarApp(win) {
    var app = win ? appOf(win) : "Finder";
    var key = win ? (win.getAttribute("data-app-key") || app.toLowerCase()) : "finder";
    if (menubarApp) menubarApp.textContent = app;
    Array.prototype.forEach.call(desktop.querySelectorAll("[data-app-label]"), function (node) {
      node.textContent = node.getAttribute("data-app-label").replace("%s", app);
    });
    appMenuSets.forEach(function (set) {
      set.hidden = set.getAttribute("data-app-menus") !== key;
    });
  }

  function focusWindow(win) {
    if (!win || win.hidden) return;
    zCounter += 1;
    win.style.setProperty("--window-z", String(zCounter));
    windows.forEach(function (other) {
      other.classList.toggle("is-focused", other === win);
    });
    focused = win;
    setMenubarApp(win);
    syncDock();
  }

  function blurWindows() {
    windows.forEach(function (other) { other.classList.remove("is-focused"); });
    focused = null;
    setMenubarApp(null);
    syncDock();
  }

  function nextWindow(except) {
    return windows.filter(function (win) { return win !== except && isOpen(win); }).sort(byZ)[0];
  }

  function cascade(win) {
    if (!workspace || phone.matches) return;
    if (win.getAttribute("data-placed") === "1") return;
    win.setAttribute("data-placed", "1");
    var bounds = workspace.getBoundingClientRect();
    var rect = win.getBoundingClientRect();
    var index = openOrder.length;
    var x = Math.round(Math.max(24, (bounds.width - rect.width) / 2 + (index % 5) * 28 - 56));
    var y = Math.round(Math.max(16, (bounds.height - rect.height) / 2 + (index % 5) * 22 - 44));
    win.style.setProperty("--window-x", x + "px");
    win.style.setProperty("--window-y", y + "px");
    keepInBounds(win);
  }

  function openWindow(name, options) {
    var win = findWindow(name);
    if (!win) return;
    options = options || {};
    closeControlCenter();
    var wasMinimized = win.classList.contains("is-minimized");
    var wasHidden = win.hidden;
    win.hidden = false;
    win.classList.remove("is-minimized", "is-closing");
    if (openOrder.indexOf(win) === -1) openOrder.push(win);
    if (phone.matches) {
      windows.forEach(function (other) {
        if (other !== win && isOpen(other)) { other.hidden = true; other.classList.remove("is-focused"); }
      });
    }
    if (wasHidden && !wasMinimized) cascade(win);
    if (wasHidden || wasMinimized) {
      if (!reduceMotion.matches && !phone.matches) {
        win.classList.add(wasMinimized ? "is-restoring" : "is-opening");
        win.addEventListener("animationend", function handler() {
          win.classList.remove("is-opening", "is-restoring");
          win.removeEventListener("animationend", handler);
        });
      }
    }
    removeDockChip(win);
    focusWindow(win);
    if (options.focusContent !== false) {
      var target = win.querySelector("[data-terminal-input]") || win;
      target.focus({ preventScroll: true });
    }
    var thread = win.querySelector("[data-scroll-end]");
    if (thread) {
      var toEnd = function () { thread.scrollTop = thread.scrollHeight; };
      toEnd();
      Array.prototype.forEach.call(thread.querySelectorAll("img"), function (img) {
        if (!img.complete) img.addEventListener("load", toEnd, { once: true });
      });
      window.requestAnimationFrame(toEnd);
    }
    syncOpenState();
    announce(titleOf(win) + " window is open.");
  }

  function syncOpenState() {
    desktop.classList.toggle("has-window", windows.some(isOpen));
  }

  function closeWindow(win, restoreFocus) {
    if (!win || (win.hidden && !win.classList.contains("is-minimized"))) return;
    var wasMinimized = win.classList.contains("is-minimized");
    var finish = function () {
      win.hidden = true;
      win.classList.remove("is-minimized", "is-zoomed", "is-focused", "is-closing");
      removeDockChip(win);
      if (typeof syncUrlAfterClose === "function") syncUrlAfterClose(win);
      win.removeAttribute("data-placed");
      openOrder = openOrder.filter(function (other) { return other !== win; });
      var next = nextWindow(win);
      if (next) focusWindow(next);
      else blurWindows();
      syncOpenState();
      win.dispatchEvent(new CustomEvent("pkt:window-close"));
      announce(titleOf(win) + " window closed.");
      if (restoreFocus) {
        var target = next || (dock && dock.querySelector('[data-open-window="' + win.getAttribute("data-window") + '"]'));
        if (target) target.focus({ preventScroll: true });
      }
    };
    if (reduceMotion.matches || phone.matches || wasMinimized) finish();
    else {
      win.classList.add("is-closing");
      window.setTimeout(finish, 140);
    }
  }

  function docChipIcon(win) {
    var icon = win.getAttribute("data-icon") || "text";
    return "/static/img/mac/icons/" + icon + ".png";
  }

  function ensureDockChip(win) {
    if (!dock || !win || !win.hasAttribute("data-doc-window")) return null;
    var key = win.getAttribute("data-window");
    var glass = dock.querySelector(".dock__glass");
    if (!glass) return null;
    var existing = glass.querySelector('[data-open-window="' + key + '"]');
    if (existing) return existing;
    var label = titleOf(win);
    var button = document.createElement("button");
    button.type = "button";
    button.className = "dock__doc";
    button.setAttribute("data-open-window", key);
    button.setAttribute("data-doc-chip", "");
    button.setAttribute("data-label", label);
    button.title = label;
    var img = document.createElement("img");
    img.className = "icon";
    img.src = docChipIcon(win);
    img.alt = "";
    img.width = 256;
    img.height = 256;
    img.decoding = "async";
    var span = document.createElement("span");
    span.textContent = label;
    button.appendChild(img);
    button.appendChild(span);
    var separator = glass.querySelector(".dock__separator");
    if (separator) glass.insertBefore(button, separator);
    else glass.appendChild(button);
    return button;
  }

  function removeDockChip(win) {
    if (!dock || !win) return;
    var chip = dock.querySelector('[data-doc-chip][data-open-window="' + win.getAttribute("data-window") + '"]');
    if (chip) chip.remove();
  }

  function minimizeWindow(win) {
    if (!win || win.hidden) return;
    ensureDockChip(win);
    var finish = function () {
      win.classList.add("is-minimized");
      win.classList.remove("is-focused", "is-minimizing");
      win.hidden = true;
      var next = nextWindow(win);
      if (next) focusWindow(next);
      else blurWindows();
      syncOpenState();
      announce(titleOf(win) + " minimized to the Dock.");
      var dockButton = dock && dock.querySelector('[data-open-window="' + win.getAttribute("data-window") + '"]');
      if (dockButton) dockButton.focus({ preventScroll: true });
    };
    if (reduceMotion.matches || phone.matches) finish();
    else {
      var dockButton = dock && dock.querySelector('[data-open-window="' + win.getAttribute("data-window") + '"]');
      if (dockButton) {
        var from = win.getBoundingClientRect();
        var to = dockButton.getBoundingClientRect();
        win.style.setProperty("--dock-dx", Math.round(to.left + to.width / 2 - (from.left + from.width / 2)) + "px");
        win.style.setProperty("--dock-dy", Math.round(to.top + to.height / 2 - (from.top + from.height / 2)) + "px");
      }
      win.classList.add("is-minimizing");
      window.setTimeout(finish, 320);
    }
  }

  function toggleZoom(win) {
    if (!win || phone.matches) return;
    var zoomed = win.classList.toggle("is-zoomed");
    focusWindow(win);
    announce(titleOf(win) + (zoomed ? " zoomed." : " restored."));
  }

  function keepInBounds(win) {
    if (!workspace || phone.matches || win.classList.contains("is-zoomed")) return;
    var bounds = workspace.getBoundingClientRect();
    var rect = win.getBoundingClientRect();
    var x = rect.left - bounds.left;
    var y = rect.top - bounds.top;
    var maxX = Math.max(0, bounds.width - rect.width);
    var maxY = Math.max(0, bounds.height - rect.height);
    x = Math.min(Math.max(0, x), maxX);
    y = Math.min(Math.max(0, y), maxY);
    win.style.setProperty("--window-x", Math.round(x) + "px");
    win.style.setProperty("--window-y", Math.round(y) + "px");
  }

  /* Dock */

  function syncDock() {
    if (!dock) return;
    windows.forEach(function (win) {
      var name = win.getAttribute("data-window");
      var button = dock.querySelector('[data-open-window="' + name + '"]');
      if (!button) return;
      var running = isRunning(win);
      button.classList.toggle("is-running", running);
      button.classList.toggle("is-active", win === focused && !win.hidden);
      button.setAttribute("aria-label", (running ? "Show " : "Open ") + (button.getAttribute("data-label") || titleOf(win)));
    });
  }

  /* Menus (menu bar, Apple menu, context menus share one mechanism) */

  var openMenu = null;

  function closeMenus() {
    if (!openMenu) return;
    openMenu.classList.remove("is-open");
    var trigger = openMenu.querySelector("[aria-haspopup]");
    var popup = openMenu.querySelector("[role=menu]");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (popup) popup.hidden = true;
    openMenu = null;
  }

  function showMenu(menu) {
    if (openMenu === menu) return;
    closeControlCenter();
    closeMenus();
    var trigger = menu.querySelector("[aria-haspopup]");
    var popup = menu.querySelector("[role=menu]");
    if (!popup) return;
    popup.hidden = false;
    menu.classList.add("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    openMenu = menu;
  }

  desktop.addEventListener("pointerdown", function (event) {
    var menu = event.target.closest(".menu");
    var trigger = event.target.closest(".menu > [aria-haspopup]");
    if (trigger) {
      event.preventDefault();
      if (openMenu === menu) closeMenus();
      else showMenu(menu);
      return;
    }
    if (menu && openMenu === menu) return;
    closeMenus();
  });

  desktop.addEventListener("pointerover", function (event) {
    if (!openMenu) return;
    var trigger = event.target.closest(".menu > [aria-haspopup]");
    if (trigger && trigger.parentNode !== openMenu) showMenu(trigger.parentNode);
  });

  desktop.addEventListener("click", function (event) {
    var trigger = event.target.closest(".menu > [aria-haspopup]");
    if (trigger && event.detail === 0) {
      var menu = trigger.parentNode;
      if (openMenu === menu) closeMenus();
      else showMenu(menu);
      var first = menu.querySelector("[role=menu] [role^=menuitem]");
      if (first && openMenu === menu) first.focus({ preventScroll: true });
      return;
    }
    var item = event.target.closest("[role=menu] [role^=menuitem]");
    if (!item) return;
    var action = item.getAttribute("data-menu-action");
    var win = item.closest(".mac-window") || focused;
    if (action) {
      event.preventDefault();
      runAction(action, item, win);
    }
    closeMenus();
  });

  /* Actions shared by menus, buttons and the terminal */

  function runAction(action, source, win) {
    var target = win || focused;
    switch (action) {
      case "close":
        if (target) closeWindow(target, true);
        break;
      case "minimize":
        if (target) minimizeWindow(target);
        break;
      case "zoom":
        if (target) toggleZoom(target);
        break;
      case "close-all":
        windows.filter(isRunning).forEach(function (w) { closeWindow(w); });
        break;
      case "about":
        showAbout();
        break;
      case "spotlight":
        openSpotlight();
        break;
      case "control-center":
        toggleControlCenter();
        break;
      case "restart":
        restart();
        break;
      case "shutdown":
        showShutdown();
        break;
      case "lock":
        showLock();
        break;
      case "toggle-sidebar":
        if (target) {
          var hidden = target.classList.toggle("is-sidebar-hidden");
          if (source) source.setAttribute("aria-checked", hidden ? "false" : "true");
        }
        break;
      case "toggle-pathbar":
        if (target) {
          var pathHidden = target.classList.toggle("is-pathbar-hidden");
          if (source) source.setAttribute("aria-checked", pathHidden ? "false" : "true");
        }
        break;
      case "toggle-statusbar":
        if (target) {
          var statusHidden = target.classList.toggle("is-statusbar-hidden");
          if (source) source.setAttribute("aria-checked", statusHidden ? "false" : "true");
        }
        break;
      case "view":
        if (target) {
          var mode = source.getAttribute("data-view-mode");
          var content = target.querySelector("[data-view]");
          if (content) content.setAttribute("data-view", mode);
          Array.prototype.forEach.call(target.querySelectorAll("[data-view-mode]"), function (button) {
            var on = button.getAttribute("data-view-mode") === mode;
            if (button.getAttribute("role") === "menuitemradio") button.setAttribute("aria-checked", on ? "true" : "false");
            else button.setAttribute("aria-pressed", on ? "true" : "false");
          });
        }
        break;
      case "floor":
        selectFloor(source.getAttribute("data-floor-target"));
        break;
      case "open-window":
        openWindow(source.getAttribute("data-open-window-target"), { focusContent: false });
        break;
      case "notification":
        showNotification();
        break;
      case "empty-trash":
        showDialog({
          icon: "trash",
          heading: "Are you sure you want to permanently erase the item in the Trash?",
          text: "You can’t undo this action.",
          buttons: [
            { label: "Cancel", cancel: true, primary: true },
            { label: "Empty Trash", onClick: function () { window.setTimeout(function () { showDialog({ icon: "warning", heading: "The item could not be erased.", text: "Broccoli Forest Green is still in use by the Sunrise.", buttons: [{ label: "OK", primary: true }] }); }, 260); } },
          ],
        });
        break;
      case "canyon":
        showCanyon();
        break;
      default:
        break;
    }
  }

  desktop.addEventListener("click", function (event) {
    var actor = event.target.closest("[data-action]");
    if (!actor || actor.closest("[role=menu]")) return;
    event.preventDefault();
    runAction(actor.getAttribute("data-action"), actor, actor.closest(".mac-window"));
  });

  /* Delegated clicks: open, traffic lights */

  desktop.addEventListener("click", function (event) {
    var opener = event.target.closest("[data-open-window]");
    if (opener && !opener.closest("[role=menu]")) {
      var name = opener.getAttribute("data-open-window");
      var win = findWindow(name);
      if (win && opener.closest("[data-dock]") && isOpen(win) && win === focused && !phone.matches) {
        // Dock click on the frontmost window: nothing to do, keep it front
        focusWindow(win);
      } else {
        openWindow(name, { focusContent: !opener.closest("[data-dock]") });
      }
      closeMenus();
      return;
    }
    var win2 = event.target.closest(".mac-window");
    if (!win2) return;
    if (event.target.closest("[data-window-close]")) closeWindow(win2, true);
    else if (event.target.closest("[data-window-minimize]")) minimizeWindow(win2);
    else if (event.target.closest("[data-window-zoom]")) toggleZoom(win2);
  });

  desktop.addEventListener("pointerdown", function (event) {
    var win = event.target.closest(".mac-window");
    if (win && win !== focused) focusWindow(win);
    if (!win && workspace && workspace.contains(event.target) && !event.target.closest(".mac-window, .desktop-widget, .desktop-file")) {
      blurWindows();
    }
  });

  desktop.addEventListener("dblclick", function (event) {
    var handle = event.target.closest("[data-window-handle]");
    if (!handle || event.target.closest("button, a, input") || phone.matches) return;
    toggleZoom(handle.closest(".mac-window"));
  });

  /* Dragging: macOS moves the live window */

  var drag = null;

  desktop.addEventListener("pointerdown", function (event) {
    var handle = event.target.closest("[data-window-handle]");
    if (!handle || event.button !== 0 || event.target.closest("button, a, input, select, textarea")) return;
    var win = handle.closest(".mac-window");
    if (!win || phone.matches || win.classList.contains("is-zoomed")) return;
    var bounds = workspace.getBoundingClientRect();
    var rect = win.getBoundingClientRect();
    drag = {
      win: win,
      handle: handle,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left - bounds.left,
      originY: rect.top - bounds.top,
      bounds: bounds,
      width: rect.width,
      height: rect.height,
      moved: false,
    };
    handle.setPointerCapture(event.pointerId);
  });

  desktop.addEventListener("pointermove", function (event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    var dx = event.clientX - drag.startX;
    var dy = event.clientY - drag.startY;
    if (!drag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.win.classList.add("is-dragging");
      desktop.classList.add("is-dragging-window");
    }
    var x = drag.originX + dx;
    var y = drag.originY + dy;
    var maxX = drag.bounds.width - 40;
    var maxY = drag.bounds.height - 40;
    x = Math.min(Math.max(40 - drag.width, x), maxX);
    y = Math.min(Math.max(0, y), maxY);
    drag.win.style.setProperty("--window-x", Math.round(x) + "px");
    drag.win.style.setProperty("--window-y", Math.round(y) + "px");
    event.preventDefault();
  });

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.win.classList.remove("is-dragging");
    desktop.classList.remove("is-dragging-window");
    drag = null;
  }

  desktop.addEventListener("pointerup", endDrag);
  desktop.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", function () {
    windows.filter(isOpen).forEach(keepInBounds);
  });

  /* Finder: floors */

  var floorButtons = Array.prototype.slice.call(desktop.querySelectorAll("[data-floor]"));
  var floorPanels = Array.prototype.slice.call(desktop.querySelectorAll("[data-floor-panel]"));
  var canyonShown = false;

  function selectFloor(floor) {
    if (!floor) return;
    var finder = findWindow("finder");
    floorButtons.forEach(function (button) {
      var active = button.getAttribute("data-floor") === floor;
      button.classList.toggle("is-active", active);
      if (button.getAttribute("role") === "tab") button.setAttribute("aria-selected", active ? "true" : "false");
      else button.setAttribute("aria-current", active ? "true" : "false");
    });
    var panel = null;
    floorPanels.forEach(function (candidate) {
      var active = candidate.getAttribute("data-floor-panel") === floor;
      candidate.hidden = !active;
      if (active) panel = candidate;
    });
    if (!finder || !panel) return;
    var title = finder.querySelector("[data-window-title]");
    var path = finder.querySelector("[data-pathbar]");
    var count = finder.querySelector("[data-status-count]");
    if (title) title.textContent = panel.getAttribute("data-title") || floor;
    if (path) {
      path.innerHTML = "";
      (panel.getAttribute("data-path") || "229").split("/").forEach(function (crumb, index) {
        if (index) {
          var sep = document.createElement("i");
          sep.setAttribute("aria-hidden", "true");
          path.appendChild(sep);
        }
        var span = document.createElement("span");
        span.textContent = crumb;
        path.appendChild(span);
      });
    }
    if (count) count.textContent = panel.getAttribute("data-status") || "";
    if (floor === "fourth" && !canyonShown && store("session", "pkt-229-canyon") !== "1") {
      canyonShown = true;
      store("session", "pkt-229-canyon", "1");
      window.setTimeout(showCanyon, 500);
    }
  }

  desktop.addEventListener("click", function (event) {
    var button = event.target.closest("[data-floor]");
    if (!button || button.closest("[role=menu]")) return;
    selectFloor(button.getAttribute("data-floor"));
    railTo(button);
  });

  /* Photos: filterable library and full-photo viewer */

  var gallery = desktop.querySelector("[data-gallery]");
  var galleryWindow = findWindow("photos");
  var galleryGrid = gallery && gallery.querySelector("[data-gallery-grid]");
  var galleryViewer = gallery && gallery.querySelector("[data-gallery-viewer]");
  var galleryViewerImage = gallery && gallery.querySelector("[data-gallery-viewer-image]");
  var galleryCaption = gallery && gallery.querySelector("[data-gallery-caption]");
  var galleryPosition = gallery && gallery.querySelector("[data-gallery-position]");
  var galleryHeading = gallery && gallery.querySelector("[data-gallery-heading]");
  var galleryCount = gallery && gallery.querySelector("[data-gallery-count]");
  var galleryBack = galleryWindow && galleryWindow.querySelector("[data-gallery-close]");
  var galleryOpen = galleryWindow && galleryWindow.querySelector("[data-gallery-open]");
  var galleryPhotos = gallery ? Array.prototype.slice.call(gallery.querySelectorAll("[data-gallery-photo]")) : [];
  var galleryFilters = gallery ? Array.prototype.slice.call(gallery.querySelectorAll("[data-gallery-filter]")) : [];
  var currentGalleryPhoto = null;
  var galleryTitles = {
    all: "All Photos",
    home: "Home at 229",
    everyday: "Everyday Brotherhood",
    active: "Make, Compete, Serve",
    away: "Away from 229",
    formal: "Dress Up / Go Out",
  };

  function visibleGalleryPhotos() {
    return galleryPhotos.filter(function (photo) { return !photo.hidden; });
  }

  function closeGalleryViewer(restoreFocus) {
    if (!galleryViewer || galleryViewer.hidden) return;
    galleryViewer.hidden = true;
    gallery.classList.remove("is-viewing");
    if (galleryBack) galleryBack.hidden = true;
    if (galleryOpen) galleryOpen.hidden = true;
    if (restoreFocus && currentGalleryPhoto) currentGalleryPhoto.focus({ preventScroll: true });
    currentGalleryPhoto = null;
    announce("Back to the photo library.");
  }

  function showGalleryPhoto(photo) {
    if (!gallery || !galleryViewer || !photo || photo.hidden) return;
    currentGalleryPhoto = photo;
    var image = photo.querySelector("img");
    var visible = visibleGalleryPhotos();
    var index = visible.indexOf(photo);
    galleryViewerImage.src = photo.getAttribute("data-src");
    galleryViewerImage.alt = image ? image.alt : "";
    galleryCaption.textContent = photo.getAttribute("data-caption") || "Chapter photo";
    galleryPosition.textContent = String(index + 1) + " of " + String(visible.length);
    gallery.classList.add("is-viewing");
    galleryViewer.hidden = false;
    if (galleryBack) galleryBack.hidden = false;
    if (galleryOpen) {
      galleryOpen.href = photo.getAttribute("data-src");
      galleryOpen.hidden = false;
    }
    galleryViewer.focus({ preventScroll: true });
    announce(galleryCaption.textContent + ", photo " + String(index + 1) + " of " + String(visible.length) + ".");
  }

  function stepGallery(direction) {
    var visible = visibleGalleryPhotos();
    if (!visible.length) return;
    var index = Math.max(0, visible.indexOf(currentGalleryPhoto));
    showGalleryPhoto(visible[(index + direction + visible.length) % visible.length]);
  }

  function setGalleryFilter(filter) {
    if (!galleryTitles[filter]) filter = "all";
    closeGalleryViewer(false);
    galleryPhotos.forEach(function (photo) {
      photo.hidden = filter !== "all" && photo.getAttribute("data-gallery-category") !== filter;
    });
    galleryFilters.forEach(function (button) {
      var active = button.getAttribute("data-gallery-filter") === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
      if (active) railTo(button);
    });
    var visible = visibleGalleryPhotos();
    galleryHeading.textContent = galleryTitles[filter];
    galleryCount.textContent = String(visible.length) + (visible.length === 1 ? " photo" : " photos");
    if (galleryGrid) galleryGrid.scrollTop = 0;
    announce(galleryTitles[filter] + ", " + galleryCount.textContent + ".");
  }

  if (gallery) {
    gallery.addEventListener("click", function (event) {
      var filter = event.target.closest("[data-gallery-filter]");
      if (filter) {
        setGalleryFilter(filter.getAttribute("data-gallery-filter"));
        return;
      }
      var photo = event.target.closest("[data-gallery-photo]");
      if (photo) showGalleryPhoto(photo);
    });
    var galleryPrev = gallery.querySelector("[data-gallery-previous]");
    var galleryNext = gallery.querySelector("[data-gallery-next]");
    if (galleryPrev) galleryPrev.addEventListener("click", function () { stepGallery(-1); });
    if (galleryNext) galleryNext.addEventListener("click", function () { stepGallery(1); });
  }

  if (galleryBack) galleryBack.addEventListener("click", function () { closeGalleryViewer(true); });

  /* Touch: the gestures a phone already expects — swipe a photo along,
     swipe in from the edge to go back. */

  if ("ontouchstart" in window) {
    var touchStart = null;

    desktop.addEventListener("touchstart", function (event) {
      if (event.touches.length !== 1) { touchStart = null; return; }
      var touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY, at: Date.now(), from: event.target };
    }, { passive: true });

    desktop.addEventListener("touchend", function (event) {
      var start = touchStart;
      touchStart = null;
      if (!start || !phone.matches || !event.changedTouches.length) return;
      var touch = event.changedTouches[0];
      var dx = touch.clientX - start.x;
      var dy = touch.clientY - start.y;
      if (Date.now() - start.at > 600) return;
      var swipedSideways = Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.8;
      var swipedDown = dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.8;

      if (gallery && gallery.classList.contains("is-viewing") && start.from.closest && start.from.closest(".gallery__viewer")) {
        if (swipedSideways) { stepGallery(dx < 0 ? 1 : -1); return; }
        if (swipedDown) { closeGalleryViewer(true); return; }
      }

      var win = focused;

      /* Nothing open: a pull down the home screen is Spotlight, as on iOS */
      if (!win && swipedDown && start.y < window.innerHeight * 0.6 && !start.from.closest("[data-dock]")) {
        openSpotlight();
        return;
      }

      if (!swipedSideways || dx < 0 || start.x > 28 || !win) return;
      var back = win.querySelector("[data-contacts-back]");
      if (back && win.classList.contains("is-detail")) { back.click(); return; }
      if (gallery && gallery.classList.contains("is-viewing")) { closeGalleryViewer(true); return; }
      closeWindow(win, false);
    }, { passive: true });
  }

  /* Dialogs (alerts and sheets) */

  var dialogResolve = null;

  function showDialog(spec) {
    if (!dialog) return;
    var titleNode = dialog.querySelector("[data-dialog-title]");
    var iconNode = dialog.querySelector("[data-dialog-icon]");
    var headingNode = dialog.querySelector("[data-dialog-heading]");
    var textNode = dialog.querySelector("[data-dialog-text]");
    var bodyNode = dialog.querySelector("[data-dialog-body]");
    var buttonsNode = dialog.querySelector("[data-dialog-buttons]");
    titleNode.textContent = spec.title || "";
    titleNode.hidden = !spec.title;
    iconNode.className = "mac-alert__icon" + (spec.icon ? " mac-alert__icon--" + spec.icon : "");
    iconNode.hidden = !spec.icon;
    headingNode.textContent = spec.heading || "";
    headingNode.hidden = !spec.heading;
    textNode.textContent = spec.text || "";
    textNode.hidden = !spec.text;
    bodyNode.innerHTML = "";
    bodyNode.hidden = true;
    if (spec.body) {
      bodyNode.appendChild(spec.body);
      bodyNode.hidden = false;
    }
    dialog.classList.toggle("is-wide", !!spec.wide);
    buttonsNode.innerHTML = "";
    buttonsNode.classList.toggle("is-stacked", (spec.buttons || []).length > 2);
    (spec.buttons || [{ label: "OK", primary: true }]).forEach(function (button) {
      var node = document.createElement("button");
      node.type = "button";
      node.textContent = button.label;
      node.className = "mac-button" + (button.primary ? " mac-button--primary" : "");
      if (button.cancel) node.setAttribute("data-dialog-cancel", "");
      node.addEventListener("click", function () {
        dialog.close(button.label);
        if (button.onClick) button.onClick();
      });
      buttonsNode.appendChild(node);
    });
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    var primary = buttonsNode.querySelector(".mac-button--primary") || buttonsNode.querySelector("button");
    if (primary) primary.focus({ preventScroll: true });
  }

  if (dialog) {
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      dialog.close("cancel");
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close("cancel");
    });
  }

  function showAbout() {
    var body = document.createElement("dl");
    body.className = "mac-about";
    [
      ["Chip", "Brotherhood"],
      ["Memory", "108 years"],
      ["Startup disk", "229 Commonwealth Avenue"],
      ["Serial number", "229COMM1943"],
      ["Chartered", "January 1, 1919"],
    ].forEach(function (row) {
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = row[0];
      dd.textContent = row[1];
      body.appendChild(dt);
      body.appendChild(dd);
    });
    showDialog({
      icon: "crest",
      heading: "229",
      text: "Phi Kappa Theta, Massachusetts Eta",
      body: body,
      buttons: [{ label: "More Info…", onClick: function () { window.location.href = desktop.getAttribute("data-about-url") || "/about/"; } }, { label: "OK", primary: true }],
    });
  }

  function showCanyon() {
    showDialog({
      icon: "warning",
      heading: "The file “canyon_mural.jpg” could not be opened.",
      text: "One alumnus remembers a Grand Canyon mural under the paint. Another does not. Brothers chipped through the wall and found nothing. The room is still called the Canyon.",
      buttons: [{ label: "OK", primary: true }],
    });
  }

  /* Notification banner */

  var notificationTimer = null;

  function showNotification() {
    if (!notification) return;
    notification.hidden = false;
    notification.classList.remove("is-leaving");
    void notification.offsetWidth;
    notification.classList.add("is-showing");
    window.clearTimeout(notificationTimer);
    notificationTimer = window.setTimeout(hideNotification, 9000);
  }

  function hideNotification() {
    if (!notification || notification.hidden) return;
    window.clearTimeout(notificationTimer);
    notification.classList.remove("is-showing");
    notification.classList.add("is-leaving");
    window.setTimeout(function () {
      notification.hidden = true;
      notification.classList.remove("is-leaving");
    }, reduceMotion.matches ? 0 : 260);
  }

  if (notification) {
    notification.addEventListener("click", function (event) {
      if (event.target.closest("[data-notification-close]")) {
        hideNotification();
        return;
      }
      var target = notification.getAttribute("data-open-window-target");
      if (target) openWindow(target, { focusContent: false });
      hideNotification();
    });
  }

  /* Spotlight */

  var spotlightInput = spotlight && spotlight.querySelector("[data-spotlight-input]");
  var spotlightList = spotlight && spotlight.querySelector("[data-spotlight-results]");
  var spotlightIndex = [];
  var spotlightSelected = 0;

  function buildSpotlightIndex() {
    spotlightIndex = [];
    windows.forEach(function (win) {
      spotlightIndex.push({ kind: "Application", label: win.getAttribute("data-spotlight-label") || appOf(win), sub: titleOf(win), icon: win.getAttribute("data-icon") || "", keys: (titleOf(win) + " " + appOf(win) + " " + (win.getAttribute("data-keywords") || "")).toLowerCase(), open: win.getAttribute("data-window") });
    });
    Array.prototype.forEach.call(desktop.querySelectorAll("[data-floor-panel]"), function (panel) {
      spotlightIndex.push({ kind: "Folder", label: panel.getAttribute("data-title"), sub: "229", keys: (panel.getAttribute("data-title") + " " + (panel.getAttribute("data-keywords") || "")).toLowerCase(), open: "finder", floor: panel.getAttribute("data-floor-panel") });
    });
    Array.prototype.forEach.call(desktop.querySelectorAll("[data-spotlight-link]"), function (link) {
      spotlightIndex.push({ kind: link.getAttribute("data-spotlight-kind") || "Website", label: link.getAttribute("data-spotlight-link"), sub: link.getAttribute("href"), keys: (link.getAttribute("data-spotlight-link") + " " + (link.getAttribute("data-keywords") || "")).toLowerCase(), href: link.getAttribute("href") });
    });
  }

  function renderSpotlight() {
    if (!spotlightList) return;
    var query = spotlightInput.value.trim().toLowerCase();
    spotlightList.innerHTML = "";
    if (!query) {
      spotlight.classList.remove("has-results");
      return;
    }
    var hits = spotlightIndex.filter(function (item) { return item.keys.indexOf(query) !== -1; }).slice(0, 7);
    spotlight.classList.toggle("has-results", hits.length > 0);
    spotlightInput.setAttribute("aria-expanded", hits.length ? "true" : "false");
    spotlightSelected = 0;
    hits.forEach(function (item, index) {
      var row = document.createElement("button");
      row.type = "button";
      row.className = "spotlight__row" + (index === 0 ? " is-selected" : "");
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", index === 0 ? "true" : "false");
      row.id = "spotlight-opt-" + index;
      row.innerHTML = '<span class="spotlight__icon" aria-hidden="true"></span><span class="spotlight__label"></span><span class="spotlight__kind"></span>';
      var art = item.icon || (item.kind === "Folder" ? "folder" : "safari");
      row.querySelector(".spotlight__icon").style.backgroundImage = 'url("/static/img/mac/icons/' + art + '.png")';
      row.querySelector(".spotlight__label").textContent = item.label;
      row.querySelector(".spotlight__kind").textContent = item.kind;
      row.addEventListener("click", function () { activateSpotlight(item); });
      spotlightList.appendChild(row);
    });
    if (hits.length) spotlightInput.setAttribute("aria-activedescendant", "spotlight-opt-0");
    else spotlightInput.removeAttribute("aria-activedescendant");
    if (!hits.length) {
      var empty = document.createElement("p");
      empty.className = "spotlight__empty";
      empty.textContent = "No results";
      spotlightList.appendChild(empty);
    }
  }

  function activateSpotlight(item) {
    closeSpotlight();
    if (item.href) {
      var routed = null;
      try {
        var parsed = new URL(item.href, window.location.href);
        if (parsed.origin === window.location.origin && !/^\/static\//.test(parsed.pathname)) routed = parsed.pathname;
      } catch (error) {}
      if (routed && typeof openUrl === "function") openUrl(routed);
      else window.location.href = item.href;
      return;
    }
    if (item.open) openWindow(item.open, { focusContent: false });
    if (item.floor) selectFloor(item.floor);
  }

  function openSpotlight() {
    if (!spotlight) return;
    closeMenus();
    closeControlCenter();
    buildSpotlightIndex();
    spotlight.hidden = false;
    spotlightInput.value = "";
    renderSpotlight();
    spotlightInput.focus({ preventScroll: true });
  }

  function closeSpotlight() {
    if (!spotlight || spotlight.hidden) return;
    spotlight.hidden = true;
    if (focused) focused.focus({ preventScroll: true });
  }

  if (spotlight) {
    spotlightInput.addEventListener("input", renderSpotlight);
    spotlightInput.addEventListener("keydown", function (event) {
      var rows = spotlightList.querySelectorAll(".spotlight__row");
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (!rows.length) return;
        event.preventDefault();
        spotlightSelected = (spotlightSelected + (event.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length;
        Array.prototype.forEach.call(rows, function (row, index) {
          row.classList.toggle("is-selected", index === spotlightSelected);
          row.setAttribute("aria-selected", index === spotlightSelected ? "true" : "false");
        });
        spotlightInput.setAttribute("aria-activedescendant", rows[spotlightSelected].id);
      } else if (event.key === "Enter") {
        event.preventDefault();
        var row = rows[spotlightSelected];
        if (row) row.click();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeSpotlight();
      }
    });
    spotlight.addEventListener("pointerdown", function (event) {
      if (event.target === spotlight) closeSpotlight();
    });
  }

  /* Lock screen, restart, shut down */

  function showLock() {
    if (!lock) return;
    closeMenus();
    lock.hidden = false;
    lock.focus({ preventScroll: true });
  }

  if (lock) {
    lock.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Escape") return;
      event.preventDefault();
      lock.hidden = true;
      announce("229 unlocked.");
    });
    lock.addEventListener("click", function (event) {
      if (event.target.closest("[data-unlock]") || event.target === lock) {
        lock.hidden = true;
        announce("229 unlocked.");
      }
    });
  }

  function resetDesktop() {
    windows.forEach(function (win) {
      win.hidden = true;
      win.classList.remove("is-minimized", "is-zoomed", "is-focused", "is-sidebar-hidden", "is-pathbar-hidden", "is-statusbar-hidden");
      win.removeAttribute("data-placed");
      if (win.getAttribute("data-initial-style") !== null) win.setAttribute("style", win.getAttribute("data-initial-style"));
    });
    openOrder = [];
    zCounter = 10;
    focused = null;
    notified = false;
    canyonShown = false;
    store("session", "pkt-229-notified", "0");
    store("session", "pkt-229-canyon", "0");
    setMenubarApp(null);
    syncDock();
    syncOpenState();
    var terminalOutput = desktop.querySelector("[data-terminal-output]");
    if (terminalOutput && terminalOutput.getAttribute("data-initial") !== null) terminalOutput.innerHTML = terminalOutput.getAttribute("data-initial");
    selectFloor(desktop.querySelector("[data-floor-panel]") ? desktop.querySelector("[data-floor-panel]").getAttribute("data-floor-panel") : null);
  }

  function restart() {
    closeMenus();
    resetDesktop();
    runBoot(true, function () {
      startSession();
      announce("229 restarted.");
    });
  }

  function showShutdown() {
    if (!shutdown) return;
    closeMenus();
    resetDesktop();
    shutdown.hidden = false;
    shutdown.focus({ preventScroll: true });
  }

  if (shutdown) {
    shutdown.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      shutdown.click();
    });
    shutdown.addEventListener("click", function () {
      shutdown.hidden = true;
      runBoot(true, function () {
        startSession();
      });
    });
  }

  /* Calendar: rush days and events */

  var calWin = desktop.querySelector('[data-window="rush"]');
  if (calWin) {
    var calTabs = Array.prototype.slice.call(calWin.querySelectorAll("[data-cal-tab]"));
    var calPanels = Array.prototype.slice.call(calWin.querySelectorAll("[data-cal-panel]"));
    var calTitle = calWin.querySelector("[data-cal-title]");
    var calSub = calWin.querySelector("[data-cal-sub]");
    var calScroll = calWin.querySelector(".cal__scroll");
    var calPrev = calWin.querySelector("[data-cal-prev]");
    var calNext = calWin.querySelector("[data-cal-next]");
    var calIndex = 0;

    var calSummary = function (panel) {
      var events = panel.querySelectorAll(".cal-event");
      var first = panel.querySelector(".cal-event__time b");
      var last = events.length ? events[events.length - 1].querySelector(".cal-event__time small") : null;
      var away = panel.querySelectorAll(".cal-event--away").length;
      var parts = [events.length + (events.length === 1 ? " event" : " events")];
      if (first && last) parts.push(first.textContent.trim() + " to " + last.textContent.trim());
      parts.push(away ? away + " off campus, the rest at 229" : "all at 229 Commonwealth Ave");
      return parts.join(" · ");
    };

    var showCalDay = function (index, focus) {
      if (index < 0 || index >= calTabs.length) return;
      calIndex = index;
      calTabs.forEach(function (tab, i) {
        var on = i === index;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
      });
      calPanels.forEach(function (panel, i) {
        panel.hidden = i !== index;
      });
      var tab = calTabs[index];
      var panel = calPanels[index];
      if (calTitle) calTitle.textContent = tab.getAttribute("data-cal-full") || tab.textContent.trim();
      if (calSub && panel) calSub.textContent = calSummary(panel);
      if (calPrev) calPrev.disabled = index === 0;
      if (calNext) calNext.disabled = index === calTabs.length - 1;
      if (calScroll) calScroll.scrollTop = 0;
      if (focus) tab.focus();
    };

    calTabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        showCalDay(i);
      });
      tab.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          event.preventDefault();
          showCalDay(Math.min(calTabs.length - 1, i + 1), true);
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          event.preventDefault();
          showCalDay(Math.max(0, i - 1), true);
        }
      });
    });

    if (calPrev) calPrev.addEventListener("click", function () { showCalDay(calIndex - 1); });
    if (calNext) calNext.addEventListener("click", function () { showCalDay(calIndex + 1); });

    calWin.addEventListener("click", function (event) {
      var row = event.target.closest ? event.target.closest("[data-cal-event]") : null;
      if (!row || !calWin.contains(row)) return;
      var detail = row.parentNode.querySelector(".cal-event__detail");
      if (!detail) return;
      var open = row.getAttribute("aria-expanded") === "true";
      row.setAttribute("aria-expanded", open ? "false" : "true");
      detail.hidden = open;
    });

    showCalDay(0);
  }

  /* Contacts: groups, list, card */

  var contactsWin = desktop.querySelector('[data-window="contacts"]');
  if (contactsWin) {
    var groupButtons = Array.prototype.slice.call(contactsWin.querySelectorAll("[data-group]:not([data-contact])"));
    var contactRows = Array.prototype.slice.call(contactsWin.querySelectorAll("[data-contact]"));
    var cardInitials = contactsWin.querySelector("[data-card-initials]");
    var cardName = contactsWin.querySelector("[data-card-name]");
    var cardSub = contactsWin.querySelector("[data-card-sub]");
    var cardFields = contactsWin.querySelector("[data-card-fields]");
    var cardLink = contactsWin.querySelector("[data-card-link]");
    var contactsStatus = contactsWin.querySelector("[data-contacts-status]");

    var showContact = function (row) {
      contactRows.forEach(function (other) {
        other.classList.toggle("is-active", other === row);
        other.setAttribute("aria-selected", other === row ? "true" : "false");
      });
      if (!row) return;
      cardInitials.textContent = row.getAttribute("data-initials") || "";
      cardName.textContent = row.getAttribute("data-name");
      cardSub.textContent = "Class of " + row.getAttribute("data-year");
      cardFields.innerHTML = "";
      [["Major", "data-major"], ["Hometown", "data-hometown"], ["Activities", "data-activities"], ["Known as", "data-nickname"]].forEach(function (pair) {
        var value = row.getAttribute(pair[1]);
        if (!value) return;
        var wrap = document.createElement("div");
        var dt = document.createElement("dt");
        var dd = document.createElement("dd");
        dt.textContent = pair[0];
        dd.textContent = value;
        wrap.appendChild(dt);
        wrap.appendChild(dd);
        cardFields.appendChild(wrap);
      });
      if (!cardFields.children.length) {
        var wrap = document.createElement("div");
        var dt = document.createElement("dt");
        var dd = document.createElement("dd");
        dt.textContent = "Note";
        dd.textContent = "Bio on the Class of " + row.getAttribute("data-year") + " page.";
        wrap.appendChild(dt);
        wrap.appendChild(dd);
        cardFields.appendChild(wrap);
      }
      cardLink.textContent = "Open the Class of " + row.getAttribute("data-year");
      cardLink.href = row.getAttribute("data-url");
    };

    var showGroup = function (group) {
      groupButtons.forEach(function (button) {
        var on = button.getAttribute("data-group") === group;
        button.classList.toggle("is-active", on);
        button.setAttribute("aria-current", on ? "true" : "false");
      });
      var shown = 0;
      contactRows.forEach(function (row) {
        var on = group === "all" || row.getAttribute("data-group") === group;
        row.hidden = !on;
        if (on) shown += 1;
      });
      if (contactsStatus) contactsStatus.textContent = shown + (shown === 1 ? " card" : " cards");
      var visible = contactRows.filter(function (row) { return !row.hidden; });
      showContact(visible.filter(function (row) { return row.getAttribute("data-major"); })[0] || visible[0]);
    };

    var contactsBack = contactsWin.querySelector("[data-contacts-back]");

    var showContactDetail = function (on) {
      contactsWin.classList.toggle("is-detail", !!on);
      var title = contactsWin.querySelector("[data-window-title]") || contactsWin.querySelector(".mac-window__title");
      if (title) title.textContent = on ? cardName.textContent : "Brothers";
    };

    contactsWin.addEventListener("click", function (event) {
      if (event.target.closest("[data-contacts-back]")) { showContactDetail(false); return; }
      var group = event.target.closest("[data-group]:not([data-contact])");
      if (group) {
        showGroup(group.getAttribute("data-group"));
        railTo(group);
        return;
      }
      var row = event.target.closest("[data-contact]");
      if (row) {
        showContact(row);
        if (phone.matches) showContactDetail(true);
      }
    });

    contactsWin.addEventListener("pkt:window-close", function () { showContactDetail(false); });

    showGroup("all");
  }

  /* Terminal: zsh at 229 */

  var terminal = desktop.querySelector("[data-terminal]");
  var runCommandLine = null;

  if (terminal) {
    var output = terminal.querySelector("[data-terminal-output]");
    var form = terminal.querySelector("[data-terminal-form]");
    var input = terminal.querySelector("[data-terminal-input]");
    var mirror = terminal.querySelector("[data-terminal-mirror]");
    var promptLabel = terminal.querySelector("label");
    var history = [];
    var historyIndex = -1;
    var promptText = promptLabel ? promptLabel.textContent : "guest@229 ~ % ";

    output.setAttribute("data-initial", output.innerHTML);
    var lastLogin = output.querySelector("[data-last-login]");
    if (lastLogin) {
      var parts = bostonParts(new Date());
      if (parts) lastLogin.textContent = "Last login: " + parts.weekday + " " + parts.month + " " + (parts.day.length < 2 ? " " : "") + parts.day + " " + parts.hour + ":" + parts.minute + " on ttys000";
    }

    var print = function (text, kind) {
      var line = document.createElement("p");
      if (kind) line.className = kind;
      line.textContent = text;
      output.appendChild(line);
      while (output.children.length > 200) output.removeChild(output.firstChild);
      output.scrollTop = output.scrollHeight;
    };

    var files = {
      "README.md": [
        "# 229",
        "",
        "Phi Kappa Theta, Massachusetts Eta. 229 Commonwealth Avenue, Boston.",
        "First meeting 1918, Senior House. Chartered 1919. Home since 1943.",
        "",
        "Give, expecting nothing thereof.",
      ],
      rooms: "Ballroom  Beer Room  Canyon  Chapter Room  Flying Bedroom  Peck  Pit  Studio  Sunrise  Tomb  Virginia",
      floors: "Roofdeck  Fourth Floor  Third Floor  Second Floor  First Floor  Basement",
    };

    var appAliases = { finder: "finder", house: "finder", "house tour": "finder", "229": "welcome", index: "welcome", sections: "welcome", navigate: "welcome", brothers: "contacts", contacts: "contacts", photos: "photos", gallery: "photos", rush: "rush", calendar: "rush", schedule: "rush", events: "rush", archive: "archive", preview: "archive", poster: "archive", summer: "summer", notes: "summer", "summer housing": "summer", terminal: "terminal", trash: "trash", welcome: "welcome", about: "welcome" };

    var commands = {
      help: function () {
        print("229 commands:");
        print("  ls              list the house");
        print("  cat README.md   read the readme");
        print("  history         the short version");
        print("  ride            the number to call");
        print("  ping mit        check the bridge");
        print("  open <app>      open a window, e.g. open rush");
        print("  whoami, uptime, uname -a, date, motto, say, clear, exit");
      },
      ls: function (arg) {
        arg = (arg || "").toLowerCase();
        if (!arg || arg === "~" || arg === "/") { print("Basement       First Floor    Fourth Floor   README.md      Roofdeck       Third Floor"); print("Brothers       floors         Photos         rooms          Second Floor"); return; }
        if (arg === "rooms") { print(files.rooms); return; }
        if (arg === "floors") { print(files.floors); return; }
        if (arg === "photos") { print("31 photos in 5 albums. Open Photos to browse."); return; }
        if (arg === "brothers") { print("2016  2017  2018  2019  2020  2021  2022  2023  2024  2025  2026  2027  2028"); return; }
        print("ls: " + arg + ": No such file or directory");
      },
      cat: function (arg) {
        if (!arg) { print("usage: cat <file>"); return; }
        if (/^readme(\.md)?$/i.test(arg)) { files["README.md"].forEach(function (line) { print(line); }); return; }
        print("cat: " + arg + ": No such file or directory");
      },
      pwd: function () { print("/Volumes/229/guest"); },
      cd: function () { print("cd: the house is the working directory"); },
      whoami: function () { print("guest"); print("(a prospective member, an alum, or a brother avoiding a pset)"); },
      uname: function (arg) { print(String(arg).toLowerCase() === "-a" ? "Darwin 229.local 25.5.0 Darwin Kernel Version 25.5.0: Phi Kappa Theta, Massachusetts Eta; root:1918/RELEASE_BROTHERHOOD arm64" : "229"); },
      uptime: function () {
        var days = Math.floor((Date.now() - Date.UTC(1943, 8, 1)) / 86400000);
        var parts = bostonParts(new Date());
        print((parts ? parts.hour + ":" + parts.minute : "") + "  up " + days.toLocaleString("en-US") + " days, 1 user, load averages: 2.29 2.29 2.29");
      },
      history: function () {
        print("  1918  First meeting as Alpha Epsilon, Senior House, Holman 303");
        print("  1919  Chartered as a chapter of Phi Kappa");
        print("  1943  Moved to 229 Commonwealth Avenue");
        print("  1959  Phi Kappa and Theta Kappa Phi unite as Phi Kappa Theta");
        print("  1994  Seventy-fifth anniversary");
        print("  " + new Date().getFullYear() + "  You are here");
      },
      motto: function () { print("Give, expecting nothing thereof."); },
      ride: function () { print("321-PKT-LINE (321-758-5463). Call it during Rush. We’ll come get you."); },
      say: function (arg) { print(arg ? "🔈 " + arg : "usage: say <something nice>"); },
      ping: function (arg) {
        arg = (arg || "").toLowerCase();
        if (arg !== "mit" && arg !== "mit.edu") { print("ping: cannot resolve " + (arg || "") + ": Unknown host"); return; }
        print("PING mit.edu (18.9.22.169): 56 data bytes");
        print("64 bytes from 18.9.22.169: icmp_seq=0 ttl=64 time=364.4 smoots");
        print("64 bytes from 18.9.22.169: icmp_seq=1 ttl=64 time=5 min by bike");
        print("64 bytes from 18.9.22.169: icmp_seq=2 ttl=64 time=12 min on foot");
        print("--- mit.edu ping statistics ---");
        print("3 packets transmitted, 3 packets received, 0.0% packet loss, 100% worth it");
      },
      open: function (arg) {
        arg = (arg || "").toLowerCase();
        var key = appAliases[arg];
        if (!arg) { print("usage: open <app>   (index, house, brothers, photos, rush, archive, summer, terminal, trash)"); return; }
        if (key && findWindow(key)) { openWindow(key, { focusContent: false }); return; }
        print("The application " + arg + " cannot be found.");
      },
      date: function () {
        try {
          print(new Date().toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short", year: "numeric" }));
        } catch (error) { print(String(new Date())); }
      },
      clear: function () { output.innerHTML = ""; },
      sudo: function () { print("guest is not in the sudoers file. This incident will be reported to the Personnel Director."); },
      exit: function () {
        print("[Process completed]");
        window.setTimeout(function () { closeWindow(terminal.closest(".mac-window"), true); }, 400);
      },
      echo: function (arg) { print(arg || ""); },
    };
    commands.dir = commands.ls;
    commands.man = commands.help;
    commands.cls = commands.clear;

    runCommandLine = function (raw) {
      raw = String(raw || "").trim();
      print(promptText + raw, "is-input");
      if (!raw) return;
      history.push(raw);
      historyIndex = history.length;
      var parts = raw.split(/\s+/);
      var name = parts[0].toLowerCase();
      var arg = parts.slice(1).join(" ");
      if (Object.prototype.hasOwnProperty.call(commands, name)) commands[name](arg);
      else print("zsh: command not found: " + parts[0]);
    };

    var syncMirror = function () {
      if (mirror) mirror.textContent = input.value;
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      runCommandLine(input.value);
      input.value = "";
      syncMirror();
    });

    input.addEventListener("input", syncMirror);

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        runCommandLine(input.value);
        input.value = "";
        syncMirror();
      } else if (event.key === "ArrowUp") {
        if (!history.length) return;
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex];
        syncMirror();
        event.preventDefault();
      } else if (event.key === "ArrowDown") {
        if (!history.length) return;
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || "";
        syncMirror();
        event.preventDefault();
      } else if (event.key === "Tab") {
        var partial = input.value.toLowerCase();
        var match = Object.keys(commands).filter(function (key) { return partial && key.indexOf(partial) === 0; })[0];
        if (match) { input.value = match + " "; syncMirror(); }
        event.preventDefault();
      } else if (event.key === "Escape") {
        event.preventDefault();
        if (input.value) { input.value = ""; syncMirror(); }
        else closeWindow(terminal.closest(".mac-window"), true);
      } else if ((event.key === "l" || event.key === "L") && event.ctrlKey) {
        event.preventDefault();
        commands.clear();
      }
    });

    terminal.addEventListener("click", function (event) {
      if (!event.target.closest("a, button")) input.focus({ preventScroll: true });
    });

    desktop.addEventListener("click", function (event) {
      var key = event.target.closest("[data-terminal-key]");
      if (!key) return;
      runCommandLine(key.getAttribute("data-terminal-key"));
      input.focus({ preventScroll: true });
    });
  }

  /* Keyboard */

  document.addEventListener("keydown", function (event) {
    var meta = isApple ? event.metaKey : event.ctrlKey;
    if (galleryViewer && !galleryViewer.hidden && focused === galleryWindow && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      stepGallery(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (meta && event.key === " ") {
      event.preventDefault();
      if (spotlight && !spotlight.hidden) closeSpotlight();
      else openSpotlight();
      return;
    }
    if (event.key === "Escape") {
      if (galleryViewer && !galleryViewer.hidden) { closeGalleryViewer(true); return; }
      if (openMenu) { closeMenus(); return; }
      if (controlCenter && !controlCenter.hidden) { closeControlCenter(); return; }
      if (spotlight && !spotlight.hidden) { closeSpotlight(); return; }
      if (notification && !notification.hidden) { hideNotification(); return; }
      var win = event.target.closest && event.target.closest(".mac-window");
      if (win && !event.target.matches("input, textarea")) closeWindow(win, true);
      return;
    }
    if (meta && !event.shiftKey && !event.altKey) {
      if (event.key === "w" && focused) { event.preventDefault(); closeWindow(focused, true); }
      else if (event.key === "m" && focused) { event.preventDefault(); minimizeWindow(focused); }
      else if (event.key === "q" && focused) { event.preventDefault(); closeWindow(focused, true); }
    }
    if (openMenu && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      var items = Array.prototype.slice.call(openMenu.querySelectorAll("[role=menu] [role^=menuitem]:not([aria-disabled=true])"));
      if (!items.length) return;
      event.preventDefault();
      var index = items.indexOf(document.activeElement);
      var next = event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
      items[next].focus({ preventScroll: true });
    }
    if (openMenu && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      var menus = Array.prototype.slice.call(menubar.querySelectorAll(".menubar__left .menu")).filter(function (m) { return !m.hidden && m.offsetParent !== null; });
      var current = menus.indexOf(openMenu);
      if (current === -1) return;
      event.preventDefault();
      var target = menus[(current + (event.key === "ArrowRight" ? 1 : menus.length - 1)) % menus.length];
      showMenu(target);
      var firstItem = target.querySelector("[role=menu] [role^=menuitem]");
      if (firstItem) firstItem.focus({ preventScroll: true });
    }
  });

  desktop.addEventListener("focusout", function (event) {
    if (!openMenu) return;
    var next = event.relatedTarget;
    if (next && openMenu.contains(next)) return;
    window.setTimeout(function () {
      if (openMenu && !openMenu.contains(document.activeElement)) closeMenus();
    }, 0);
  });

  /* Welcome preference */

  var welcomeToggle = desktop.querySelector("[data-welcome-toggle]");
  function welcomeWanted() {
    return store("local", "pkt-229-welcome") !== "0";
  }
  if (welcomeToggle) {
    welcomeToggle.checked = welcomeWanted();
    welcomeToggle.addEventListener("change", function () {
      store("local", "pkt-229-welcome", welcomeToggle.checked ? "1" : "0");
    });
  }

  /* Session start: Welcome first, then the Rush notification */

  var notified = false;

  function startSession() {
    if (welcomeWanted() && findWindow("welcome")) openWindow("welcome", { focusContent: false });
    else {
      blurWindows();
      announce("Desktop ready.");
    }
    if (!notified && notification && store("session", "pkt-229-notified") !== "1") {
      notified = true;
      store("session", "pkt-229-notified", "1");
      window.setTimeout(showNotification, reduceMotion.matches ? 600 : 1800);
    }
  }

  var initialOpen = windows.filter(function (win) { return !win.hidden; });

  windows.forEach(function (win) {
    win.setAttribute("data-initial-style", win.getAttribute("style") || "");
    win.hidden = true;
    if (!win.hasAttribute("tabindex")) win.setAttribute("tabindex", "-1");
  });
  setMenubarApp(null);
  syncDock();
  if (floorPanels.length) selectFloor(floorPanels[0].getAttribute("data-floor-panel"));

  /* Documents: every page of the site opens as a real window on this desktop */

  var siteApps = {};
  var docsLoading = {};

  function registerWindow(win) {
    if (windows.indexOf(win) === -1) {
      windows.push(win);
      win.setAttribute("data-initial-style", win.getAttribute("style") || "");
      if (!win.hasAttribute("tabindex")) win.setAttribute("tabindex", "-1");
    }
  }

  function windowForUrl(url) {
    var app = siteApps[url];
    if (app) return findWindow(app);
    for (var i = 0; i < windows.length; i += 1) {
      if (windows[i].getAttribute("data-doc-url") === url) return windows[i];
    }
    return null;
  }

  function docTitleOf(win) {
    var node = win.querySelector("[data-window-title]");
    var name = node ? node.textContent.trim() : titleOf(win);
    return name + " | Phi Kappa Theta";
  }

  function pushUrl(url, win, replace) {
    if (!window.history || !window.history.pushState) return;
    var title = win ? docTitleOf(win) : "229 — The House Computer | Phi Kappa Theta";
    try {
      window.history[replace ? "replaceState" : "pushState"]({ pktUrl: url }, "", url);
    } catch (error) {
      return;
    }
    document.title = title;
  }

  function fetchDoc(url) {
    if (docsLoading[url]) return docsLoading[url];
    docsLoading[url] = window
      .fetch(url, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("status " + response.status);
        return response.text();
      })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, "text/html");
        var node = parsed.querySelector("[data-doc-window]");
        if (!node) throw new Error("no document window at " + url);
        return node;
      })
      .catch(function (error) {
        delete docsLoading[url];
        throw error;
      });
    return docsLoading[url];
  }

  function openUrl(url, options) {
    options = options || {};
    var existing = windowForUrl(url);
    if (existing) {
      openWindow(existing.getAttribute("data-window"), { focusContent: options.focus !== false });
      if (options.push !== false) pushUrl(url, existing, options.replace);
      else document.title = docTitleOf(existing);
      return;
    }
    if (!workspace || !window.fetch) {
      window.location.href = url;
      return;
    }
    desktop.classList.add("is-loading-doc");
    fetchDoc(url)
      .then(function (node) {
        desktop.classList.remove("is-loading-doc");
        if (windowForUrl(url)) {
          openUrl(url, options);
          return;
        }
        var win = document.importNode(node, true);
        win.hidden = true;
        win.removeAttribute("data-placed");
        workspace.appendChild(win);
        registerWindow(win);
        buildSpotlightIndex();
        openWindow(win.getAttribute("data-window"), { focusContent: options.focus !== false });
        if (options.push !== false) pushUrl(url, win, options.replace);
        else document.title = docTitleOf(win);
      })
      .catch(function () {
        desktop.classList.remove("is-loading-doc");
        window.location.href = url;
      });
  }

  function replaceDoc(win, url) {
    if (!win) { openUrl(url); return; }
    var other = windowForUrl(url);
    if (other && other !== win) {
      openWindow(other.getAttribute("data-window"), { focusContent: false });
      pushUrl(url, other);
      return;
    }
    desktop.classList.add("is-loading-doc");
    fetchDoc(url)
      .then(function (node) {
        desktop.classList.remove("is-loading-doc");
        var body = win.querySelector(".mac-window__body");
        var fresh = node.querySelector(".mac-window__body");
        var heading = win.querySelector("[data-window-title]");
        var freshHeading = node.querySelector("[data-window-title]");
        if (body && fresh) body.replaceWith(document.importNode(fresh, true));
        if (heading && freshHeading) heading.textContent = freshHeading.textContent;
        win.setAttribute("data-doc-url", url);
        win.setAttribute("data-window", node.getAttribute("data-window"));
        win.setAttribute("data-keywords", node.getAttribute("data-keywords") || "");
        win.setAttribute("data-spotlight-label", node.getAttribute("data-spotlight-label") || "");
        win.setAttribute("data-app", node.getAttribute("data-app") || win.getAttribute("data-app"));
        if (freshHeading) win.setAttribute("aria-label", freshHeading.textContent.trim());
        var pane = win.querySelector(".page-doc__main");
        if (pane) pane.scrollTop = 0;
        buildSpotlightIndex();
        focusWindow(win);
        setMenubarApp(win);
        win.focus({ preventScroll: true });
        pushUrl(url, win);
      })
      .catch(function () {
        desktop.classList.remove("is-loading-doc");
        window.location.href = url;
      });
  }

  function urlOfWindow(win) {
    var direct = win.getAttribute("data-doc-url");
    if (direct) return direct;
    var key = win.getAttribute("data-window");
    for (var path in siteApps) {
      if (siteApps[path] === key) return path;
    }
    return null;
  }

  function syncUrlAfterClose(win) {
    if (!win) return;
    var closed = urlOfWindow(win);
    if (!closed || closed !== window.location.pathname) return;
    var next = nextWindow(win);
    var url = next ? urlOfWindow(next) : null;
    if (url) pushUrl(url, next, true);
    else pushUrl(rootUrl, null, true);
  }

  function showDesktop() {
    windows.forEach(function (win) { if (isOpen(win)) closeWindow(win, false); });
    blurWindows();
    syncOpenState();
    pushUrl(rootUrl, null);
  }

  var rootUrl = "/";
  var baseNode = document.querySelector("base");
  if (baseNode) rootUrl = new URL(baseNode.href).pathname;

  function internalTarget(link) {
    if (!link || link.target && link.target !== "_self") return null;
    if (link.hasAttribute("download")) return null;
    var href = link.getAttribute("href");
    if (!href || href.charAt(0) === "#") return null;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return null;
    var url;
    try { url = new URL(link.href, window.location.href); } catch (error) { return null; }
    if (url.origin !== window.location.origin) return null;
    var path = url.pathname;
    if (/^\/static\//.test(path) || /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|ico|woff2?)$/i.test(path)) return null;
    return path;
  }

  desktop.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest ? event.target.closest("a[href]") : null;
    if (!link || !desktop.contains(link)) return;
    var path = internalTarget(link);
    if (!path) return;
    event.preventDefault();
    if (path === rootUrl) { showDesktop(); return; }
    var host = link.closest("[data-doc-window]");
    if (host && host.getAttribute("data-doc-url") === path) {
      focusWindow(host);
      return;
    }
    if (link.hasAttribute("data-doc-replace")) {
      replaceDoc(link.closest("[data-doc-window]"), path);
      return;
    }
    openUrl(path);
  });

  window.addEventListener("popstate", function (event) {
    var url = (event.state && event.state.pktUrl) || window.location.pathname;
    if (url === rootUrl) {
      windows.forEach(function (win) { if (isOpen(win)) closeWindow(win, false); });
      blurWindows();
      syncOpenState();
      document.title = "229 — The House Computer | Phi Kappa Theta";
      return;
    }
    openUrl(url, { push: false, focus: false });
  });

  /* Deep links: #open=finder,terminal  #floor=third  #cmd=ls;history  #spotlight */

  function readHash() {
    var hash = window.location.hash.replace(/^#/, "");
    if (!hash) return false;
    var params = {};
    hash.split("&").forEach(function (pair) {
      var parts = pair.split("=");
      try {
        params[decodeURIComponent(parts[0])] = parts.length > 1 ? decodeURIComponent(parts.slice(1).join("=")) : "";
      } catch (error) {}
    });
    var acted = false;
    if (params.open) {
      params.open.split(",").forEach(function (name) {
        if (findWindow(name.trim())) { openWindow(name.trim(), { focusContent: false }); acted = true; }
      });
    }
    if (params.floor) {
      var exists = floorPanels.some(function (panel) { return panel.getAttribute("data-floor-panel") === params.floor; });
      if (exists) { openWindow("finder", { focusContent: false }); selectFloor(params.floor); acted = true; }
    }
    if (params.cmd && runCommandLine) {
      openWindow("terminal", { focusContent: false });
      params.cmd.split(";").forEach(function (command) { runCommandLine(command); });
      acted = true;
    }
    if ("spotlight" in params) { openSpotlight(); acted = true; }
    if ("home" in params) { blurWindows(); syncOpenState(); acted = true; }
    return acted;
  }

  window.addEventListener("hashchange", readHash);

  runBoot(false, function () {
    if (initialOpen.length) {
      initialOpen.forEach(function (win) {
        openWindow(win.getAttribute("data-window"), { focusContent: false });
      });
      pushUrl(window.location.pathname, initialOpen[initialOpen.length - 1], true);
      notified = true;
      store("session", "pkt-229-notified", "1");
      readHash();
      return;
    }
    if (!readHash()) startSession();
    else if (!notified) {
      notified = true;
      store("session", "pkt-229-notified", "1");
    }
  });
})();

/* Interior pages: menu bar clock */
(function () {
  var clock = document.querySelector("[data-page-clock]");
  if (!clock) return;
  var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function tick() {
    var now = new Date();
    var hours = now.getHours();
    var suffix = hours >= 12 ? "PM" : "AM";
    var hour12 = hours % 12 || 12;
    var minutes = now.getMinutes();
    clock.textContent =
      days[now.getDay()] + " " + months[now.getMonth()] + " " + now.getDate() + "  " +
      hour12 + ":" + (minutes < 10 ? "0" : "") + minutes + " " + suffix;
    clock.setAttribute("datetime", now.toISOString());
  }
  tick();
  setInterval(tick, 15000);
})();

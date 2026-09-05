/* 229 98: the archived Windows 98 house computer, served at /98/ */

(function () {
  var desktop = document.querySelector("[data-desktop]");
  if (!desktop) return;

  var workspace = desktop.querySelector("[data-workspace]");
  var boot = desktop.querySelector("[data-boot]");
  var clock = desktop.querySelector("[data-clock]");
  var menu = desktop.querySelector("[data-house-menu]");
  var menuToggles = Array.prototype.slice.call(
    desktop.querySelectorAll("[data-menu-toggle]"),
  );
  var dockRunning = desktop.querySelector("[data-dock-running]");
  var status = desktop.querySelector("[data-desktop-status]");
  var windows = Array.prototype.slice.call(
    desktop.querySelectorAll(".os-window[data-window]"),
  );
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var smallScreen = window.matchMedia("(max-width: 700px)");
  var zCounter = 10;
  var focused = null;

  function announce(text) {
    if (status) status.textContent = text;
  }

  function titleOf(win) {
    var strong = win.querySelector(".window-bar strong");
    return strong ? strong.textContent.replace(/\s+/g, " ").trim() : win.getAttribute("data-window");
  }

  function badgeOf(win) {
    var badge = win.querySelector(".window-bar__badge");
    return badge ? badge.textContent.trim() : "";
  }

  function nameOf(win) {
    var name = win.getAttribute("data-window");
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /* Boot */

  function finishBoot() {
    if (!boot || boot.hidden) return;
    boot.classList.add("is-done");
    window.setTimeout(function () {
      boot.hidden = true;
    }, 450);
  }

  (function runBoot() {
    if (!boot) return;
    var seen = false;
    try {
      seen = window.sessionStorage.getItem("pkt-229-booted") === "1";
      window.sessionStorage.setItem("pkt-229-booted", "1");
    } catch (error) {
      seen = false;
    }
    if (seen || reduceMotion.matches) {
      boot.hidden = true;
      return;
    }
    window.setTimeout(finishBoot, 1500);
    boot.addEventListener("click", finishBoot);
  })();

  /* Clock, Boston time */

  function tickClock() {
    if (!clock) return;
    var now = new Date();
    var text;
    try {
      text = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
      }).format(now);
    } catch (error) {
      text = now.getHours() + ":" + ("0" + now.getMinutes()).slice(-2);
    }
    clock.textContent = text;
    clock.setAttribute("datetime", now.toISOString());
  }
  tickClock();
  window.setInterval(tickClock, 20000);

  /* Windows */

  function findWindow(name) {
    return windows.filter(function (win) {
      return win.getAttribute("data-window") === name;
    })[0];
  }

  function isOpen(win) {
    return !win.hidden && !win.classList.contains("is-minimized");
  }

  function focusWindow(win) {
    if (!win || win.hidden) return;
    zCounter += 1;
    win.style.setProperty("--window-z", String(zCounter));
    windows.forEach(function (other) {
      other.classList.toggle("is-focused", other === win);
    });
    focused = win;
    syncDock();
  }

  function openWindow(name, options) {
    var win = findWindow(name);
    if (!win) return;
    options = options || {};
    var wasHidden = win.hidden;
    win.hidden = false;
    win.classList.remove("is-minimized");
    if (wasHidden) keepInBounds(win);
    focusWindow(win);
    if (options.focusContent !== false) {
      var target = win.querySelector("[data-terminal-input]") || win.querySelector(".window-controls button");
      if (target) target.focus({ preventScroll: true });
    }
    announce(titleOf(win) + " window is open.");
  }

  function closeWindow(win, restoreFocus) {
    win.hidden = true;
    win.classList.remove("is-minimized", "is-maximized", "is-focused");
    if (focused === win) focused = null;
    var next = windows.filter(isOpen).sort(function (a, b) {
      return Number(b.style.getPropertyValue("--window-z") || 0) - Number(a.style.getPropertyValue("--window-z") || 0);
    })[0];
    if (next) focusWindow(next);
    else syncDock();
    announce(titleOf(win) + " window closed.");
    if (restoreFocus) {
      var opener = desktop.querySelector('.desktop-icon[data-open-window="' + win.getAttribute("data-window") + '"]');
      if (opener) opener.focus({ preventScroll: true });
    }
  }

  function minimizeWindow(win) {
    win.classList.add("is-minimized");
    win.hidden = true;
    win.classList.remove("is-focused");
    if (focused === win) focused = null;
    syncDock();
    announce(titleOf(win) + " minimized to the dock.");
    var dockButton = dockRunning && dockRunning.querySelector('[data-open-window="' + win.getAttribute("data-window") + '"]');
    if (dockButton) dockButton.focus({ preventScroll: true });
  }

  function toggleMaximize(win) {
    var max = win.classList.toggle("is-maximized");
    var button = win.querySelector("[data-window-maximize]");
    if (button) button.setAttribute("aria-label", (max ? "Restore " : "Maximize ") + nameOf(win));
    focusWindow(win);
    announce(titleOf(win) + (max ? " maximized." : " restored."));
  }

  function keepInBounds(win) {
    if (!workspace || smallScreen.matches || win.classList.contains("is-maximized")) return;
    var bounds = workspace.getBoundingClientRect();
    var rect = win.getBoundingClientRect();
    var x = rect.left - bounds.left;
    var y = rect.top - bounds.top;
    var maxX = Math.max(8, bounds.width - rect.width - 8);
    var maxY = Math.max(8, bounds.height - rect.height - 8);
    x = Math.min(Math.max(8, x), maxX);
    y = Math.min(Math.max(8, y), maxY);
    win.style.setProperty("--window-x", Math.round(x) + "px");
    win.style.setProperty("--window-y", Math.round(y) + "px");
  }

  /* Dock */

  function syncDock() {
    if (!dockRunning) return;
    windows.forEach(function (win) {
      var name = win.getAttribute("data-window");
      var button = dockRunning.querySelector('[data-open-window="' + name + '"]');
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-open-window", name);
        var badge = win.querySelector(".window-bar__badge");
        if (badge) {
          var icon = badge.cloneNode(true);
          icon.removeAttribute("class");
          icon.setAttribute("aria-hidden", "true");
          button.appendChild(icon);
        }
        var label = document.createElement("strong");
        label.textContent = titleOf(win);
        button.appendChild(label);
        dockRunning.appendChild(button);
      }
      var open = !win.hidden || win.classList.contains("is-minimized");
      button.classList.toggle("is-open", open);
      button.classList.toggle("is-minimized", win.classList.contains("is-minimized"));
      button.classList.toggle("is-active", win === focused && !win.hidden);
      button.setAttribute("aria-pressed", win === focused && !win.hidden ? "true" : "false");
      button.setAttribute("aria-label", (open ? "Show " : "Open ") + titleOf(win));
    });
  }

  /* Menu */

  function setMenu(open) {
    if (!menu) return;
    menu.hidden = !open;
    menuToggles.forEach(function (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    if (open) {
      var first = menu.querySelector("button, a");
      if (first) first.focus({ preventScroll: true });
    }
  }

  menuToggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(menu.hidden);
    });
  });

  document.addEventListener("pointerdown", function (event) {
    if (!menu || menu.hidden) return;
    if (menu.contains(event.target)) return;
    if (menuToggles.some(function (toggle) { return toggle.contains(event.target); })) return;
    setMenu(false);
  });

  /* Delegated clicks: open, close, minimize, maximize */

  desktop.addEventListener("click", function (event) {
    var opener = event.target.closest("[data-open-window]");
    if (opener) {
      openWindow(opener.getAttribute("data-open-window"));
      if (menu && !menu.hidden) setMenu(false);
      return;
    }
    var win = event.target.closest(".os-window");
    if (!win) return;
    if (event.target.closest("[data-window-close]")) {
      closeWindow(win, true);
    } else if (event.target.closest("[data-window-minimize]")) {
      minimizeWindow(win);
    } else if (event.target.closest("[data-window-maximize]")) {
      toggleMaximize(win);
    }
  });

  desktop.addEventListener("pointerdown", function (event) {
    var win = event.target.closest(".os-window");
    if (win && win !== focused) focusWindow(win);
  });

  desktop.addEventListener("dblclick", function (event) {
    var handle = event.target.closest("[data-window-handle]");
    if (!handle || event.target.closest(".window-controls") || smallScreen.matches) return;
    toggleMaximize(handle.closest(".os-window"));
  });

  /* Dragging */

  var drag = null;

  desktop.addEventListener("pointerdown", function (event) {
    var handle = event.target.closest("[data-window-handle]");
    if (!handle || event.button !== 0 || event.target.closest(".window-controls")) return;
    var win = handle.closest(".os-window");
    if (!win || smallScreen.matches || win.classList.contains("is-maximized")) return;
    var bounds = workspace.getBoundingClientRect();
    var rect = win.getBoundingClientRect();
    drag = {
      win: win,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      bounds: bounds,
      width: rect.width,
      height: rect.height,
    };
    win.classList.add("is-dragging");
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  desktop.addEventListener("pointermove", function (event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    var x = event.clientX - drag.bounds.left - drag.offsetX;
    var y = event.clientY - drag.bounds.top - drag.offsetY;
    var maxX = drag.bounds.width - drag.width - 8;
    var maxY = drag.bounds.height - drag.height - 8;
    x = Math.min(Math.max(8, x), Math.max(8, maxX));
    y = Math.min(Math.max(8, y), Math.max(8, maxY));
    drag.win.style.setProperty("--window-x", Math.round(x) + "px");
    drag.win.style.setProperty("--window-y", Math.round(y) + "px");
  });

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.win.classList.remove("is-dragging");
    drag = null;
  }

  desktop.addEventListener("pointerup", endDrag);
  desktop.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", function () {
    windows.filter(isOpen).forEach(keepInBounds);
  });

  /* Keyboard */

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (menu && !menu.hidden) {
        setMenu(false);
        if (menuToggles[0]) menuToggles[0].focus();
        return;
      }
      var win = event.target.closest && event.target.closest(".os-window");
      if (win && !event.target.matches("input")) closeWindow(win, true);
    }
  });

  /* House app: floors */

  desktop.addEventListener("click", function (event) {
    var floorButton = event.target.closest("[data-floor]");
    if (!floorButton) return;
    var app = floorButton.closest(".house-app");
    var floor = floorButton.getAttribute("data-floor");
    Array.prototype.forEach.call(app.querySelectorAll("[data-floor]"), function (button) {
      var active = button === floorButton;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-floor-panel]"), function (panel) {
      var active = panel.getAttribute("data-floor-panel") === floor;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  });

  /* Welcome preference */

  var welcomeToggle = desktop.querySelector("[data-welcome-toggle]");
  function welcomeWanted() {
    try { return window.localStorage.getItem("pkt-229-welcome") !== "0"; } catch (error) { return true; }
  }
  if (welcomeToggle) {
    welcomeToggle.checked = welcomeWanted();
    welcomeToggle.addEventListener("change", function () {
      try { window.localStorage.setItem("pkt-229-welcome", welcomeToggle.checked ? "1" : "0"); } catch (error) {}
    });
  }

  /* Restart */

  var restartButton = desktop.querySelector("[data-restart]");
  if (restartButton && boot) {
    restartButton.addEventListener("click", function () {
      setMenu(false);
      windows.forEach(function (win) { win.hidden = true; win.classList.remove("is-minimized", "is-maximized", "is-focused"); });
      focused = null;
      syncDock();
      boot.classList.remove("is-done");
      boot.hidden = false;
      void boot.offsetWidth;
      window.setTimeout(function () {
        finishBoot();
        if (welcomeWanted()) openWindow("welcome", { focusContent: false });
        announce("229 restarted.");
      }, 1700);
    });
  }

  /* Desktop icon selection */

  desktop.addEventListener("pointerdown", function (event) {
    var icon = event.target.closest(".desktop-icon");
    Array.prototype.forEach.call(desktop.querySelectorAll(".desktop-icon"), function (other) {
      other.classList.toggle("is-selected", other === icon);
    });
  });

  /* House app: address bar */

  desktop.addEventListener("click", function (event) {
    var floorButton = event.target.closest("[data-floor]");
    if (!floorButton) return;
    var win = floorButton.closest(".os-window");
    var address = win && win.querySelector("[data-address]");
    if (address && floorButton.getAttribute("data-path")) address.textContent = floorButton.getAttribute("data-path");
  });

  /* Terminal */

  var terminal = desktop.querySelector("[data-terminal]");
  if (terminal) {
    var output = terminal.querySelector("[data-terminal-output]");
    var form = terminal.querySelector("[data-terminal-form]");
    var input = terminal.querySelector("[data-terminal-input]");
    var history = [];
    var historyIndex = -1;

    var print = function (text, kind) {
      var line = document.createElement("p");
      if (kind) line.className = kind;
      line.textContent = text;
      output.appendChild(line);
      while (output.children.length > 160) output.removeChild(output.firstChild);
      output.scrollTop = output.scrollHeight;
    };

    var files = {
      rooms: "canyon  tomb  sunrise  flying  studio  beer  virginia  peck  ballroom  pit  chapter",
      floors: "roofdeck  fourth  third  second  first  basement",
      apps: "welcome  house  people  rush  archive  summer  terminal",
    };

    var commands = {
      help: function () {
        print("HELP        this list");
        print("DIR [dir]   list rooms, floors, apps");
        print("WHOAMI      who is logged in");
        print("HISTORY     the short version");
        print("MOTTO       what we live by");
        print("RIDE        the number to call");
        print("PING MIT    check the bridge");
        print("OPEN <app>  open a window, e.g. OPEN RUSH");
        print("DATE        house time");
        print("VER         version");
        print("CLS         wipe the screen");
      },
      ver: function () { print("229 98 [Version 19.43] — running at 229 Commonwealth Avenue since 1943."); },
      ls: function (arg) {
        if (!arg) { print("rooms/  floors/  apps/  composites/  README"); return; }
        if (files[arg]) print(files[arg]);
        else if (arg === "composites") print("1968 … 2026  (scans pending: bring a flatbed)");
        else if (arg === "readme") print("229 Commonwealth Avenue. Est. 1918. Give, expecting nothing thereof.");
        else print("ls: " + arg + ": no such directory", "is-error");
      },
      whoami: function () { print("guest — a prospective member, an alum, or a brother avoiding a pset."); },
      history: function () {
        print("1918  First meeting as Alpha Epsilon, Senior House, Holman 303");
        print("1919  Chartered as a chapter of Phi Kappa");
        print("1943  Moved to 229 Commonwealth Avenue");
        print("1959  Phi Kappa and Theta Kappa Phi unite as Phi Kappa Theta");
        print("1994  Seventy-fifth anniversary");
        print("2026  You are here");
      },
      motto: function () { print("Give, expecting nothing thereof."); },
      ride: function () { print("321-PKT-LINE  (321-758-5463). Call it during Rush. We'll come get you."); },
      ping: function (arg) {
        if (arg !== "mit") { print("ping: usage: ping mit", "is-error"); return; }
        print("PING mit.edu via Harvard Bridge: 364.4 smoots + 1 ear");
        print("64 bytes from campus: time=5 min by bike");
        print("64 bytes from campus: time=12 min on foot");
        print("--- mit.edu ping statistics: 0% packet loss, 100% worth it ---");
      },
      open: function (arg) {
        if (!arg) { print("open: which app? try: " + files.apps, "is-error"); return; }
        if (findWindow(arg)) { openWindow(arg, { focusContent: false }); print("opening " + arg + "…"); }
        else print("open: " + arg + ": not an app on this machine", "is-error");
      },
      date: function () {
        var now = new Date();
        print(now.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET, Back Bay");
      },
      clear: function () { output.innerHTML = ""; },
      sudo: function () { print("guest is not in the sudoers file. This incident will be reported to the Personnel Director."); },
      exit: function () { print("There is no exit. There is only the roofdeck."); },
    };

    var run = function () {
      var raw = input.value.trim();
      input.value = "";
      if (!raw) return;
      var promptLabel = terminal.querySelector("label");
      print((promptLabel ? promptLabel.textContent : "C:\\229>") + raw, "is-input");
      history.push(raw);
      historyIndex = history.length;
      var parts = raw.split(/\s+/);
      var name = parts[0].toLowerCase();
      var arg = parts.slice(1).join(" ").toLowerCase();
      if (name === "dir") name = "ls";
      if (name === "cls") name = "clear";
      if (name === "start") name = "open";
      if (commands[name]) commands[name](arg);
      else print("Bad command or file name. Type HELP.", "is-error");
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      run();
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        run();
      } else if (event.key === "ArrowUp") {
        if (!history.length) return;
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex];
        event.preventDefault();
      } else if (event.key === "ArrowDown") {
        if (!history.length) return;
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || "";
        event.preventDefault();
      }
    });

    terminal.addEventListener("click", function (event) {
      if (!event.target.closest("a, button")) input.focus({ preventScroll: true });
    });
  }

  /* Start */

  var initial = desktop.querySelector("[data-default-window]") || windows[0];
  windows.forEach(function (win) {
    if (win !== initial) win.hidden = true;
  });
  if (initial && welcomeWanted()) {
    initial.hidden = false;
    focusWindow(initial);
  } else if (initial) {
    initial.hidden = true;
    initial.classList.remove("is-focused");
    announce("Desktop ready.");
  }
  syncDock();

  /* Deep links: #open=house,terminal  #floor=fourth  #cmd=dir  #start */

  (function readHash() {
    var hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    var params = {};
    hash.split("&").forEach(function (pair) {
      var parts = pair.split("=");
      params[decodeURIComponent(parts[0])] = parts.length > 1 ? decodeURIComponent(parts.slice(1).join("=")) : "";
    });
    if (params.open) {
      params.open.split(",").forEach(function (name) {
        if (findWindow(name.trim())) openWindow(name.trim(), { focusContent: false });
      });
    }
    if (params.floor) {
      var floorButton = desktop.querySelector('[data-floor="' + params.floor + '"]');
      if (floorButton) floorButton.click();
    }
    if (params.cmd && terminal) {
      openWindow("terminal", { focusContent: false });
      var input = terminal.querySelector("[data-terminal-input]");
      params.cmd.split(";").forEach(function (command) {
        input.value = command;
        terminal.querySelector("[data-terminal-form]").dispatchEvent(new Event("submit", { cancelable: true }));
      });
    }
    if ("start" in params) setMenu(true);
  })();
})();

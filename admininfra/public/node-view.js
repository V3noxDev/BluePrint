(function () {
    'use strict';

    var EXT = '/extensions/admininfra';
    var ICON_MEM = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3zm1 0v10h12V3H2z"/><path d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/></svg>';
    var ICON_DISK = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z"/></svg>';

    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    function isEmbed() {
        return new URLSearchParams(window.location.search).get('ai_embed') === '1'
            || window.self !== window.top;
    }

    function matchNodeAbout() {
        var m = window.location.pathname.match(/^\/admin\/nodes\/view\/(\d+)$/);
        return m ? m[1] : null;
    }

    function formatMib(value) {
        var n = Number(value) || 0;
        if (n >= 1048576) {
            return (n / 1048576).toFixed(2) + ' TiB';
        }
        if (n >= 1024) {
            return (n / 1024).toFixed(1) + ' GiB';
        }
        return n.toLocaleString('pt-BR') + ' MiB';
    }

    function pct(value, max) {
        if (!max || max <= 0) {
            return 0;
        }
        return Math.min(100, Math.max(0, (value / max) * 100));
    }

    function barTone(percent) {
        if (percent > 90) {
            return 'ai-node-bar__fill--danger';
        }
        if (percent > 75) {
            return 'ai-node-bar__fill--warning';
        }
        return 'ai-node-bar__fill--ok';
    }

    function barRow(label, value, scale, tone, extra) {
        var p = pct(value, scale);
        var toneClass = tone || barTone(p);
        return ''
            + '<div class="ai-node-bar-row">'
            + '  <span class="ai-node-bar-row__label">' + label + '</span>'
            + '  <div class="ai-node-bar">'
            + '    <div class="ai-node-bar__fill ' + toneClass + '" style="width:' + p.toFixed(1) + '%"></div>'
            + '  </div>'
            + '  <span class="ai-node-bar-row__value">' + formatMib(value) + (extra || '') + '</span>'
            + '</div>';
    }

    function buildResourceCard(title, icon, data, physical) {
        var scale = Math.max(data.max, data.configured, data.allocated, data.real, physical || 0, 1);
        var allocPct = pct(data.allocated, data.max).toFixed(0);
        var realPct = pct(data.real, data.max).toFixed(0);

        var rows = ''
            + barRow('Limite', data.max, scale, 'ai-node-bar__fill--muted', '')
            + barRow('Alocado', data.allocated, scale, 'ai-node-bar__fill--allocated', ' <em>(' + allocPct + '%)</em>')
            + barRow('Uso real', data.real, scale, barTone(pct(data.real, data.max)), ' <em>(' + realPct + '%)</em>')
            + barRow('Configurado', data.configured, scale, 'ai-node-bar__fill--configured', '');

        if (physical) {
            rows += barRow('RAM física', physical, scale, 'ai-node-bar__fill--physical', '');
        }

        return ''
            + '<div class="ai-node-resource">'
            + '  <div class="ai-node-resource__head">'
            + '    <span class="ai-node-resource__icon">' + icon + '</span>'
            + '    <div>'
            + '      <h4 class="ai-node-resource__title">' + title + '</h4>'
            + '      <p class="ai-node-resource__sub">Comparado ao limite do node</p>'
            + '    </div>'
            + '  </div>'
            + '  <div class="ai-node-resource__chart">' + rows + '</div>'
            + '</div>';
    }

    function skeleton() {
        return ''
            + '<div class="ai-node-dashboard ai-node-dashboard--loading">'
            + '  <div class="ai-node-skeleton ai-node-skeleton--title"></div>'
            + '  <div class="ai-node-dashboard__grid">'
            + '    <div class="ai-node-skeleton ai-node-skeleton--card"></div>'
            + '    <div class="ai-node-skeleton ai-node-skeleton--card"></div>'
            + '  </div>'
            + '</div>';
    }

    function buildDashboard(stats) {
        var warn = stats.connected
            ? ''
            : '<div class="ai-node-warn"><strong>Wings offline</strong> — uso real indisponível. Exibindo apenas dados do painel.</div>';

        return ''
            + '<div class="ai-node-dashboard">'
            + '  <div class="ai-node-dashboard__head">'
            + '    <div>'
            + '      <h3 class="ai-node-dashboard__title">Recursos do node</h3>'
            + '      <p class="ai-node-dashboard__sub">Alocação no painel vs. consumo real no servidor</p>'
            + '    </div>'
            + '    <span class="ai-node-dashboard__badge' + (stats.connected ? ' ai-node-dashboard__badge--ok' : '') + '">'
            + '      <span class="ai-node-dashboard__dot"></span>'
            + (stats.connected ? 'Wings online' : 'Wings offline')
            + '    </span>'
            + '  </div>'
            + warn
            + '  <div class="ai-node-dashboard__grid">'
            + buildResourceCard('Memória', ICON_MEM, stats.memory, stats.memory.physical)
            + buildResourceCard('Disco', ICON_DISK, stats.disk, 0)
            + '  </div>'
            + '</div>';
    }

    function buildBottomPanel() {
        return ''
            + '<div class="ai-node-panel" id="ai-node-panel">'
            + '  <div class="ai-node-panel__header">'
            + '    <div>'
            + '      <h3 class="ai-node-panel__title">Gerenciamento</h3>'
            + '      <p class="ai-node-panel__sub">Alocações e servidores deste node</p>'
            + '    </div>'
            + '  </div>'
            + '  <div class="ai-node-panel__tabs" role="tablist">'
            + '    <button type="button" class="ai-node-panel__tab is-active" data-tab="allocations" role="tab" aria-selected="true">'
            + '      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 1 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>'
            + '      Alocações'
            + '    </button>'
            + '    <button type="button" class="ai-node-panel__tab" data-tab="servers" role="tab" aria-selected="false">'
            + '      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V13.5a.5.5 0 1 0 1 0V4a2 2 0 0 0-2-2H2zm7.194 2.834L3.271 6.176 8.5 9.417l5.229-3.24L8.194 4.834z"/></svg>'
            + '      Servidores'
            + '    </button>'
            + '  </div>'
            + '  <div class="ai-node-panel__body">'
            + '    <div class="ai-node-panel__pane is-active" data-pane="allocations" role="tabpanel">'
            + '      <div class="ai-node-panel__loading"><span class="ai-node-spinner"></span> Carregando alocações…</div>'
            + '    </div>'
            + '    <div class="ai-node-panel__pane" data-pane="servers" role="tabpanel">'
            + '      <div class="ai-node-panel__loading"><span class="ai-node-spinner"></span> Carregando servidores…</div>'
            + '    </div>'
            + '  </div>'
            + '</div>';
    }

    function hideTopTabs() {
        var nav = document.querySelector('.nav-tabs-custom .nav-tabs');
        if (!nav) {
            return;
        }

        nav.querySelectorAll('li a').forEach(function (link) {
            var href = link.getAttribute('href') || '';
            if (href.indexOf('/allocation') !== -1 || href.indexOf('/servers') !== -1) {
                link.closest('li').style.display = 'none';
            }
        });

        nav.closest('.nav-tabs-custom').classList.add('ai-node-nav');
    }

    function removeTotalServers() {
        document.querySelectorAll('.info-box').forEach(function (box) {
            var text = (box.textContent || '').toLowerCase();
            if (text.indexOf('total servers') !== -1 || text.indexOf('total de servidores') !== -1) {
                var col = box.closest('[class*="col-"]');
                if (col) {
                    col.remove();
                } else {
                    box.remove();
                }
            }
        });
    }

    function findGlanceBox() {
        var glance = null;
        document.querySelectorAll('.box').forEach(function (box) {
            var title = box.querySelector('.box-title');
            if (!title) {
                return;
            }
            var t = title.textContent.trim().toLowerCase();
            if (t.indexOf('at-a-glance') !== -1 || t.indexOf('visão geral') !== -1 || t.indexOf('recursos') !== -1) {
                glance = box;
            }
        });
        return glance;
    }

    function layoutAboutPage() {
        var content = document.querySelector('section.content');
        if (!content) {
            return;
        }

        content.classList.add('ai-node-about');

        var glance = findGlanceBox();
        if (!glance) {
            return;
        }

        var col = glance.closest('[class*="col-"]');
        if (col) {
            col.classList.remove('col-md-6', 'col-sm-6');
            col.classList.add('col-md-12', 'ai-node-about__resources');
        }

        var title = glance.querySelector('.box-title');
        if (title) {
            title.textContent = 'Recursos & uso';
        }

        glance.classList.add('ai-node-about__glance-box');
    }

    function replaceGlanceBody(html) {
        var glance = findGlanceBox();
        if (!glance) {
            return;
        }
        var body = glance.querySelector('.box-body');
        if (body) {
            body.innerHTML = html;
        }
    }

    function resizeIframe(frame) {
        try {
            var doc = frame.contentDocument || frame.contentWindow.document;
            var h = doc.body ? doc.body.scrollHeight : 560;
            frame.style.height = Math.max(420, Math.min(h + 24, 900)) + 'px';
        } catch (e) {
            frame.style.height = '560px';
        }
    }

    function loadTab(nodeId, tab) {
        var pane = document.querySelector('.ai-node-panel__pane[data-pane="' + tab + '"]');
        if (!pane || pane.dataset.loaded === '1') {
            return;
        }

        var url = '/admin/nodes/view/' + nodeId + '/' + (tab === 'allocations' ? 'allocation' : 'servers') + '?ai_embed=1';
        var frame = document.createElement('iframe');
        frame.className = 'ai-node-panel__iframe';
        frame.src = url;
        frame.title = tab === 'allocations' ? 'Alocações' : 'Servidores';
        frame.loading = 'lazy';

        frame.addEventListener('load', function () {
            resizeIframe(frame);
        });

        pane.innerHTML = '';
        pane.appendChild(frame);
        pane.dataset.loaded = '1';
    }

    function bindPanel(nodeId) {
        var panel = document.getElementById('ai-node-panel');
        if (!panel) {
            return;
        }

        panel.querySelectorAll('.ai-node-panel__tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var name = tab.getAttribute('data-tab');
                panel.querySelectorAll('.ai-node-panel__tab').forEach(function (t) {
                    var active = t === tab;
                    t.classList.toggle('is-active', active);
                    t.setAttribute('aria-selected', active ? 'true' : 'false');
                });
                panel.querySelectorAll('.ai-node-panel__pane').forEach(function (p) {
                    p.classList.toggle('is-active', p.getAttribute('data-pane') === name);
                });
                loadTab(nodeId, name);
            });
        });

        loadTab(nodeId, 'allocations');
    }

    function fetchStats(nodeId) {
        return fetch(EXT + '/nodes/' + nodeId + '/stats', {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        }).then(function (r) {
            if (!r.ok) {
                throw new Error('stats');
            }
            return r.json();
        });
    }

    function polishInfoBox() {
        document.querySelectorAll('.ai-node-about .box').forEach(function (box) {
            var title = box.querySelector('.box-title');
            if (!title) {
                return;
            }
            var t = title.textContent.trim().toLowerCase();
            if (t === 'information' || t === 'informação' || t === 'informações') {
                box.classList.add('ai-node-about__info-box');
            }
        });
    }

    function initAboutPage(nodeId) {
        document.documentElement.classList.add('ai-node-page');
        hideTopTabs();
        removeTotalServers();
        layoutAboutPage();
        polishInfoBox();
        replaceGlanceBody(skeleton());

        var content = document.querySelector('section.content');
        if (!content) {
            return;
        }

        fetchStats(nodeId)
            .then(function (json) {
                replaceGlanceBody(buildDashboard(json.data || json));
            })
            .catch(function () {
                replaceGlanceBody('<div class="ai-node-warn">Não foi possível carregar as estatísticas deste node.</div>');
            });

        var wrap = document.createElement('div');
        wrap.innerHTML = buildBottomPanel();
        content.appendChild(wrap.firstChild);
        bindPanel(nodeId);
    }

    function initEmbed() {
        document.documentElement.classList.add('ai-embed');
    }

    ready(function () {
        if (isEmbed()) {
            initEmbed();
            return;
        }

        var nodeId = matchNodeAbout();
        if (nodeId) {
            initAboutPage(nodeId);
        }
    });
})();

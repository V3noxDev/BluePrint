(function () {
    'use strict';

    var EXT = '/extensions/admininfra';

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

    function barClass(percent) {
        if (percent > 90) {
            return 'ai-node-bar__fill--danger';
        }
        if (percent > 75) {
            return 'ai-node-bar__fill--warning';
        }
        return 'ai-node-bar__fill--ok';
    }

    function buildResourceCard(title, icon, data, physical) {
        var scale = Math.max(data.max, data.configured, data.allocated, data.real, physical || 0, 1);
        var allocatedPct = pct(data.allocated, scale);
        var realPct = pct(data.real, scale);
        var configuredPct = pct(data.configured, scale);
        var maxPct = pct(data.max, scale);

        return ''
            + '<div class="ai-node-resource">'
            + '  <div class="ai-node-resource__head">'
            + '    <span class="ai-node-resource__icon">' + icon + '</span>'
            + '    <h4 class="ai-node-resource__title">' + title + '</h4>'
            + '  </div>'
            + '  <div class="ai-node-resource__chart">'
            + '    <div class="ai-node-bar ai-node-bar--track">'
            + '      <div class="ai-node-bar__fill ai-node-bar__fill--muted" style="width:' + maxPct + '%" title="Limite máximo"></div>'
            + '    </div>'
            + '    <div class="ai-node-bar">'
            + '      <div class="ai-node-bar__fill ai-node-bar__fill--allocated" style="width:' + allocatedPct + '%" title="Alocado nos servidores"></div>'
            + '    </div>'
            + '    <div class="ai-node-bar">'
            + '      <div class="ai-node-bar__fill ' + barClass(realPct) + '" style="width:' + realPct + '%" title="Uso real no node"></div>'
            + '    </div>'
            + '    <div class="ai-node-bar ai-node-bar--thin">'
            + '      <div class="ai-node-bar__fill ai-node-bar__fill--configured" style="width:' + configuredPct + '%" title="Configurado no node"></div>'
            + '    </div>'
            + '  </div>'
            + '  <div class="ai-node-resource__legend">'
            + '    <div><span class="ai-node-dot ai-node-dot--configured"></span> Configurado: <strong>' + formatMib(data.configured) + '</strong></div>'
            + '    <div><span class="ai-node-dot ai-node-dot--max"></span> Limite (overalloc): <strong>' + formatMib(data.max) + '</strong></div>'
            + '    <div><span class="ai-node-dot ai-node-dot--allocated"></span> Alocado: <strong>' + formatMib(data.allocated) + '</strong></div>'
            + '    <div><span class="ai-node-dot ai-node-dot--real"></span> Uso real (node): <strong>' + formatMib(data.real) + '</strong></div>'
            + (physical ? '<div><span class="ai-node-dot ai-node-dot--physical"></span> RAM física total: <strong>' + formatMib(physical) + '</strong></div>' : '')
            + '  </div>'
            + '</div>';
    }

    function buildDashboard(stats) {
        var mem = stats.memory;
        var disk = stats.disk;
        var warn = stats.connected
            ? ''
            : '<div class="ai-node-warn">Wings offline — uso real indisponível. Mostrando apenas dados do painel.</div>';

        return ''
            + '<div class="ai-node-dashboard">'
            + '  <div class="ai-node-dashboard__head">'
            + '    <h3 class="ai-node-dashboard__title">Recursos do Node</h3>'
            + '    <span class="ai-node-dashboard__badge' + (stats.connected ? ' ai-node-dashboard__badge--ok' : '') + '">'
            + (stats.connected ? 'Wings conectado' : 'Wings offline')
            + '    </span>'
            + '  </div>'
            + warn
            + '  <div class="ai-node-dashboard__grid">'
            + buildResourceCard('Memória', '&#128190;', mem, mem.physical)
            + buildResourceCard('Disco', '&#128452;', disk, 0)
            + '  </div>'
            + '  <p class="ai-node-dashboard__hint">Uso real = soma do consumo atual no node (Wings), não por container individual.</p>'
            + '</div>';
    }

    function buildBottomPanel(nodeId) {
        var base = '/admin/nodes/view/' + nodeId;
        return ''
            + '<div class="ai-node-panel" id="ai-node-panel">'
            + '  <div class="ai-node-panel__tabs">'
            + '    <button type="button" class="ai-node-panel__tab is-active" data-tab="allocations">Alocações</button>'
            + '    <button type="button" class="ai-node-panel__tab" data-tab="servers">Servidores</button>'
            + '  </div>'
            + '  <div class="ai-node-panel__body">'
            + '    <div class="ai-node-panel__pane is-active" data-pane="allocations">'
            + '      <div class="ai-node-panel__loading">Carregando alocações…</div>'
            + '    </div>'
            + '    <div class="ai-node-panel__pane" data-pane="servers">'
            + '      <div class="ai-node-panel__loading">Carregando servidores…</div>'
            + '    </div>'
            + '  </div>'
            + '  <iframe class="ai-node-panel__frame" data-src-allocations="' + base + '/allocation?ai_embed=1" data-src-servers="' + base + '/servers?ai_embed=1" hidden></iframe>'
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
    }

    function removeTotalServers() {
        document.querySelectorAll('.info-box').forEach(function (box) {
            var text = box.textContent || '';
            if (text.indexOf('Total Servers') !== -1 || text.indexOf('Total de Servidores') !== -1) {
                var col = box.closest('[class*="col-"]');
                if (col) {
                    col.remove();
                } else {
                    box.remove();
                }
            }
        });
    }

    function replaceAtAGlance(html) {
        var glance = null;
        document.querySelectorAll('.box').forEach(function (box) {
            var title = box.querySelector('.box-title');
            if (title && (title.textContent.indexOf('At-a-Glance') !== -1 || title.textContent.indexOf('Visão Geral') !== -1)) {
                glance = box;
            }
        });

        if (!glance) {
            return null;
        }

        var body = glance.querySelector('.box-body');
        if (!body) {
            return null;
        }

        body.innerHTML = html;
        return glance;
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
                    t.classList.toggle('is-active', t === tab);
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

    function initAboutPage(nodeId) {
        hideTopTabs();
        removeTotalServers();

        var content = document.querySelector('section.content');
        if (!content) {
            return;
        }

        fetchStats(nodeId)
            .then(function (json) {
                var stats = json.data || json;
                replaceAtAGlance(buildDashboard(stats));
            })
            .catch(function () {
                replaceAtAGlance('<div class="ai-node-warn">Não foi possível carregar estatísticas do node.</div>');
            });

        var panel = document.createElement('div');
        panel.innerHTML = buildBottomPanel(nodeId);
        content.appendChild(panel.firstChild);
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

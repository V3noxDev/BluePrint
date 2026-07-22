(function () {
    'use strict';

    var root = document.getElementById('tpl-admin');
    if (!root) return;

    var API = root.getAttribute('data-api') || '/extensions/templates/admin';
    var app = document.getElementById('tpl-admin-app');
    var state = { view: 'list', template: null, templates: [], actions: {}, doc: [] };

    function csrf() {
        var m = document.querySelector('meta[name="_token"]');
        return m ? m.getAttribute('content') : '';
    }

    function api(method, path, body) {
        return fetch(API + path, {
            method: method,
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrf(),
            },
            body: body ? JSON.stringify(body) : undefined,
        }).then(function (r) {
            return r.json().then(function (j) {
                if (!r.ok) throw new Error(j.error || j.message || 'Erro na requisição');
                return j.data !== undefined ? j.data : j;
            });
        });
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function renderList() {
        var rows = state.templates.map(function (t) {
            return '<tr>'
                + '<td>' + t.id + '</td>'
                + '<td>' + t.sort_order + '</td>'
                + '<td>' + (t.icon_url ? '<img src="' + esc(t.icon_url) + '" class="tpl-admin__icon" alt="">' : '—') + '</td>'
                + '<td><strong>' + esc(t.name) + '</strong></td>'
                + '<td>' + esc(t.category || '—') + '</td>'
                + '<td>' + esc(t.version) + '</td>'
                + '<td>' + esc(t.author || '—') + '</td>'
                + '<td class="tpl-admin__actions">'
                + '<button type="button" class="tpl-btn tpl-btn--sm tpl-btn--primary" data-edit="' + t.id + '">Editar</button> '
                + '<button type="button" class="tpl-btn tpl-btn--sm tpl-btn--danger" data-del="' + t.id + '">Excluir</button>'
                + '</td></tr>';
        }).join('');

        app.innerHTML = ''
            + '<div class="tpl-admin__toolbar">'
            + '<button type="button" class="tpl-btn tpl-btn--primary" id="tpl-create">+ Criar Template</button> '
            + '<button type="button" class="tpl-btn tpl-btn--secondary" id="tpl-import">Importar JSON</button>'
            + '</div>'
            + '<div class="tpl-admin__card tpl-admin__card--wide">'
            + '<div class="tpl-admin__card-title">Templates</div>'
            + '<div class="table-responsive"><table class="table tpl-admin__table">'
            + '<thead><tr><th>Id</th><th>Ordem</th><th>Ícone</th><th>Nome</th><th>Categoria</th><th>Versão</th><th>Autor</th><th>Ações</th></tr></thead>'
            + '<tbody>' + (rows || '<tr><td colspan="8" class="text-muted">Nenhum template criado.</td></tr>') + '</tbody>'
            + '</table></div></div>'
            + renderDoc();

        document.getElementById('tpl-create').onclick = function () { openEdit(null); };
        document.getElementById('tpl-import').onclick = importJson;
        app.querySelectorAll('[data-edit]').forEach(function (btn) {
            btn.onclick = function () { loadTemplate(btn.getAttribute('data-edit')); };
        });
        app.querySelectorAll('[data-del]').forEach(function (btn) {
            btn.onclick = function () {
                if (confirm('Excluir este template?')) {
                    api('DELETE', '/templates/' + btn.getAttribute('data-del')).then(loadList);
                }
            };
        });
    }

    function renderDoc() {
        var rows = state.doc.map(function (d) {
            return '<tr><td><code>' + esc(d[0]) + '</code></td><td>' + esc(d[1]) + '</td></tr>';
        }).join('');
        return '<div class="tpl-admin__card tpl-admin__card--wide">'
            + '<div class="tpl-admin__card-title">&lt;&gt; Variáveis disponíveis</div>'
            + '<table class="table tpl-admin__table"><thead><tr><th>Variável</th><th>Descrição</th></tr></thead>'
            + '<tbody>' + rows + '</tbody></table></div>';
    }

    function loadList() {
        Promise.all([
            api('GET', '/templates'),
            api('GET', '/variables-doc'),
            api('GET', '/actions'),
        ]).then(function (res) {
            state.templates = res[0];
            state.doc = res[1];
            state.actions = res[2];
            state.view = 'list';
            renderList();
        }).catch(showError);
    }

    function loadTemplate(id) {
        api('GET', '/templates/' + id).then(function (t) {
            state.template = t;
            state.view = 'edit';
            renderEdit();
        }).catch(showError);
    }

    function openEdit(data) {
        state.template = data || {
            sort_order: 0, name: '', icon_url: '', category: '', description: '',
            full_description: '', password: '', password_description: '',
            version: '1.0.0', author: '', enabled: true, variables: [], steps: [],
        };
        state.view = 'edit';
        renderEdit();
    }

    function renderEdit() {
        var t = state.template;
        var isNew = !t.id;

        app.innerHTML = ''
            + '<div class="tpl-admin__toolbar">'
            + '<button type="button" class="tpl-btn tpl-btn--secondary" id="tpl-back">← Voltar</button> '
            + (!isNew ? '<button type="button" class="tpl-btn tpl-btn--secondary" id="tpl-export">Exportar JSON</button>' : '')
            + '</div>'
            + '<form id="tpl-form" class="tpl-admin__card tpl-admin__card--wide">'
            + '<div class="tpl-admin__card-title">' + (isNew ? 'Criar Template' : 'Editar Template') + '</div>'
            + field('number', 'sort_order', 'Ordem', t.sort_order)
            + field('text', 'name', 'Nome', t.name)
            + field('text', 'icon_url', 'Icon URL', t.icon_url)
            + field('text', 'category', 'Categoria', t.category)
            + field('text', 'version', 'Versão', t.version)
            + field('text', 'author', 'Autor', t.author)
            + field('textarea', 'description', 'Descrição', t.description)
            + field('textarea', 'full_description', 'Descrição completa', t.full_description)
            + field('password', 'password', 'Senha (opcional)', '')
            + field('textarea', 'password_description', 'Descrição da senha', t.password_description)
            + '<label class="tpl-check"><input type="checkbox" name="enabled" ' + (t.enabled !== false ? 'checked' : '') + '> Ativo</label>'
            + '<div class="tpl-admin__form-actions">'
            + '<button type="submit" class="tpl-btn tpl-btn--primary">Salvar</button>'
            + '</div></form>'
            + (isNew ? '' : renderVariables(t) + renderSteps(t));

        document.getElementById('tpl-back').onclick = loadList;
        if (!isNew) {
            document.getElementById('tpl-export').onclick = function () {
                api('GET', '/templates/' + t.id + '/export').then(function (data) {
                    prompt('Copie o JSON:', JSON.stringify(data, null, 2));
                });
            };
        }

        document.getElementById('tpl-form').onsubmit = function (e) {
            e.preventDefault();
            var fd = new FormData(e.target);
            var payload = Object.fromEntries(fd.entries());
            payload.enabled = !!e.target.querySelector('[name=enabled]').checked;
            payload.sort_order = parseInt(payload.sort_order, 10) || 0;
            if (!payload.password) delete payload.password;
            var req = isNew
                ? api('POST', '/templates', payload)
                : api('PATCH', '/templates/' + t.id, payload);
            req.then(function (saved) {
                if (isNew) loadTemplate(saved.id);
                else { state.template = Object.assign({}, t, saved); alert('Salvo!'); }
            }).catch(function (err) { alert(err.message); });
        };

        if (!isNew) bindVarStepHandlers(t);
    }

    function field(type, name, label, value) {
        if (type === 'textarea') {
            return '<label class="tpl-field"><span>' + esc(label) + '</span>'
                + '<textarea name="' + name + '" class="tpl-input" rows="3">' + esc(value) + '</textarea></label>';
        }
        return '<label class="tpl-field"><span>' + esc(label) + '</span>'
            + '<input type="' + type + '" name="' + name + '" class="tpl-input" value="' + esc(value) + '"></label>';
    }

    function renderVariables(t) {
        var rows = (t.variables || []).map(function (v) {
            return '<tr><td>' + v.id + '</td><td>' + v.sort_order + '</td><td>' + esc(v.name) + '</td>'
                + '<td><code>' + esc(v.env_variable) + '</code></td><td>' + esc(v.rules) + '</td>'
                + '<td>' + (v.selectable ? 'Sim' : 'Não') + '</td>'
                + '<td><button type="button" class="tpl-btn tpl-btn--sm tpl-btn--danger" data-rmvar="' + v.id + '">Excluir</button></td></tr>';
        }).join('');
        return '<div class="tpl-admin__card tpl-admin__card--wide">'
            + '<div class="tpl-admin__card-title">Variáveis <button type="button" class="tpl-btn tpl-btn--sm tpl-btn--primary" id="tpl-add-var">+ Criar Variável</button></div>'
            + '<table class="table tpl-admin__table"><thead><tr><th>Id</th><th>Ordem</th><th>Nome</th><th>Variável</th><th>Rules</th><th>Selectable</th><th></th></tr></thead>'
            + '<tbody>' + rows + '</tbody></table></div>';
    }

    function renderSteps(t) {
        var rows = (t.steps || []).map(function (s) {
            var meta = s.file_path ? 'file: ' + s.file_path : '';
            var size = s.content ? s.content.length + ' chars' : '—';
            return '<tr><td>' + s.id + '</td><td>' + s.sort_order + '</td><td>' + esc(state.actions[s.action] || s.action) + '</td>'
                + '<td><code>' + esc(meta) + '</code></td><td>' + size + '</td>'
                + '<td><button type="button" class="tpl-btn tpl-btn--sm tpl-btn--danger" data-rmstep="' + s.id + '">Excluir</button></td></tr>';
        }).join('');
        return '<div class="tpl-admin__card tpl-admin__card--wide">'
            + '<div class="tpl-admin__card-title">Steps <button type="button" class="tpl-btn tpl-btn--sm tpl-btn--primary" id="tpl-add-step">+ Criar Step</button></div>'
            + '<table class="table tpl-admin__table"><thead><tr><th>Id</th><th>Ordem</th><th>Ação</th><th>Metadata</th><th>Conteúdo</th><th></th></tr></thead>'
            + '<tbody>' + rows + '</tbody></table></div>';
    }

    function bindVarStepHandlers(t) {
        var addVar = document.getElementById('tpl-add-var');
        if (addVar) addVar.onclick = function () {
            var name = prompt('Nome da variável:');
            if (!name) return;
            var env = prompt('Variável (ex: include_floodgate):', name.toLowerCase().replace(/\s+/g, '_'));
            api('POST', '/templates/' + t.id + '/variables', {
                sort_order: 0, name: name, env_variable: env,
                description: '', default_value: '', rules: 'nullable|string', selectable: true,
            }).then(function () { loadTemplate(t.id); });
        };
        var addStep = document.getElementById('tpl-add-step');
        if (addStep) addStep.onclick = function () {
            var action = prompt('Ação (write, pull, unzip, delete, power, ...):', 'write');
            if (!action) return;
            var file = prompt('Caminho do arquivo/pasta:', 'plugins/example.jar');
            var content = prompt('Conteúdo/URL:', '');
            api('POST', '/templates/' + t.id + '/steps', {
                sort_order: 0, action: action, file_path: file, content: content || '',
            }).then(function () { loadTemplate(t.id); });
        };
        app.querySelectorAll('[data-rmvar]').forEach(function (btn) {
            btn.onclick = function () {
                api('DELETE', '/templates/' + t.id + '/variables/' + btn.getAttribute('data-rmvar'))
                    .then(function () { loadTemplate(t.id); });
            };
        });
        app.querySelectorAll('[data-rmstep]').forEach(function (btn) {
            btn.onclick = function () {
                api('DELETE', '/templates/' + t.id + '/steps/' + btn.getAttribute('data-rmstep'))
                    .then(function () { loadTemplate(t.id); });
            };
        });
    }

    function importJson() {
        var raw = prompt('Cole o JSON do template:');
        if (!raw) return;
        try {
            var data = JSON.parse(raw);
            api('POST', '/import', { template: data }).then(loadList).catch(function (e) { alert(e.message); });
        } catch (e) {
            alert('JSON inválido');
        }
    }

    function showError(err) {
        app.innerHTML = '<div class="tpl-admin__alert">' + esc(err.message) + '</div>';
    }

    loadList();
})();

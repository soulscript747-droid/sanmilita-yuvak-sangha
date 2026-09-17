// ==================================================
// SANMILITA YUVAK SANGHA - ADMIN DASHBOARD
// ==================================================

const state = {
    performances: []
};

const schemas = {
    events: [
        'name',
        'date',
        'time',
        'venue',
        'description',
        'category',
        'status',
        'poster'
    ],

    gallery: [
        'album',
        'caption',
        'category',
        'image'
    ],

    team: [
        'name',
        'designation',
        'bio',
        'photo'
    ],

    news: [
        'title_as',
        'title_en',
        'date',
        'category',
        'author',
        'image',
        'body_as',
        'body_en',
        'published'
    ]
};

// ==================================================
// HELPERS
// ==================================================

const $ = selector =>
    document.querySelector(selector);

const $$ = selector =>
    [...document.querySelectorAll(selector)];

async function api(url, options = {}) {

    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            ...(options.body
                ? { 'Content-Type': 'application/json' }
                : {}),
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch (_) {}

    if (!response.ok) {
        throw new Error(
            data.error || 'Something went wrong'
        );
    }

    return data;
}

function escapeHTML(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showMessage(message, type = 'success') {

    let box = $('#admin-message');

    if (!box) {

        box = document.createElement('div');

        box.id = 'admin-message';

        Object.assign(box.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            left: '20px',
            zIndex: '99999',
            padding: '14px 18px',
            borderRadius: '10px',
            background: '#222',
            color: '#fff',
            fontSize: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,.2)',
            textAlign: 'center'
        });

        document.body.appendChild(box);
    }

    box.textContent = message;

    box.style.background =
        type === 'error'
            ? '#b42318'
            : '#176b3a';

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {
        if (box) box.remove();
    }, 3000);
}

// ==================================================
// AUTH
// ==================================================

async function checkAuth() {

    try {

        const admin = await api('/api/me');

        showAdmin(admin);

    } catch (error) {

        showLogin();
    }
}

function showLogin() {

    const login = $('#login-page');
    const dashboard = $('#admin-app');

    if (login) {
        login.style.display = 'flex';
    }

    if (dashboard) {
        dashboard.style.display = 'none';
    }
}

function showAdmin(admin) {

    const login = $('#login-page');
    const dashboard = $('#admin-app');

    if (login) {
        login.style.display = 'none';
    }

    if (dashboard) {
        dashboard.style.display = 'block';
    }

    const email = $('#admin-email-display');

    if (email) {
        email.textContent = admin.email || '';
    }

    loadDashboard();
}

// ==================================================
// LOGIN
// ==================================================

document.addEventListener('submit', async event => {

    if (event.target.id !== 'login-form') {
        return;
    }

    event.preventDefault();

    const form = event.target;

    const email =
        form.querySelector('[name="email"]')?.value || '';

    const password =
        form.querySelector('[name="password"]')?.value || '';

    try {

        const result = await api('/api/login', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password
            })
        });

        if (result.ok) {

            showAdmin({
                email
            });
        }

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
});

// ==================================================
// LOGOUT
// ==================================================

async function logout() {

    try {

        await api('/api/logout', {
            method: 'POST'
        });

        location.reload();

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
}

document.addEventListener('click', event => {

    if (
        event.target.closest(
            '[data-action="logout"]'
        )
    ) {
        logout();
    }
});

// ==================================================
// NAVIGATION
// ==================================================

function setupNavigation() {

    $$('[data-view]').forEach(button => {

        button.addEventListener('click', () => {

            const view =
                button.dataset.view;

            $$('[data-view]').forEach(item => {

                item.classList.remove('active');

            });

            button.classList.add('active');

            showView(view);
        });
    });
}

function showView(view) {

    $$('[data-section]').forEach(section => {

        section.style.display = 'none';

    });

    const section =
        document.querySelector(
            `[data-section="${view}"]`
        );

    if (section) {
        section.style.display = 'block';
    }

    if (view === 'dashboard') {
        loadDashboard();
    }

    if (view === 'performances') {
        loadPerformances();
    }

    if (
        view === 'events' ||
        view === 'gallery' ||
        view === 'team' ||
        view === 'news' ||
        view === 'memberships'
    ) {
        loadCrud(view);
    }

    if (view === 'content') {
        loadContent();
    }
}

// ==================================================
// DASHBOARD
// ==================================================

async function loadDashboard() {

    const types = [
        'events',
        'gallery',
        'team',
        'news',
        'memberships'
    ];

    for (const type of types) {

        try {

            const data =
                await api(
                    `/api/admin/${type}`
                );

            const counter =
                document.querySelector(
                    `[data-count="${type}"]`
                );

            if (counter) {
                counter.textContent =
                    Array.isArray(data)
                        ? data.length
                        : 0;
            }

        } catch (_) {}
    }

    try {

        const performances =
            await api(
                '/api/admin/performances'
            );

        const counter =
            document.querySelector(
                '[data-count="performances"]'
            );

        if (counter) {

            counter.textContent =
                Array.isArray(performances)
                    ? performances.length
                    : 0;
        }

    } catch (_) {}
}

// ==================================================
// WEBSITE CONTENT
// ==================================================

async function loadContent() {

    try {

        const content =
            await api('/api/content');

        Object.entries(content).forEach(
            ([key, value]) => {

                const field =
                    document.querySelector(
                        `[name="${key}"]`
                    );

                if (field) {
                    field.value = value;
                }
            }
        );

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
}

async function saveContent() {

    const fields =
        $$('[data-content-field]');

    const data = {};

    fields.forEach(field => {

        if (field.name) {
            data[field.name] =
                field.value;
        }
    });

    try {

        await api('/api/content', {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        showMessage(
            'Website content saved successfully.'
        );

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
}

// ==================================================
// GENERIC CRUD
// ==================================================

async function loadCrud(type) {

    const container =
        document.querySelector(
            `[data-crud="${type}"]`
        );

    if (!container) {
        return;
    }

    try {

        const rows =
            await api(
                `/api/admin/${type}`
            );

        renderCrud(
            type,
            rows,
            container
        );

    } catch (error) {

        container.innerHTML =
            `<p>${escapeHTML(
                error.message
            )}</p>`;
    }
}

function renderCrud(
    type,
    rows,
    container
) {

    const fields =
        schemas[type];

    let html = `
        <div class="admin-crud-header">

            <h2>
                ${escapeHTML(
                    type.charAt(0).toUpperCase() +
                    type.slice(1)
                )}
            </h2>

            <button
                class="admin-btn"
                data-add="${escapeHTML(type)}">
                + Add
            </button>

        </div>
    `;

    if (!rows.length) {

        html += `
            <div class="admin-empty">
                No items yet.
            </div>
        `;

        container.innerHTML = html;

        return;
    }

    html += `
        <div class="admin-table-wrap">

            <table class="admin-table">

                <thead>

                    <tr>

                        <th>ID</th>

                        ${fields.map(
                            field =>
                                `<th>${escapeHTML(field)}</th>`
                        ).join('')}

                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>
    `;

    rows.forEach(row => {

        html += `
            <tr>

                <td>
                    ${escapeHTML(row.id)}
                </td>

                ${fields.map(
                    field => `
                        <td>
                            ${escapeHTML(
                                row[field]
                            )}
                        </td>
                    `
                ).join('')}

                <td>

                    <button
                        class="admin-btn small"
                        data-edit="${escapeHTML(type)}"
                        data-id="${escapeHTML(row.id)}">
                        Edit
                    </button>

                    <button
                        class="admin-btn danger small"
                        data-delete="${escapeHTML(type)}"
                        data-id="${escapeHTML(row.id)}">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    });

    html += `
                </tbody>

            </table>

        </div>
    `;

    container.innerHTML = html;
}

// ==================================================
// GENERIC CRUD BUTTONS
// ==================================================

document.addEventListener('click', event => {

    const add =
        event.target.closest('[data-add]');

    if (add) {

        openCrudForm(
            add.dataset.add
        );

        return;
    }

    const edit =
        event.target.closest('[data-edit]');

    if (edit) {

        openCrudEdit(
            edit.dataset.edit,
            edit.dataset.id
        );

        return;
    }

    const del =
        event.target.closest('[data-delete]');

    if (del) {

        deleteCrud(
            del.dataset.delete,
            del.dataset.id
        );
    }
});

function openCrudForm(type) {

    const fields =
        schemas[type];

    const values = {};

    fields.forEach(field => {

        values[field] = '';

    });

    showCrudModal(
        type,
        values
    );
}

async function openCrudEdit(type, id) {

    try {

        const rows =
            await api(
                `/api/admin/${type}`
            );

        const row =
            rows.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (!row) {

            throw new Error(
                'Item not found'
            );
        }

        showCrudModal(
            type,
            row
        );

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
}

function showCrudModal(type, row) {

    const fields =
        schemas[type];

    const modal =
        document.createElement('div');

    modal.className =
        'admin-modal';

    modal.innerHTML = `
        <div class="admin-modal-box">

            <div class="admin-modal-header">

                <h3>
                    ${row.id ? 'Edit' : 'Add'}
                    ${escapeHTML(type)}
                </h3>

                <button
                    type="button"
                    class="modal-close">
                    ×
                </button>

            </div>

            <form class="crud-form">

                ${fields.map(
                    field => `
                        <label>

                            ${escapeHTML(field)}

                            <input
                                name="${escapeHTML(field)}"
                                value="${escapeHTML(
                                    row[field] || ''
                                )}">

                        </label>
                    `
                ).join('')}

                <button
                    type="submit"
                    class="admin-btn">
                    Save
                </button>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(
        '.modal-close'
    ).onclick = () =>
        modal.remove();

    modal.querySelector(
        '.crud-form'
    ).onsubmit = async event => {

        event.preventDefault();

        const data = {};

        fields.forEach(field => {

            data[field] =
                event.target
                    .elements[field]
                    .value;

        });

        try {

            if (row.id) {

                await api(
                    `/api/${type}/${row.id}`,
                    {
                        method: 'PUT',
                        body:
                            JSON.stringify(data)
                    }
                );

            } else {

                await api(
                    `/api/${type}`,
                    {
                        method: 'POST',
                        body:
                            JSON.stringify(data)
                    }
                );
            }

            modal.remove();

            showMessage(
                'Saved successfully.'
            );

            loadCrud(type);

        } catch (error) {

            showMessage(
                error.message,
                'error'
            );
        }
    };
}

async function deleteCrud(type, id) {

    if (
        !confirm(
            'Are you sure you want to delete this item?'
        )
    ) {
        return;
    }

    try {

        await api(
            `/api/${type}/${id}`,
            {
                method: 'DELETE'
            }
        );

        showMessage(
            'Deleted successfully.'
        );

        loadCrud(type);

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
}

// ==================================================
// FEATURED PERFORMANCES
// ==================================================

async function loadPerformances() {

    const container =
        document.querySelector(
            '[data-crud="performances"]'
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="admin-loading">
            Loading Featured Performances...
        </div>
    `;

    try {

        state.performances =
            await api(
                '/api/admin/performances'
            );

        if (!Array.isArray(state.performances)) {

            throw new Error(
                'Invalid performances response'
            );
        }

        renderPerformances(
            container
        );

    } catch (error) {

        container.innerHTML = `
            <div class="admin-empty">

                <h3>
                    Unable to load Featured Performances
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;
    }
}

// ==================================================
// RENDER PERFORMANCES
// ==================================================

function renderPerformances(container) {

    let html = `
        <div class="performance-admin-header">

            <div>

                <h2>
                    Featured Performances
                </h2>

                <p>
                    Manage performances
                    and their photos.
                </p>

            </div>

            <button
                class="admin-btn"
                id="add-performance">
                + Add Performance
            </button>

        </div>
    `;

    if (!state.performances.length) {

        html += `
            <div class="admin-empty">

                <h3>
                    No performances yet.
                </h3>

                <p>
                    Add your first Featured Performance.
                </p>

                <button
                    class="admin-btn"
                    id="add-performance-empty">
                    + Add Performance
                </button>

            </div>
        `;

        container.innerHTML =
            html;

        bindPerformanceAddButtons();

        return;
    }

    html += `
        <div class="performance-list">
    `;

    state.performances.forEach(
        (performance, index) => {

            const photos =
                Array.isArray(
                    performance.photos
                )
                    ? performance.photos
                    : [];

            html += `
                <article
                    class="performance-admin-card">

                    <div class="performance-admin-top">

                        <div>

                            <span class="performance-number">
                                ${index + 1}
                            </span>

                            <h3>
                                ${escapeHTML(
                                    performance.title
                                )}
                            </h3>

                            ${
                                performance.description
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                performance.description
                                            )}
                                        </p>
                                    `
                                    : ''
                            }

                        </div>

                        <div class="performance-actions">

                            <button
                                class="admin-btn small"
                                data-performance-edit="${performance.id}">
                                Edit
                            </button>

                            <button
                                class="admin-btn danger small"
                                data-performance-delete="${performance.id}">
                                Delete
                            </button>

                        </div>

                    </div>

                    <div class="performance-photo-header">

                        <div>
                            <strong>
                                Photos
                            </strong>

                            <span>
                                ${photos.length}
                            </span>
                        </div>

                        <button
                            class="admin-btn small"
                            data-performance-photos="${performance.id}">
                            + Add Photos
                        </button>

                    </div>

                    ${
                        photos.length
                            ? `
                                <div class="performance-photo-grid">

                                    ${photos.map(
                                        photo => `
                                            <div
                                                class="performance-photo-item">

                                                <img
                                                    src="${escapeHTML(
                                                        photo.image
                                                    )}"
                                                    alt="${escapeHTML(
                                                        photo.caption ||
                                                        performance.title
                                                    )}">

                                                <button
                                                    type="button"
                                                    class="photo-delete-btn"
                                                    data-performance-photo-delete="${photo.id}">
                                                    ×
                                                </button>

                                            </div>
                                        `
                                    ).join('')}

                                </div>
                            `
                            : `
                                <div class="admin-empty small-empty">
                                    No photos added yet.
                                </div>
                            `
                    }

                </article>
            `;
        }
    );

    html += `
        </div>
    `;

    container.innerHTML =
        html;

    bindPerformanceAddButtons();
}

// ==================================================
// ADD PERFORMANCE BUTTONS
// ==================================================

function bindPerformanceAddButtons() {

    const addButton =
        $('#add-performance');

    const emptyButton =
        $('#add-performance-empty');

    if (addButton) {

        addButton.onclick = () =>
            openPerformanceForm();
    }

    if (emptyButton) {

        emptyButton.onclick = () =>
            openPerformanceForm();
    }
}

// ==================================================
// PERFORMANCE FORM
// ==================================================

function openPerformanceForm(
    performance = null
) {

    const modal =
        document.createElement('div');

    modal.className =
        'admin-modal';

    modal.innerHTML = `
        <div class="admin-modal-box">

            <div class="admin-modal-header">

                <h3>
                    ${
                        performance
                            ? 'Edit Performance'
                            : 'Add Performance'
                    }
                </h3>

                <button
                    type="button"
                    class="modal-close">
                    ×
                </button>

            </div>

            <form id="performance-form">

                <label>
                    Performance Title

                    <input
                        name="title"
                        required
                        value="${escapeHTML(
                            performance?.title || ''
                        )}"
                        placeholder="e.g. হয়গ্ৰীব শঙ্খগ্ৰীব বধ">
                </label>

                <label>
                    Description

                    <textarea
                        name="description"
                        rows="4"
                        placeholder="Optional description">${escapeHTML(
                            performance?.description || ''
                        )}</textarea>
                </label>

                <label>
                    Sort Order

                    <input
                        type="number"
                        name="sort_order"
                        value="${escapeHTML(
                            performance?.sort_order ?? 0
                        )}">
                </label>

                <button
                    type="submit"
                    class="admin-btn">
                    Save Performance
                </button>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(
        '.modal-close'
    ).onclick = () =>
        modal.remove();

    modal.querySelector(
        '#performance-form'
    ).onsubmit = async event => {

        event.preventDefault();

        const form =
            event.target;

        const data = {
            title:
                form.elements.title.value.trim(),

            description:
                form.elements.description.value.trim(),

            sort_order:
                Number(
                    form.elements.sort_order.value || 0
                )
        };

        try {

            if (performance?.id) {

                await api(
                    `/api/admin/performances/${performance.id}`,
                    {
                        method: 'PUT',
                        body:
                            JSON.stringify(data)
                    }
                );

            } else {

                await api(
                    '/api/admin/performances',
                    {
                        method: 'POST',
                        body:
                            JSON.stringify(data)
                    }
                );
            }

            modal.remove();

            showMessage(
                'Performance saved successfully.'
            );

            loadPerformances();

        } catch (error) {

            showMessage(
                error.message,
                'error'
            );
        }
    };
}

// ==================================================
// EDIT PERFORMANCE
// ==================================================

async function editPerformance(id) {

    try {

        const performance =
            state.performances.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (!performance) {

            throw new Error(
                'Performance not found'
            );
        }

        openPerformanceForm(
            performance
        );

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
}

// ==================================================
// DELETE PERFORMANCE
// ==================================================

async function deletePerformance(id) {

    if (
        !confirm(
            'Delete this performance and all its photos?'
        )
    ) {
        return;
    }

    try {

        await api(
            `/api/admin/performances/${id}`,
            {
                method: 'DELETE'
            }
        );

        showMessage(
            'Performance deleted successfully.'
        );

        loadPerformances();

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
}

// ==================================================
// PERFORMANCE CLICK ACTIONS
// ==================================================

document.addEventListener(
    'click',
    event => {

        const edit =
            event.target.closest(
                '[data-performance-edit]'
            );

        if (edit) {

            editPerformance(
                edit.dataset.performanceEdit
            );

            return;
        }

        const del =
            event.target.closest(
                '[data-performance-delete]'
            );

        if (del) {

            deletePerformance(
                del.dataset.performanceDelete
            );

            return;
        }

        const photos =
            event.target.closest(
                '[data-performance-photos]'
            );

        if (photos) {

            addPerformancePhotos(
                photos.dataset.performancePhotos
            );

            return;
        }

        const photoDelete =
            event.target.closest(
                '[data-performance-photo-delete]'
            );

        if (photoDelete) {

            deletePerformancePhoto(
                photoDelete.dataset
                    .performancePhotoDelete
            );
        }
    }
);

// ==================================================
// ADD PERFORMANCE PHOTOS
// ==================================================

function addPerformancePhotos(
    performanceId
) {

    const input =
        document.createElement('input');

    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.display = 'none';

    document.body.appendChild(input);

    input.onchange = async () => {

        const files =
            [...input.files];

        if (!files.length) {

            input.remove();

            return;
        }

        try {

            showMessage(
                `Uploading ${files.length} photo(s)...`
            );

            for (const file of files) {

                const formData =
                    new FormData();

                formData.append(
                    'image',
                    file
                );

                const uploadResponse =
                    await fetch(
                        '/api/upload',
                        {
                            method: 'POST',
                            credentials:
                                'same-origin',
                            body: formData
                        }
                    );

                let uploadData = {};

                try {

                    uploadData =
                        await uploadResponse.json();

                } catch (_) {}

                if (!uploadResponse.ok) {

                    throw new Error(
                        uploadData.error ||
                        `Failed to upload ${file.name}`
                    );
                }

                if (!uploadData.url) {

                    throw new Error(
                        `Upload failed for ${file.name}`
                    );
                }

                await api(
                    `/api/admin/performances/${performanceId}/photos`,
                    {
                        method: 'POST',
                        body:
                            JSON.stringify({
                                image:
                                    uploadData.url,
                                caption:
                                    file.name
                            })
                    }
                );
            }

            showMessage(
                'Photos uploaded successfully.'
            );

            loadPerformances();

        } catch (error) {

            showMessage(
                error.message,
                'error'
            );

        } finally {

            input.remove();
        }
    };

    input.click();
}

// ==================================================
// DELETE PERFORMANCE PHOTO
// ==================================================

async function deletePerformancePhoto(
    photoId
) {

    if (
        !confirm(
            'Delete this photo?'
        )
    ) {
        return;
    }

    try {

        await api(
            `/api/admin/performance-photos/${photoId}`,
            {
                method: 'DELETE'
            }
        );

        showMessage(
            'Photo deleted successfully.'
        );

        loadPerformances();

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
}

// ==================================================
// INITIALIZE
// ==================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        setupNavigation();

        checkAuth();

    }
);

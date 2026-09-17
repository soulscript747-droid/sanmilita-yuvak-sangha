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

async function api(
    url,
    options = {}
) {
    const response =
        await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers: {
                'Content-Type':
                    'application/json',
                ...(options.headers || {})
            }
        });

    let data = {};

    try {
        data = await response.json();
    } catch (_) {}

    if (!response.ok) {
        throw new Error(
            data.error ||
            'Something went wrong'
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

function showMessage(
    message,
    type = 'success'
) {
    let box =
        $('#admin-message');

    if (!box) {
        box = document.createElement('div');
        box.id = 'admin-message';

        Object.assign(
            box.style,
            {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '99999',
                padding: '14px 18px',
                borderRadius: '10px',
                background: '#222',
                color: '#fff',
                fontSize: '14px',
                boxShadow:
                    '0 10px 30px rgba(0,0,0,.2)'
            }
        );

        document.body.appendChild(box);
    }

    box.textContent = message;

    box.style.background =
        type === 'error'
            ? '#b42318'
            : '#176b3a';

    clearTimeout(
        box._timer
    );

    box._timer =
        setTimeout(() => {
            box.remove();
        }, 3000);
}

// ==================================================
// AUTH
// ==================================================

async function checkAuth() {
    try {

        const admin =
            await api('/api/me');

        showAdmin(
            admin
        );

    } catch (error) {

        showLogin();
    }
}

function showLogin() {

    const login =
        $('#login-page');

    const dashboard =
        $('#admin-app');

    if (login) {
        login.style.display =
            'flex';
    }

    if (dashboard) {
        dashboard.style.display =
            'none';
    }
}

function showAdmin(admin) {

    const login =
        $('#login-page');

    const dashboard =
        $('#admin-app');

    if (login) {
        login.style.display =
            'none';
    }

    if (dashboard) {
        dashboard.style.display =
            'block';
    }

    const email =
        $('#admin-email-display');

    if (email) {
        email.textContent =
            admin.email || '';
    }

    loadDashboard();
}

// ==================================================
// LOGIN FORM
// ==================================================

document.addEventListener(
    'submit',
    async event => {

        if (
            event.target.id !==
            'login-form'
        ) {
            return;
        }

        event.preventDefault();

        const form =
            event.target;

        const email =
            form.querySelector(
                '[name="email"]'
            )?.value || '';

        const password =
            form.querySelector(
                '[name="password"]'
            )?.value || '';

        try {

            const result =
                await api(
                    '/api/login',
                    {
                        method: 'POST',
                        body:
                            JSON.stringify({
                                email,
                                password
                            })
                    }
                );

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
    }
);

// ==================================================
// LOGOUT
// ==================================================

async function logout() {

    try {

        await api(
            '/api/logout',
            {
                method: 'POST'
            }
        );

        location.reload();

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
}

document.addEventListener(
    'click',
    event => {

        if (
            event.target.closest(
                '[data-action="logout"]'
            )
        ) {
            logout();
        }
    }
);

// ==================================================
// SIDEBAR / VIEWS
// ==================================================

function setupNavigation() {

    $$('[data-view]').forEach(
        button => {

            button.addEventListener(
                'click',
                () => {

                    const view =
                        button.dataset.view;

                    $$('[data-view]')
                        .forEach(
                            item =>
                                item.classList
                                    .remove(
                                        'active'
                                    )
                        );

                    button.classList.add(
                        'active'
                    );

                    showView(
                        view
                    );
                }
            );
        }
    );
}

function showView(view) {

    $$('[data-section]').forEach(
        section => {

            section.style.display =
                'none';
        }
    );

    const section =
        document.querySelector(
            `[data-section="${view}"]`
        );

    if (section) {
        section.style.display =
            'block';
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

    for (
        const type of types
    ) {

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
                    data.length;
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
                performances.length;
        }

    } catch (_) {}
}

// ==================================================
// CONTENT
// ==================================================

async function loadContent() {

    try {

        const content =
            await api(
                '/api/content'
            );

        Object.entries(
            content
        ).forEach(
            ([key, value]) => {

                const field =
                    document.querySelector(
                        `[name="${key}"]`
                    );

                if (field) {
                    field.value =
                        value;
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

    fields.forEach(
        field => {

            if (field.name) {
                data[field.name] =
                    field.value;
            }
        }
    );

    try {

        await api(
            '/api/content',
            {
                method: 'PUT',
                body:
                    JSON.stringify(data)
            }
        );

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
                    type.charAt(0)
                        .toUpperCase() +
                    type.slice(1)
                )}
            </h2>

            <button
                class="admin-btn"
                data-add="${type}">
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

        container.innerHTML =
            html;

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

    rows.forEach(
        row => {

            html += `
                <tr>
                    <td>${row.id}</td>

                    ${fields.map(
                        field => `
                        <td>
                            ${escapeHTML(
                                row[field]
                            )}
                        </td>
                    `).join('')}

                    <td>
                        <button
                            class="admin-btn small"
                            data-edit="${type}"
                            data-id="${row.id}">
                            Edit
                        </button>

                        <button
                            class="admin-btn danger small"
                            data-delete="${type}"
                            data-id="${row.id}">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }
    );

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML =
        html;
}

// ==================================================
// GENERIC CRUD BUTTONS
// ==================================================

document.addEventListener(
    'click',
    event => {

        const add =
            event.target.closest(
                '[data-add]'
            );

        if (add) {

            openCrudForm(
                add.dataset.add
            );

            return;
        }

        const edit =
            event.target.closest(
                '[data-edit]'
            );

        if (edit) {

            openCrudEdit(
                edit.dataset.edit,
                edit.dataset.id
            );

            return;
        }

        const del =
            event.target.closest(
                '[data-delete]'
            );

        if (del) {

            deleteCrud(
                del.dataset.delete,
                del.dataset.id
            );
        }
    }
);

function openCrudForm(type) {

    const fields =
        schemas[type];

    const values =
        {};

    fields.forEach(
        field => {
            values[field] = '';
        }
    );

    showCrudModal(
        type,
        values
    );
}

async function openCrudEdit(
    type,
    id
) {

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

function showCrudModal(
    type,
    row
) {

    const fields =
        schemas[type];

    const modal =
        document.createElement(
            'div'
        );

    modal.className =
        'admin-modal';

    modal.innerHTML = `
        <div class="admin-modal-box">

            <div class="admin-modal-header">
                <h3>
                    ${row.id
                        ? 'Edit'
                        : 'Add'}
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
                `).join('')}

                <button
                    type="submit"
                    class="admin-btn">
                    Save
                </button>

            </form>
        </div>
    `;

    document.body.appendChild(
        modal
    );

    modal.querySelector(
        '.modal-close'
    ).onclick = () =>
        modal.remove();

    modal.querySelector(
        '.crud-form'
    ).onsubmit = async event => {

        event.preventDefault();

        const data = {};

        fields.forEach(
            field => {

                data[field] =
                    event.target
                        .elements[field]
                        .value;
            }
        );

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

async function deleteCrud(
    type,
    id
) {

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

        renderPerformances(
            container
        );

    } catch (error) {

        container.innerHTML = `
            <div class="admin-empty">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;
    }
}

function renderPerformances(
    container
) {

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

    if (
        !state.performances.length
    ) {

        html += `
            <div class="admin-empty">
                <h3>
                    No performances yet.
                </h3>

                <p>
                    Add your first
                    Featured Performance.
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

            html += `
                <article
                    class="performance-admin-card">

                    <div class="performance-admin-info">

                        <div>
                            <span class="performance-number">
                                ${index + 1}
                            </span>

                            <div>
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

                                <small>
                                    ${
                                        performance.photos
                                            ?.length || 0
                                    }
                                    photo(s)
                                </small>
                            </div>
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

                            <button
                                class="admin-btn small"
                                data-performance-add-photo="${performance.id}">
                                + Add Photos
                            </button>

                        </div>

                    </div>

                    <div class="performance-photos">

                        ${
                            performance.photos?.length
                            ? performance.photos.map(
                                photo => `
                                <div
                                    class="performance-photo">

                                    <img
                                        src="${escapeHTML(
                                            photo.image
                                        )}"
                                        alt="${escapeHTML(
                                            performance.title
                                        )}"
                                        loading="lazy">

                                    <button
                                        class="photo-delete"
                                        data-photo-delete="${photo.id}">
                                        ×
                                    </button>

                                </div>
                            `
                            ).join('')
                            : `
                                <div class="no-photos">
                                    No photos added yet.
                                </div>
                            `
                        }

                    </div>

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

function bindPerformanceAddButtons() {

    const buttons = [
        '#add-performance',
        '#add-performance-empty'
    ];

    buttons.forEach(
        selector => {

            const button =
                document.querySelector(
                    selector
                );

            if (button) {

                button.onclick =
                    () =>
                        openPerformanceModal();
            }
        }
    );
}

// ==================================================
// PERFORMANCE ACTIONS
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

        const addPhotos =
            event.target.closest(
                '[data-performance-add-photo]'
            );

        if (addPhotos) {

            openPhotoUploader(
                addPhotos.dataset
                    .performanceAddPhoto
            );

            return;
        }

        const deletePhoto =
            event.target.closest(
                '[data-photo-delete]'
            );

        if (deletePhoto) {

            deletePerformancePhoto(
                deletePhoto.dataset
                    .photoDelete
            );
        }
    }
);

// ==================================================
// ADD PERFORMANCE
// ==================================================

function openPerformanceModal(
    existing = null
) {

    const modal =
        document.createElement(
            'div'
        );

    modal.className =
        'admin-modal';

    modal.innerHTML = `
        <div class="admin-modal-box">

            <div class="admin-modal-header">

                <h3>
                    ${
                        existing
                        ? 'Edit Performance'
                        : 'Add Performance'
                    }
                </h3>

                <button
                    class="modal-close">
                    ×
                </button>

            </div>

            <form
                id="performance-form">

                <label>
                    Performance Title

                    <input
                        name="title"
                        required
                        value="${escapeHTML(
                            existing?.title || ''
                        )}">
                </label>

                <label>
                    Description

                    <textarea
                        name="description"
                        rows="4"
                    >${escapeHTML(
                        existing?.description || ''
                    )}</textarea>
                </label>

                <label>
                    Display Order

                    <input
                        type="number"
                        name="sort_order"
                        value="${existing
                            ? existing.sort_order
                            : state.performances.length + 1}">
                </label>

                <button
                    type="submit"
                    class="admin-btn">
                    Save Performance
                </button>

            </form>

        </div>
    `;

    document.body.appendChild(
        modal
    );

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
                form.title.value,

            description:
                form.description.value,

            sort_order:
                Number(
                    form.sort_order.value
                ) || 0
        };

        try {

            if (existing) {

                await api(
                    `/api/admin/performances/${existing.id}`,
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

function editPerformance(id) {

    const performance =
        state.performances.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!performance) {
        return;
    }

    openPerformanceModal(
        performance
    );
}

// ==================================================
// DELETE PERFORMANCE
// ==================================================

async function deletePerformance(
    id
) {

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
            'Performance deleted.'
        );

        loadPerformances();
        loadDashboard();

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );
    }
}

// ==================================================
// PHOTO UPLOADER
// ==================================================

function openPhotoUploader(
    performanceId
) {

    const modal =
        document.createElement(
            'div'
        );

    modal.className =
        'admin-modal';

    modal.innerHTML = `
        <div class="admin-modal-box">

            <div class="admin-modal-header">

                <h3>
                    Add Performance Photos
                </h3>

                <button
                    class="modal-close">
                    ×
                </button>

            </div>

            <form
                id="photo-upload-form">

                <label>
                    Select Photos

                    <input
                        id="performance-photo-files"
                        type="file"
                        accept="image/*"
                        multiple
                        required>
                </label>

                <div
                    id="photo-upload-status">
                </div>

                <button
                    type="submit"
                    class="admin-btn">
                    Upload Photos
                </button>

            </form>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    modal.querySelector(
        '.modal-close'
    ).onclick = () =>
        modal.remove();

    modal.querySelector(
        '#photo-upload-form'
    ).onsubmit = async event => {

        event.preventDefault();

        const input =
            document.querySelector(
                '#performance-photo-files'
            );

        const files =
            [...input.files];

        if (!files.length) {
            return;
        }

        const status =
            document.querySelector(
                '#photo-upload-status'
            );

        status.textContent =
            `Uploading 0/${files.length}...`;

        try {

            for (
                let i = 0;
                i < files.length;
                i++
            ) {

                const file =
                    files[i];

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
                            body:
                                formData
                        }
                    );

                const uploadData =
                    await uploadResponse.json();

                if (
                    !uploadResponse.ok
                ) {
                    throw new Error(
                        uploadData.error ||
                        'Upload failed'
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
                                    '',

                                sort_order:
                                    i
                            })
                    }
                );

                status.textContent =
                    `Uploading ${
                        i + 1
                    }/${files.length}...`;
            }

            modal.remove();

            showMessage(
                `${files.length} photo(s) uploaded successfully.`
            );

            loadPerformances();

        } catch (error) {

            status.textContent =
                error.message;

            showMessage(
                error.message,
                'error'
            );
        }
    };
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
            'Photo deleted.'
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
// SAVE CONTENT BUTTON
// ==================================================

document.addEventListener(
    'click',
    event => {

        if (
            event.target.closest(
                '[data-save-content]'
            )
        ) {
            saveContent();
        }
    }
);

// ==================================================
// INITIALIZATION
// ==================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        setupNavigation();

        checkAuth();

        // Open dashboard initially
        const dashboardButton =
            document.querySelector(
                '[data-view="dashboard"]'
            );

        if (dashboardButton) {
            dashboardButton.classList.add(
                'active'
            );
        }
    }
);

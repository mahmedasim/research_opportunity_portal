/**
 * Main application logic for the University Research Opportunity Portal frontend.
 * Manages UI rendering, DOM events, loading states, form validation, modals, and CRUD workflows.
 */

// Global modal instance references
let detailsModalInstance = null;
let formModalInstance = null;
let confirmationModalInstance = null;

// Track active record in details view
let currentViewedOpportunityId = null;

// Track pending confirmation callback
let pendingConfirmationAction = null;

// Track auto-dismiss alert timer
let alertTimeoutId = null;

/**
 * Displays a dismissible Bootstrap alert message at the top of the page.
 * Safely sets the message using textContent to prevent XSS.
 * Success alerts automatically dismiss after 4 seconds.
 *
 * @param {string} message - The message text to display.
 * @param {string} [type='danger'] - Bootstrap alert color variant ('success', 'danger', 'warning', 'info').
 */
function showAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    // Clear any active auto-dismiss timer
    if (alertTimeoutId) {
        clearTimeout(alertTimeoutId);
        alertTimeoutId = null;
    }

    // Clear previous alert elements
    alertContainer.innerHTML = '';

    // Create the alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
    alertDiv.setAttribute('role', 'alert');

    // Message text added safely via textContent
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    alertDiv.appendChild(messageSpan);

    // Dismiss button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'alert');
    closeBtn.setAttribute('aria-label', 'Close');
    alertDiv.appendChild(closeBtn);

    alertContainer.appendChild(alertDiv);

    // Auto-dismiss success notifications after 4 seconds
    if (type === 'success') {
        alertTimeoutId = setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => {
                alertDiv.remove();
            }, 150);
        }, 4000);
    }
}

/**
 * Displays an alert specifically inside the opportunity form modal.
 *
 * @param {string} message - Error or warning text.
 * @param {string} [type='danger'] - Bootstrap alert variant.
 */
function setModalAlert(message, type = 'danger') {
    const container = document.getElementById('modal-form-alert');
    if (!container) return;

    container.innerHTML = '';
    if (!message) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} py-2 small mb-0 shadow-sm`;
    alertDiv.textContent = message;
    container.appendChild(alertDiv);
}

/**
 * Clears all validation states, error highlights, and feedback messages from the form.
 */
function clearFormErrors() {
    setModalAlert('');
    const form = document.getElementById('opportunityForm');
    if (!form) return;

    const inputs = form.querySelectorAll('.form-control, .form-select');
    inputs.forEach(input => {
        input.classList.remove('is-invalid');
    });

    const feedbacks = form.querySelectorAll('.invalid-feedback');
    feedbacks.forEach(fb => {
        fb.textContent = '';
    });
}

/**
 * Highlights a specific field as invalid and sets its feedback message.
 *
 * @param {string} fieldId - ID of the form input field.
 * @param {string} message - Validation error description.
 */
function setFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (input) {
        input.classList.add('is-invalid');
    }

    const feedback = document.getElementById(`feedback-${fieldId}`);
    if (feedback) {
        feedback.textContent = message;
    }
}

/**
 * Validates form inputs on the client side according to API specifications.
 *
 * @param {Object} data - Extracted form field values.
 * @returns {Object} Object mapping field names to error messages (empty if valid).
 */
function validateOpportunityForm(data) {
    const errors = {};

    // 1. Title (required, non-blank, max 200)
    if (!data.title) {
        errors.title = 'Research Title is required.';
    } else if (data.title.length > 200) {
        errors.title = 'Title cannot exceed 200 characters.';
    }

    // 2. Description (required, non-blank)
    if (!data.description) {
        errors.description = 'Research Description is required.';
    }

    // 3. Research Area (required, non-blank, max 100)
    if (!data.research_area) {
        errors.research_area = 'Research Area is required.';
    } else if (data.research_area.length > 100) {
        errors.research_area = 'Research Area cannot exceed 100 characters.';
    }

    // 4. Faculty Name (required, non-blank, max 100)
    if (!data.faculty_name) {
        errors.faculty_name = "Faculty Member's Name is required.";
    } else if (data.faculty_name.length > 100) {
        errors.faculty_name = 'Faculty Name cannot exceed 100 characters.';
    }

    // 5. Department (required, non-blank, max 100)
    if (!data.department) {
        errors.department = 'Department is required.';
    } else if (data.department.length > 100) {
        errors.department = 'Department cannot exceed 100 characters.';
    }

    // 6. Required Skills (required, non-blank, max 500)
    if (!data.required_skills) {
        errors.required_skills = 'Required Skills are required.';
    } else if (data.required_skills.length > 500) {
        errors.required_skills = 'Required Skills cannot exceed 500 characters.';
    }

    // 7. Available Positions (required, whole number >= 1)
    const rawPositions = data.available_positions;
    if (!rawPositions) {
        errors.available_positions = 'Number of available positions is required.';
    } else {
        const parsedPositions = Number(rawPositions);
        if (!Number.isInteger(parsedPositions) || parsedPositions < 1) {
            errors.available_positions = 'Available positions must be a whole number of at least 1.';
        }
    }

    // 8. Application Deadline (required, valid YYYY-MM-DD date)
    if (!data.application_deadline) {
        errors.application_deadline = 'Application Deadline is required.';
    } else {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.application_deadline)) {
            errors.application_deadline = 'Deadline must be in YYYY-MM-DD format.';
        } else {
            const parsedDate = new Date(data.application_deadline);
            if (isNaN(parsedDate.getTime())) {
                errors.application_deadline = 'Please enter a valid calendar date.';
            }
        }
    }

    // 9. Status (optional, must be Open or Closed if provided)
    if (data.status && !['Open', 'Closed'].includes(data.status)) {
        errors.status = 'Status must be either Open or Closed.';
    }

    return errors;
}

/**
 * Toggles the loading spinner and visibility of the cards container.
 *
 * @param {boolean} isLoading - True to display the spinner; false to hide it.
 */
function setLoading(isLoading) {
    const spinner = document.getElementById('loading-spinner');
    const container = document.getElementById('opportunities-container');
    const emptyState = document.getElementById('empty-state');

    if (spinner) {
        spinner.classList.toggle('d-none', !isLoading);
    }

    if (isLoading) {
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.add('d-none');
    }
}

/**
 * Opens a reusable confirmation modal with customizable text and action callback.
 *
 * @param {Object} options - Configuration object { title, message, confirmBtnText, confirmBtnClass, onConfirm }.
 */
function showConfirmationModal({ title, message, confirmBtnText, confirmBtnClass, onConfirm }) {
    document.getElementById('confirmationModalLabel').textContent = title || 'Confirm Action';
    document.getElementById('confirmationModalMessage').textContent = message || '';

    const confirmBtn = document.getElementById('btn-confirm-action');
    confirmBtn.className = `btn btn-sm fw-semibold ${confirmBtnClass || 'btn-primary'}`;
    confirmBtn.textContent = confirmBtnText || 'Confirm';
    confirmBtn.disabled = false;

    pendingConfirmationAction = onConfirm;

    const modalEl = document.getElementById('confirmationModal');
    if (!confirmationModalInstance) {
        confirmationModalInstance = new bootstrap.Modal(modalEl);
    }
    confirmationModalInstance.show();
}

/**
 * Safely creates and returns a Bootstrap card element for a research opportunity.
 * Uses safe DOM methods (createElement, textContent) to prevent XSS vulnerabilities.
 *
 * @param {Object} opp - Research opportunity record from the backend.
 * @returns {HTMLElement} The column element containing the opportunity card.
 */
function createOpportunityCard(opp) {
    // Outer responsive grid column
    const col = document.createElement('div');
    col.className = 'col';

    // Card container
    const card = document.createElement('div');
    card.className = 'card h-100 shadow-sm border-0 opportunity-card bg-white';

    // Card body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column p-4';

    // Top badges row (Status and Research Area)
    const badgeRow = document.createElement('div');
    badgeRow.className = 'd-flex justify-content-between align-items-center mb-2';

    // Status Badge: green if Open, secondary (grey) if Closed
    const statusBadge = document.createElement('span');
    const isOpen = opp.status === 'Open';
    statusBadge.className = `badge ${isOpen ? 'bg-success' : 'bg-secondary'}`;
    statusBadge.textContent = opp.status || 'Open';

    // Research Area Badge
    const areaBadge = document.createElement('span');
    areaBadge.className = 'badge bg-light text-primary border text-truncate';
    areaBadge.style.maxWidth = '60%';
    areaBadge.textContent = opp.research_area || 'General';

    badgeRow.appendChild(statusBadge);
    badgeRow.appendChild(areaBadge);
    cardBody.appendChild(badgeRow);

    // Title
    const title = document.createElement('h5');
    title.className = 'card-title fw-bold text-dark mt-2 mb-2';
    title.textContent = opp.title || 'Untitled Opportunity';
    cardBody.appendChild(title);

    // Faculty & Department
    const facultyInfo = document.createElement('p');
    facultyInfo.className = 'text-muted small mb-3';
    facultyInfo.textContent = `${opp.faculty_name || 'Faculty'} • ${opp.department || 'Department'}`;
    cardBody.appendChild(facultyInfo);

    // Meta details (Positions & Deadline)
    const metaContainer = document.createElement('div');
    metaContainer.className = 'bg-light p-2 rounded mb-3 small';

    const positionsRow = document.createElement('div');
    positionsRow.className = 'd-flex justify-content-between text-secondary mb-1';
    const positionsLabel = document.createElement('span');
    positionsLabel.textContent = 'Positions:';
    const positionsValue = document.createElement('span');
    positionsValue.className = 'fw-semibold text-dark';
    positionsValue.textContent = opp.available_positions !== undefined ? `${opp.available_positions}` : 'N/A';
    positionsRow.appendChild(positionsLabel);
    positionsRow.appendChild(positionsValue);

    const deadlineRow = document.createElement('div');
    deadlineRow.className = 'd-flex justify-content-between text-secondary';
    const deadlineLabel = document.createElement('span');
    deadlineLabel.textContent = 'Deadline:';
    const deadlineValue = document.createElement('span');
    deadlineValue.className = 'fw-semibold text-dark';
    deadlineValue.textContent = opp.application_deadline || 'N/A';
    deadlineRow.appendChild(deadlineLabel);
    deadlineRow.appendChild(deadlineValue);

    metaContainer.appendChild(positionsRow);
    metaContainer.appendChild(deadlineRow);
    cardBody.appendChild(metaContainer);

    // Action buttons container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'mt-auto pt-3 border-top';

    // Row 1: View Details & Edit
    const row1 = document.createElement('div');
    row1.className = 'd-flex gap-2 mb-2';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-outline-primary btn-sm flex-fill fw-semibold';
    viewBtn.textContent = 'View Details';
    viewBtn.addEventListener('click', () => handleViewDetails(opp.id));

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-outline-secondary btn-sm flex-fill fw-semibold';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openEditOpportunityModal(opp.id));

    row1.appendChild(viewBtn);
    row1.appendChild(editBtn);

    // Row 2: Close (disabled if already Closed) & Delete
    const row2 = document.createElement('div');
    row2.className = 'd-flex gap-2';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-outline-warning btn-sm flex-fill fw-semibold';
    closeBtn.textContent = 'Close';
    if (!isOpen) {
        closeBtn.disabled = true;
        closeBtn.title = 'Opportunity is already closed';
    } else {
        closeBtn.addEventListener('click', () => promptCloseOpportunity(opp.id));
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline-danger btn-sm flex-fill fw-semibold';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => promptDeleteOpportunity(opp.id));

    row2.appendChild(closeBtn);
    row2.appendChild(deleteBtn);

    actionsContainer.appendChild(row1);
    actionsContainer.appendChild(row2);
    cardBody.appendChild(actionsContainer);

    card.appendChild(cardBody);
    col.appendChild(card);
    return col;
}

/**
 * Fetches and displays all opportunities in the container.
 */
async function loadOpportunities() {
    setLoading(true);
    const container = document.getElementById('opportunities-container');
    const emptyState = document.getElementById('empty-state');

    try {
        const response = await getAllOpportunities();
        const opportunities = (response && Array.isArray(response.data)) ? response.data : [];

        setLoading(false);

        if (opportunities.length === 0) {
            if (emptyState) emptyState.classList.remove('d-none');
        } else {
            if (emptyState) emptyState.classList.add('d-none');
            const fragment = document.createDocumentFragment();
            opportunities.forEach(opp => {
                const cardCol = createOpportunityCard(opp);
                fragment.appendChild(cardCol);
            });
            container.appendChild(fragment);
        }
    } catch (error) {
        setLoading(false);
        showAlert(error.message, 'danger');
    }
}

/**
 * Fetches full details for a single opportunity and displays them in the modal.
 *
 * @param {number|string} id - The ID of the opportunity to view.
 */
async function handleViewDetails(id) {
    currentViewedOpportunityId = id;
    try {
        const response = await getOpportunity(id);
        const opp = response.data;

        if (!opp) {
            showAlert('This opportunity no longer exists', 'warning');
            await loadOpportunities();
            return;
        }

        // Populate modal fields safely using textContent
        document.getElementById('modal-title').textContent = opp.title || 'Untitled';

        const statusBadge = document.getElementById('modal-status-badge');
        statusBadge.textContent = opp.status || 'Open';
        statusBadge.className = `badge ${opp.status === 'Open' ? 'bg-success' : 'bg-secondary'}`;

        document.getElementById('modal-research-area').textContent = opp.research_area || 'N/A';
        document.getElementById('modal-faculty-name').textContent = opp.faculty_name || 'N/A';
        document.getElementById('modal-department').textContent = opp.department || 'N/A';
        document.getElementById('modal-positions').textContent = opp.available_positions !== undefined ? `${opp.available_positions}` : 'N/A';
        document.getElementById('modal-deadline').textContent = opp.application_deadline || 'N/A';
        document.getElementById('modal-skills').textContent = opp.required_skills || 'None listed';
        document.getElementById('modal-description').textContent = opp.description || 'No description provided.';
        document.getElementById('modal-created-at').textContent = opp.created_at || 'N/A';
        document.getElementById('modal-updated-at').textContent = opp.updated_at || 'N/A';

        // Show the Bootstrap details modal
        const modalEl = document.getElementById('opportunityDetailsModal');
        if (!detailsModalInstance) {
            detailsModalInstance = new bootstrap.Modal(modalEl);
        }
        detailsModalInstance.show();

    } catch (error) {
        if (error.status === 404) {
            showAlert('This opportunity no longer exists', 'warning');
            await loadOpportunities();
        } else {
            showAlert(error.message, 'danger');
        }
    }
}

/**
 * Opens the opportunity form modal in "Create" mode with blank fields.
 */
function openCreateOpportunityModal() {
    clearFormErrors();

    // Reset hidden ID and all form fields
    document.getElementById('opportunity-id').value = '';
    document.getElementById('opportunityForm').reset();
    document.getElementById('status').value = 'Open';

    // Set modal title and submit button text for Create mode
    document.getElementById('opportunityFormModalLabel').textContent = 'Add Research Opportunity';
    document.getElementById('btn-submit-opportunity').textContent = 'Create Opportunity';

    // Show modal
    const modalEl = document.getElementById('opportunityFormModal');
    if (!formModalInstance) {
        formModalInstance = new bootstrap.Modal(modalEl);
    }
    formModalInstance.show();
}

/**
 * Opens the opportunity form modal in "Edit" mode with pre-filled fields.
 *
 * @param {number|string} id - The ID of the opportunity to edit.
 */
async function openEditOpportunityModal(id) {
    // Close details modal if open
    if (detailsModalInstance) {
        detailsModalInstance.hide();
    }

    try {
        const response = await getOpportunity(id);
        const opp = response.data;

        if (!opp) {
            showAlert('This opportunity no longer exists', 'warning');
            await loadOpportunities();
            return;
        }

        clearFormErrors();

        // Populate form inputs
        document.getElementById('opportunity-id').value = opp.id;
        document.getElementById('title').value = opp.title || '';
        document.getElementById('description').value = opp.description || '';
        document.getElementById('research_area').value = opp.research_area || '';
        document.getElementById('faculty_name').value = opp.faculty_name || '';
        document.getElementById('department').value = opp.department || '';
        document.getElementById('required_skills').value = opp.required_skills || '';
        document.getElementById('available_positions').value = opp.available_positions !== undefined ? opp.available_positions : '';
        document.getElementById('application_deadline').value = opp.application_deadline ? opp.application_deadline.slice(0, 10) : '';
        document.getElementById('status').value = opp.status || 'Open';

        // Set modal title and button text for Edit mode
        document.getElementById('opportunityFormModalLabel').textContent = 'Edit Opportunity';
        document.getElementById('btn-submit-opportunity').textContent = 'Update';

        // Show modal
        const modalEl = document.getElementById('opportunityFormModal');
        if (!formModalInstance) {
            formModalInstance = new bootstrap.Modal(modalEl);
        }
        formModalInstance.show();

    } catch (error) {
        if (error.status === 404) {
            showAlert('This opportunity no longer exists', 'warning');
            await loadOpportunities();
        } else {
            showAlert(error.message, 'danger');
        }
    }
}

/**
 * Displays a confirmation dialog before closing an opportunity.
 *
 * @param {number|string} id - The ID of the opportunity to close.
 */
function promptCloseOpportunity(id) {
    showConfirmationModal({
        title: 'Close Research Opportunity',
        message: 'Close this opportunity? Students will no longer be able to apply.',
        confirmBtnText: 'Close Opportunity',
        confirmBtnClass: 'btn-warning',
        onConfirm: async () => {
            await updateOpportunity(id, { status: 'Closed' });
            showAlert('Opportunity closed successfully', 'success');
            await loadOpportunities();
        }
    });
}

/**
 * Displays a confirmation dialog before deleting an opportunity.
 *
 * @param {number|string} id - The ID of the opportunity to delete.
 */
function promptDeleteOpportunity(id) {
    showConfirmationModal({
        title: 'Delete Research Opportunity',
        message: 'Are you sure you want to delete this opportunity? This action cannot be undone.',
        confirmBtnText: 'Delete',
        confirmBtnClass: 'btn-danger',
        onConfirm: async () => {
            await deleteOpportunity(id);
            showAlert('Research opportunity deleted successfully', 'success');
            await loadOpportunities();
        }
    });
}

/**
 * Handles submission of the opportunity form (for both Create and Edit modes).
 *
 * @param {Event} event - Submit event from the form.
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    clearFormErrors();

    // Collect values from the form inputs
    const formId = document.getElementById('opportunity-id').value;
    const rawData = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        research_area: document.getElementById('research_area').value.trim(),
        faculty_name: document.getElementById('faculty_name').value.trim(),
        department: document.getElementById('department').value.trim(),
        required_skills: document.getElementById('required_skills').value.trim(),
        available_positions: document.getElementById('available_positions').value.trim(),
        application_deadline: document.getElementById('application_deadline').value.trim(),
        status: document.getElementById('status').value
    };

    // Client-side validation check
    const errors = validateOpportunityForm(rawData);
    if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([fieldId, message]) => {
            setFieldError(fieldId, message);
        });
        return;
    }

    // Clean payload for API
    const payload = {
        title: rawData.title,
        description: rawData.description,
        research_area: rawData.research_area,
        faculty_name: rawData.faculty_name,
        department: rawData.department,
        required_skills: rawData.required_skills,
        available_positions: parseInt(rawData.available_positions, 10),
        application_deadline: rawData.application_deadline,
        status: rawData.status
    };

    // UI loading state: disable button and show indicator
    const submitBtn = document.getElementById('btn-submit-opportunity');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Saving...';

    try {
        if (!formId) {
            // Create mode: POST /api/opportunities
            await createOpportunity(payload);
            showAlert('Research opportunity created successfully', 'success');
        } else {
            // Edit mode: PUT /api/opportunities/<id>
            await updateOpportunity(formId, payload);
            showAlert('Research opportunity updated successfully', 'success');
        }

        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;

        if (formModalInstance) {
            formModalInstance.hide();
        }
        document.getElementById('opportunityForm').reset();

        // Refresh cards
        await loadOpportunities();

    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;

        if (error.status === 404) {
            if (formModalInstance) {
                formModalInstance.hide();
            }
            showAlert('This opportunity no longer exists', 'warning');
            await loadOpportunities();
            return;
        }

        // Show main error inside modal
        setModalAlert(error.message, 'danger');

        // Map server validation details onto matching fields
        if (error.details && typeof error.details === 'object') {
            Object.entries(error.details).forEach(([field, msg]) => {
                setFieldError(field, msg);
            });
        }
    }
}

// -----------------------------------------------------------------------------
// Initialization on page load
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Wire "Add Opportunity" navbar button to open the form modal
    const addBtn = document.getElementById('btn-add-opportunity');
    if (addBtn) {
        addBtn.addEventListener('click', openCreateOpportunityModal);
    }

    // Wire "Edit Opportunity" button inside Details modal
    const modalEditBtn = document.getElementById('btn-modal-details-edit');
    if (modalEditBtn) {
        modalEditBtn.addEventListener('click', () => {
            if (currentViewedOpportunityId) {
                openEditOpportunityModal(currentViewedOpportunityId);
            }
        });
    }

    // Wire Confirmation Modal confirm button
    const confirmActionBtn = document.getElementById('btn-confirm-action');
    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', async () => {
            if (typeof pendingConfirmationAction === 'function') {
                const originalText = confirmActionBtn.textContent;
                confirmActionBtn.disabled = true;
                confirmActionBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Processing...';

                try {
                    await pendingConfirmationAction();
                    if (confirmationModalInstance) {
                        confirmationModalInstance.hide();
                    }
                } catch (error) {
                    if (confirmationModalInstance) {
                        confirmationModalInstance.hide();
                    }
                    if (error.status === 404) {
                        showAlert('This opportunity no longer exists', 'warning');
                        await loadOpportunities();
                    } else {
                        showAlert(error.message, 'danger');
                    }
                } finally {
                    confirmActionBtn.disabled = false;
                    confirmActionBtn.textContent = originalText;
                    pendingConfirmationAction = null;
                }
            }
        });
    }

    // Attach submit listener to the opportunity form
    const formEl = document.getElementById('opportunityForm');
    if (formEl) {
        formEl.addEventListener('submit', handleFormSubmit);

        // Remove invalid error state dynamically when user modifies input
        formEl.querySelectorAll('.form-control, .form-select').forEach(input => {
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) {
                    input.classList.remove('is-invalid');
                    const feedback = document.getElementById(`feedback-${input.id}`);
                    if (feedback) feedback.textContent = '';
                }
            });
        });
    }

    // Load research opportunities from API
    loadOpportunities();
});

/**
 * Main application logic for the University Research Opportunity Portal frontend.
 * Manages UI rendering, DOM events, loading states, form validation, and modal interactions.
 */

// Global modal instance references
let detailsModalInstance = null;
let formModalInstance = null;

/**
 * Displays a dismissible Bootstrap alert message at the top of the page.
 * Safely sets the message using textContent to prevent XSS.
 *
 * @param {string} message - The message text to display.
 * @param {string} [type='danger'] - Bootstrap alert color variant ('danger', 'success', 'warning', 'info').
 */
function showAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    // Clear any previous alerts
    alertContainer.innerHTML = '';

    // Create the alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
    alertDiv.setAttribute('role', 'alert');

    // Create text node safely
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    alertDiv.appendChild(messageSpan);

    // Create the close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'alert');
    closeBtn.setAttribute('aria-label', 'Close');
    alertDiv.appendChild(closeBtn);

    alertContainer.appendChild(alertDiv);
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

    // Bottom action button: "View Details"
    const actionContainer = document.createElement('div');
    actionContainer.className = 'mt-auto pt-2';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-outline-primary btn-sm w-100 fw-semibold';
    viewBtn.textContent = 'View Details';
    viewBtn.addEventListener('click', () => {
        handleViewDetails(opp.id);
    });

    actionContainer.appendChild(viewBtn);
    cardBody.appendChild(actionContainer);

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
    try {
        const response = await getOpportunity(id);
        const opp = response.data;

        if (!opp) {
            showAlert('Opportunity details could not be loaded.', 'warning');
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

        // Show the Bootstrap modal
        const modalEl = document.getElementById('opportunityDetailsModal');
        if (!detailsModalInstance) {
            detailsModalInstance = new bootstrap.Modal(modalEl);
        }
        detailsModalInstance.show();

    } catch (error) {
        showAlert(error.message, 'danger');
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

    // Set modal titles and button texts for Create mode
    document.getElementById('opportunityFormModalLabel').textContent = 'Add Research Opportunity';
    document.getElementById('btn-submit-opportunity').textContent = 'Create Opportunity';

    // Initialize and display modal
    const modalEl = document.getElementById('opportunityFormModal');
    if (!formModalInstance) {
        formModalInstance = new bootstrap.Modal(modalEl);
    }
    formModalInstance.show();
}

/**
 * Handles submission of the opportunity form (client-side validation and API call).
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
        // Highlight errors on invalid inputs
        Object.entries(errors).forEach(([fieldId, message]) => {
            setFieldError(fieldId, message);
        });
        // Stop execution; do NOT make network call
        return;
    }

    // Prepare clean payload for the API
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
    submitBtn.textContent = 'Saving...';

    try {
        if (!formId) {
            // Create mode: call POST /api/opportunities
            await createOpportunity(payload);
            showAlert('Research opportunity created successfully', 'success');
        } else {
            // Edit mode (prepared for update feature): call PUT /api/opportunities/<id>
            await updateOpportunity(formId, payload);
            showAlert('Research opportunity updated successfully', 'success');
        }

        // Close modal, reset form, and reload list
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;

        if (formModalInstance) {
            formModalInstance.hide();
        }
        document.getElementById('opportunityForm').reset();

        // Refresh opportunities cards list
        await loadOpportunities();

    } catch (error) {
        // Re-enable submit button and restore text
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;

        // Keep modal open and display server-side error
        setModalAlert(error.message, 'danger');

        // If server provided field-specific validation details, mark those fields
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

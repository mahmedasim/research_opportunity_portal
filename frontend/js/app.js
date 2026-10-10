/**
 * Main application logic for the University Research Opportunity Portal frontend.
 * Manages UI rendering, DOM events, loading states, and modal interactions.
 */

// Initialize details modal instance variable
let detailsModalInstance = null;

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

// -----------------------------------------------------------------------------
// Initialization on page load
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Wire "Add Opportunity" button placeholder
    const addBtn = document.getElementById('btn-add-opportunity');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showAlert('The "Add Opportunity" form will be enabled in the next step.', 'info');
        });
    }

    // Load research opportunities from API
    loadOpportunities();
});

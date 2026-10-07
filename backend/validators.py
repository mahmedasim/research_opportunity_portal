from datetime import datetime

# Maximum allowed lengths according to API_SPEC
STRING_LIMITS = {
    'title': 200,
    'research_area': 100,
    'faculty_name': 100,
    'department': 100,
    'required_skills': 500
}

REQUIRED_FIELDS = [
    'title',
    'description',
    'research_area',
    'faculty_name',
    'department',
    'required_skills',
    'available_positions',
    'application_deadline'
]

ALL_FIELDS = REQUIRED_FIELDS + ['status']

def validate_opportunity(data, partial=False):
    """
    Validates research opportunity input data.

    Parameters:
        data (dict): The incoming JSON dictionary to validate.
        partial (bool): False for creation (POST), True for partial updates (PUT).

    Returns:
        tuple: (cleaned_data, errors_dict)
               cleaned_data contains sanitized values for recognized fields.
               errors_dict contains field-specific error messages if validation fails.
    """
    if not isinstance(data, dict):
        return {}, {"body": "Request payload must be a JSON object"}

    cleaned_data = {}
    errors = {}

    # For POST (partial=False), verify all required fields are present
    if not partial:
        for field in REQUIRED_FIELDS:
            if field not in data or data[field] is None:
                field_label = field.replace('_', ' ').capitalize()
                errors[field] = f"{field_label} is required"

    # Validate string fields with length limits
    for field, max_len in STRING_LIMITS.items():
        if field in data and data[field] is not None:
            val = data[field]
            if not isinstance(val, str):
                field_label = field.replace('_', ' ').capitalize()
                errors[field] = f"{field_label} must be text"
            else:
                trimmed = val.strip()
                if not trimmed:
                    field_label = field.replace('_', ' ').capitalize()
                    errors[field] = f"{field_label} cannot be blank"
                elif len(trimmed) > max_len:
                    field_label = field.replace('_', ' ').capitalize()
                    errors[field] = f"{field_label} cannot exceed {max_len} characters"
                else:
                    cleaned_data[field] = trimmed

    # Validate description (text without max length limit)
    if 'description' in data and data['description'] is not None:
        val = data['description']
        if not isinstance(val, str):
            errors['description'] = "Description must be text"
        else:
            trimmed = val.strip()
            if not trimmed:
                errors['description'] = "Description cannot be blank"
            else:
                cleaned_data['description'] = trimmed

    # Validate available_positions (integer >= 1; reject bool, floats, strings)
    if 'available_positions' in data and data['available_positions'] is not None:
        val = data['available_positions']
        # Note: in Python, isinstance(True, int) is True, so we explicitly check type(val) is int
        if type(val) is not int:
            errors['available_positions'] = "Available positions must be a valid integer"
        elif val < 1:
            errors['available_positions'] = "Available positions must be at least 1"
        else:
            cleaned_data['available_positions'] = val

    # Validate application_deadline (YYYY-MM-DD real date)
    if 'application_deadline' in data and data['application_deadline'] is not None:
        val = data['application_deadline']
        if not isinstance(val, str):
            errors['application_deadline'] = "Application deadline must be a date string (YYYY-MM-DD)"
        else:
            trimmed = val.strip()
            try:
                parsed_date = datetime.strptime(trimmed, "%Y-%m-%d")
                # Ensure the formatted string matches input (prevents edge cases like 2026-2-5 or invalid leap days)
                if parsed_date.strftime("%Y-%m-%d") != trimmed:
                    errors['application_deadline'] = "Application deadline must be in YYYY-MM-DD format"
                else:
                    cleaned_data['application_deadline'] = trimmed
            except ValueError:
                errors['application_deadline'] = "Application deadline must be a valid date in YYYY-MM-DD format"

    # Validate status ("Open" or "Closed")
    if 'status' in data and data['status'] is not None:
        val = data['status']
        if not isinstance(val, str) or val.strip() not in ("Open", "Closed"):
            errors['status'] = "Status must be either 'Open' or 'Closed'"
        else:
            cleaned_data['status'] = val.strip()
    elif not partial:
        # Default status for POST is "Open"
        cleaned_data['status'] = "Open"

    # If partial=True (PUT), ensure at least one recognized valid field was provided
    if partial and not errors:
        valid_sent = [f for f in ALL_FIELDS if f in cleaned_data]
        if not valid_sent:
            errors['body'] = "At least one valid field must be provided for update"

    return cleaned_data, errors

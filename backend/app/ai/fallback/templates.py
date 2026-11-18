from typing import Dict, Any, Optional

DEFAULT_FALLBACK_RESPONSE = (
    "Hello,\n\n"
    "We have received your support request and assigned it to the appropriate technical support queue. "
    "An agent will review the ticket details and reach out shortly.\n\n"
    "If this issue is critical, please notify your team lead or system administrator."
)

CATEGORY_DEFAULTS = {
    "Network & VPN": "Network connectivity, VPN access, and firewall routing issues.",
    "Hardware & Workstation": "Desktop, laptop, peripheral, and workstation diagnostics.",
    "Access & Identity Management": "User accounts, password resets, and permission grants.",
    "Student Portal & LMS": "Learning management systems, course access, and student portals.",
    "Software & Applications": "Application installations, licenses, and operating system errors.",
    "Human Resources & Benefits": "Payroll, leave, and benefits inquiries.",
    "Hostel & Facilities": "Campus and building facility maintenance."
}


def get_fallback_resolution(category_name: Optional[str] = None) -> str:
    desc = CATEGORY_DEFAULTS.get(category_name, "your technical issue")
    return (
        f"Hello,\n\n"
        f"Regarding your request concerning {desc}:\n"
        f"Our support specialists have been notified and standard operational diagnostic procedures are underway. "
        f"Please ensure any error messages or screenshots are attached to this ticket to expedite resolution."
    )

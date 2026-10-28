import resend

from app.core.config import settings


class EmailNotConfigured(RuntimeError):
    pass


def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    text: str | None = None,
) -> dict:
    if not settings.resend_api_key or not settings.email_from:
        raise EmailNotConfigured("Faltan RESEND_API_KEY o EMAIL_FROM")

    resend.api_key = settings.resend_api_key
    recipients = [to] if isinstance(to, str) else to
    payload = {
        "from": settings.email_from,
        "to": recipients,
        "subject": subject,
        "html": html,
    }
    if text is not None:
        payload["text"] = text
    return resend.Emails.send(payload)

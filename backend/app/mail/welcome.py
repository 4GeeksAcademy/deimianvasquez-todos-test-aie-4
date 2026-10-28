from html import escape

from app.mail.sender import send_email


def send_welcome_email(to: str, name: str) -> dict:
    safe_name = escape(name.strip() or "hola")
    return send_email(
        to=to,
        subject="Bienvenido a Deimiantask",
        html=(
            f"<p>Hola {safe_name},</p>"
            "<p>Tu cuenta en Deimiantask ya está lista. "
            "Entra y empieza a guardar tus tareas.</p>"
        ),
        text=(
            f"Hola {name.strip() or 'hola'}, "
            "tu cuenta en Deimiantask ya está lista."
        ),
    )

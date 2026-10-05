import threading
import urllib.request
from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives, send_mail
from django.utils import timezone
from django.utils.html import escape
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


def _deliver(subject, body, short):
    try:
        if settings.OWNER_EMAIL:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [settings.OWNER_EMAIL], fail_silently=True)
    except Exception:
        pass
    try:
        if settings.NTFY_TOPIC:  # phone push via the free ntfy app
            req = urllib.request.Request(f"https://ntfy.sh/{settings.NTFY_TOPIC}", data=short.encode("utf-8"),
                                         headers={"Title": "Chayan alert", "Tags": "bell"})
            urllib.request.urlopen(req, timeout=8)
    except Exception:
        pass


def notify_owner(event, user):
    """Alert the site owner. Never includes passwords or resume content."""
    name = user.first_name or user.username
    verb = "signed up" if event == "signup" else "logged in"
    when = timezone.localtime().strftime("%d %b %Y, %I:%M %p")
    body = (f"Event: {event}\nName: {name}\nUsername: {user.username}\nEmail: {user.email}\n"
            f"Time: {when}\nTotal users: {User.objects.count()}\n")
    threading.Thread(target=_deliver, args=(f"Chayan: {name} {verb}", body, f"{name} {verb} on Chayan"),
                     daemon=True).start()


def welcome_message(name):
    safe, url = escape(name), settings.FRONTEND_URL
    live = not any(h in url for h in ("localhost", "127.0.0.1"))
    link_text = f"Start here: {url}" if live else "Open Chayan and sign in to get started."
    subject = f"Welcome to Chayan, {name}! 🎉"
    text = (f"Hey {name}, welcome to Chayan!\n\nYour account is ready. Most resumes get filtered by an ATS before a human "
            f"reads them. Chayan shows you why and how to fix it.\n\n1. Upload your PDF resume\n2. Paste a job description\n"
            f"3. Get your match score, ATS score, missing keywords and tips\n\n{link_text}\n\n- Team Chayan")
    step = ('<tr><td style="padding:10px 0;color:#334155;font-size:15px"><span style="display:inline-block;width:26px;height:26px;'
            'line-height:26px;text-align:center;border-radius:13px;background:#6366f1;color:#fff;font-weight:700;margin-right:10px">{n}</span>{t}</td></tr>')
    steps = "".join(step.format(n=n, t=t) for n, t in [(1, "Upload your PDF resume"), (2, "Paste the job description"),
                     (3, "Get your match score, ATS score, missing keywords and tips")])
    button = (f'<div style="text-align:center;margin:26px 0 6px"><a href="{url}" style="display:inline-block;background-color:#6d28d9;background-image:linear-gradient(90deg,#4f46e5,#ec4899);color:#ffffff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:12px;font-size:16px">Analyze my resume</a></div>'
              if live else '<p style="text-align:center;color:#6d28d9;font-weight:700;margin:22px 0 4px">Open Chayan and sign in to get started.</p>')
    html = f"""<div style="background:#0f172a;padding:32px 12px;font-family:Arial,Helvetica,sans-serif">
<table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background-color:#6d28d9;background-image:linear-gradient(135deg,#4f46e5,#9333ea,#ec4899);padding:36px 24px;text-align:center;color:#ffffff">
<div style="font-size:13px;letter-spacing:3px;opacity:.9">WELCOME TO</div>
<div style="font-size:38px;font-weight:800;margin-top:4px">Chayan</div>
<div style="font-size:14px;margin-top:8px;opacity:.95">Analyze. Match. Get Selected.</div></td></tr>
<tr><td style="padding:30px 32px">
<h2 style="margin:0 0 10px;color:#0f172a;font-size:22px">Hey {safe}, welcome aboard! 🎉</h2>
<p style="margin:0 0 18px;color:#475569;line-height:1.6;font-size:15px">Your account is ready. Most resumes get filtered by an ATS before a human ever reads them. Chayan shows you why, and exactly how to fix it.</p>
<table width="100%" cellpadding="0" cellspacing="0">{steps}</table>
{button}
</td></tr>
<tr><td style="background:#f8fafc;padding:16px 24px;text-align:center;color:#94a3b8;font-size:12px">You received this because you created a Chayan account with this email.<br>© Chayan</td></tr>
</table></div>"""
    return subject, text, html


def _send_welcome(email, name):
    try:
        subject, text, html = welcome_message(name)
        msg = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [email])
        msg.attach_alternative(html, "text/html")
        msg.send(fail_silently=True)
    except Exception:
        pass


def send_welcome(user):
    """Friendly welcome email to the person who just signed up."""
    if user.email:
        threading.Thread(target=_send_welcome, args=(user.email, user.first_name or user.username), daemon=True).start()


def _send_reset(email, name, link):
    try:
        text = (f"Hi {name},\n\nUse this link to set a new password (valid for 1 hour):\n{link}\n\n"
                "If you did not ask for this, you can ignore this email.\n\n- Team Chayan")
        html = (f'<div style="background:#0f172a;padding:32px 12px;font-family:Arial,Helvetica,sans-serif"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;padding:32px">'
                f'<h2 style="margin:0 0 10px;color:#0f172a">Reset your password</h2>'
                f'<p style="color:#475569;line-height:1.6;font-size:15px">Hi {escape(name)}, click the button below to choose a new password. This link works for 1 hour.</p>'
                f'<p style="text-align:center;margin:26px 0"><a href="{link}" style="display:inline-block;background-color:#6d28d9;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:12px">Set new password</a></p>'
                f'<p style="color:#94a3b8;font-size:12px">If you did not ask for this, you can ignore this email.</p></div></div>')
        msg = EmailMultiAlternatives("Reset your Chayan password", text, settings.DEFAULT_FROM_EMAIL, [email])
        msg.attach_alternative(html, "text/html")
        msg.send(fail_silently=True)
    except Exception:
        pass


def send_reset_email(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_URL}/?uid={uid}&token={token}"
    if user.email:
        threading.Thread(target=_send_reset, args=(user.email, user.first_name or user.username, link), daemon=True).start()

import urllib.request
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail
from django.core.management.base import BaseCommand
from analyzer.notify import welcome_message


class Command(BaseCommand):
    help = "Send a test owner alert (email + phone) and a sample welcome email, and show any errors."

    def handle(self, *args, **options):
        w = self.stdout.write
        w("Email backend   : " + settings.EMAIL_BACKEND.split(".")[-2])
        w("OWNER_EMAIL      : " + (settings.OWNER_EMAIL or "NOT SET"))
        w("EMAIL_HOST_USER  : " + ("set" if settings.EMAIL_HOST_USER else "NOT SET"))
        w("NTFY_TOPIC       : " + ("set" if settings.NTFY_TOPIC else "NOT SET"))
        if settings.OWNER_EMAIL:
            try:
                send_mail("Chayan test alert", "If you can read this, owner alerts work.",
                          settings.DEFAULT_FROM_EMAIL, [settings.OWNER_EMAIL])
                w("Owner alert mail : sent")
            except Exception as e:
                w(f"Owner alert mail : FAILED -> {e}")
            try:
                subject, text, html = welcome_message("Test User")
                m = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [settings.OWNER_EMAIL])
                m.attach_alternative(html, "text/html")
                m.send()
                w("Welcome mail     : sent")
            except Exception as e:
                w(f"Welcome mail     : FAILED -> {e}")
        if settings.NTFY_TOPIC:
            try:
                req = urllib.request.Request(f"https://ntfy.sh/{settings.NTFY_TOPIC}", data=b"Chayan test notification",
                                             headers={"Title": "Chayan alert", "Tags": "bell"})
                urllib.request.urlopen(req, timeout=8)
                w("Phone push       : sent")
            except Exception as e:
                w(f"Phone push       : FAILED -> {e}")

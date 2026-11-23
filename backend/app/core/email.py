import smtplib
import logging
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger("paddeli.email")


def format_booking_email_html(b: Dict[str, Any]) -> str:
    """Generate a clean, modern, responsive HTML email for booking notifications."""
    order_id = b.get("order_id") or b.get("booking_id", "N/A")
    customer_name = b.get("customer_name") or "Valued Customer"
    customer_phone = b.get("customer_phone") or "N/A"
    service_name = b.get("service_name") or "Coconut Harvesting"
    tree_count = b.get("tree_count", 1)
    height_category = b.get("height_category") or "Standard"
    taluka = b.get("taluka") or "North Goa"
    address = b.get("address") or "Goa"
    scheduled_at = b.get("scheduled_at") or "As Scheduled"
    booking_type = (b.get("booking_type") or "standard").lower()
    is_urgent = booking_type == "urgent"
    quote_amount = float(b.get("quote_amount", 0.0))
    payment_method = b.get("payment_method") or "UPI"
    payment_status = b.get("payment_status") or "Paid"
    hazard_notes = b.get("hazard_notes") or b.get("notes") or ""
    created_at = b.get("created_at") or datetime.now().strftime("%d %b %Y, %I:%M %p")

    badge_bg = "#dc2626" if is_urgent else "#059669"
    badge_text = "⚡ URGENT EMERGENCY BOOKING" if is_urgent else "✓ CONFIRMED BOOKING"
    header_color = "#991b1b" if is_urgent else "#064e3b"

    hazard_html = ""
    if hazard_notes:
        hazard_html = f"""
        <tr>
            <td style="padding: 10px 14px; font-weight: 600; color: #b91c1c; border-bottom: 1px solid #fee2e2; background-color: #fef2f2;">⚠️ Urgency / Hazard Notes</td>
            <td style="padding: 10px 14px; color: #991b1b; border-bottom: 1px solid #fee2e2; background-color: #fef2f2;">{hazard_notes}</td>
        </tr>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking Notification - Paddeli</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: {header_color}; padding: 24px 28px; text-align: left;">
                            <table width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">🌴 Paddeli</h1>
                                        <p style="margin: 4px 0 0 0; color: #d1fae5; font-size: 13px;">Coconut & Tree Care Platform &bull; Operations Notification</p>
                                    </td>
                                    <td align="right" valign="top">
                                        <span style="display: inline-block; background-color: {badge_bg}; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                            {badge_text}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Alert Banner -->
                    <tr>
                        <td style="padding: 20px 28px 10px 28px;">
                            <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 6px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #065f46;">
                                    <strong>New Booking Received!</strong> A customer has placed a booking. Please review the service and dispatch details below.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Details Table -->
                    <tr>
                        <td style="padding: 10px 28px 24px 28px;">
                            <table width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; font-size: 14px; text-align: left;">
                                <tr style="background-color: #f9fafb;">
                                    <th colspan="2" style="padding: 12px 14px; font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                                        Order & Customer Details
                                    </th>
                                </tr>
                                <tr>
                                    <td width="38%" style="padding: 10px 14px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6;">Order / Booking ID</td>
                                    <td style="padding: 10px 14px; color: #111827; font-weight: 700; border-bottom: 1px solid #f3f4f6; font-family: monospace; font-size: 15px;">#{order_id}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6;">Customer Name</td>
                                    <td style="padding: 10px 14px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">{customer_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6;">Mobile Number</td>
                                    <td style="padding: 10px 14px; border-bottom: 1px solid #f3f4f6;">
                                        <a href="tel:{customer_phone}" style="color: #059669; font-weight: 700; text-decoration: none; font-size: 15px;">{customer_phone}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6;">Service Name</td>
                                    <td style="padding: 10px 14px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">{service_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6;">Tree Count & Height</td>
                                    <td style="padding: 10px 14px; color: #111827; border-bottom: 1px solid #f3f4f6;">{tree_count} tree(s) &bull; {height_category}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6;">Taluka / Region</td>
                                    <td style="padding: 10px 14px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">{taluka}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6;">Service Address</td>
                                    <td style="padding: 10px 14px; color: #111827; border-bottom: 1px solid #f3f4f6;">{address}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6;">Scheduled Date & Slot</td>
                                    <td style="padding: 10px 14px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">{scheduled_at}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6;">Total Amount</td>
                                    <td style="padding: 10px 14px; color: #059669; font-weight: 700; font-size: 16px; border-bottom: 1px solid #f3f4f6;">&#8377;{quote_amount:.2f}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6;">Payment Details</td>
                                    <td style="padding: 10px 14px; color: #111827; border-bottom: 1px solid #f3f4f6;">{payment_method} &bull; <strong style="color: #059669;">{payment_status}</strong></td>
                                </tr>
                                {hazard_html}
                                <tr>
                                    <td style="padding: 10px 14px; font-weight: 600; color: #6b7280;">Received At</td>
                                    <td style="padding: 10px 14px; color: #6b7280; font-size: 13px;">{created_at}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Call To Action -->
                    <tr>
                        <td align="center" style="padding: 0 28px 24px 28px;">
                            <a href="https://paddeli.com" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                Open Operations Dashboard &rarr;
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 16px 28px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                                This is an automated booking dispatch notification sent to <strong>contact@paddeli.com</strong>.<br>
                                &copy; {datetime.now().year} Paddeli. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def format_booking_email_text(b: Dict[str, Any]) -> str:
    """Generate a clean plain-text version for email clients that do not render HTML."""
    order_id = b.get("order_id") or b.get("booking_id", "N/A")
    customer_name = b.get("customer_name") or "Valued Customer"
    customer_phone = b.get("customer_phone") or "N/A"
    service_name = b.get("service_name") or "Coconut Harvesting"
    tree_count = b.get("tree_count", 1)
    height_category = b.get("height_category") or "Standard"
    taluka = b.get("taluka") or "North Goa"
    address = b.get("address") or "Goa"
    scheduled_at = b.get("scheduled_at") or "As Scheduled"
    booking_type = (b.get("booking_type") or "standard").upper()
    quote_amount = float(b.get("quote_amount", 0.0))
    payment_method = b.get("payment_method") or "UPI"
    payment_status = b.get("payment_status") or "Paid"
    hazard_notes = b.get("hazard_notes") or b.get("notes") or ""
    created_at = b.get("created_at") or datetime.now().strftime("%d %b %Y, %I:%M %p")

    lines = [
        "==================================================",
        f"  PADDELI - NEW BOOKING NOTIFICATION [{booking_type}]",
        "==================================================",
        f"Order / Booking ID : #{order_id}",
        f"Customer Name      : {customer_name}",
        f"Mobile Phone       : {customer_phone}",
        f"Service Requested  : {service_name}",
        f"Tree Count         : {tree_count} tree(s)",
        f"Height Category    : {height_category}",
        f"Taluka / Region    : {taluka}",
        f"Address            : {address}",
        f"Scheduled For      : {scheduled_at}",
        f"Total Amount       : Rs. {quote_amount:.2f}",
        f"Payment Method     : {payment_method} ({payment_status})",
        f"Booking Placed At  : {created_at}",
    ]
    if hazard_notes:
        lines.append(f"Urgency Notes      : {hazard_notes}")
    lines.extend([
        "--------------------------------------------------",
        "Open Operations Dashboard: https://paddeli.com",
        "=================================================="
    ])
    return "\n".join(lines)


def send_booking_notification_email(booking_data: Dict[str, Any]) -> bool:
    """
    Dispatches a booking notification email to contact@paddeli.com.
    Safe failure handling: Any network/SMTP error is logged and returns False,
    ensuring that customer booking creation NEVER fails or throws a 500 error.
    """
    recipient = settings.NOTIFICATION_EMAIL or "contact@paddeli.com"
    sender = settings.MAIL_FROM or f"Paddeli <{recipient}>"

    order_id = booking_data.get("order_id") or booking_data.get("booking_id", "N/A")
    customer_name = booking_data.get("customer_name") or "Customer"
    taluka = booking_data.get("taluka") or "Goa"
    is_urgent = (booking_data.get("booking_type") or "").lower() == "urgent"

    if is_urgent:
        subject = f"🚨 [URGENT] New Booking #{order_id} - {customer_name} ({taluka})"
    else:
        subject = f"🌴 [New Booking] #{order_id} - {customer_name} ({taluka})"

    text_content = format_booking_email_text(booking_data)
    html_content = format_booking_email_html(booking_data)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = recipient
    msg["Reply-To"] = recipient

    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    # Attempt delivery
    smtp_host = settings.SMTP_HOST or "localhost"
    smtp_port = settings.SMTP_PORT or 25
    smtp_user = settings.SMTP_USER
    smtp_pass = settings.SMTP_PASSWORD
    use_tls = getattr(settings, "SMTP_USE_TLS", False)
    use_ssl = getattr(settings, "SMTP_USE_SSL", False)

    # Strategy 1: If credentials are provided (authenticated SMTP / external relay)
    if smtp_pass:
        try:
            logger.info(f"Connecting to SMTP server {smtp_host}:{smtp_port} with credentials...")
            if use_ssl or smtp_port == 465:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
                if use_tls:
                    server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender, [recipient], msg.as_string())
            server.quit()
            logger.info(f"Booking notification email successfully sent to {recipient} via authenticated SMTP.")
            return True
        except Exception as e:
            logger.warning(f"Authenticated SMTP delivery failed: {e}. Falling back to local cPanel relay...")

    # Strategy 2: Local cPanel relay on localhost:25 (standard MilesWeb cPanel setup)
    for host in [smtp_host, "localhost", "127.0.0.1"]:
        try:
            logger.info(f"Attempting local mail relay via {host}:25...")
            server = smtplib.SMTP(host, 25, timeout=8)
            server.sendmail(sender, [recipient], msg.as_string())
            server.quit()
            logger.info(f"Booking notification email successfully delivered to {recipient} via local relay ({host}:25).")
            return True
        except Exception as e:
            logger.debug(f"Local relay to {host}:25 did not respond: {e}")

    logger.warning(f"Could not deliver booking email notification to {recipient}. (Order #{order_id} recorded in database safely).")
    return False


def send_test_email(to_email: Optional[str] = None) -> Dict[str, Any]:
    """Test utility to verify email delivery from cPanel environment."""
    target = to_email or settings.NOTIFICATION_EMAIL or "contact@paddeli.com"
    sample_booking = {
        "order_id": "CP-TEST-01",
        "booking_id": "test-uuid-1234",
        "customer_name": "Test Customer",
        "customer_phone": "+91 9876543210",
        "service_name": "Coconut Harvesting",
        "tree_count": 5,
        "height_category": "Medium (20-40 ft)",
        "taluka": "Bardez",
        "address": "Mapusa Market Road, Bardez, North Goa",
        "scheduled_at": datetime.now().strftime("%d %b %Y, 10:00 AM"),
        "booking_type": "standard",
        "quote_amount": 500.0,
        "payment_method": "UPI",
        "payment_status": "Paid",
        "created_at": datetime.now().strftime("%d %b %Y, %I:%M %p")
    }
    success = send_booking_notification_email(sample_booking)
    return {
        "success": success,
        "recipient": target,
        "timestamp": datetime.now().isoformat(),
        "message": "Test email dispatched successfully" if success else "Test email delivery attempt completed (check logs)"
    }

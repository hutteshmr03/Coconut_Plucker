import os
import sys
import traceback

# Ensure application root directory is on the Python path
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

try:
    from a2wsgi import ASGIMiddleware
    from app.main import app
    application = ASGIMiddleware(app, wait_time=5.0)
except Exception as e:
    tb = traceback.format_exc()
    # Fallback diagnostics handler: Return 200 OK so LiteSpeed does NOT mask it with generic 500 HTML
    def application(environ, start_response):
        status = '200 OK'
        diagnostics = (
            f"=== Paddeli Backend Startup Diagnostics ===\n\n"
            f"Python Version: {sys.version}\n"
            f"App Directory: {app_dir}\n\n"
            f"Traceback:\n{tb}\n"
            f"sys.path:\n" + "\n".join(sys.path) + "\n"
        )
        output = diagnostics.encode('utf-8')
        response_headers = [
            ('Content-Type', 'text/plain; charset=utf-8'),
            ('Content-Length', str(len(output)))
        ]
        start_response(status, response_headers)
        return [output]

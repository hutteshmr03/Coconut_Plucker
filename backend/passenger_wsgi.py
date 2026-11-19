import os
import sys

# Ensure application root directory is on the Python path
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

try:
    from a2wsgi import ASGIMiddleware
    from app.main import app
    application = ASGIMiddleware(app)
except Exception as e:
    # Fallback debug handler to show any import error in browser instead of blank 500 error
    def application(environ, start_response):
        status = '500 Internal Server Error'
        output = f"Passenger Startup Error: {str(e)}".encode('utf-8')
        response_headers = [('Content-type', 'text/plain'), ('Content-Length', str(len(output)))]
        start_response(status, response_headers)
        return [output]

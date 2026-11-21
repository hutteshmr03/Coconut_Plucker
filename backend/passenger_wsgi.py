import os
import sys
import traceback

app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from app.main import app
_wsgi_app = None

def application(environ, start_response):
    global _wsgi_app
    try:
        if _wsgi_app is None:
            from a2wsgi import ASGIMiddleware
            _wsgi_app = ASGIMiddleware(app)
        return _wsgi_app(environ, start_response)
    except Exception as e:
        tb = traceback.format_exc()
        output = f"Application Runtime Error:\n\n{tb}".encode('utf-8')
        start_response('200 OK', [
            ('Content-Type', 'text/plain; charset=utf-8'),
            ('Content-Length', str(len(output)))
        ])
        return [output]

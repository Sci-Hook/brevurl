'''
written to bypass CORS when testing on local device. Don't forget to run it!!!

'''

from http.server import SimpleHTTPRequestHandler, HTTPServer

class CORSHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

port = 8000
server_address = ('', port)
httpd = HTTPServer(server_address, CORSHTTPRequestHandler)
print(f'Running on port {port}...')
httpd.serve_forever()

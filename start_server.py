import http.server
import socketserver
import os

PORT = 8000

# Define o diretório base para o servidor
# O servidor será iniciado no diretório onde este script está
web_dir = os.path.dirname(__file__)
os.chdir(web_dir)

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Servidor iniciado em http://localhost:{PORT}")
    print("Pressione Ctrl+C para parar o servidor.")
    httpd.serve_forever()

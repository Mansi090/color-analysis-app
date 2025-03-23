import os
from flask import Flask, request, send_file, jsonify
# ... (rest of your imports)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ... (rest of your routes and functions)

@app.route('/')
def home():
    return "Welcome to the Color Analysis App!"

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
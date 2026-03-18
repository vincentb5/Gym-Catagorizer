import os
import requests
from flask import Flask, send_from_directory, jsonify, request
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')

# ── Roboflow config ───────────────────────────────────────────
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL   = os.getenv("ROBOFLOW_MODEL")
ROBOFLOW_VERSION = os.getenv("ROBOFLOW_VERSION")


# ── Serve the frontend ────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


# ── Analyze endpoint ──────────────────────────────────────────
# POST /analyze — accepts JSON { "image": "<base64 string>" }
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400

    image_b64 = data['image']

    # Strip the data URL prefix if present (e.g. "data:image/jpeg;base64,...")
    if ',' in image_b64:
        image_b64 = image_b64.split(',', 1)[1]

    # Call the Roboflow hosted inference API
    url = f"https://detect.roboflow.com/{ROBOFLOW_MODEL}/{ROBOFLOW_VERSION}"
    response = requests.post(
        url,
        params={"api_key": ROBOFLOW_API_KEY},
        data=image_b64,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )

    if not response.ok:
        return jsonify({'error': 'Roboflow API error', 'details': response.text}), 502

    predictions = response.json().get('predictions', [])

    if not predictions:
        return jsonify({'error': 'No equipment detected'}), 200

    # Use the top prediction (highest confidence)
    top = max(predictions, key=lambda p: p['confidence'])
    label      = top['class']
    confidence = round(top['confidence'] * 100)

    result = {
        'type':       {'value': label,   'meta': 'Detected by Roboflow', 'badge': label.upper()[:10]},
        'price':      {'value': '—',     'meta': 'Price data not available', 'badge': ''},
        'material':   {'value': '—',     'meta': 'Material data not available', 'badge': ''},
        'confidence': confidence
    }
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)

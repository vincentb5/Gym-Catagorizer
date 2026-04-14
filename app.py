import os
import json
import urllib.parse
import requests

from flask import Flask, send_from_directory, jsonify, request
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')

# ── Roboflow config ───────────────────────────────────────────
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL   = os.getenv("ROBOFLOW_MODEL")
ROBOFLOW_VERSION = os.getenv("ROBOFLOW_VERSION")

# ── OpenAI config ─────────────────────────────────────────────
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "").strip())


def ask_gpt(label):
    """Ask GPT for price range + blurb in one call. Returns (price, blurb)."""
    try:
        chat = openai_client.chat.completions.create(
            model='gpt-4o',
            messages=[
                {
                    'role': 'system',
                    'content': (
                        'You are a gym equipment resale expert. You know current used prices '
                        'from eBay sold listings and Facebook Marketplace. '
                        'Always respond with valid JSON only — no markdown, no extra text.'
                    )
                },
                {
                    'role': 'user',
                    'content': (
                        f'For "{label}" gym equipment give me:\n'
                        '1. "price": realistic used resale range in format "$X – $Y"\n'
                        '2. "blurb": one punchy sentence (max 12 words) on what it\'s used for\n'
                        'Return ONLY a JSON object, no markdown fences.'
                    )
                }
            ],
            max_tokens=80,
            temperature=0.2
        )
        raw = chat.choices[0].message.content.strip()
        # Strip markdown fences if GPT adds them
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
            raw = raw.strip()
        data = json.loads(raw)
        return data.get('price', '—'), data.get('blurb', '—')
    except Exception as e:
        return '—', f'Could not load description ({str(e)[:40]})'


# ── Serve static files ────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)


# ── Analyze endpoint ──────────────────────────────────────────
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400

    image_b64 = data['image']
    if ',' in image_b64:
        image_b64 = image_b64.split(',', 1)[1]

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

    # Sort all predictions by confidence descending
    predictions.sort(key=lambda p: p['confidence'], reverse=True)

    # Top prediction gets full GPT enrichment
    top    = predictions[0]
    label  = top['class']
    conf   = round(top['confidence'] * 100)

    price_value, blurb_value = ask_gpt(label)

    ebay_query = urllib.parse.quote_plus(f'{label} gym equipment used')
    ebay_url   = f'https://www.ebay.com/sch/i.html?_nkw={ebay_query}&LH_ItemCondition=3000'

    # All detections (for chips display)
    all_detections = [
        {'label': p['class'], 'confidence': round(p['confidence'] * 100)}
        for p in predictions
    ]

    result = {
        'type':           {'value': label,        'meta': 'Detected by Roboflow', 'badge': label.upper()[:10]},
        'price':          {'value': price_value,  'meta': 'Est. resale (eBay / FB Marketplace)', 'badge': 'RESALE'},
        'material':       {'value': blurb_value,  'meta': 'AI-generated summary', 'badge': 'ABOUT'},
        'confidence':     conf,
        'ebay_url':       ebay_url,
        'all_detections': all_detections,
    }
    return jsonify(result)


# ── Generate listing endpoint ─────────────────────────────────
@app.route('/generate-listing', methods=['POST'])
def generate_listing():
    data  = request.get_json()
    label = data.get('label', 'gym equipment')
    price = data.get('price', '—')

    try:
        chat = openai_client.chat.completions.create(
            model='gpt-4o',
            messages=[
                {
                    'role': 'system',
                    'content': (
                        'You write concise, compelling used gym equipment listings for '
                        'eBay and Facebook Marketplace. Always respond with JSON only — no markdown.'
                    )
                },
                {
                    'role': 'user',
                    'content': (
                        f'Write a used marketplace listing for: "{label}"\n'
                        f'Suggested resale price: {price}\n\n'
                        'Return JSON with:\n'
                        '"title": short listing title (max 12 words, include "Used")\n'
                        '"price": suggested asking price (single value like "$120")\n'
                        '"description": 3-4 sentence listing description mentioning condition, use, and value\n'
                        'Return ONLY the JSON object, no markdown.'
                    )
                }
            ],
            max_tokens=200,
            temperature=0.5
        )
        raw = chat.choices[0].message.content.strip()
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
            raw = raw.strip()
        listing = json.loads(raw)
        return jsonify(listing)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)

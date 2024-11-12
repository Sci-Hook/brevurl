from flask import Flask, request, jsonify, redirect, render_template
from flask_cors import CORS
import hashlib
import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(current_dir, '..', '..', 'brevurl_config.json')
config_web_path = os.path.join(current_dir, '..', '..', 'web_config.json')

with open(config_path, 'r') as file:
    brconfig = json.load(file)
    
with open(config_web_path, 'r') as file:
    webconfig = json.load(file)

app = Flask(__name__)
CORS(app)
port = brconfig["port"]

# Start Firebase
cred = credentials.Certificate(brconfig["firebase_configdst"])
firebase_admin.initialize_app(cred)
db = firestore.client()


def shorten_url(url):
    hashObject = hashlib.md5(url.encode())
    shortHash = hashObject.hexdigest()[:6]
    return shortHash

#call brevurl_config.json
@app.route('/config', methods=['GET'])
def get_config():
    return jsonify(brconfig)

@app.route('/config-web', methods=['GET'])
def get_web_config():
    return jsonify(webconfig)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/recover')
def recover():
    return render_template('recover.html')

@app.route('/shorten', methods=['GET'])
def shorten():
    originalUrl = request.args.get('url')
    customShort = request.args.get('short')

    if not originalUrl:
        return jsonify({'err': 'URL is required'}), 400
    
    if customShort:
        doc_ref = db.collection('urls').document(customShort)
        if doc_ref.get().exists:
            return jsonify({'err': 'Custom short name already exists'}), 400
        short_url = customShort
    else:
        short_url = shorten_url(originalUrl)
        doc_ref = db.collection('urls').document(short_url)
        while doc_ref.get().exists:
            short_url = shorten_url(short_url + "0")
            doc_ref = db.collection('urls').document(short_url)
    
    db.collection('urls').document(short_url).set({
        'original_url': originalUrl
    })
    
    return jsonify({'short_url': f'{brconfig["domain"]}:{port}/{short_url}'}), 200

@app.route('/<short_url>', methods=['GET'])
def redirect_to_url(short_url):
    doc_ref = db.collection('urls').document(short_url)
    doc = doc_ref.get()
    
    if not doc.exists:
        return jsonify({'error': 'URL not found'}), 404
    
    original_url = doc.to_dict().get('original_url')
    return redirect(original_url)

if __name__ == '__main__':
    app.run(debug=False, port=port)

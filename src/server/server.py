from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import hashlib
import firebase_admin
from firebase_admin import credentials, firestore
import json

with open('brevurl_config.json dst', 'r') as file:
    brconfig = json.load(file)

app = Flask(__name__)
CORS(app)
port = brconfig["port"]

#Start firabase
cred = credentials.Certificate(brconfig["firebase_configdst"])
firebase_admin.initialize_app(cred)
db = firestore.client()


def shorten_url(url):
    hashObject = hashlib.md5(url.encode())
    shortHash = hashObject.hexdigest()[:6]
    return shortHash

@app.route('/shorten', methods=['POST'])
def shorten():
    data = request.json
    originalUrl = data.get('url')
    customShort = data.get('short')
    
    if not originalUrl:
        return jsonify({'error': 'URL is required'}), 400
    
    if customShort:
        doc_ref = db.collection('urls').document(customShort)
        if doc_ref.get().exists:
            return jsonify({'error': 'Custom short name already exists'}), 400
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
    app.run(debug=False,port=port)

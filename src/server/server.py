from flask import Flask, request, jsonify, redirect, url_for, render_template, make_response
from flask_cors import CORS
import hashlib
import firebase_admin
from firebase_admin import credentials, firestore, auth
import json
import os
import jwt
import secrets
import datetime
import requests
import logging

current_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(current_dir, '..', '..', 'brevurl_config.json')
config_web_path = os.path.join(current_dir, '..', '..', 'web_config.json')

email = ""

with open(config_path, 'r') as file:
    brconfig = json.load(file)
    
with open(config_web_path, 'r') as file:
    webconfig = json.load(file)

app = Flask(__name__)
CORS(app)
port = brconfig["port"]

log_level = False

if log_level == False:
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)

# Start Firebase
cred = credentials.Certificate(brconfig["firebase_configdst"])
firebase_admin.initialize_app(cred)
db = firestore.client()


SECRET_KEY = secrets.token_hex(32)
REFRESH_SECRET_KEY = secrets.token_hex(32)

def create_access_token(username, role,email):
    payload = {
        "username": username,
        "role": role,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(seconds=30)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def create_refresh_token(username,email):
    payload = {
        "username": username,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30)  
    }
    return jwt.encode(payload, REFRESH_SECRET_KEY, algorithm="HS256")


def verify_token(token):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return True, decoded
    except:
        return False, "Invalid token"


@app.route('/usr-action',methods=['POST'])
def user_action():
    access_token = request.cookies.get("access_token")
    result = verify_token(access_token)
    if result != True:
        try:
            result = refresh_token()
            if result == 401 or result == 403:
                return jsonify({"status": "False"}),401
            else:
                response = make_response(jsonify({"status": "Success"}))
                response.set_cookie("access_token", result, httponly=True, secure=True)
        except:
            return jsonify({"status": "False"}),400
      



    action_details = request.json
    
    if action_details.get("action") == "delete_link":
        link = action_details.get("link")
        try:
            db.collection("urls").document(link).delete()
            return jsonify({"status": "True"}),200
        except Exception as e:
            print(e)
            return jsonify({"error": str(e)}),500



@app.route('/admin-action', methods=['POST'])
def admin_action():
    access_token = request.cookies.get("access_token")
    result = verify_token(access_token)
    if result != True:
        try:
            result = refresh_token()
            if result == 401 or result == 403:
                return jsonify({"status": "False"}),401
            else:
                response = make_response(jsonify({"status": "Success"}))
                response.set_cookie("access_token", result, httponly=True, secure=True)
        except:
            return jsonify({"status": "False"}),400
      



    action_details = request.json
    
    if action_details.get("action") == "delete_link":
        link = action_details.get("link")
        try:
            db.collection("urls").document(link).delete()
            return jsonify({"status": "True"}),200
        except Exception as e:
            print(e)
            return jsonify({"error": str(e)}),500

    if action_details.get("action") == "delete_user":
        email = action_details.get("email")
        try:
            user = auth.get_user_by_email(email)
            auth.delete_user(user.uid)
            db.collection("users").document(email).delete()
            return jsonify({"status": "True"}),200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    if action_details.get("action") == "update_field":
        collection = action_details.get("collection")
        doc = action_details.get("doc")
        field = action_details.get("fieldd")
        data = action_details.get("dataa")
        
        try:
            doc_ref = db.collection(collection).document(doc)
            doc_ref.update({field: data})
            return jsonify({"status": "True"}),202
        except Exception as e:
            print(e)
            return jsonify({"error": str(e)})
    
    if action_details.get("action") == "add_word":
        word = action_details.get("word")
        doc_ref = db.collection('general').document('banned-words')
        doc = doc_ref.get()
        if doc.exists:
           words = doc.to_dict().get('words', [])
           if word not in words:
                words.append(word)
                doc_ref.update({'words': words})
                return jsonify({"status":"True"}),200
           else:
                return jsonify({"error": "The word is already on the list"})
        else:
            doc_ref.set({'words': [word]})
            return jsonify({"status":"True"}),200
        
    if action_details.get("action") == "delete_word":
        word = action_details.get("word")
        word = int(word)
        print(word)
        doc_ref = db.collection('general').document('banned-words')
        doc = doc_ref.get()
        if doc.exists:
            
            words = doc.to_dict().get('words', [])
           
                
            words.pop(word)  
            doc_ref.update({'words': words})  
            return jsonify({"status":"True"}),200

         
        else:
            return jsonify({"error":"doc does not exist"})


    return jsonify({"error": "Bilinmeyen işlem"}), 400

def get_field(collection,docId,field):
    doc_ref = db.collection(collection).document(docId)
    try:
      doc = doc_ref.get()
      if doc.exists:
        field = doc.get(field)
        if field is not None:
            return field
        else:
            return "null"
      else:
        return "null"
    except Exception as e:
      print(f"Err: {e}")
      return "null"



@app.route('/login-process', methods=['POST'])
def login_process():
    data = request.json
    idToken = data.get("idToken")


    try:
        decoded_token = auth.verify_id_token(idToken)
        uid = decoded_token['uid']
        email = decoded_token.get('email', None)  
        email_verified = decoded_token.get('email_verified', False)
        if email_verified is True:
            role = get_field("users",email,"role")
            username = get_field("users",email,"username")
            if role and username != "null":
                access_token = create_access_token(username, role,email)
                refresh_token = create_refresh_token(username,email)  
                response = make_response({"access_token": access_token})
                response.set_cookie("refresh_token", refresh_token, httponly=True, secure=True)
                response.set_cookie("access_token", access_token, httponly=True, secure=True)
                return response
        else:
            return jsonify({"error": "Email not verified"}), 403
            

        
    except firebase_admin.auth.InvalidIdTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def refresh_token():
    refresh_token = request.cookies.get("refresh_token")  

    if not refresh_token:
        return 401

    try:
        
        decoded = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=["HS256"])
        username = decoded["username"]
        email = decoded["email"]

        role = get_field("users",email,"role")
        new_access_token = create_access_token(username, role,email)
        return new_access_token
    except jwt.ExpiredSignatureError:
        return 401
    except jwt.InvalidTokenError:
        return  403
    
    
@app.route('/getloginstatus', methods=['GET'])
def get_login_status():
    access_token = request.cookies.get("access_token")
    result = verify_token(access_token)
  
    if True in result:
        decoded = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
        username = decoded["username"]
        email = decoded["email"]
        role = decoded["role"]
        response = make_response(jsonify({"status": "True", "username": username, "email": email, "role":role}))
        return response  
    else:
        result = refresh_token()
        
        if result == 401 or result == 403:
            return jsonify({"status": "False"})  
        else:
            decoded = jwt.decode(result, SECRET_KEY, algorithms=["HS256"])
            username = decoded["username"]
            email = decoded["email"]
            role = decoded["role"]
            response = make_response(jsonify({"status": "True", "username": username, "email": email, "role":role}))
            response.set_cookie("access_token", result, httponly=True, secure=True)
            return response


@app.route('/logout',methods=['GET'])
def logout():
    response = make_response(jsonify({"status": "True"}))
    response.set_cookie('access_token', '', expires=0)
    response.set_cookie('refresh_token', '', expires=0)
    return response


def shorten_url(url):
    hashObject = hashlib.md5(url.encode())
    shortHash = hashObject.hexdigest()[:6]
    return shortHash


@app.route('/config', methods=['GET'])
def get_config():
    return jsonify(brconfig)

@app.route('/config-web', methods=['GET'])
def get_web_config():
    return jsonify(webconfig)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ourteam')
def our_team():
    return render_template('ourteam.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/recover')
def recover():
    return render_template('recover.html')

@app.route('/account')
def account():
    return render_template('account.html')

@app.route('/admin')
def admin():
    return render_template('adminpanel.html')

@app.route('/shorten', methods=['GET'])
def shorten():
    originalUrl = request.args.get('url')
    customShort = request.args.get('short')
    user = request.args.get('user')

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
        'original_url': originalUrl,
        'user': user
    })
    
    return jsonify({'short_url': f'{brconfig["domain"]}/{short_url}'}), 200

@app.route('/<short_url>', methods=['GET'])
def redirect_to_url(short_url):
    doc_ref = db.collection('urls').document(short_url)
    doc = doc_ref.get()
    
    if not doc.exists:
       return redirect(url_for('index'))    
    original_url = doc.to_dict().get('original_url')
    return redirect(original_url)

@app.route('/check-url', methods=['GET'])
def check_site():
    url = request.args.get('url')
    
    if not url:
        return jsonify({"error": "URL is required"}), 400
    
    if not url.startswith(("http://", "https://")):
        url = "https://" + url  

    try:
        response = requests.head(url, timeout=5) 
        return jsonify({"exists": True})  
        
    except requests.RequestException:
        return jsonify({"exists": False})


@app.route('/delete-user', methods=['POST'])
def delete_user():
    try:
        email = request.json.get('email')
        if not email:
            return jsonify({'error': 'E-mail is required'}), 400

        user = auth.get_user_by_email(email)
        uid = user.uid

        
        auth.delete_user(uid)
        return jsonify({'Success!'})
    except firebase_admin.auth.UserNotFoundError:
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


#If you use WSGI server delete this part
if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=False, port=port)


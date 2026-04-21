from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

DATA_FILE = 'data/semesters.json'
PROFILE_FILE = 'data/profile.json'

def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        content = f.read().strip()
        if not content:
            return []
        return json.loads(content)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

def load_profile():
    if not os.path.exists(PROFILE_FILE):
        return {}
    with open(PROFILE_FILE, 'r') as f:
        content = f.read().strip()
        if not content:
            return {}
        return json.loads(content)

def save_profile(data):
    with open(PROFILE_FILE, 'w') as f:
        json.dump(data, f)

def calculate_gpa(courses):
    total_points = 0
    total_units = 0
    for course in courses:
        score = course['score']
        units = course['units']
        if score >= 70:
            grade_point = 5.0
        elif score >= 60:
            grade_point = 4.0
        elif score >= 50:
            grade_point = 3.0
        elif score >= 45:
            grade_point = 2.0
        else:
            grade_point = 0.0
        total_points += grade_point * units
        total_units += units
    return round(total_points / total_units, 2) if total_units > 0 else 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/profile', methods=['GET'])
def get_profile():
    return jsonify(load_profile())

@app.route('/api/profile', methods=['POST'])
def save_profile_route():
    profile = request.json
    save_profile(profile)
    return jsonify(profile)

@app.route('/api/semesters', methods=['GET'])
def get_semesters():
    return jsonify(load_data())

@app.route('/api/semesters', methods=['POST'])
def save_semester():
    data = load_data()
    semester = request.json
    semester['gpa'] = calculate_gpa(semester['courses'])
    data.append(semester)
    save_data(data)
    return jsonify(semester)

@app.route('/api/semesters/<int:index>', methods=['DELETE'])
def delete_semester(index):
    data = load_data()
    data.pop(index)
    save_data(data)
    return jsonify({'status': 'deleted'})

@app.route('/api/semesters/all', methods=['PUT'])
def update_all_semesters():
    data = request.json
    for sem in data:
        sem['gpa'] = calculate_gpa(sem['courses'])
    save_data(data)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
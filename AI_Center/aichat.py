import os
import time
import random
import logging
from collections import defaultdict
from markupsafe import escape
from flask import Flask, render_template, request

# Basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(__file__)
app = Flask(__name__, template_folder=os.path.join(BASE_DIR, 'templates'))

# Simple in-memory rate limiter per IP
request_counts = defaultdict(list)

def is_rate_limited(ip, max_requests=10, window=60):
    now = time.time()
    request_counts[ip] = [t for t in request_counts[ip] if now - t < window]
    if len(request_counts[ip]) >= max_requests:
        return True
    request_counts[ip].append(now)
    return False

# Simple sanitize
def sanitize_input(text, max_length=500):
    if not text:
        return None
    text = text.strip()
    if len(text) > max_length:
        return None
    return escape(text)

# Rule-based replies
CHAT_RULES = {
    "你好": "你好！我是 CWJ AI 助手，有什么可以帮你的吗？",
    "hello": "Hello! I'm CWJ AI Assistant. How can I help you?",
    "你是谁": "我是 CWJ Tools 内置的 AI 聊天机器人。",
    "谢谢": "不客气！",
    "再见": "再见！祝你一天愉快！",
}

def ai_chat(text):
    t = text.lower()
    for k, v in CHAT_RULES.items():
        if k in t:
            return v
    # generic reply
    replies = [
        f"你问的是「{text}」，这是个好问题！我可以帮你把问题整理成搜索关键词。",
        f"关于「{text}」，我建议查阅相关文档或给出更多细节。",
        f"我理解你在问「{text}」，可以试着把问题分成更小的步骤。",
    ]
    return random.choice(replies)

@app.route('/', methods=['GET'])
def index():
    return render_template('aichat.html', chat_input='', chat_result='', chat_error='')

@app.route('/aichat', methods=['POST'])
def aichat():
    ip = request.remote_addr or 'unknown'
    if is_rate_limited(ip):
        logger.warning(f"Rate limit exceeded for {ip}")
        return render_template('aichat.html', chat_input='', chat_result='', chat_error='请求太频繁，请稍后再试')

    raw = request.form.get('chat_input', '')
    text = sanitize_input(raw)
    if not text:
        return render_template('aichat.html', chat_input=escape(raw), chat_result='', chat_error='请输入有效问题（1-500字符）')

    try:
        reply = ai_chat(text)
        return render_template('aichat.html', chat_input=text, chat_result=reply, chat_error='')
    except Exception as e:
        logger.exception('AI chat error')
        return render_template('aichat.html', chat_input=text, chat_result='', chat_error='服务器错误，请稍后重试')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)

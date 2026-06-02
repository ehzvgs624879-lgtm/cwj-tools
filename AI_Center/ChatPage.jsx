import React, { useState, useRef, useEffect } from 'react';
import './ChatPage.css';
import { callAIAPI } from './aiApi';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: '👋 你好！我是 CWJ AI 助手。我可以帮助你回答问题、提供建议或进行对话。有什么我可以帮助你的吗？',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 自动滚动到最后一条消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理发送消息
  const handleSendMessage = async (e) => {
    e.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    // 清空输入框
    setInputValue('');
    setError('');

    // 添加用户消息
    const userMessage = {
      id: messages.length + 1,
      text: trimmedInput,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 调用 AI API
      const aiResponse = await callAIAPI(trimmedInput);

      const aiMessage = {
        id: messages.length + 2,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || '发送消息失败，请重试');
      console.error('Error calling AI API:', err);

      // 如果是演示模式，添加模拟响应
      if (err.message.includes('演示')) {
        const demoMessage = {
          id: messages.length + 2,
          text: '这是演示模式下的回复。请配置真实的 AI API 来获得完整功能。',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, demoMessage]);
        setError('');
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // 处理键盘事件（Enter 发送，Shift+Enter 换行）
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="chat-container">
      {/* 聊天头部 */}
      <div className="chat-header">
        <div className="header-content">
          <div className="header-icon">🤖</div>
          <div className="header-info">
            <h1>CWJ AI 助手</h1>
            <p className="status-indicator">● 在线</p>
          </div>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-wrapper ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-bubble">
              {message.sender === 'ai' && <div className="ai-avatar">🤖</div>}
              <div className="message-content">
                <p>{message.text}</p>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message-wrapper ai-message">
            <div className="message-bubble">
              <div className="ai-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="chat-input-area">
        <form onSubmit={handleSendMessage} className="input-form">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题或消息... (Shift+Enter 换行，Enter 发送)"
              className="chat-input"
              disabled={isLoading}
              rows="1"
            />
            <button
              type="submit"
              className="send-button"
              disabled={isLoading || !inputValue.trim()}
              title="发送消息"
            >
              {isLoading ? (
                <span className="loading-spinner">⏳</span>
              ) : (
                <span>➤</span>
              )}
            </button>
          </div>
        </form>
        <p className="input-hint">💡 提示：输入任何问题或需求，AI 助手会为你解答</p>
      </div>
    </div>
  );
};

export default ChatPage;

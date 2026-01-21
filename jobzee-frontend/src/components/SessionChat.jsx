import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/SessionChat.css";
import API_BASE_URL from "../config/api";

const SessionChat = ({ sessionId, currentUserType }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const chatContainerRef = useRef(null);

    // Get token based on user type
    const getToken = () => {
        if (currentUserType === "mentor") {
            return localStorage.getItem("mentorToken");
        }
        return localStorage.getItem("token");
    };

    const fetchMessages = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/messages/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setMessages(response.data.data.messages);
                // Also could update session status if needed from response.data.data.session
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();

        // Poll for new messages every 10 seconds
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [sessionId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const token = getToken();
            const response = await axios.post(`${API_BASE_URL}/api/messages/send`, {
                sessionId,
                message: newMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setNewMessage("");
                fetchMessages(); // Refresh immediately
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(error.response?.data?.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="chat-loading">Loading messages...</div>;

    return (
        <div className="session-chat-container">
            <div className="chat-header">
                <h3>💬 Session Chat</h3>
                {/* <span className="status-indicator online"></span> */}
            </div>

            <div className="chat-messages" ref={chatContainerRef}>
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderType === currentUserType;
                        return (
                            <div key={msg._id} className={`message-wrapper ${isMe ? 'me' : 'other'}`}>
                                {!isMe && (
                                    <div className="message-avatar">
                                        {msg.sender?.name?.charAt(0) || "?"}
                                    </div>
                                )}
                                <div className="message-bubble">
                                    <p>{msg.message}</p>
                                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                />
                <button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? '...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default SessionChat;

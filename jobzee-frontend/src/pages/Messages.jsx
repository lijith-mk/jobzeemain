import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const Messages = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [messagingAllowed, setMessagingAllowed] = useState(true);
    const [messagingReason, setMessagingReason] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            navigate("/login");
            return;
        }
        fetchConversations();
    }, [navigate]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.session._id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();

            if (data.success) {
                setConversations(data.data);
                if (data.data.length > 0) {
                    setSelectedConversation(data.data[0]);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
            toast.error("Failed to load conversations");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (sessionId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/messages/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();

            if (data.success) {
                setMessages(data.data.messages);
                setMessagingAllowed(data.data.messagingAllowed);
                setMessagingReason(data.data.messagingReason);

                // Mark messages as read
                await fetch(`${API_BASE_URL}/api/messages/mark-read/${sessionId}`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error("Failed to load messages");
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        setSending(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    sessionId: selectedConversation.session._id,
                    message: newMessage.trim(),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setMessages([...messages, data.data]);
                setNewMessage("");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: "bg-blue-100 text-blue-800",
            completed: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
            "no-show": "bg-orange-100 text-orange-800",
        };
        return badges[status] || "bg-gray-100 text-gray-800";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                    <p className="text-gray-600 mt-1">Communicate with your mentors</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
                    <div className="flex h-full">
                        {/* Conversations List */}
                        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No conversations yet</h3>
                                    <p className="text-gray-500 mt-1">Book a session to start messaging</p>
                                    <button
                                        onClick={() => navigate("/mentors")}
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Find Mentors
                                    </button>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <div
                                        key={conv.session._id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.session._id === conv.session._id ? "bg-blue-50" : ""
                                            }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {conv.session.mentorId?.photo ? (
                                                    <img src={conv.session.mentorId.photo} alt={conv.session.mentorId.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-white font-bold text-lg">{conv.session.mentorId?.name?.charAt(0) || "M"}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-900 truncate">{conv.session.mentorId?.name}</h3>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{conv.unreadCount}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">{conv.session.sessionTypeId?.title}</p>
                                                {conv.lastMessage ? (
                                                    <p className="text-xs text-gray-500 truncate mt-1">
                                                        {conv.lastMessage.message}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-blue-600 italic mt-1">Start conversation</p>
                                                )}
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(conv.session.status)}`}>
                                                        {conv.session.status}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(conv.session.scheduledDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 flex flex-col">
                            {selectedConversation ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-200 bg-white">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                                                    {selectedConversation.session.mentorId?.photo ? (
                                                        <img src={selectedConversation.session.mentorId.photo} alt={selectedConversation.session.mentorId.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white font-bold">{selectedConversation.session.mentorId?.name?.charAt(0) || "M"}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h2 className="font-bold text-gray-900">{selectedConversation.session.mentorId?.name}</h2>
                                                    <p className="text-sm text-gray-600">{selectedConversation.session.sessionTypeId?.title}</p>
                                                </div>
                                            </div>
                                            <span className={`text-sm px-3 py-1 rounded-full ${getStatusBadge(selectedConversation.session.status)}`}>
                                                {selectedConversation.session.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                        {messages.length === 0 ? (
                                            <div className="text-center py-12">
                                                <p className="text-gray-500">No messages yet. Start the conversation!</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, idx) => {
                                                const isOwnMessage = msg.senderType === "user";
                                                return (
                                                    <div key={idx} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                                        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "bg-blue-600 text-white" : "bg-white text-gray-900"} rounded-lg px-4 py-2 shadow-sm`}>
                                                            <p className="text-sm">{msg.message}</p>
                                                            <p className={`text-xs mt-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-gray-200 bg-white">
                                        {!messagingAllowed ? (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                                <p className="text-red-800 text-sm font-medium">{messagingReason}</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2 text-center">
                                                    <p className="text-blue-800 text-xs">You can message before, during, and after the session</p>
                                                </div>
                                                <form onSubmit={sendMessage} className="flex space-x-2">
                                                    <input
                                                        type="text"
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        placeholder="Type your message..."
                                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        disabled={sending}
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={sending || !newMessage.trim()}
                                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {sending ? "Sending..." : "Send"}
                                                    </button>
                                                </form>
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-gray-50">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
                                        <p className="text-gray-500 mt-1">Choose a conversation to start messaging</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messages;

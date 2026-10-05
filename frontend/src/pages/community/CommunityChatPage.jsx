import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { communityService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';
import ConfirmModal from '../../components/ConfirmModal';
import {
  IconMessageSquare,
  IconSend,
  IconCornerDownRight,
  IconTrash,
  IconShieldCheck,
  IconUsers,
  IconX,
  IconClock,
  IconMapPin
} from '../../components/Icons';

const CommunityChatPage = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef(null);
  const chatFeedRef = useRef(null);
  const isScrolledToBottomRef = useRef(true);

  // Helper to scroll to newest messages
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Track if user has manually scrolled up
  const handleScroll = () => {
    if (!chatFeedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatFeedRef.current;
    // User is considered at bottom if within 80px of bottom
    isScrolledToBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  // Fetch recent messages
  const fetchMessages = useCallback(async (isInitial = false) => {
    try {
      const res = await communityService.getMessages();
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
        setError('');
        if (isInitial) {
          setTimeout(() => scrollToBottom('auto'), 100);
        } else if (isScrolledToBottomRef.current) {
          scrollToBottom('smooth');
        }
      }
    } catch (err) {
      if (isInitial) {
        setError(err.response?.data?.message || err.message || 'Failed to load community messages.');
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch and 3.5s polling loop
  useEffect(() => {
    fetchMessages(true);

    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, 3500);

    return () => clearInterval(intervalId);
  }, [fetchMessages]);

  // Send new message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError('');

    try {
      const payload = {
        message: trimmed,
        reply_to_message_id: replyTarget ? replyTarget.id : null
      };

      const res = await communityService.sendMessage(payload);
      if (res.success) {
        setInputText('');
        setReplyTarget(null);
        // Refresh immediately after sending
        await fetchMessages(false);
        setTimeout(() => scrollToBottom('smooth'), 50);
      } else {
        setSendError(res.message || 'Failed to send message.');
      }
    } catch (err) {
      setSendError(err.response?.data?.message || err.message || 'Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key for fast sending
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Admin delete message
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const res = await communityService.deleteMessage(deleteTargetId);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== deleteTargetId));
        setDeleteTargetId(null);
      } else {
        setError(res.message || 'Failed to delete message.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error deleting message.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return timeStr;
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${timeStr}`;
  };

  return (
    <div className="community-chat-container" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '520px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 className="page-title" style={{ margin: 0, fontSize: '1.75rem' }}>Live Community Chat</h1>
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                Live Feed
              </span>
            </div>
            <p className="page-subtitle" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              Public safety forum for real-time neighborhood updates, community support, and safety advice.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <IconUsers size={16} color="var(--primary-blue)" />
            <span>{messages.length} recent messages</span>
          </div>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {/* Main Chat Box */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        {/* Messages Feed Area */}
        <div
          ref={chatFeedRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backgroundColor: '#f8fafc'
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <LoadingSpinner message="Connecting to community chat..." />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ margin: 'auto' }}>
              <EmptyState
                icon={<IconMessageSquare size={42} color="var(--primary-blue)" />}
                title="Welcome to the Community!"
                message="No messages yet. Be the first to share a safety update or start the conversation."
              />
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = user && String(msg.user_id) === String(user.id);
              const isMsgAdmin = (msg.user_role || '').toLowerCase() === 'admin';

              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                    width: '100%'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      minWidth: '260px',
                      backgroundColor: isOwnMessage ? 'var(--primary-blue-subtle)' : '#ffffff',
                      border: isOwnMessage ? '1px solid var(--primary-blue-border)' : '1px solid var(--border-light)',
                      borderRadius: '12px',
                      padding: '0.85rem 1.1rem',
                      boxShadow: 'var(--shadow-xs)',
                      position: 'relative'
                    }}
                  >
                    {/* Author Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: isOwnMessage ? 'var(--primary-blue-hover)' : 'var(--primary-navy)' }}>
                          {isOwnMessage ? 'You' : msg.user_name || 'Community Member'}
                        </span>

                        {isMsgAdmin && (
                          <span className="badge badge-admin" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                            <IconShieldCheck size={12} style={{ marginRight: '2px' }} />
                            Admin
                          </span>
                        )}

                        {msg.user_district && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <IconMapPin size={11} color="var(--text-subtle)" />
                            {msg.user_district}{msg.user_state ? `, ${msg.user_state}` : ''}
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <IconClock size={11} />
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>

                    {/* Reply Quotation Box */}
                    {msg.reply_to_message_id && msg.reply_to_snippet && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.4rem',
                          padding: '0.4rem 0.65rem',
                          marginBottom: '0.55rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.03)',
                          borderLeft: '3px solid var(--primary-blue)',
                          borderRadius: '4px',
                          fontSize: '0.82rem',
                          color: 'var(--text-body)'
                        }}
                      >
                        <IconCornerDownRight size={13} color="var(--primary-blue)" style={{ marginTop: '2px' }} />
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong style={{ color: 'var(--primary-navy)' }}>{msg.reply_to_user_name || 'User'}</strong>: "{msg.reply_to_snippet}"
                        </div>
                      </div>
                    )}

                    {/* Message Body */}
                    <div
                      style={{
                        fontSize: '0.94rem',
                        lineHeight: 1.5,
                        color: 'var(--text-main)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.message}
                    </div>

                    {/* Action Bar */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginTop: '0.5rem',
                        paddingTop: '0.35rem',
                        borderTop: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setReplyTarget(msg)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--primary-blue)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 4px'
                        }}
                        title="Reply to this message"
                      >
                        <IconCornerDownRight size={13} />
                        Reply
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(msg.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--hazard-high)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '2px 4px'
                          }}
                          title="Admin: Remove message"
                        >
                          <IconTrash size={13} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Target Header Banner */}
        {replyTarget && (
          <div
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: 'var(--primary-blue-subtle)',
              borderTop: '1px solid var(--primary-blue-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              <IconCornerDownRight size={15} color="var(--primary-blue)" />
              <span style={{ color: 'var(--text-muted)' }}>Replying to:</span>
              <strong style={{ color: 'var(--primary-navy)' }}>{replyTarget.user_name || 'User'}</strong>
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{replyTarget.message.slice(0, 55)}{replyTarget.message.length > 55 ? '...' : ''}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Cancel reply"
            >
              <IconX size={16} />
            </button>
          </div>
        )}

        {sendError && (
          <div style={{ padding: '0.5rem 1.25rem', backgroundColor: '#fef2f2', borderTop: '1px solid #fee2e2' }}>
            <span style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{sendError}</span>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: '#ffffff',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexShrink: 0
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={1000}
              placeholder={
                replyTarget
                  ? `Write a reply to ${replyTarget.user_name || 'user'}... (Press Enter to send)`
                  : 'Write a community message... (Press Enter to send)'
              }
              className="form-control"
              style={{
                width: '100%',
                paddingRight: '4.5rem',
                fontSize: '0.92rem',
                borderRadius: 'var(--radius-md)'
              }}
              disabled={sending}
            />
            <span
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.72rem',
                color: inputText.length > 900 ? 'var(--hazard-high)' : 'var(--text-subtle)',
                pointerEvents: 'none'
              }}
            >
              {inputText.length}/1000
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!inputText.trim() || sending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.92rem'
            }}
          >
            <IconSend size={16} />
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      </div>

      {/* Admin Delete Confirmation Modal */}
      {deleteTargetId && (
        <ConfirmModal
          isOpen={true}
          title="Remove Community Message"
          message="Are you sure you want to remove this community message? This message will no longer appear in the community feed."
          confirmText={isDeleting ? 'Removing...' : 'Remove Message'}
          cancelText="Cancel"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
};

export default CommunityChatPage;

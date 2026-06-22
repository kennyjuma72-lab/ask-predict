import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Text, ActivityIndicator, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, limit, where, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import ChatMessage from '../components/ChatMessage';

const { width } = Dimensions.get('window');

interface PrivateMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  recipientId: string;
  timestamp: Date;
  eventId: string;
  replyTo?: {
    id: string;
    text: string;
    userName: string;
  };
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
  }>;
  deleted?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  readAt?: Date;
}

interface PrivateChatScreenProps {
  navigation: any;
  route?: {
    params?: {
      eventId?: string;
      recipientId?: string;
      recipientName?: string;
      recipientPhotoURL?: string;
    };
  };
}

export default function PrivateChatScreen({ navigation, route }: PrivateChatScreenProps) {
  const { eventId, recipientId, recipientName, recipientPhotoURL } = route?.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; userName: string } | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<PrivateMessage[]>([]);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (eventId) {
          const eventDoc = await getDoc(doc(db, 'events', eventId));
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            setEvent({
              id: eventDoc.id,
              ...eventData,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (eventId && recipientId && user?.id) {
      // Listen to private messages in real-time
      const messagesQuery = query(
        collection(db, 'privateMessages'),
        where('eventId', '==', eventId),
        where('participants', 'array-contains', user.id),
        orderBy('timestamp', 'asc'),
        limit(200)
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messageList: PrivateMessage[] = [];
        snapshot.forEach((messageDoc) => {
          const data = messageDoc.data();
          // Only include messages between current user and recipient
          if ((data.senderId === user.id && data.recipientId === recipientId) ||
              (data.senderId === recipientId && data.recipientId === user.id)) {
            const message: PrivateMessage = {
              id: messageDoc.id,
              text: data.text,
              senderId: data.senderId,
              senderName: data.senderName,
              senderPhotoURL: data.senderPhotoURL,
              recipientId: data.recipientId,
              timestamp: data.timestamp?.toDate() || new Date(),
              eventId: data.eventId,
              replyTo: data.replyTo,
              reactions: data.reactions || [],
              deleted: data.deleted || false,
              status: data.status || (data.senderId === user.id ? 'sent' : 'delivered'),
              readAt: data.readAt?.toDate(),
            };
            messageList.push(message);

            // Mark as read if message is from recipient and not read yet
            if (data.senderId === recipientId && !data.readAt) {
              updateDoc(doc(db, 'privateMessages', messageDoc.id), {
                status: 'read',
                readAt: serverTimestamp(),
              });
            }
          }
        });
        setMessages(messageList);
        if (searchQuery) {
          setFilteredMessages(messageList.filter(msg => 
            msg.text.toLowerCase().includes(searchQuery.toLowerCase())
          ));
        }
        
        // Scroll to bottom when new messages arrive
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      // Listen to typing indicators
      const typingRef = doc(db, 'typingIndicators', `${eventId}_${recipientId}`);
      const typingUnsubscribe = onSnapshot(typingRef, (snap) => {
        if (snap.exists()) {
          setRecipientTyping(snap.data()?.isTyping || false);
        }
      });

      // Listen to online status
      const onlineRef = doc(db, 'onlineUsers', `${eventId}_${recipientId}`);
      const onlineUnsubscribe = onSnapshot(onlineRef, (snap) => {
        if (snap.exists()) {
          setIsOnline(snap.data()?.isOnline || false);
        }
      });

      // Set current user as online
      const myOnlineRef = doc(db, 'onlineUsers', `${eventId}_${user.id}`);
      setDoc(myOnlineRef, {
        userId: user.id,
        userName: user.name || user.email?.split('@')[0] || 'Anonymous',
        eventId: eventId,
        lastSeen: serverTimestamp(),
        isOnline: true,
      });

      return () => {
        unsubscribe();
        typingUnsubscribe();
        onlineUnsubscribe();
        // Set offline when leaving
        updateDoc(myOnlineRef, { isOnline: false });
      };
    }
  }, [eventId, recipientId, user]);

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    if (!user?.id || !eventId || !recipientId) return;

    // Update typing indicator
    const typingRef = doc(db, 'typingIndicators', `${eventId}_${recipientId}`);
    setDoc(typingRef, {
      userId: user.id,
      userName: user.name || user.email?.split('@')[0] || 'Anonymous',
      eventId: eventId,
      recipientId: recipientId,
      isTyping: text.length > 0,
      timestamp: serverTimestamp(),
    });

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set timeout to stop typing indicator
    const timeout = setTimeout(() => {
      setDoc(typingRef, {
        userId: user.id,
        userName: user.name || user.email?.split('@')[0] || 'Anonymous',
        eventId: eventId,
        recipientId: recipientId,
        isTyping: false,
        timestamp: serverTimestamp(),
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !eventId || !recipientId) {
      return;
    }

    // Stop typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    const typingRef = doc(db, 'typingIndicators', `${eventId}_${recipientId}`);
    setDoc(typingRef, {
      userId: user.id,
      userName: user.name || user.email?.split('@')[0] || 'Anonymous',
      eventId: eventId,
      recipientId: recipientId,
      isTyping: false,
      timestamp: serverTimestamp(),
    });

    setSending(true);
    try {
      const messageData: any = {
        text: newMessage.trim(),
        senderId: user.id,
        senderName: user.name || user.email?.split('@')[0] || 'Anonymous',
        senderPhotoURL: user.photoURL || null,
        recipientId: recipientId,
        timestamp: serverTimestamp(),
        eventId: eventId,
        participants: [user.id, recipientId],
        status: 'sent',
        reactions: [],
      };

      if (replyingTo) {
        messageData.replyTo = replyingTo;
      }

      await addDoc(collection(db, 'privateMessages'), messageData);

      setNewMessage('');
      setReplyingTo(null);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleReply = (messageId: string, messageText: string, userName: string) => {
    setReplyingTo({ id: messageId, text: messageText, userName });
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: PrivateMessage }) => {
    const isOwnMessage = item.senderId === user?.id;
    
    return (
      <ChatMessage
        message={{
          id: item.id,
          text: item.text,
          userId: item.senderId,
          userName: item.senderName,
          userPhotoURL: item.senderPhotoURL,
          timestamp: item.timestamp,
          eventId: item.eventId,
          replyTo: item.replyTo,
          reactions: item.reactions,
          deleted: item.deleted,
          status: item.status || (isOwnMessage ? 'sent' : 'delivered'),
        }}
        isOwnMessage={isOwnMessage}
        currentUserId={user?.id || ''}
        onReply={handleReply}
        collectionName="privateMessages"
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('EventDetail', { eventId: route?.params?.eventId })}
          >
            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.recipientInfo}>
              <Avatar.Image
                size={40}
                source={recipientPhotoURL ? { uri: recipientPhotoURL } : undefined}
                style={styles.recipientAvatar}
              />
              <View style={styles.recipientDetails}>
                <Text style={styles.recipientName}>{recipientName}</Text>
                <Text style={styles.recipientStatus}>
                  {recipientTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerAction}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons name={showSearch ? "close" : "search"} size={24} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerAction}
              onPress={() => {
                Alert.alert('Chat Info', `Private conversation with ${recipientName}`);
              }}
            >
              <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text) {
                  setFilteredMessages(messages.filter(msg => 
                    msg.text.toLowerCase().includes(text.toLowerCase())
                  ));
                } else {
                  setFilteredMessages([]);
                }
              }}
              placeholder="Search messages..."
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setFilteredMessages([]);
              }}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Messages List */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={searchQuery ? filteredMessages : messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={60} color="#6366f1" />
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyDescription}>
              Send a message to {recipientName} to begin your private chat
            </Text>
          </View>
        }
        ListFooterComponent={
          recipientTyping ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.typingText}>{recipientName} is typing...</Text>
            </View>
          ) : null
        }
        />
      </KeyboardAvoidingView>

      {/* Modern Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewContent}>
              <View style={styles.replyPreviewLine} />
              <View style={styles.replyPreviewText}>
                <Text style={styles.replyPreviewName}>{replyingTo.userName}</Text>
                <Text style={styles.replyPreviewMessage} numberOfLines={1}>{replyingTo.text}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.replyPreviewClose}
              onPress={() => setReplyingTo(null)}
            >
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputWrapper}>
          <View style={styles.inputField}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={handleTyping}
              placeholder={`Message ${recipientName}...`}
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={1000}
              textAlignVertical="center"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientAvatar: {
    backgroundColor: '#6366f1',
    marginRight: 12,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  recipientStatus: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1e293b',
    fontSize: 15,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navAvatar: {
    backgroundColor: '#8b5cf6',
    marginRight: 12,
  },
  navTitleText: {
    alignItems: 'center',
  },
  navTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navSubtitle: {
    color: '#cccccc',
    fontSize: 12,
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    backgroundColor: '#6366f1',
    marginRight: 8,
  },
  messageContent: {
    maxWidth: width * 0.7,
  },
  senderName: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#ffffff',
  },
  otherText: {
    color: '#1e293b',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: '#9ca3af',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#9ca3af',
    textAlign: 'left',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#f8fafc',
  },
  emptyTitle: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 16,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    color: '#1e293b',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bottomNavItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  bottomNavLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavItem: {
    backgroundColor: '#f0f4ff',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  typingText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  replyPreviewContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyPreviewLine: {
    width: 3,
    height: 40,
    backgroundColor: '#6366f1',
    borderRadius: 2,
    marginRight: 12,
  },
  replyPreviewText: {
    flex: 1,
  },
  replyPreviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 2,
  },
  replyPreviewMessage: {
    fontSize: 12,
    color: '#64748b',
  },
  replyPreviewClose: {
    padding: 4,
    marginLeft: 8,
  },
});


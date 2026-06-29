import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '../../../theme';
import useAuthStore from '../../../store/authStore';
import useChatStore from '../../../store/chatStore';
import useSocketStore from '../../../store/socketStore';
import socketService from '../../../services/socketService';
import chatService from '../../../services/chatService';
import messageService from '../../../services/messageService';
import Header from '../../../components/Header';
import Avatar from '../../../components/Avatar';
import ChatBubble from '../../../components/ChatBubble';
import MessageInput from '../../../components/MessageInput';
import TypingIndicator from '../../../components/TypingIndicator';
import EmptyState from '../../../components/EmptyState';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import VaultSetupModal from '../../../components/VaultSetupModal';
import useVaultStore from '../../../store/vaultStore';
import { formatLastSeen } from '../../../utils';
import { Lock } from 'lucide-react-native';

/**
 * Chat room screen — the main messaging view.
 * Supports real-time messaging, typing indicators, read receipts,
 * and infinite scroll for history.
 */
const ChatRoomScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { userId, username, displayName, profilePicture } = route.params;

  const currentUser = useAuthStore((s) => s.user);
  const {
    messages,
    isLoadingMessages,
    fetchMessages,
    loadMoreMessages,
    addMessage,
    setActiveChatUserId,
    editMessageInStore,
    deleteMessageInStore,
  } = useChatStore();
  const { isUserOnline, isUserTyping, emitTyping, emitStopTyping, emitSeen } =
    useSocketStore();

  const chatMessages = messages[userId] || [];
  const vaultStore = useVaultStore();
  const flatListRef = useRef(null);
  const [chatId, setChatId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVaultSetup, setShowVaultSetup] = useState(false);
  const [editText, setEditText] = useState('');

  const isOnline = isUserOnline(userId);
  const isTyping = isUserTyping(userId);

  // Set active chat user and fetch messages on mount
  useEffect(() => {
    setActiveChatUserId(userId);
    fetchMessages(userId);

    // Get or create chat to get chatId
    const initChat = async () => {
      try {
        const chat = await chatService.getChatWithUser(userId);
        if (chat?._id) {
          setChatId(chat._id);
        }
      } catch (error) {
        console.error('Failed to init chat:', error);
      }
    };
    initChat();

    return () => {
      setActiveChatUserId(null);
    };
  }, [userId, fetchMessages, setActiveChatUserId]);

  // Mark messages as seen when chat opens or new messages arrive
  useEffect(() => {
    if (chatId && chatMessages.length > 0) {
      const unreadFromOther = chatMessages.filter(
        (msg) =>
          (msg.sender?._id || msg.sender) !== currentUser._id &&
          msg.status !== 'read',
      );

      if (unreadFromOther.length > 0) {
        emitSeen(chatId, userId);
      }
    }
  }, [chatId, chatMessages.length, currentUser._id, emitSeen, userId]);

  const handleSend = useCallback(
    (text) => {
      socketService.sendMessage(userId, text);
    },
    [userId],
  );

  const handleTyping = useCallback(() => {
    emitTyping(userId);
  }, [emitTyping, userId]);

  const handleStopTyping = useCallback(() => {
    emitStopTyping(userId);
  }, [emitStopTyping, userId]);

  const handleLoadMore = useCallback(() => {
    loadMoreMessages(userId);
  }, [loadMoreMessages, userId]);

  const handleMessageLongPress = useCallback((message) => {
    setSelectedMessage(message);
    setShowActionModal(true);
  }, []);

  const handleCopy = () => {
    if (selectedMessage) {
      try {
        const { Clipboard } = require('react-native');
        Clipboard.setString(selectedMessage.message);
      } catch (err) {
        console.warn('Clipboard not available:', err);
      }
      setShowActionModal(false);
    }
  };

  const handleDeleteMessage = async (deleteType) => {
    if (!selectedMessage) return;
    try {
      // Optimistic update locally
      deleteMessageInStore(userId, selectedMessage._id, deleteType);
      
      // REST API call
      await messageService.deleteMessage(selectedMessage._id, deleteType);
    } catch (error) {
      console.error('Failed to delete message:', error);
      Alert.alert('Error', error.message || 'Failed to delete message');
      fetchMessages(userId);
    }
  };

  const handleDeletePress = () => {
    if (!selectedMessage) return;

    setShowActionModal(false);

    const isMine = (selectedMessage.sender?._id || selectedMessage.sender) === currentUser._id;
    const options = [];

    if (isMine) {
      options.push({
        text: 'Delete for Everyone',
        style: 'destructive',
        onPress: () => handleDeleteMessage('everyone'),
      });
    }

    options.push({
      text: 'Delete for Me',
      onPress: () => handleDeleteMessage('me'),
    });

    options.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert(
      'Delete Message?',
      'Are you sure you want to delete this message?',
      options,
      { cancelable: true }
    );
  };

  const handleEditSave = async () => {
    if (!selectedMessage || !editText.trim()) return;
    try {
      const msgId = selectedMessage._id;
      const newText = editText.trim();

      // Optimistic update locally
      editMessageInStore(userId, msgId, newText);
      setShowEditModal(false);

      // REST API call
      await messageService.editMessage(msgId, newText);
    } catch (error) {
      console.error('Failed to edit message:', error);
      Alert.alert('Error', error.message || 'Failed to edit message');
      fetchMessages(userId);
    }
  };

  const renderMessage = useCallback(
    ({ item }) => (
      <ChatBubble
        message={item}
        isMine={(item.sender?._id || item.sender) === currentUser._id}
        onLongPress={handleMessageLongPress}
      />
    ),
    [currentUser._id, handleMessageLongPress],
  );

  const keyExtractor = useCallback((item, index) => item._id || `msg-${index}`, []);

  const canEdit = selectedMessage &&
    (selectedMessage.sender?._id || selectedMessage.sender) === currentUser._id &&
    !selectedMessage.deleted &&
    (Date.now() - new Date(selectedMessage.sentAt).getTime()) <= 30 * 60 * 1000;

  // Subtitle: online, typing, or last seen
  const getSubtitle = () => {
    if (isTyping) {
      return 'typing...';
    }
    if (isOnline) {
      return 'online';
    }
    return '';
  };

  const subtitleText = getSubtitle();

  const handleLockChatPress = () => {
    if (!vaultStore.isConfigured) {
      setShowVaultSetup(true);
    } else {
      Alert.alert(
        'Lock Chat',
        'Lock this conversation? It will become hidden from your main chat list.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Lock', 
            style: 'destructive',
            onPress: () => {
              vaultStore.lockChat(userId);
              navigation.goBack();
            }
          }
        ]
      );
    }
  };

  const handleVaultSetupComplete = () => {
    setShowVaultSetup(false);
    vaultStore.lockChat(userId);
    navigation.goBack();
  };

  const isLocked = vaultStore.lockedChatIds.includes(userId);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header with user info */}
      <Header
        showBack
        onBack={() => navigation.goBack()}
        centerComponent={
          <TouchableOpacity style={styles.headerCenter} activeOpacity={0.7}>
            <Avatar
              uri={profilePicture}
              name={displayName}
              size={36}
              showOnline
              isOnline={isOnline}
            />
            <View style={styles.headerInfo}>
              <Text
                style={[styles.headerName, { color: colors.text }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {subtitleText ? (
                <Text
                  style={[
                    styles.headerStatus,
                    {
                      color: isTyping
                        ? colors.typing
                        : isOnline
                          ? colors.online
                          : colors.textTertiary,
                    },
                  ]}
                >
                  {subtitleText}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={handleLockChatPress} style={{ padding: 8 }}>
            <Lock color={isLocked ? colors.primary : colors.textSecondary} size={22} />
          </TouchableOpacity>
        }
      />

      {/* Messages */}
      {isLoadingMessages && chatMessages.length === 0 ? (
        <LoadingSkeleton count={10} type="message" />
      ) : chatMessages.length === 0 ? (
        <EmptyState
          icon="👋"
          title="Start a Conversation"
          subtitle={`Say hello to ${displayName}!`}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          inverted={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageList}
          onStartReached={handleLoadMore}
          onStartReachedThreshold={0.1}
          onContentSizeChange={() => {
            if (chatMessages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListFooterComponent={
            isTyping ? <TypingIndicator username={username} /> : null
          }
        />
      )}

      {/* Message Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />

      {/* Action Bottom Sheet Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.bottomSheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Message Actions</Text>
            </View>

            <TouchableOpacity style={styles.actionItem} onPress={handleCopy}>
              <Text style={[styles.actionText, { color: colors.text }]}>Copy Text</Text>
            </TouchableOpacity>

            {canEdit && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  setShowActionModal(false);
                  setEditText(selectedMessage.message);
                  setShowEditModal(true);
                }}
              >
                <Text style={[styles.actionText, { color: colors.text }]}>Edit Message</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionItem} onPress={handleDeletePress}>
              <Text style={[styles.actionText, { color: colors.error }]}>Delete Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, styles.cancelItem]}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Message Modal Dialog */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCentered}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.dialogContainer}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.dialogBox, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Edit Message</Text>
              
              <TextInput
                placeholder="Edit message..."
                placeholderTextColor={colors.placeholder}
                value={editText}
                onChangeText={setEditText}
                multiline
                style={[
                  styles.editInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
              />

              <View style={styles.dialogButtons}>
                <TouchableOpacity
                  style={[styles.dialogButton, styles.cancelButton]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={[styles.dialogButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.dialogButton, { backgroundColor: colors.primary }]}
                  onPress={handleEditSave}
                >
                  <Text style={[styles.dialogButtonText, { color: '#FFF' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      <VaultSetupModal
        visible={showVaultSetup}
        onClose={() => setShowVaultSetup(false)}
        onComplete={handleVaultSetupComplete}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 1,
  },
  messageList: {
    paddingVertical: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  bottomSheetHeader: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionItem: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelItem: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  dialogBox: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  editInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 80,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  dialogButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
});

export default ChatRoomScreen;

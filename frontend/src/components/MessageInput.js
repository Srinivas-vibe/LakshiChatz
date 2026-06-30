import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useTheme } from '../theme';
import EmojiPicker from 'rn-emoji-keyboard';
import { Smile, SendHorizontal, Keyboard as KeyboardIcon } from 'lucide-react-native';

/**
 * Message input bar for chat room.
 * Features auto-grow text area, send button, and emoji placeholder.
 *
 * @param {Object} props
 * @param {Function} props.onSend - Send message handler.
 * @param {Function} [props.onTyping] - Typing indicator handler.
 * @param {Function} [props.onStopTyping] - Stop typing handler.
 */
const MessageInput = ({ onSend, onTyping, onStopTyping }) => {
  const { colors, borderRadius: br, isDark } = useTheme();
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const handleEmojiSelected = useCallback((emojiObject) => {
    setMessage((prev) => {
      const newText = prev + emojiObject.emoji;
      // Trigger typing indicator
      if (newText.length > 0) {
        onTyping?.();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => onStopTyping?.(), 2000);
      }
      return newText;
    });
  }, [onTyping, onStopTyping]);

  const handleChangeText = useCallback(
    (text) => {
      setMessage(text);

      // Typing indicator logic
      if (text.length > 0) {
        onTyping?.();

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          onStopTyping?.();
        }, 2000);
      } else {
        onStopTyping?.();
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    },
    [onTyping, onStopTyping],
  );

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return;
    }

    onSend(trimmed);
    setMessage('');
    setInputHeight(44);

    // Stop typing indicator
    onStopTyping?.();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [message, onSend, onStopTyping]);

  const handleContentSizeChange = useCallback((event) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.min(Math.max(44, height + 12), 120);
    setInputHeight(newHeight);
  }, []);

  const canSend = message.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.borderLight,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.emojiButton}
        activeOpacity={0.6}
        onPress={() => {
          if (isEmojiPickerOpen) {
            setIsEmojiPickerOpen(false);
            inputRef.current?.focus();
          } else {
            Keyboard.dismiss();
            setIsEmojiPickerOpen(true);
          }
        }}
      >
        {isEmojiPickerOpen ? (
          <KeyboardIcon size={24} color={colors.primary} />
        ) : (
          <Smile size={24} color={colors.textSecondary} />
        )}
      </TouchableOpacity>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderRadius: br.xl,
            height: inputHeight,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { color: colors.text, height: inputHeight - 8 },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={colors.placeholder}
          value={message}
          onChangeText={handleChangeText}
          onContentSizeChange={handleContentSizeChange}
          onFocus={() => setIsEmojiPickerOpen(false)}
          multiline
          maxLength={5000}
          textAlignVertical="center"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          {
            backgroundColor: canSend ? colors.primary : colors.border,
            borderRadius: 22,
          },
        ]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.7}
      >
        <SendHorizontal size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <EmojiPicker
        onEmojiSelected={handleEmojiSelected}
        open={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        theme={{
          backdrop: '#00000055',
          knob: colors.border,
          container: colors.card,
          header: colors.text,
          skinTonesContainer: colors.card,
          category: {
            icon: colors.textSecondary,
            iconActive: colors.primary,
            container: colors.card,
            containerActive: colors.borderLight,
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  emojiButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiIcon: {
    fontSize: 24,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 6,
    justifyContent: 'center',
  },
  input: {
    paddingHorizontal: 16,
    fontSize: 16,
    maxHeight: 112,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default React.memo(MessageInput);

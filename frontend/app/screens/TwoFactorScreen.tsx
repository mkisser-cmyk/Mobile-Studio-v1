import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

export default function TwoFactorScreen() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verify2FA, error, clearError, logout } = useAuth();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    clearError();
    const newCode = [...code];
    
    // Handle paste of full code
    if (text.length > 1) {
      const pastedCode = text.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedCode[i] || '';
      }
      setCode(newCode);
      inputRefs.current[5]?.focus();
      return;
    }

    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setIsSubmitting(true);
    try {
      await verify2FA(fullCode);
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={40} color="#f59e0b" />
            </View>
            <Text style={styles.title}>Two-Factor Authentication</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code from your authenticator app
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  error && styles.codeInputError,
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? 6 : 1}
                editable={!isSubmitting}
                selectTextOnFocus
              />
            ))}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.verifyButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f59e0b20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: '#f59e0b',
  },
  codeInputError: {
    borderColor: '#ef4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef444420',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  verifyButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  cancelButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#6b7280',
  },
});

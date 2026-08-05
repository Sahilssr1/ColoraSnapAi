import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../theme/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerStyle?: object;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leadingIcon,
  trailingIcon,
  containerStyle,
  ...props
}) => {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.inputBackground,
            borderColor: isFocused
              ? theme.tabBarActive
              : !!error
              ? '#FF453A'
              : theme.inputBorder,
          },
          isFocused && styles.focused,
        ]}
      >
        {leadingIcon && <View style={styles.leadingIcon}>{leadingIcon}</View>}
        <TextInput
          placeholderTextColor={theme.textMuted}
          style={[styles.textInput, { color: theme.inputText }]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {trailingIcon && <View style={styles.trailingIcon}>{trailingIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  focused: {
    elevation: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  leadingIcon: {
    marginRight: 10,
  },
  trailingIcon: {
    marginLeft: 10,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

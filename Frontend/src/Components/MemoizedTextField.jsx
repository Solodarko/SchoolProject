import React, { memo, useCallback, useRef, useState, useEffect } from 'react';
import { TextField } from '@mui/material';
import PropTypes from 'prop-types';

// Highly optimized TextField component to prevent focus loss during re-renders
const MemoizedTextField = memo(({ 
  value = '', 
  onChange, 
  onFocus,
  onBlur,
  disabled = false,
  ...otherProps 
}) => {
  // Use ref to track if the field is currently focused
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  
  // Sync internal value with prop value only when not focused
  useEffect(() => {
    if (!isFocused) {
      setInternalValue(value || '');
    }
  }, [value, isFocused]);
  
  // Handle focus events
  const handleFocus = useCallback((event) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(event);
    }
  }, [onFocus]);
  
  const handleBlur = useCallback((event) => {
    setIsFocused(false);
    // Sync value on blur
    if (onChange && internalValue !== value) {
      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          value: internalValue
        }
      };
      onChange(syntheticEvent);
    }
    if (onBlur) {
      onBlur(event);
    }
  }, [onBlur, onChange, internalValue, value]);
  
  // Optimized change handler
  const handleChange = useCallback((event) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
    
    // Immediately call onChange for responsive updates
    if (onChange) {
      onChange(event);
    }
  }, [onChange]);
  
  // Coerce error to boolean and move string error into helperText if needed
  const rawError = otherProps.error;
  const errorAsBool = typeof rawError === 'string' ? rawError.trim().length > 0 : !!rawError;
  const helperTextFromError = typeof rawError === 'string' ? rawError : undefined;
  const helperText = otherProps.helperText ?? helperTextFromError;

  return (
    <TextField
      {...otherProps}
      error={errorAsBool}
      helperText={helperText}
      value={isFocused ? internalValue : (value || '')}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      inputRef={inputRef}
      InputProps={{
        ...otherProps.InputProps,
        autoComplete: otherProps.autoComplete || 'off',
        // Prevent browser autocomplete interference
        spellCheck: false,
      }}
      variant={otherProps.variant || 'outlined'}
      fullWidth={otherProps.fullWidth !== false}
      sx={{
        '& .MuiOutlinedInput-root': {
          transition: 'border-color 0.2s ease-in-out',
        },
        minHeight: '56px',
        ...otherProps.sx
      }}
    />
  );
}, (prevProps, nextProps) => {
  // Custom equality check for optimal performance
  return (
    prevProps.value === nextProps.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.error === nextProps.error &&
    prevProps.label === nextProps.label &&
    prevProps.helperText === nextProps.helperText &&
    prevProps.name === nextProps.name &&
    prevProps.type === nextProps.type &&
    prevProps.placeholder === nextProps.placeholder
  );
});

// Add display name for debugging
MemoizedTextField.displayName = 'MemoizedTextField';

// PropTypes for type checking
MemoizedTextField.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  helperText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  type: PropTypes.string,
  name: PropTypes.string,
  autoComplete: PropTypes.string,
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  fullWidth: PropTypes.bool,
  sx: PropTypes.object,
  InputProps: PropTypes.object
};

export default MemoizedTextField;

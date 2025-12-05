import emailValidator from 'email-validator';

// List of common disposable/temporary email providers
const DISPOSABLE_EMAIL_PROVIDERS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.org',
  'temp-mail.org',
  'throwaway.email',
  'yopmail.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'tempail.com',
  'temporaryinbox.com',
  'dispostable.com',
  'fakeinbox.com',
  'mohmal.com',
  'maildrop.cc',
  'getairmail.com',
  'tempinbox.com',
  '20minutemail.com',
  'emailondeck.com',
  'incognitomail.org',
  'mintemail.com',
  'mytempemail.com',
  'trbvm.com',
  'emailfake.com',
  'emailmule.com',
  'tempemailaddress.com',
  'temporary-email.net',
  'temp-emails.com'
];

export interface EmailValidationResult {
  isValid: boolean;
  isDisposable: boolean;
  error?: string;
}

export function validateEmailAddress(email: string): EmailValidationResult {
  try {
    // Basic validation
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        isDisposable: false,
        error: 'Email address is required'
      };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check basic format
    if (!emailValidator.validate(trimmedEmail)) {
      return {
        isValid: false,
        isDisposable: false,
        error: 'Invalid email format'
      };
    }

    // Extract domain
    const domain = trimmedEmail.split('@')[1];
    
    // Check if it's a disposable email
    const isDisposable = DISPOSABLE_EMAIL_PROVIDERS.some(provider => 
      domain === provider || domain.endsWith('.' + provider)
    );

    if (isDisposable) {
      return {
        isValid: false,
        isDisposable: true,
        error: 'Disposable email addresses are not allowed. Please use a permanent email address.'
      };
    }

    // Additional checks
    if (domain.length < 3) {
      return {
        isValid: false,
        isDisposable: false,
        error: 'Invalid email domain'
      };
    }

    // Check for common patterns of fake emails
    const suspiciousPatterns = [
      /test\d*@/i,
      /fake\d*@/i,
      /dummy\d*@/i,
      /spam\d*@/i,
      /trash\d*@/i
    ];

    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
      pattern.test(trimmedEmail)
    );

    if (hasSuspiciousPattern) {
      return {
        isValid: false,
        isDisposable: false,
        error: 'Please provide a valid business or personal email address'
      };
    }

    return {
      isValid: true,
      isDisposable: false
    };

  } catch (error) {
    console.error('Email validation error:', error);
    return {
      isValid: false,
      isDisposable: false,
      error: 'Failed to validate email address'
    };
  }
}

export function isValidBusinessEmail(email: string): boolean {
  const businessDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'icloud.com',
    'protonmail.com',
    'aol.com'
  ];

  const domain = email.toLowerCase().split('@')[1];
  
  // Allow business domains and educational institutions
  return businessDomains.includes(domain) || 
         domain.endsWith('.edu') || 
         domain.endsWith('.ac.') || 
         domain.endsWith('.org') ||
         (!DISPOSABLE_EMAIL_PROVIDERS.includes(domain) && domain.includes('.'));
}
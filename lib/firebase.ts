import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile, User, sendEmailVerification, signInWithPhoneNumber, RecaptchaVerifier, OAuthProvider, sendPasswordResetEmail } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxpsVfOIrnpYCd1Yy7TPcxEyAqGNkaOTU",
  authDomain: "profitwave-7fea2.firebaseapp.com",
  projectId: "profitwave-7fea2",
  storageBucket: "profitwave-7fea2.firebasestorage.app",
  messagingSenderId: "441212212054",
  appId: "1:441212212054:web:c610afd2092eee482e7cf7",
  measurementId: "G-236XQWBZSJ"
}

// Initialize Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()
const appleProvider = new OAuthProvider('apple.com')

export { auth, googleProvider, facebookProvider, appleProvider }

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    // Send email verification
    await sendEmailVerification(result.user)
    
    return result.user
  } catch (error: any) {
    throw error
  }
}

// Sign up with Facebook
export const signUpWithFacebook = async () => {
  try {
    console.log('Attempting Facebook sign-in...')
    
    // Check if Facebook provider is properly configured
    if (!facebookProvider) {
      throw new Error('Facebook provider not configured')
    }
    
    const result = await signInWithPopup(auth, facebookProvider)
    console.log('Facebook sign-in successful:', result.user)
    return result.user
  } catch (error: any) {
    console.error('Facebook sign-in error:', error.code, error.message)
    
    // Handle specific Facebook sign-in errors
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Facebook sign-in is not enabled. Please use email sign-up.')
    }
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Facebook sign-in was cancelled. Please try again.')
    }
    
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups and try again.')
    }
    
    if (error.message?.includes('Facebook')) {
      throw new Error('Facebook sign-in is not available. Please use email sign-up.')
    }
    
    throw error
  }
}

// Sign up with Google
export const signUpWithGoogle = async () => {
  try {
    console.log('Attempting Google sign-in...')
    
    // Check if Google provider is properly configured
    if (!googleProvider) {
      throw new Error('Google provider not configured')
    }
    
    const result = await signInWithPopup(auth, googleProvider)
    console.log('Google sign-in successful:', result.user)
    return result.user
  } catch (error: any) {
    console.error('Google sign-in error:', error.code, error.message)
    
    // Handle specific Google sign-in errors
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled. Please use email sign-up.')
    }
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in was cancelled. Please try again.')
    }
    
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups and try again.')
    }
    
    if (error.message?.includes('Google')) {
      throw new Error('Google sign-in is not available. Please use email sign-up.')
    }
    
    throw error
  }
}

// Sign up with Apple
export const signUpWithApple = async () => {
  try {
    console.log('Attempting Apple sign-in...')
    
    // Check if Apple provider is properly configured
    if (!appleProvider) {
      throw new Error('Apple provider not configured')
    }
    
    const result = await signInWithPopup(auth, appleProvider)
    console.log('Apple sign-in successful:', result.user)
    return result.user
  } catch (error: any) {
    console.error('Apple sign-in error:', error.code, error.message)
    
    // Handle specific Apple sign-in errors
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Apple sign-in is not enabled. Please use email sign-up.')
    }
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Apple sign-in was cancelled. Please try again.')
    }
    
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups and try again.')
    }
    
    if (error.message?.includes('Apple')) {
      throw new Error('Apple sign-in is not available. Please use email sign-up.')
    }
    
    throw error
  }
}

// Sign up with phone number
export const signUpWithPhone = async (phoneNumber: string, recaptchaContainer: string) => {
  try {
    // Clean and format phone number
    const cleanPhoneNumber = phoneNumber.replace(/\s/g, '').replace(/[^\d+]/g, '')
    
    console.log('Attempting phone auth with:', cleanPhoneNumber)
    
    // Create a Recaptcha verifier
    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
      'size': 'normal',
      'callback': (response: any) => {
        console.log('reCAPTCHA solved')
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired')
      }
    })

    // Send verification code to phone
    const confirmationResult = await signInWithPhoneNumber(auth, cleanPhoneNumber, recaptchaVerifier)
    
    return confirmationResult
  } catch (error: any) {
    console.error('Phone auth error:', error.code, error.message)
    throw error
  }
}

// Verify OTP code
export const verifyOTP = async (confirmationResult: any, otp: string) => {
  try {
    const result = await confirmationResult.confirm(otp)
    return result.user
  } catch (error: any) {
    throw error
  }
}

// Get error message from Firebase error code
export const getErrorMessage = (error: any): string => {
  console.error('Firebase error:', error.code, error.message)
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters'
    case 'auth/operation-not-allowed':
      return 'This authentication method is not enabled. Please contact support.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later'
    case 'auth/user-disabled':
      return 'This account has been disabled'
    case 'auth/user-not-found':
      return 'No account found with this email'
    case 'auth/wrong-password':
      return 'Incorrect password'
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completion'
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by browser. Please allow popups for this site.'
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled'
    default:
      if (error.message?.includes('Google')) {
        return 'Google sign-in is not available at the moment. Please use email sign-up.'
      }
      if (error.message?.includes('Apple')) {
        return 'Apple sign-in is not available at the moment. Please use email sign-up.'
      }
      return error.message || 'An error occurred during authentication'
  }
}

// Reset password function
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
    console.log('Password reset email sent to:', email)
  } catch (error: any) {
    console.error('Password reset error:', error.code, error.message)
    throw error
  }
}

import { NextApiRequest, NextApiResponse } from 'next'
import { resetPassword } from '../../../lib/firebase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { email } = req.body

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    console.log('Attempting to send password reset email to:', email)

    // Send password reset email
    await resetPassword(email)

    console.log('Password reset email sent successfully to:', email)

    res.status(200).json({ 
      message: 'Password reset email sent successfully. Please check your inbox.',
      success: true 
    })

  } catch (error: any) {
    console.error('Password reset API error:', error.code, error.message)

    let errorMessage = 'Failed to send password reset email'
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address'
        break
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address'
        break
      case 'auth/too-many-requests':
        errorMessage = 'Too many requests. Please try again later'
        break
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection'
        break
      default:
        errorMessage = error.message || 'Failed to send password reset email'
    }

    res.status(400).json({ error: errorMessage })
  }
}

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This is a simple proxy to the contact API for admin access
  // In production, you'd want to add proper admin authentication
  
  if (req.method === 'GET') {
    try {
      // Forward the request to the contact API
      const contactApiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || 'https://profitwave.vercel.app'}/api/contact`
      const response = await fetch(contactApiUrl + '?' + new URLSearchParams(req.query as any))
      
      const rawBody = await response.text()
      let data: any = null
      try {
        data = rawBody ? JSON.parse(rawBody) : null
      } catch {
        data = { error: 'Invalid response from contact API' }
      }
      
      res.status(response.status).json(data)
    } catch (error) {
      console.error('Error in admin contact messages API:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

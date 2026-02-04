'use client';

/**
 * Test page to verify Google Maps API key
 */

export default function TestMapsPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Google Maps API Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded">
          <h2 className="font-semibold mb-2">API Key Status:</h2>
          {apiKey ? (
            <div>
              <p className="text-green-500">✓ API Key is configured</p>
              <p className="text-sm text-gray-400 mt-2">
                Key: {apiKey.substring(0, 10)}...
              </p>
            </div>
          ) : (
            <p className="text-red-500">✗ API Key is NOT configured</p>
          )}
        </div>

        <div className="p-4 bg-gray-800 rounded">
          <h2 className="font-semibold mb-2">Environment Variables:</h2>
          <pre className="text-xs text-gray-400">
            {JSON.stringify({
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: apiKey ? 'SET' : 'NOT SET',
              NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
              NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'NOT SET',
            }, null, 2)}
          </pre>
        </div>

        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded">
          <h2 className="font-semibold mb-2">Instructions:</h2>
          <p className="text-sm">
            If the API key is not configured, add it to your Vercel environment variables:
          </p>
          <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
            <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
            <li>Add: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</li>
            <li>Value: Your Google Maps API key</li>
            <li>Redeploy the application</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

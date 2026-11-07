const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function api(path, { token = localStorage.getItem('my_wallet_token'), ...options } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Serveur API inaccessible. Lancez le backend et vérifiez MySQL ainsi que la configuration du fichier .env.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || `Erreur API (${response.status})`)
  return data
}

export const jsonBody = (body) => JSON.stringify(body)

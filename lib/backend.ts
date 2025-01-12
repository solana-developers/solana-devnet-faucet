import { GoogleAuth } from 'google-auth-library';

const BASE_URL = 'https://devnet-faucet-backend-dot-analytics-324114.de.r.appspot.com/api';

// Fetch service account token for authentication
const getAccessToken = async (): Promise<string> => {
  if(process.env.BE_TOKEN !== undefined){
    return process.env.BE_TOKEN;
  }

  const key = process.env.BE_SERVICE_ACCOUNT_KEY as string;
  const auth = new GoogleAuth({
    credentials: JSON.parse(key),
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token as string;
};
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 404) {
      // Handle 404: return an appropriate fallback
      return {};
    }
    // Throw for other error codes
    const error = await response.text();
    throw new Error(`HTTP error ${response.status}: ${error}`);
  }
  return response.json();
};

// Utility function for making authenticated fetch requests
const fetchRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const token = await getAccessToken(); // Get token for each request
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`, // Add token to Authorization header
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error during fetch request to ${url}: ${error}`);
    throw error;
  }
};

// Solana Balances API
const solanaBalancesAPI = {
  create: async (account: string, balance: number) => {
    return fetchRequest(`${BASE_URL}/solana-balances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account, balance }),
    });
  },
  getAllForAccount: async (account: string) => {
    return fetchRequest(`${BASE_URL}/solana-balances/account/${account}`, {
      method: 'GET',
    });
  },
  getRecent: async () => {
    return fetchRequest(`${BASE_URL}/solana-balances/recent`, {
      method: 'GET',
    });
  },
};

// Rate Limits API
const rateLimitsAPI = {
  create: async (key: string, timestamps: number[]) => {
    return fetchRequest(`${BASE_URL}/rate-limits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, timestamps }),
    });
  },
  getByKey: async (key: string) => {
    return fetchRequest(`${BASE_URL}/rate-limits/${key}`, {
      method: 'GET',
    });
  },
  update: async (key: string, timestamps: number[]) => {
    return fetchRequest(`${BASE_URL}/rate-limits/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timestamps }),
    });
  },
};

// Github Validation API
const githubValidationAPI = {
  ghValidation: async (userId: string) => {
    return fetchRequest(`${BASE_URL}/gh-validation/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};

// Export the API objects
export { solanaBalancesAPI, rateLimitsAPI, githubValidationAPI };






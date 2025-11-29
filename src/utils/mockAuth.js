// Mock authentication service - simulates backend API calls
// This will be replaced with real API calls later

const USERS_KEY = 'petfeeder_users';
const CURRENT_USER_KEY = 'petfeeder_current_user';

// Helper to generate UUID
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get all users from localStorage
const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

// Save users to localStorage
const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Mock signup
export const signup = async ({ name, email, password }) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const users = getUsers();
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    throw new Error('User with this email already exists');
  }

  // Create new user
  const newUser = {
    id: generateId(),
    name,
    email,
    password, // In real app, this would be hashed on backend
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    createdAt: new Date().toISOString(),
    feeders: [] // Will be populated when user creates/joins feeders
  };

  users.push(newUser);
  saveUsers(users);

  // Create session (exclude password)
  const { password: _, ...userWithoutPassword } = newUser;
  const session = {
    user: userWithoutPassword,
    token: `mock-jwt-token-${generateId()}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
  return session;
};

// Mock login
export const login = async ({ email, password, rememberMe = false }) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Create session (exclude password)
  const { password: _, ...userWithoutPassword } = user;
  const expiryDays = rememberMe ? 30 : 7;
  const session = {
    user: userWithoutPassword,
    token: `mock-jwt-token-${generateId()}`,
    expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
  return session;
};

// Mock logout
export const logout = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Get current session
export const getCurrentSession = () => {
  const session = localStorage.getItem(CURRENT_USER_KEY);
  if (!session) return null;

  const parsed = JSON.parse(session);
  
  // Check if token is expired
  if (new Date(parsed.expiresAt) < new Date()) {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }

  return parsed;
};

// Validate token (mock)
export const validateToken = async (token) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const session = getCurrentSession();
  return session && session.token === token;
};

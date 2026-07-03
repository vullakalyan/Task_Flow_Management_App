// Compatibility bridge after migration to MongoDB Atlas.
// This preserves the exported signatures to prevent build/import breaks in existing components.

export const isUsingMock = false;

export const hasRealCredentials = () => {
  return true;
};

export const toggleSandboxMode = (val: boolean) => {
  if (val) {
    // Managed on the server-side fallback
  }
};

export const supabase = {
  auth: {
    signOut: async () => {
      localStorage.removeItem('auth_token');
    }
  }
};

export default supabase;

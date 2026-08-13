  (function(){
    const SUPABASE_URL = 'https://xiqpchdxpmvrjfbeovuk.supabase.co';
    const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__C5M9dkR-yk_x3y8ltr3bw_qyKTqV6a';

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    window.cloud = {
      client,
      async signUp(email, password){
        return client.auth.signUp({ email, password });
      },
      async signIn(email, password){
        return client.auth.signInWithPassword({ email, password });
      },
      async signOut(){
        return client.auth.signOut();
      },
      async getSession(){
        const { data } = await client.auth.getSession();
        return data.session || null;
      },
      async getUser(){
        const { data } = await client.auth.getUser();
        return data.user || null;
      }
    };
  })();

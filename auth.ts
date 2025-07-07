import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
//import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';

//const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
const sql = neon('postgres://neondb_owner:npg_ykaXK61nRbVg@ep-broad-grass-adgzeeft-pooler.c-2.us-east-1.aws.neon.tech/neondb');
 
async function getUser(email: string): Promise<User | undefined> {
  try {
    console.log('1. email : ', email);
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
 
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
 
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password); 
          if (passwordsMatch) return user;  
       
        }
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});
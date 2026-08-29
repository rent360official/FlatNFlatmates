import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { checkVerificationToken } from "@/lib/telephony";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID_PLACEHOLDER",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET_PLACEHOLDER",
    }),
    CredentialsProvider({
      name: "OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
        email: { label: "Email (Optional)", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error("Phone number and OTP are required");
        }

        await dbConnect();

        const { phone, otp, email, name } = credentials;

        const cleanPhone = phone.replace(/\D/g, '');
        const user = await User.findOne({ phone: cleanPhone });
        if (!user) {
          throw new Error("User record not found. Please request an OTP first.");
        }

        const provider = process.env.TELEPHONY_PROVIDER || "mock";
        let isVerified = false;

        if (provider === "mock") {
          if (otp === "123456") {
            isVerified = true;
            user.otp = undefined; // Clear OTP
          } else if (user.otp && user.otp.code === otp && user.otp.expiresAt > new Date()) {
            isVerified = true;
            user.otp = undefined; // Clear OTP
          }
        } else {
          const { approved, error } = await checkVerificationToken(cleanPhone, otp);
          if (error) {
            throw new Error(error);
          }
          isVerified = approved;
        }

        if (isVerified) {
          // Sign Up: save profile details if user name is missing
          if (!user.name) {
            if (!name) {
              throw new Error("Name is required for registration");
            }
            user.name = name;
            if (email) {
              user.email = email;
            }
          }
          
          // Secure server-side super admin promotion for target number
          if (cleanPhone === "8933066862") {
            user.role = "super_admin";
          }
          
          user.verificationStatus = "verified";
          await user.save();

          return {
            id: user._id.toString(),
            name: user.name || "",
            email: user.email || "",
            phone: user.phone,
            role: user.role,
          };
        }

        throw new Error("Invalid OTP code or OTP expired");
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await dbConnect();
        let dbUser = await User.findOne({ email: user.email });
        if (!dbUser) {
          dbUser = await User.create({
            name: user.name || undefined,
            email: user.email || undefined,
            profilePhoto: user.image || undefined,
            phone: "GOOGLE_" + user.id, // Placeholder until user updates their profile
            role: "user",
            verificationStatus: "verified",
          });
        }
        user.id = dbUser._id.toString();
        (user as any).role = dbUser.role;
        (user as any).phone = dbUser.phone;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "NEXTAUTH_SECRET_PLACEHOLDER",
};

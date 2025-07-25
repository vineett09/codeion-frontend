import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import User from "@/models/User";
import connectToDatabase from "@/lib/mongoose";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectToDatabase();

        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            providerId: account.providerAccountId,
          });
        } else {
          await User.findByIdAndUpdate(existingUser._id, {
            name: user.name,
            image: user.image,
            providerId: account.providerAccountId,
            updatedAt: new Date(),
          });
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (account) {
        await connectToDatabase();
        const customUser = await User.findOne({ email: token.email });

        if (customUser) {
          token.id = customUser._id.toString();
          token.solvedProblems = customUser.solvedProblems;
          token.winCount = customUser.winCount;
          token.totalGames = customUser.totalGames;
          token.currentRoomId = customUser.currentRoomId;
          token.preferredTopics = customUser.preferredTopics;
          token.preferredDifficulty = customUser.preferredDifficulty;
          token.rating = customUser.rating;
          token.bio = customUser.bio;
          token.githubLink = customUser.githubLink;
          token.linkedinLink = customUser.linkedinLink;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.solvedProblems = token.solvedProblems;
        session.user.winCount = token.winCount;
        session.user.totalGames = token.totalGames;
        session.user.currentRoomId = token.currentRoomId;
        session.user.preferredTopics = token.preferredTopics;
        session.user.preferredDifficulty = token.preferredDifficulty;
        session.user.rating = token.rating;
        session.user.bio = token.bio;
        session.user.githubLink = token.githubLink;
        session.user.linkedinLink = token.linkedinLink;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

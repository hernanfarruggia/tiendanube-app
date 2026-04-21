import passport from "passport";
import passportJWT from "passport-jwt";
import { userRepository } from "@repository";

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.CLIENT_SECRET || process.env.SECRET_KEY || "THE_SECRET",
    },
    async (jwtPayload, done) => {
      try {
        // Tiendanube JWT payload structure: { user_id: number, store_id: number, ... }
        const userId = jwtPayload.user_id || jwtPayload.storeId;

        if (!userId) {
          console.error('[Auth] No user_id or storeId found in JWT payload:', jwtPayload);
          return done(null, false);
        }

        const user = await userRepository.findOne(userId);
        if (user) {
          return done(null, user);
        }

        console.error('[Auth] User not found for ID:', userId);
        return done(null, false);
      } catch (error) {
        console.error('[Auth] Error in JWT strategy:', error);
        return done(error, false);
      }
    }
  )
);

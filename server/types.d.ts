import "express-session";
import { User as AppUser } from "../shared/schema";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

declare global {
    namespace Express {
        interface User extends AppUser { }
    }
}

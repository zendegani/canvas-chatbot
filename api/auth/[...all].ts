import { toNodeHandler } from "better-auth/node";
import { auth } from "../_lib/auth.js";

export default toNodeHandler(auth);

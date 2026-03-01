import { toNodeHandler } from "better-auth/node";
import { auth } from "../_lib/auth";

export default toNodeHandler(auth);

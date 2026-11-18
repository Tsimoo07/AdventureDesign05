import type { IncomingMessage, ServerResponse } from "node:http";
import { everytime } from "../server/everytime.ts";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return everytime(req, res, () => {
    res.statusCode = 404;
    res.end();
  });
}

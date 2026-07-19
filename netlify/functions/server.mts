import handler from "../../dist/server/server.js";

export default (request: Request) => handler.fetch(request, {}, {});

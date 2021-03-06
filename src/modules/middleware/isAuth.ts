import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../../types";
import { ERROR_MESSAGES } from "../../constants";

const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  // Throw Error if Cookie Doesn't Exist
  if (!context.req.session!.userId) throw new Error(ERROR_MESSAGES.USER);

  return next();
};

export default isAuth;

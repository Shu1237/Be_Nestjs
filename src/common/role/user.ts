import { ForbiddenException } from "@nestjs/common";
import { Role } from "../enums/roles.enum";
import { JWTUserType } from "../utils/type";

export const checkUserRole = (user: JWTUserType, msg: string): void => {
    if (user.role_id === Role.USER ) {
        throw new ForbiddenException(msg);
    }
}
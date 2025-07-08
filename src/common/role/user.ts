import { ForbiddenException } from "@nestjs/common";
import { Role } from "../enums/roles.enum";
import { JWTUserType } from "../utils/type";

export const checkUserRole = (user: JWTUserType, msg: string,id:string): void => {
    if (user.role_id === Role.USER && id.toString() !== user.account_id.toString()) {
        throw new ForbiddenException(msg);
    }
}
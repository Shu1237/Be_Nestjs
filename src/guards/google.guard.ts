import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';


@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
    canActivate(context: ExecutionContext) {
        console.log('Inside Google AuthGuard canActivate');
        return super.canActivate(context);
    }
}
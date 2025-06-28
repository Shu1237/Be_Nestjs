import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';
import { NotFoundException } from '../exceptions/not-found.exception';
import { ConflictException } from '../exceptions/conflict.exception';
import { InternalServerErrorException } from '../exceptions/internal-server-error.exception';
import { ForbiddenException } from '../exceptions/forbidden.exception';

@Injectable()
export class HttpErrorInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // console.log('HttpErrorInterceptor: intercepting request');
        return next.handle().pipe(
            catchError((error) => {
                if (error instanceof HttpException) {
                    const status = error.getStatus();
                    if (status === 403) {
                        return throwError(() => new ForbiddenException(error.message));
                    }

                    if (status === 404) {
                        return throwError(() => new NotFoundException(error.message));
                    }

                    if (status === 409) {
                        return throwError(() => new ConflictException(error.message));
                    }

                    return throwError(() => error);
                }

                return throwError(() => new InternalServerErrorException(error.message));
            }),
        );
    }
}

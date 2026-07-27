import {
  Controller,
  Sse,
  Query,
  UnauthorizedException,
  Req,
  Res,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Observable, map, finalize } from 'rxjs';
import { EventsService } from './events.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import type { Request, Response } from 'express';

interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Sse('stream')
  stream(
    @Query('token') token: string,
    @Query('bookingId') bookingId: string | undefined,
    @Req() _req: Request,
    @Res() _res: Response,
  ): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException('Token manquant.');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token invalide.');
    }

    const userId = payload.sub;

    return this.eventsService.subscribe(userId, bookingId).pipe(
      map((event) => ({
        data: event,
        id: `${event.type}-${Date.now()}`,
        type: event.type,
      })),
      finalize(() => {
        this.eventsService.removeUser(userId);
      }),
    );
  }
}

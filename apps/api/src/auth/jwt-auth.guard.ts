import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT standard. Usage : `@UseGuards(JwtAuthGuard)`.
 * Pose req.user = { id, email, role } via JwtStrategy.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

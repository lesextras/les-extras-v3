import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

interface UserCtx {
  id: string;
  role: string;
}

interface AccountCtx {
  id: string;
}

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /**
   * Dépôt d'un avis après une prestation terminée. Le compte actif
   * (x-account-id) doit être l'une des deux parties de la réservation.
   */
  @Post()
  @UseGuards(AccountGuard)
  create(
    @CurrentUser() user: UserCtx,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(user.id, account.id, dto);
  }

  /** Avis restant à déposer par le compte actif (dans les deux sens). */
  @Get('pending')
  @UseGuards(AccountGuard)
  findPending(@CurrentUser() user: UserCtx, @CurrentAccount() account: AccountCtx) {
    return this.reviews.findPending(user.id, account.id);
  }

  @Get('user/:userId')
  findForUser(@Param('userId') userId: string) {
    return this.reviews.findForUser(userId);
  }

  @Get('booking/:bookingId')
  findForBooking(@Param('bookingId') bookingId: string) {
    return this.reviews.findForBooking(bookingId);
  }
}

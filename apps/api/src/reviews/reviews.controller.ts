import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

interface UserCtx {
  id: string;
  role: string;
}

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  create(@CurrentUser() user: UserCtx, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto);
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

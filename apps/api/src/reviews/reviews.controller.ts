import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateReviewDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.reviewsService.create(dto, req.user);
  }

  @Get("user/:id")
  findByTarget(@Param("id") targetId: string) {
    return this.reviewsService.findByTarget(targetId);
  }

  @Get("user/:id/average")
  getAverageRating(@Param("id") targetId: string) {
    return this.reviewsService.getAverageRating(targetId);
  }

  // C5: Protected — only participants of the booking can see its reviews
  @UseGuards(JwtAuthGuard)
  @Get("booking/:bookingId")
  findByBooking(
    @Param("bookingId") bookingId: string,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.reviewsService.findByBooking(bookingId, req.user.id);
  }
}

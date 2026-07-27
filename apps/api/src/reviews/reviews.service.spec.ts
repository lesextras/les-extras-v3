import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingStatus, ReviewType } from '@prisma/client';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { bookingId: 'booking-1', rating: 5, comment: 'Great!', type: ReviewType.FREELANCE_TO_ESTABLISHMENT };
    const user = { id: 'freelance-1' } as any;

    it('should create a review if all rules are met (Freelance to Establishment)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        freelanceId: 'freelance-1',
        establishmentId: 'est-1',
        status: BookingStatus.COMPLETED,
        reviews: [],
      });

      mockPrismaService.review.create.mockResolvedValue({ id: 'review-1', ...dto });

      const result = await service.create(dto, user);

      expect(result).toBeDefined();
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: {
          bookingId: dto.bookingId,
          authorId: 'freelance-1',
          targetId: 'est-1',
          rating: dto.rating,
          comment: dto.comment,
          type: ReviewType.FREELANCE_TO_ESTABLISHMENT,
        },
      });
    });

    it('should create a review if all rules are met (Establishment to Freelance)', async () => {
      const estDto = { ...dto, type: ReviewType.ESTABLISHMENT_TO_FREELANCE };
      const estUser = { id: 'est-1' } as any;
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        freelanceId: 'freelance-1',
        establishmentId: 'est-1',
        status: BookingStatus.COMPLETED,
        reviews: [],
      });

      mockPrismaService.review.create.mockResolvedValue({ id: 'review-1', ...estDto });

      const result = await service.create(estDto, estUser);

      expect(result).toBeDefined();
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: {
          bookingId: dto.bookingId,
          authorId: 'est-1',
          targetId: 'freelance-1',
          rating: dto.rating,
          comment: dto.comment,
          type: ReviewType.ESTABLISHMENT_TO_FREELANCE,
        },
      });
    });

    it('should throw ForbiddenException if author is not part of the booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        freelanceId: 'freelance-1',
        establishmentId: 'est-1',
        status: BookingStatus.COMPLETED,
        reviews: [],
      });

      await expect(service.create(dto, { id: 'other-user' } as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if mission is not completed', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        freelanceId: 'freelance-1',
        establishmentId: 'est-1',
        status: BookingStatus.PENDING,
        reviews: [],
      });

      await expect(service.create(dto, user)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if duplicate rating', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        freelanceId: 'freelance-1',
        establishmentId: 'est-1',
        status: BookingStatus.COMPLETED,
        reviews: [{ id: 'existing-review', authorId: 'freelance-1' }],
      });

      await expect(service.create(dto, user)).rejects.toThrow(ConflictException);
    });
  });

  describe('read / aggregate', () => {
    it('should return reviews for a target', async () => {
      const targetId = 'est-1';
      mockPrismaService.review.findMany.mockResolvedValue([{ id: 'rev-1', rating: 5 }]);
      const result = await service.findByTarget(targetId);
      expect(result).toHaveLength(1);
      expect(prisma.review.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { targetId }
      }));
    });

    it('should return stats for a target', async () => {
      const targetId = 'est-1';
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 10 },
      });
      const result = await service.getAverageRating(targetId);
      expect(result).toEqual({ average: 4.5, count: 10 });
    });

    it('should return reviews for a booking when user is participant', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        establishmentId: 'est-1',
        freelanceId: 'freelance-1',
      });
      mockPrismaService.review.findMany.mockResolvedValue([{ id: 'rev-1' }]);
      const result = await service.findByBooking('booking-1', 'est-1');
      expect(result).toHaveLength(1);
    });

    it('should throw ForbiddenException for findByBooking if user is not a participant', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        establishmentId: 'est-1',
        freelanceId: 'freelance-1',
      });
      await expect(service.findByBooking('booking-1', 'outsider')).rejects.toThrow(ForbiddenException);
    });
  });
});


import { Injectable } from "@nestjs/common";
import { BookingStatus, InvoiceStatus, QuoteStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  AdminAwaitingPaymentBookingRow,
  AdminFinanceBookingType,
  AdminFinanceInvoiceRow,
  AdminFinanceQuoteRow,
  AdminFinanceSummary,
} from "./types/admin-finance.types";

function getDisplayName(
  user:
    | {
        email: string;
        profile?: { firstName: string | null; lastName: string | null } | null;
      }
    | null
    | undefined,
) {
  if (!user) {
    return "Non assigné";
  }

  const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

function getBookingType(booking: {
  reliefMission?: unknown;
  service?: unknown;
}): AdminFinanceBookingType {
  return booking.reliefMission ? "MISSION" : "SERVICE";
}

function getBookingTitle(booking: {
  reliefMission?: { title: string } | null;
  service?: { title: string } | null;
}) {
  return booking.reliefMission?.title ?? booking.service?.title ?? "Réservation";
}

function getProviderName(booking: {
  reliefMission?: unknown;
  freelance?:
    | {
        email: string;
        profile?: { firstName: string | null; lastName: string | null } | null;
      }
    | null;
  service?:
    | {
        owner:
          | {
              email: string;
              profile?: { firstName: string | null; lastName: string | null } | null;
            }
          | null;
      }
    | null;
}) {
  if (booking.reliefMission) {
    return getDisplayName(booking.freelance);
  }

  return getDisplayName(booking.service?.owner ?? booking.freelance);
}

@Injectable()
export class AdminFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<AdminFinanceSummary> {
    const [
      invoiceTotals,
      paidInvoicesCount,
      unpaidInvoicesCount,
      paidInvoiceTotals,
      outstandingInvoiceTotals,
      quotesSentCount,
      quotesAcceptedCount,
      bookingsAwaitingPaymentCount,
    ] = await this.prisma.$transaction([
      this.prisma.invoice.aggregate({
        _count: {
          _all: true,
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.invoice.count({
        where: {
          status: InvoiceStatus.PAID,
        },
      }),
      this.prisma.invoice.count({
        where: {
          status: InvoiceStatus.UNPAID,
        },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: InvoiceStatus.PAID,
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: InvoiceStatus.UNPAID,
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.quote.count({
        where: {
          status: QuoteStatus.SENT,
        },
      }),
      this.prisma.quote.count({
        where: {
          status: QuoteStatus.ACCEPTED,
        },
      }),
      this.prisma.booking.count({
        where: {
          status: BookingStatus.AWAITING_PAYMENT,
        },
      }),
    ]);

    return {
      invoicesCount: invoiceTotals._count._all,
      paidInvoicesCount,
      unpaidInvoicesCount,
      totalInvoicedAmount: invoiceTotals._sum.amount ?? 0,
      totalPaidAmount: paidInvoiceTotals._sum.amount ?? 0,
      totalOutstandingAmount: outstandingInvoiceTotals._sum.amount ?? 0,
      quotesSentCount,
      quotesAcceptedCount,
      bookingsAwaitingPaymentCount,
    };
  }

  async getInvoices(): Promise<AdminFinanceInvoiceRow[]> {
    const invoices = await this.prisma.invoice.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        amount: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            scheduledAt: true,
            reliefMission: {
              select: {
                title: true,
              },
            },
            service: {
              select: {
                title: true,
                owner: {
                  select: {
                    email: true,
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
            establishment: {
              select: {
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            freelance: {
              select: {
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      amount: invoice.amount,
      createdAt: invoice.createdAt.toISOString(),
      bookingId: invoice.booking.id,
      bookingType: getBookingType(invoice.booking),
      bookingTitle: getBookingTitle(invoice.booking),
      scheduledAt: invoice.booking.scheduledAt.toISOString(),
      establishmentName: getDisplayName(invoice.booking.establishment),
      providerName: getProviderName(invoice.booking),
    }));
  }

  async getQuotes(): Promise<AdminFinanceQuoteRow[]> {
    const quotes = await this.prisma.quote.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        status: true,
        totalTTC: true,
        createdAt: true,
        validUntil: true,
        acceptedAt: true,
        rejectedAt: true,
        issuer: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        booking: {
          select: {
            id: true,
            reliefMission: {
              select: {
                title: true,
              },
            },
            service: {
              select: {
                title: true,
              },
            },
            establishment: {
              select: {
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return quotes.map((quote) => ({
      id: quote.id,
      status: quote.status,
      totalTTC: quote.totalTTC,
      createdAt: quote.createdAt.toISOString(),
      validUntil: quote.validUntil?.toISOString() ?? null,
      acceptedAt: quote.acceptedAt?.toISOString() ?? null,
      rejectedAt: quote.rejectedAt?.toISOString() ?? null,
      bookingId: quote.booking.id,
      bookingType: getBookingType(quote.booking),
      bookingTitle: getBookingTitle(quote.booking),
      issuerName: getDisplayName(quote.issuer),
      requesterName: getDisplayName(quote.booking.establishment),
    }));
  }

  async getBookingsAwaitingPayment(): Promise<AdminAwaitingPaymentBookingRow[]> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.AWAITING_PAYMENT,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        scheduledAt: true,
        reliefMission: {
          select: {
            title: true,
          },
        },
        service: {
          select: {
            title: true,
            price: true,
            owner: {
              select: {
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        establishment: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        freelance: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
          },
        },
        quotes: {
          where: {
            status: QuoteStatus.ACCEPTED,
          },
          orderBy: {
            acceptedAt: "desc",
          },
          take: 1,
          select: {
            totalTTC: true,
          },
        },
      },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      amount: booking.invoice?.amount ?? booking.quotes[0]?.totalTTC ?? booking.service?.price ?? null,
      createdAt: booking.createdAt.toISOString(),
      scheduledAt: booking.scheduledAt.toISOString(),
      bookingType: getBookingType(booking),
      bookingTitle: getBookingTitle(booking),
      establishmentName: getDisplayName(booking.establishment),
      providerName: getProviderName(booking),
      invoiceId: booking.invoice?.id ?? null,
      invoiceNumber: booking.invoice?.invoiceNumber ?? null,
    }));
  }
}

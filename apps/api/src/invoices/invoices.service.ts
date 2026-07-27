import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { UserRole } from '@prisma/client';

@Injectable()
export class InvoicesService {
    constructor(private prisma: PrismaService) { }

    async findAll(user: AuthenticatedUser) {
        const whereClause = user.role === UserRole.ESTABLISHMENT
            ? { booking: { establishmentId: user.id } }
            : { booking: { freelanceId: user.id } }; // Or service owner

        // For freelance, they might be the freelance OR the service owner.
        // Simplified for now: Freelance = Recipient of payment (Provider), Establishment = Payer.
        // Actually, Invoice is generated for the Establishment to pay? Or for the Freelance to receive?
        // Usually Invoice is from Provider to Establishment.
        // So Freelance "owns" the invoice (issuer), Establishment "receives" it.
        // Queries should reflect this.

        return this.prisma.invoice.findMany({
            where: {
                booking: {
                    OR: [
                        { establishmentId: user.id }, // As establishment
                        { freelanceId: user.id }, // As freelance
                        { service: { ownerId: user.id } } // As service owner
                    ]
                }
            },
            include: {
                booking: {
                    select: {
                        id: true,
                        scheduledAt: true,
                        status: true,
                        reliefMission: {
                            select: { title: true, establishment: { select: { email: true, profile: { select: { lastName: true, firstName: true } } } } }
                        },
                        service: {
                            select: { title: true, owner: { select: { email: true, profile: { select: { lastName: true, firstName: true } } } } }
                        },
                        establishment: {
                            select: { email: true, profile: { select: { lastName: true, firstName: true } } }
                        },
                        freelance: {
                            select: { email: true, profile: { select: { lastName: true, firstName: true } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async generateInvoicePdf(invoiceId: string, user: AuthenticatedUser): Promise<Buffer> {
        const invoice = await this.prisma.invoice.findFirst({
            where: {
                OR: [
                    { id: invoiceId },
                    { bookingId: invoiceId }
                ]
            },
            include: {
                booking: {
                    include: {
                        reliefMission: { include: { establishment: true } },
                        service: { include: { owner: true } },
                        freelance: true,
                        establishment: true,
                    },
                },
            },
        });

        if (!invoice) throw new NotFoundException('Invoice not found');

        const { booking } = invoice;
        const isOwner =
            booking.establishmentId === user.id ||
            booking.freelanceId === user.id ||
            booking.service?.ownerId === user.id;

        if (!isOwner) {
            throw new ForbiddenException('Access denied');
        }

        return this.createPdf(invoice);
    }

    private createPdf(invoice: any): Promise<Buffer> {
        return new Promise((resolve) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header
            doc.fontSize(20).text('FACTURE', { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).text(`Référence: ${invoice.invoiceNumber || invoice.id.substring(0, 8).toUpperCase()}`);
            doc.text(`Date: ${invoice.createdAt.toLocaleDateString('fr-FR')}`);
            doc.text(`Statut: ${invoice.status === 'PAID' ? 'PAYÉE' : 'EN ATTENTE'}`);
            doc.moveDown();

            // Client / Provider
            const client = invoice.booking.establishment;
            const provider = invoice.booking.reliefMission
                ? invoice.booking.freelance
                : (invoice.booking.service?.owner ?? invoice.booking.freelance);

            doc.text(`Client: ${client?.email ?? 'N/A'}`);
            doc.text(`Prestataire: ${provider?.email ?? 'N/A'}`);
            doc.moveDown();

            // Details
            doc.text(`Description: ${invoice.booking.reliefMission?.title ?? invoice.booking.service?.title ?? 'Prestation'}`);
            doc.text(`Montant: ${invoice.amount.toFixed(2)} €`, { align: 'right' });

            doc.end();
        });
    }
}

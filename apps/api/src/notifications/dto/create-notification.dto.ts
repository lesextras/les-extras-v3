export class CreateNotificationDto {
    userId!: string;
    message!: string;
    type!: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

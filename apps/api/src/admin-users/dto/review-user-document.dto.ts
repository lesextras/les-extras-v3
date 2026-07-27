import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { DOCUMENT_REVIEW_STATUSES, type DocumentReviewStatusValue } from "../../users/kyc-documents";

export class ReviewUserDocumentDto {
  @IsIn(DOCUMENT_REVIEW_STATUSES)
  status!: DocumentReviewStatusValue;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reviewReason?: string;
}

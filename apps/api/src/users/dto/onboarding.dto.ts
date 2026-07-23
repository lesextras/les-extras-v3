import { IsInt, Max, Min } from 'class-validator';

export class OnboardingStepDto {
  @IsInt()
  @Min(0)
  @Max(10)
  step!: number;
}

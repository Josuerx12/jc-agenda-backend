import { IsInt, Max, Min } from 'class-validator';

export class SetAppointmentProductDto {
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}

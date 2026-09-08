import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class AddAppointmentServicesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  serviceIds: string[];
}

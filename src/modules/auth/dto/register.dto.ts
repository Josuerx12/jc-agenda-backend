import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { CreateCompanyDto } from 'src/modules/company/dto/create-company.dto';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';

export class RegisterDto {
  @ApiProperty({
    type: CreateUserDto,
    description: 'Informações do usuário a ser registrado',
  })
  @IsNotEmpty({
    message: 'As informações do usuário devem ser informadas',
  })
  @ValidateNested({
    message: 'As informações do usuário devem ser válidas',
  })
  @Type(() => CreateUserDto)
  user: CreateUserDto;

  @ApiProperty({
    type: CreateCompanyDto,
    description: 'Informações da empresa a ser registrada',
  })
  @IsNotEmpty({
    message: 'As informações da empresa devem ser informadas',
  })
  @ValidateNested({
    message: 'As informações da empresa devem ser válidas',
  })
  @Type(() => CreateCompanyDto)
  company: CreateCompanyDto;
}

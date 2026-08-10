import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { CompanyUserServices } from './company-user.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import {
  ApiCompanyIdHeader,
  CompanyId,
} from 'src/infra/decorators/company.decorator';
import {
  Paginate,
  PaginatedSwaggerDocs,
  type PaginateQuery,
} from 'nestjs-paginate';
import { CompanyUser } from 'src/infra/entities/company-user.entity';
import { companyUserPaginationConfig } from './pagination/company-user-pagination.config';
import { UserId } from 'src/infra/decorators/user.decorator';

@Controller('company-user')
@ApiCompanyIdHeader()
export class CompanyUserController {
  constructor(private readonly companyUserService: CompanyUserServices) {}

  @Post()
  create(
    @Body() createCompanyUserDto: CreateCompanyUserDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.companyUserService.create(
      {
        ...createCompanyUserDto,
        companyId,
      },
      userId,
    );
  }

  @Get()
  @PaginatedSwaggerDocs(CompanyUser, companyUserPaginationConfig)
  findAll(@Paginate() query: PaginateQuery, @CompanyId() companyId: string) {
    return this.companyUserService.findAll(query, companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.companyUserService.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCompanyUserDto: UpdateCompanyUserDto,
    @UserId() userId: string,
    @CompanyId() companyId: string,
  ) {
    return this.companyUserService.update(id, userId, {
      ...updateCompanyUserDto,
      companyId,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.companyUserService.remove(id, companyId, userId);
  }
}

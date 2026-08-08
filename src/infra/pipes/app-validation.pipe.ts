import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export type ValidationErrors = Record<string, string[]>;

function flattenValidationErrors(
  validationErrors: ValidationError[],
  parentPath = '',
): ValidationErrors {
  return validationErrors.reduce<ValidationErrors>(
    (errors, validationError) => {
      const field = parentPath
        ? `${parentPath}.${validationError.property}`
        : validationError.property;

      if (validationError.constraints) {
        errors[field] = Object.values(validationError.constraints);
      }

      if (validationError.children?.length) {
        Object.assign(
          errors,
          flattenValidationErrors(validationError.children, field),
        );
      }

      return errors;
    },
    {},
  );
}

export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      exceptionFactory: (validationErrors: ValidationError[]) =>
        new BadRequestException({
          statusCode: 400,
          error: 'Validation Error',
          message: 'Um ou mais campos são inválidos',
          errors: flattenValidationErrors(validationErrors),
        }),
    });
  }
}

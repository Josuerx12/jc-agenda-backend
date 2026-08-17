import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('repassa o x-company-id ao solicitar a recuperação de senha', async () => {
    const authService = { forgotPassword: jest.fn() };
    const controller = new AuthController(authService as never);

    await controller.forgotPassword('11111111-1111-4111-8111-111111111111', {
      email: 'usuario@empresa.com.br',
    });

    expect(authService.forgotPassword).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'usuario@empresa.com.br',
    );
  });
});

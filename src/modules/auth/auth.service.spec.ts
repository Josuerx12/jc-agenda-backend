import { AuthService } from './auth.service';

describe('AuthService forgotPassword', () => {
  const originalResetUrlPattern = process.env.PASSWORD_RESET_URL_PATTERN;
  const companyUserRepository = {
    findOne: jest.fn(),
  };
  const userRepository = {};
  const tokenRepository = {
    exists: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn().mockReturnValue(tokenRepository),
  };
  const dataSource = {
    getRepository: jest.fn().mockReturnValue(tokenRepository),
    transaction: jest.fn((callback: (manager: unknown) => unknown) =>
      callback(manager),
    ),
  };
  const emailService = {
    platformUrl: jest.fn(),
    enqueue: jest.fn(),
  };
  const service = new AuthService(
    dataSource as never,
    companyUserRepository as never,
    userRepository as never,
    {} as never,
    emailService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource.getRepository.mockReturnValue(tokenRepository);
    dataSource.transaction.mockImplementation(
      (callback: (manager: unknown) => unknown) => callback(manager),
    );
    manager.getRepository.mockReturnValue(tokenRepository);
    jest
      .spyOn(
        service as unknown as {
          ensureMinimumDuration(startedAt: number): Promise<void>;
        },
        'ensureMinimumDuration',
      )
      .mockResolvedValue(undefined);
    delete process.env.PASSWORD_RESET_URL_PATTERN;
  });

  afterAll(() => {
    if (originalResetUrlPattern === undefined) {
      delete process.env.PASSWORD_RESET_URL_PATTERN;
    } else {
      process.env.PASSWORD_RESET_URL_PATTERN = originalResetUrlPattern;
    }
  });

  it('busca o usuário pelo e-mail dentro da empresa informada', async () => {
    companyUserRepository.findOne.mockResolvedValue(null);

    await service.forgotPassword(
      '11111111-1111-4111-8111-111111111111',
      ' Usuario@Empresa.com.br ',
    );

    expect(companyUserRepository.findOne).toHaveBeenCalledWith({
      where: {
        companyId: '11111111-1111-4111-8111-111111111111',
        user: { email: 'usuario@empresa.com.br' },
      },
      relations: { user: true, company: true },
    });
  });

  it('não cria token nem envia e-mail sem vínculo com a empresa', async () => {
    companyUserRepository.findOne.mockResolvedValue(null);

    await service.forgotPassword(
      '11111111-1111-4111-8111-111111111111',
      'usuario@outra-empresa.com.br',
    );

    expect(dataSource.getRepository).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(emailService.enqueue).not.toHaveBeenCalled();
  });

  it('gera o reset usando a URL da empresa vinculada', async () => {
    companyUserRepository.findOne.mockResolvedValue({
      user: {
        id: 'user-id',
        email: 'usuario@empresa.com.br',
        firstName: 'Usuário',
      },
      company: { slug: 'minha-empresa' },
    });
    tokenRepository.exists.mockResolvedValue(false);
    tokenRepository.update.mockResolvedValue({ affected: 1 });
    tokenRepository.save.mockResolvedValue({});
    emailService.platformUrl.mockReturnValue(
      'https://minha-empresa.jcagenda.com.br',
    );

    await service.forgotPassword(
      '11111111-1111-4111-8111-111111111111',
      'usuario@empresa.com.br',
    );

    expect(emailService.platformUrl).toHaveBeenCalledWith('minha-empresa');
    expect(emailService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'usuario@empresa.com.br',
        context: expect.objectContaining({
          resetUrl: expect.stringMatching(
            /^https:\/\/minha-empresa\.jcagenda\.com\.br\/reset-password\?token=[a-f0-9]{64}$/,
          ),
        }),
      }),
      manager,
    );
  });

  it('substitui o slug e o token no padrão configurado', async () => {
    process.env.PASSWORD_RESET_URL_PATTERN =
      'http://{slug}.localhost:9000/reset-password?token={token}';
    companyUserRepository.findOne.mockResolvedValue({
      user: {
        id: 'user-id',
        email: 'usuario@empresa.com.br',
        firstName: 'Usuário',
      },
      company: { slug: 'minha-empresa' },
    });
    tokenRepository.exists.mockResolvedValue(false);
    tokenRepository.update.mockResolvedValue({ affected: 1 });
    tokenRepository.save.mockResolvedValue({});
    emailService.platformUrl.mockReturnValue(
      'http://minha-empresa.localhost:9000',
    );

    await service.forgotPassword(
      '11111111-1111-4111-8111-111111111111',
      'usuario@empresa.com.br',
    );

    expect(emailService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          resetUrl: expect.stringMatching(
            /^http:\/\/minha-empresa\.localhost:9000\/reset-password\?token=[a-f0-9]{64}$/,
          ),
        }),
      }),
      manager,
    );
  });
});
